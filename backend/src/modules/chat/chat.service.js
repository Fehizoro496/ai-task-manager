const prisma = require('../../prisma/client');
const AppError = require('../../utils/AppError');
const { getIo } = require('../../socket');

const memberSelect = { id: true, name: true, avatarUrl: true };

const serializeMessage = (msg) => ({
  id: msg.id,
  conversationId: msg.conversationId,
  content: msg.content,
  senderId: msg.senderId,
  senderName: msg.sender.name,
  senderAvatarUrl: msg.sender.avatarUrl ?? null,
  createdAt: msg.createdAt.toISOString(),
});

const serializeConversation = (conv, lastMessage) => ({
  id: conv.id,
  name: conv.name ?? null,
  isGroup: conv.isGroup,
  members: conv.members.map((m) => ({
    id: m.id,
    name: m.name,
    avatarUrl: m.avatarUrl ?? null,
  })),
  lastMessage: lastMessage
    ? {
        content: lastMessage.content,
        senderName: lastMessage.sender.name,
        createdAt: lastMessage.createdAt.toISOString(),
      }
    : null,
});

const getOrCreateGeneral = async () => {
  let general = await prisma.conversation.findFirst({
    where: { name: 'general', isGroup: true },
  });
  if (!general) {
    general = await prisma.conversation.create({
      data: { name: 'general', isGroup: true },
    });
  }
  return general;
};

const addUserToGeneral = async (userId) => {
  const general = await getOrCreateGeneral();
  await prisma.conversation.update({
    where: { id: general.id },
    data: { members: { connect: { id: userId } } },
  });
};

const getConversations = async (userId) => {
  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { id: userId } } },
    include: {
      members: { select: memberSelect },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: memberSelect } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return conversations.map((conv) => {
    const lastMessage = conv.messages[0] ?? null;
    return serializeConversation(conv, lastMessage);
  });
};

const getOrCreateDM = async (userId, otherId) => {
  // Cherche une conv isGroup=false avec exactement ces 2 membres
  const existing = await prisma.$queryRaw`
    SELECT c.id FROM "Conversation" c
    INNER JOIN "_ConversationMembers" cm1 ON cm1."A" = c.id AND cm1."B" = ${userId}
    INNER JOIN "_ConversationMembers" cm2 ON cm2."A" = c.id AND cm2."B" = ${otherId}
    WHERE c."isGroup" = false
    LIMIT 1
  `;

  if (existing && existing.length > 0) {
    const conv = await prisma.conversation.findUnique({
      where: { id: existing[0].id },
      include: {
        members: { select: memberSelect },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: memberSelect } },
        },
      },
    });
    return serializeConversation(conv, conv.messages[0] ?? null);
  }

  const conv = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: { connect: [{ id: userId }, { id: otherId }] },
    },
    include: {
      members: { select: memberSelect },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: memberSelect } },
      },
    },
  });
  return serializeConversation(conv, null);
};

const getMessages = async (convId, userId) => {
  const conv = await prisma.conversation.findUnique({
    where: { id: convId },
    include: { members: { select: { id: true } } },
  });
  if (!conv) throw new AppError('Conversation not found', 404);
  const isMember = conv.members.some((m) => m.id === userId);
  if (!isMember) throw new AppError('Forbidden', 403);

  const messages = await prisma.message.findMany({
    where: { conversationId: convId },
    include: { sender: { select: memberSelect } },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  return messages.map(serializeMessage);
};

const sendMessage = async (convId, senderId, content) => {
  const conv = await prisma.conversation.findUnique({
    where: { id: convId },
    include: { members: { select: { id: true } } },
  });
  if (!conv) throw new AppError('Conversation not found', 404);
  const isMember = conv.members.some((m) => m.id === senderId);
  if (!isMember) throw new AppError('Forbidden', 403);

  const message = await prisma.message.create({
    data: { conversationId: convId, senderId, content },
    include: { sender: { select: memberSelect } },
  });

  // Mettre à jour updatedAt de la conversation
  await prisma.conversation.update({
    where: { id: convId },
    data: { updatedAt: new Date() },
  });

  const serialized = serializeMessage(message);

  const io = getIo();
  if (io) {
    const room = `conv:${convId}`;
    const roomSize = io.sockets.adapter.rooms.get(room)?.size ?? 0;
    io.to(room).emit('new_message', serialized);
    console.log(`[socket] → new_message  conv=${convId}  sender=${serialized.senderName}  room_size=${roomSize}`);
  } else {
    console.warn('[socket] ⚠ io non initialisé — message non émis');
  }

  return serialized;
};

module.exports = {
  getOrCreateGeneral,
  addUserToGeneral,
  getConversations,
  getOrCreateDM,
  getMessages,
  sendMessage,
};
