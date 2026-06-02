const prisma = require("../../prisma/client");

const GH_API = "https://api.github.com";
const USER_AGENT = "ai-task-manager";

const ghHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "User-Agent": USER_AGENT,
  "Content-Type": "application/json",
  Accept: "application/vnd.github+json",
});

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Crée un dépôt GitHub dans le compte de l'utilisateur.
 * Retourne { repoUrl, owner, repo } ou null si l'utilisateur n'a pas de token.
 */
const createRepo = async (userId, projectName, description) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { githubAccessToken: true },
  });

  if (!user?.githubAccessToken) return null;

  const token = user.githubAccessToken;
  const headers = ghHeaders(token);
  const repoName = slugify(projectName) || "project";

  const res = await fetch(`${GH_API}/user/repos`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: repoName,
      description: description || "",
      private: false,
      auto_init: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub repo creation failed: ${err.message || res.status}`);
  }

  const data = await res.json();
  return {
    repoUrl: data.html_url,
    owner: data.owner.login,
    repo: data.name,
  };
};

/**
 * Crée une branche sur GitHub depuis le HEAD de la branche par défaut.
 * Fire-and-forget : toutes les erreurs sont silencieuses.
 */
const createBranch = async (userId, owner, repo, branchName) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { githubAccessToken: true },
  });

  if (!user?.githubAccessToken) return;

  const token = user.githubAccessToken;
  const headers = ghHeaders(token);

  // 1. Récupère la branche par défaut du dépôt
  const repoRes = await fetch(`${GH_API}/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) return;
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch || "main";

  // 2. Récupère le SHA du HEAD de la branche par défaut
  const refRes = await fetch(
    `${GH_API}/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`,
    { headers }
  );
  if (!refRes.ok) return;
  const refData = await refRes.json();
  const sha = refData.object?.sha;
  if (!sha) return;

  // 3. Crée la nouvelle branche
  const createRes = await fetch(`${GH_API}/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
  });

  // 422 = branche déjà existante → pas une erreur bloquante
  if (!createRes.ok && createRes.status !== 422) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`GitHub branch creation failed: ${err.message || createRes.status}`);
  }
};

/**
 * Envoie une invitation de collaborateur GitHub sur un dépôt.
 * Utilise le token du propriétaire du projet pour envoyer l'invitation.
 * Fire-and-forget : les erreurs sont silencieuses.
 */
const inviteCollaborator = async (ownerUserId, owner, repo, invitedUserId) => {
  const [ownerUser, invitedUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ownerUserId },
      select: { githubAccessToken: true },
    }),
    prisma.user.findUnique({
      where: { id: invitedUserId },
      select: { githubLogin: true },
    }),
  ]);

  if (!ownerUser?.githubAccessToken || !invitedUser?.githubLogin) return;

  const res = await fetch(
    `${GH_API}/repos/${owner}/${repo}/collaborators/${invitedUser.githubLogin}`,
    {
      method: "PUT",
      headers: ghHeaders(ownerUser.githubAccessToken),
      body: JSON.stringify({ permission: "push" }),
    }
  );

  // 201 = invitation envoyée, 204 = déjà collaborateur → les deux sont OK
  if (!res.ok && res.status !== 201 && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub invitation failed: ${err.message || res.status}`);
  }
};

module.exports = { createBranch, createRepo, inviteCollaborator };
