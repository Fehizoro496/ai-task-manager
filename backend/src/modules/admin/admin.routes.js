const express = require("express");
const authenticate = require("../../middleware/auth");
const requireAdmin = require("../../middleware/requireAdmin");
const { listUsers, approveUser, rejectUser } = require("./admin.controller");

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/users", listUsers);
router.patch("/users/:id/approve", approveUser);
router.patch("/users/:id/reject", rejectUser);

module.exports = router;
