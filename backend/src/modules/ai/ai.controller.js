const aiService = require("./ai.service");
const asyncHandler = require("../../utils/asyncHandler");

const plan = asyncHandler(async (req, res) => {
  const draft = await aiService.generatePlan(req.user.id, req.body);
  res.status(201).json(aiService.serializeDraft(draft));
});

const getDraft = asyncHandler(async (req, res) => {
  const draft = await aiService.getDraft(req.params.id, req.user.id);
  res.json(aiService.serializeDraft(draft));
});

const listDrafts = asyncHandler(async (req, res) => {
  const projectId = req.query.projectId || req.query.project_id;
  const drafts = await aiService.listDrafts(projectId, req.user.id);
  res.json(drafts.map(aiService.serializeDraft));
});

const approve = asyncHandler(async (req, res) => {
  const result = await aiService.approveDraft(req.params.id, req.user.id);
  res.status(201).json(result);
});

const reject = asyncHandler(async (req, res) => {
  await aiService.rejectDraft(req.params.id, req.user.id);
  res.json({ message: "Draft rejected" });
});

module.exports = { plan, getDraft, listDrafts, approve, reject };
