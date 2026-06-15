const { Router } = require("express");
const authenticate = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const { planRequestSchema } = require("./ai.schema");
const aiController = require("./ai.controller");

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /ai/generate-plan:
 *   post:
 *     tags: [AI]
 *     summary: Generate an AI plan from a feature document
 *     description: Sends a document to the LLM which breaks it into Epics, Stories and Tasks. Stores the result as a draft.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [document]
 *             properties:
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               project_id:
 *                 type: string
 *                 format: uuid
 *               document:
 *                 type: string
 *                 description: Feature document text to break down
 *     responses:
 *       201:
 *         description: AI draft created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AiDraft'
 *       404:
 *         description: Project not found
 */
router.post("/generate-plan", validate(planRequestSchema), aiController.plan);

/**
 * @swagger
 * /ai/drafts:
 *   get:
 *     tags: [AI]
 *     summary: List AI drafts for a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of drafts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AiDraft'
 */
router.get("/drafts", aiController.listDrafts);

/**
 * @swagger
 * /ai/drafts/{id}:
 *   get:
 *     tags: [AI]
 *     summary: Get a single AI draft
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
 *         description: Draft details
 *       404:
 *         description: Draft not found
 */
router.get("/drafts/:id", aiController.getDraft);

/**
 * @swagger
 * /ai/drafts/{id}/approve:
 *   post:
 *     tags: [AI]
 *     summary: Approve a draft and convert to real Epics/Stories/Tasks
 *     description: Converts the AI-generated draft plan into actual project entities using a Prisma transaction.
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
 *       201:
 *         description: Draft approved and entities created
 *       400:
 *         description: Draft already approved
 *       404:
 *         description: Draft not found
 */
router.post("/drafts/:id/approve", aiController.approve);

/**
 * @swagger
 * /ai/drafts/{id}/reject:
 *   post:
 *     tags: [AI]
 *     summary: Reject a draft
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
 *         description: Draft rejected
 *       404:
 *         description: Draft not found
 */
router.post("/drafts/:id/reject", aiController.reject);

/**
 * @swagger
 * /ai/drafts/{id}/refine:
 *   post:
 *     tags: [AI]
 *     summary: Refine an existing draft plan via a natural-language instruction
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
 *             required: [instruction]
 *             properties:
 *               instruction:
 *                 type: string
 *     responses:
 *       200:
 *         description: Revised draft
 *       404:
 *         description: Draft not found
 */
router.post("/drafts/:id/refine", aiController.refine);

module.exports = router;
