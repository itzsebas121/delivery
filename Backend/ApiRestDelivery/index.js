// Importar dependencias necesarias
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const config = require("./bd/sql");
const sql = require("mssql");

app.use(express.json());

// Configurar CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET"],
    allowedHeaders: ["Content-Type"],
  })
);

// Endpoint para obtener productos con paginación y filtros (solo nombre y categoría)
app.get("/products", async (req, res) => {
  try {
    // convertir page y limit a números
    const pageNum  = parseInt(req.query.page.toString()) || 1;
    const limitNum = parseInt(req.query.limit.toString()) || 10;
    const name     = (req.query.name.toString()) || "";
    const category = (req.query.category.toString()) || "";

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

    // Conectamos por cada request (serverless-friendly)
    const pool = await sql.connect(config);
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
