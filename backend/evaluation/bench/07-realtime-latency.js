/**
 * ── Chapitre VII.IV — Réactivité du système temps réel ───────────────────────
 *
 * Mesure la latence de propagation temps réel : temps écoulé entre une
 * mutation REST (mise à jour d'une tâche) et la réception du broadcast
 * Socket.IO correspondant (`task:updated`) par un client abonné à la room
 * `project:<id>`. C'est la latence réellement perçue par les autres membres
 * quand une carte du tableau change.
 *
 * On mesure aussi le temps d'établissement de la connexion socket (handshake).
 *
 * Prérequis : serveur démarré + au moins un projet contenant une tâche + un
 * utilisateur ADMIN (la mise à jour de tâche est réservée à l'admin).
 *   node evaluation/bench/07-realtime-latency.js
 *
 * Variables : EVAL_RT_ITER (déf. 30).
 */
const path = require("path");
const { performance } = require("perf_hooks");
const { request } = require("../lib/http");
const { getToken } = require("../lib/auth");
const { summarize } = require("../lib/stats");
const { fmt, markdownTable, printSection } = require("../lib/table");
const report = require("../lib/report");
const env = require("../lib/env");
const prisma = require("../../src/prisma/client");

const ITER = parseInt(process.env.EVAL_RT_ITER, 10) || 30;

// socket.io-client n'est pas une dépendance du backend : on le résout depuis
// le frontend (même monorepo). Fallback sur une éventuelle install locale.
const loadIoClient = () => {
  const candidates = [
    path.resolve(__dirname, "../../../frontend/node_modules/socket.io-client"),
    "socket.io-client",
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* essai suivant */
    }
  }
  throw new Error(
    "socket.io-client introuvable. Installe-le dans backend (npm i -D socket.io-client) " +
      "ou assure-toi que frontend/node_modules/socket.io-client existe.",
  );
};

const connect = (io, token) =>
  new Promise((resolve, reject) => {
    const t0 = performance.now();
    const socket = io(env.apiUrl, {
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
    });
    socket.on("connect", () => resolve({ socket, connectMs: performance.now() - t0 }));
    socket.on("connect_error", (e) => reject(new Error(`connect_error: ${e.message}`)));
    setTimeout(() => reject(new Error("timeout connexion socket (5s)")), 5000);
  });

// Attend le prochain `task:updated` concernant `taskId`.
const waitForUpdate = (socket, taskId, timeoutMs = 5000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("task:updated", handler);
      reject(new Error("timeout event task:updated"));
    }, timeoutMs);
    const handler = (payload) => {
      const id = payload?.id ?? payload?.task?.id;
      if (id === taskId) {
        clearTimeout(timer);
        socket.off("task:updated", handler);
        resolve();
      }
    };
    socket.on("task:updated", handler);
  });

const main = async () => {
  console.log("═══ VII.IV — Réactivité du système temps réel ═══");
  const { token, user } = await getToken();
  if (user.role !== "ADMIN") {
    console.error("✗ La mise à jour de tâche exige un ADMIN. Utilise EVAL_USER_EMAIL d'un admin.");
    process.exitCode = 1;
    return;
  }

  // Trouver un projet avec au moins une tâche.
  const projects = await request("/api/projects", { token });
  if (!Array.isArray(projects.body) || projects.body.length === 0) {
    console.error("✗ Aucun projet en base.");
    process.exitCode = 1;
    return;
  }
  let target = null;
  for (const p of projects.body) {
    const tasksRes = await request(`/api/projects/${p.id}/tasks`, { token });
    // L'endpoint renvoie { tasks: [...] } ; on tolère aussi un tableau nu.
    const list = Array.isArray(tasksRes.body)
      ? tasksRes.body
      : tasksRes.body?.tasks;
    const task = Array.isArray(list) ? list[0] : null;
    if (task) {
      target = { projectId: p.id, task };
      break;
    }
  }
  if (!target) {
    console.error("✗ Aucun projet ne contient de tâche. Crée au moins une tâche (npm run seed:data).");
    process.exitCode = 1;
    return;
  }
  console.log(`Cible : projet ${target.projectId}, tâche ${target.task.id}`);

  const io = loadIoClient();
  const { socket, connectMs } = await connect(io, token);
  console.log(`Connexion socket établie en ${fmt(connectMs, 1)} ms`);

  socket.emit("join_project", target.projectId);
  await new Promise((r) => setTimeout(r, 300)); // laisser le join s'établir

  // Valeur bénigne : on renvoie la position courante (pas de changement réel),
  // mais l'update émet toujours l'event → on mesure la propagation.
  const position = target.task.position ?? 0;

  const latencies = [];
  let failures = 0;
  for (let i = 0; i < ITER; i++) {
    try {
      const gotEvent = waitForUpdate(socket, target.task.id);
      const t0 = performance.now();
      const res = await request(`/api/tasks/${target.task.id}`, {
        method: "PUT",
        token,
        body: { position },
      });
      if (!res.ok) {
        failures++;
        continue;
      }
      await gotEvent;
      latencies.push(performance.now() - t0);
    } catch (e) {
      failures++;
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  socket.close();

  const s = summarize(latencies);
  const rows = [
    ["Connexion socket (handshake)", fmt(connectMs, 1), "", "", "", ""],
    [
      "Propagation REST→broadcast",
      fmt(s.p50, 1),
      fmt(s.p90, 1),
      fmt(s.p95, 1),
      fmt(s.p99, 1),
      fmt(s.max, 1),
    ],
  ];
  printSection(
    `Latence temps réel (ms) — ${latencies.length}/${ITER} itérations réussies`,
    ["mesure", "p50", "p90", "p95", "p99", "max"],
    rows,
  );
  if (failures) console.log(`⚠ ${failures} itération(s) en échec/timeout.`);

  const md = [
    "# VII.IV — Réactivité du système temps réel",
    "",
    `_Généré le ${new Date().toISOString()} — ${latencies.length}/${ITER} itérations réussies_`,
    "",
    "Latence entre une mutation REST (mise à jour de tâche) et la réception du",
    "broadcast `task:updated` par un client Socket.IO abonné à `project:<id>`.",
    "",
    markdownTable(["mesure", "p50 (ms)", "p90 (ms)", "p95 (ms)", "p99 (ms)", "max (ms)"], rows),
    "",
    `- Temps d'établissement de la connexion (handshake) : **${fmt(connectMs, 1)} ms**`,
    `- Latence médiane de propagation : **${fmt(s.p50, 1)} ms**`,
    "",
  ].join("\n");

  const paths = report.save(
    "07-realtime-latency",
    { connectMs, iterations: ITER, succeeded: latencies.length, failures, latency: s, samples: latencies },
    md,
  );
  console.log(`\n✓ Rapport écrit : ${paths.latestMd}`);
};

main()
  .catch((err) => {
    console.error("✗ Échec :", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Déconnexion unique (évite la course prisma/libuv sur sortie Windows).
    try {
      await prisma.$disconnect();
    } catch {}
  });
