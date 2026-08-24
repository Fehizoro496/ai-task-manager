const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");

const { prisma, resetDb, disconnect } = require("./helpers/db");
const { startServer, stopServer, asUser, anonymous } = require("./helpers/api");
const { makeUser, makeAdmin, makeProject, addMember, makeTask } = require("./helpers/factories");

const ctx = {};

/** Force l'`updatedAt` d'une tâche : le champ est piloté par Prisma (@updatedAt),
 *  seul du SQL brut permet de dater une tâche dans une période passée. */
const setUpdatedAt = (taskId, date) =>
  prisma.$executeRaw`UPDATE "Task" SET "updatedAt" = ${date} WHERE id = ${taskId}`;

const pad2 = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
  await disconnect();
});

beforeEach(async () => {
  await resetDb();
  ctx.admin = await makeAdmin({ email: "admin@test.dev", name: "Admin" });
  ctx.membre = await makeUser({ email: "membre@test.dev", name: "Membre" });
  ctx.projet = await makeProject({
    ownerId: ctx.admin.id,
    name: "Alpha Mobile",
    identifierPrefix: "ALP",
    color: "#123456",
  });
  await addMember(ctx.projet.id, ctx.membre.id);
});

describe("GET /api/reports/overview — période", () => {
  it("répond par défaut sur le jour courant", async () => {
    const res = await asUser(ctx.admin).get("/api/reports/overview");
    assert.equal(res.status, 200);
    assert.equal(res.body.range.unit, "day");
    assert.equal(res.body.range.anchor, isoDate(new Date()));
    // Jour → 24 sous-segments horaires pour la timeline.
    assert.equal(res.body.completionByDay.length, 24);
    assert.equal(res.body.completionByDay[0].label, "0h");
    assert.equal(res.body.completionByDay[23].label, "23h");
  });

  it("retombe sur le jour quand l'unité est invalide", async () => {
    const res = await asUser(ctx.admin).get("/api/reports/overview?unit=year");
    assert.equal(res.body.range.unit, "day");
  });

  it("découpe une semaine en 7 jours et démarre le lundi", async () => {
    // Ancre un mercredi (2026-08-26) → semaine du lundi 24 au dimanche 30.
    const res = await asUser(ctx.admin).get(
      "/api/reports/overview?unit=week&anchor=2026-08-26",
    );
    assert.equal(res.body.range.unit, "week");
    assert.equal(res.body.range.start, "2026-08-24");
    assert.equal(res.body.range.end, "2026-08-31");
    assert.equal(res.body.completionByDay.length, 7);
    assert.equal(
      res.body.range.label,
      "Semaine du 24 au 30 août 2026",
    );
  });

  it("découpe un mois selon son nombre de jours", async () => {
    const res = await asUser(ctx.admin).get(
      "/api/reports/overview?unit=month&anchor=2026-02-15",
    );
    assert.equal(res.body.range.start, "2026-02-01");
    assert.equal(res.body.range.end, "2026-03-01");
    assert.equal(res.body.completionByDay.length, 28);
    assert.equal(res.body.range.label, "février 2026");
  });

  it("libelle une semaine à cheval sur deux mois", async () => {
    // 2026-09-30 (mercredi) → semaine du 28 sept. au 4 oct.
    const res = await asUser(ctx.admin).get(
      "/api/reports/overview?unit=week&anchor=2026-09-30",
    );
    assert.equal(res.body.range.label, "Semaine du 28 sept. au 4 oct. 2026");
  });

  it("libelle un jour précis", async () => {
    const res = await asUser(ctx.admin).get(
      "/api/reports/overview?unit=day&anchor=2026-08-24",
    );
    assert.equal(res.body.range.label, "24 août 2026");
  });
});

