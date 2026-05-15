const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");
const { addUserToGeneral, createDmsForNewUser } = require("../chat/chat.service");
const { getIo } = require("../../socket");

const userSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  provider: true,
  role: true,
  status: true,
  createdAt: true,
};

const serializeUser = (user) => {
  const { avatarUrl, ...rest } = user;
  return { ...rest, avatar_url: avatarUrl ?? null };
};

const listUsers = async ({ status } = {}) => {
  const where = status ? { status } : {};
  const users = await prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: "desc" } });
  return users.map(serializeUser);
};

const approveUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", 404);

  const updated = await prisma.user.update({
    where: { id },
    data: { status: "APPROVED" },
    select: userSelect,
  });
  await addUserToGeneral(id);
  await createDmsForNewUser(id);

  const payload = serializeUser(updated);
  const io = getIo();
  if (io) {
    // Notifier le user concerné (il peut etre sur /pending avec un socket ouvert)
    io.to(`user:${id}`).emit("user:status_change", { user: payload });
    // Notifier les autres admins pour refresh leur compteur pending
    io.to("admins").emit("admin:pending_changed");
  }

  return payload;
};

const rejectUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", 404);
  if (user.role === "ADMIN") throw new AppError("Cannot reject an admin account", 403);

  const updated = await prisma.user.update({
    where: { id },
    data: { status: "REJECTED" },
    select: userSelect,
  });

  const payload = serializeUser(updated);
  const io = getIo();
  if (io) {
    io.to(`user:${id}`).emit("user:status_change", { user: payload });
    io.to("admins").emit("admin:pending_changed");
  }

  return payload;
};

module.exports = { listUsers, approveUser, rejectUser };
