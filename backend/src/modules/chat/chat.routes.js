const { Router } = require('express');
const authenticate = require('../../middleware/auth');
const chatController = require('./chat.controller');

const router = Router();

router.use(authenticate);

router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createDM);
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', chatController.sendMessage);
router.post('/conversations/:id/read', chatController.markRead);

module.exports = router;
