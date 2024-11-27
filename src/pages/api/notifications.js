const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const notifications = [
      { id: 1, message: "Notificación 1" },
      { id: 2, message: "Notificación 2" },
    ];
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
