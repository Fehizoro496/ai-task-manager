const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { dedupeTasks, reconcilePlan } = require("../src/modules/ai/plan-merge");

describe("dedupeTasks", () => {
  it("fusionne les tâches au titre équivalent", () => {
    const tasks = dedupeTasks([
      { title: "Configurer le CI", description: "GitHub Actions", labels: ["devops"] },
      { title: "configurer le CI.", description: "", labels: ["ci"] },
      { title: "Écrire la doc", description: "README" },
    ]);

    assert.equal(tasks.length, 2);
    assert.equal(tasks[0].title, "Configurer le CI");
    assert.equal(tasks[0].description, "GitHub Actions");
    assert.deepEqual(tasks[0].labels, ["devops", "ci"]);
  });

  it("garde la description la plus fournie du doublon", () => {
    const tasks = dedupeTasks([
      { title: "Authentifier l'utilisateur", description: "JWT" },
      { title: "Authentifier l'utilisateur", description: "Émettre un JWT à la connexion." },
    ]);

    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].description, "Émettre un JWT à la connexion.");
  });

  it("ignore les tâches sans titre exploitable", () => {
    assert.deepEqual(dedupeTasks([{ title: "   " }, { description: "orpheline" }]), []);
  });

  it("omet la clé description quand elle est vide", () => {
    const [task] = dedupeTasks([{ title: "Nettoyer", description: "  " }]);
    assert.equal("description" in task, false);
  });
});

describe("reconcilePlan", () => {
  const previous = {
    tasks: [
      { title: "Configurer le CI", description: "GitHub Actions", labels: ["devops"] },
      { title: "Écrire la doc", description: "Rédiger le README." },
    ],
  };

  it("restaure la description omise par l'IA sur une tâche conservée", () => {
    const plan = reconcilePlan(previous, {
      tasks: [{ title: "Configurer le CI" }, { title: "Écrire la doc", description: "" }],
    });

    assert.equal(plan.tasks[0].description, "GitHub Actions");
    assert.deepEqual(plan.tasks[0].labels, ["devops"]);
    assert.equal(plan.tasks[1].description, "Rédiger le README.");
  });

  it("conserve la description révisée quand l'IA en fournit une", () => {
    const plan = reconcilePlan(previous, {
      tasks: [{ title: "Configurer le CI", description: "Passer à GitLab CI." }],
    });

    assert.equal(plan.tasks[0].description, "Passer à GitLab CI.");
  });

  it("supprime les redondances introduites par l'affinage", () => {
    const plan = reconcilePlan(previous, {
      tasks: [
        { title: "Configurer le CI", description: "GitHub Actions" },
        { title: "Configurer le CI !", description: "GitHub Actions" },
        { title: "Écrire la doc", description: "Rédiger le README." },
      ],
    });

    assert.equal(plan.tasks.length, 2);
    assert.deepEqual(
      plan.tasks.map((t) => t.title),
      ["Configurer le CI", "Écrire la doc"],
    );
  });

  it("laisse partir une tâche réellement supprimée par l'instruction", () => {
    const plan = reconcilePlan(previous, {
      tasks: [{ title: "Écrire la doc", description: "Rédiger le README." }],
    });

    assert.equal(plan.tasks.length, 1);
    assert.equal(plan.tasks[0].title, "Écrire la doc");
  });
});
