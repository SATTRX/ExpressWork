const express = require("express");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Middleware to add pool to request
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// Configurar CORS antes de definir cualquier ruta
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
  })
);

app.use(express.json());

// Rutas
app.use("/api/register", require("./pages/api/register"));
app.use("/api/login", require("./pages/api/login"));
app.use("/api/workers", require("./pages/api/workers"));
app.use("/api/notifications", require("./pages/api/notifications"));
app.use("/api/workdays", require("./pages/api/workdays"));

app.post("/api/jobs", async (req, res) => {
  const {
    titulo,
    telefono,
    correo,
    ubicacion,
    salario,
    descripcion,
    requisitos,
    fechaInicio,
    finPostulacion,
    horaInicio,
    horaFin,
  } = req.body;

  // Fecha actual como fecha de publicación
  const fechaPublicacion = new Date().toISOString().slice(0, 10);

  // Validación del salario
  const salarioNumerico = parseFloat(salario?.replace(/[^0-9.-]+/g, ""));
  if (!salarioNumerico || isNaN(salarioNumerico)) {
    return res
      .status(400)
      .json({ error: "El salario debe ser un número válido." });
  }

  // Validación de datos de ubicación
  if (
    !ubicacion ||
    !ubicacion.comuna ||
    !ubicacion.ciudad ||
    !ubicacion.region
  ) {
    return res
      .status(400)
      .json({ error: "Los datos de ubicación son obligatorios." });
  }

  try {
    const connection = await req.pool.getConnection();

    try {
      await connection.beginTransaction();

      // Insertar en ubicaciones
      const [ubicacionResult] = await connection.query(
        "INSERT INTO ubicaciones (comuna, ciudad, region) VALUES (?, ?, ?)",
        [ubicacion.comuna, ubicacion.ciudad, ubicacion.region]
      );
      const ubicacionId = ubicacionResult.insertId;

      // Insertar en trabajos
      const [trabajoResult] = await connection.query(
        `INSERT INTO trabajos (
          trabajo_titulo, 
          trabajo_descripcion, 
          trabajo_salario, 
          trabajo_fecha_publicacion, 
          trabajo_estado, 
          fecha_inicio, 
          fin_postulacion,
          telefono, 
          correo, 
          ubicacion_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          titulo,
          descripcion,
          salarioNumerico,
          fechaPublicacion,
          "activo",
          fechaInicio,
          finPostulacion,
          telefono,
          correo,
          ubicacionId,
        ]
      );
      const trabajoId = trabajoResult.insertId;

      // Insertar horarios
      const [horarioResult] = await connection.query(
        "INSERT INTO horarios (horario_inicio, horario_fin) VALUES (?, ?)",
        [horaInicio, horaFin]
      );
      const horarioId = horarioResult.insertId;

      // Relacionar trabajo con horario
      await connection.query(
        "UPDATE trabajos SET horario_id = ? WHERE trabajo_id = ?",
        [horarioId, trabajoId]
      );

      // Confirmar transacción
      await connection.commit();

      res.status(201).json({
        jobId: trabajoId,
        message: "Oferta de trabajo creada exitosamente.",
      });
    } catch (error) {
      // Revertir la transacción en caso de error
      await connection.rollback();
      console.error("Error al crear la oferta de trabajo:", error);
      res.status(500).json({ error: "Error interno del servidor." });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