describe("GET /api/reports/overview — agrégats", () => {
  it("ne compte que les tâches actives dans la période", async () => {
    // Deux tâches touchées aujourd'hui, une backdatée le mois dernier.
    const recente = await makeTask({ projectId: ctx.projet.id, status: "DONE" });
    await makeTask({ projectId: ctx.projet.id, status: "TODO" });
    const ancienne = await makeTask({ projectId: ctx.projet.id, status: "TODO" });
    await setUpdatedAt(ancienne.id, new Date("2026-07-01T10:00:00.000Z"));

    const res = await asUser(ctx.admin).get("/api/reports/overview");
    assert.equal(res.body.totals.tasks, 2, "la tâche du mois passé est exclue");
    assert.equal(res.body.totals.done, 1);
    assert.equal(res.body.totals.completionRate, 50);
    assert.ok(recente);
  });

  it("renvoie une période vide sans activité", async () => {
    await makeTask({ projectId: ctx.projet.id, status: "DONE" });
    const res = await asUser(ctx.admin).get(
      "/api/reports/overview?unit=month&anchor=2020-01-01",
    );
    assert.equal(res.body.totals.tasks, 0);
    assert.equal(res.body.totals.completionRate, 0);
    assert.deepEqual(
      res.body.byStatus.map((s) => s.count),
      [0, 0, 0, 0],
    );
  });

  it("ventile par statut, priorité et projet", async () => {
    await makeTask({ projectId: ctx.projet.id, status: "DONE", priority: "urgent" });
    await makeTask({ projectId: ctx.projet.id, status: "TODO", priority: "urgent" });
    await makeTask({ projectId: ctx.projet.id, status: "IN_PROGRESS", priority: "low" });

    const res = await asUser(ctx.admin).get("/api/reports/overview");

    const status = Object.fromEntries(res.body.byStatus.map((s) => [s.key, s.count]));
    assert.deepEqual(status, { TODO: 1, IN_PROGRESS: 1, IN_REVIEW: 0, DONE: 1 });

    const prio = Object.fromEntries(res.body.byPriority.map((p) => [p.key, p.count]));
    assert.equal(prio.urgent, 2);
    assert.equal(prio.low, 1);

    assert.equal(res.body.byProject.length, 1);
    assert.equal(res.body.byProject[0].name, "Alpha Mobile");
    assert.equal(res.body.byProject[0].total, 3);
    assert.equal(res.body.byProject[0].done, 1);
    assert.equal(res.body.byProject[0].active, 1);
  });

  it("classe les contributeurs par nombre de tâches assignées", async () => {
    await makeTask({ projectId: ctx.projet.id, assigneeId: ctx.membre.id, status: "DONE" });
    await makeTask({ projectId: ctx.projet.id, assigneeId: ctx.membre.id, status: "TODO" });
    await makeTask({ projectId: ctx.projet.id, assigneeId: null, status: "TODO" });

    const res = await asUser(ctx.admin).get("/api/reports/overview");
    assert.equal(res.body.topAssignees.length, 1);
    assert.equal(res.body.topAssignees[0].userId, ctx.membre.id);
    assert.equal(res.body.topAssignees[0].assigned, 2);
    assert.equal(res.body.topAssignees[0].done, 1);
    // Projets et contributeurs actifs sont dérivés de la période.
    assert.equal(res.body.totals.projects, 1);
    assert.equal(res.body.totals.members, 1);
  });

  it("répartit les tâches terminées dans la timeline", async () => {
    await makeTask({ projectId: ctx.projet.id, status: "DONE" });
    await makeTask({ projectId: ctx.projet.id, status: "DONE" });
    await makeTask({ projectId: ctx.projet.id, status: "TODO" });

    const res = await asUser(ctx.admin).get("/api/reports/overview");
    const totalTermine = res.body.completionByDay.reduce((s, b) => s + b.completed, 0);
    assert.equal(totalTermine, 2, "seules les tâches DONE alimentent la timeline");
  });
});

describe("GET /api/reports/overview — accès", () => {
  it("limite un non-admin à ses projets", async () => {
    // Projet d'un tiers dont le membre n'est pas partie prenante.
    const tiers = await makeUser({ email: "tiers@test.dev", name: "Tiers" });
    const autreProjet = await makeProject({ ownerId: tiers.id, name: "Beta", identifierPrefix: "BET" });
    await makeTask({ projectId: autreProjet.id, status: "DONE" });
    await makeTask({ projectId: ctx.projet.id, assigneeId: ctx.membre.id, status: "TODO" });

    const res = await asUser(ctx.membre).get("/api/reports/overview");
    assert.equal(res.body.totals.tasks, 1, "le projet du tiers reste invisible");
    assert.equal(res.body.byProject[0].name, "Alpha Mobile");
  });

  it("refuse un appel anonyme", async () => {
    const res = await anonymous().get("/api/reports/overview");
    assert.equal(res.status, 401);
  });
});
