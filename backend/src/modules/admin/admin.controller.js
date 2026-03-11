const adminService = require("./admin.service");
const asyncHandler = require("../../utils/asyncHandler");

const listUsers = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const users = await adminService.listUsers({ status });
  res.json({ users });
});

const approveUser = asyncHandler(async (req, res) => {
  const user = await adminService.approveUser(req.params.id);
  res.json({ user });
});

const rejectUser = asyncHandler(async (req, res) => {
  const user = await adminService.rejectUser(req.params.id);
  res.json({ user });
});

module.exports = { listUsers, approveUser, rejectUser };
