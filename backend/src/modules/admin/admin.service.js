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

const listUsers = async ({ status } = {}) => {
  const where = status ? { status } : {};
  return prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: "desc" } });
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
  return updated;
};

const rejectUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", 404);
  if (user.role === "ADMIN") throw new AppError("Cannot reject an admin account", 403);

  return prisma.user.update({
    where: { id },
    data: { status: "REJECTED" },
    select: userSelect,
  });
};

module.exports = { listUsers, approveUser, rejectUser };
