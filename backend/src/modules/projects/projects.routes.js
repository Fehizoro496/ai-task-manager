const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const requireAdmin = require("../../middleware/requireAdmin");
const validate = require("../../middleware/validate");
const { createProjectSchema, updateProjectSchema } = require("./projects.schema");
const { createTaskForProjectSchema } = require("../tasks/tasks.schema");
const projectsController = require("./projects.controller");
const tasksController = require("../tasks/tasks.controller");

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a project
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 */
router.post("/", requireAdmin, validate(createProjectSchema), projectsController.create);

/**
 * @swagger
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List user projects
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 */
router.get("/", projectsController.list);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project with full hierarchy (Epics > Stories > Tasks)
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
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get("/:id", projectsController.getById);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     tags: [Projects]
 *     summary: Update a project
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated
 *       404:
 *         description: Project not found
 */
router.put("/:id", validate(updateProjectSchema), projectsController.update);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project
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
 *         description: Project deleted
 *       404:
 *         description: Project not found
 */
router.delete("/:id", projectsController.remove);

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List all tasks for a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of tasks
 *       404:
 *         description: Project not found
 */
router.get("/:projectId/tasks", tasksController.listByProject);

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task in a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
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
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               storyId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Task created
 *       404:
 *         description: Project not found
 */
router.post("/:projectId/tasks", requireAdmin, validate(createTaskForProjectSchema), tasksController.createForProject);

/**
 * @swagger
 * /projects/{projectId}/tasks/reorder:
 *   patch:
 *     tags: [Tasks]
 *     summary: Bulk reorder/move tasks within a project's columns
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
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
 *               columns:
 *                 type: object
 *                 additionalProperties:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *     responses:
 *       200:
 *         description: Updated count
 */
router.patch("/:projectId/tasks/reorder", tasksController.reorderForProject);

router.get("/:projectId/members", projectsController.listMembers);

module.exports = router;
