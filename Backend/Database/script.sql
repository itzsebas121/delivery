

-- Usuarios
CREATE TABLE USERS (
    UserId INT PRIMARY KEY IDENTITY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARBINARY(64) NOT NULL,
    RoleName VARCHAR(50) NOT NULL,
    RegistrationDate DATETIME DEFAULT GETDATE()
);

-- Categorías
CREATE TABLE CATEGORIES (
    CategoryId INT PRIMARY KEY IDENTITY,
    CategoryName VARCHAR(100) NOT NULL
);

-- Productos
CREATE TABLE PRODUCT (
    ProductId INT PRIMARY KEY IDENTITY,
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(200),
    Price DECIMAL(10,2) NOT NULL,
    Stock INT NOT NULL,
    ImageURL VARCHAR(255),
    CategoryId INT,
    FOREIGN KEY (CategoryId) REFERENCES CATEGORIES(CategoryId)
);
ALTER TABLE PRODUCTS
ADD isAvailable BIT NOT NULL DEFAULT 1;

-- Descuentos
CREATE TABLE DISCOUNTS (
    DiscountId INT PRIMARY KEY IDENTITY,
    Code VARCHAR(50) UNIQUE,
    Description VARCHAR(255),
    Percentage DECIMAL(5,2) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    MaxUsage INT,
    UsagePerUser INT,
    IsActive BIT DEFAULT 1
);

-- Pedidos

CREATE TABLE CLIENTS (
  ClientId INT PRIMARY KEY IDENTITY,
  UserId INT NOT NULL UNIQUE,           -- FK a USERS
  DefaultAddress VARCHAR(255) NOT NULL,
  Phone VARCHAR(20),
  FOREIGN KEY (UserId) REFERENCES USERS(UserId)
);
CREATE TABLE DELIVERY_PERSONS (
  DeliveryId INT PRIMARY KEY IDENTITY,
  UserId INT NOT NULL UNIQUE,           -- FK a USERS
  IsAvailable BIT DEFAULT 1,
  Region VARCHAR(100),
  FOREIGN KEY (UserId) REFERENCES USERS(UserId)
);


CREATE TYPE OrderProductType AS TABLE (
  ProductId INT,
  Quantity INT
);
CREATE TABLE ORDERS (
  OrderId INT PRIMARY KEY IDENTITY,
  ClientId INT NOT NULL,                -- FK a CLIENTS
  DeliveryId INT NULL,                  -- FK a DELIVERY_PERSONS
  OrderDate DATETIME DEFAULT GETDATE(),
  Status VARCHAR(50) DEFAULT 'Pending',
  DeliveryAddress VARCHAR(255) NOT NULL,
  DiscountId INT NULL,
  Total DECIMAL(10,2) NOT NULL,
  DiscountedTotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (ClientId)   REFERENCES CLIENTS(ClientId),
  FOREIGN KEY (DeliveryId) REFERENCES DELIVERY_PERSONS(DeliveryId),
  FOREIGN KEY (DiscountId) REFERENCES DISCOUNTS(DiscountId)
);
CREATE TABLE Carts (
    CartId INT PRIMARY KEY IDENTITY, -- ID único del carrito
    ClientId INT NOT NULL,            -- ID del cliente (FK a CLIENTS)
    IsActive BIT DEFAULT 1,           -- Si el carrito está activo (por ejemplo, si no ha sido completado)
    CreatedAt DATETIME DEFAULT GETDATE(), -- Fecha de creación
    UpdatedAt DATETIME DEFAULT GETDATE(), -- Fecha de última actualización
    FOREIGN KEY (ClientId) REFERENCES CLIENTS(ClientId) -- Relación con CLIENTS
);
CREATE TABLE CartItems (
    CartItemId INT PRIMARY KEY IDENTITY,  -- ID único del producto en el carrito
    CartId INT NOT NULL,                  -- ID del carrito (FK a Carts)
    ProductId INT NOT NULL,               -- ID del producto (FK a PRODUCTS)
    Quantity INT NOT NULL,                -- Cantidad del producto
    Price DECIMAL(10,2) NOT NULL,         -- Precio unitario del producto en ese momento
    CreatedAt DATETIME DEFAULT GETDATE(), -- Fecha de creación del item en el carrito
    UpdatedAt DATETIME DEFAULT GETDATE(), -- Fecha de última actualización del item
    FOREIGN KEY (CartId) REFERENCES Carts(CartId),   -- Relación con Carts
    FOREIGN KEY (ProductId) REFERENCES PRODUCTS(ProductId)  -- Relación con PRODUCTS
);


ALTER TABLE ORDERS ADD IsRouteStarted BIT DEFAULT 0;
ALTER TABLE ORDERS
ADD 
  DeliveryAddressName VARCHAR(100) NULL,
  StartRouteLatitude DECIMAL(9,6) NULL,
  StartRouteLongitude DECIMAL(9,6) NULL,
  DeliveryLatitude DECIMAL(9,6) NULL,
  DeliveryLongitude DECIMAL(9,6) NULL;


CREATE or alter PROCEDURE UpdateProduct
    @ProductId INT,
    @Name VARCHAR(100),
    @Description VARCHAR(200),
    @Price DECIMAL(10,2),
    @Stock INT,
    @ImageURL VARCHAR(255),
    @CategoryId INT
AS
BEGIN
    UPDATE PRODUCTS
    SET
        Name = @Name,
        Description = @Description,
        Price = @Price,
        Stock = @Stock,
        ImageURL = @ImageURL,
        CategoryId = @CategoryId
    WHERE ProductId = @ProductId;
END;


CREATE or alter PROCEDURE DeleteProduct
    @ProductId INT
