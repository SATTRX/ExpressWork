const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

// GET perfil del usuario
router.get("/profile", async (req, res) => {
  let connection;
  try {
    connection = await req.pool.getConnection();
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    // Obtener datos básicos del usuario
    const [userData] = await connection.query(
      `
      SELECT 
        u.usuario_id,
        u.usuario_nombre,
        u.usuario_email,
        u.usuario_fecha_nacimiento
      FROM usuarios u
      WHERE u.usuario_id = ?
    `,
      [userId]
    );

    if (!userData.length) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Obtener preferencia y ubicación del usuario
    const [userPref] = await connection.query(
      `
      SELECT 
        p.tipo_jornada,
        p.horario_inicio,
        p.horario_fin,
        p.salario_deseado,
        p.preferencia_id,
        u.comuna,
        u.region
      FROM preferencias p
      LEFT JOIN ubicaciones u ON p.ubicacion_id = u.ubicacion_id
      WHERE p.usuario_id = ?
    `,
      [userId]
    );

    let dias_semana = [];
    let categorias = [];

    // Si existe una preferencia, obtener días y categorías
    if (userPref.length > 0) {
      const [dias] = await connection.query(
        `
        SELECT dia_id 
        FROM preferencias_dias 
        WHERE preferencia_id = ?
      `,
        [userPref[0].preferencia_id]
      );

      const [cats] = await connection.query(
        `
        SELECT categoria_id 
        FROM preferencias_categorias 
        WHERE preferencia_id = ?
      `,
        [userPref[0].preferencia_id]
      );

      dias_semana = dias.map((d) => d.dia_id);
      categorias = cats.map((c) => c.categoria_id);
    }

    // Obtener habilidades del usuario
    const [habilidades] = await connection.query(
      `
      SELECT 
        habilidad_nombre,
        usuarios_habilidades_nivel as nivel,
        DATE_FORMAT(usuarios_habilidades_fecha_adquisicion, '%Y-%m-%d') as fecha_adquisicion
      FROM usuarios_habilidades
      WHERE usuario_id = ?
    `,
      [userId]
    );

    // Preparar el objeto de respuesta
    const userProfile = {
      ...userData[0],
      preferencias:
        userPref.length > 0
          ? {
              tipo_jornada: userPref[0].tipo_jornada,
              horario_inicio: userPref[0].horario_inicio,
              horario_fin: userPref[0].horario_fin,
              salario_deseado: userPref[0].salario_deseado,
              region: userPref[0].region,
              comuna: userPref[0].comuna,
              dias_semana,
              categorias,
            }
          : null,
      habilidades,
    };

    res.json(userProfile);
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// PUT actualizar perfil
router.put("/update", async (req, res) => {
  let connection;
  try {
    connection = await req.pool.getConnection();
    await connection.beginTransaction();

    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const { usuario_nombre, preferencias, habilidades } = req.body;

    // 1. Actualizar datos básicos del usuario
    await connection.query(
      "UPDATE usuarios SET usuario_nombre = ? WHERE usuario_id = ?",
      [usuario_nombre, userId]
    );

    // 2. Crear o actualizar ubicación
    const [ubicacionResult] = await connection.query(
      "INSERT INTO ubicaciones (comuna, region) VALUES (?, ?)",
      [preferencias.comuna, preferencias.region]
    );
    const ubicacionId = ubicacionResult.insertId;

    // 3. Manejar preferencias
    const [existingPref] = await connection.query(
      "SELECT preferencia_id FROM preferencias WHERE usuario_id = ?",
      [userId]
    );

    let preferenceId;
    if (existingPref.length > 0) {
      preferenceId = existingPref[0].preferencia_id;
      await connection.query(
        `UPDATE preferencias SET 
          tipo_jornada = ?,
          horario_inicio = ?,
          horario_fin = ?,
          salario_deseado = ?,
          ubicacion_id = ?
        WHERE preferencia_id = ?`,
        [
          preferencias.tipo_jornada,
          preferencias.horario_inicio,
          preferencias.horario_fin,
          preferencias.salario_deseado,
          ubicacionId,
          preferenceId,
        ]
      );
    } else {
      const [prefResult] = await connection.query(
        `INSERT INTO preferencias (
          usuario_id, tipo_jornada, horario_inicio, horario_fin, 
          salario_deseado, ubicacion_id
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          preferencias.tipo_jornada,
          preferencias.horario_inicio,
          preferencias.horario_fin,
          preferencias.salario_deseado,
          ubicacionId,
        ]
      );
      preferenceId = prefResult.insertId;
    }

    // 4. Actualizar días
    await connection.query(
      "DELETE FROM preferencias_dias WHERE preferencia_id = ?",
      [preferenceId]
    );
    if (preferencias.dias_semana?.length) {
      const diasValues = preferencias.dias_semana.map((dia) => [
        preferenceId,
        dia,
      ]);
      await connection.query(
        "INSERT INTO preferencias_dias (preferencia_id, dia_id) VALUES ?",
        [diasValues]
      );
    }

    // 5. Actualizar categorías
    await connection.query(
      "DELETE FROM preferencias_categorias WHERE preferencia_id = ?",
      [preferenceId]
    );
    if (preferencias.categorias?.length) {
      const catValues = preferencias.categorias.map((cat) => [
        preferenceId,
        cat,
      ]);
      await connection.query(
        "INSERT INTO preferencias_categorias (preferencia_id, categoria_id) VALUES ?",
        [catValues]
      );
    }

    // 6. Actualizar habilidades
    await connection.query(
      "DELETE FROM usuarios_habilidades WHERE usuario_id = ?",
      [userId]
    );
    if (habilidades?.length) {
      const habValues = habilidades.map((h) => [
        userId,
        h.habilidad_nombre,
        h.nivel,
        h.fecha_adquisicion,
      ]);
      await connection.query(
        `INSERT INTO usuarios_habilidades (
          usuario_id, habilidad_nombre, usuarios_habilidades_nivel, 
          usuarios_habilidades_fecha_adquisicion
        ) VALUES ?`,
        [habValues]
      );
    }

    await connection.commit();
    res.json({ message: "Perfil actualizado exitosamente" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({
      error: "Error al actualizar el perfil",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
