const { Prisma } = require("@prisma/client");
const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");
const { createNotification, notifyAdmins } = require("../notifications/notifications.service");
const { isMember } = require("../projects/projects.service");
const { createBranch } = require("../github/github.service");
const { filterToCatalog: filterLabelsToCatalog } = require("../labels/labels.service");
const { getIo } = require("../../socket");

const emitToProject = (projectId, event, payload) => {
  if (!projectId) return;
  try {
    const io = getIo();
    if (io) io.to(`project:${projectId}`).emit(event, payload);
  } catch (err) {
    console.error(`Socket emit ${event} failed`, err);
  }
};

// Map Prisma UPPERCASE status to lowercase for frontend
const statusToLowercase = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
};

const assigneeInclude = {
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { comments: true } },
};

/**
 * Serializes a Prisma Task into the format expected by the Flutter frontend.
 */
const serializeTask = (task, projectId) => {
  const computedProjectId = projectId || task.projectId || task.project?.id || null;

  // Quand le projet est inclus (via getById notamment), on construit l'URL
  // directe vers la branche sur GitHub pour pouvoir l'afficher cliquable.
  const project = task.project ?? null;
  const repoUrl = project?.githubRepoUrl ?? null;
  const owner = project?.githubOwner ?? null;
  const repo = project?.githubRepo ?? null;
  const branch = task.githubBranch ?? null;
  let githubBranchUrl = null;
  if (branch && owner && repo) {
    githubBranchUrl = `https://github.com/${owner}/${repo}/tree/${branch}`;
  }

  return {
    id: task.id,
    identifier: task.identifier || null,
    githubBranch: task.githubBranch || null,
    github_branch: task.githubBranch || null,
    githubBranchUrl,
    github_branch_url: githubBranchUrl,
    githubRepoUrl: repoUrl,
    github_repo_url: repoUrl,
    title: task.title,
    description: task.description,
    status: statusToLowercase[task.status] || task.status,
    priority: task.priority || "medium",
    position: task.position,
    order: task.position,
    projectId: computedProjectId,
    project_id: computedProjectId,
    assigneeId: task.assigneeId || null,
    assignee_id: task.assigneeId || null,
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.name,
          avatar_url: task.assignee.avatarUrl || null,
        }
      : null,
    labels: task.labels || [],
    commentsCount: task._count?.comments ?? 0,
    comments_count: task._count?.comments ?? 0,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    due_date: task.dueDate ? task.dueDate.toISOString() : null,
    project: project ? { id: project.id, name: project.name, color: project.color ?? null } : null,
    createdAt: task.createdAt.toISOString(),
    created_at: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
  };
};

/**
 * Génère un identifiant unique pour une tâche (ex: "AM-001") en incrémentant
 * atomiquement le compteur du projet via une transaction Prisma.
 */
const generateTaskIdentifier = async (projectId) => {
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { taskCounter: { increment: 1 } },
    select: { taskCounter: true, identifierPrefix: true },
  });
  return `${updated.identifierPrefix}-${String(updated.taskCounter).padStart(3, "0")}`;
};

const verifyProjectOwnership = async (projectId, userId, isAdmin) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || (!isAdmin && project.ownerId !== userId)) {
    throw new AppError("Project not found", 404);
  }
  return project;
};

const create = async (userId, isAdmin, data) => {
  const project = await verifyProjectOwnership(data.projectId, userId, isAdmin);
  const identifier = await generateTaskIdentifier(project.id);
  const githubBranch = identifier;
  const task = await prisma.task.create({
    data: { ...data, identifier, githubBranch },
    include: {
      ...assigneeInclude,
      project: true,
    },
  });

  if (project.githubOwner && project.githubRepo) {
    createBranch(userId, project.githubOwner, project.githubRepo, githubBranch).catch(() => {});
  }

  emitToProject(project.id, "task:created", serializeTask(task, project.id));

  return task;
};

const getById = async (id, userId, isAdmin) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: true,
      ...assigneeInclude,
    },
  });

  if (!task) throw new AppError("Task not found", 404);

  if (!isAdmin) {
    const project = task.project;
    const isOwner = project.ownerId === userId;
    const isAssignee = task.assigneeId === userId;
    if (!isOwner && !isAssignee) {
      const member = await isMember(project.id, userId);
      if (!member) throw new AppError("Task not found", 404);
    }
  }

  return task;
};

