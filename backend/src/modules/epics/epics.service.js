const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");

const verifyProjectOwnership = async (projectId, userId) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) {
    throw new AppError("Project not found", 404);
  }
  return project;
};

const create = async (userId, data) => {
  await verifyProjectOwnership(data.projectId, userId);
  return prisma.epic.create({ data });
};

const listByProject = async (projectId, userId) => {
  await verifyProjectOwnership(projectId, userId);
  return prisma.epic.findMany({
    where: { projectId },
    orderBy: { position: "asc" },
    include: { stories: { orderBy: { position: "asc" } } },
  });
};

const getById = async (id, userId) => {
  const epic = await prisma.epic.findUnique({
    where: { id },
    include: {
      project: true,
      stories: {
        orderBy: { position: "asc" },
        include: { tasks: { orderBy: { position: "asc" } } },
      },
    },
  });

  if (!epic || epic.project.ownerId !== userId) {
    throw new AppError("Epic not found", 404);
  }

  return epic;
};

const update = async (id, userId, data) => {
  const epic = await prisma.epic.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!epic || epic.project.ownerId !== userId) {
    throw new AppError("Epic not found", 404);
  }

  return prisma.epic.update({ where: { id }, data });
};

const remove = async (id, userId) => {
  const epic = await prisma.epic.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!epic || epic.project.ownerId !== userId) {
    throw new AppError("Epic not found", 404);
  }

  return prisma.epic.delete({ where: { id } });
};

module.exports = { create, listByProject, getById, update, remove };
