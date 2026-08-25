const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const requireAdmin = require("../../middleware/requireAdmin");
const validate = require("../../middleware/validate");
const { taskImageUpload } = require("../../middleware/upload");
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
 *               projectId:
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
 *     summary: List tasks by project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
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
router.get("/", tasksController.listByQuery);

/**
 * @swagger
 * /tasks/my:
 *   get:
 *     tags: [Tasks]
 *     summary: List the current user's tasks (filtered, sorted, paginated)
 *     description: >
 *       Alimente la page « Mes tâches ». Un membre reçoit les tâches qui lui sont
 *       assignées, un admin reçoit toutes les tâches. Filtres, recherche et tri
 *       sont appliqués en base ; la liste est paginée par offset pour un
 *       chargement progressif.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [all, active, done]
 *           default: all
 *       - in: query
 *         name: q
 *         description: Recherche sur le titre, l'identifiant ou le nom du projet
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         description: Priorités acceptées, séparées par des virgules
 *         schema:
 *           type: string
 *           example: urgent,high
 *       - in: query
 *         name: projectId
 *         description: Identifiants de projets, séparés par des virgules
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [due_asc, due_desc, priority, recent]
 *           default: due_asc
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Page de tâches assignées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 */
// Déclarée avant `/:id` pour que "my" ne soit pas capturé comme un id.
router.get("/my", tasksController.listMine);

/**
 * @swagger
 * /tasks/search:
 *   get:
 *     tags: [Tasks]
 *     summary: Search visible tasks by identifier or title
 *     description: Alimente l'autocomplétion des mentions `#` dans la messagerie.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *           maximum: 20
 *     responses:
 *       200:
 *         description: Matching tasks
 */
// Déclarée avant `/:id` pour que "search" ne soit pas capturé comme un id.
router.get("/search", tasksController.search);

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
 *     description: >
 *       Une tâche non assignée est modifiable par tout membre du projet. Dès
 *       qu'elle est assignée, seuls son assigné, le propriétaire du projet et
 *       les admins peuvent la modifier.
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
 *       403:
 *         description: Task assigned to someone else
 *       404:
 *         description: Task not found
 */
router.put("/:id", validate(updateTaskSchema), tasksController.update);

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
 * /tasks/{id}/image:
 *   post:
 *     tags: [Tasks]
 *     summary: Upload (or replace) the task image
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Task with the attached image
 *       400:
 *         description: Invalid image
 *       404:
 *         description: Task not found
 *   delete:
 *     tags: [Tasks]
 *     summary: Remove the task image
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
 *         description: Task without image
 *       404:
 *         description: Task not found
 */
router.post("/:id/image", taskImageUpload.single("image"), tasksController.uploadImage);
router.delete("/:id/image", tasksController.deleteImage);

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