const update = async (id, userId, isAdmin, data) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!task || (!isAdmin && task.project.ownerId !== userId)) {
    throw new AppError("Task not found", 404);
  }

  // Validate assigneeId if provided
  if (data.assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } });
    if (!assignee) throw new AppError("Assignee not found", 404);

    const projectId = task.project.id;
    const memberCheck = await isMember(projectId, data.assigneeId);
    if (!memberCheck) throw new AppError("User is not a member of this project", 400);
  }

  // Les labels sont restreints au catalogue géré par l'admin : on ignore
  // silencieusement tout label hors catalogue.
  if (data.labels !== undefined) {
    data = { ...data, labels: await filterLabelsToCatalog(data.labels) };
  }

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: {
      ...assigneeInclude,
      project: true,
    },
  });

  const projectId = task.project.id;
  const link = `/projects/${projectId}/board?task=${id}`;

  // Notify new assignee when assigned
  if (data.assigneeId && data.assigneeId !== task.assigneeId) {
    createNotification({
      type: "TASK_ASSIGNED",
      title: "Tâche assignée",
      message: `La tâche "${task.title}" vous a été assignée.`,
      userId: data.assigneeId,
      taskId: id,
      link,
    }).catch(() => {});
  } else if (task.assigneeId && task.assigneeId !== userId) {
    // Notify existing assignee of other updates
    createNotification({
      type: "TASK_UPDATED",
      title: "Tâche mise à jour",
      message: `La tâche "${task.title}" a été modifiée.`,
      userId: task.assigneeId,
      taskId: id,
      link,
    }).catch(() => {});
  }

  emitToProject(projectId, "task:updated", serializeTask(updated, projectId));

  return updated;
};

const remove = async (id, userId, isAdmin) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!task || (!isAdmin && task.project.ownerId !== userId)) {
    throw new AppError("Task not found", 404);
  }

  const projectId = task.project.id;
  const deleted = await prisma.task.delete({ where: { id } });
  emitToProject(projectId, "task:deleted", { id, projectId });
  return deleted;
};

const moveTask = async (id, userId, isAdmin, { status, position }) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!task) throw new AppError("Task not found", 404);

  if (!isAdmin && task.assigneeId !== userId) {
    throw new AppError("You can only change the status of tasks assigned to you", 403);
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { status, position },
    include: {
      ...assigneeInclude,
      project: true,
    },
  });

  const projectId = task.project.id;
  const link = `/projects/${projectId}/board?task=${id}`;

  // Notify assignee if someone else moved the task
  if (task.assigneeId && task.assigneeId !== userId) {
    createNotification({
      type: "TASK_STATUS_CHANGED",
      title: "Statut de tâche modifié",
      message: `Le statut de "${task.title}" a changé vers ${status}.`,
      userId: task.assigneeId,
      taskId: id,
      link,
    }).catch(() => {});
  }

  // Notify admins when a non-admin user changes the status
  if (!isAdmin) {
    notifyAdmins({
      type: "TASK_STATUS_CHANGED",
      title: "Statut de tâche modifié",
      message: `Le statut de "${task.title}" a changé vers ${status}.`,
      taskId: id,
      link,
    }).catch(() => {});
  }

  emitToProject(projectId, "task:updated", serializeTask(updated, projectId));

  return updated;
};

const listByProject = async (projectId, userId, isAdmin) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Project not found", 404);

  if (!isAdmin) {
    const member = await isMember(projectId, userId);
    if (!member) throw new AppError("Project not found", 404);
  }

  return prisma.task.findMany({
    where: { projectId },
    orderBy: { position: "asc" },
    include: {
      ...assigneeInclude,
      project: true,
    },
  });
};

const createForProject = async (userId, isAdmin, projectId, data) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project) throw new AppError("Project not found", 404);
  if (!isAdmin && project.ownerId !== userId) {
    const member = await isMember(projectId, userId);
    if (!member) throw new AppError("Project not found", 404);
  }

  const identifier = await generateTaskIdentifier(projectId);
  const githubBranch = identifier;
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || "medium",
      status: data.status || "TODO",
      projectId,
      identifier,
      githubBranch,
    },
    include: assigneeInclude,
  });

  if (project?.githubOwner && project?.githubRepo) {
    createBranch(userId, project.githubOwner, project.githubRepo, githubBranch).catch(() => {});
  }

  emitToProject(projectId, "task:created", serializeTask(task, projectId));
  return task;
};

const statusMap = {
  todo: "TODO",
  in_progress: "IN_PROGRESS",
  in_review: "IN_REVIEW",
  done: "DONE",
};

