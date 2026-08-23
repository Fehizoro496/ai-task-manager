const { prisma } = require("./db");

let seq = 0;
const next = () => ++seq;

const makeUser = ({ role = "USER", status = "APPROVED", ...rest } = {}) => {
  const n = next();
  return prisma.user.create({
    data: {
      email: rest.email ?? `user${n}@test.dev`,
      name: rest.name ?? `Utilisateur ${n}`,
      role,
      status,
      provider: "local",
      weeklyCapacity: rest.weeklyCapacity ?? 10,
    },
  });
};

const makeAdmin = (data = {}) => makeUser({ ...data, role: "ADMIN" });

/** Crée un projet et inscrit son propriétaire comme membre, comme le fait le service. */
const makeProject = async ({ ownerId, ...rest } = {}) => {
  const n = next();
  const project = await prisma.project.create({
    data: {
      name: rest.name ?? `Projet ${n}`,
      description: rest.description ?? null,
      ownerId,
      identifierPrefix: rest.identifierPrefix ?? `P${n}`,
      githubRepoUrl: rest.githubRepoUrl ?? null,
      githubOwner: rest.githubOwner ?? null,
      githubRepo: rest.githubRepo ?? null,
    },
  });
  await prisma.projectMember.create({ data: { projectId: project.id, userId: ownerId } });
  return project;
};

const addMember = (projectId, userId) =>
  prisma.projectMember.create({ data: { projectId, userId } });

/**
 * Crée une tâche. `identifier` est unique en base : on le dérive d'un compteur
 * quand l'appelant n'en impose pas.
 */
const makeTask = ({ projectId, ...rest } = {}) => {
  const n = next();
  return prisma.task.create({
    data: {
      title: rest.title ?? `Tâche ${n}`,
      description: rest.description ?? null,
      identifier: rest.identifier ?? `T-${String(n).padStart(3, "0")}`,
      status: rest.status ?? "TODO",
      priority: rest.priority ?? "medium",
      position: rest.position ?? n,
      projectId,
      assigneeId: rest.assigneeId ?? null,
      dueDate: rest.dueDate ?? null,
      labels: rest.labels ?? [],
      // Fixable explicitement : le tri « récentes » et les départages d'égalité
      // reposent dessus, deux `now()` consécutifs seraient trop rapprochés.
      ...(rest.createdAt ? { createdAt: rest.createdAt } : {}),
    },
  });
};

module.exports = { makeUser, makeAdmin, makeProject, addMember, makeTask };
