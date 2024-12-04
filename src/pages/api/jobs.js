const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  const {
    titulo,
    telefono,
    correo,
    comuna,
    region,
    direccion,
    salario,
    descripcion,
    requisitos,
    tipoJornada,
    fechaInicio,
    fechaFin,
    horaInicio,
    horaFin,
  } = req.body;

  if (!titulo || !telefono || !correo || !comuna || !region || !direccion) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios." });
  }

  const salarioNumerico = parseFloat(salario?.replace(/[^0-9.-]+/g, ""));
  if (!salarioNumerico || isNaN(salarioNumerico)) {
    return res
      .status(400)
      .json({ message: "El salario debe ser un número válido." });
  }

  try {
    const connection = await req.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insertar ubicación
      const [ubicacionResult] = await connection.query(
        "INSERT INTO ubicaciones (comuna, region) VALUES (?, ?)",
        [comuna, region]
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
          salarioNumerico,
          "activo",
          tipoJornada,
          fechaInicio,
          fechaFin,
          telefono,
          correo,
          requisitos,
          ubicacionId,
          horarioId,
        ]
      );

      await connection.commit();
      res.status(201).json({
        jobId: trabajoResult.insertId,
        message: "Oferta de trabajo creada exitosamente.",
      });
    } catch (error) {
      await connection.rollback();
      console.error("Error en la transacción:", error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al crear el trabajo:", error);
    res.status(500).json({ message: "Error al crear el trabajo." });
  }
});

// GET todas las ofertas de trabajo
router.get("/", async (req, res) => {
  try {
    const connection = await req.pool.getConnection();
    try {
      const [trabajos] = await connection.query(`
        SELECT 
          t.*,
          h.horario_inicio,
          h.horario_fin,
          u.comuna,
          u.region,
          COALESCE(usr.usuario_nombre, 'Anónimo') as publicador_nombre
        FROM trabajos t
        LEFT JOIN horarios h ON t.horario_id = h.horario_id
        LEFT JOIN ubicaciones u ON t.ubicacion_id = u.ubicacion_id
        LEFT JOIN usuarios usr ON t.usuario_id = usr.usuario_id
        WHERE t.trabajo_estado = 'activo'
        ORDER BY t.trabajo_fecha_publicacion DESC
      `);

      res.json(trabajos);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al obtener trabajos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET trabajo por ID
router.get("/:id", async (req, res) => {
  try {
    const connection = await req.pool.getConnection();
    try {
      const [trabajos] = await connection.query(
        `
        SELECT 
          t.*,
          h.horario_inicio,
          h.horario_fin,
          u.comuna,
          u.region,
          COALESCE(usr.usuario_nombre, 'Anónimo') as publicador_nombre
        FROM trabajos t
        LEFT JOIN horarios h ON t.horario_id = h.horario_id
        LEFT JOIN ubicaciones u ON t.ubicacion_id = u.ubicacion_id
        LEFT JOIN usuarios usr ON t.usuario_id = usr.usuario_id
        WHERE t.trabajo_id = ?
      `,
        [req.params.id]
      );

      if (trabajos.length === 0) {
        return res.status(404).json({ error: "Trabajo no encontrado" });
      }

      res.json(trabajos[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al obtener el trabajo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
