/**
 * Client HTTP instrumenté : mesure la latence bout-à-bout (envoi → corps lu)
 * de chaque requête. S'appuie sur le fetch global (Node ≥ 18).
 */
const { performance } = require("perf_hooks");
const env = require("./env");

/**
 * Exécute une requête chronométrée.
 * @param {string} path  chemin relatif (ex. "/api/projects") ou URL absolue
 * @param {object} opts  { method, token, body, headers }
 * @returns {Promise<{ok:boolean,status:number,ms:number,bytes:number,body:any}>}
 */
const request = async (path, { method = "GET", token, body, headers } = {}) => {
  const url = path.startsWith("http") ? path : `${env.apiUrl}${path}`;
  const h = { ...(headers || {}) };
  if (token) h.Authorization = `Bearer ${token}`;
  if (body !== undefined) h["Content-Type"] = "application/json";

  const t0 = performance.now();
  let res;
  let text = "";
  try {
    res = await fetch(url, {
      method,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    text = await res.text();
  } catch (err) {
    const ms = performance.now() - t0;
    return { ok: false, status: 0, ms, bytes: 0, body: null, error: err.message };
  }
  const ms = performance.now() - t0;

  let parsed = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* corps non-JSON : on garde le texte brut */
  }
  return {
    ok: res.ok,
    status: res.status,
    ms,
    bytes: Buffer.byteLength(text),
    body: parsed,
  };
};

module.exports = { request };
