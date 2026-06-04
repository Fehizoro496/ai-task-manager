const asyncHandler = require("../../utils/asyncHandler");
const AppError = require("../../utils/AppError");
const skillsService = require("./skills.service");

const canEdit = (req, userId) =>
  req.user.id === userId || req.user.role === "ADMIN";

const listAll = asyncHandler(async (_req, res) => {
  const skills = await skillsService.listAll();
  res.json({ skills });
});

const listForUser = asyncHandler(async (req, res) => {
  const skills = await skillsService.listForUser(req.params.userId);
  res.json({ skills });
});

const addOrUpdate = asyncHandler(async (req, res) => {
  if (!canEdit(req, req.params.userId)) throw new AppError("Forbidden", 403);
  const { name, level } = req.body ?? {};
  const skills = await skillsService.addOrUpdate(req.params.userId, name, level);
  res.status(201).json({ skills });
});

const remove = asyncHandler(async (req, res) => {
  if (!canEdit(req, req.params.userId)) throw new AppError("Forbidden", 403);
  const skills = await skillsService.remove(req.params.userId, req.params.skillId);
  res.json({ skills });
});

const bootstrap = asyncHandler(async (req, res) => {
  const result = await skillsService.bootstrapFromHistory(
    req.body?.userId ?? null,
  );
  res.json(result);
});

module.exports = { listAll, listForUser, addOrUpdate, remove, bootstrap };
