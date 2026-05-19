const authService = require("./auth.service");
const asyncHandler = require("../../utils/asyncHandler");
const { buildOAuthPage } = require("./oauth-page");

const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.id);
  res.json(result);
});

const patchMe = asyncHandler(async (req, res) => {
  const result = await authService.updateMe(req.user.id, req.body);
  res.json(result);
});

const githubInit = asyncHandler(async (req, res) => {
  const result = authService.getGithubAuthUrl();
  res.json(result);
});

const githubCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res
      .status(400)
      .send(buildOAuthPage({ success: false, message: "Authorization code missing." }));
  }

  try {
    await authService.githubCallback(code, state);
    res.send(buildOAuthPage({ success: true }));
  } catch {
    res.status(400).send(buildOAuthPage({ success: false }));
  }
});

const githubStatus = asyncHandler(async (req, res) => {
  const { state } = req.params;
  const result = authService.getGithubStatus(state);
  res.json(result);
});

module.exports = { getMe, patchMe, githubInit, githubCallback, githubStatus };
