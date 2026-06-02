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

  io.on('connection', (socket) => {
    const userId = socket.user?.id ?? '?';
    const userName = socket.user?.name ?? socket.user?.email ?? '?';
    const userRole = socket.user?.role ?? null;
    console.log(`[socket] ✓ Connecté  — user=${userName} (${userId})  role=${userRole}  id=${socket.id}`);

    // Room personnelle pour notifier ce user (chat, notifs, status change…)
    // Joinée de manière synchrone : c'est sur cette room qu'on émet les
    // events temps réel pour éviter toute race avec un `await` en amont.
    socket.join(`user:${userId}`);
    // Room admins pour les events globaux (nouvelles demandes, count change…)
    if (userRole === 'ADMIN') {
      socket.join('admins');
      console.log(`[socket]   join  admins  ← ${userName}`);
    }

    // Rooms projet pour le live update du board (TaskCard temps réel)
    socket.on('join_project', async (projectId) => {
      if (!projectId || typeof projectId !== 'string') return;
      try {
        if (userRole === 'ADMIN') {
          socket.join(`project:${projectId}`);
          console.log(`[socket]   join  project:${projectId}  ← ${userName} (admin)`);
          return;
        }
        const prisma = require('./prisma/client');
        const member = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId } },
        });
        const owned = member
          ? true
          : (await prisma.project.findFirst({ where: { id: projectId, ownerId: userId }, select: { id: true } })) !== null;
        if (member || owned) {
          socket.join(`project:${projectId}`);
          console.log(`[socket]   join  project:${projectId}  ← ${userName}`);
        } else {
          console.log(`[socket]   ✗ refus join project:${projectId}  ← ${userName} (non membre)`);
        }
      } catch (err) {
        console.error(`[socket] ✗ join_project échec  err=${err.message}`);
      }
    });

    socket.on('leave_project', (projectId) => {
      if (!projectId || typeof projectId !== 'string') return;
      socket.leave(`project:${projectId}`);
      console.log(`[socket]   leave project:${projectId}  ← ${userName}`);
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
