const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

router.post("/", async (req, res) => {
  const { usuario_email, usuario_password } = req.body;

  if (!usuario_email || !usuario_password) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    const connection = await req.pool.getConnection();
    try {
      const [users] = await connection.query(
        "SELECT * FROM usuarios WHERE usuario_email = ?",
        [usuario_email]
      );

      if (users.length === 0) {
        return res.status(400).json({ error: "Usuario no encontrado" });
      }

      const user = users[0];
      const isPasswordValid = await bcrypt.compare(
        usuario_password,
        user.usuario_password
      );

      if (!isPasswordValid) {
        return res.status(400).json({ error: "Contraseña incorrecta" });
      }

      res.status(200).json({
        userId: user.usuario_id,
        usuario_nombre: user.usuario_nombre,
        message: "Login exitoso",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
