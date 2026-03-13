const notificationsService = require("./notifications.service");
const asyncHandler = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const notifications = await notificationsService.getNotifications(req.user.id);
  res.json({ notifications });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationsService.markAsRead(req.params.id, req.user.id);
  res.json({ notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationsService.markAllAsRead(req.user.id);
  res.json({ message: "All notifications marked as read" });
});

module.exports = { list, markRead, markAllRead };
