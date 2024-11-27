const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const workdays = [
      { id: 1, date: "2024-11-24", hours: 8 },
      { id: 2, date: "2024-11-23", hours: 7 },
    ];
    res.json(workdays);
  } catch (error) {
    console.error("Error fetching work days:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
