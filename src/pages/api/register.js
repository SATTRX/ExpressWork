const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

router.post("/", async (req, res) => {
  const {
    usuario_nombre,
    usuario_email,
    usuario_password,
    usuario_fecha_nacimiento,
    region,
    comuna,
    tipo_jornada,
    dia_de_la_semana, // Add this line
    horario_inicio,
    horario_fin,
    salario_deseado,
    categorias,
    habilidades,
  } = req.body;

  // Validate required fields
  if (
    !usuario_nombre ||
    !usuario_email ||
    !usuario_password ||
    !usuario_fecha_nacimiento
  ) {
    return res
      .status(400)
      .json({ error: "Faltan datos obligatorios del usuario" });
  }

  let connection;
  try {
    connection = await req.pool.getConnection();
    await connection.beginTransaction();

    // Check if email already exists
    const [existingUsers] = await connection.query(
      "SELECT * FROM usuarios WHERE usuario_email = ?",
      [usuario_email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(usuario_password, 10);

    // Register basic user using stored procedure
    const [userResult] = await connection.query(
      "CALL sp_registrar_usuario(?, ?, ?, ?)",
      [usuario_nombre, usuario_email, hashedPassword, usuario_fecha_nacimiento]
    );

    const userId = userResult[0][0].usuario_id;

    // If there are preferences, save them
    if (region && comuna && tipo_jornada) {
      // Get or insert location
      let [ubicacionResult] = await connection.query(
        "INSERT INTO ubicaciones (region, comuna) VALUES (?, ?) ON DUPLICATE KEY UPDATE ubicacion_id = LAST_INSERT_ID(ubicacion_id)",
        [region, comuna]
      );
      const ubicacionId = ubicacionResult.insertId;

      // Insert preferences using stored procedure
      const categoriasString = categorias ? categorias.join(",") : "";
      await connection.query(
        "CALL sp_insertar_preferencias_usuario(?, ?, ?, ?, ?, ?, ?, ?)",
        [
          userId,
          ubicacionId,
          tipo_jornada,
          dia_de_la_semana,
          horario_inicio,
          horario_fin,
          salario_deseado,
          categoriasString,
        ]
      );
    }

    // If there are skills, save them
    if (habilidades && habilidades.length > 0) {
      for (const habilidad of habilidades) {
        await connection.query(
          `INSERT INTO usuarios_habilidades 
           (usuario_id, habilidad_nombre, usuarios_habilidades_nivel, usuarios_habilidades_fecha_adquisicion)
           VALUES (?, ?, ?, ?)`,
          [
            userId,
            habilidad.habilidad_nombre,
            habilidad.nivel,
            habilidad.fecha_adquisicion,
          ]
        );
      }
    }

    // Commit transaction
    await connection.commit();

    // Respond with success
    res.status(201).json({
      userId,
      message:
        "Usuario registrado exitosamente con todas sus preferencias y habilidades",
    });
  } catch (error) {
    // If there's an error, rollback changes
    if (connection) await connection.rollback();
    console.error("Error detallado en el registro:", error);
    res.status(500).json({
      error: "Error al registrar usuario",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
