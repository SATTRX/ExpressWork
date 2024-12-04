const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Configuración de Mailtrap con tus credenciales
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "048b9851ae3051",
    pass: process.env.MAILTRAP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error("Error en la configuración del correo:", error);
  } else {
    console.log("Servidor listo para enviar correos");
  }
});

router.post("/", async (req, res) => {
  let connection;
  const { email } = req.body;

  console.log("Solicitud de recuperación para:", email);

  if (!email) {
    return res
      .status(400)
      .json({ error: "El correo electrónico es requerido" });
  }

  try {
    connection = await req.pool.getConnection();

    // Verificar si el usuario existe
    const [users] = await connection.query(
      "SELECT usuario_id, usuario_nombre FROM usuarios WHERE usuario_email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: "No existe una cuenta asociada a este correo electrónico",
      });
    }

    const usuario = users[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1);

    // Asegurarse de que la tabla existe
    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        token VARCHAR(64) NOT NULL,
        expiration_date DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
      )
    `);

    // Guardar el token
    await connection.query(
      `INSERT INTO password_reset_tokens (usuario_id, token, expiration_date) 
       VALUES (?, ?, ?)`,
      [usuario.usuario_id, resetToken, expirationTime]
    );

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // Enviar el correo
    const mailOptions = {
      from: '"Express Work" <expresswork@example.com>',
      to: email,
      subject: "Recuperación de Contraseña",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Recuperación de Contraseña</h2>
          <p>Hola ${usuario.usuario_nombre},</p>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 25px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Este enlace expirará en 1 hora.
            Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Correo enviado exitosamente a Mailtrap");

    res.json({
      message:
        "Se ha enviado un correo con las instrucciones para restablecer tu contraseña",
    });
  } catch (error) {
    console.error("Error en recuperación de contraseña:", error);
    res.status(500).json({
      error:
        "Error al procesar la solicitud. Por favor, intenta nuevamente más tarde.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
