const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");

const create = async (ownerId, data) => {
  return prisma.project.create({
    data: { ...data, ownerId },
  });
};

const listByUser = async (ownerId) => {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
};

const getById = async (id, ownerId) => {
  const project = await prisma.project.findFirst({
    where: { id, ownerId },
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

const update = async (id, ownerId, data) => {
  const project = await prisma.project.findFirst({ where: { id, ownerId } });
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return prisma.project.update({ where: { id }, data });
};

const remove = async (id, ownerId) => {
  const project = await prisma.project.findFirst({ where: { id, ownerId } });
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return prisma.project.delete({ where: { id } });
};

module.exports = { create, listByUser, getById, update, remove };
