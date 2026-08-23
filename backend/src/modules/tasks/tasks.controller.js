const tasksService = require("./tasks.service");
const asyncHandler = require("../../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const task = await tasksService.create(req.user.id, isAdmin, req.body);
  res.status(201).json(tasksService.serializeTask(task));
});

const listByQuery = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const tasks = await tasksService.listByProject(req.query.projectId, req.user.id, isAdmin);
  res.json(tasks.map((t) => tasksService.serializeTask(t, req.query.projectId)));
});

/** Découpe un paramètre de requête répété ou en CSV (`?priority=high,urgent`). */
const parseCsv = (value) =>
  (Array.isArray(value) ? value : String(value ?? "").split(","))
    .map((v) => String(v).trim())
    .filter(Boolean);

const listMine = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const result = await tasksService.listForUser(req.user.id, isAdmin, {
    scope: req.query.scope,
    q: req.query.q,
    priorities: parseCsv(req.query.priority),
    projectIds: parseCsv(req.query.projectId),
    sort: req.query.sort,
    limit: req.query.limit,
    offset: req.query.offset,
  });

  res.json({
    tasks: result.tasks.map((t) => tasksService.serializeTask(t)),
    total: result.total,
    limit: result.limit,
    offset: result.offset,
    hasMore: result.hasMore,
  });
});

const search = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const limit = Math.min(Number(req.query.limit) || 8, 20);
  const tasks = await tasksService.searchVisible(req.user.id, isAdmin, req.query.q, limit);
  res.json({ tasks: tasks.map((t) => tasksService.serializeTask(t)) });
});

const getById = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const task = await tasksService.getById(req.params.id, req.user.id, isAdmin);
  const projectId = task.project?.id || null;
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

const assign = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const task = await tasksService.assignSelf(req.params.id, req.user.id, isAdmin);
  res.json(tasksService.serializeTask(task));
});

const reorderForProject = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const result = await tasksService.reorderForProject(
    req.params.projectId,
    req.user.id,
    isAdmin,
    req.body?.columns ?? {},
  );
  res.json(result);
});

module.exports = { create, listByQuery, listMine, search, getById, update, remove, move, listByProject, createForProject, assign, reorderForProject };
