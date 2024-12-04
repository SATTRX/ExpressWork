const express = require("express");
const router = express.Router();

const categorias = [
  { id: 1, nombre: "Arte" },
  { id: 2, nombre: "Cocina" },
  { id: 3, nombre: "Análisis" },
  { id: 4, nombre: "Reponedor" },
  { id: 5, nombre: "Marketing Digital" },
  { id: 6, nombre: "Programación" },
  { id: 7, nombre: "Diseño" },
  { id: 8, nombre: "Ventas" },
  { id: 9, nombre: "Atención al Cliente" },
  { id: 10, nombre: "Administración" },
];

// GET todas las categorías
router.get("/", (req, res) => {
  try {
    res.json(categorias);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error al obtener las categorías" });
  }
});

// GET categoría por ID
router.get("/:id", (req, res) => {
  try {
    const categoria = categorias.find((c) => c.id === parseInt(req.params.id));
    if (categoria) {
      res.json(categoria);
    } else {
      res.status(404).json({ error: "Categoría no encontrada" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error al obtener la categoría" });
  }
});

module.exports = router;
