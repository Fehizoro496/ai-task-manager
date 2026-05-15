const prisma = require("../prisma/client");

async function main() {
  // ─── Admin unique (GitHub OAuth) ─────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: "fehizoroandriantsarafara@gmail.com" },
    update: { role: "ADMIN", status: "APPROVED", provider: "github" },
    create: {
      email: "fehizoroandriantsarafara@gmail.com",
      name: "Fehizoro Andriantsarafara",
      provider: "github",
      role: "ADMIN",
      status: "APPROVED",
    },
  });
  console.log("✓ Admin:", admin.email);

  // ─── Projects ─────────────────────────────────────────────────────────────

  const createProjectWithAdminMember = async (data) => {
    const project = await prisma.project.create({ data });
    await prisma.projectMember.create({
      data: { projectId: project.id, userId: admin.id },
    });
    return project;
  };

  await createProjectWithAdminMember({
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
                    { title: "Implémenter login GitHub", status: "TODO", priority: "high", position: 0 },
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

  await createProjectWithAdminMember({
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

  // ─── Canal général ───────────────────────────────────────────────────────

  await prisma.conversation.create({
    data: {
      name: "general",
      isGroup: true,
      members: { connect: { id: admin.id } },
    },
  });
  console.log("✓ Canal général créé (1 membre : admin)");

  console.log("\n✅ Seed terminé : 1 admin GitHub + 3 projets + canal général.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
