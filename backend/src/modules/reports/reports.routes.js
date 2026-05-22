const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const reportsController = require("./reports.controller");

const router = Router();
router.use(authenticate);

router.get("/overview", reportsController.overview);

module.exports = router;
