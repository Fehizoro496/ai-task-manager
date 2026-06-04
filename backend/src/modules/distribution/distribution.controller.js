const asyncHandler = require("../../utils/asyncHandler");
const distributionService = require("./distribution.service");

const suggestForTask = asyncHandler(async (req, res) => {
  const result = await distributionService.suggestForTask(req.params.id);
  res.json(result);
});

const distribute = asyncHandler(async (req, res) => {
  const taskIds = Array.isArray(req.body?.taskIds) ? req.body.taskIds : null;
  const result = await distributionService.distributeProject(
    req.params.id,
    taskIds,
  );
  res.json(result);
});

const applyDistribution = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const result = await distributionService.applyAssignments(
    req.params.id,
    req.user.id,
    isAdmin,
    req.body?.assignments ?? [],
  );
  res.json(result);
});

module.exports = { suggestForTask, distribute, applyDistribution };
