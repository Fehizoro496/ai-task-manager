const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');

// Racine des fichiers uploadés, servie en statique via /uploads (cf. app.js).
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');
const CHAT_DIR = path.join(UPLOADS_ROOT, 'chat');
const TASKS_DIR = path.join(UPLOADS_ROOT, 'tasks');

// Création idempotente des dossiers au démarrage.
fs.mkdirSync(CHAT_DIR, { recursive: true });
fs.mkdirSync(TASKS_DIR, { recursive: true });

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const MAX_FILES = 5;

// Types autorisés : images courantes + documents usuels. On bloque le reste
// pour éviter d'héberger des contenus exécutables/scriptables.
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CHAT_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 12);
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
  cb(new AppError(`Type de fichier non autorisé : ${file.mimetype}`, 400));
};

const chatUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
});

// ── Image de tâche ──────────────────────────────────────────────────────────
// Une seule image par tâche, stockée dans uploads/tasks. Types restreints aux
// images bitmap courantes.
const ALLOWED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

const taskImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TASKS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 12);
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

const taskImageFilter = (_req, file, cb) => {
  if (ALLOWED_IMAGE_MIME.has(file.mimetype)) return cb(null, true);
  cb(new AppError(`Type d'image non autorisé : ${file.mimetype}`, 400));
};

const taskImageUpload = multer({
  storage: taskImageStorage,
  fileFilter: taskImageFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

module.exports = {
  chatUpload,
  taskImageUpload,
  UPLOADS_ROOT,
  CHAT_DIR,
  TASKS_DIR,
  MAX_FILE_SIZE,
  MAX_FILES,
};
