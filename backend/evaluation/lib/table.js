/**
 * Rendu de tableaux : console lisible + Markdown (pour coller dans le mémoire).
 */

// Formatte un nombre avec `d` décimales ; passe-plat pour les chaînes.
const fmt = (v, d = 2) => {
  if (typeof v !== "number" || Number.isNaN(v)) return String(v ?? "");
  if (Number.isInteger(v) && d === 0) return String(v);
  return v.toFixed(d);
};

const cell = (v) => (v === null || v === undefined ? "" : String(v));

// Tableau Markdown (pipes) — colle directement dans le mémoire.
const markdownTable = (headers, rows) => {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map(cell).join(" | ")} |`).join("\n");
  return [head, sep, body].join("\n");
};

// Tableau aligné pour la console.
const consoleTable = (headers, rows) => {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => cell(r[i]).length)),
  );
  const line = (cols) =>
    cols.map((c, i) => cell(c).padEnd(widths[i])).join("  ");
  const sep = widths.map((w) => "─".repeat(w)).join("  ");
  return [line(headers), sep, ...rows.map(line)].join("\n");
};

// Affiche un bloc titré + tableau dans la console.
const printSection = (title, headers, rows) => {
  console.log(`\n### ${title}`);
  console.log(consoleTable(headers, rows));
};

module.exports = { fmt, markdownTable, consoleTable, printSection };
