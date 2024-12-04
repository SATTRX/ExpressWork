const express = require("express");
const router = express.Router();

// Obtener todos los trabajos
router.get("/", async (req, res) => {
  let connection;
  try {
    connection = await req.pool.getConnection();

    const [jobs] = await connection.query(`
      SELECT 
        t.trabajo_id,
        t.trabajo_titulo,
        t.trabajo_descripcion,
        t.trabajo_salario,
        t.trabajo_estado,
        t.tipo_jornada,
        t.fecha_inicio,
        t.fin_postulacion,
        t.telefono,
        t.correo,
        t.requisitos,
        t.trabajo_fecha_publicacion,
        h.horario_inicio,
        h.horario_fin,
        u.comuna,
        u.ciudad,
        u.region,
        COALESCE(usr.usuario_nombre, 'Anónimo') as publicador_nombre,
        DATE_FORMAT(t.trabajo_fecha_publicacion, '%d/%m/%Y') as fecha_publicacion,
        TIME_FORMAT(t.trabajo_fecha_publicacion, '%H:%i') as hora_publicacion
      FROM trabajos t
      LEFT JOIN horarios h ON t.horario_id = h.horario_id
      LEFT JOIN ubicaciones u ON t.ubicacion_id = u.ubicacion_id
      LEFT JOIN usuarios usr ON t.usuario_id = usr.usuario_id
      WHERE t.trabajo_estado = 'activo'
      ORDER BY t.trabajo_fecha_publicacion DESC
    `);

    const formattedJobs = jobs.map((job) => ({
      trabajo_id: job.trabajo_id,
      trabajo_titulo: job.trabajo_titulo,
      trabajo_descripcion: job.trabajo_descripcion,
      trabajo_salario: job.trabajo_salario,
      trabajo_estado: job.trabajo_estado,
      tipo_jornada: job.tipo_jornada || "Tiempo completo",
      fecha_inicio: job.fecha_inicio,
      fin_postulacion: job.fin_postulacion,
      horario_inicio: job.horario_inicio,
      horario_fin: job.horario_fin,
      comuna: job.comuna,
      ciudad: job.ciudad,
      region: job.region,
      publicador_nombre: job.publicador_nombre,
      fecha_publicacion: job.fecha_publicacion,
      hora_publicacion: job.hora_publicacion,
      correo: job.correo,
      telefono: job.telefono,
      requisitos: job.requisitos,
    }));

    res.json(formattedJobs);
  } catch (error) {
    console.error("Error al obtener los trabajos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
});

// Obtener trabajo por ID
router.get("/:id", async (req, res) => {
  const jobId = req.params.id;
  let connection;

  try {
    connection = await req.pool.getConnection();

    const [jobs] = await connection.query(
      `SELECT 
        t.trabajo_id,
        t.trabajo_titulo,
        t.trabajo_descripcion,
        t.trabajo_salario,
        t.trabajo_estado,
        t.tipo_jornada,
        t.fecha_inicio,
        t.fin_postulacion,
        t.telefono,
        t.correo,
        t.requisitos,
        t.trabajo_fecha_publicacion,
        h.horario_inicio,
        h.horario_fin,
        u.comuna,
        u.ciudad,
        u.region,
        COALESCE(usr.usuario_nombre, 'Anónimo') as publicador_nombre,
        DATE_FORMAT(t.trabajo_fecha_publicacion, '%d/%m/%Y') as fecha_publicacion,
        TIME_FORMAT(t.trabajo_fecha_publicacion, '%H:%i') as hora_publicacion
      FROM trabajos t
      LEFT JOIN horarios h ON t.horario_id = h.horario_id
      LEFT JOIN ubicaciones u ON t.ubicacion_id = u.ubicacion_id
      LEFT JOIN usuarios usr ON t.usuario_id = usr.usuario_id
      WHERE t.trabajo_id = ?`,
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ error: "Trabajo no encontrado" });
    }

    const job = jobs[0];
    const formattedJob = {
      trabajo_id: job.trabajo_id,
      trabajo_titulo: job.trabajo_titulo,
      trabajo_descripcion: job.trabajo_descripcion,
      trabajo_salario: job.trabajo_salario,
      trabajo_estado: job.trabajo_estado,
      tipo_jornada: job.tipo_jornada || "Tiempo completo",
      fecha_inicio: job.fecha_inicio,
      fin_postulacion: job.fin_postulacion,
      horario_inicio: job.horario_inicio,
      horario_fin: job.horario_fin,
      comuna: job.comuna,
      ciudad: job.ciudad,
      region: job.region,
      publicador_nombre: job.publicador_nombre,
      fecha_publicacion: job.fecha_publicacion,
      hora_publicacion: job.hora_publicacion,
      correo: job.correo,
      telefono: job.telefono,
      requisitos: job.requisitos,
    };

    res.json(formattedJob);
  } catch (error) {
    console.error("Error al obtener el trabajo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
});

// Función auxiliar para verificar preferencias
const checkPreferences = async (connection, trabajo) => {
  const [usuarios] = await connection.query(
    `
    SELECT DISTINCT u.usuario_id
    FROM usuarios u
    JOIN preferencias p ON u.usuario_id = p.usuario_id
    JOIN ubicaciones ub ON p.ubicacion_id = ub.ubicacion_id
    WHERE 
      ub.region = ? AND
      p.tipo_jornada = ? AND
      p.salario_deseado <= ?
  `,
    [trabajo.region, trabajo.tipo_jornada, trabajo.trabajo_salario]
  );

  return usuarios;
};

// Función auxiliar para crear notificación
const createNotification = async (connection, usuario_id, trabajo) => {
  await connection.query(
    `
    INSERT INTO notificaciones (
      usuario_id,
      tipo,
      mensaje,
      datos
    ) VALUES (?, 'nuevo_trabajo', ?, ?)`,
    [
      usuario_id,
      `Nueva oferta de trabajo: ${trabajo.trabajo_titulo}`,
      JSON.stringify({
        trabajo_id: trabajo.trabajo_id,
        postulado: false,
      }),
    ]
  );
};

// Crear nuevo trabajo
router.post("/", async (req, res) => {
  const {
    titulo,
    telefono,
    correo,
    ubicacion,
    salario,
    descripcion,
    requisitos,
    tipoJornada,
    fechaInicio,
    finPostulacion,
    horaInicio,
    horaFin,
  } = req.body;

  if (!titulo || !telefono || !correo || !ubicacion) {
    return res.status(400).json({
      error: "Faltan campos requeridos",
      details: "Todos los campos marcados con * son obligatorios.",
    });
  }

  let connection;
  try {
    connection = await req.pool.getConnection();
    await connection.beginTransaction();

    // Insertar ubicación
    const [ubicacionResult] = await connection.query(
      "INSERT INTO ubicaciones (comuna, ciudad, region) VALUES (?, ?, ?)",
      [ubicacion.comuna, ubicacion.ciudad, ubicacion.region]
    );
    const ubicacionId = ubicacionResult.insertId;

    // Insertar horario
    const [horarioResult] = await connection.query(
      "INSERT INTO horarios (horario_inicio, horario_fin) VALUES (?, ?)",
      [horaInicio, horaFin]
    );
    const horarioId = horarioResult.insertId;

    // Insertar trabajo
    const [trabajoResult] = await connection.query(
      `INSERT INTO trabajos (
        trabajo_titulo,
        trabajo_descripcion,
        trabajo_salario,
        trabajo_fecha_publicacion,
        trabajo_estado,
        tipo_jornada,
        fecha_inicio,
        fin_postulacion,
        telefono,
        correo,
        requisitos,
        ubicacion_id,
        horario_id
      ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo,
        descripcion,
        salario,
        "activo",
        tipoJornada,
        fechaInicio,
        finPostulacion,
        telefono,
        correo,
        requisitos,
        ubicacionId,
        horarioId,
      ]
    );

    const trabajoId = trabajoResult.insertId;

    // Obtener información completa del trabajo
    const [trabajoInfo] = await connection.query(
      `
      SELECT t.*, u.region
      FROM trabajos t
      JOIN ubicaciones u ON t.ubicacion_id = u.ubicacion_id
      WHERE t.trabajo_id = ?
    `,
      [trabajoId]
    );

    // Buscar usuarios con preferencias coincidentes
    const usuariosCoincidentes = await checkPreferences(connection, {
      ...trabajoInfo[0],
      region: ubicacion.region,
      tipo_jornada: tipoJornada,
      trabajo_salario: salario,
    });

    // Crear notificaciones
    for (const usuario of usuariosCoincidentes) {
      await createNotification(connection, usuario.usuario_id, {
        trabajo_id: trabajoId,
        trabajo_titulo: titulo,
      });
    }

    // Enviar notificación por WebSocket si está disponible
    if (req.app.locals.wss) {
      const notification = {
        type: "nuevo_trabajo",
        trabajo: {
          trabajo_id: trabajoId,
          trabajo_titulo: titulo,
          trabajo_descripcion: descripcion,
          trabajo_salario: salario,
          ubicacion,
          tipo_jornada: tipoJornada,
          horario: {
            inicio: horaInicio,
            fin: horaFin,
          },
        },
      };

      req.app.locals.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(notification));
        }
      });
    }

    await connection.commit();
    res.status(201).json({
      trabajo_id: trabajoId,
      message: "Oferta de trabajo creada exitosamente",
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error al crear el trabajo:", error);
    res.status(500).json({
      error: "Error al crear la oferta de trabajo",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// Postular a un trabajo
router.post("/:trabajoId/postular", async (req, res) => {
  const { trabajoId } = req.params;
  const { userId } = req.body;

  let connection;
  try {
    connection = await req.pool.getConnection();
    await connection.beginTransaction();

    // Verificar si ya existe una postulación
    const [existingPostulacion] = await connection.query(
      "SELECT * FROM postulaciones WHERE trabajo_id = ? AND usuario_id = ?",
      [trabajoId, userId]
    );

    if (existingPostulacion.length > 0) {
      return res.status(400).json({ error: "Ya has postulado a este trabajo" });
    }

    // Crear postulación
    await connection.query(
      "INSERT INTO postulaciones (trabajo_id, usuario_id, estado) VALUES (?, ?, ?)",
      [trabajoId, userId, "pendiente"]
    );

    // Actualizar notificación
    await connection.query(
      `UPDATE notificaciones 
       SET datos = JSON_SET(datos, '$.postulado', true)
       WHERE usuario_id = ? 
       AND JSON_EXTRACT(datos, '$.trabajo_id') = ?`,
      [userId, trabajoId]
    );

    await connection.commit();
    res.json({
      success: true,
      message: "Postulación realizada exitosamente",
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error en la postulación:", error);
    res.status(500).json({ error: "Error al procesar la postulación" });
  } finally {
    if (connection) connection.release();
  }
});
// Agregar estas rutas después de las existentes en tu archivo

const checkAndUpdateJobStatus = async (connection, trabajoId) => {
  try {
    // Obtener estadísticas de evaluaciones recientes (últimos 30 días)
    const [stats] = await connection.query(
      `
      SELECT 
        COUNT(*) as total_evaluaciones,
        AVG(puntuacion) as promedio,
        SUM(CASE WHEN puntuacion <= 2 THEN 1 ELSE 0 END) as evaluaciones_negativas,
        MIN(puntuacion) as puntuacion_minima
      FROM evaluaciones
      WHERE trabajo_id = ?
      AND fecha_evaluacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `,
      [trabajoId]
    );

    const {
      total_evaluaciones,
      promedio,
      evaluaciones_negativas,
      puntuacion_minima,
    } = stats[0];

    // Solo evaluar si hay suficientes evaluaciones
    if (total_evaluaciones >= 5) {
      const porcentajeNegativo =
        (evaluaciones_negativas / total_evaluaciones) * 100;
      let nuevoEstado = "activo";
      let motivo = "";

      // Criterios para cambiar el estado
      if (porcentajeNegativo >= 80) {
        nuevoEstado = "eliminado";
        motivo = "evaluaciones_muy_negativas";
      } else if (porcentajeNegativo >= 60) {
        nuevoEstado = "inactivo";
        motivo = "evaluaciones_negativas";
      } else if (promedio <= 2.5) {
        nuevoEstado = "inactivo";
        motivo = "baja_puntuacion";
      }

      // Si el estado debe cambiar
      if (nuevoEstado !== "activo") {
        await connection.beginTransaction();

        // Actualizar estado del trabajo
        await connection.query(
          "UPDATE trabajos SET trabajo_estado = ? WHERE trabajo_id = ?",
          [nuevoEstado, trabajoId]
        );

        // Registrar el cambio de estado
        await connection.query(
          `
          INSERT INTO trabajo_historial_estados (
            trabajo_id,
            estado_anterior,
            estado_nuevo,
            motivo,
            detalles
          ) VALUES (?, 'activo', ?, ?, ?)
        `,
          [
            trabajoId,
            nuevoEstado,
            motivo,
            JSON.stringify({
              total_evaluaciones,
              promedio,
              evaluaciones_negativas,
              puntuacion_minima,
              porcentaje_negativo: porcentajeNegativo,
            }),
          ]
        );

        await connection.commit();
        return {
          estadoCambiado: true,
          nuevoEstado,
          motivo,
          detalles: {
            total_evaluaciones,
            promedio,
            evaluaciones_negativas,
            porcentaje_negativo,
          },
        };
      }
    }

    return {
      estadoCambiado: false,
      nuevoEstado: "activo",
      motivo: "sin_cambios",
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error al verificar estado del trabajo:", error);
    throw error;
  }
};

// Modificar la ruta de evaluación para usar la nueva función
router.post("/:trabajoId/evaluar", async (req, res) => {
  const { trabajoId } = req.params;
  const { userId, puntuacion, comentario } = req.body;
  let connection;

  try {
    connection = await req.pool.getConnection();
    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO evaluaciones (
        trabajo_id,
        usuario_id,
        puntuacion,
        comentario,
        fecha_evaluacion
      ) VALUES (?, ?, ?, ?, NOW())`,
      [trabajoId, userId, puntuacion, comentario.trim()]
    );

    // Verificar estado del trabajo
    const estadoResult = await checkAndUpdateJobStatus(connection, trabajoId);

    await connection.commit();

    // Preparar mensaje de respuesta
    let mensaje = "Evaluación enviada exitosamente";
    if (estadoResult.estadoCambiado) {
      if (estadoResult.nuevoEstado === "eliminado") {
        mensaje =
          "La oferta ha sido eliminada debido a múltiples evaluaciones muy negativas.";
      } else if (estadoResult.nuevoEstado === "inactivo") {
        mensaje =
          "La oferta ha sido desactivada debido a evaluaciones negativas.";
      }
    }

    res.json({
      success: true,
      message: mensaje,
      trabajoInactivado: estadoResult.estadoCambiado,
      nuevoEstado: estadoResult.nuevoEstado,
      motivo: estadoResult.motivo,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error al crear evaluación:", error);
    res.status(500).json({ error: "Error al crear evaluación" });
  } finally {
    if (connection) connection.release();
  }
});

// Verificar si un usuario ya postuló y si evaluó
router.get("/:trabajoId/postulacion/:userId", async (req, res) => {
  const { trabajoId, userId } = req.params;
  let connection;

  try {
    connection = await req.pool.getConnection();
    const [postulaciones] = await connection.query(
      `SELECT 
        p.*,
        e.evaluacion_id,
        e.puntuacion,
        e.comentario,
        DATE_FORMAT(p.fecha_postulacion, '%d/%m/%Y') as fecha_formateada
      FROM postulaciones p
      LEFT JOIN evaluaciones e ON p.trabajo_id = e.trabajo_id AND p.usuario_id = e.usuario_id
      WHERE p.trabajo_id = ? AND p.usuario_id = ?`,
      [trabajoId, userId]
    );

    res.json({
      exists: postulaciones.length > 0,
      postulacion: postulaciones[0] || null,
      hasEvaluation: postulaciones[0]?.evaluacion_id != null,
    });
  } catch (error) {
    console.error("Error al verificar postulación:", error);
    res.status(500).json({ error: "Error al verificar postulación" });
  } finally {
    if (connection) connection.release();
  }
});

router.get("/buscar", async (req, res) => {
  let connection;
  try {
    const {
      q = "",
      salarioMin,
      salarioMax,
      region,
      comuna,
      tipoJornada,
      horaInicio,
      horaFin,
      fechaInicio,
      fechaFin,
    } = req.query;

    connection = await req.pool.getConnection();

    let query = `
      SELECT 
        t.*,
        h.horario_inicio,
        h.horario_fin,
        u.comuna,
        u.region,
        DATE_FORMAT(t.trabajo_fecha_publicacion, '%d/%m/%Y') as fecha_publicacion,
        TIME_FORMAT(t.trabajo_fecha_publicacion, '%H:%i') as hora_publicacion
      FROM trabajos t
      LEFT JOIN horarios h ON t.horario_id = h.horario_id
      LEFT JOIN ubicaciones u ON t.ubicacion_id = u.ubicacion_id
      WHERE t.trabajo_estado = 'activo'
    `;

    const params = [];

    // Aplicar filtros
    if (q) {
      query += ` AND (t.trabajo_titulo LIKE ? OR t.trabajo_descripcion LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    if (salarioMin) {
      query += ` AND t.trabajo_salario >= ?`;
      params.push(salarioMin);
    }

    if (salarioMax) {
      query += ` AND t.trabajo_salario <= ?`;
      params.push(salarioMax);
    }

    if (region) {
      query += ` AND u.region = ?`;
      params.push(region);
    }

    if (comuna) {
      query += ` AND u.comuna = ?`;
      params.push(comuna);
    }

    if (tipoJornada) {
      query += ` AND t.tipo_jornada = ?`;
      params.push(tipoJornada);
    }

    if (horaInicio) {
      query += ` AND h.horario_inicio >= ?`;
      params.push(horaInicio);
    }

    if (horaFin) {
      query += ` AND h.horario_fin <= ?`;
      params.push(horaFin);
    }

    if (fechaInicio) {
      query += ` AND t.fecha_inicio >= ?`;
      params.push(fechaInicio);
    }

    if (fechaFin) {
      query += ` AND t.fin_postulacion <= ?`;
      params.push(fechaFin);
    }

    query += ` ORDER BY t.trabajo_fecha_publicacion DESC`;

    console.log("Query:", query);
    console.log("Params:", params);

    const [trabajos] = await connection.execute(query, params);

    // Formatear fechas y datos antes de enviar
    const trabajosFormateados = trabajos.map((trabajo) => ({
      ...trabajo,
      trabajo_fecha_publicacion: trabajo.trabajo_fecha_publicacion
        ? new Date(trabajo.trabajo_fecha_publicacion).toLocaleDateString(
            "es-CL"
          )
        : null,
      fecha_inicio: trabajo.fecha_inicio
        ? new Date(trabajo.fecha_inicio).toLocaleDateString("es-CL")
        : null,
      fin_postulacion: trabajo.fin_postulacion
        ? new Date(trabajo.fin_postulacion).toLocaleDateString("es-CL")
        : null,
      trabajo_salario: Number(trabajo.trabajo_salario),
    }));

    res.json(trabajosFormateados);
  } catch (error) {
    console.error("Error en búsqueda:", error);
    res.status(500).json({
      error: "Error en la búsqueda de trabajos",
      details: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});
// Ruta para obtener un trabajo específico
router.get("/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await req.pool.getConnection();

    const query = `
       SELECT 
    t.trabajo_id,
    t.trabajo_titulo,
    t.trabajo_descripcion,
    t.trabajo_salario,
    t.trabajo_estado,
    t.tipo_jornada,
    t.telefono,
    t.correo,
    t.requisitos,
    t.fecha_inicio,
    t.fin_postulacion,
    t.puntuacion_promedio,
    DATE_FORMAT(t.trabajo_fecha_publicacion, '%d/%m/%Y') as fecha_publicacion,
    TIME_FORMAT(t.trabajo_fecha_publicacion, '%H:%i') as hora_publicacion,
    DATE_FORMAT(t.fecha_inicio, '%d/%m/%Y') as fecha_inicio_formateada,
    DATE_FORMAT(t.fin_postulacion, '%d/%m/%Y') as fecha_fin_formateada,
    h.horario_inicio,
    h.horario_fin,
    u.comuna,
    u.region,
    COALESCE(us.usuario_nombre, 'Anónimo') as publicador_nombre
  FROM trabajos t
  LEFT JOIN horarios h ON t.horario_id = h.horario_id
  LEFT JOIN ubicaciones u ON t.ubicacion_id = u.ubicacion_id
  LEFT JOIN usuarios us ON t.usuario_id = us.usuario_id
  WHERE t.trabajo_estado = 'activo'
    `;

    const [trabajos] = await connection.execute(query, [id]);

    if (trabajos.length === 0) {
      return res.status(404).json({ error: "Trabajo no encontrado" });
    }

    const trabajo = {
      ...trabajos[0],
      trabajo_salario: Number(trabajos[0].trabajo_salario) || 0,
    };

    res.json(trabajo);
  } catch (error) {
    console.error("Error al obtener trabajo:", error);
    res.status(500).json({
      error: "Error al obtener el trabajo",
      message: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Obtener evaluaciones de un trabajo
router.get("/:trabajoId/evaluaciones", async (req, res) => {
  const { trabajoId } = req.params;
  let connection;

  try {
    connection = await req.pool.getConnection();
    const [evaluaciones] = await connection.query(
      `SELECT 
        e.*,
        u.usuario_nombre,
        DATE_FORMAT(e.fecha_evaluacion, '%d/%m/%Y') as fecha_formateada
      FROM evaluaciones e
      JOIN usuarios u ON e.usuario_id = u.usuario_id
      WHERE e.trabajo_id = ?
      ORDER BY e.fecha_evaluacion DESC`,
      [trabajoId]
    );

    // Calcular promedio de puntuaciones
    const [promedio] = await connection.query(
      `SELECT AVG(puntuacion) as promedio
       FROM evaluaciones
       WHERE trabajo_id = ?`,
      [trabajoId]
    );

    res.json({
      evaluaciones,
      promedio: promedio[0].promedio || 0,
      total: evaluaciones.length,
    });
  } catch (error) {
    console.error("Error al obtener evaluaciones:", error);
    res.status(500).json({ error: "Error al obtener evaluaciones" });
  } finally {
    if (connection) connection.release();
  }
});

// Crear evaluación
router.post("/:trabajoId/evaluar", async (req, res) => {
  const { trabajoId } = req.params;
  const { userId, puntuacion, comentario } = req.body;
  let connection;

  try {
    connection = await req.pool.getConnection();
    await connection.beginTransaction();

    // Verificar si el trabajo existe y está activo
    const [trabajos] = await connection.query(
      "SELECT trabajo_estado FROM trabajos WHERE trabajo_id = ?",
      [trabajoId]
    );

    if (trabajos.length === 0) {
      return res.status(404).json({ error: "Trabajo no encontrado" });
    }

    // Verificar si el usuario ha postulado
    const [postulacion] = await connection.query(
      "SELECT * FROM postulaciones WHERE trabajo_id = ? AND usuario_id = ?",
      [trabajoId, userId]
    );

    if (postulacion.length === 0) {
      return res
        .status(400)
        .json({ error: "Debes postular primero para poder evaluar" });
    }

    // Verificar si ya existe una evaluación
    const [existingEvaluation] = await connection.query(
      "SELECT * FROM evaluaciones WHERE trabajo_id = ? AND usuario_id = ?",
      [trabajoId, userId]
    );

    if (existingEvaluation.length > 0) {
      return res.status(400).json({ error: "Ya has evaluado esta oferta" });
    }

    if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
      return res
        .status(400)
        .json({ error: "La puntuación debe estar entre 1 y 5" });
    }

    if (!comentario || comentario.trim().length < 10) {
      return res
        .status(400)
        .json({ error: "El comentario debe tener al menos 10 caracteres" });
    }

    // Crear evaluación
    await connection.query(
      `INSERT INTO evaluaciones (
        trabajo_id,
        usuario_id,
        puntuacion,
        comentario,
        fecha_evaluacion
      ) VALUES (?, ?, ?, ?, NOW())`,
      [trabajoId, userId, puntuacion, comentario.trim()]
    );

    // Actualizar cache de puntuación en trabajo (opcional)
    await connection.query(
      `UPDATE trabajos 
       SET puntuacion_promedio = (
         SELECT AVG(puntuacion) 
         FROM evaluaciones 
         WHERE trabajo_id = ?
       )
       WHERE trabajo_id = ?`,
      [trabajoId, trabajoId]
    );

    await connection.commit();
    res.json({
      success: true,
      message: "Evaluación enviada exitosamente",
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error al crear evaluación:", error);
    res.status(500).json({ error: "Error al crear evaluación" });
  } finally {
    if (connection) connection.release();
  }
});
// Agregar esta ruta antes de las demás rutas en trabajos.js
router.get("/:trabajoId/postulacion/:userId", async (req, res) => {
  const { trabajoId, userId } = req.params;
  let connection;

  try {
    connection = await req.pool.getConnection();

    // Verificar si existe una postulación
    const [postulacion] = await connection.query(
      `SELECT 
        p.*,
        COALESCE(e.evaluacion_id, NULL) as tiene_evaluacion,
        DATE_FORMAT(p.fecha_postulacion, '%d/%m/%Y') as fecha_formateada
      FROM postulaciones p
      LEFT JOIN evaluaciones e ON p.trabajo_id = e.trabajo_id AND p.usuario_id = e.usuario_id
      WHERE p.trabajo_id = ? AND p.usuario_id = ?`,
      [trabajoId, userId]
    );

    // Si no hay postulación, devolver false
    if (postulacion.length === 0) {
      return res.json({
        exists: false,
        postulacion: null,
        hasEvaluation: false,
      });
    }

    // Si hay postulación, devolver los detalles
    res.json({
      exists: true,
      postulacion: {
        ...postulacion[0],
        fecha_postulacion: postulacion[0].fecha_formateada,
      },
      hasEvaluation: postulacion[0].tiene_evaluacion !== null,
    });
  } catch (error) {
    console.error("Error al verificar postulación:", error);
    res.status(500).json({ error: "Error al verificar postulación" });
  } finally {
    if (connection) connection.release();
  }
});

// Obtener estadísticas de postulaciones para un trabajo
router.get("/:trabajoId/estadisticas", async (req, res) => {
  const { trabajoId } = req.params;
  let connection;

  try {
    connection = await req.pool.getConnection();

    // Obtener total de postulaciones
    const [postulaciones] = await connection.query(
      `SELECT COUNT(*) as total,
       SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
       SUM(CASE WHEN estado = 'aceptada' THEN 1 ELSE 0 END) as aceptadas,
       SUM(CASE WHEN estado = 'rechazada' THEN 1 ELSE 0 END) as rechazadas
       FROM postulaciones
       WHERE trabajo_id = ?`,
      [trabajoId]
    );

    // Obtener estadísticas de evaluaciones
    const [evaluaciones] = await connection.query(
      `SELECT 
        COUNT(*) as total_evaluaciones,
        AVG(puntuacion) as puntuacion_promedio,
        MIN(puntuacion) as puntuacion_minima,
        MAX(puntuacion) as puntuacion_maxima
       FROM evaluaciones
       WHERE trabajo_id = ?`,
      [trabajoId]
    );

    res.json({
      postulaciones: {
        total: postulaciones[0].total,
        pendientes: postulaciones[0].pendientes,
        aceptadas: postulaciones[0].aceptadas,
        rechazadas: postulaciones[0].rechazadas,
      },
      evaluaciones: {
        total: evaluaciones[0].total_evaluaciones,
        promedio: evaluaciones[0].puntuacion_promedio || 0,
        minima: evaluaciones[0].puntuacion_minima || 0,
        maxima: evaluaciones[0].puntuacion_maxima || 0,
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
