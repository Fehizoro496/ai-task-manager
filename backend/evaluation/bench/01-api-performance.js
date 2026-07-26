/**
 * ── Chapitre VI.I — Performance technique du système ─────────────────────────
 *
 * Mesure la LATENCE et le DÉBIT de l'API REST sur un échantillon d'endpoints
 * représentatifs (lecture seule → non destructif) :
 *   - Latence : p50 / p90 / p95 / p99 sur N requêtes séquentielles.
 *   - Débit   : requêtes/seconde sous charge concurrente + taux d'erreur.
 *
 * Prérequis : serveur backend démarré (npm run dev) + un utilisateur en base.
 *   node evaluation/bench/01-api-performance.js
 *
 * Variables : EVAL_API_URL, EVAL_REQUESTS (déf. 60), EVAL_CONCURRENCY (déf. 20),
 *             EVAL_THROUGHPUT_N (déf. 200).
 */
const { performance } = require("perf_hooks");
const { request } = require("../lib/http");
const { getToken } = require("../lib/auth");
const { summarize } = require("../lib/stats");
const { fmt, markdownTable, printSection } = require("../lib/table");
const report = require("../lib/report");
const env = require("../lib/env");
const prisma = require("../../src/prisma/client");

const N = parseInt(process.env.EVAL_REQUESTS, 10) || 60;
const CONCURRENCY = parseInt(process.env.EVAL_CONCURRENCY, 10) || 20;
const THROUGHPUT_N = parseInt(process.env.EVAL_THROUGHPUT_N, 10) || 200;

// Mesure la latence séquentielle d'un endpoint (avec préchauffe).
const measureLatency = async (path, token) => {
  for (let i = 0; i < 5; i++) await request(path, { token }); // warmup
  const times = [];
  let errors = 0;
  let lastStatus = 0;
  for (let i = 0; i < N; i++) {
    const r = await request(path, { token });
    lastStatus = r.status;
    if (!r.ok) errors++;
    else times.push(r.ms);
  }
  return { times, errors, lastStatus };
};

// Mesure le débit sous concurrence (fenêtre glissante de `CONCURRENCY`).
const measureThroughput = async (path, token) => {
  let done = 0;
  let errors = 0;
  const t0 = performance.now();
  const worker = async () => {
    while (done < THROUGHPUT_N) {
      done++;
      const r = await request(path, { token });
      if (!r.ok) errors++;
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const seconds = (performance.now() - t0) / 1000;
  return { rps: THROUGHPUT_N / seconds, errors, seconds };
};

const main = async () => {
  console.log("═══ VI.I — Performance technique du système ═══");
  console.log(`Cible : ${env.apiUrl}  |  N=${N} séq.  |  débit=${THROUGHPUT_N}@${CONCURRENCY}`);

  const { token, user } = await getToken();
  console.log(`Token signé pour : ${user.email} (${user.role})`);

  // Sonde de disponibilité.
  const probe = await request("/api/auth/me", { token });
  if (probe.status === 0) {
    console.error(`\n✗ Serveur injoignable sur ${env.apiUrl}. Démarre-le : npm run dev`);
    await prisma.$disconnect();
    process.exit(1);
  }

  // Un projet réel pour les endpoints paramétrés.
  const projectsRes = await request("/api/projects", { token });
  const projectId = Array.isArray(projectsRes.body) && projectsRes.body[0]?.id;

  const endpoints = [
    { label: "GET /auth/me", path: "/api/auth/me" },
    { label: "GET /projects", path: "/api/projects" },
    { label: "GET /users", path: "/api/users" },
    { label: "GET /notifications", path: "/api/notifications" },
    { label: "GET /reports/overview", path: "/api/reports/overview" },
    { label: "GET /calendar/events", path: "/api/calendar/events" },
    { label: "GET /labels", path: "/api/labels" },
  ];
  if (projectId) {
    endpoints.push(
      { label: "GET /projects/:id", path: `/api/projects/${projectId}` },
      { label: "GET /projects/:id/tasks", path: `/api/projects/${projectId}/tasks` },
    );
  } else {
    console.log("⚠ Aucun projet en base → endpoints paramétrés ignorés.");
  }

  const latencyRows = [];
  const throughputRows = [];
  const data = [];
  for (const ep of endpoints) {
    const { times, errors, lastStatus } = await measureLatency(ep.path, token);
    const s = summarize(times);
    const tp = await measureThroughput(ep.path, token);
    latencyRows.push([
      ep.label,
      lastStatus,
      fmt(s.p50, 1),
      fmt(s.p90, 1),
      fmt(s.p95, 1),
      fmt(s.p99, 1),
      fmt(s.max, 1),
      errors,
    ]);
    throughputRows.push([
      ep.label,
      fmt(tp.rps, 1),
      `${fmt((tp.errors / THROUGHPUT_N) * 100, 1)} %`,
    ]);
    data.push({ endpoint: ep.label, status: lastStatus, latency: s, throughput: tp });
  }

  printSection(
    "Latence par endpoint (ms)",
    ["endpoint", "code", "p50", "p90", "p95", "p99", "max", "err"],
    latencyRows,
  );
  printSection(
    `Débit sous concurrence (${THROUGHPUT_N} req @ ${CONCURRENCY})`,
    ["endpoint", "req/s", "taux erreur"],
    throughputRows,
  );

  const md = [
    "# VI.I — Performance technique du système",
    "",
    `_Généré le ${new Date().toISOString()} — cible ${env.apiUrl}, N=${N} req. séquentielles_`,
    "",
    "## Latence par endpoint (ms)",
    "",
    markdownTable(
      ["endpoint", "code HTTP", "p50", "p90", "p95", "p99", "max", "erreurs"],
      latencyRows,
    ),
    "",
    `## Débit sous charge concurrente (${THROUGHPUT_N} requêtes, concurrence ${CONCURRENCY})`,
    "",
    markdownTable(["endpoint", "requêtes/s", "taux d'erreur"], throughputRows),
    "",
  ].join("\n");

  const paths = report.save("01-api-performance", { config: { N, CONCURRENCY, THROUGHPUT_N }, endpoints: data }, md);
  console.log(`\n✓ Rapport écrit : ${paths.latestMd}`);
  await prisma.$disconnect();
};

main().catch(async (err) => {
  console.error("✗ Échec :", err.message);
  await prisma.$disconnect();
  process.exit(1);
});
