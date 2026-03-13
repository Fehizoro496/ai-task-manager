const projectsService = require("./projects.service");
const asyncHandler = require("../../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const project = await projectsService.create(req.user.id, req.body);
  res.status(201).json(project);
});

const list = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const projects = await projectsService.listByUser(req.user.id, isAdmin);
  res.json(projects);
});

const getById = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const project = await projectsService.getById(req.params.id, req.user.id, isAdmin);
  res.json(project);
});

const update = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const project = await projectsService.update(req.params.id, req.user.id, isAdmin, req.body);
  res.json(project);
});

const remove = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  await projectsService.remove(req.params.id, req.user.id, isAdmin);
  res.status(204).end();
});

module.exports = { create, list, getById, update, remove };