/**
 * Bulk reorder pour un projet : pour chaque colonne (status), accepte la
 * liste ordonnée d'IDs de tâches. Réassigne en transaction:
 *   task.status = colonne, task.position = index dans la liste.
 * Ignore silencieusement les IDs ne correspondant pas à des tâches du projet.
 */
const reorderForProject = async (projectId, userId, isAdmin, columns) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Project not found", 404);

  if (!isAdmin) {
    const member = await isMember(projectId, userId);
    if (!member && project.ownerId !== userId) {
      throw new AppError("Project not found", 404);
    }
  }

  // Vérifie que toutes les tâches référencées appartiennent bien au projet
  const allIds = Object.values(columns).flat();
  const projectTasks = await prisma.task.findMany({
    where: { id: { in: allIds }, projectId },
    select: { id: true },
  });
  const validIds = new Set(projectTasks.map((t) => t.id));

  const updates = [];
  for (const [colKey, ids] of Object.entries(columns)) {
    const dbStatus = statusMap[colKey?.toLowerCase()] ?? colKey;
    ids.forEach((id, index) => {
      if (!validIds.has(id)) return;
      updates.push(
        prisma.task.update({
          where: { id },
          data: { status: dbStatus, position: index },
        }),
      );
    });
  }

  if (updates.length > 0) await prisma.$transaction(updates);
  emitToProject(projectId, "tasks:reordered", { projectId });
  return { updated: updates.length };
};

const assignSelf = async (id, userId, isAdmin) => {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("Task not found", 404);

  if (!isAdmin && task.assigneeId !== null) {
    throw new AppError("Task is already assigned to someone", 403);
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { assigneeId: userId },
    include: {
      ...assigneeInclude,
      project: true,
    },
  });

  const projectId = updated.project?.id;
  emitToProject(projectId, "task:updated", serializeTask(updated, projectId));
  return updated;
};

/**
 * Filtre Prisma restreignant les tâches à celles visibles par `userId` :
 * tâche assignée, projet possédé, ou projet dont il est membre. Un admin voit
 * tout, d'où le filtre vide.
 */
const visibleTaskFilter = (userId, isAdmin) =>
  isAdmin
    ? {}
    : {
        OR: [
          { assigneeId: userId },
          { project: { ownerId: userId } },
          { project: { members: { some: { userId } } } },
        ],
      };

/**
 * Recherche les tâches visibles dont l'identifiant ou le titre correspond à
 * `query`. Alimente l'autocomplétion `#` de la messagerie.
 */
