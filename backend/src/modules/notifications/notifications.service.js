const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");
const { getIo } = require("../../socket");

const serializeNotification = (n) => ({
  id: n.id,
  type: n.type,
  title: n.title,
  message: n.message,
  userId: n.userId,
  taskId: n.taskId,
  link: n.link,
  read: n.isRead,
  createdAt: n.createdAt.toISOString(),
});

const createNotification = async ({ type, title, message, userId, taskId, link }) => {
  const notif = await prisma.notification.create({
    data: { type, title, message, userId, taskId, link },
  });

  try {
    const io = getIo();
    if (io) {
      io.to(`user:${userId}`).emit("notification:new", serializeNotification(notif));
    }
  } catch (e) {
    console.error("Socket emit notification:new failed", e);
  }

  return notif;
};

const getNotifications = async (userId) => {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return notifications.map(serializeNotification);
};

const markAsRead = async (id, userId) => {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw new AppError("Notification not found", 404);
  }
  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
  return serializeNotification(updated);
};

const markAllAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

const notifyAdmins = async ({ type, title, message, taskId, link }) => {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "APPROVED" },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification({ type, title, message, userId: admin.id, taskId, link })
    )
  );
};

module.exports = { createNotification, notifyAdmins, getNotifications, markAsRead, markAllAsRead };
