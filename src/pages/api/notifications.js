// pages/api/notifications.js
const express = require("express");
const router = express.Router();

// Obtener notificaciones de un usuario
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  let connection;

  try {
    connection = await req.pool.getConnection();

    const [notifications] = await connection.query(
      `
      SELECT 
        n.*,
        t.trabajo_titulo,
        t.trabajo_descripcion,
        t.trabajo_salario,
        t.tipo_jornada,
        t.requisitos,
        h.horario_inicio,
        h.horario_fin,
        u.comuna,
        u.region
      FROM notificaciones n
      LEFT JOIN trabajos t ON JSON_EXTRACT(n.datos, '$.trabajo_id') = t.trabajo_id
      LEFT JOIN horarios h ON t.horario_id = h.horario_id
      LEFT JOIN ubicaciones u ON t.ubicacion_id = u.ubicacion_id
      WHERE n.usuario_id = ?
      ORDER BY n.fecha_creacion DESC
    `,
      [userId]
    );

    res.json(notifications);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({
      error: "Error al obtener notificaciones",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// Marcar notificación como leída
router.put("/:notificationId/read", async (req, res) => {
  const { notificationId } = req.params;
  let connection;

  try {
    connection = await req.pool.getConnection();

    await connection.query(
      "UPDATE notificaciones SET leida = true WHERE notificacion_id = ?",
      [notificationId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar notificación:", error);
    res.status(500).json({ error: "Error al actualizar notificación" });
  } finally {
    if (connection) connection.release();
  }
});

// Crear notificación para nuevo trabajo
router.post("/trabajo-nuevo", async (req, res) => {
  const { trabajo_id, usuario_id } = req.body;
  let connection;

  try {
    connection = await req.pool.getConnection();

    // Obtener información del trabajo
    const [trabajos] = await connection.query(
      `
      SELECT trabajo_titulo 
      FROM trabajos 
      WHERE trabajo_id = ?
    `,
      [trabajo_id]
    );

    if (trabajos.length === 0) {
      return res.status(404).json({ error: "Trabajo no encontrado" });
    }

    const trabajo = trabajos[0];

    // Crear la notificación
    const [result] = await connection.query(
      `INSERT INTO notificaciones (
        usuario_id, 
        tipo, 
        mensaje, 
        datos
      ) VALUES (?, 'nuevo_trabajo', ?, ?)`,
      [
        usuario_id,
        `Nueva oferta de trabajo: ${trabajo.trabajo_titulo}`,
        JSON.stringify({ trabajo_id, postulado: false }),
      ]
    );

    res.status(201).json({
      notificacion_id: result.insertId,
      message: "Notificación creada exitosamente",
    });
  } catch (error) {
    console.error("Error al crear notificación:", error);
    res.status(500).json({ error: "Error al crear notificación" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
