const epicsService = require("./epics.service");
const asyncHandler = require("../../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const epic = await epicsService.create(req.user.id, req.body);
  res.status(201).json(epic);
});

const listByProject = asyncHandler(async (req, res) => {
  const epics = await epicsService.listByProject(req.query.projectId, req.user.id);
  res.json(epics);
});

const getById = asyncHandler(async (req, res) => {
  const epic = await epicsService.getById(req.params.id, req.user.id);
  res.json(epic);
});

const update = asyncHandler(async (req, res) => {
  const epic = await epicsService.update(req.params.id, req.user.id, req.body);
  res.json(epic);
});

const remove = asyncHandler(async (req, res) => {
  await epicsService.remove(req.params.id, req.user.id);
  res.status(204).end();
});

module.exports = { create, listByProject, getById, update, remove };
