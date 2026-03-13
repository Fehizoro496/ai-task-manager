const adminService = require("./admin.service");
const projectsService = require("../projects/projects.service");
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

const listProjectMembers = asyncHandler(async (req, res) => {
  const members = await projectsService.listMembers(req.params.projectId);
  res.json({ members });
});

const addProjectMember = asyncHandler(async (req, res) => {
  const member = await projectsService.addMember(req.params.projectId, req.body.userId);
  res.status(201).json({ member });
});

const removeProjectMember = asyncHandler(async (req, res) => {
  await projectsService.removeMember(req.params.projectId, req.params.userId);
  res.status(204).end();
});

module.exports = { listUsers, approveUser, rejectUser, listProjectMembers, addProjectMember, removeProjectMember };
