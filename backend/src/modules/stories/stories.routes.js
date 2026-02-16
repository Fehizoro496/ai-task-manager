const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const { createStorySchema, updateStorySchema } = require("./stories.schema");
const storiesController = require("./stories.controller");

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /stories:
 *   post:
 *     tags: [Stories]
 *     summary: Create a story
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, epicId]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               epicId:
 *                 type: string
 *                 format: uuid
 *               position:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Story created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Story'
 */
router.post("/", validate(createStorySchema), storiesController.create);

/**
 * @swagger
 * /stories:
 *   get:
 *     tags: [Stories]
 *     summary: List stories by epic
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: epicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of stories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Story'
 */
router.get("/", storiesController.listByEpic);

/**
 * @swagger
 * /stories/{id}:
 *   get:
 *     tags: [Stories]
 *     summary: Get story with tasks
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
 *         description: Story details
 *       404:
 *         description: Story not found
 */
router.get("/:id", storiesController.getById);

/**
 * @swagger
 * /stories/{id}:
 *   put:
 *     tags: [Stories]
 *     summary: Update a story
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
 *         description: Story updated
 *       404:
 *         description: Story not found
 */
router.put("/:id", validate(updateStorySchema), storiesController.update);

/**
 * @swagger
 * /stories/{id}:
 *   delete:
 *     tags: [Stories]
 *     summary: Delete a story
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
 *         description: Story deleted
 *       404:
 *         description: Story not found
 */
router.delete("/:id", storiesController.remove);

module.exports = router;
