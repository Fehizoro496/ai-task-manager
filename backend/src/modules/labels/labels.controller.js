const asyncHandler = require("../../utils/asyncHandler");
const labelsService = require("./labels.service");

const list = asyncHandler(async (_req, res) => {
  const labels = await labelsService.listAll();
  res.json({ labels });
});

const create = asyncHandler(async (req, res) => {
  const label = await labelsService.create(req.body?.name);
  res.status(201).json(label);
});

const remove = asyncHandler(async (req, res) => {
  const result = await labelsService.remove(req.params.id);
  res.json(result);
});

module.exports = { list, create, remove };
