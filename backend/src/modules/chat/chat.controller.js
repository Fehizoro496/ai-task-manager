const chatService = require('./chat.service');
const { createDMSchema, sendMessageSchema } = require('./chat.schema');

const getConversations = async (req, res, next) => {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

const createDM = async (req, res, next) => {
  try {
    const { otherUserId } = createDMSchema.parse(req.body);
    const conversation = await chatService.getOrCreateDM(req.user.id, otherUserId);
    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const messages = await chatService.getMessages(
      req.params.id,
      req.user.id,
      req.user.role === 'ADMIN',
    );
    res.json({ messages });
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { content } = sendMessageSchema.parse(req.body);
    const message = await chatService.sendMessage(
      req.params.id,
      req.user.id,
      content,
      req.files ?? [],
      req.user.role === 'ADMIN',
    );
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const message = await chatService.deleteMessage(
      req.params.messageId,
      req.user.id,
      req.user.role === 'ADMIN',
    );
    res.json({ message });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const result = await chatService.markConversationRead(
      req.params.id,
      req.user.id,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConversations,
  createDM,
  getMessages,
  sendMessage,
  deleteMessage,
  markRead,
};
