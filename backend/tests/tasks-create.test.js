const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");

const { prisma, resetDb, disconnect } = require("./helpers/db");
const { startServer, stopServer, asUser, anonymous } = require("./helpers/api");
const { makeUser, makeAdmin, makeProject, addMember } = require("./helpers/factories");

const ctx = {};

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
  await disconnect();
});

// Chaque scénario crée des tâches : on repart d'une base vierge à chaque fois.
beforeEach(async () => {
  await resetDb();
  ctx.admin = await makeAdmin({ email: "admin@test.dev", name: "Admin" });
  ctx.membre = await makeUser({ email: "membre@test.dev", name: "Membre" });
  ctx.projet = await makeProject({
    ownerId: ctx.admin.id,
    name: "Alpha Mobile",
    identifierPrefix: "ALP",
  });
  await addMember(ctx.projet.id, ctx.membre.id);
});

describe("POST /api/tasks", () => {
  it("crée une tâche pour un admin", async () => {
    const res = await asUser(ctx.admin).post("/api/tasks", {
      title: "Corriger le login",
      description: "Le bouton ne répond plus",
      projectId: ctx.projet.id,
      priority: "urgent",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, "Corriger le login");
    assert.equal(res.body.description, "Le bouton ne répond plus");
    assert.equal(res.body.priority, "urgent");
    assert.equal(res.body.projectId, ctx.projet.id);
    assert.equal(res.body.status, "todo", "une tâche naît dans la colonne à faire");
    assert.equal(res.body.assigneeId, null);

    const enBase = await prisma.task.findUnique({ where: { id: res.body.id } });
    assert.ok(enBase, "la tâche doit être persistée");
  });

  it("attribue un identifiant dérivé du préfixe du projet", async () => {
    const res = await asUser(ctx.admin).post("/api/tasks", {
      title: "Première tâche",
      projectId: ctx.projet.id,
    });
    assert.equal(res.body.identifier, "ALP-001");
  });

  it("incrémente le compteur du projet à chaque création", async () => {
    const admin = asUser(ctx.admin);
    const premiere = await admin.post("/api/tasks", { title: "Une", projectId: ctx.projet.id });
    const deuxieme = await admin.post("/api/tasks", { title: "Deux", projectId: ctx.projet.id });
    const troisieme = await admin.post("/api/tasks", { title: "Trois", projectId: ctx.projet.id });

    assert.deepEqual(
      [premiere.body.identifier, deuxieme.body.identifier, troisieme.body.identifier],
      ["ALP-001", "ALP-002", "ALP-003"],
    );

    const projet = await prisma.project.findUnique({ where: { id: ctx.projet.id } });
    assert.equal(projet.taskCounter, 3);
  });

  it("numérote indépendamment deux projets", async () => {
    const autre = await makeProject({
      ownerId: ctx.admin.id,
      name: "Beta Web",
      identifierPrefix: "BET",
    });
    const admin = asUser(ctx.admin);

    const a = await admin.post("/api/tasks", { title: "A", projectId: ctx.projet.id });
    const b = await admin.post("/api/tasks", { title: "B", projectId: autre.id });

    assert.equal(a.body.identifier, "ALP-001");
    assert.equal(b.body.identifier, "BET-001");
  });

  it("prépare une branche GitHub portant l'identifiant", async () => {
    const res = await asUser(ctx.admin).post("/api/tasks", {
      title: "Une tâche",
      projectId: ctx.projet.id,
    });
    assert.equal(res.body.githubBranch, "ALP-001");
    assert.equal(
      res.body.githubBranchUrl,
      null,
      "sans dépôt lié au projet, aucune URL de branche n'est construite",
    );
  });

  it("accepte l'alias snake_case project_id", async () => {
    const res = await asUser(ctx.admin).post("/api/tasks", {
      title: "Via snake_case",
      project_id: ctx.projet.id,
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.projectId, ctx.projet.id);
  });

  it("normalise un statut fourni en minuscules", async () => {
    const res = await asUser(ctx.admin).post("/api/tasks", {
      title: "Déjà en cours",
      projectId: ctx.projet.id,
      status: "in_progress",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, "in_progress");
  });

  it("refuse un membre non admin", async () => {
    const res = await asUser(ctx.membre).post("/api/tasks", {
      title: "Tentative",
      projectId: ctx.projet.id,
    });
    assert.equal(res.status, 403);
    assert.equal(await prisma.task.count(), 0);
  });

  it("refuse un appel sans jeton", async () => {
    const res = await anonymous().post("/api/tasks", {
      title: "Tentative",
      projectId: ctx.projet.id,
    });
    assert.equal(res.status, 401);
  });

  it("rejette un titre vide", async () => {
    const res = await asUser(ctx.admin).post("/api/tasks", {
      title: "",
      projectId: ctx.projet.id,
    });
    assert.equal(res.status, 400);
    assert.equal(await prisma.task.count(), 0);
  });

  it("rejette une création sans projet", async () => {
    const res = await asUser(ctx.admin).post("/api/tasks", { title: "Orpheline" });
    assert.equal(res.status, 400);
  });

  it("répond 404 pour un projet inexistant", async () => {
    const res = await asUser(ctx.admin).post("/api/tasks", {
      title: "Fantôme",
      projectId: "00000000-0000-0000-0000-000000000000",
    });
    assert.equal(res.status, 404);
  });

  it("laisse la tâche créée visible dans « Mes tâches » une fois assignée", async () => {
    const cree = await asUser(ctx.admin).post("/api/tasks", {
      title: "À reprendre",
      projectId: ctx.projet.id,
      priority: "high",
    });
    await prisma.task.update({
      where: { id: cree.body.id },
      data: { assigneeId: ctx.membre.id },
    });

    const res = await asUser(ctx.membre).get("/api/tasks/my");
    assert.equal(res.body.total, 1);
    assert.equal(res.body.tasks[0].identifier, "ALP-001");
    assert.equal(res.body.tasks[0].project.name, "Alpha Mobile");
  });
});

describe("POST /api/projects/:projectId/tasks", () => {
  it("crée une tâche rattachée au projet de l'URL", async () => {
    const res = await asUser(ctx.admin).post(`/api/projects/${ctx.projet.id}/tasks`, {
      title: "Depuis le board",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.projectId, ctx.projet.id);
    assert.equal(res.body.identifier, "ALP-001");
  });

  it("applique les valeurs par défaut de statut et de priorité", async () => {
    const res = await asUser(ctx.admin).post(`/api/projects/${ctx.projet.id}/tasks`, {
      title: "Sans détail",
    });
    assert.equal(res.body.status, "todo");
    assert.equal(res.body.priority, "medium");
  });

  it("refuse un membre non admin", async () => {
    const res = await asUser(ctx.membre).post(`/api/projects/${ctx.projet.id}/tasks`, {
      title: "Tentative",
    });
    assert.equal(res.status, 403);
  });

  it("rejette un titre vide", async () => {
    const res = await asUser(ctx.admin).post(`/api/projects/${ctx.projet.id}/tasks`, {
      title: "",
    });
    assert.equal(res.status, 400);
  });

  it("répond 404 pour un projet inexistant", async () => {
    const res = await asUser(ctx.admin).post(
      "/api/projects/00000000-0000-0000-0000-000000000000/tasks",
      { title: "Fantôme" },
    );
    assert.equal(res.status, 404);
  });
});
