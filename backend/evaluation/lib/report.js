/**
 * Persistance des résultats de benchmark : JSON brut (rejouable) + Markdown
 * (prêt à coller dans le mémoire). Écrit dans evaluation/results/.
 */
const fs = require("fs");
const path = require("path");

const RESULTS_DIR = path.join(__dirname, "..", "results");

const ensureDir = () => {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
};

/**
 * Sauvegarde un rapport dans UN SEUL fichier par test (écrasé à chaque run) :
 * `results/<name>.md` (+ `<name>.json` pour les données brutes).
 * @param {string} name  slug du benchmark (ex. "01-api-performance")
 * @param {object} json  données structurées (rejouables / traçables)
 * @param {string} markdown  rendu lisible avec tableaux
 * @returns {{jsonPath:string, mdPath:string}}
 */
const save = (name, json, markdown) => {
  ensureDir();
  const jsonPath = path.join(RESULTS_DIR, `${name}.json`);
  const mdPath = path.join(RESULTS_DIR, `${name}.md`);
  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), "utf8");
  fs.writeFileSync(mdPath, markdown, "utf8");
  return { jsonPath, mdPath, latestMd: mdPath };
};

module.exports = { save, RESULTS_DIR };
