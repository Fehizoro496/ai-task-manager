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
    console.log(`[socket] ✓ Connecté  — user=${userName} (${userId})  id=${socket.id}`);

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
