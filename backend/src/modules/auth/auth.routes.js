const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const authController = require("./auth.controller");

const router = Router();

router.get("/me", authenticate, authController.getMe);
router.get("/github", authController.githubInit);
router.get("/github/callback", authController.githubCallback);
router.get("/github/status/:state", authController.githubStatus);

module.exports = router;
