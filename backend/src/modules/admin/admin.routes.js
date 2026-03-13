const express = require("express");
const authenticate = require("../../middleware/auth");
const requireAdmin = require("../../middleware/requireAdmin");
const {
  listUsers, approveUser, rejectUser,
  listProjectMembers, addProjectMember, removeProjectMember,
} = require("./admin.controller");

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/users", listUsers);
router.patch("/users/:id/approve", approveUser);
router.patch("/users/:id/reject", rejectUser);

router.get("/projects/:projectId/members", listProjectMembers);
router.post("/projects/:projectId/members", addProjectMember);
router.delete("/projects/:projectId/members/:userId", removeProjectMember);

module.exports = router;
