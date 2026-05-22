const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const calendarController = require("./calendar.controller");

const router = Router();
router.use(authenticate);

router.get("/events", calendarController.listEvents);

module.exports = router;
