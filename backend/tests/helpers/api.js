const http = require("node:http");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const config = require("../../src/config/env");

let server = null;
let port = null;

/** Démarre l'app sur un port libre. Les tests tapent en HTTP réel : routage,
 *  middlewares d'auth et gestionnaire d'erreurs sont donc couverts eux aussi. */
const startServer = () =>
  new Promise((resolve, reject) => {
    if (server) return resolve(port);
    server = app.listen(0, "127.0.0.1", () => {
      port = server.address().port;
      resolve(port);
    });
    server.on("error", reject);
  });

const stopServer = () =>
  new Promise((resolve) => {
    if (!server) return resolve();
    server.closeAllConnections();
    server.close(() => {
      server = null;
      port = null;
      resolve();
    });
  });

/** Jeton signé comme le fait le module d'authentification. */
const tokenFor = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    config.jwtSecret,
    { expiresIn: "10m" },
  );

/**
 * Requête HTTP brute plutôt que `fetch` : le dispatcher global d'undici garde
 * ses sockets en keep-alive et maintiendrait le process de test en vie après la
 * dernière assertion. `agent: false` ouvre une connexion par appel, refermée
 * aussitôt.
 */
const send = (method, path, { body, token } = {}) =>
  new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const headers = {};
    if (payload !== null) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload);
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const req = http.request(
      { host: "127.0.0.1", port, path, method, headers, agent: false },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          text += chunk;
        });
        res.on("end", () => {
          let parsed = null;
          if (text) {
            try {
              parsed = JSON.parse(text);
            } catch {
              parsed = text;
            }
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      },
    );

    req.on("error", reject);
    if (payload !== null) req.write(payload);
    req.end();
  });

/** Client HTTP lié à un utilisateur (ou anonyme si `user` est omis). */
const asUser = (user) => {
  const token = user ? tokenFor(user) : null;
  return {
    token,
    get: (path) => send("GET", path, { token }),
    post: (path, body) => send("POST", path, { body, token }),
    put: (path, body) => send("PUT", path, { body, token }),
    patch: (path, body) => send("PATCH", path, { body, token }),
    delete: (path) => send("DELETE", path, { token }),
  };
};

const anonymous = () => asUser(null);

module.exports = { startServer, stopServer, tokenFor, asUser, anonymous };