AS
BEGIN
    BEGIN TRY
        DELETE FROM PRODUCTS
        WHERE ProductId = @ProductId;

        PRINT 'Producto eliminado correctamente.';
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000);
        SET @ErrorMessage = ERROR_MESSAGE();

        IF ERROR_NUMBER() = 547 -- Violación de FK
        BEGIN
            PRINT 'No se puede eliminar el producto porque está relacionado con otras tablas.';
        END
        ELSE
        BEGIN
            PRINT 'Error al intentar eliminar el producto: ' + @ErrorMessage;
        END
    END CATCH;
END;
CREATE PROCEDURE EnableProduct
  @ProductId INT
AS
BEGIN
  UPDATE PRODUCTS
  SET isAvailable = 1
  WHERE ProductId = @ProductId;

  IF @@ROWCOUNT = 0
    THROW 50001, 'Producto no encontrado.', 1;
END;
GO

CREATE PROCEDURE DisableProduct
  @ProductId INT
AS
BEGIN
  UPDATE PRODUCTS
  SET isAvailable = 0
  WHERE ProductId = @ProductId;

  IF @@ROWCOUNT = 0
    THROW 50001, 'Producto no encontrado.', 1;
END;
GO





CREATE OR ALTER PROCEDURE GetTotalVentasConCrecimiento
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL,
    @ClientId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @FechaInicio IS NULL OR @FechaFin IS NULL
    BEGIN
        DECLARE @Hoy DATETIME = DATEADD(DAY, 1,CAST(GETDATE() AS DATE ));
        SET @FechaFin = @Hoy;
        SET @FechaInicio = DATEADD(DAY, 1 - DAY(@Hoy), @Hoy);
    END

    DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicio, @FechaFin) + 1;

    -- Calcular rango anterior basado en la duración
    DECLARE @PeriodoAnteriorInicio DATETIME = DATEADD(DAY, -@Dias, @FechaInicio);
    DECLARE @PeriodoAnteriorFin DATETIME = DATEADD(DAY, -1, @FechaInicio);

    DECLARE @VentasActual FLOAT;
    DECLARE @VentasAnterior FLOAT;

    -- Ventas en rango actual (solo completadas)
    SELECT @VentasActual = SUM(Total)
    FROM ORDERS
    WHERE (@ClientId IS NULL OR ClientId = @ClientId)
        AND OrderDate BETWEEN @FechaInicio AND @FechaFin
        AND Status = 'Completada';

    -- Ventas en rango anterior (solo completadas)
    SELECT @VentasAnterior = SUM(Total)
    FROM ORDERS
    WHERE (@ClientId IS NULL OR ClientId = @ClientId)
        AND OrderDate BETWEEN @PeriodoAnteriorInicio AND @PeriodoAnteriorFin
        AND Status = 'Completada';

    -- Resultado con porcentaje de crecimiento
    SELECT
        @FechaInicio AS FechaInicioActual,
        @FechaFin AS FechaFinActual,
        @PeriodoAnteriorInicio AS FechaInicioAnterior,
        @PeriodoAnteriorFin AS FechaFinAnterior,
        ISNULL(@VentasActual, 0) AS VentasActual,
        ISNULL(@VentasAnterior, 0) AS VentasPeriodoAnterior,
        CASE 
            WHEN @VentasAnterior IS NULL OR @VentasAnterior = 0 THEN 0
            ELSE ROUND((@VentasActual - @VentasAnterior) * 100.0 / @VentasAnterior, 2)
        END AS PorcentajeCrecimiento;
END
GO
CREATE OR ALTER PROCEDURE GetClientesFrecuentes
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL,
    @ClientId INT = NULL
AS
BEGIN
    SELECT TOP 5
        c.ClientId,
        u.Name,
        COUNT(o.OrderId) AS NumeroCompras,
        SUM(o.Total) AS MontoTotal,
        AVG(o.Total) AS PromedioCompra
    FROM ORDERS o
    INNER JOIN CLIENTS c ON o.ClientId = c.ClientId
    INNER JOIN USERS u ON c.UserId = u.UserId
    WHERE
        (@ClientId IS NULL OR c.ClientId = @ClientId)
        AND (@FechaInicio IS NULL OR o.OrderDate >= @FechaInicio)
        AND (@FechaFin IS NULL OR o.OrderDate <= @FechaFin)
        AND o.Status = 'Completada'
    GROUP BY c.ClientId, u.Name
    ORDER BY NumeroCompras DESC, MontoTotal DESC;
END
GO
CREATE OR ALTER PROCEDURE GetRepartidoresEficientes
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL,
    @ClientId INT = NULL
AS
BEGIN
    WITH Repartos AS (
        SELECT
            dp.DeliveryId,
            u.Name,
            COUNT(o.OrderId) AS TotalAsignados,
            SUM(CASE WHEN o.Status = 'Completada' THEN 1 ELSE 0 END) AS EntregasCompletadas
        FROM ORDERS o
        INNER JOIN DELIVERY_PERSONS dp ON o.DeliveryId = dp.DeliveryId
        INNER JOIN USERS u ON dp.UserId = u.UserId
        WHERE
            (@ClientId IS NULL OR o.ClientId = @ClientId)
            AND (@FechaInicio IS NULL OR o.OrderDate >= @FechaInicio)
            AND (@FechaFin IS NULL OR o.OrderDate <= @FechaFin)
        GROUP BY dp.DeliveryId, u.Name
    )
    SELECT TOP 5
        DeliveryId,
        Name,
        TotalAsignados,
        EntregasCompletadas,
        CASE 
            WHEN TotalAsignados = 0 THEN 0 
            ELSE ROUND(CAST(EntregasCompletadas AS FLOAT) * 100 / TotalAsignados, 2) 
        END AS EficienciaPorcentaje
    FROM Repartos
    ORDER BY 
        CASE 
            WHEN TotalAsignados = 0 THEN 0 
            ELSE CAST(EntregasCompletadas AS FLOAT) * 100 / TotalAsignados 
        END DESC,
        EntregasCompletadas DESC;
