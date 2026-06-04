const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const requireAdmin = require("../../middleware/requireAdmin");
const skillsController = require("./skills.controller");

const router = Router();
router.use(authenticate);

router.get("/", skillsController.listAll);
router.post("/bootstrap", requireAdmin, skillsController.bootstrap);
router.get("/users/:userId", skillsController.listForUser);
router.post("/users/:userId", skillsController.addOrUpdate);
router.delete("/users/:userId/:skillId", skillsController.remove);

module.exports = router;
