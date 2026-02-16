const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");

const verifyEpicOwnership = async (epicId, userId) => {
  const epic = await prisma.epic.findUnique({
    where: { id: epicId },
    include: { project: true },
  });
  if (!epic || epic.project.ownerId !== userId) {
    throw new AppError("Epic not found", 404);
  }
  return epic;
};

const create = async (userId, data) => {
  await verifyEpicOwnership(data.epicId, userId);
  return prisma.story.create({ data });
};

const listByEpic = async (epicId, userId) => {
  await verifyEpicOwnership(epicId, userId);
  return prisma.story.findMany({
    where: { epicId },
    orderBy: { position: "asc" },
    include: { tasks: { orderBy: { position: "asc" } } },
  });
};

const getById = async (id, userId) => {
  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      epic: { include: { project: true } },
      tasks: { orderBy: { position: "asc" } },
    },
  });

  if (!story || story.epic.project.ownerId !== userId) {
    throw new AppError("Story not found", 404);
  }

  return story;
};

const update = async (id, userId, data) => {
  const story = await prisma.story.findUnique({
    where: { id },
    include: { epic: { include: { project: true } } },
  });

  if (!story || story.epic.project.ownerId !== userId) {
    throw new AppError("Story not found", 404);
  }

  return prisma.story.update({ where: { id }, data });
};

const remove = async (id, userId) => {
  const story = await prisma.story.findUnique({
    where: { id },
    include: { epic: { include: { project: true } } },
  });

  if (!story || story.epic.project.ownerId !== userId) {
    throw new AppError("Story not found", 404);
  }

  return prisma.story.delete({ where: { id } });
};

module.exports = { create, listByEpic, getById, update, remove };
