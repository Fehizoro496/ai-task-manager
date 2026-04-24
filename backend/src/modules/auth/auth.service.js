const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const prisma = require("../../prisma/client");
const config = require("../../config/env");
const AppError = require("../../utils/AppError");
const oauthStore = require("./oauth-store");

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatarUrl: true, role: true, status: true, createdAt: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const { avatarUrl, ...rest } = user;
  return { ...rest, avatar_url: avatarUrl ?? null };
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
    const name = ghUser.name || ghUser.login || email;
    const avatarUrl = ghUser.avatar_url || null;

    // 4) Find or create user
    let user = await prisma.user.findUnique({ where: { githubId } });

    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { githubId, name: name || user.name, avatarUrl: avatarUrl || user.avatarUrl, provider: "github", githubAccessToken: accessToken },
        });
      }
    }

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: { email, name: name || email, githubId, avatarUrl, provider: "github", githubAccessToken: accessToken },
      });
    } else if (user.githubId) {
      // Refresh token for existing GitHub users on every login
      await prisma.user.update({
        where: { id: user.id },
        data: { githubAccessToken: accessToken },
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

    if (isNewUser || user.status === "PENDING") {
      if (state) oauthStore.set(state, { pending_approval: true, user: userPayload });
      return { pending_approval: true, user: userPayload };
    }

    if (user.status === "REJECTED") {
      const errMsg = "Your account registration has been rejected";
      if (state) oauthStore.set(state, { error: errMsg });
      throw new AppError(errMsg, 403);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

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
    return { status: "pending_approval", user: entry.user };
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
  getGithubAuthUrl,
  githubCallback,
  getGithubStatus,
};
