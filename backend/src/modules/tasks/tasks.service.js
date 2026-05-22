const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");
const { createNotification, notifyAdmins } = require("../notifications/notifications.service");
const { isMember } = require("../projects/projects.service");
const { createBranch } = require("../github/github.service");

// Map Prisma UPPERCASE status to lowercase for frontend
const statusToLowercase = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
};

const assigneeInclude = {
  assignee: { select: { id: true, name: true, avatarUrl: true } },
};

/**
 * Serializes a Prisma Task into the format expected by the Flutter frontend.
 */
const serializeTask = (task, projectId) => {
  const computedProjectId =
    projectId ||
    task.projectId ||
    task.story?.epic?.project?.id ||
    null;

  // Quand le projet est inclus (via getById notamment), on construit l'URL
  // directe vers la branche sur GitHub pour pouvoir l'afficher cliquable.
  const project = task.story?.epic?.project ?? null;
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
    storyId: task.storyId,
    story_id: task.storyId,
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
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    due_date: task.dueDate ? task.dueDate.toISOString() : null,
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

const verifyStoryOwnership = async (storyId, userId, isAdmin) => {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { epic: { include: { project: true } } },
  });
  if (!story || (!isAdmin && story.epic.project.ownerId !== userId)) {
    throw new AppError("Story not found", 404);
  }
  return story;
};

const create = async (userId, isAdmin, data) => {
  const story = await verifyStoryOwnership(data.storyId, userId, isAdmin);
  const project = story.epic.project;
  const identifier = await generateTaskIdentifier(project.id);
  const githubBranch = identifier;
  const task = await prisma.task.create({ data: { ...data, identifier, githubBranch }, include: assigneeInclude });

  if (project.githubOwner && project.githubRepo) {
    createBranch(userId, project.githubOwner, project.githubRepo, githubBranch).catch(() => {});
  }

  return task;
};

const listByStory = async (storyId, userId, isAdmin) => {
  await verifyStoryOwnership(storyId, userId, isAdmin);
  return prisma.task.findMany({
    where: { storyId },
    orderBy: { position: "asc" },
    include: assigneeInclude,
  });
};

const getById = async (id, userId, isAdmin) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      story: { include: { epic: { include: { project: true } } } },
      ...assigneeInclude,
    },
  });

  if (!task) throw new AppError("Task not found", 404);

  if (!isAdmin) {
    const project = task.story.epic.project;
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
    include: { story: { include: { epic: { include: { project: true } } } } },
  });

  if (!task || (!isAdmin && task.story.epic.project.ownerId !== userId)) {
    throw new AppError("Task not found", 404);
  }

  // Validate assigneeId if provided
  if (data.assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } });
    if (!assignee) throw new AppError("Assignee not found", 404);

    const projectId = task.story.epic.project.id;
    const memberCheck = await isMember(projectId, data.assigneeId);
    if (!memberCheck) throw new AppError("User is not a member of this project", 400);
  }

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: {
      ...assigneeInclude,
      story: { include: { epic: { include: { project: true } } } },
    },
  });

  const projectId = task.story.epic.project.id;
  const link = `/board/${projectId}`;

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

  return updated;
};

const remove = async (id, userId, isAdmin) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { story: { include: { epic: { include: { project: true } } } } },
  });

  if (!task || (!isAdmin && task.story.epic.project.ownerId !== userId)) {
    throw new AppError("Task not found", 404);
  }

  return prisma.task.delete({ where: { id } });
};

const moveTask = async (id, userId, isAdmin, { status, position }) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: { story: { include: { epic: { include: { project: true } } } } },
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
      story: { include: { epic: { include: { project: true } } } },
    },
  });

  const projectId = task.story.epic.project.id;
  const link = `/board/${projectId}`;

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
    where: {
      story: { epic: { projectId } },
    },
    orderBy: { position: "asc" },
    include: {
      ...assigneeInclude,
      story: { include: { epic: { include: { project: true } } } },
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

  // If storyId is provided, verify it belongs to this project
  if (data.storyId || data.story_id) {
    const storyId = data.storyId || data.story_id;
    const story = await prisma.story.findFirst({
      where: { id: storyId, epic: { projectId } },
    });
    if (!story) {
      throw new AppError("Story not found in this project", 404);
    }
    const identifier = await generateTaskIdentifier(projectId);
    const githubBranch = identifier;
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || "medium",
        status: data.status || "TODO",
        storyId,
        identifier,
        githubBranch,
      },
      include: assigneeInclude,
    });

    if (project?.githubOwner && project?.githubRepo) {
      createBranch(userId, project.githubOwner, project.githubRepo, githubBranch).catch(() => {});
    }

    return task;
  }

  // No storyId: assign to the first story of the first epic, or create a default epic/story
  let story = await prisma.story.findFirst({
    where: { epic: { projectId } },
    orderBy: { position: "asc" },
  });

  if (!story) {
    const epic = await prisma.epic.create({
      data: { title: "Backlog", projectId, position: 0 },
    });
    story = await prisma.story.create({
      data: { title: "Default", epicId: epic.id, position: 0 },
    });
  }

  const identifier = await generateTaskIdentifier(projectId);
  const githubBranch = identifier;
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || "medium",
      status: data.status || "TODO",
      storyId: story.id,
      identifier,
      githubBranch,
    },
    include: assigneeInclude,
  });

  if (project?.githubOwner && project?.githubRepo) {
    createBranch(userId, project.githubOwner, project.githubRepo, githubBranch).catch(() => {});
  }

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
    where: { id: { in: allIds }, story: { epic: { projectId } } },
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
  return { updated: updates.length };
};

const assignSelf = async (id, userId, isAdmin) => {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("Task not found", 404);

  if (!isAdmin && task.assigneeId !== null) {
    throw new AppError("Task is already assigned to someone", 403);
  }

  return prisma.task.update({
    where: { id },
    data: { assigneeId: userId },
    include: {
      ...assigneeInclude,
      story: { include: { epic: { include: { project: true } } } },
    },
  });
};

module.exports = {
  create,
  listByStory,
  getById,
  update,
  remove,
  moveTask,
  listByProject,
  createForProject,
  reorderForProject,
  assignSelf,
  serializeTask,
};
