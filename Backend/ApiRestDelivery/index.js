// Importar dependencias necesarias
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const config = require("./bd/sql");
const sql = require("mssql");

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Conexión a la base de datos y arranque del servidor solo tras conexión exitosa
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

// Middleware para verificar disponibilidad de la BD antes de manejar rutas
app.use((req, res, next) => {
  if (!pool) {
    return res.status(503).json({ message: "Base de datos no disponible" });
  }
  next();
});
// Endpoint para obtener productos con paginación y filtros (solo nombre y categoría)
app.get("/products", async (req, res) => {
  try {
    const pageNum  = parseInt(req.query.page?.toString()) || 1;
    const limitNum = parseInt(req.query.limit?.toString()) || 10;
    const name     = req.query.name?.toString() || "";
    const category = req.query.category?.toString() || "";

    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT *
      FROM ProductWithCategory
      WHERE 1=1
    `;

    if (name)     query += ` AND ProductName   LIKE @Name`;
    if (category) query += ` AND CategoryName  LIKE @Category`;

    query += ` ORDER BY ProductId
               OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY`;

    const request = pool.request()
      .input("Name",     sql.VarChar, `%${name}%`)
      .input("Category", sql.VarChar, `%${category}%`)
      .input("Offset",   sql.Int,     offset)
      .input("Limit",    sql.Int,     limitNum);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener productos:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});
app.post("/create-products", async (req, res) => {
  try {
    const { Name, Description, Price, Stock, ImageURL, CategoryId } = req.body;
    const request = pool.request()
      .input("Name", sql.VarChar(100), Name)
      .input("Description", sql.VarChar(200), Description)
      .input("Price", sql.Decimal(10, 2), Price)
      .input("Stock", sql.Int, Stock)
      .input("ImageURL", sql.VarChar(255), ImageURL)
      .input("CategoryId", sql.Int, CategoryId);

    await request.execute("CreateProduct");
    res.status(201).json({ message: "Producto creado exitosamente" });
  } catch (err) {
    console.error("Error al crear producto:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Endpoint para crear una nueva categoría
app.post("/categories", async (req, res) => {
  try {
    const { CategoryName } = req.body;
    const request = pool.request()
      .input("CategoryName", sql.VarChar(100), CategoryName);

    await request.execute("CreateCategory");
    res.status(201).json({ message: "Categoría creada exitosamente" });
  } catch (err) {
    console.error("Error al crear categoría:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Endpoint para obtener todos los repartidores
app.get("/delivery-persons", async (req, res) => {
  try {
    const request = pool.request();
    const result = await request.execute("GetAllDeliveryPersons");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener repartidores:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Endpoint para obtener todos los clientes
app.get("/clients", async (req, res) => {
  try {
    const request = pool.request();
    const result = await request.execute("GetAllClients");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener clientes:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});
// Cerrar conexiones cuando el proceso termine
process.on("SIGINT", async () => {
  try {
    await sql.close();  // Cerrar todas las conexiones abiertas por sql
    console.log("Conexiones cerradas");
  } catch (err) {
    console.error("Error al cerrar las conexiones:", err);
  }
  process.exit();
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