const searchVisible = async (userId, isAdmin, query, limit = 8) => {
  const q = (query || "").trim();

  return prisma.task.findMany({
    where: {
      ...visibleTaskFilter(userId, isAdmin),
      ...(q
        ? {
            AND: [
              {
                OR: [
                  { identifier: { contains: q, mode: "insensitive" } },
                  { title: { contains: q, mode: "insensitive" } },
                ],
              },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { ...assigneeInclude, project: true },
  });
};

/**
 * Résout une liste d'identifiants (`AM-001`, …) en tâches visibles par
 * l'utilisateur. La comparaison est insensible à la casse car un identifiant
 * mentionné dans un message est saisi à la main.
 */
const findVisibleByIdentifiers = async (identifiers, userId, isAdmin) => {
  if (!identifiers.length) return [];

  return prisma.task.findMany({
    where: {
      AND: [
        { OR: identifiers.map((identifier) => ({ identifier: { equals: identifier, mode: "insensitive" } })) },
        visibleTaskFilter(userId, isAdmin),
      ],
    },
    include: { ...assigneeInclude, project: true },
  });
};

/** Valeurs de priorité connues — sert à valider les filtres entrants. */
const PRIORITY_VALUES = ["urgent", "high", "medium", "low"];
const SORT_MODES = ["due_asc", "due_desc", "priority", "recent"];
const SCOPES = ["all", "active", "done"];
const MY_TASKS_DEFAULT_LIMIT = 30;
const MY_TASKS_MAX_LIMIT = 100;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Neutralise les jokers LIKE saisis par l'utilisateur (`%`, `_`, `\`). */
const escapeLike = (value) => value.replace(/[\%_]/g, (c) => `\${c}`);

/**
 * Clause ORDER BY correspondant au mode de tri. La priorité n'étant pas un
 * enum en base, son ordre métier passe par un CASE. `t.id` ferme chaque tri
 * pour rendre la pagination par offset déterministe.
 */
const myTasksOrderBy = (sort) => {
  switch (sort) {
    case "due_desc":
      return Prisma.sql`t."dueDate" DESC NULLS LAST, t."createdAt" DESC, t."id" ASC`;
    case "priority":
      return Prisma.sql`CASE lower(t."priority")
          WHEN 'urgent' THEN 0
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
          ELSE 4
        END ASC, t."dueDate" ASC NULLS LAST, t."id" ASC`;
    case "recent":
      return Prisma.sql`t."createdAt" DESC, t."id" ASC`;
    default:
      return Prisma.sql`t."dueDate" ASC NULLS LAST, t."createdAt" DESC, t."id" ASC`;
  }
};

/**
 * Liste paginée de la page « Mes tâches », filtrée et triée en base. Le client
 * ne charge qu'une page à la fois et redemande la suivante en arrivant en bas
 * du tableau.
 *
 * Périmètre : un membre ne voit que les tâches qui lui sont assignées, un admin
 * voit toutes les tâches — la page lui sert de vue d'ensemble.
 *
 * Le tri par priorité impose un CASE SQL, donc une requête brute. Elle ne
 * retourne que les ids (plus le total via une window function) ; les tâches
 * sont ensuite hydratées par Prisma pour conserver le même `include` — et donc
 * la même sérialisation — que les autres endpoints.
 */
const listForUser = async (userId, isAdmin, options = {}) => {
  const rawLimit = Number(options.limit);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), MY_TASKS_MAX_LIMIT)
    : MY_TASKS_DEFAULT_LIMIT;
  const rawOffset = Number(options.offset);
  const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;

  const sort = SORT_MODES.includes(options.sort) ? options.sort : "due_asc";
  const scope = SCOPES.includes(options.scope) ? options.scope : "all";
  const q = (options.q || "").trim();
  const priorities = (options.priorities || [])
    .map((p) => String(p).toLowerCase())
    .filter((p) => PRIORITY_VALUES.includes(p));
  const projectIds = (options.projectIds || []).filter((id) => UUID_RE.test(id));

  // Un filtre demandé dont aucune valeur n'est reconnue ne doit pas s'effacer :
  // il ne peut rien matcher, on répond une page vide plutôt que la liste entière.
  const droppedFilter =
    (options.priorities?.length > 0 && priorities.length === 0) ||
    (options.projectIds?.length > 0 && projectIds.length === 0);
  if (droppedFilter) return { tasks: [], total: 0, limit, offset, hasMore: false };

  const conditions = isAdmin ? [] : [Prisma.sql`t."assigneeId" = ${userId}`];
  if (scope === "active") conditions.push(Prisma.sql`t."status" <> 'DONE'`);
  if (scope === "done") conditions.push(Prisma.sql`t."status" = 'DONE'`);
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    conditions.push(Prisma.sql`(
      t."title" ILIKE ${pattern}
      OR t."identifier" ILIKE ${pattern}
      OR p."name" ILIKE ${pattern}
    )`);
  }
  if (priorities.length > 0) {
    conditions.push(Prisma.sql`lower(t."priority") IN (${Prisma.join(priorities)})`);
  }
  if (projectIds.length > 0) {
    conditions.push(Prisma.sql`t."projectId" IN (${Prisma.join(projectIds)})`);
  }

  const where =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty;

  const rows = await prisma.$queryRaw`
    SELECT t."id", COUNT(*) OVER()::int AS total
    FROM "Task" t
    JOIN "Project" p ON p."id" = t."projectId"
    ${where}
    ORDER BY ${myTasksOrderBy(sort)}
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Page vide au-delà du premier lot : la window function ne remonte pas de
  // total, mais on sait qu'on a atteint la fin de la liste.
  const total = rows.length > 0 ? rows[0].total : offset;
  if (rows.length === 0) {
    return { tasks: [], total, limit, offset, hasMore: false };
  }

  const ids = rows.map((r) => r.id);
  const tasks = await prisma.task.findMany({
    where: { id: { in: ids } },
    include: { ...assigneeInclude, project: true },
  });
  const byId = new Map(tasks.map((t) => [t.id, t]));

  return {
    tasks: ids.map((id) => byId.get(id)).filter(Boolean),
    total,
    limit,
    offset,
    hasMore: offset + rows.length < total,
  };
};

module.exports = {
  create,
  getById,
  update,
  remove,
  moveTask,
  listByProject,
  listForUser,
  createForProject,
  reorderForProject,
  assignSelf,
  serializeTask,
  searchVisible,
  findVisibleByIdentifiers,
};
