const bcrypt = require("bcryptjs");
const prisma = require("../prisma/client");

async function main() {
  // ─── Users ───────────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: "fehizoroandriantsarafara@gmail.com" },
    update: { role: "ADMIN", status: "APPROVED" },
    create: {
      email: "fehizoroandriantsarafara@gmail.com",
      name: "Fehizoro Andriantsarafara",
      provider: "google",
      role: "ADMIN",
      status: "APPROVED",
    },
  });
  console.log("✓ Admin:", admin.email);

  await prisma.user.upsert({
    where: { email: "fehizoroandrian496@gmail.com" },
    update: { status: "APPROVED" },
    create: {
      email: "fehizoroandrian496@gmail.com",
      name: "Fehizoro Andrian",
      provider: "google",
      role: "USER",
      status: "APPROVED",
    },
  });
  console.log("✓ User (Google): fehizoroandrian496@gmail.com");

  const hash = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { email: "user1@gmail.com" },
    update: {},
    create: {
      email: "user1@gmail.com",
      name: "Alice Martin",
      provider: "local",
      password: hash,
      role: "USER",
      status: "APPROVED",
    },
  });
  console.log("✓ User1: user1@gmail.com / 123456");

  await prisma.user.upsert({
    where: { email: "user2@gmail.com" },
    update: {},
    create: {
      email: "user2@gmail.com",
      name: "Bob Dupont",
      provider: "local",
      password: hash,
      role: "USER",
      status: "APPROVED",
    },
  });
  console.log("✓ User2: user2@gmail.com / 123456");

  // ─── Projects ─────────────────────────────────────────────────────────────

  const createProjectWithAdminMember = async (data) => {
    const project = await prisma.project.create({ data });
    await prisma.projectMember.create({
      data: { projectId: project.id, userId: admin.id },
    });
    return project;
  };

  const project1 = await createProjectWithAdminMember({
    name: "Application Mobile",
    description: "App Flutter de gestion de tâches avec IA.",
    color: "#6C5CE7",
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
                      { title: "Implémenter login Google", status: "TODO", priority: "high", position: 0 },
                      { title: "Page d'inscription", status: "TODO", priority: "medium", position: 1 },
                      { title: "Middleware JWT", status: "IN_PROGRESS", priority: "high", position: 2 },
                    ],
                  },
                },
                {
                  title: "Navigation",
                  position: 1,
                  tasks: {
                    create: [
                      { title: "Sidebar responsive", status: "TODO", priority: "medium", position: 0 },
                      { title: "Router principal", status: "DONE", priority: "low", position: 1 },
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
                      { title: "Formulaire de profil", status: "TODO", priority: "medium", position: 0 },
                      { title: "Upload avatar", status: "TODO", priority: "low", position: 1 },
                    ],
                  },
                },
              ],
            },
          },
        ],
    },
  });
  console.log("✓ Project: Application Mobile");

  const project2 = await createProjectWithAdminMember({
    name: "Dashboard Analytics",
    description: "Tableau de bord avec visualisations et exports.",
    color: "#00B894",
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
                      { title: "Intégrer Chart.js", status: "TODO", priority: "high", position: 0 },
                      { title: "Widget KPI", status: "IN_PROGRESS", priority: "high", position: 1 },
                      { title: "Filtre par date", status: "TODO", priority: "medium", position: 2 },
                    ],
                  },
                },
                {
                  title: "Export",
                  position: 1,
                  tasks: {
                    create: [
                      { title: "Export CSV", status: "TODO", priority: "medium", position: 0 },
                      { title: "Export PDF", status: "TODO", priority: "low", position: 1 },
                    ],
                  },
                },
              ],
            },
          },
        ],
    },
  });
  console.log("✓ Project: Dashboard Analytics");

  await createProjectWithAdminMember({
    name: "API Backend v2",
    description: "Refactoring et modernisation de l'API REST.",
    color: "#FDAA5E",
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
                      { title: "Migration vers TypeScript", status: "TODO", priority: "high", position: 0 },
                      { title: "Tests unitaires", status: "TODO", priority: "high", position: 1 },
                      { title: "Documentation Swagger", status: "IN_REVIEW", priority: "medium", position: 2 },
                    ],
                  },
                },
              ],
            },
          },
        ],
    },
  });
  console.log("✓ Project: API Backend v2");

  // ─── Conversation "general" ───────────────────────────────────────────────

  const approvedUsers = await prisma.user.findMany({
    where: { status: "APPROVED" },
    select: { id: true },
  });

  const general = await prisma.conversation.upsert({
    where: { id: "general" },
    update: {
      members: { set: approvedUsers.map((u) => ({ id: u.id })) },
    },
    create: {
      id: "general",
      name: "general",
      isGroup: true,
      members: { connect: approvedUsers.map((u) => ({ id: u.id })) },
    },
  });
  console.log(`✓ Conversation "general" (${approvedUsers.length} membres)`);

  await prisma.message.create({
    data: {
      conversationId: general.id,
      senderId: admin.id,
      content: "Bienvenue dans le canal général 👋",
    },
  });
  console.log("✓ Message de bienvenue ajouté");

  // ─── DMs entre tous les membres approuvés ────────────────────────────────

  // Crée une conversation DM pour chaque paire d'utilisateurs approuvés
  let dmCount = 0;
  for (let i = 0; i < approvedUsers.length; i++) {
    for (let j = i + 1; j < approvedUsers.length; j++) {
      await prisma.conversation.create({
        data: {
          isGroup: false,
          members: { connect: [{ id: approvedUsers[i].id }, { id: approvedUsers[j].id }] },
        },
      });
      dmCount++;
    }
  }
  console.log(`✓ ${dmCount} DMs créés`);

  console.log("\n✅ Seed terminé.");
  console.log("   → Connectez-vous en admin pour ajouter des membres aux projets.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
