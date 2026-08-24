const config = require("../config/env");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal server error";

  if (config.nodeEnv === "development") {
    console.error(err);
  }

  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation error",
      details: err.errors,
    });
  }

  if (err.code === "P2002") {
    return res.status(409).json({
      error: "A record with this value already exists",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      error: "Record not found",
    });
  }

  // Erreurs d'upload multer (taille/nombre de fichiers dépassés, etc.).
  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "Fichier trop volumineux (max 10 Mo).",
      LIMIT_FILE_COUNT: "Trop de fichiers (max 5).",
      LIMIT_UNEXPECTED_FILE: "Champ de fichier inattendu.",
    };
    return res.status(400).json({ error: messages[err.code] || "Upload invalide." });
  }

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
