const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

const { resetDb, disconnect } = require("./helpers/db");
const { startServer, stopServer, asUser, anonymous } = require("./helpers/api");
const { makeUser, makeAdmin, makeProject, addMember, makeTask } = require("./helpers/factories");

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date("2026-01-15T09:00:00.000Z").getTime();
/** Échéance à J+n par rapport à un « aujourd'hui » figé. */
const due = (n) => new Date(T0 + n * DAY);
/** Date de création espacée d'une minute : le tri « récentes » reste déterministe. */
const createdAt = (n) => new Date(T0 - 60 * 60 * 1000 + n * 60_000);

/**
 * Jeu de données commun à tous les scénarios de lecture (aucun ne mute la base).
 *
 * Alice porte 8 tâches réparties sur 2 projets, couvrant les 4 priorités, les
 * statuts terminé / non terminé et les échéances nulles.
 */
const fixture = {};

before(async () => {
  await resetDb();
  await startServer();

  fixture.admin = await makeAdmin({ email: "admin@test.dev", name: "Admin" });
  fixture.alice = await makeUser({ email: "alice@test.dev", name: "Alice" });
  fixture.bob = await makeUser({ email: "bob@test.dev", name: "Bob" });

  fixture.alpha = await makeProject({
    ownerId: fixture.admin.id,
    name: "Alpha Mobile",
    identifierPrefix: "ALP",
  });
  fixture.beta = await makeProject({
    ownerId: fixture.admin.id,
    name: "Beta Web",
    identifierPrefix: "BET",
  });
  await addMember(fixture.alpha.id, fixture.alice.id);
  await addMember(fixture.beta.id, fixture.alice.id);
  await addMember(fixture.alpha.id, fixture.bob.id);

  const t = (data) => makeTask(data);
  const alpha = fixture.alpha.id;
  const beta = fixture.beta.id;
  const alice = fixture.alice.id;

  // Ordre d'insertion = ordre de `createdAt`, exploité par le tri « récentes ».
  await t({ projectId: alpha, assigneeId: alice, identifier: "ALP-001", title: "Corriger le login", priority: "urgent", status: "TODO", dueDate: due(1), createdAt: createdAt(1) });
  await t({ projectId: alpha, assigneeId: alice, identifier: "ALP-002", title: "Refonte du dashboard", priority: "high", status: "IN_PROGRESS", dueDate: due(3), createdAt: createdAt(2) });
  await t({ projectId: alpha, assigneeId: alice, identifier: "ALP-003", title: "Migration base", priority: "medium", status: "DONE", dueDate: due(-2), createdAt: createdAt(3) });
  await t({ projectId: alpha, assigneeId: alice, identifier: "ALP-004", title: "Ajouter les filtres", priority: "low", status: "TODO", dueDate: null, createdAt: createdAt(4) });
  await t({ projectId: beta, assigneeId: alice, identifier: "BET-001", title: "Page de connexion", priority: "urgent", status: "IN_REVIEW", dueDate: due(2), createdAt: createdAt(5) });
  await t({ projectId: beta, assigneeId: alice, identifier: "BET-002", title: "Export CSV", priority: "high", status: "TODO", dueDate: null, createdAt: createdAt(6) });
  await t({ projectId: beta, assigneeId: alice, identifier: "BET-003", title: "Nettoyer le CSS", priority: "medium", status: "DONE", dueDate: due(10), createdAt: createdAt(7) });
  await t({ projectId: beta, assigneeId: alice, identifier: "BET-004", title: "Documentation API", priority: "low", status: "TODO", dueDate: due(5), createdAt: createdAt(8) });

  // Tâches d'un autre assigné, et tâches sans assigné : hors périmètre d'Alice.
  await t({ projectId: alpha, assigneeId: fixture.bob.id, identifier: "ALP-005", title: "Tâche de Bob", priority: "urgent", status: "TODO", dueDate: due(1), createdAt: createdAt(9) });
  await t({ projectId: beta, assigneeId: fixture.bob.id, identifier: "BET-005", title: "Autre tâche de Bob", priority: "low", status: "DONE", createdAt: createdAt(10) });
  await t({ projectId: alpha, identifier: "ALP-006", title: "Non assignée Alpha", priority: "high", status: "TODO", createdAt: createdAt(11) });
  await t({ projectId: beta, identifier: "BET-006", title: "Non assignée Beta", priority: "medium", status: "TODO", createdAt: createdAt(12) });
});

