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

const listByProject = async (projectId, userId) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return prisma.task.findMany({
    where: {
      story: { epic: { projectId } },
    },
    orderBy: { position: "asc" },
  });
};

const createForProject = async (userId, projectId, data) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // If storyId is provided, verify it belongs to this project
  if (data.storyId || data.story_id) {
    const storyId = data.storyId || data.story_id;
    const story = await prisma.story.findFirst({
      where: { id: storyId, epic: { projectId } },
    });
    if (!story) {
      throw new AppError("Story not found in this project", 404);
    }
    return prisma.task.create({
      data: { title: data.title, description: data.description, storyId },
    });
  }

  // No storyId: assign to the first story of the first epic, or create a default epic/story
  let story = await prisma.story.findFirst({
    where: { epic: { projectId } },
    orderBy: { position: "asc" },
  });

  if (!story) {
    const epic = await prisma.epic.create({
      data: { title: "Backlog", projectId, position: 0 },
    });
    story = await prisma.story.create({
      data: { title: "Default", epicId: epic.id, position: 0 },
    });
  }

  return prisma.task.create({
    data: { title: data.title, description: data.description, storyId: story.id },
  });
};

module.exports = { create, listByStory, getById, update, remove, listByProject, createForProject };
