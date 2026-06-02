const prisma = require("../../prisma/client");
const AppError = require("../../utils/AppError");

const baseSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  provider: true,
  role: true,
  status: true,
  createdAt: true,
};

const serialize = (user) => {
  const { avatarUrl, ...rest } = user;
  return { ...rest, avatar_url: avatarUrl ?? null };
};

/**
 * Liste les utilisateurs visibles dans l'app (status APPROVED).
 * Tout utilisateur authentifié peut appeler — c'est l'annuaire interne.
 */
const listVisible = async () => {
  const users = await prisma.user.findMany({
    where: { status: "APPROVED" },
    select: baseSelect,
    orderBy: { name: "asc" },
  });
  return users.map(serialize);
};

/**
 * Détail d'un utilisateur. Renvoie aussi un résumé (nb tâches assignées,
 * nb projets dont il est membre, dernières tâches assignées).
 */
const getDetail = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: baseSelect,
  });
  if (!user) throw new AppError("User not found", 404);

  const [tasksAssigned, projectsCount, recentTasks] = await Promise.all([
    prisma.task.count({ where: { assigneeId: id } }),
    prisma.projectMember.count({ where: { userId: id } }),
    prisma.task.findMany({
      where: { assigneeId: id },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        story: { include: { epic: { include: { project: true } } } },
      },
    }),
  ]);

  const recent = recentTasks.map((t) => {
    const project = t.story?.epic?.project ?? null;
    return {
      id: t.id,
      identifier: t.identifier ?? null,
      title: t.title,
      status: (t.status ?? "TODO").toLowerCase(),
      priority: t.priority ?? "medium",
      projectId: project?.id ?? null,
      projectName: project?.name ?? null,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      updatedAt: t.updatedAt.toISOString(),
    };
  });

  return {
    ...serialize(user),
    stats: {
      tasksAssigned,
      projectsCount,
    },
    recentTasks: recent,
  };
};

module.exports = { listVisible, getDetail };
