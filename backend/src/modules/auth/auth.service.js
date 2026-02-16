const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../prisma/client");
const config = require("../../config/env");
const AppError = require("../../utils/AppError");

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

module.exports = { register, login, getMe };
