/**
 * Orchestrateur des benchmarks d'évaluation.
 *
 * Par défaut, ne lance que les benchmarks HORS-LIGNE (aucune dépendance) :
 *   node evaluation/run-all.js
 *
 * Options (cumulables) :
 *   --server    ajoute les benchmarks nécessitant le backend démarré (01, 07)
 *   --ai        ajoute les benchmarks IA — appels Claude PAYANTS (02, 04)
 *   --web       ajoute les Web Vitals — nécessite Playwright + frontend (06)
 *   --all       tout
 *
 * Ex :  node evaluation/run-all.js --server --ai
 */
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const BENCHES = {
  offline: [
    ["03-distribution-efficiency", "VI.III Efficacité algo répartition"],
    ["05-distribution-quality", "VII.II Qualité répartition"],
  ],
  server: [
    ["01-api-performance", "VI.I Performance technique"],
    ["07-realtime-latency", "VII.IV Réactivité temps réel"],
  ],
  ai: [
    ["02-ai-generation", "VI.II Qualité génération IA (quantitatif)"],
    ["04-ai-judge", "VII.I Évaluation qualitative IA"],
  ],
  web: [["06-web-vitals", "VII.III Fluidité UX"]],
};

const flags = new Set(process.argv.slice(2));
const groups = ["offline"];
if (flags.has("--all") || flags.has("--server")) groups.push("server");
if (flags.has("--all") || flags.has("--ai")) groups.push("ai");
if (flags.has("--all") || flags.has("--web")) groups.push("web");

const results = [];
for (const group of groups) {
  for (const [file, label] of BENCHES[group]) {
    console.log(`\n\n╔══ ${label} ══╗`);
    const r = spawnSync("node", [path.join(__dirname, "bench", `${file}.js`)], {
      stdio: "inherit",
    });
    results.push([label, r.status === 0 ? "OK" : `ÉCHEC (${r.status})`]);
  }
}

console.log("\n\n═══ Récapitulatif ═══");
for (const [label, status] of results) console.log(`  ${status.padEnd(14)} ${label}`);

// ── Rapport consolidé : un SEUL fichier Markdown pour toute l'évaluation ──────
const RESULTS_DIR = path.join(__dirname, "results");
// Ordre canonique = ordre des sections du mémoire (VI puis VII).
const REPORT_ORDER = [
  ["01-api-performance", "VI.I — Performance technique du système"],
  ["02-ai-generation", "VI.II — Qualité de la génération de plans par l'IA"],
  ["03-distribution-efficiency", "VI.III — Efficacité de l'algorithme de répartition"],
  ["04-ai-judge", "VII.I — Évaluation qualitative de la génération de plans par l'IA"],
  ["05-distribution-quality", "VII.II — Évaluation qualitative de la répartition"],
  ["06-web-vitals", "VII.III — Fluidité de l'expérience utilisateur"],
  ["07-realtime-latency", "VII.IV — Réactivité du système temps réel"],
];

const parts = [
  "# Évaluation — Chapitres VI (quantitative) & VII (qualitative)",
  "",
  `_Rapport consolidé généré le ${new Date().toISOString()}_`,
  "",
  "---",
  "",
];
for (const [slug, title] of REPORT_ORDER) {
  const f = path.join(RESULTS_DIR, `${slug}.md`);
  if (fs.existsSync(f)) {
    parts.push(fs.readFileSync(f, "utf8").trim(), "", "---", "");
  } else {
    parts.push(`# ${title}`, "", "_Section non exécutée lors de ce run._", "", "---", "");
  }
}
const combined = path.join(RESULTS_DIR, "evaluation-complete.md");
fs.writeFileSync(combined, parts.join("\n"), "utf8");

console.log(`\n📄 Rapport unique consolidé : ${combined}`);