END
GO

CREATE OR ALTER PROCEDURE GetTopProductosVentas
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL,
    @ClientId INT = NULL
AS
BEGIN
    SELECT TOP 5
        p.ProductId,
        p.Name,
        SUM(od.Quantity) AS CantidadVendida,
        SUM(od.Quantity * od.UnitPrice) AS MontoTotalVentas
    FROM ORDER_DETAILS od
    INNER JOIN ORDERS o ON od.OrderId = o.OrderId
    INNER JOIN PRODUCTS p ON od.ProductId = p.ProductId
    WHERE 
        (@ClientId IS NULL OR o.ClientId = @ClientId)
        AND (@FechaInicio IS NULL OR o.OrderDate >= @FechaInicio)
        AND (@FechaFin IS NULL OR o.OrderDate <= @FechaFin)
    GROUP BY p.ProductId, p.Name
    ORDER BY CantidadVendida DESC;
END
GO

-- 1. Total ventas con crecimiento
EXEC GetTotalVentasConCrecimiento
    @FechaInicio = '2025-01-01',
    @FechaFin = '2025-07-01',
    @ClientId = NULL;  -- NULL para todos los clientes, o un ID específico

-- 2. Clientes frecuentes
EXEC GetClientesFrecuentes
    @FechaInicio = '2025-01-01',
    @FechaFin = '2025-07-01',
    @ClientId = 2;

-- 3. Repartidores eficientes
EXEC GetRepartidoresEficientes
    @FechaInicio = '2025-01-01',
    @FechaFin = '2025-07-01',
    @ClientId = NULL;





CREATE OR ALTER PROCEDURE StartDeliveryRoute
  @OrderId INT,
  @DeliveryId INT,
  @StartLatitude DECIMAL(9,6),
  @StartLongitude DECIMAL(9,6)
AS
BEGIN
  SET NOCOUNT ON;

  IF NOT EXISTS (
    SELECT 1 FROM ORDERS 
    WHERE OrderId = @OrderId 
      AND DeliveryId = @DeliveryId 
      AND Status = 'En camino'
  )
  BEGIN
    THROW 50001, 'Orden no asignada o no está en estado En camino.', 1;
  END

  UPDATE ORDERS
  SET IsRouteStarted = 1,
      StartRouteLatitude = @StartLatitude,
      StartRouteLongitude = @StartLongitude
  WHERE OrderId = @OrderId;

  INSERT INTO ORDER_STATUS_HISTORY (OrderId, Status, Comment)
  VALUES (@OrderId, 'En camino', 'Ruta iniciada por el repartidor');
END;

CREATE OR ALTER PROCEDURE GetPendingOrdersForDelivery
  @DeliveryId INT
AS BEGIN SET NOCOUNT ON;

  SELECT
    O.OrderId,
    O.OrderDate,
    O.DeliveryAddressName,
    O.DeliveryAddress,
    CONCAT(O.DeliveryLatitude, ', ', O.DeliveryLongitude) AS DeliveryCoordinates,
    CONCAT(O.StartRouteLatitude, ', ', O.StartRouteLongitude) AS StartCoordinates,
    U.Name AS ClientName,
    C.Phone AS ClientPhone,
    O.Status,
    O.Total,
    O.IsRouteStarted
  FROM ORDERS O
  INNER JOIN CLIENTS C ON O.ClientId = C.ClientId
  INNER JOIN USERS U ON C.UserId = U.UserId
  WHERE O.DeliveryId = @DeliveryId
    AND O.Status = 'En camino'
  ORDER BY O.OrderDate ASC;
END;
CREATE OR ALTER PROCEDURE GetCompletedAndCancelledOrdersForDelivery  
  @DeliveryId INT  
AS  
BEGIN  
  SET NOCOUNT ON;  
  
  SELECT  
    O.OrderId,  
    O.OrderDate,  
    O.DeliveryAddressName,  
    O.DeliveryAddress,
    CONCAT(O.DeliveryLatitude, ', ', O.DeliveryLongitude) AS DeliveryCoordinates,
    CONCAT(O.StartRouteLatitude, ', ', O.StartRouteLongitude) AS StartCoordinates,
    U.Name AS ClientName,  
    C.Phone AS ClientPhone,  
    O.Status,  
    O.Total,  
    O.DiscountedTotal,  
    O.IsRouteStarted 
  FROM ORDERS O  
  INNER JOIN CLIENTS C ON O.ClientId = C.ClientId  
  INNER JOIN USERS U ON C.UserId = U.UserId  
  WHERE O.DeliveryId = @DeliveryId  
    AND O.Status IN ('Completada', 'Cancelada')  
  ORDER BY O.OrderDate DESC;  
END;  



CREATE OR ALTER PROCEDURE MarkOrderAsCompleted
  @OrderId INT
AS
BEGIN
  SET NOCOUNT ON;

  -- Validar que exista la orden y que esté "En camino"
  IF NOT EXISTS (
    SELECT 1 FROM ORDERS WHERE OrderId = @OrderId AND Status = 'En camino'
  )
  BEGIN
    THROW 50001, 'Orden no encontrada o no está en estado En camino.', 1;
  END

  BEGIN TRANSACTION;
  BEGIN TRY
    -- 1) Actualizar estado de la orden
    UPDATE ORDERS
    SET Status = 'Completada'
    WHERE OrderId = @OrderId;

    -- 2) Insertar en historial
    INSERT INTO ORDER_STATUS_HISTORY (OrderId, Status, Comment)
    VALUES (@OrderId, 'Completada', 'Orden entregada correctamente');

    -- 3) Marcar repartidor como disponible nuevamente
    DECLARE @DeliveryId INT;
    SELECT @DeliveryId = DeliveryId FROM ORDERS WHERE OrderId = @OrderId;

    IF @DeliveryId IS NOT NULL
    BEGIN
      UPDATE DELIVERY_PERSONS
      SET IsAvailable = 1
      WHERE DeliveryId = @DeliveryId;
    END

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;

