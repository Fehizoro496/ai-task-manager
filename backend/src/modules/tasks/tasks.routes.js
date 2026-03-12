const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const requireAdmin = require("../../middleware/requireAdmin");
const validate = require("../../middleware/validate");
const { createTaskSchema, updateTaskSchema, moveTaskSchema } = require("./tasks.schema");
const tasksController = require("./tasks.controller");

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               storyId:
 *                 type: string
 *                 format: uuid
 *               priority:
 *                 type: string
 *               position:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
router.post("/", requireAdmin, validate(createTaskSchema), tasksController.create);

/**
 * @swagger
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks by story
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
router.get("/", tasksController.listByStory);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task details
 *       404:
 *         description: Task not found
 */
router.get("/:id", tasksController.getById);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task (status, position, title, description, priority, etc.)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE, todo, in_progress, in_review, done]
 *               position:
 *                 type: integer
 *               priority:
 *                 type: string
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *               labels:
 *                 type: array
 *                 items:
 *                   type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found
 */
router.put("/:id", requireAdmin, validate(updateTaskSchema), tasksController.update);

/**
 * @swagger
 * /tasks/{id}/move:
 *   patch:
 *     tags: [Tasks]
 *     summary: Move a task (change status and/or position)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, in_review, done]
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Task moved
 *       404:
 *         description: Task not found
 */
router.patch("/:id/move", validate(moveTaskSchema), tasksController.move);

router.patch("/:id/assign", tasksController.assign);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Task deleted
 *       404:
 *         description: Task not found
 */
router.delete("/:id", requireAdmin, tasksController.remove);

module.exports = router;
