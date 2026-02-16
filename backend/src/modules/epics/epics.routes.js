const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const { createEpicSchema, updateEpicSchema } = require("./epics.schema");
const epicsController = require("./epics.controller");

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /epics:
 *   post:
 *     tags: [Epics]
 *     summary: Create an epic
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, projectId]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               position:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Epic created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Epic'
 */
router.post("/", validate(createEpicSchema), epicsController.create);

/**
 * @swagger
 * /epics:
 *   get:
 *     tags: [Epics]
 *     summary: List epics by project
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
 *         description: List of epics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Epic'
 */
router.get("/", epicsController.listByProject);

/**
 * @swagger
 * /epics/{id}:
 *   get:
 *     tags: [Epics]
 *     summary: Get epic with stories and tasks
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
 *         description: Epic details
 *       404:
 *         description: Epic not found
 */
router.get("/:id", epicsController.getById);

/**
 * @swagger
 * /epics/{id}:
 *   put:
 *     tags: [Epics]
 *     summary: Update an epic
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
 *               position:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Epic updated
 *       404:
 *         description: Epic not found
 */
router.put("/:id", validate(updateEpicSchema), epicsController.update);

/**
 * @swagger
 * /epics/{id}:
 *   delete:
 *     tags: [Epics]
 *     summary: Delete an epic
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
 *         description: Epic deleted
 *       404:
 *         description: Epic not found
 */
router.delete("/:id", epicsController.remove);

module.exports = router;
