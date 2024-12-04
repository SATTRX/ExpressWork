const express = require("express");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const session = require("express-session");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configurar WebSocket
const wss = new WebSocket.Server({ server, path: "/ws/notifications" });

// Manejar conexiones WebSocket
wss.on("connection", (ws) => {
  console.log("Nueva conexión WebSocket establecida");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Mensaje recibido:", data);
    } catch (error) {
      console.error("Error al procesar mensaje:", error);
    }
  });

  ws.on("close", () => {
    console.log("Cliente WebSocket desconectado");
  });

  // Enviar mensaje de confirmación
  ws.send(
    JSON.stringify({
      type: "connection_established",
      message: "Conectado al servidor de notificaciones",
    })
  );
});

// Configuración de la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1117489351",
  database: process.env.DB_NAME || "expresswork",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Función para broadcast de notificaciones
const broadcastNotification = (notification) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification));
    }
  });
};

// Verificar conexión a la base de datos
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Conexión a la base de datos establecida correctamente");
    connection.release();
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error);
    process.exit(1);
  }
};

// Middleware para la pool de conexiones
app.use((req, res, next) => {
  req.pool = pool;
  req.broadcastNotification = broadcastNotification;
  next();
});

// Configuración de CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// Configuración de la sesión
app.use(
  session({
    name: "sessionId",
    secret: "tu-secreto-seguro",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

// Importar rutas
const workRouter = require("./pages/api/trabajos");
const userRouter = require("./pages/api/users");
const jobsRouter = require("./pages/api/jobs");
const passwordRecoveryRoutes = require("./pages/api/passwordRecovery");
const resetPasswordRoutes = require("./pages/api/resetPassword");
const regionesYComunasRoutes = require("./pages/api/regionesYComunas");
const notificationsRouter = require("./pages/api/notifications");

// Ruta de búsqueda
app.get("/api/trabajos/buscar", async (req, res) => {
  const searchQuery = req.query.q?.toLowerCase() || "";
  try {
    const [trabajos] = await pool.execute(
      `
      SELECT t.*, u.usuario_nombre as publicador_nombre
  FROM trabajos t
  LEFT JOIN usuarios u ON t.usuario_id = u.usuario_id
  WHERE 
    LOWER(t.trabajo_titulo) LIKE ? OR
    LOWER(t.trabajo_descripcion) LIKE ? OR
    LOWER(t.requisitos) LIKE ?
  ORDER BY t.trabajo_fecha_publicacion DESC
    `,
      [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]
    );

    res.json(trabajos);
  } catch (error) {
    console.error("Error en búsqueda:", error);
    res.status(500).json({ error: "Error al buscar trabajos" });
  }
});

// Usar las rutas
app.use("/api/trabajos", workRouter);
app.use("/api/user", userRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/forgot-password", passwordRecoveryRoutes);
app.use("/api/reset-password", resetPasswordRoutes);
app.use("/api/register", require("./pages/api/register"));
app.use("/api/login", require("./pages/api/login"));
app.use("/api/workers", require("./pages/api/workers"));
app.use("/api/notifications", notificationsRouter);
app.use("/api/workdays", require("./pages/api/workdays"));
app.use("/api/regionesYComunas", regionesYComunasRoutes);
app.use("/api/categorias", require("./pages/api/categorias"));

// Manejadores de errores
app.use((req, res, next) => {
  console.log(`404 - Ruta no encontrada: ${req.method} ${req.url}`);
  res
    .status(404)
    .json({ message: `Ruta ${req.method} ${req.url} no encontrada` });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    message: err.message,
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;

testConnection()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Servidor HTTP corriendo en http://localhost:${PORT}`);
      console.log(
        `Servidor WebSocket corriendo en ws://localhost:${PORT}/ws/notifications`
      );
      console.log(`CORS habilitado para: http://localhost:5173`);
    });
  })
  .catch((err) => {
    console.error("Error al iniciar el servidor:", err);
  });

module.exports = { app, server, wss };
