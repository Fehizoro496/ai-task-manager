const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");

const verifyStoryOwnership = async (storyId, userId) => {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { epic: { include: { project: true } } },
  });
  if (!story || story.epic.project.ownerId !== userId) {
    throw new AppError("Story not found", 404);
  }
  return story;
};

const create = async (userId, data) => {
  await verifyStoryOwnership(data.storyId, userId);
  return prisma.task.create({ data });
};

const listByStory = async (storyId, userId) => {
  await verifyStoryOwnership(storyId, userId);
  return prisma.task.findMany({
    where: { storyId },
    orderBy: { position: "asc" },
  });
};

const getById = async (id, userId) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { story: { include: { epic: { include: { project: true } } } } },
  });

  if (!task || task.story.epic.project.ownerId !== userId) {
    throw new AppError("Task not found", 404);
  }

  return task;
};

const update = async (id, userId, data) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { story: { include: { epic: { include: { project: true } } } } },
  });

  if (!task || task.story.epic.project.ownerId !== userId) {
    throw new AppError("Task not found", 404);
  }

  return prisma.task.update({ where: { id }, data });
};

const remove = async (id, userId) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { story: { include: { epic: { include: { project: true } } } } },
  });

  if (!task || task.story.epic.project.ownerId !== userId) {
    throw new AppError("Task not found", 404);
  }

  return prisma.task.delete({ where: { id } });
};

module.exports = { create, listByStory, getById, update, remove };
