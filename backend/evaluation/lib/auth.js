/**
 * Émission d'un JWT de test pour les benchmarks HTTP / temps réel.
 *
 * L'application n'a pas d'endpoint login mot de passe (auth via OAuth GitHub),
 * on signe donc directement un token avec la même clé et le même payload
 * ({ id, email, role }) que auth.service, à partir d'un utilisateur existant.
 */
const jwt = require("jsonwebtoken");
const env = require("./env");
const prisma = require("../../src/prisma/client");

/**
 * Récupère un utilisateur APPROVED (par défaut l'admin) et signe son JWT.
 * @returns {Promise<{token:string, user:{id,email,name,role,status}}>}
 */
const getToken = async (email = env.adminEmail) => {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET absent du .env — impossible de signer un token.");
  }
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, status: true },
  });
  if (!user) {
    throw new Error(
      `Utilisateur ${email} introuvable. Lance d'abord: npm run seed:admin`,
    );
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
  return { token, user };
};

module.exports = { getToken };
