const prisma = require("../prisma/client");

/**
 * Seed de démonstration pour tester la répartition de tâches :
 *  - 1 admin (GitHub) + 5 membres approuvés avec compétences et capacités
 *  - 3 projets avec membres
 *  - des tâches TERMINÉES (historique → compétences dérivées + performance),
 *    des tâches EN COURS (charge active) et des tâches NON ASSIGNÉES avec
 *    labels (à répartir via l'algorithme hongrois).
 *
 * Le script est repeatable : il vide d'abord les données métier.
 */

async function wipe() {
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.calendarEventViewer.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.task.deleteMany();
  await prisma.story.deleteMany();
  await prisma.epic.deleteMany();
  await prisma.aiDraft.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.user.deleteMany();
  console.log("✓ Données métier réinitialisées");
}

/** Crée la compétence (nom normalisé, unique) si besoin et renvoie son id. */
async function ensureSkill(name) {
  const normalized = name.trim().toLowerCase();
  const skill = await prisma.skill.upsert({
    where: { name: normalized },
    update: {},
    create: { name: normalized },
  });
  return skill.id;
}

/** Associe une liste [nom, niveau] de compétences manuelles à un user. */
async function addSkills(userId, pairs) {
  for (const [name, level] of pairs) {
    const skillId = await ensureSkill(name);
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId, skillId } },
      update: { level, source: "manual" },
      create: { userId, skillId, level, source: "manual" },
    });
  }
}

