const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const requireAdmin = require("../../middleware/requireAdmin");
const labelsController = require("./labels.controller");

const router = Router();
router.use(authenticate);

router.get("/", labelsController.list);
router.post("/", requireAdmin, labelsController.create);
router.delete("/:id", requireAdmin, labelsController.remove);

module.exports = router;