CREATE OR ALTER PROCEDURE CreateOrder
  @ClientId         INT,
  @DeliveryAddress  VARCHAR(255),
  @DiscountId       INT              = NULL
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @Total           DECIMAL(10,2) = 0;
  DECLARE @DiscountedTotal DECIMAL(10,2);
  DECLARE @Pct             DECIMAL(5,2)  = 0;
  DECLARE @NewOrderId      INT;

  -- Calcular total bruto
  SELECT @Total = SUM(p.Price * od.Quantity)
  FROM ORDER_DETAILS od
  JOIN PRODUCTS p ON p.ProductId = od.ProductId
  WHERE od.OrderId = -1;  -- dummy, se ignora

  -- Para este primer SP, asumimos que el cálculo de totales
  -- se hará más adelante o se deja en cero si no aplica.

  -- Insertar la orden (no incluye detalles ni totales)
  INSERT INTO ORDERS (ClientId, DeliveryAddress, DiscountId, Total, DiscountedTotal)
  VALUES (@ClientId, @DeliveryAddress, @DiscountId, 0, 0);

  SET @NewOrderId = SCOPE_IDENTITY();

  -- Devolver el OrderId creado
  SELECT @NewOrderId AS OrderId;
END;
GO

CREATE OR ALTER PROCEDURE CreateCart
    @ClientId INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Carts (ClientId, IsActive, CreatedAt, UpdatedAt)
    VALUES (@ClientId, 1, GETDATE(), GETDATE());

    SELECT SCOPE_IDENTITY() AS CartId;
END;

CREATE PROCEDURE GetAllCategories
AS
BEGIN
    SELECT CategoryId, CategoryName
    FROM CATEGORIES
    ORDER BY CategoryName;
END;


CREATE OR ALTER PROCEDURE CreateOrderFromCart
  @CartId INT,
  @DeliveryAddress VARCHAR(255),
  @DeliveryLatitude DECIMAL(9,6),
  @DeliveryLongitude DECIMAL(9,6)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @ClientId INT;
  DECLARE @OrderId INT;
  DECLARE @Total DECIMAL(10,2);

  BEGIN TRY
    BEGIN TRANSACTION;

    SELECT @ClientId = ClientId 
    FROM Carts 
    WHERE CartId = @CartId AND IsActive = 1;

    IF @ClientId IS NULL
    BEGIN
      THROW 50000, 'Carrito no encontrado o ya fue comprado', 1;
    END

    INSERT INTO ORDERS (
      ClientId, 
      DeliveryAddress, 
      DeliveryAddressName,
      DeliveryLatitude, 
      DeliveryLongitude, 
      Total, 
      DiscountedTotal, 
      Status
    )
    VALUES (
      @ClientId, 
      @DeliveryAddress, 
      @DeliveryAddress,
      @DeliveryLatitude, 
      @DeliveryLongitude, 
      0, 
      0, 
      'Pending'
    );

    SET @OrderId = SCOPE_IDENTITY();

    -- Insertar detalles desde CartItems
    INSERT INTO ORDER_DETAILS (OrderId, ProductId, Quantity, UnitPrice)
    SELECT
      @OrderId,
      ci.ProductId,
      ci.Quantity,
      p.Price
    FROM CartItems ci
    INNER JOIN PRODUCTS p ON p.ProductId = ci.ProductId
    WHERE ci.CartId = @CartId;

    -- Calcular total de la orden
    SELECT @Total = SUM(Quantity * UnitPrice)
    FROM ORDER_DETAILS
    WHERE OrderId = @OrderId;

    -- Actualizar totales en la orden
    UPDATE ORDERS
    SET Total = @Total,
        DiscountedTotal = @Total
    WHERE OrderId = @OrderId;

    -- Marcar carrito como inactivo (comprado)
    UPDATE Carts
    SET IsActive = 0,
        UpdatedAt = GETDATE()
    WHERE CartId = @CartId;

    COMMIT TRANSACTION;

    -- Devolver el ID de la orden creada
    SELECT @OrderId AS OrderId;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0
      ROLLBACK TRANSACTION;

    THROW;
  END CATCH
END;

GO
CREATE OR ALTER PROCEDURE GetProductHistoryByClient
    @ClientId INT
AS
BEGIN
    SELECT 
        O.OrderId,
        O.OrderDate,
        O.Status,
        P.ProductId,
        O.DeliveryAddress,
        CONCAT(O.DeliveryLatitude, ', ', O.DeliveryLongitude) AS DeliveryCoordinates,
    CONCAT(O.StartRouteLatitude, ', ', O.StartRouteLongitude) AS StartCoordinates,
        P.Name AS ProductName,
        CI.Quantity,
        CI.Price,
        (CI.Quantity * CI.Price) AS Subtotal
    FROM ORDERS O
    JOIN Carts C ON C.ClientId = O.ClientId
    JOIN CartItems CI ON CI.CartId = C.CartId
    JOIN PRODUCTS P ON P.ProductId = CI.ProductId
    WHERE O.ClientId = @ClientId
    ORDER BY O.OrderDate DESC;
END;


