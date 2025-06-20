// Importar dependencias necesarias
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const config = require("./BD/sql");
const sql = require("mssql");
const jwt = require("jsonwebtoken");

app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

// Configurar CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

let pool;
sql.connect(config)
  .then((p) => {
    pool = p;
    console.log("Conexión a la base de datos establecida");

    app.listen(port, () => {
      console.log(`Server ready on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Error al conectar con la base de datos", err);
    process.exit(1);
  });

app.use((req, res, next) => {
  if (!pool) {
    return res.status(503).json({ message: "Base de datos no disponible" });
  }
  next();
});

// Endpoint de login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Email y password recibidos:", email, password);

    if (!email || !password) {
      return res.status(400).send("Email y password son requeridos");
    }

    const request = pool.request();
    request.input("Email", sql.VarChar(255), email);
    request.input("Password", sql.VarChar(255), password);

    const result = await request.execute("GetUserInfo");
    const user = result.recordset[0];

    if (!user || user.Message) {
      return res.status(401).json({Message:user?.Message} || {Message: "Credenciales inválidas"});
    }

    const token = jwt.sign(
      { id: user.UserId, name: user.Name, email: user.Email, role: user.RoleName , clientID: user.ClientID, deliveryID: user.DeliveryID},
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token:token });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).send("Error interno en el servidor");
  }
});

app.get("/protected", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Token no proporcionado");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send("Token inválido");
    }
    res.json({ message: "Acceso permitido", user: decoded });
  });
});

// Cerrar conexiones cuando el proceso termine
process.on("SIGINT", async () => {
  if (pool) await pool.close();
  console.log("Conexiones cerradas");
  process.exit();
});
