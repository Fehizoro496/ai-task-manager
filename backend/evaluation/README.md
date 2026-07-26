# Harness d'évaluation — Chapitres VI & VII

Système de mesure produisant de **vraies données** pour les chapitres
d'évaluation quantitative (VI) et qualitative (VII) du mémoire, en remplacement
des données provisoires.

Chaque benchmark écrit deux fichiers dans `results/` : un `.json` (données
brutes, rejouables) et un `.md` (tableaux prêts à coller dans le mémoire, suffixe
`_latest.md` pour la dernière exécution).

## Correspondance mémoire ↔ scripts

| Section mémoire | Script | Dépendances |
|---|---|---|
| **VI.I** Performance technique | `bench/01-api-performance.js` | backend démarré + 1 utilisateur en base |
| **VI.II** Qualité génération IA (quantitatif) | `bench/02-ai-generation.js` | `ANTHROPIC_API_KEY` — **appels payants** |
| **VI.III** Efficacité algo répartition | `bench/03-distribution-efficiency.js` | aucune (hors-ligne) |
| **VII.I** Évaluation qualitative IA (LLM-juge) | `bench/04-ai-judge.js` | 02 lancé avant — **appels payants** |
| **VII.II** Qualité répartition | `bench/05-distribution-quality.js` | aucune (hors-ligne) |
| **VII.III** Fluidité UX (Web Vitals) | `bench/06-web-vitals.js` | Playwright + frontend démarré |
| **VII.IV** Réactivité temps réel | `bench/07-realtime-latency.js` | backend démarré + 1 projet avec tâche + admin |

## Ce qui est mesuré

- **VI.I** — latence p50/p90/p95/p99 par endpoint REST + débit (req/s) sous concurrence.
- **VI.II** — latence de génération, tokens entrée/sortie, validité du schéma, nombre
  de tâches, taux de labels, couverture thématique (mots-clés attendus).
- **VI.III** — scalabilité de l'algorithme hongrois (vérifie O(n³)), optimalité exacte
  (vs brute-force), gain de coût vs baseline glouton.
- **VII.I** — notation LLM-as-judge sur 5 critères (fidélité, granularité, couverture,
  actionnabilité, cohérence), échelle 1–5.
- **VII.II** — adéquation compétence, score de compatibilité, équilibrage de charge
  (Gini, écart max-min) : hongrois vs « compétence seule » vs aléatoire.
- **VII.III** — TTFB, FCP, LCP, CLS, DCL, Load, poids JS par page.
- **VII.IV** — latence de propagation mutation REST → broadcast Socket.IO + handshake.

## Prérequis

1. `.env` du backend renseigné (`DATABASE_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`).
2. Base accessible avec au moins un utilisateur **APPROVED / ADMIN** :
   ```
   npm run seed:admin
   ```
   (les benchmarks signent un JWT pour cet utilisateur — l'app n'a pas de login
   mot de passe.)
3. Pour VI.I / VII.IV : backend démarré (`npm run dev`).
4. Pour VII.III : frontend démarré + Playwright installé
   (`npm i -D playwright && npx playwright install chromium`).

## Lancement

Depuis `backend/` :

```bash
# Hors-ligne uniquement (VI.III + VII.II) — aucune dépendance
node evaluation/run-all.js

# Ajouter les benchmarks serveur (VI.I + VII.IV)
node evaluation/run-all.js --server

# Ajouter les benchmarks IA payants (VI.II + VII.I)
node evaluation/run-all.js --ai

# Tout (serveur + IA + web)
node evaluation/run-all.js --all
```

Ou individuellement, ex. :

```bash
node evaluation/bench/03-distribution-efficiency.js
```

Via npm (voir `package.json`) :

```bash
npm run eval           # hors-ligne
npm run eval:all       # tout
npm run eval:ai        # IA seulement
```

## Variables d'environnement utiles

| Variable | Défaut | Rôle |
|---|---|---|
| `EVAL_API_URL` | `http://localhost:3000` | URL du backend |
| `EVAL_USER_EMAIL` | admin par défaut | compte dont on signe le JWT |
| `EVAL_REQUESTS` | 60 | requêtes séquentielles (VI.I) |
| `EVAL_CONCURRENCY` | 20 | concurrence débit (VI.I) |
| `EVAL_AI_RUNS` | 1 | répétitions par document (VI.II) |
| `EVAL_AI_MODEL` | `claude-sonnet-4-6` | modèle de génération |
| `EVAL_JUDGE_MODEL` | = `EVAL_AI_MODEL` | modèle juge (VII.I) |
| `EVAL_RT_ITER` | 30 | itérations temps réel (VII.IV) |
| `EVAL_WEB_URL` | `http://localhost:3001` | URL du frontend (VII.III) |
| `EVAL_WEB_ROUTES` | 5 routes | pages mesurées (VII.III) |

## Notes de fidélité

Les librairies `lib/ai-generate.js` et `fixtures/distribution.js` **répliquent à
l'identique** la logique de production (prompts, modèle, schéma JSON pour l'IA ;
poids, pénalité et matrice de coûts pour la répartition) afin d'isoler la mesure
sans écrire en base. En cas de modification de `ai.service.js` ou
`distribution.service.js`, resynchroniser ces fichiers.
