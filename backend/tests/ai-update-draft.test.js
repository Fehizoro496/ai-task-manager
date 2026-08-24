const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");

const { prisma, resetDb, disconnect } = require("./helpers/db");
const { startServer, stopServer, asUser, anonymous } = require("./helpers/api");
const { makeUser, makeProject, makeAiDraft } = require("./helpers/factories");

const ctx = {};

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
  await disconnect();
});

beforeEach(async () => {
  await resetDb();
  ctx.owner = await makeUser({ email: "owner@test.dev", name: "Owner" });
  ctx.autre = await makeUser({ email: "autre@test.dev", name: "Autre" });
  ctx.projet = await makeProject({ ownerId: ctx.owner.id, name: "Alpha", identifierPrefix: "ALP" });
  ctx.draft = await makeAiDraft({ projectId: ctx.projet.id });
});

describe("PATCH /api/ai/drafts/:id", () => {
  it("enregistre le plan édité par le propriétaire", async () => {
    const plan = {
      tasks: [
        { title: "Configurer le CI", description: "GitHub Actions", labels: ["devops"] },
        { title: "Écrire la doc" },
      ],
    };

    const res = await asUser(ctx.owner).patch(`/api/ai/drafts/${ctx.draft.id}`, { plan });
    assert.equal(res.status, 200);
    assert.equal(res.body.plan.tasks.length, 2);
    assert.equal(res.body.plan.tasks[0].title, "Configurer le CI");
    assert.deepEqual(res.body.plan.tasks[0].labels, ["devops"]);

    const enBase = await prisma.aiDraft.findUnique({ where: { id: ctx.draft.id } });
    assert.equal(enBase.plan.tasks.length, 2);
  });

  it("accepte un plan sans aucune tâche", async () => {
    const res = await asUser(ctx.owner).patch(`/api/ai/drafts/${ctx.draft.id}`, {
      plan: { tasks: [] },
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.plan.tasks, []);
  });

  it("répond 404 pour un non-propriétaire du projet", async () => {
    const res = await asUser(ctx.autre).patch(`/api/ai/drafts/${ctx.draft.id}`, {
      plan: { tasks: [{ title: "Intrusion" }] },
    });
    assert.equal(res.status, 404);
  });

  it("répond 404 pour un brouillon inexistant", async () => {
    const res = await asUser(ctx.owner).patch(
      "/api/ai/drafts/00000000-0000-0000-0000-000000000000",
      { plan: { tasks: [] } },
    );
    assert.equal(res.status, 404);
  });

  it("refuse la modification d'un brouillon déjà approuvé", async () => {
    const approuve = await makeAiDraft({ projectId: ctx.projet.id, approved: true });
    const res = await asUser(ctx.owner).patch(`/api/ai/drafts/${approuve.id}`, {
      plan: { tasks: [{ title: "Trop tard" }] },
    });
    assert.equal(res.status, 400);
  });

  it("rejette un plan mal formé", async () => {
    const res = await asUser(ctx.owner).patch(`/api/ai/drafts/${ctx.draft.id}`, {
      plan: { tasks: [{ description: "sans titre" }] },
    });
    assert.equal(res.status, 400);
  });

  it("rejette une requête sans plan", async () => {
    const res = await asUser(ctx.owner).patch(`/api/ai/drafts/${ctx.draft.id}`, {});
    assert.equal(res.status, 400);
  });

  it("refuse un appel anonyme", async () => {
    const res = await anonymous().patch(`/api/ai/drafts/${ctx.draft.id}`, {
      plan: { tasks: [] },
    });
    assert.equal(res.status, 401);
  });
});
