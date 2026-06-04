const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const distributionController = require("./distribution.controller");

const router = Router();
router.use(authenticate);

// Suggestion d'assigné pour une tâche.
router.get("/tasks/:id/suggest-assignee", distributionController.suggestForTask);

// Répartition d'un lot par projet : aperçu puis application.
router.post("/projects/:id/distribute", distributionController.distribute);
router.post(
  "/projects/:id/distribute/apply",
  distributionController.applyDistribution,
);

module.exports = router;
