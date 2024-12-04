const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// Ruta para restablecer la contraseña
router.post("/", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Token y nueva contraseña son requeridos" });
  }

  try {
    const connection = await req.pool.getConnection();

    // Verificar si el token existe y no está expirado
    const [rows] = await connection.query(
      `SELECT usuario_id, expiration_date, used 
       FROM password_reset_tokens 
       WHERE token = ?`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Token inválido o expirado" });
    }

    const { usuario_id, expiration_date, used } = rows[0];

    // Verificar si el token ya fue usado
    if (used) {
      return res.status(400).json({ error: "El token ya ha sido usado" });
    }

    // Verificar si el token ha expirado
    if (new Date(expiration_date) < new Date()) {
      return res.status(400).json({ error: "El token ha expirado" });
    }

    // Actualizar la contraseña del usuario
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await connection.query(
      "UPDATE usuarios SET usuario_password = ? WHERE usuario_id = ?",
      [hashedPassword, usuario_id]
    );

    // Marcar el token como usado
    await connection.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE token = ?",
      [token]
    );

    res.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
