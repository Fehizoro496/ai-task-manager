const usersService = require("./users.service");
const asyncHandler = require("../../utils/asyncHandler");

const list = asyncHandler(async (_req, res) => {
  const users = await usersService.listVisible();
  res.json({ users });
});

const getById = asyncHandler(async (req, res) => {
  const user = await usersService.getDetail(req.params.id);
  res.json(user);
});

module.exports = { list, getById };
