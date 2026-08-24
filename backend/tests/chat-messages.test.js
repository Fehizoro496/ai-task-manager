const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");

const { prisma, resetDb, disconnect } = require("./helpers/db");
const { startServer, stopServer, asUser, anonymous } = require("./helpers/api");
const { makeUser, makeAdmin, makeDM, makeMessage } = require("./helpers/factories");

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
  ctx.alice = await makeUser({ email: "alice@test.dev", name: "Alice" });
  ctx.bob = await makeUser({ email: "bob@test.dev", name: "Bob" });
  ctx.carol = await makeUser({ email: "carol@test.dev", name: "Carol" });
  ctx.admin = await makeAdmin({ email: "admin@test.dev", name: "Admin" });
  ctx.conv = await makeDM(ctx.alice.id, ctx.bob.id);
});

describe("POST /api/chat/conversations/:id/messages", () => {
  it("envoie un message texte", async () => {
    const res = await asUser(ctx.alice).post(
      `/api/chat/conversations/${ctx.conv.id}/messages`,
      { content: "Salut Bob" },
    );
    assert.equal(res.status, 201);
    assert.equal(res.body.message.content, "Salut Bob");
    assert.deepEqual(res.body.message.attachments, []);
    assert.equal(res.body.message.deletedAt, null);
    assert.equal(res.body.message.senderId, ctx.alice.id);
  });

  it("nettoie les espaces autour du contenu", async () => {
    const res = await asUser(ctx.alice).post(
      `/api/chat/conversations/${ctx.conv.id}/messages`,
      { content: "  bonjour  " },
    );
    assert.equal(res.body.message.content, "bonjour");
  });

  it("rejette un message sans texte ni pièce jointe", async () => {
    const res = await asUser(ctx.alice).post(
      `/api/chat/conversations/${ctx.conv.id}/messages`,
      { content: "   " },
    );
    assert.equal(res.status, 400);
    assert.equal(await prisma.message.count(), 0);
  });

  it("refuse un utilisateur hors de la conversation", async () => {
    const res = await asUser(ctx.carol).post(
      `/api/chat/conversations/${ctx.conv.id}/messages`,
      { content: "Je m'incruste" },
    );
    assert.equal(res.status, 403);
  });

  it("refuse un appel anonyme", async () => {
    const res = await anonymous().post(
      `/api/chat/conversations/${ctx.conv.id}/messages`,
      { content: "Anonyme" },
    );
    assert.equal(res.status, 401);
  });
});

describe("DELETE /api/chat/messages/:messageId", () => {
  it("permet à l'auteur de supprimer son message (tombstone)", async () => {
    const msg = await makeMessage({
      conversationId: ctx.conv.id,
      senderId: ctx.alice.id,
      content: "À effacer",
      attachments: [{ url: "/uploads/chat/x.png", name: "x.png", mime: "image/png", size: 12 }],
    });

    const res = await asUser(ctx.alice).delete(`/api/chat/messages/${msg.id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.message.content, "");
    assert.deepEqual(res.body.message.attachments, []);
    assert.ok(res.body.message.deletedAt, "un horodatage de suppression est posé");

    // La ligne subsiste en base (suppression douce), contenu et pièces effacés.
    const enBase = await prisma.message.findUnique({ where: { id: msg.id } });
    assert.ok(enBase, "le message reste en base");
    assert.equal(enBase.content, "");
    assert.equal(enBase.attachments, null);
    assert.ok(enBase.deletedAt);
  });

  it("permet à un admin membre de supprimer le message d'autrui", async () => {
    const conv = await makeDM(ctx.alice.id, ctx.admin.id);
    const msg = await makeMessage({ conversationId: conv.id, senderId: ctx.alice.id });

    const res = await asUser(ctx.admin).delete(`/api/chat/messages/${msg.id}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.message.deletedAt);
  });

  it("refuse à un membre non-auteur et non-admin", async () => {
    const msg = await makeMessage({ conversationId: ctx.conv.id, senderId: ctx.alice.id });

    const res = await asUser(ctx.bob).delete(`/api/chat/messages/${msg.id}`);
    assert.equal(res.status, 403);
    const enBase = await prisma.message.findUnique({ where: { id: msg.id } });
    assert.equal(enBase.deletedAt, null, "le message reste intact");
  });

  it("refuse un utilisateur hors de la conversation", async () => {
    const msg = await makeMessage({ conversationId: ctx.conv.id, senderId: ctx.alice.id });
    const res = await asUser(ctx.carol).delete(`/api/chat/messages/${msg.id}`);
    assert.equal(res.status, 403);
  });

  it("répond 404 pour un message inexistant", async () => {
    const res = await asUser(ctx.alice).delete(
      "/api/chat/messages/00000000-0000-0000-0000-000000000000",
    );
    assert.equal(res.status, 404);
  });

  it("reste idempotent sur un message déjà supprimé", async () => {
    const msg = await makeMessage({ conversationId: ctx.conv.id, senderId: ctx.alice.id });
    await asUser(ctx.alice).delete(`/api/chat/messages/${msg.id}`);
    const res = await asUser(ctx.alice).delete(`/api/chat/messages/${msg.id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.message.content, "");
  });
});

describe("aperçu de conversation après suppression", () => {
  it("affiche « Message supprimé »", async () => {
    const msg = await makeMessage({ conversationId: ctx.conv.id, senderId: ctx.alice.id });
    await asUser(ctx.alice).delete(`/api/chat/messages/${msg.id}`);

    const res = await asUser(ctx.bob).get("/api/chat/conversations");
    const conv = res.body.conversations.find((c) => c.id === ctx.conv.id);
    assert.ok(conv, "la conversation est listée");
    assert.equal(conv.lastMessage.content, "Message supprimé");
  });
});
