const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");
const { addUserToGeneral } = require("../chat/chat.service");

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
  return serializeUser(updated);
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
  return serializeUser(updated);
};

module.exports = { listUsers, approveUser, rejectUser };