async function main() {
  await wipe();

  // ─── Admin (GitHub OAuth) ─────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: "fehizoroandriantsarafara@gmail.com",
      name: "Fehizoro Andriantsarafara",
      provider: "github",
      role: "ADMIN",
      status: "APPROVED",
      weeklyCapacity: 12,
    },
  });
  console.log("✓ Admin:", admin.email);

  // ─── Membres approuvés (assignables — login via OAuth uniquement) ─────────
  const mkUser = (email, name, weeklyCapacity) =>
    prisma.user.create({
      data: {
        email,
        name,
        provider: "local",
        role: "USER",
        status: "APPROVED",
        weeklyCapacity,
      },
    });

  const alice = await mkUser("alice.martin@demo.dev", "Alice Martin", 12);
  const bob = await mkUser("bob.dupont@demo.dev", "Bob Dupont", 10);
  const chloe = await mkUser("chloe.bernard@demo.dev", "Chloé Bernard", 8);
  const david = await mkUser("david.leroy@demo.dev", "David Leroy", 14);
  const emma = await mkUser("emma.petit@demo.dev", "Emma Petit", 10);
  console.log("✓ 5 membres approuvés créés");

  // Compétences manuelles (les compétences dérivées seront ajoutées par le
  // bootstrap à partir des tâches terminées ci-dessous).
  await addSkills(alice.id, [["react", 5], ["ui", 4], ["design", 4], ["css", 4]]);
  await addSkills(bob.id, [["node", 5], ["api", 5], ["database", 4], ["auth", 3]]);
  await addSkills(chloe.id, [["flutter", 5], ["dart", 5], ["mobile", 4], ["ui", 3]]);
  await addSkills(david.id, [["testing", 5], ["ci", 4], ["docker", 4], ["devops", 4]]);
  await addSkills(emma.id, [["react", 4], ["node", 4], ["api", 3], ["fullstack", 4]]);
  console.log("✓ Compétences manuelles attribuées");

  // ─── Helper projet + membres ──────────────────────────────────────────────
  const createProject = async (data, memberIds) => {
    const project = await prisma.project.create({ data });
    await prisma.projectMember.createMany({
      data: [admin.id, ...memberIds].map((userId) => ({
        projectId: project.id,
        userId,
      })),
      skipDuplicates: true,
    });
    return project;
  };

  // ─── Projet 1 : Application Mobile (AM) ────────────────────────────────────
  await createProject(
    {
      name: "Application Mobile",
      description: "App Flutter de gestion de tâches avec IA.",
      color: "#6C5CE7",
      identifierPrefix: "AM",
      taskCounter: 8,
      ownerId: admin.id,
      epics: {
        create: [
          {
            title: "Sprint 1 — Foundation",
            position: 0,
            stories: {
              create: [
                {
                  title: "Authentification",
                  position: 0,
                  tasks: {
                    create: [
                      // Historique → compétences dérivées + performance
                      { identifier: "AM-001", title: "Implémenter login GitHub", status: "DONE", priority: "high", position: 0, labels: ["auth", "api"], assigneeId: bob.id },
                      { identifier: "AM-002", title: "Page d'inscription", status: "DONE", priority: "medium", position: 1, labels: ["ui", "auth"], assigneeId: alice.id },
                      // Charge active
                      { identifier: "AM-003", title: "Middleware JWT", status: "IN_PROGRESS", priority: "high", position: 2, labels: ["auth", "api"], assigneeId: bob.id },
                    ],
                  },
                },
                {
                  title: "Navigation",
                  position: 1,
                  tasks: {
                    create: [
                      // Non assignée → à répartir (profil UI → Alice)
                      { identifier: "AM-004", title: "Sidebar responsive", status: "TODO", priority: "medium", position: 0, labels: ["ui", "css"] },
                      { identifier: "AM-005", title: "Router principal", status: "DONE", priority: "low", position: 1, labels: ["navigation"], assigneeId: chloe.id },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: "Sprint 2 — Features",
            position: 1,
            stories: {
              create: [
                {
                  title: "Gestion de profil",
                  position: 0,
                  tasks: {
                    create: [
                      { identifier: "AM-006", title: "Formulaire de profil", status: "TODO", priority: "medium", position: 0, labels: ["ui", "react"] },
                      { identifier: "AM-007", title: "Upload avatar Flutter", status: "TODO", priority: "low", position: 1, labels: ["flutter", "mobile"] },
                      { identifier: "AM-008", title: "Écran paramètres", status: "TODO", priority: "medium", position: 2, labels: ["flutter", "dart"] },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    [alice.id, bob.id, chloe.id],
  );
  console.log("✓ Projet: Application Mobile");

  // ─── Projet 2 : Dashboard Analytics (DA) ───────────────────────────────────
  await createProject(
    {
      name: "Dashboard Analytics",
      description: "Tableau de bord avec visualisations et exports.",
      color: "#00B894",
      identifierPrefix: "DA",
      taskCounter: 7,
      ownerId: admin.id,
      epics: {
        create: [
          {
            title: "Data Visualisation",
            position: 0,
            stories: {
              create: [
                {
                  title: "Graphiques",
                  position: 0,
                  tasks: {
                    create: [
                      { identifier: "DA-001", title: "Intégrer la librairie de charts", status: "TODO", priority: "high", position: 0, labels: ["react", "ui"] },
                      { identifier: "DA-002", title: "Widget KPI", status: "IN_PROGRESS", priority: "high", position: 1, labels: ["react"], assigneeId: emma.id },
                      { identifier: "DA-003", title: "Filtre par date", status: "TODO", priority: "medium", position: 2, labels: ["react"] },
                    ],
                  },
                },
                {
                  title: "Export & Infra",
                  position: 1,
                  tasks: {
                    create: [
                      { identifier: "DA-004", title: "Export CSV", status: "DONE", priority: "medium", position: 0, labels: ["node", "api"], assigneeId: bob.id },
                      { identifier: "DA-005", title: "Export PDF", status: "TODO", priority: "low", position: 1, labels: ["node"] },
                      { identifier: "DA-006", title: "Pipeline CI", status: "TODO", priority: "medium", position: 2, labels: ["ci", "docker"] },
                      { identifier: "DA-007", title: "Tests end-to-end", status: "TODO", priority: "high", position: 3, labels: ["testing"] },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    [emma.id, bob.id, david.id],
  );
  console.log("✓ Projet: Dashboard Analytics");

  // ─── Projet 3 : API Backend v2 (API) ───────────────────────────────────────
  await createProject(
    {
      name: "API Backend v2",
      description: "Refactoring et modernisation de l'API REST.",
      color: "#FDAA5E",
      identifierPrefix: "API",
      taskCounter: 5,
      ownerId: admin.id,
      epics: {
        create: [
          {
            title: "Refactoring",
            position: 0,
            stories: {
              create: [
                {
                  title: "Architecture",
                  position: 0,
                  tasks: {
                    create: [
                      { identifier: "API-001", title: "Migration vers TypeScript", status: "TODO", priority: "high", position: 0, labels: ["node", "api"] },
                      { identifier: "API-002", title: "Tests unitaires", status: "TODO", priority: "high", position: 1, labels: ["testing"] },
                      { identifier: "API-003", title: "Documentation Swagger", status: "IN_REVIEW", priority: "medium", position: 2, labels: ["api"], assigneeId: bob.id },
                      { identifier: "API-004", title: "Conteneurisation Docker", status: "TODO", priority: "medium", position: 3, labels: ["docker", "devops"] },
                      { identifier: "API-005", title: "Refactor service auth", status: "DONE", priority: "high", position: 4, labels: ["node", "auth"], assigneeId: bob.id },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    [bob.id, emma.id, david.id],
  );
  console.log("✓ Projet: API Backend v2");

  // ─── Canal général (tous les membres approuvés) ───────────────────────────
  const everyone = [admin, alice, bob, chloe, david, emma];
  await prisma.conversation.create({
    data: {
      name: "general",
      isGroup: true,
      members: { create: everyone.map((u) => ({ userId: u.id })) },
    },
  });
  console.log(`✓ Canal général créé (${everyone.length} membres)`);

  console.log(
    "\n✅ Seed terminé : 1 admin + 5 membres + 3 projets + tâches (terminées / en cours / à répartir).",
  );
  console.log(
    "💡 Astuce : POST /api/skills/bootstrap (admin) pour déduire des compétences depuis l'historique.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
