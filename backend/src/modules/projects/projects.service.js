const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");
const { createNotification } = require("../notifications/notifications.service");

const create = async (ownerId, data) => {
  const project = await prisma.project.create({
    data: { ...data, ownerId },
  });

  await prisma.projectMember.create({
    data: { projectId: project.id, userId: ownerId },
  });

  return project;
};

const listByUser = async (userId, isAdmin) => {
  if (isAdmin) {
    return prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  }
  return prisma.project.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
  });
};

const getById = async (id, userId, isAdmin) => {
  const where = isAdmin
    ? { id }
    : { id, members: { some: { userId } } };

  const project = await prisma.project.findFirst({
    where,
    include: {
      epics: {
        orderBy: { position: "asc" },
        include: {
          stories: {
            orderBy: { position: "asc" },
            include: {
              tasks: { orderBy: { position: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return project;
};

const update = async (id, userId, isAdmin, data) => {
  const project = await prisma.project.findFirst({ where: { id, ownerId: userId } });
  if (!project && !isAdmin) {
    throw new AppError("Project not found", 404);
  }
  if (!project) {
    const exists = await prisma.project.findUnique({ where: { id } });
    if (!exists) throw new AppError("Project not found", 404);
  }

  return prisma.project.update({ where: { id }, data });
};

const remove = async (id, userId, isAdmin) => {
  const project = await prisma.project.findFirst({ where: { id, ownerId: userId } });
  if (!project && !isAdmin) {
    throw new AppError("Project not found", 404);
  }
  if (!project) {
    const exists = await prisma.project.findUnique({ where: { id } });
    if (!exists) throw new AppError("Project not found", 404);
  }

  return prisma.project.delete({ where: { id } });
};

const addMember = async (projectId, userId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Project not found", 404);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (existing) throw new AppError("User is already a member", 409);

  const member = await prisma.projectMember.create({
    data: { projectId, userId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });

  createNotification({
    type: "TASK_ASSIGNED",
    title: "Ajouté à un projet",
    message: `Vous avez été ajouté en tant que participant au projet "${project.name}".`,
    userId,
    taskId: projectId,
    link: `/dashboard`,
  }).catch(() => {});

  return member;
};

const removeMember = async (projectId, userId) => {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError("Member not found", 404);

  return prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });
};

const listMembers = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Project not found", 404);

  return prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
};

const isMember = async (projectId, userId) => {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return member !== null;
};

module.exports = { create, listByUser, getById, update, remove, addMember, removeMember, listMembers, isMember };