after(async () => {
  await stopServer();
  await disconnect();
});

/** Identifiants renvoyés, dans l'ordre de la réponse. */
const ids = (res) => res.body.tasks.map((t) => t.identifier);
const query = (params) => `/api/tasks/my${params ? `?${params}` : ""}`;

describe("GET /api/tasks/my — périmètre", () => {
  it("refuse un appel sans jeton", async () => {
    const res = await anonymous().get(query());
    assert.equal(res.status, 401);
  });

  it("ne renvoie à un membre que les tâches qui lui sont assignées", async () => {
    const res = await asUser(fixture.alice).get(query("limit=100"));
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 8);
    assert.equal(res.body.tasks.length, 8);
    assert.ok(res.body.tasks.every((t) => t.assigneeId === fixture.alice.id));
  });

  it("exclut les tâches d'un autre assigné, même dans un projet dont le membre fait partie", async () => {
    const res = await asUser(fixture.alice).get(query("limit=100"));
    assert.ok(!ids(res).includes("ALP-005"), "une tâche de Bob dans Alpha ne doit pas remonter");
    assert.ok(!ids(res).includes("ALP-006"), "une tâche non assignée ne doit pas remonter");
  });

  it("renvoie à chaque membre son propre périmètre", async () => {
    const res = await asUser(fixture.bob).get(query("limit=100"));
    assert.equal(res.body.total, 2);
    assert.deepEqual(ids(res).sort(), ["ALP-005", "BET-005"]);
  });

  it("renvoie toutes les tâches à un admin, assignées ou non", async () => {
    const res = await asUser(fixture.admin).get(query("limit=100"));
    assert.equal(res.body.total, 12);
    assert.ok(ids(res).includes("ALP-006"), "l'admin voit aussi les tâches non assignées");
    assert.ok(ids(res).includes("BET-005"), "l'admin voit les tâches des autres");
  });

  it("expose le projet porteur de chaque tâche", async () => {
    const res = await asUser(fixture.alice).get(query("q=ALP-001"));
    assert.equal(res.body.tasks.length, 1);
    assert.deepEqual(res.body.tasks[0].project, {
      id: fixture.alpha.id,
      name: "Alpha Mobile",
      color: null,
    });
  });
});

