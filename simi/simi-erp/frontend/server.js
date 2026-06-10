require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;

const APP_USER = process.env.APP_USER || "admin";
const APP_PASSWORD = process.env.APP_PASSWORD || "Simi2026";
const APP_TOKEN = process.env.APP_TOKEN || "123456";
const SESSION_SECRET = process.env.SESSION_SECRET || "cambiar_esta_clave_en_produccion";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
});

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 30
    }
  })
);

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: "Demasiados intentos de inicio de sesion. Intente nuevamente en unos minutos."
});

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }

  if (req.path.startsWith("/api/")) {
    return res.status(401).json({
      ok: false,
      mensaje: "No autorizado. Debe iniciar sesion."
    });
  }

  return res.redirect("/login.html");
}

async function ensureDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      descripcion TEXT,
      precio NUMERIC(10,2) NOT NULL,
      stock INT NOT NULL,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const insertDataQuery = `
    INSERT INTO productos (nombre, descripcion, precio, stock)
    SELECT 'Paracetamol 500mg', 'Analgesico y antipiretico utilizado para aliviar dolor y fiebre.', 1500, 100
    WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Paracetamol 500mg');

    INSERT INTO productos (nombre, descripcion, precio, stock)
    SELECT 'Ibuprofeno 400mg', 'Antiinflamatorio utilizado para dolor e inflamacion.', 2200, 80
    WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Ibuprofeno 400mg');

    INSERT INTO productos (nombre, descripcion, precio, stock)
    SELECT 'Alcohol Gel', 'Producto de higiene para limpieza de manos.', 1800, 60
    WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Alcohol Gel');
  `;

  await pool.query(createTableQuery);
  await pool.query(insertDataQuery);
}

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      ok: true,
      servicio: "SIMI ERP EVA3",
      base_datos: "Conexion correcta con AWS RDS PostgreSQL"
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error conectando con la base de datos",
      error: error.message
    });
  }
});

app.get("/", (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect("/index.html");
  }

  return res.redirect("/login.html");
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "style.css"));
});

app.get("/app.js", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "app.js"));
});

app.get("/index.html", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/login", loginLimiter, (req, res) => {
  const { usuario, password, token } = req.body;

  if (usuario === APP_USER && password === APP_PASSWORD && token === APP_TOKEN) {
    req.session.authenticated = true;
    req.session.usuario = usuario;
    req.session.loginDate = new Date().toISOString();

    return res.redirect("/index.html");
  }

  return res.redirect("/login.html?error=1");
});

app.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

app.get("/api/session", requireAuth, (req, res) => {
  res.json({
    ok: true,
    usuario: req.session.usuario,
    mensaje: "Sesion activa con acceso condicional validado"
  });
});

app.get("/api/productos", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre, descripcion, precio, stock, fecha_creacion FROM productos ORDER BY id ASC"
    );

    res.json({
      ok: true,
      total: result.rows.length,
      productos: result.rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al consultar productos",
      error: error.message
    });
  }
});

app.post("/api/productos", requireAuth, async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock } = req.body;

    if (!nombre || precio === undefined || stock === undefined) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debe ingresar nombre, precio y stock."
      });
    }

    const precioNumero = Number(precio);
    const stockNumero = Number(stock);

    if (Number.isNaN(precioNumero) || Number.isNaN(stockNumero)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Precio y stock deben ser valores numericos."
      });
    }

    if (precioNumero < 0 || stockNumero < 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "Precio y stock no pueden ser negativos."
      });
    }

    const result = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, descripcion, precio, stock, fecha_creacion`,
      [nombre, descripcion || "", precioNumero, stockNumero]
    );

    res.status(201).json({
      ok: true,
      mensaje: "Producto registrado correctamente.",
      producto: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al registrar producto",
      error: error.message
    });
  }
});

app.put("/api/productos/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock } = req.body;

    if (!nombre || precio === undefined || stock === undefined) {
      return res.status(400).json({
        ok: false,
        mensaje: "Debe ingresar nombre, precio y stock."
      });
    }

    const precioNumero = Number(precio);
    const stockNumero = Number(stock);

    if (Number.isNaN(precioNumero) || Number.isNaN(stockNumero)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Precio y stock deben ser valores numericos."
      });
    }

    const result = await pool.query(
      `UPDATE productos
       SET nombre = $1, descripcion = $2, precio = $3, stock = $4
       WHERE id = $5
       RETURNING id, nombre, descripcion, precio, stock, fecha_creacion`,
      [nombre, descripcion || "", precioNumero, stockNumero, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Producto no encontrado."
      });
    }

    res.json({
      ok: true,
      mensaje: "Producto actualizado correctamente.",
      producto: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar producto",
      error: error.message
    });
  }
});

app.delete("/api/productos/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM productos WHERE id = $1 RETURNING id, nombre",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Producto no encontrado."
      });
    }

    res.json({
      ok: true,
      mensaje: "Producto eliminado correctamente.",
      producto: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar producto",
      error: error.message
    });
  }
});

async function startServer() {
  try {
    await ensureDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log("===========================================");
      console.log("SIMI ERP EVA3 iniciado correctamente");
      console.log(`Servidor escuchando en puerto ${PORT}`);
      console.log("Conexion preparada hacia AWS RDS PostgreSQL");
      console.log("Portal de autenticacion con usuario, password y token activo");
      console.log("===========================================");
    });
  } catch (error) {
    console.error("Error iniciando la aplicacion:");
    console.error(error);
    process.exit(1);
  }
}

startServer();