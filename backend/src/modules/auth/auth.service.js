const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const prisma = require("../../prisma/client");
const config = require("../../config/env");
const AppError = require("../../utils/AppError");
const oauthStore = require("./oauth-store");
const { getIo } = require("../../socket");
const {
  sanitizePatch,
  mergePreferences,
  withDefaults,
} = require("./preferences");

const meSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  status: true,
  preferences: true,
  createdAt: true,
};

const serializeMe = (user) => {
  const { avatarUrl, preferences, ...rest } = user;
  return {
    ...rest,
    avatar_url: avatarUrl ?? null,
    preferences: withDefaults(preferences),
  };
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: meSelect,
  });
  if (!user) throw new AppError("User not found", 404);
  return serializeMe(user);
};

const updateMe = async (userId, data) => {
  const payload = {};
  if (typeof data.name === "string" && data.name.trim().length > 0) {
    payload.name = data.name.trim();
  }
  if (data.preferences !== undefined) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const patch = sanitizePatch(data.preferences);
    payload.preferences = mergePreferences(current?.preferences, patch);
  }
  if (Object.keys(payload).length === 0) {
    throw new AppError("Aucun champ à mettre à jour", 400);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: payload,
    select: meSelect,
  });
  return serializeMe(user);
};

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────

const getGithubAuthUrl = () => {
  if (!config.githubClientId || !config.githubClientSecret) {
    throw new AppError("GitHub OAuth is not configured", 500);
  }

  const state = randomUUID();
  const params = new URLSearchParams({
    client_id: config.githubClientId,
    redirect_uri: config.githubRedirectUri,
    scope: "read:user user:email repo",
    state,
  });

  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
  oauthStore.set(state, { pending: true });

  return { url, state };
};

const githubCallback = async (code, state) => {
  if (!config.githubClientId || !config.githubClientSecret) {
    throw new AppError("GitHub OAuth is not configured", 500);
  }

  try {
    // 1) Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
        redirect_uri: config.githubRedirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      throw new AppError(tokenData.error_description || "GitHub token exchange failed", 401);
    }

    const accessToken = tokenData.access_token;

    // 2) Fetch GitHub user profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "ai-task-manager" },
    });
    const ghUser = await userRes.json();

    // 3) Fetch emails if primary email is not public
    let email = ghUser.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "ai-task-manager" },
      });
      const emails = await emailsRes.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email || emails[0]?.email || null;
    }

    const githubId = String(ghUser.id);
    const githubLogin = ghUser.login;
    const name = ghUser.name || githubLogin || email;
    const avatarUrl = ghUser.avatar_url || null;

    // 4) Find or create user
    let user = await prisma.user.findUnique({ where: { githubId } });

    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { githubId, githubLogin, name: name || user.name, avatarUrl: avatarUrl || user.avatarUrl, provider: "github", githubAccessToken: accessToken },
        });
      }
    }

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: { email, name: name || email, githubId, githubLogin, avatarUrl, provider: "github", githubAccessToken: accessToken },
      });
    } else if (user.githubId) {
      // Refresh token et login pour les utilisateurs GitHub existants à chaque connexion
      await prisma.user.update({
        where: { id: user.id },
        data: { githubAccessToken: accessToken, githubLogin },
      });
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatarUrl ?? null,
      role: user.role,
      status: user.status,
    };

    if (user.status === "REJECTED") {
      const errMsg = "Your account registration has been rejected";
      if (state) oauthStore.set(state, { error: errMsg });
      throw new AppError(errMsg, 403);
    }

    // Token émis pour TOUT user (y compris PENDING) afin de pouvoir
    // ouvrir un socket et recevoir l'event d'approbation.
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    if (isNewUser || user.status === "PENDING") {
      if (state) {
        oauthStore.set(state, { pending_approval: true, user: userPayload, token });
      }
      // Notifier les admins en temps réel d'une nouvelle demande
      const io = getIo();
      if (io) {
        io.to("admins").emit("admin:pending_request", { user: userPayload });
      }
      return { pending_approval: true, user: userPayload, token };
    }

    if (state) oauthStore.set(state, { token, user: userPayload });
    return { token, user: userPayload };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (state) oauthStore.set(state, { error: err.message || "GitHub authentication failed" });
    throw new AppError("GitHub authentication failed", 401);
  }
};

const getGithubStatus = (state) => {
  const entry = oauthStore.get(state);
  if (!entry) return { status: "expired" };
  if (entry.pending) return { status: "pending" };
  if (entry.pending_approval) {
    oauthStore.delete(state);
    return {
      status: "pending_approval",
      user: entry.user,
      token: entry.token ?? null,
    };
  }
  if (entry.error) {
    oauthStore.delete(state);
    return { status: "error", error: entry.error };
  }
  oauthStore.delete(state);
  return { status: "success", token: entry.token, user: entry.user };
};

module.exports = {
  getMe,
  updateMe,
  getGithubAuthUrl,
  githubCallback,
  getGithubStatus,
};
