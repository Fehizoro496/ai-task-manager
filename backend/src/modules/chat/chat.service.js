const fs = require('fs');
const path = require('path');
const { Prisma } = require('@prisma/client');
const prisma = require('../../prisma/client');
const AppError = require('../../utils/AppError');
const { getIo } = require('../../socket');
const { CHAT_DIR } = require('../../middleware/upload');
const {
  extractIdentifiers,
  resolveMentionsForMessages,
  pickMentionsFor,
} = require('./task-mentions');

const memberSelect = { id: true, name: true, avatarUrl: true };

const attachmentsOf = (msg) =>
  Array.isArray(msg.attachments) ? msg.attachments : [];

const serializeMessage = (msg, mentionedTasks = []) => {
  const deleted = Boolean(msg.deletedAt);
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    content: deleted ? '' : msg.content,
    attachments: deleted ? [] : attachmentsOf(msg),
    deletedAt: deleted ? msg.deletedAt.toISOString() : null,
    senderId: msg.senderId,
    senderName: msg.sender.name,
    sender_avatar_url: msg.sender.avatarUrl ?? null,
    mentionedTasks: deleted ? [] : mentionedTasks,
    createdAt: msg.createdAt.toISOString(),
  };
};

// Texte d'aperçu affiché dans la liste des conversations.
const messagePreview = (msg) => {
  if (msg.deletedAt) return 'Message supprimé';
  if (msg.content && msg.content.trim()) return msg.content;
  const atts = attachmentsOf(msg);
  if (atts.length > 1) return `${atts.length} pièces jointes`;
  if (atts.length === 1) return atts[0]?.name || 'Pièce jointe';
  return '';
};

const serializeConversation = (conv, lastMessage, unreadCount = 0) => ({
  id: conv.id,
  name: conv.name ?? null,
  isGroup: conv.isGroup,
  members: conv.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    avatar_url: m.user.avatarUrl ?? null,
  })),
  unreadCount,
  lastMessage: lastMessage
    ? {
        content: messagePreview(lastMessage),
        senderId: lastMessage.senderId,
        senderName: lastMessage.sender.name,
        createdAt: lastMessage.createdAt.toISOString(),
      }
    : null,
});

const conversationInclude = {
  members: { include: { user: { select: memberSelect } } },
  messages: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: { sender: { select: memberSelect } },
  },
};

const countUnread = async (conversationId, userId, lastReadAt) => {
  return prisma.message.count({
    where: {
      conversationId,
      senderId: { not: userId },
      ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
    },
  });
};

const getOrCreateGeneral = async () => {
  let general = await prisma.conversation.findFirst({
    where: { name: 'general', isGroup: true },
  });
  if (!general) {
    const approved = await prisma.user.findMany({
      where: { status: 'APPROVED' },
      select: { id: true },
    });
    general = await prisma.conversation.create({
      data: {
        name: 'general',
        isGroup: true,
        members: { create: approved.map((u) => ({ userId: u.id })) },
      },
    });
  }
  return general;
};

const addUserToGeneral = async (userId) => {
  const general = await getOrCreateGeneral();
  await prisma.conversationMember.upsert({
    where: { conversationId_userId: { conversationId: general.id, userId } },
    update: {},
    create: { conversationId: general.id, userId },
  });
};

const getConversations = async (userId) => {
  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    include: conversationInclude,
    orderBy: { updatedAt: 'desc' },
  });

  return Promise.all(
    conversations.map(async (conv) => {
      const member = conv.members.find((m) => m.userId === userId);
      const lastMessage = conv.messages[0] ?? null;
      const unread = await countUnread(conv.id, userId, member?.lastReadAt ?? null);
      return serializeConversation(conv, lastMessage, unread);
    }),
  );
};

const getOrCreateDM = async (userId, otherId) => {
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: otherId } } },
      ],
    },
    include: conversationInclude,
  });

  if (existing) {
    const member = existing.members.find((m) => m.userId === userId);
    const unread = await countUnread(existing.id, userId, member?.lastReadAt ?? null);
    return serializeConversation(existing, existing.messages[0] ?? null, unread);
  }

  const conv = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: { create: [{ userId }, { userId: otherId }] },
    },
    include: conversationInclude,
  });
  return serializeConversation(conv, null, 0);
};

const getMessages = async (convId, userId, isAdmin = false) => {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: convId, userId } },
  });
  if (!member) throw new AppError('Forbidden', 403);

  const messages = await prisma.message.findMany({
    where: { conversationId: convId },
    include: { sender: { select: memberSelect } },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  // Les tâches mentionnées sont résolues pour le lecteur : celles hors de sa
  // portée restent du texte brut côté client.
  const resolved = await resolveMentionsForMessages(messages, userId, isAdmin);
  return messages.map((m) => serializeMessage(m, pickMentionsFor(m.content, resolved)));
};

/**
 * Crée automatiquement une DM entre `userId` et chaque autre utilisateur
 * déjà approuvé (skip s'il existe déjà une DM entre les deux).
 */
const createDmsForNewUser = async (userId) => {
  const others = await prisma.user.findMany({
    where: {
      status: 'APPROVED',
      NOT: { id: userId },
    },
    select: { id: true },
  });

  let created = 0;
  for (const other of others) {
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: other.id } } },
        ],
      },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.conversation.create({
      data: {
        isGroup: false,
        members: { create: [{ userId }, { userId: other.id }] },
      },
    });
    created++;
  }
  return created;
};