CREATE OR ALTER PROCEDURE AddProductToCart
    @ClientId INT,
    @ProductId INT,
    @Quantity INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CartId INT;
    DECLARE @CartItemId INT;
    DECLARE @UnitPrice DECIMAL(10,2);

    -- 1. Obtener precio desde la tabla de productos
    SELECT @UnitPrice = Price FROM PRODUCTS WHERE ProductId = @ProductId;

    -- 2. Obtener carrito activo del cliente
    SELECT @CartId = CartId
    FROM Carts
    WHERE ClientId = @ClientId AND IsActive = 1;

    -- 3. Crear carrito si no existe
    IF @CartId IS NULL
    BEGIN
        INSERT INTO Carts (ClientId, IsActive, CreatedAt, UpdatedAt)
        VALUES (@ClientId, 1, GETDATE(), GETDATE());
        SET @CartId = SCOPE_IDENTITY();
    END

    -- 4. Verificar si el producto ya está en el carrito
    SELECT @CartItemId = CartItemId
    FROM CartItems
    WHERE CartId = @CartId AND ProductId = @ProductId;

    IF @CartItemId IS NOT NULL
    BEGIN
        -- Actualizar la cantidad si ya existe
        UPDATE CartItems
        SET Quantity = Quantity + @Quantity,
            UpdatedAt = GETDATE()
        WHERE CartItemId = @CartItemId;

        SELECT @CartItemId AS CartItemId;
    END
    ELSE
    BEGIN
        -- Insertar nuevo producto si no está en el carrito
        INSERT INTO CartItems (CartId, ProductId, Quantity, Price, CreatedAt, UpdatedAt)
        VALUES (@CartId, @ProductId, @Quantity, @UnitPrice, GETDATE(), GETDATE());

        SELECT SCOPE_IDENTITY() AS CartItemId;
    END
END

CREATE PROCEDURE UpdateCartItemQuantity
    @CartId INT,
    @ProductId INT,
    @NewQuantity INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Si la cantidad es 0 o menor, eliminamos el item del carrito
    IF @NewQuantity <= 0
    BEGIN
        DELETE FROM CartItems
        WHERE CartId = @CartId AND ProductId = @ProductId;
        RETURN;
    END

    -- Actualizamos cantidad y fecha
    UPDATE CartItems
    SET Quantity = @NewQuantity,
        UpdatedAt = GETDATE()
    WHERE CartId = @CartId AND ProductId = @ProductId;
END

CREATE OR ALTER PROCEDURE DeleteCartItem
    @CartId INT,
    @ProductId INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM CartItems
    WHERE CartId = @CartId AND ProductId = @ProductId;
END

CREATE PROCEDURE AddOrderDetails
  @OrderId  INT,
  @Products OrderProductType READONLY
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRANSACTION;
  DECLARE @Total DECIMAL(10,2) = 0;

  BEGIN TRY
    -- 1) Insertar detalles
    INSERT INTO ORDER_DETAILS (OrderId, ProductId, Quantity, UnitPrice)
    SELECT
      @OrderId,
      op.ProductId,
      op.Quantity,
      p.Price
    FROM @Products op
    JOIN PRODUCTS p ON p.ProductId = op.ProductId;

    -- 2) Recalcular total
    SELECT @Total = SUM(UnitPrice * Quantity)
    FROM ORDER_DETAILS
    WHERE OrderId = @OrderId;

    -- 3) Actualizar totales en ORDERS
    UPDATE ORDERS
    SET Total = @Total,
        DiscountedTotal = @Total  -- o aplicar descuento aquí
    WHERE OrderId = @OrderId;

    -- 4) Registrar historial
    INSERT INTO ORDER_STATUS_HISTORY (OrderId, Status, ChangeDate, Comment)
    VALUES (@OrderId, 'Details Added', GETDATE(), 'Líneas de pedido agregadas');

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO
CREATE OR ALTER PROCEDURE GetOrderDetail
    @OrderId INT
AS
BEGIN
    SELECT 
        P.ProductId,
        P.Name AS ProductName,
        OD.Quantity,
        OD.UnitPrice AS Price,
        (OD.Quantity * OD.UnitPrice) AS Subtotal
    FROM order_Details OD
    JOIN PRODUCTS P ON P.ProductId = OD.ProductId
    WHERE OD.OrderId = @OrderId;
END;

CREATE PROCEDURE AssignDelivery
  @OrderId INT,
  @DeliveryId INT  -- FK a DELIVERY_PERSONS
AS
BEGIN
  SET NOCOUNT ON;

  -- Validar existencia de orden y repartidor
  IF NOT EXISTS(SELECT 1 FROM ORDERS WHERE OrderId = @OrderId)
    THROW 50001, 'Orden no encontrada.', 1;
  IF NOT EXISTS(SELECT 1 FROM DELIVERY_PERSONS WHERE DeliveryId = @DeliveryId AND IsAvailable = 1)
    THROW 50002, 'Repartidor no disponible o no existe.', 1;

  -- 1) Actualizar orden
  UPDATE ORDERS
  SET DeliveryId = @DeliveryId,
      Status     = 'En camino'
  WHERE OrderId = @OrderId;

  -- 2) Registrar en historial
  INSERT INTO ORDER_STATUS_HISTORY (OrderId, Status, Comment)
  VALUES (@OrderId, 'En camino', 'Repartidor asignado');

  -- 3) Marcar repartidor como no disponible (opcional)
  UPDATE DELIVERY_PERSONS
  SET IsAvailable = 0
  WHERE DeliveryId = @DeliveryId;