describe("GET /api/tasks/my — filtres", () => {
  const alice = () => asUser(fixture.alice);

  it("scope=active écarte les tâches terminées", async () => {
    const res = await alice().get(query("scope=active&limit=100"));
    assert.equal(res.body.total, 6);
    assert.ok(res.body.tasks.every((t) => t.status !== "done"));
  });

  it("scope=done ne garde que les tâches terminées", async () => {
    const res = await alice().get(query("scope=done&limit=100"));
    assert.equal(res.body.total, 2);
    assert.deepEqual(ids(res).sort(), ["ALP-003", "BET-003"]);
  });

  it("actives + terminées reconstituent le total", async () => {
    const [all, active, done] = await Promise.all([
      alice().get(query("limit=100")),
      alice().get(query("scope=active&limit=100")),
      alice().get(query("scope=done&limit=100")),
    ]);
    assert.equal(active.body.total + done.body.total, all.body.total);
  });

  it("recherche dans le titre", async () => {
    const res = await alice().get(query("q=login&limit=100"));
    assert.deepEqual(ids(res), ["ALP-001"]);
  });

  it("recherche insensible à la casse", async () => {
    const res = await alice().get(query("q=LOGIN&limit=100"));
    assert.deepEqual(ids(res), ["ALP-001"]);
  });

  it("recherche par identifiant", async () => {
    const res = await alice().get(query("q=BET-00&limit=100"));
    assert.deepEqual(ids(res).sort(), ["BET-001", "BET-002", "BET-003", "BET-004"]);
  });

  it("recherche par nom de projet", async () => {
    const res = await alice().get(query("q=Alpha&limit=100"));
    assert.deepEqual(ids(res).sort(), ["ALP-001", "ALP-002", "ALP-003", "ALP-004"]);
  });

  it("neutralise les jokers LIKE saisis par l'utilisateur", async () => {
    for (const joker of ["%", "_"]) {
      const res = await alice().get(query(`q=${encodeURIComponent(joker)}&limit=100`));
      assert.equal(res.body.total, 0, `« ${joker} » doit être traité comme un caractère littéral`);
    }
  });

  it("filtre sur une priorité", async () => {
    const res = await alice().get(query("priority=urgent&limit=100"));
    assert.deepEqual(ids(res).sort(), ["ALP-001", "BET-001"]);
  });

  it("filtre sur plusieurs priorités", async () => {
    const res = await alice().get(query("priority=urgent,high&limit=100"));
    assert.equal(res.body.total, 4);
    assert.ok(res.body.tasks.every((t) => ["urgent", "high"].includes(t.priority)));
  });

  it("filtre sur un projet", async () => {
    const res = await alice().get(query(`projectId=${fixture.alpha.id}&limit=100`));
    assert.equal(res.body.total, 4);
    assert.ok(res.body.tasks.every((t) => t.projectId === fixture.alpha.id));
  });

  it("filtre sur plusieurs projets", async () => {
    const res = await alice().get(
      query(`projectId=${fixture.alpha.id},${fixture.beta.id}&limit=100`),
    );
    assert.equal(res.body.total, 8);
  });

  it("combine scope, priorité et recherche", async () => {
    const res = await alice().get(query("scope=active&priority=urgent&limit=100"));
    assert.deepEqual(ids(res).sort(), ["ALP-001", "BET-001"]);

    const combined = await alice().get(query("scope=active&priority=urgent&q=Beta&limit=100"));
    assert.deepEqual(ids(combined), ["BET-001"]);
  });

  it("s'applique aussi au périmètre admin", async () => {
    const res = await asUser(fixture.admin).get(query("scope=done&limit=100"));
    assert.deepEqual(ids(res).sort(), ["ALP-003", "BET-003", "BET-005"]);
  });
});

describe("GET /api/tasks/my — tri", () => {
  const alice = () => asUser(fixture.alice);

  it("due_asc classe par échéance croissante, sans échéance en dernier", async () => {
    const res = await alice().get(query("sort=due_asc&limit=100"));
    const order = ids(res);
    assert.deepEqual(order.slice(0, 6), [
      "ALP-003", // J-2
      "ALP-001", // J+1
      "BET-001", // J+2
      "ALP-002", // J+3
      "BET-004", // J+5
      "BET-003", // J+10
    ]);
    assert.deepEqual(order.slice(6).sort(), ["ALP-004", "BET-002"]);
  });

  it("due_desc inverse l'ordre mais garde les sans-échéance en dernier", async () => {
    const res = await alice().get(query("sort=due_desc&limit=100"));
    const order = ids(res);
    assert.deepEqual(order.slice(0, 6), [
      "BET-003",
      "BET-004",
      "ALP-002",
      "BET-001",
      "ALP-001",
      "ALP-003",
    ]);
    assert.deepEqual(order.slice(6).sort(), ["ALP-004", "BET-002"]);
  });

  it("priority suit l'ordre métier urgent → faible, puis l'échéance", async () => {
    const res = await alice().get(query("sort=priority&limit=100"));
    assert.deepEqual(ids(res), [
      "ALP-001", // urgent, J+1
      "BET-001", // urgent, J+2
      "ALP-002", // high, J+3
      "BET-002", // high, sans échéance
      "ALP-003", // medium, J-2
      "BET-003", // medium, J+10
      "BET-004", // low, J+5
      "ALP-004", // low, sans échéance
    ]);
  });

  it("recent classe de la plus récente à la plus ancienne", async () => {
    const res = await alice().get(query("sort=recent&limit=100"));
    assert.deepEqual(ids(res), [
      "BET-004",
      "BET-003",
      "BET-002",
      "BET-001",
      "ALP-004",
      "ALP-003",
      "ALP-002",
      "ALP-001",
    ]);
  });

  it("conserve l'ordre d'un tri d'une page à l'autre", async () => {
    const collected = [];
    let offset = 0;
    for (let i = 0; i < 5; i += 1) {
      const res = await alice().get(query(`sort=priority&limit=3&offset=${offset}`));
      collected.push(...ids(res));
      if (!res.body.hasMore) break;
      offset += res.body.tasks.length;
    }
    assert.deepEqual(collected, [
      "ALP-001",
      "BET-001",
      "ALP-002",
      "BET-002",
      "ALP-003",
      "BET-003",
      "BET-004",
      "ALP-004",
    ]);
  });
});

