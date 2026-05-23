const asyncHandler = require("../../utils/asyncHandler");
const commentsService = require("./comments.service");

const list = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const comments = await commentsService.list(
    req.params.taskId,
    req.user.id,
    isAdmin,
  );
  res.json({ comments });
});

const create = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const comment = await commentsService.create(
    req.params.taskId,
    req.user.id,
    isAdmin,
    req.body,
  );
  res.status(201).json(comment);
});

const remove = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  await commentsService.remove(req.params.id, req.user.id, isAdmin);
  res.status(204).end();
});

module.exports = { list, create, remove };
