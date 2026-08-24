const { Router } = require('express');
const authenticate = require('../../middleware/auth');
const chatController = require('./chat.controller');
const { chatUpload } = require('../../middleware/upload');

const router = Router();

router.use(authenticate);

router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createDM);
router.get('/conversations/:id/messages', chatController.getMessages);
router.post(
  '/conversations/:id/messages',
  chatUpload.array('files', 5),
  chatController.sendMessage,
);
router.post('/conversations/:id/read', chatController.markRead);
router.delete('/messages/:messageId', chatController.deleteMessage);

module.exports = router;
