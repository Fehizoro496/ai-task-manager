const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");

const { prisma, resetDb, disconnect } = require("./helpers/db");
const { startServer, stopServer, asUser, anonymous } = require("./helpers/api");
const { makeUser, makeAdmin } = require("./helpers/factories");

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
  ctx.admin = await makeAdmin({ email: "admin@test.dev", name: "Admin" });
  ctx.membre = await makeUser({ email: "membre@test.dev", name: "Membre" });
});

describe("POST /api/projects", () => {
  it("crée un projet pour un admin", async () => {
    const res = await asUser(ctx.admin).post("/api/projects", {
      name: "Alpha Mobile",
      description: "Application interne",
      color: "#336699",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.name, "Alpha Mobile");
    assert.equal(res.body.description, "Application interne");
    assert.equal(res.body.color, "#336699");
    assert.equal(res.body.ownerId, ctx.admin.id);
    assert.equal(res.body.taskCounter, 0);

    const enBase = await prisma.project.findUnique({ where: { id: res.body.id } });
    assert.ok(enBase, "le projet doit être persisté");
  });

  it("inscrit le créateur comme membre du projet", async () => {
    const res = await asUser(ctx.admin).post("/api/projects", { name: "Alpha Mobile" });

    const membres = await prisma.projectMember.findMany({
      where: { projectId: res.body.id },
    });
    assert.equal(membres.length, 1);
    assert.equal(membres[0].userId, ctx.admin.id);
  });

  it("déduit le préfixe d'identifiant du nom", async () => {
    const admin = asUser(ctx.admin);
    const cas = [
      ["Alpha Mobile", "AM"],
      ["Refonte Site Web Interne", "RSWI"],
      ["Task", "TAS"],
    ];

    for (const [nom, prefixeAttendu] of cas) {
      const res = await admin.post("/api/projects", { name: nom });
      assert.equal(res.body.identifierPrefix, prefixeAttendu, `pour « ${nom} »`);
    }
  });

  it("respecte un préfixe imposé, en majuscules", async () => {
    const res = await asUser(ctx.admin).post("/api/projects", {
      name: "Alpha Mobile",
      identifierPrefix: "zed",
    });
    assert.equal(res.body.identifierPrefix, "ZED");
  });

  it("extrait le dépôt d'une URL GitHub fournie", async () => {
    const res = await asUser(ctx.admin).post("/api/projects", {
      name: "Alpha Mobile",
      githubRepoUrl: "https://github.com/acme/alpha-mobile",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.githubOwner, "acme");
    assert.equal(res.body.githubRepo, "alpha-mobile");
    assert.equal(res.body.githubRepoUrl, "https://github.com/acme/alpha-mobile");
  });

  it("laisse le projet sans dépôt quand aucune URL n'est fournie", async () => {
    const res = await asUser(ctx.admin).post("/api/projects", { name: "Alpha Mobile" });
    assert.equal(res.body.githubRepoUrl, null);
    assert.equal(res.body.githubOwner, null);
    assert.equal(res.body.githubRepo, null);
  });

  it("crée quand même le projet si le dépôt demandé ne peut pas l'être", async () => {
    // Aucun compte GitHub lié à l'admin : la création du dépôt échoue, le projet
    // doit exister malgré tout et l'appelant être averti.
    const res = await asUser(ctx.admin).post("/api/projects", {
      name: "Alpha Mobile",
      createGithubRepo: true,
    });

    assert.equal(res.status, 201);
    assert.ok(res.body.id, "le projet est créé");
    assert.equal(res.body.githubRepoUrl, null);
    assert.match(res.body.githubRepoWarning, /GitHub/);
  });

  it("refuse un membre non admin", async () => {
    const res = await asUser(ctx.membre).post("/api/projects", { name: "Tentative" });
    assert.equal(res.status, 403);
    assert.equal(await prisma.project.count(), 0);
  });

  it("refuse un appel sans jeton", async () => {
    const res = await anonymous().post("/api/projects", { name: "Tentative" });
    assert.equal(res.status, 401);
  });

  it("rejette un nom vide", async () => {
    const res = await asUser(ctx.admin).post("/api/projects", { name: "" });
    assert.equal(res.status, 400);
    assert.equal(await prisma.project.count(), 0);
  });

  it("rejette une URL de dépôt malformée", async () => {
    const res = await asUser(ctx.admin).post("/api/projects", {
      name: "Alpha Mobile",
      githubRepoUrl: "pas-une-url",
    });
    assert.equal(res.status, 400);
  });

  it("rejette un préfixe trop long", async () => {
    const res = await asUser(ctx.admin).post("/api/projects", {
      name: "Alpha Mobile",
      identifierPrefix: "BEAUCOUPTROPLONG",
    });
    assert.equal(res.status, 400);
  });

  it("rend le projet visible à son créateur et absent pour les autres", async () => {
    const cree = await asUser(ctx.admin).post("/api/projects", { name: "Alpha Mobile" });

    const vueAdmin = await asUser(ctx.admin).get("/api/projects");
    assert.ok(vueAdmin.body.some((p) => p.id === cree.body.id));

    const vueMembre = await asUser(ctx.membre).get("/api/projects");
    assert.equal(
      vueMembre.body.length,
      0,
      "un membre non inscrit au projet ne doit pas le voir",
    );
  });

  it("enchaîne avec la création d'une tâche numérotée sur ce projet", async () => {
    const admin = asUser(ctx.admin);
    const projet = await admin.post("/api/projects", { name: "Beta Web" });

    const tache = await admin.post("/api/tasks", {
      title: "Première tâche",
      projectId: projet.body.id,
    });

    assert.equal(tache.status, 201);
    assert.equal(tache.body.identifier, "BW-001");
  });
});