const sendMessage = async (convId, senderId, content, files = [], isAdmin = false) => {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: convId, userId: senderId } },
  });
  if (!member) throw new AppError('Forbidden', 403);

  const trimmed = (content ?? '').trim();
  const attachments = (files ?? []).map((f) => ({
    url: `/uploads/chat/${path.basename(f.path)}`,
    name: f.originalname,
    mime: f.mimetype,
    size: f.size,
  }));

  if (!trimmed && attachments.length === 0) {
    throw new AppError('Message vide', 400);
  }

  const message = await prisma.message.create({
    data: {
      conversationId: convId,
      senderId,
      content: trimmed,
      attachments: attachments.length ? attachments : undefined,
    },
    include: { sender: { select: memberSelect } },
  });

  await prisma.conversation.update({
    where: { id: convId },
    data: { updatedAt: new Date() },
  });

  // L'expéditeur considère son propre message comme lu.
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: convId, userId: senderId } },
    data: { lastReadAt: message.createdAt },
  });

  const hasMentions = extractIdentifiers(content).length > 0;
  const senderMentions = hasMentions
    ? pickMentionsFor(content, await resolveMentionsForMessages([message], senderId, isAdmin))
    : [];
  const serialized = serializeMessage(message, senderMentions);

  const io = getIo();
  if (io) {
    // Émission vers les rooms personnelles `user:<id>` (joinées de manière
    // synchrone à la connexion) plutôt que `conv:<id>` (joinée après un
    // `await` côté serveur). Évite la race où un message émis pendant la
    // fenêtre d'auto-join est perdu côté client.
    const members = await prisma.conversationMember.findMany({
      where: { conversationId: convId },
      select: { userId: true, user: { select: { role: true } } },
    });
    for (const m of members) {
      // Sans mention, la charge utile est identique pour tout le monde ; avec
      // mentions, chaque destinataire ne reçoit que les tâches qu'il peut voir.
      let payload = serialized;
      if (hasMentions && m.userId !== senderId) {
        const resolved = await resolveMentionsForMessages(
          [message],
          m.userId,
          m.user.role === 'ADMIN',
        );
        payload = serializeMessage(message, pickMentionsFor(content, resolved));
      }
      io.to(`user:${m.userId}`).emit('new_message', payload);
    }
    console.log(`[socket] → new_message  conv=${convId}  sender=${serialized.senderName}  recipients=${members.length}`);
  } else {
    console.warn('[socket] ⚠ io non initialisé — message non émis');
  }

  return serialized;
};

/**
 * Suppression douce (tombstone) d'un message : l'auteur ou un admin peut
 * supprimer. Le contenu et les pièces jointes sont effacés (fichiers retirés
 * du disque), la ligne est conservée avec `deletedAt`.
 */
const deleteMessage = async (messageId, userId, isAdmin = false) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { sender: { select: memberSelect } },
  });
  if (!message) throw new AppError('Message introuvable', 404);

  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId: message.conversationId, userId },
    },
  });
  if (!member) throw new AppError('Forbidden', 403);
  if (message.senderId !== userId && !isAdmin) throw new AppError('Forbidden', 403);

  if (message.deletedAt) return serializeMessage(message);

  // Retrait des fichiers du disque (best-effort).
  for (const a of attachmentsOf(message)) {
    if (typeof a?.url === 'string' && a.url.startsWith('/uploads/chat/')) {
      fs.unlink(path.join(CHAT_DIR, path.basename(a.url)), () => {});
    }
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), content: '', attachments: Prisma.DbNull },
    include: { sender: { select: memberSelect } },
  });
  const serialized = serializeMessage(updated);

  const io = getIo();
  if (io) {
    const members = await prisma.conversationMember.findMany({
      where: { conversationId: message.conversationId },
      select: { userId: true },
    });
    for (const m of members) {
      io.to(`user:${m.userId}`).emit('message:deleted', serialized);
    }
    console.log(`[socket] → message:deleted  msg=${messageId}  by=${userId}`);
  }

  return serialized;
};

const markConversationRead = async (convId, userId) => {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: convId, userId } },
  });
  if (!member) throw new AppError('Forbidden', 403);

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: convId, userId } },
    data: { lastReadAt: new Date() },
  });

  const io = getIo();
  if (io) {
    io.to(`user:${userId}`).emit('conversation:read', { conversationId: convId });
  }

  return { conversationId: convId };
};

module.exports = {
  getOrCreateGeneral,
  addUserToGeneral,
  createDmsForNewUser,
  getConversations,
  getOrCreateDM,
  getMessages,
  sendMessage,
  deleteMessage,
  markConversationRead,
};
