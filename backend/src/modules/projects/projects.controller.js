const projectsService = require("./projects.service");
const asyncHandler = require("../../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const project = await projectsService.create(req.user.id, req.body);
  res.status(201).json(project);
});

const list = asyncHandler(async (req, res) => {
  const projects = await projectsService.listByUser(req.user.id);
  res.json(projects);
});

const getById = asyncHandler(async (req, res) => {
  const project = await projectsService.getById(req.params.id, req.user.id);
  res.json(project);
});

const update = asyncHandler(async (req, res) => {
  const project = await projectsService.update(req.params.id, req.user.id, req.body);
  res.json(project);
});

const remove = asyncHandler(async (req, res) => {
  await projectsService.remove(req.params.id, req.user.id);
  res.status(204).end();
});

module.exports = { create, list, getById, update, remove };
