const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./modules/auth/auth.routes");
const projectsRoutes = require("./modules/projects/projects.routes");
const epicsRoutes = require("./modules/epics/epics.routes");
const storiesRoutes = require("./modules/stories/stories.routes");
const tasksRoutes = require("./modules/tasks/tasks.routes");
const aiRoutes = require("./modules/ai/ai.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const notificationsRoutes = require("./modules/notifications/notifications.routes");
const chatRoutes = require("./modules/chat/chat.routes");
const usersRoutes = require("./modules/users/users.routes");
const calendarRoutes = require("./modules/calendar/calendar.routes");
const reportsRoutes = require("./modules/reports/reports.routes");
const skillsRoutes = require("./modules/skills/skills.routes");
const labelsRoutes = require("./modules/labels/labels.routes");
const distributionRoutes = require("./modules/distribution/distribution.routes");
const {
  commentsRouter,
  tasksCommentsRouter,
} = require("./modules/comments/comments.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/epics", epicsRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/tasks", tasksCommentsRouter);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/labels", labelsRoutes);
app.use("/api", distributionRoutes);
app.use("/api/comments", commentsRouter);

app.use(errorHandler);

module.exports = app;