END;
CREATE PROCEDURE CancelOrder
  @OrderId INT
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @DeliveryId INT;

  -- Validar que la orden exista y no esté finalizada
  IF NOT EXISTS (SELECT 1 FROM ORDERS WHERE OrderId = @OrderId)
    THROW 50001, 'Orden no encontrada.', 1;

  IF EXISTS (
    SELECT 1 FROM ORDERS 
    WHERE OrderId = @OrderId AND Status IN ('Entregada', 'Cancelada')
  )
    THROW 50002, 'No se puede cancelar una orden completada o ya cancelada.', 1;

  -- Obtener el DeliveryId si tenía asignado
  SELECT @DeliveryId = DeliveryId FROM ORDERS WHERE OrderId = @OrderId;

  -- Actualizar estado de la orden
  UPDATE ORDERS
  SET Status = 'Cancelada'
  WHERE OrderId = @OrderId;

  -- Registrar en historial
  INSERT INTO ORDER_STATUS_HISTORY (OrderId, Status, Comment)
  VALUES (@OrderId, 'Cancelada', 'Orden cancelada por el sistema o el usuario');

  -- Si tenía repartidor, volverlo disponible
  IF @DeliveryId IS NOT NULL
  BEGIN
    UPDATE DELIVERY_PERSONS
    SET IsAvailable = 1
    WHERE DeliveryId = @DeliveryId;
  END
END;

CREATE OR ALTER PROCEDURE GetCartByClient
  @ClientId INT
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @CartId INT;

  -- 1. Obtener carrito activo
  SELECT @CartId = CartId
  FROM Carts
  WHERE ClientId = @ClientId AND IsActive = 1;

  -- 2. Si no existe, devolver vacío
  IF @CartId IS NULL
  BEGIN
    SELECT NULL AS CartId, NULL AS ProductId, NULL AS ProductName, NULL AS Quantity,
           NULL AS Price, NULL AS Subtotal, NULL AS ImageURL;
    RETURN;
  END

  -- 3. Devolver productos del carrito
  SELECT 
    ci.CartId,
    p.ProductId,
    p.Name AS ProductName,
    ci.Quantity,
    ci.Price,
    (ci.Quantity * ci.Price) AS Subtotal,
    p.ImageURL
  FROM CartItems ci
  JOIN PRODUCTS p ON ci.ProductId = p.ProductId
  WHERE ci.CartId = @CartId;
END
GO;

go 

CREATE or alter PROCEDURE RegisterClient
    @Name           VARCHAR(100),
    @Email          VARCHAR(100),
    @Password       VARCHAR(255),
    @DefaultAddress VARCHAR(255),
    @Phone          VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1) Verificar que el email no exista
    IF EXISTS (SELECT 1 FROM USERS WHERE Email = @Email)
    BEGIN
        RAISERROR('El correo ya está registrado.', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        -- 2) Insertar en USERS con hash de contraseña
        INSERT INTO USERS (Name, Email, PasswordHash, RoleName)
        VALUES (
            @Name,
            @Email,
            HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), @Password)),
            'Client'
        );

        -- 3) Obtener el UserId recién creado
        DECLARE @NewUserId INT = SCOPE_IDENTITY();

        -- 4) Insertar en CLIENTS
        INSERT INTO CLIENTS (UserId, DefaultAddress, Phone)
        VALUES (@NewUserId, @DefaultAddress, @Phone);

        -- 5) Obtener el ClientId recién generado
        DECLARE @NewClientId INT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        -- 6) Devolver el ClientId
        SELECT @NewClientId AS ClientId;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO



CREATE OR ALTER PROCEDURE GetUserInfo
    @Email VARCHAR(100),
    @Password VARCHAR(255)
AS BEGIN
    SET NOCOUNT ON;

    DECLARE @UserId INT;
    DECLARE @RoleName VARCHAR(50);

    -- Validar credenciales
    SELECT 
        @UserId = UserId,
        @RoleName = RoleName
    FROM USERS
    WHERE Email = @Email 
    AND PasswordHash = HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), @Password));

    -- Si no se encontró el usuario
    IF @UserId IS NULL
    BEGIN
        SELECT 'Credenciales inválidas' AS Message;
        RETURN;
    END
    IF @RoleName = 'Client'
    BEGIN
        SELECT 
            U.UserId,
            U.Name,
            U.Email,
            U.RoleName,
            C.ClientID
        FROM USERS U
        INNER JOIN CLIENTS C ON C.UserId = U.UserId
        WHERE U.UserId = @UserId;
        RETURN;
    END

    -- Si el usuario es Delivery, traer DeliveryID
    IF @RoleName = 'Delivery'
    BEGIN
        SELECT 
            U.UserId,
            U.Name,
            U.Email,
            U.RoleName,
            D.DeliveryID
        FROM USERS U
        INNER JOIN DELIVERY_PERSONS D ON D.UserId = U.UserId
        WHERE U.UserId = @UserId;
        RETURN;
    END
    IF @RoleName = 'Distributor'
    BEGIN
        SELECT 
            U.UserId,
            U.Name,
            U.Email,
            U.RoleName
        FROM USERS U
        WHERE U.UserId = @UserId;
        RETURN;
    END
END;




CREATE PROCEDURE RegisterDeliveryPerson
    @Name       VARCHAR(100),
    @Email      VARCHAR(100),
    @Password   VARCHAR(255),
    @Region     VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1) Verificar que el email no exista
    IF EXISTS (SELECT 1 FROM USERS WHERE Email = @Email)
    BEGIN
        RAISERROR('El correo ya está registrado.', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        -- 2) Insertar en USERS con hash de contraseña y rol 'Delivery'
        INSERT INTO USERS (Name, Email, PasswordHash, RoleName)
        VALUES (
            @Name,
            @Email,
            HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), @Password)),
            'Delivery'
        );

        -- 3) Obtener el UserId recién creado
        DECLARE @NewUserId INT = SCOPE_IDENTITY();

        -- 4) Insertar en DELIVERY_PERSONS
        INSERT INTO DELIVERY_PERSONS (UserId, IsAvailable, Region)
        VALUES (@NewUserId, 1, @Region);

        -- 5) Obtener el DeliveryId recién generado
        DECLARE @NewDeliveryId INT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        -- 6) Devolver el DeliveryId
        SELECT @NewDeliveryId AS DeliveryId;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO
CREATE PROCEDURE UpdateDeliveryPerson
    @UserId INT,
    @Name   VARCHAR(100),
    @Email  VARCHAR(100),
    @Region VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- 1) Actualizar datos en USERS
        UPDATE USERS
        SET 
            Name = @Name,
            Email = @Email
        WHERE 
            UserId = @UserId;

        -- 2) Actualizar región en DELIVERY_PERSONS
        UPDATE DELIVERY_PERSONS
        SET Region = @Region
        WHERE UserId = @UserId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;

        -- Forma correcta de lanzar el error capturado
        THROW;
    END CATCH
END;

CREATE PROCEDURE DisableDeliveryPerson
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        UPDATE DELIVERY_PERSONS
        SET IsAvailable = 0
        WHERE UserId = @UserId;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;



EXEC GetUserInfo 
    @Email = 'carlosperez@gmail.com', 
    @Password = 'cliente123';



CREATE PROCEDURE GetAllClients
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    c.ClientId,
    u.UserId,
    u.Name       AS ClientName,
    u.Email      AS ClientEmail,
    c.DefaultAddress,
    c.Phone,
    u.RegistrationDate
  FROM CLIENTS c
  JOIN USERS u
    ON c.UserId = u.UserId
  ORDER BY u.Name;
END;
GO



CREATE PROCEDURE GetAllDeliveryPersons
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    dp.DeliveryId,
    u.UserId,
    u.Name       AS DeliveryName,
    u.Email      AS DeliveryEmail,
    dp.IsAvailable,
    dp.Region,
    u.RegistrationDate
  FROM DELIVERY_PERSONS dp
  JOIN USERS u
    ON dp.UserId = u.UserId
  ORDER BY dp.IsAvailable DESC, u.Name;
END;
GO

-- 1) Procedimiento para crear una nueva categoría
CREATE PROCEDURE CreateCategory
  @CategoryName VARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;

  -- Validar que no exista ya una categoría con el mismo nombre
  IF EXISTS (SELECT 1 FROM CATEGORIES WHERE CategoryName = @CategoryName)
  BEGIN
    RAISERROR('Ya existe una categoría con ese nombre.', 16, 1);
    RETURN;
  END

  -- Insertar y devolver el nuevo CategoryId
  INSERT INTO CATEGORIES (CategoryName)
  VALUES (@CategoryName);

  SELECT SCOPE_IDENTITY() AS CategoryId;
END;
GO



