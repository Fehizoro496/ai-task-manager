const tasksService = require("./tasks.service");
const asyncHandler = require("../../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const task = await tasksService.create(req.user.id, isAdmin, req.body);
  res.status(201).json(tasksService.serializeTask(task));
});

const listByStory = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const tasks = await tasksService.listByStory(req.query.storyId, req.user.id, isAdmin);
  res.json(tasks.map((t) => tasksService.serializeTask(t)));
});

const getById = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const task = await tasksService.getById(req.params.id, req.user.id, isAdmin);
  const projectId = task.story?.epic?.project?.id || null;
  res.json(tasksService.serializeTask(task, projectId));
});

const update = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const task = await tasksService.update(req.params.id, req.user.id, isAdmin, req.body);
  res.json(tasksService.serializeTask(task));
});

const remove = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  await tasksService.remove(req.params.id, req.user.id, isAdmin);
  res.status(204).end();
});

const move = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const task = await tasksService.moveTask(req.params.id, req.user.id, isAdmin, req.body);
  res.json(tasksService.serializeTask(task));
});

const listByProject = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const tasks = await tasksService.listByProject(req.params.projectId, req.user.id, isAdmin);
  res.json({ tasks: tasks.map((t) => tasksService.serializeTask(t, req.params.projectId)) });
});

const createForProject = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const task = await tasksService.createForProject(req.user.id, isAdmin, req.params.projectId, req.body);
  res.status(201).json(tasksService.serializeTask(task, req.params.projectId));
});

module.exports = { create, listByStory, getById, update, remove, move, listByProject, createForProject };
