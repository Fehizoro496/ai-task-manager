require("dotenv").config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  openaiApiKey: process.env.OPENAI_API_KEY,
  nodeEnv: process.env.NODE_ENV || "development",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback",
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  githubRedirectUri: process.env.GITHUB_REDIRECT_URI || "http://localhost:3000/api/auth/github/callback",
};

module.exports = config;
