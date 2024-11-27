const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost", // Cambia esto por tu host de base de datos
  user: "root", // Cambia esto por tu usuario de base de datos
  password: "1117489351", // Cambia esto por tu contraseña de base de datos
  database: "expresswork", // Cambia esto por tu nombre de base de datos
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
