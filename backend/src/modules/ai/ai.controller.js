const aiService = require("./ai.service");
const asyncHandler = require("../../utils/asyncHandler");

const plan = asyncHandler(async (req, res) => {
  const draft = await aiService.generatePlan(req.user.id, req.body);
  res.status(201).json(draft);
});

const getDraft = asyncHandler(async (req, res) => {
  const draft = await aiService.getDraft(req.params.id, req.user.id);
  res.json(draft);
});

const listDrafts = asyncHandler(async (req, res) => {
  const drafts = await aiService.listDrafts(req.query.projectId, req.user.id);
  res.json(drafts);
});

const approve = asyncHandler(async (req, res) => {
  const result = await aiService.approveDraft(req.params.draftId, req.user.id);
  res.status(201).json(result);
});

module.exports = { plan, getDraft, listDrafts, approve };