describe("GET /api/tasks/my — pagination", () => {
  const alice = () => asUser(fixture.alice);

  it("découpe la liste en lots et annonce le total global", async () => {
    const first = await alice().get(query("limit=3&offset=0"));
    assert.equal(first.body.tasks.length, 3);
    assert.equal(first.body.total, 8);
    assert.equal(first.body.limit, 3);
    assert.equal(first.body.offset, 0);
    assert.equal(first.body.hasMore, true);

    const last = await alice().get(query("limit=3&offset=6"));
    assert.equal(last.body.tasks.length, 2);
    assert.equal(last.body.total, 8);
    assert.equal(last.body.hasMore, false);
  });

  it("parcourt toute la liste sans doublon ni oubli", async () => {
    const seen = [];
    let offset = 0;
    let guard = 0;
    let hasMore = true;
    while (hasMore && guard < 10) {
      const res = await alice().get(query(`limit=3&offset=${offset}`));
      seen.push(...ids(res));
      hasMore = res.body.hasMore;
      offset += res.body.tasks.length;
      guard += 1;
    }
    assert.equal(seen.length, 8);
    assert.equal(new Set(seen).size, 8, "aucune tâche ne doit apparaître deux fois");
  });

  it("renvoie une page vide au-delà de la fin", async () => {
    for (const offset of [8, 100]) {
      const res = await alice().get(query(`limit=3&offset=${offset}`));
      assert.equal(res.body.tasks.length, 0);
      assert.equal(res.body.hasMore, false);
    }
  });

  it("n'annonce plus de suite quand tout tient dans un lot", async () => {
    const res = await alice().get(query("limit=100"));
    assert.equal(res.body.hasMore, false);
    assert.equal(res.body.tasks.length, res.body.total);
  });

  it("applique une taille de lot de 30 par défaut", async () => {
    const res = await alice().get(query());
    assert.equal(res.body.limit, 30);
    assert.equal(res.body.offset, 0);
  });
});

describe("GET /api/tasks/my — robustesse des paramètres", () => {
  const alice = () => asUser(fixture.alice);

  it("plafonne la taille de lot demandée", async () => {
    const res = await alice().get(query("limit=999"));
    assert.equal(res.body.limit, 100);
  });

  it("ramène une taille de lot absurde dans les bornes", async () => {
    const zero = await alice().get(query("limit=0"));
    assert.equal(zero.body.limit, 1);

    const nonNumerique = await alice().get(query("limit=abc"));
    assert.equal(nonNumerique.body.limit, 30);
  });

  it("ramène un offset négatif à zéro", async () => {
    const res = await alice().get(query("limit=3&offset=-5"));
    assert.equal(res.body.offset, 0);
    assert.equal(res.body.tasks.length, 3);
  });

  it("retombe sur le tri par défaut si le tri demandé est inconnu", async () => {
    const [inconnu, defaut] = await Promise.all([
      alice().get(query("sort=nimportequoi&limit=100")),
      alice().get(query("sort=due_asc&limit=100")),
    ]);
    assert.deepEqual(ids(inconnu), ids(defaut));
  });

  it("retombe sur le périmètre complet si le scope demandé est inconnu", async () => {
    const res = await alice().get(query("scope=bidon&limit=100"));
    assert.equal(res.body.total, 8);
  });

  it("ne renvoie rien quand aucune valeur du filtre n'est reconnue", async () => {
    const priorite = await alice().get(query("priority=inexistante&limit=100"));
    assert.equal(priorite.body.total, 0);
    assert.equal(priorite.body.tasks.length, 0);

    const projet = await alice().get(query("projectId=pas-un-uuid&limit=100"));
    assert.equal(projet.body.total, 0);
    assert.equal(projet.body.tasks.length, 0);
  });

  it("ignore les valeurs vides d'une liste de filtres", async () => {
    const res = await alice().get(query("priority=urgent,,&limit=100"));
    assert.deepEqual(ids(res).sort(), ["ALP-001", "BET-001"]);
  });
});
