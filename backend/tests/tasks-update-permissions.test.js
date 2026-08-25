const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");

const { prisma, resetDb, disconnect } = require("./helpers/db");
const { startServer, stopServer, asUser, anonymous } = require("./helpers/api");
const { makeUser, makeAdmin, makeProject, addMember, makeTask } = require("./helpers/factories");

const ctx = {};

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
  await disconnect();
});

/**
 * Deux membres ordinaires face à une même tâche : `assigne` la porte,
 * `autre` ne fait que partager le projet.
 */
beforeEach(async () => {
  await resetDb();
  ctx.admin = await makeAdmin({ email: "admin@test.dev", name: "Admin" });
  ctx.assigne = await makeUser({ email: "assigne@test.dev", name: "Assigné" });
  ctx.autre = await makeUser({ email: "autre@test.dev", name: "Autre membre" });
  ctx.etranger = await makeUser({ email: "etranger@test.dev", name: "Étranger" });
  ctx.projet = await makeProject({
    ownerId: ctx.admin.id,
    name: "Alpha Mobile",
    identifierPrefix: "ALP",
  });
  await addMember(ctx.projet.id, ctx.assigne.id);
  await addMember(ctx.projet.id, ctx.autre.id);
});

describe("PUT /api/tasks/:id — tâche assignée", () => {
  beforeEach(async () => {
    ctx.tache = await makeTask({
      projectId: ctx.projet.id,
      title: "Corriger le login",
      assigneeId: ctx.assigne.id,
    });
  });

  it("laisse l'assigné modifier sa tâche", async () => {
    const res = await asUser(ctx.assigne).put(`/api/tasks/${ctx.tache.id}`, {
      title: "Corriger le login social",
      description: "Le bouton Google ne répond plus",
      priority: "urgent",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.title, "Corriger le login social");
    assert.equal(res.body.priority, "urgent");

    const enBase = await prisma.task.findUnique({ where: { id: ctx.tache.id } });
    assert.equal(enBase.description, "Le bouton Google ne répond plus");
  });

  it("laisse l'assigné changer le statut de sa tâche", async () => {
    const res = await asUser(ctx.assigne).put(`/api/tasks/${ctx.tache.id}`, {
      status: "in_progress",
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "in_progress");
  });

  it("refuse un autre membre du projet", async () => {
    const res = await asUser(ctx.autre).put(`/api/tasks/${ctx.tache.id}`, {
      title: "Détournement",
    });

    assert.equal(res.status, 403);
    const enBase = await prisma.task.findUnique({ where: { id: ctx.tache.id } });
    assert.equal(enBase.title, "Corriger le login", "la tâche ne doit pas bouger");
  });

  it("laisse l'admin modifier la tâche d'un autre", async () => {
    const res = await asUser(ctx.admin).put(`/api/tasks/${ctx.tache.id}`, {
      priority: "low",
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.priority, "low");
  });

  it("cache la tâche à un non-membre du projet", async () => {
    const res = await asUser(ctx.etranger).put(`/api/tasks/${ctx.tache.id}`, {
      title: "Depuis l'extérieur",
    });
    assert.equal(res.status, 404, "un étranger n'apprend pas que la tâche existe");
  });

  it("refuse un appel sans jeton", async () => {
    const res = await anonymous().put(`/api/tasks/${ctx.tache.id}`, { title: "Anonyme" });
    assert.equal(res.status, 401);
  });
});

describe("PUT /api/tasks/:id — tâche non assignée", () => {
  beforeEach(async () => {
    ctx.libre = await makeTask({
      projectId: ctx.projet.id,
      title: "À prendre",
      assigneeId: null,
    });
  });

  it("laisse tout membre du projet la modifier", async () => {
    const res = await asUser(ctx.autre).put(`/api/tasks/${ctx.libre.id}`, {
      title: "À prendre en priorité",
      priority: "high",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.title, "À prendre en priorité");
    assert.equal(res.body.priority, "high");
  });

  it("cache la tâche à un non-membre du projet", async () => {
    const res = await asUser(ctx.etranger).put(`/api/tasks/${ctx.libre.id}`, {
      title: "Depuis l'extérieur",
    });
    assert.equal(res.status, 404);
  });

  it("se referme dès qu'elle est assignée", async () => {
    await asUser(ctx.assigne).patch(`/api/tasks/${ctx.libre.id}/assign`);

    const res = await asUser(ctx.autre).put(`/api/tasks/${ctx.libre.id}`, {
      title: "Trop tard",
    });
    assert.equal(res.status, 403);
  });
});

describe("PATCH /api/tasks/:id/move", () => {
  it("laisse l'assigné déplacer sa tâche", async () => {
    const tache = await makeTask({ projectId: ctx.projet.id, assigneeId: ctx.assigne.id });
    const res = await asUser(ctx.assigne).patch(`/api/tasks/${tache.id}/move`, {
      status: "done",
      order: 0,
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "done");
  });

  it("laisse un membre déplacer une tâche libre", async () => {
    const tache = await makeTask({ projectId: ctx.projet.id, assigneeId: null });
    const res = await asUser(ctx.autre).patch(`/api/tasks/${tache.id}/move`, {
      status: "in_progress",
      order: 0,
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "in_progress");
  });

  it("refuse le déplacement de la tâche d'un autre", async () => {
    const tache = await makeTask({ projectId: ctx.projet.id, assigneeId: ctx.assigne.id });
    const res = await asUser(ctx.autre).patch(`/api/tasks/${tache.id}/move`, {
      status: "done",
      order: 0,
    });

    assert.equal(res.status, 403);
    const enBase = await prisma.task.findUnique({ where: { id: tache.id } });
    assert.equal(enBase.status, "TODO");
  });
});

describe("PATCH /api/projects/:projectId/tasks/reorder", () => {
  it("laisse un membre réordonner une colonne sans changer les statuts", async () => {
    const mienne = await makeTask({
      projectId: ctx.projet.id,
      assigneeId: ctx.autre.id,
      status: "TODO",
      position: 0,
    });
    const autrui = await makeTask({
      projectId: ctx.projet.id,
      assigneeId: ctx.assigne.id,
      status: "TODO",
      position: 1,
    });

    const res = await asUser(ctx.autre).patch(`/api/projects/${ctx.projet.id}/tasks/reorder`, {
      columns: { todo: [autrui.id, mienne.id] },
    });

    assert.equal(res.status, 200);
    const apres = await prisma.task.findMany({
      where: { id: { in: [mienne.id, autrui.id] } },
      orderBy: { position: "asc" },
    });
    assert.deepEqual(
      apres.map((t) => t.id),
      [autrui.id, mienne.id],
      "l'ordre d'affichage du board reste collectif",
    );
  });

  it("ignore le changement de colonne d'une tâche assignée à un autre", async () => {
    const autrui = await makeTask({
      projectId: ctx.projet.id,
      assigneeId: ctx.assigne.id,
      status: "TODO",
    });

    const res = await asUser(ctx.autre).patch(`/api/projects/${ctx.projet.id}/tasks/reorder`, {
      columns: { done: [autrui.id] },
    });

    assert.equal(res.status, 200);
    const enBase = await prisma.task.findUnique({ where: { id: autrui.id } });
    assert.equal(enBase.status, "TODO", "le statut d'une tâche d'autrui reste intact");
  });

  it("laisse l'admin déplacer n'importe quelle tâche", async () => {
    const autrui = await makeTask({
      projectId: ctx.projet.id,
      assigneeId: ctx.assigne.id,
      status: "TODO",
    });

    const res = await asUser(ctx.admin).patch(`/api/projects/${ctx.projet.id}/tasks/reorder`, {
      columns: { done: [autrui.id] },
    });

    assert.equal(res.status, 200);
    const enBase = await prisma.task.findUnique({ where: { id: autrui.id } });
    assert.equal(enBase.status, "DONE");
  });
});
