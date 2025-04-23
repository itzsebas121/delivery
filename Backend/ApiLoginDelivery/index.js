// Importar dependencias necesarias
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const config = require("./BD/sql");
const sql = require("mssql");
const jwt = require("jsonwebtoken");

app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';  // Asegúrate de que esté correctamente configurado

// Configurar CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Conexión a la base de datos
let pool;
sql
  .connect(config)
  .then((p) => {
    pool = p;
    console.log("Conexión a la base de datos establecida");
  })
  .catch((err) => console.error("Error al conectar con la base de datos", err));

// Endpoint de login
app.post("/login", async (req, res) => {
  try {
    // Verificar si el cuerpo de la solicitud tiene email y password
    const { email, password } = req.body;

    console.log("Email y password recibidos:", email, password); // Verifica si los datos son recibidos correctamente

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email y password son requeridos" });
    }

    // Realizar la consulta a la base de datos
    const request = pool.request();
    request.input("Email", sql.VarChar, email);
    request.input("Password", sql.VarChar, password);

    const result = await request.execute("GetUserInfo");
    
    // Verificar si se obtuvo el usuario
    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Verificar si la consulta retornó un error
    if (user.ErrorMessage) {
      return res.status(401).json({ message: user.ErrorMessage });
    }

    // Generar el token JWT con los datos básicos del usuario
    const token = jwt.sign(
      {
        id: user.UserId,
        name: user.Name,
        email: user.Email,
        role: user.RoleName,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Responder con el token generado
    res.json({ token });
  } catch (err) {
    // Manejo de errores
    console.error("Error en login:", err);
    res.status(500).json({ message: "Error interno en el servidor" });
  }
});

// Endpoint protegido (solo accesible con JWT válido)
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
  if (pool) {
    await pool.close();
    console.log("Conexiones cerradas");
  }
  process.exit();
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Server ready on http://localhost:${port}`);
});
