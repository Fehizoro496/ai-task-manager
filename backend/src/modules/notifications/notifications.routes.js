const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const notificationsController = require("./notifications.controller");

const router = Router();

router.use(authenticate);

router.get("/", notificationsController.list);
router.patch("/read-all", notificationsController.markAllRead);
router.patch("/:id/read", notificationsController.markRead);

module.exports = router;
