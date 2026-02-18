const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("../../prisma/client");
const config = require("../../config/env");
const AppError = require("../../utils/AppError");
const oauthStore = require("./oauth-store");

const register = async ({ email, password, name }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.password) {
    throw new AppError("Please use Google Sign-In for this account", 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return {
    user: { id: user.id, email: user.email, name: user.name },
    token,
  };
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const getGoogleAuthUrl = () => {
  if (!config.googleClientId || !config.googleClientSecret) {
    throw new AppError("Google OAuth is not configured", 500);
  }

  const state = randomUUID();
  const client = new OAuth2Client(
    config.googleClientId,
    config.googleClientSecret,
    config.googleRedirectUri
  );

  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });

  // Reserve the state slot (pending = no token yet)
  oauthStore.set(state, { pending: true });

  return { url, state };
};

const googleCallback = async (code, state) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    throw new AppError("Google OAuth is not configured", 500);
  }

  const client = new OAuth2Client(
    config.googleClientId,
    config.googleClientSecret,
    config.googleRedirectUri
  );

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.googleClientId,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatarUrl } = payload;

    // Find existing user by googleId or email
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        // Link Google to existing account
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl: avatarUrl || user.avatarUrl, provider: "google" },
        });
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email,
          googleId,
          avatarUrl,
          provider: "google",
        },
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };

    if (state) {
      oauthStore.set(state, { token, user: userPayload });
    }

    return { token, user: userPayload };
  } catch (err) {
    if (state) {
      oauthStore.set(state, { error: err.message || "Google authentication failed" });
    }
    throw new AppError("Google authentication failed", 401);
  }
};

const getGoogleStatus = (state) => {
  const entry = oauthStore.get(state);
  if (!entry) {
    return { status: "expired" };
  }
  if (entry.pending) {
    return { status: "pending" };
  }
  if (entry.error) {
    oauthStore.delete(state);
    return { status: "error", error: entry.error };
  }
  oauthStore.delete(state);
  return { status: "success", token: entry.token, user: entry.user };
};

module.exports = { register, login, getMe, getGoogleAuthUrl, googleCallback, getGoogleStatus };
