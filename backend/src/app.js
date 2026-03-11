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

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/epics", epicsRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

module.exports = app;
