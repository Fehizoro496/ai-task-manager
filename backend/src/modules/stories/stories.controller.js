const storiesService = require("./stories.service");
const asyncHandler = require("../../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const story = await storiesService.create(req.user.id, req.body);
  res.status(201).json(story);
});

const listByEpic = asyncHandler(async (req, res) => {
  const stories = await storiesService.listByEpic(req.query.epicId, req.user.id);
  res.json(stories);
});

const getById = asyncHandler(async (req, res) => {
  const story = await storiesService.getById(req.params.id, req.user.id);
  res.json(story);
});

const update = asyncHandler(async (req, res) => {
  const story = await storiesService.update(req.params.id, req.user.id, req.body);
  res.json(story);
});

const remove = asyncHandler(async (req, res) => {
  await storiesService.remove(req.params.id, req.user.id);
  res.status(204).end();
});

module.exports = { create, listByEpic, getById, update, remove };
