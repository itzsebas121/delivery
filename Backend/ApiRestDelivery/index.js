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
    methods: ["GET", "POST", "PUT", "DELETE",  'PATCH',],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Función para conectar a la base de datos
const connectToDatabase = async () => {
  try {
    const pool = await sql.connect(config);
    console.log("Conexión a la base de datos establecida");
    return pool;
  } catch (err) {
    console.error("Error al conectar con la base de datos", err);
    // Intentar reconectar cada 5 segundos si la conexión falla
    setTimeout(() => connectToDatabase(), 5000);
    return null;
  }
};
// Conexión a la base de datos y arranque del servidor solo tras conexión exitosa
let pool;
connectToDatabase().then((p) => {
  pool = p;
  if (pool) {
    // Arrancar el servidor solo cuando la conexión sea exitosa
    app.listen(port, () => {
      console.log(`Servidor escuchando en http://localhost:${port}`);
    });
  } else {
    console.log("No se pudo conectar a la base de datos. El servidor no se iniciará.");
  }
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
    const pageNum = parseInt(req.query.page?.toString()) || 1;
    const limitNum = parseInt(req.query.limit?.toString()) || 10;
    const name = req.query.name?.toString() || "";
    const category = req.query.category?.toString() || "";

    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT *
      FROM ProductWithCategory
      WHERE 1=1
    `;

    if (name) query += ` AND ProductName LIKE @Name`;
    if (category) query += ` AND CategoryName LIKE @Category`;

    query += ` ORDER BY ProductId
               OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY`;

    const request = pool.request()
      .input("Name", sql.VarChar, `%${name}%`)
      .input("Category", sql.VarChar, `%${category}%`)
      .input("Offset", sql.Int, offset)
      .input("Limit", sql.Int, limitNum);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener productos:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Endpoint para crear un nuevo producto
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

// Endpoint para crear una orden a partir de un carrito
app.post("/create-order-from-cart", async (req, res) => {
  try {
    const { cartId, deliveryAddress } = req.body;

    if (!cartId || !deliveryAddress) {
      return res.status(400).json({ message: "Faltan datos obligatorios: cartId y deliveryAddress" });
    }

    const request = pool.request()
      .input("CartId", sql.Int, cartId)
      .input("DeliveryAddress", sql.VarChar(255), deliveryAddress);

    const result = await request.execute("CreateOrderFromCart");

    // El procedimiento devuelve el OrderId en un SELECT
    const orderId = result.recordset[0]?.OrderId;

    if (!orderId) {
      return res.status(500).json({ message: "No se pudo crear la orden" });
    }

    res.status(201).json({ message: "Orden creada exitosamente", orderId });
  } catch (err) {
    console.error("Error al crear orden desde carrito:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.post("/cart-add", async (req, res) => {
  try {
    const { ClientId, ProductId, Quantity } = req.body;

    const request = pool.request()
      .input("ClientId", sql.Int, ClientId)
      .input("ProductId", sql.Int, ProductId)
      .input("Quantity", sql.Int, Quantity);

    await request.execute("AddProductToCart");

    res.status(200).json({ message: "Producto agregado al carrito" });
  } catch (err) {
    console.error("Error al agregar al carrito:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});
app.get("/get-cart/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;

    const request = pool.request()
      .input("ClientId", sql.Int, clientId);

    const result = await request.execute("GetCartByClient");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener el carrito:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});
// Endpoint para obtener todas las categorías
app.get("/categories", async (req, res) => {
  try {
    const poolConnection = await pool.connect();
    const result = await poolConnection.request().execute("GetAllCategories");
    
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener categorías:", err);
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
// Endpoint para actualizar una categoría existente
app.put("/categories/:id", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { CategoryName } = req.body;

    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "ID de categoría inválido" });
    }

    const request = pool.request()
      .input("CategoryId", sql.Int, categoryId)
      .input("CategoryName", sql.VarChar(100), CategoryName);

    await request.execute("UpdateCategory");

    res.status(200).json({ message: "Categoría actualizada exitosamente" });
  } catch (err) {
    console.error("Error al actualizar categoría:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});
// Endpoint para eliminar una categoría
app.delete("/categories/:id", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);

    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "ID de categoría inválido" });
    }

    const request = pool.request()
      .input("CategoryId", sql.Int, categoryId);

    await request.execute("DeleteCategory");

    res.status(200).json({ message: "Categoría eliminada exitosamente" });
  } catch (err) {
    console.error("Error al eliminar categoría:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Endpoint para eliminar un item del carrito
app.delete("/cart-item/:cartId/:productId", async (req, res) => {
  try {
    const { cartId, productId } = req.params;

    if (!cartId || !productId) {
      return res.status(400).json({ message: "Faltan parámetros requeridos" });
    }

    const request = pool.request()
      .input("CartId", sql.Int, parseInt(cartId))
      .input("ProductId", sql.Int, parseInt(productId));

    await request.execute("DeleteCartItem");

    res.status(200).json({ message: "Item eliminado del carrito correctamente" });
  } catch (err) {
    console.error("Error al eliminar item del carrito:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});
// Endpoint para actualizar la cantidad de un item en el carrito
app.put("/cart-item", async (req, res) => {
  try {
    const { CartId, ProductId, Quantity } = req.body;

    if (!CartId || !ProductId || Quantity == null || Quantity < 0) {
      return res.status(400).json({ message: "Datos inválidos o incompletos" });
    }

    const request = pool.request()
      .input("CartId", sql.Int, CartId)
      .input("ProductId", sql.Int, ProductId)
      .input("NewQuantity", sql.Int, Quantity);

    await request.execute("UpdateCartItemQuantity");

    res.status(200).json({ message: "Cantidad actualizada exitosamente" });
  } catch (err) {
    console.error("Error al actualizar item del carrito:", err);
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
app.post("/register-delivery", async (req, res) => {
  try {
    const { Name, Email, Password, Region } = req.body;

    if (!Name || !Email || !Password || !Region) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const result = await pool.request()
      .input("Name", sql.VarChar, Name)
      .input("Email", sql.VarChar, Email)
      .input("Password", sql.VarChar, Password)
      .input("Region", sql.VarChar, Region)
      .execute("RegisterDeliveryPerson");

    const deliveryId = result.recordset[0]?.DeliveryId;
    res.status(201).json({ message: "Repartidor registrado", deliveryId });
  } catch (err) {
    console.error(err);
    if (err.message.includes("ya está registrado")) {
      return res.status(409).json({ message: "Correo ya en uso" });
    }
    res.status(500).json({ message: "Error al registrar repartidor" });
  }
});
app.put("/update-delivery/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { Name, Email, Region } = req.body;

    if (!Name || !Email || !Region) {
      return res.status(400).json({ message: "Faltan datos para actualizar" });
    }

    await pool.request()
      .input("UserId", sql.Int, userId)
      .input("Name", sql.VarChar, Name)
      .input("Email", sql.VarChar, Email)
      .input("Region", sql.VarChar, Region)
      .execute("UpdateDeliveryPerson");

    res.json({ message: "Repartidor actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al actualizar repartidor" });
  }
});
app.patch("/disable-delivery/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    await pool.request()
      .input("UserId", sql.Int, userId)
      .execute("DisableDeliveryPerson");

    res.json({ message: "Repartidor inhabilitado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al inhabilitar repartidor" });
  }
});
app.post("/assign-delivery", async (req, res) => {
  try {
    const { OrderId, DeliveryId } = req.body;

    if (!OrderId || !DeliveryId) {
      return res.status(400).json({ message: "Faltan OrderId o DeliveryId" });
    }

    await pool.request()
      .input("OrderId", sql.Int, OrderId)
      .input("DeliveryId", sql.Int, DeliveryId)
      .execute("AssignDelivery");

    res.status(200).json({ message: "Repartidor asignado correctamente" });
  } catch (err) {
    console.error("Error al asignar repartidor:", err);

    // Validación específica de errores
    if (err.message.includes("Orden no encontrada")) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    if (err.message.includes("Repartidor no disponible")) {
      return res.status(409).json({ message: "Repartidor no disponible o inexistente" });
    }

    res.status(500).json({ message: "Error al asignar repartidor" });
  }
});
app.patch("/cancel-order/:orderId", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      return res.status(400).json({ message: "OrderId inválido" });
    }

    await pool.request()
      .input("OrderId", sql.Int, orderId)
      .execute("CancelOrder");

    res.status(200).json({ message: "Orden cancelada exitosamente" });
  } catch (err) {
    console.error("Error al cancelar orden:", err);

    if (err.message.includes("Orden no encontrada")) {
      return res.status(404).json({ message: "La orden no existe" });
    }
    if (err.message.includes("No se puede cancelar")) {
      return res.status(409).json({ message: "No se puede cancelar una orden completada o ya cancelada" });
    }

    res.status(500).json({ message: "Error al cancelar la orden" });
  }
});



app.get("/delivery/:deliveryId/pending-orders", async (req, res) => {
  try {
    const deliveryId = parseInt(req.params.deliveryId);

    const result = await pool
      .request()
      .input("DeliveryId", sql.Int, deliveryId)
      .execute("GetPendingOrdersForDelivery");

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener órdenes pendientes:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.get("/delivery/:deliveryId/completed-cancelled-orders", async (req, res) => {
  try {
    const deliveryId = parseInt(req.params.deliveryId);

    const result = await pool
      .request()
      .input("DeliveryId", sql.Int, deliveryId)
      .execute("GetCompletedAndCancelledOrdersForDelivery");

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener órdenes completadas/canceladas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.post("/delivery/:deliveryId/start-route/:orderId", async (req, res) => {
  try {
    const deliveryId = parseInt(req.params.deliveryId);
    const orderId = parseInt(req.params.orderId);
    const { startLatitude, startLongitude } = req.body;

    if (
      typeof startLatitude !== "number" ||
      typeof startLongitude !== "number"
    ) {
      return res.status(400).json({ message: "Coordenadas inválidas." });
    }

    const result = await pool
      .request()
      .input("OrderId", sql.Int, orderId)
      .input("DeliveryId", sql.Int, deliveryId)
      .input("StartLatitude", sql.Decimal(9, 6), startLatitude)
      .input("StartLongitude", sql.Decimal(9, 6), startLongitude)
      .execute("StartDeliveryRoute");

    res.json({ message: "Ruta iniciada correctamente." });
  } catch (error) {
    console.error("Error al iniciar la ruta:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});
app.patch('/complete-order/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({ message: "ID de orden inválido." });
    }

    const result = await pool
      .request()
      .input('OrderId', sql.Int, orderId)
      .execute('MarkOrderAsCompleted');

    res.status(200).json({ message: 'Orden marcada como completada.' });
  } catch (err) {
    console.error('Error al completar orden:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
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
// Endpoint para obtener todas las ventas
app.get("/sales", async (req, res) => {
  try {
    const request = pool.request();
    const result = await request.execute("GetAllSales");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener ventas:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});
// Endpoint para obtener detalles de la orden por ID
app.get("/orders-details/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const request = pool.request();
    request.input("OrderId", sql.Int, id);
    const result = await request.execute("GetFullOrderById");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener la orden:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});
app.get("/product-history/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;

    const request = pool.request()
      .input("ClientId", sql.Int, clientId);

    const result = await request.execute("GetProductHistoryByClient");

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error al obtener historial de productos:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});
app.get("/order-detail/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const request = pool.request()
      .input("OrderId", sql.Int, orderId);

    const result = await request.execute("GetOrderDetail");

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error al obtener detalle del pedido:", err);
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