CREATE PROCEDURE CreateProduct
  @Name        VARCHAR(100),
  @Description VARCHAR(200)       = NULL,
  @Price       DECIMAL(10,2),
  @Stock       INT,
  @ImageURL    VARCHAR(255)       = NULL,
  @CategoryId  INT                = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRANSACTION;

  BEGIN TRY
    -- Validar la categoría si se proporcionó
    IF @CategoryId IS NOT NULL
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM CATEGORIES WHERE CategoryId = @CategoryId)
      BEGIN
        RAISERROR('Categoría no encontrada.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
      END
    END

    -- Insertar el producto
    INSERT INTO PRODUCTS (Name, Description, Price, Stock, ImageURL, CategoryId)
    VALUES (@Name, @Description, @Price, @Stock, @ImageURL, @CategoryId);

    -- Devolver el nuevo ProductId
    SELECT SCOPE_IDENTITY() AS ProductId;

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO


CREATE OR ALTER PROCEDURE GetAllSales
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        O.OrderId,
        O.OrderDate,
        O.Status,
        O.DeliveryAddress,
        O.Total,
        O.DiscountedTotal,
        C.ClientId,
        U.Name AS ClientName,
        U.Email AS ClientEmail,
        U.UserId,
        D.Code AS DiscountCode,
        D.Percentage AS DiscountPercentage
    FROM ORDERS O
    INNER JOIN CLIENTS C ON O.ClientId = C.ClientId
    INNER JOIN USERS U ON C.UserId = U.UserId
    LEFT JOIN DISCOUNTS D ON O.DiscountId = D.DiscountId
    ORDER BY O.OrderDate DESC;
END;


CREATE OR ALTER PROCEDURE GetFullOrderById
    @OrderId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        o.OrderId,
        o.OrderDate,
        o.Status,
        o.DeliveryAddress,

        -- Cliente
        uc.Name AS ClientName,
        uc.Email AS ClientEmail,

        -- Repartidor (si existe)
        ud.Name AS DeliveryPersonName,
        ud.Email AS DeliveryPersonEmail,

        -- Totales
        o.Total AS Subtotal,
        ISNULL(d.Percentage, 0) AS DiscountPercentage,
        o.DiscountedTotal AS TotalWithDiscount,

        -- Productos
        p.ProductId,
        p.Name AS ProductName,
        od.Quantity,
        od.UnitPrice,
        (od.Quantity * od.UnitPrice) AS TotalPrice

    FROM ORDERS o
    INNER JOIN CLIENTS c ON o.ClientId = c.ClientId
    INNER JOIN USERS uc ON c.UserId = uc.UserId

    LEFT JOIN DELIVERY_PERSONS dp ON o.DeliveryId = dp.DeliveryId
    LEFT JOIN USERS ud ON dp.UserId = ud.UserId

    LEFT JOIN DISCOUNTS d ON o.DiscountId = d.DiscountId

    INNER JOIN order_details od ON o.OrderId = od.OrderId
    INNER JOIN PRODUCTS p ON od.ProductId = p.ProductId

    WHERE o.OrderId = @OrderId;
END;

CREATE OR ALTER PROCEDURE sp_GetSuperAdminDashboardStats
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @DeliveryId INT = NULL,
    @ClientId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. CREAR TABLA TEMPORAL
    CREATE TABLE #FilteredOrders (
        OrderId INT,
        ClientId INT,
        DeliveryId INT,
        OrderDate DATE,
        DiscountedTotal DECIMAL(18,2),
        Status VARCHAR(50)
        -- agrega más columnas si las necesitás
    );

    -- 2. LLENARLA CON LOS FILTROS
    INSERT INTO #FilteredOrders
    SELECT OrderId, ClientId, DeliveryId, OrderDate, DiscountedTotal, Status
    FROM ORDERS
    WHERE 
        (@StartDate IS NULL OR OrderDate >= @StartDate) AND
        (@EndDate IS NULL OR OrderDate <= @EndDate) AND
        (@DeliveryId IS NULL OR DeliveryId = @DeliveryId) AND
        (@ClientId IS NULL OR ClientId = @ClientId);

    -- 3. RESUMEN GENERAL
    SELECT 
        COUNT(*) AS TotalOrders,
        COUNT(DISTINCT ClientId) AS TotalClients,
        COUNT(DISTINCT DeliveryId) AS TotalDistributors,
        ISNULL(SUM(DiscountedTotal), 0) AS TotalRevenue
    FROM #FilteredOrders;

    -- 4. TOP 5 PRODUCTOS MÁS VENDIDOS
    SELECT TOP 5 
        p.ProductId,
        p.Name AS ProductName,
        SUM(ci.Quantity) AS TotalSold,
        SUM(ci.Quantity * ci.Price) AS TotalRevenue
    FROM #FilteredOrders o
    JOIN CLIENTS c ON c.ClientId = o.ClientId
    JOIN Carts ca ON ca.ClientId = c.ClientId
    JOIN CartItems ci ON ci.CartId = ca.CartId
    JOIN PRODUCTs p ON p.ProductId = ci.ProductId
    GROUP BY p.ProductId, p.Name
    ORDER BY TotalSold DESC;

    -- 5. TOP 5 DISTRIBUIDORES
    SELECT TOP 5 
        u.UserId,
        u.Name AS DistributorName,
        COUNT(*) AS CompletedDeliveries
    FROM #FilteredOrders o
    JOIN DELIVERY_PERSONS d ON d.DeliveryId = o.DeliveryId
    JOIN USERS u ON u.UserId = d.UserId
    WHERE o.Status = 'Completada'
    GROUP BY u.UserId, u.Name
    ORDER BY CompletedDeliveries DESC;

    -- 6. TOP 5 CLIENTES
    SELECT TOP 5 
        u.UserId,
        u.Name AS ClientName,
        SUM(o.DiscountedTotal) AS TotalSpent
    FROM #FilteredOrders o
    JOIN CLIENTS c ON c.ClientId = o.ClientId
    JOIN USERS u ON u.UserId = c.UserId
    GROUP BY u.UserId, u.Name
    ORDER BY TotalSpent DESC;

    -- 7. INGRESOS POR DÍA
    SELECT 
        CAST(OrderDate AS DATE) AS OrderDay,
        COUNT(*) AS OrdersCount,
        SUM(DiscountedTotal) AS Revenue
    FROM #FilteredOrders
    GROUP BY CAST(OrderDate AS DATE)
    ORDER BY OrderDay;

    -- 8. LIMPIAR
    DROP TABLE #FilteredOrders;
END;

CREATE or alter VIEW ProductWithCategory AS
SELECT 
    p.ProductId,
    p.Name AS ProductName,
    p.Description,
    p.Price,
    p.Stock,
    p.ImageURL,
    p.isAvailable,
    c.CategoryName,
    c.CategoryId
FROM 
    PRODUCTS p
INNER JOIN 
    CATEGORIES c ON p.CategoryId = c.CategoryId;
GO
CREATE OR ALTER PROCEDURE sp_GetMyDeliveryStats
    @UserId INT,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @DeliveryId INT;

    SELECT @DeliveryId = DeliveryId
    FROM DELIVERY_PERSONS
    WHERE UserId = @UserId;

    IF @DeliveryId IS NULL
    BEGIN
        RAISERROR('No existe un repartidor asociado a este usuario.', 16, 1);
        RETURN;
    END;

    -- Resumen
    SELECT 
        COUNT(*) AS TotalOrders,
        COUNT(CASE WHEN Status = 'Completada' THEN 1 END) AS CompletedOrders,
        COUNT(CASE WHEN Status IN ('Cancelada', 'Cancelled') THEN 1 END) AS FailedOrders,
        ISNULL(SUM(DiscountedTotal), 0) AS TotalRevenue
    FROM ORDERS
    WHERE DeliveryId = @DeliveryId
      AND (@StartDate IS NULL OR OrderDate >= @StartDate)
      AND (@EndDate IS NULL OR OrderDate <= @EndDate);

    -- Órdenes detalladas
    SELECT 
        o.OrderId,
        o.OrderDate,
        o.Status,
        o.DiscountedTotal,
        o.DeliveryAddress,
        o.DeliveryAddressName,
        o.DeliveryLatitude,
        o.DeliveryLongitude
    FROM ORDERS o
    WHERE o.DeliveryId = @DeliveryId
      AND (@StartDate IS NULL OR o.OrderDate >= @StartDate)
      AND (@EndDate IS NULL OR o.OrderDate <= @EndDate)
    ORDER BY o.OrderDate DESC;
END;
