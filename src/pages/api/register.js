const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

router.post("/", async (req, res) => {
  const {
    usuario_nombre,
    usuario_email,
    usuario_password,
    usuario_fecha_nacimiento,
  } = req.body;

  if (
    !usuario_nombre ||
    !usuario_email ||
    !usuario_password ||
    !usuario_fecha_nacimiento
  ) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    const hashedPassword = await bcrypt.hash(usuario_password, 10);
    const connection = await req.pool.getConnection();
    try {
      const [existingUser] = await connection.query(
        "SELECT * FROM usuarios WHERE usuario_email = ?",
        [usuario_email]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }

      const [result] = await connection.query(
        "CALL sp_registrar_usuario(?, ?, ?, ?)",
        [
          usuario_nombre,
          usuario_email,
          hashedPassword,
          usuario_fecha_nacimiento,
        ]
      );

      res.status(201).json({
        userId: result[0][0].usuario_id,
        message: "Usuario registrado exitosamente",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
