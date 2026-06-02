const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");
const { createNotification } = require("../notifications/notifications.service");
const { createRepo, inviteCollaborator } = require("../github/github.service");

/**
 * Génère un préfixe d'identifiant à partir du nom du projet.
 * "AI Manager" → "AIM", "Mon Projet" → "MP", "Task" → "TAS"
 */
const generateIdentifierPrefix = (name) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }
  return words.map((w) => w[0]).join("").substring(0, 5).toUpperCase();
};

/**
 * Extrait {owner, repo} depuis une URL GitHub.
 * Exemples acceptés :
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/
 */
const parseGithubUrl = (url) => {
  if (!url) return { owner: null, repo: null };
  const match = url.match(/github\.com[\/:]([^\/]+)\/([^\/\?#]+?)(?:\.git)?\/?$/i);
  if (!match) return { owner: null, repo: null };
  return { owner: match[1], repo: match[2] };
};

const serializeMember = (member) => {
  const { avatarUrl, ...userRest } = member.user;
  return { ...member, user: { ...userRest, avatar_url: avatarUrl ?? null } };
};

const create = async (ownerId, data) => {
  const identifierPrefix = data.identifierPrefix
    ? data.identifierPrefix.toUpperCase()
    : generateIdentifierPrefix(data.name);

  let githubRepoUrl = data.githubRepoUrl || null;
  let githubOwner = null;
  let githubRepo = null;

  if (githubRepoUrl) {
    // URL fournie manuellement : extraire owner/repo
    ({ owner: githubOwner, repo: githubRepo } = parseGithubUrl(githubRepoUrl));
  } else {
    // Pas d'URL : créer le repo GitHub automatiquement
    try {
      const ghRepo = await createRepo(ownerId, data.name, data.description);
      if (ghRepo) {
        githubRepoUrl = ghRepo.repoUrl;
        githubOwner = ghRepo.owner;
        githubRepo = ghRepo.repo;
      }
    } catch (_) {
      // Échec silencieux : le projet est créé sans lien GitHub
    }
  }

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
      ownerId,
      identifierPrefix,
      githubRepoUrl,
      githubOwner,
      githubRepo,
    },
  });

  await prisma.projectMember.create({
    data: { projectId: project.id, userId: ownerId },
  });

  return project;
};

const listByUser = async (userId, isAdmin) => {
  if (isAdmin) {
    return prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  }
  return prisma.project.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
  });
};

const getById = async (id, userId, isAdmin) => {
  const where = isAdmin
    ? { id }
    : { id, members: { some: { userId } } };

  const project = await prisma.project.findFirst({
    where,
    include: {
      epics: {
        orderBy: { position: "asc" },
        include: {
          stories: {
            orderBy: { position: "asc" },
            include: {
              tasks: { orderBy: { position: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return project;
};

const update = async (id, userId, isAdmin, data) => {
  const project = await prisma.project.findFirst({ where: { id, ownerId: userId } });
  if (!project && !isAdmin) {
    throw new AppError("Project not found", 404);
  }
  if (!project) {
    const exists = await prisma.project.findUnique({ where: { id } });
    if (!exists) throw new AppError("Project not found", 404);
  }

  // Si githubRepoUrl change, recalcule owner/repo
  const updateData = { ...data };
  if (Object.prototype.hasOwnProperty.call(data, "githubRepoUrl")) {
    const { owner, repo } = parseGithubUrl(data.githubRepoUrl);
    updateData.githubOwner = owner;
    updateData.githubRepo = repo;
  }

  return prisma.project.update({ where: { id }, data: updateData });
};

const remove = async (id, userId, isAdmin) => {
  const project = await prisma.project.findFirst({ where: { id, ownerId: userId } });
  if (!project && !isAdmin) {
    throw new AppError("Project not found", 404);
  }
  if (!project) {
    const exists = await prisma.project.findUnique({ where: { id } });
    if (!exists) throw new AppError("Project not found", 404);
  }

  return prisma.project.delete({ where: { id } });
};

const addMember = async (projectId, userId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Project not found", 404);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (existing) throw new AppError("User is already a member", 409);

  const member = await prisma.projectMember.create({
    data: { projectId, userId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });

  createNotification({
    type: "TASK_ASSIGNED",
    title: "Ajouté à un projet",
    message: `Vous avez été ajouté en tant que participant au projet "${project.name}".`,
    userId,
    taskId: projectId,
    link: `/projects/${projectId}`,
  }).catch(() => {});

  if (project.githubOwner && project.githubRepo) {
    inviteCollaborator(project.ownerId, project.githubOwner, project.githubRepo, userId).catch(() => {});
  }

  return serializeMember(member);
};

const removeMember = async (projectId, userId) => {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError("Member not found", 404);

  return prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });
};

const listMembers = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError("Project not found", 404);

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });
  return members.map(serializeMember);
};

const isMember = async (projectId, userId) => {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return member !== null;
};

module.exports = { create, listByUser, getById, update, remove, addMember, removeMember, listMembers, isMember };
