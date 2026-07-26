/**
 * ── Chapitre VII.III — Fluidité de l'expérience utilisateur ──────────────────
 *
 * Collecte automatique des Web Vitals du frontend Next.js via un navigateur
 * headless (Playwright), pour plusieurs pages :
 *   - TTFB  (Time To First Byte)
 *   - FCP   (First Contentful Paint)
 *   - LCP   (Largest Contentful Paint)
 *   - CLS   (Cumulative Layout Shift)
 *   - DCL / Load (DOMContentLoaded, load event)
 *   - Poids JS transféré
 *
 * Prérequis :
 *   - Frontend démarré (ex. `npm run dev` → souvent http://localhost:3001,
 *     car le backend occupe :3000). Régler EVAL_WEB_URL.
 *   - Playwright : `npm i -D playwright && npx playwright install chromium`
 *     (si absent, le script explique et s'arrête proprement).
 *
 *   node evaluation/bench/06-web-vitals.js
 *
 * Variables : EVAL_WEB_URL (déf. http://localhost:3001),
 *             EVAL_WEB_ROUTES (déf. "/,/dashboard,/projects,/my-tasks,/calendar"),
 *             EVAL_WEB_RUNS (déf. 3).
 */
const { getToken } = require("../lib/auth");
const { summarize, mean } = require("../lib/stats");
const { fmt, markdownTable, printSection } = require("../lib/table");
const report = require("../lib/report");
const prisma = require("../../src/prisma/client");

const WEB_URL = process.env.EVAL_WEB_URL || "http://localhost:3001";
const ROUTES = (process.env.EVAL_WEB_ROUTES || "/,/dashboard,/projects,/my-tasks,/calendar")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const RUNS = parseInt(process.env.EVAL_WEB_RUNS, 10) || 3;

// Script exécuté DANS la page : observe les Web Vitals puis résout après settle.
const COLLECT_IN_PAGE = (settleMs) =>
  new Promise((resolve) => {
    const nav = performance.getEntriesByType("navigation")[0] || {};
    let lcp = 0;
    let cls = 0;
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) lcp = e.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      /* API non supportée */
    }
    setTimeout(() => {
      const paints = performance.getEntriesByType("paint");
      const fcp = paints.find((p) => p.name === "first-contentful-paint");
      const jsBytes = performance
        .getEntriesByType("resource")
        .filter((r) => r.initiatorType === "script")
        .reduce((s, r) => s + (r.transferSize || 0), 0);
      resolve({
        ttfb: nav.responseStart || 0,
        fcp: fcp ? fcp.startTime : 0,
        lcp,
        cls,
        dcl: nav.domContentLoadedEventEnd || 0,
        load: nav.loadEventEnd || 0,
        jsKB: jsBytes / 1024,
      });
    }, settleMs);
  });

const main = async () => {
  console.log("═══ VII.III — Fluidité de l'expérience utilisateur (Web Vitals) ═══");

  let chromium;
  try {
    ({ chromium } = require(require.resolve("playwright", {
      paths: [process.cwd(), __dirname],
    })));
  } catch {
    console.log(
      "\nℹ Playwright n'est pas installé. Installe-le puis relance :\n" +
        "    npm i -D playwright\n" +
        "    npx playwright install chromium\n",
    );
    await prisma.$disconnect();
    process.exit(0);
  }

  const { token } = await getToken();
  console.log(`Cible : ${WEB_URL} | ${ROUTES.length} routes × ${RUNS} run(s)`);

  const browser = await chromium.launch({ headless: true });
  const perRoute = [];

  for (const route of ROUTES) {
    const samples = [];
    for (let r = 0; r < RUNS; r++) {
      const context = await browser.newContext();
      // Injecte le token en sessionStorage (clé auth_token) pour les pages
      // authentifiées, avant tout chargement de script applicatif.
      await context.addInitScript(
        ([key, value]) => {
          try {
            window.sessionStorage.setItem(key, value);
          } catch {}
        },
        ["auth_token", token],
      );
      const page = await context.newPage();
      try {
        await page.goto(`${WEB_URL}${route}`, { waitUntil: "load", timeout: 20000 });
        const metrics = await page.evaluate(COLLECT_IN_PAGE, 2500);
        samples.push(metrics);
      } catch (e) {
        console.log(`  · ${route} (run ${r + 1}) échec: ${e.message}`);
      }
      await context.close();
    }
    if (samples.length) {
      const agg = (k) => mean(samples.map((s) => s[k]));
      const row = {
        route,
        ttfb: agg("ttfb"),
        fcp: agg("fcp"),
        lcp: agg("lcp"),
        cls: agg("cls"),
        dcl: agg("dcl"),
        load: agg("load"),
        jsKB: agg("jsKB"),
      };
      perRoute.push(row);
      console.log(
        `  · ${route} → LCP ${fmt(row.lcp, 0)}ms, FCP ${fmt(row.fcp, 0)}ms, CLS ${fmt(row.cls, 3)}`,
      );
    }
  }

  await browser.close();
  await prisma.$disconnect();

  if (perRoute.length === 0) {
    console.error(`\n✗ Aucune page mesurée. Le frontend tourne-t-il sur ${WEB_URL} ?`);
    process.exit(1);
  }

  const rows = perRoute.map((r) => [
    r.route,
    fmt(r.ttfb, 0),
    fmt(r.fcp, 0),
    fmt(r.lcp, 0),
    fmt(r.cls, 3),
    fmt(r.dcl, 0),
    fmt(r.load, 0),
    fmt(r.jsKB, 0),
  ]);
  printSection(
    "Web Vitals par page (moyenne des runs)",
    ["route", "TTFB", "FCP", "LCP", "CLS", "DCL", "Load", "JS(KB)"],
    rows,
  );

  // Seuils "Good" de référence (Google) pour interprétation.
  const md = [
    "# VII.III — Fluidité de l'expérience utilisateur (Web Vitals)",
    "",
    `_Généré le ${new Date().toISOString()} — cible ${WEB_URL}, ${RUNS} run(s)/route_`,
    "",
    "Valeurs en millisecondes (sauf CLS, sans unité, et JS en KB). Seuils Google",
    "« Good » : **LCP < 2500 ms**, **FCP < 1800 ms**, **CLS < 0.1**.",
    "",
    markdownTable(
      ["route", "TTFB (ms)", "FCP (ms)", "LCP (ms)", "CLS", "DCL (ms)", "Load (ms)", "JS (KB)"],
      rows,
    ),
    "",
  ].join("\n");

  const paths = report.save("06-web-vitals", { url: WEB_URL, runs: RUNS, perRoute }, md);
  console.log(`\n✓ Rapport écrit : ${paths.latestMd}`);
};

main().catch(async (err) => {
  console.error("✗ Échec :", err.message);
  try {
    await prisma.$disconnect();
  } catch {}
  process.exit(1);
});
