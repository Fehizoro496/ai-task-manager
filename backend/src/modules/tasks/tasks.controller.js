const tasksService = require("./tasks.service");
const asyncHandler = require("../../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const task = await tasksService.create(req.user.id, req.body);
  res.status(201).json(task);
});

const listByStory = asyncHandler(async (req, res) => {
  const tasks = await tasksService.listByStory(req.query.storyId, req.user.id);
  res.json(tasks);
});

const getById = asyncHandler(async (req, res) => {
  const task = await tasksService.getById(req.params.id, req.user.id);
  res.json(task);
});

const update = asyncHandler(async (req, res) => {
  const task = await tasksService.update(req.params.id, req.user.id, req.body);
  res.json(task);
});

const remove = asyncHandler(async (req, res) => {
  await tasksService.remove(req.params.id, req.user.id);
  res.status(204).end();
});

module.exports = { create, listByStory, getById, update, remove };
