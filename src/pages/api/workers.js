const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const connection = await req.pool.getConnection();
    try {
      const [workers] = await connection.query(
        "SELECT usuario_id AS id, usuario_nombre AS name, usuario_email AS email FROM usuarios"
      );
      res.json(workers);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching workers:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
