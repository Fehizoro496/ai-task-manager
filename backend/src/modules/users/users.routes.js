const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const usersController = require("./users.controller");

const router = Router();

router.use(authenticate);

router.get("/", usersController.list);
router.get("/:id", usersController.getById);

module.exports = router;
