const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const init = (httpServer) => {
  io = new Server(httpServer, { cors: { origin: '*' } });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.log('[socket] ✗ Connexion refusée — token manquant');
      return next(new Error('Unauthorized'));
    }
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      console.log('[socket] ✗ Connexion refusée — token invalide');
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user?.id ?? '?';
    const userName = socket.user?.name ?? socket.user?.email ?? '?';
    const userRole = socket.user?.role ?? null;
    console.log(`[socket] ✓ Connecté  — user=${userName} (${userId})  role=${userRole}  id=${socket.id}`);

    // Room personnelle pour notifier ce user (status change, etc.)
    socket.join(`user:${userId}`);
    // Room admins pour les events globaux (nouvelles demandes, count change…)
    if (userRole === 'ADMIN') {
      socket.join('admins');
      console.log(`[socket]   join  admins  ← ${userName}`);
    }

    // Auto-rejoindre toutes les conversations de l'utilisateur
    try {
      const prisma = require('./prisma/client');
      const convs = await prisma.conversation.findMany({
        where: { members: { some: { id: userId } } },
        select: { id: true },
      });
      for (const conv of convs) {
        socket.join(`conv:${conv.id}`);
      }
      console.log(`[socket]   auto-join  ${convs.length} conversations  ← ${userName}`);
    } catch (err) {
      console.error(`[socket] ✗ auto-join échoué  err=${err.message}`);
    }

    socket.on('join_conversation', (convId) => {
      socket.join(`conv:${convId}`);
      console.log(`[socket]   join  conv:${convId}  ← ${userName}`);
    });

    socket.on('leave_conversation', (convId) => {
      socket.leave(`conv:${convId}`);
      console.log(`[socket]   leave conv:${convId}  ← ${userName}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket] ✗ Déconnecté — user=${userName} (${userId})  raison=${reason}`);
    });

    socket.on('error', (err) => {
      console.error(`[socket] ✗ Erreur — user=${userName}  err=${err.message}`);
    });
  });

  return io;
};

const getIo = () => io;

module.exports = { init, getIo };
