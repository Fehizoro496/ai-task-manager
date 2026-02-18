const authService = require("./auth.service");
const asyncHandler = require("../../utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.id);
  res.json(result);
});

const googleInit = asyncHandler(async (req, res) => {
  const result = authService.getGoogleAuthUrl();
  res.json(result);
});

const googleCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).send("<h2>Error: Missing authorization code.</h2>");
  }

  try {
    await authService.googleCallback(code, state);
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Sign-in successful</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:60px;">
          <h2>&#10003; Sign-in successful!</h2>
          <p>You can close this window and return to the app.</p>
          <script>window.close();</script>
        </body>
      </html>
    `);
  } catch {
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Sign-in failed</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:60px;">
          <h2>&#10007; Sign-in failed.</h2>
          <p>Please close this window and try again.</p>
        </body>
      </html>
    `);
  }
});

const googleStatus = asyncHandler(async (req, res) => {
  const { state } = req.params;
  const result = authService.getGoogleStatus(state);
  res.json(result);
});

module.exports = { register, login, getMe, googleInit, googleCallback, googleStatus };
