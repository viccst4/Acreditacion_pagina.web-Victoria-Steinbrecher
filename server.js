const path = require("path");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const crypto = require("crypto");
const app = express();
const sesiones = new Set();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend", "public")));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "acreditacion"
});

db.connect((error) => {
  if (error) {
    console.error("No se pudo conectar con MySQL:", error.message);
    return;
  }

  console.log("Conectado a la base de datos");

 app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "public", "index.html"));
});
app.get("/api/servicios", (req, res) => {
  db.query("SELECT id_servicios, servicio FROM servicios", (error, resultados) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Error al consultar los servicios");
    }

    res.json(resultados);
  });
});
app.post("/api/consultas", (req, res) => {
  const { nombre, telefono, gmail, motivo_consulta } = req.body;

  const consulta = `
    INSERT INTO contacto (nombre, telefono, gmail, motivo_consulta)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    consulta,
    [nombre, telefono, gmail, motivo_consulta],
    (error, resultado) => {
      if (error) {
        console.error("Error al guardar la consulta:", error.message);
        return res.status(500).json({ mensaje: "No se pudo guardar la consulta" });
      }

      res.status(201).json({ mensaje: "Consulta guardada correctamente" });
    }
  );
});
app.get("/api/consultas", (req, res) => {
  const consulta = `
    SELECT id_contacto, nombre, gmail, telefono, motivo_consulta
    FROM contacto
    ORDER BY id_contacto DESC
  `;

  db.query(consulta, (error, resultados) => {
    if (error) {
      console.error("Error al obtener consultas:", error.message);
      return res.status(500).json({ mensaje: "No se pudieron cargar las consultas." });
    }

    res.json(resultados);
  });
});
app.post("/api/auth/login", (req, res) => {
  const { usuario, contrasena } = req.body;

  const consulta = `
    SELECT usuario
    FROM login
    WHERE usuario = ? AND \`contraseña\` = ?
    LIMIT 1
  `;

  db.query(consulta, [usuario, contrasena], (error, resultados) => {
    if (error) {
      console.error("Error al validar el usuario:", error.message);
      return res.status(500).json({ mensaje: "Error al validar el ingreso." });
    }

    if (resultados.length === 0) {
      return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos." });
    }

    const token = crypto.randomUUID();
    sesiones.add(token);

    res.json({
      mensaje: "Ingreso correcto.",
      token,
      administrador: { usuario: resultados[0].usuario }
    });
  });
});
  app.listen(3000, () => {
    console.log("Servidor disponible en http://localhost:3000");
  });
});
app.get("/api/consultas", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token || !sesiones.has(token)) {
    return res.status(401).json({ mensaje: "Iniciá sesión para ver las consultas." });
  }
app.get("/api/consultas/:id", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token || !sesiones.has(token)) {
    return res.status(401).json({ mensaje: "Iniciá sesión para ver las consultas." });
  }

  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: "El número de consulta no es válido." });
  }

  const consulta = `
    SELECT id_contacto, nombre, gmail, telefono, motivo_consulta
    FROM contacto
    WHERE id_contacto = ?
    LIMIT 1
  `;

  db.query(consulta, [id], (error, resultados) => {
    if (error) {
      console.error("Error al obtener la consulta:", error.message);
      return res.status(500).json({ mensaje: "No se pudo cargar la consulta." });
    }

    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: "No se encontró esa consulta." });
    }

    res.json(resultados[0]);
  });
});
  const consulta = `
    SELECT id_contacto, nombre, gmail, telefono, motivo_consulta
    FROM contacto
    ORDER BY id_contacto DESC
  `;

  db.query(consulta, (error, resultados) => {
    if (error) {
      console.error("Error al obtener consultas:", error.message);
      return res.status(500).json({ mensaje: "No se pudieron cargar las consultas." });
    }

    res.json(resultados);
  });
});
app.patch("/api/consultas/:id/leida", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token || !sesiones.has(token)) {
    return res.status(401).json({ mensaje: "Iniciá sesión." });
  }

  const id = Number(req.params.id);

  db.query(
    "UPDATE contacto SET leida = 1 WHERE id_contacto = ?",
    [id],
    (error, resultado) => {
      if (error) {
        console.error("Error al marcar como leída:", error.message);
        return res.status(500).json({ mensaje: "No se pudo marcar como leída." });
      }

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ mensaje: "No se encontró esa consulta." });
      }

      res.json({ mensaje: "Consulta marcada como leída." });
    }
  );
});
app.post("/api/auth/logout", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    sesiones.delete(token);
  }

  res.json({ mensaje: "Sesión cerrada." });
});