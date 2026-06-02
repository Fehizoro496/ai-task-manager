const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const commentsController = require("./comments.controller");
const { createCommentSchema } = require("./comments.schema");

// Routeur principal monté sous /api/comments — opérations directes.
const commentsRouter = Router();
commentsRouter.use(authenticate);
commentsRouter.delete("/:id", commentsController.remove);

// Sous-routeur monté sous /api/tasks — listings et créations imbriqués.
const tasksCommentsRouter = Router();
tasksCommentsRouter.use(authenticate);
tasksCommentsRouter.get("/:taskId/comments", commentsController.list);
tasksCommentsRouter.post(
  "/:taskId/comments",
  validate(createCommentSchema),
  commentsController.create,
);

module.exports = { commentsRouter, tasksCommentsRouter };
