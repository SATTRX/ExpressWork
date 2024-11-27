const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.post("/api/register", async (req, res) => {
  const {
    usuario_nombre,
    usuario_email,
    usuario_password,
    usuario_fecha_nacimiento,
  } = req.body;

  try {
    const [result] = await pool.execute(
      "INSERT INTO usuarios (usuario_nombre, usuario_email, usuario_password, usuario_fecha_nacimiento) VALUES (?, ?, ?, ?)",
      [
        usuario_nombre,
        usuario_email,
        usuario_password,
        usuario_fecha_nacimiento,
      ]
    );
    res.json({ userId: result.insertId });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Error registering user: " + error.message });
  }
});

// New routes for workers, notifications, and workdays
app.get("/api/workers", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM trabajadores");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching workers:", error);
    res.status(500).json({ error: "Error fetching workers: " + error.message });
  }
});

app.get("/api/notifications", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notificaciones ORDER BY fecha DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res
      .status(500)
      .json({ error: "Error fetching notifications: " + error.message });
  }
});

app.get("/api/workdays", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM dias_trabajados ORDER BY fecha DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching work days:", error);
    res
      .status(500)
      .json({ error: "Error fetching work days: " + error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
