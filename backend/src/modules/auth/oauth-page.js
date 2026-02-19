/**
 * Builds the HTML page shown in the browser after a Google OAuth callback.
 * @param {{ success: boolean, message?: string }} options
 * @returns {string} Full HTML document
 */
function buildOAuthPage({ success, message }) {
  const title = success ? "Connexion réussie" : "Échec de connexion";
  const icon = success
    ? `<svg viewBox="0 0 52 52" class="icon success-icon">
        <circle cx="26" cy="26" r="25" fill="none" class="circle"/>
        <path fill="none" d="M14 27l8 8 16-16" class="check"/>
       </svg>`
    : `<svg viewBox="0 0 52 52" class="icon error-icon">
        <circle cx="26" cy="26" r="25" fill="none" class="circle"/>
        <path fill="none" d="M16 16 36 36 M36 16 16 36" class="cross"/>
       </svg>`;
  const heading = success ? "Connexion réussie !" : "Échec de la connexion";
  const body = success
    ? "Vous pouvez refermer cette fenêtre et revenir à l'application."
    : (message || "Une erreur est survenue. Veuillez refermer cette fenêtre et réessayer.");
  const autoClose = success
    ? `<script>setTimeout(() => window.close(), 2000);</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background: #0f1117;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card {
      background: #1a1d27;
      border: 1px solid #2d3148;
      border-radius: 20px;
      padding: 48px 40px;
      text-align: center;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.4);
      animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 36px;
    }

    .brand-logo {
      width: 32px;
      height: 32px;
      background: #6366f1;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      color: #fff;
    }

    .brand-name {
      font-size: 16px;
      font-weight: 600;
      color: #94a3b8;
    }

    .icon { width: 64px; height: 64px; margin: 0 auto 24px; display: block; }

    .success-icon .circle {
      stroke: #22c55e; stroke-width: 2;
      stroke-dasharray: 166; stroke-dashoffset: 166;
      animation: strokeDraw 0.5s 0.2s ease forwards;
    }
    .success-icon .check {
      stroke: #22c55e; stroke-width: 3;
      stroke-linecap: round; stroke-linejoin: round;
      stroke-dasharray: 48; stroke-dashoffset: 48;
      animation: strokeDraw 0.35s 0.65s ease forwards;
    }
    .error-icon .circle {
      stroke: #ef4444; stroke-width: 2;
      stroke-dasharray: 166; stroke-dashoffset: 166;
      animation: strokeDraw 0.5s 0.2s ease forwards;
    }
    .error-icon .cross {
      stroke: #ef4444; stroke-width: 3; stroke-linecap: round;
      stroke-dasharray: 56; stroke-dashoffset: 56;
      animation: strokeDraw 0.35s 0.65s ease forwards;
    }

    @keyframes strokeDraw { to { stroke-dashoffset: 0; } }

    h1 { font-size: 20px; font-weight: 600; color: #f1f5f9; margin-bottom: 10px; }
    p  { font-size: 14px; color: #64748b; line-height: 1.6; }

    .divider { height: 1px; background: #2d3148; margin: 28px 0; }

    .google-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #12151f;
      border: 1px solid #2d3148;
      border-radius: 100px;
      padding: 6px 14px;
      font-size: 12px;
      color: #64748b;
    }

    .google-g { width: 14px; height: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <div class="brand-logo">A</div>
      <span class="brand-name">AI Tasks</span>
    </div>

    ${icon}

    <h1>${heading}</h1>
    <p>${body}</p>

    <div class="divider"></div>

    <span class="google-badge">
      <svg class="google-g" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Authentification Google
    </span>
  </div>
  ${autoClose}
</body>
</html>`;
}

module.exports = { buildOAuthPage };
