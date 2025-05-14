

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
CREATE TABLE PRODUCTS (
    ProductId INT PRIMARY KEY IDENTITY,
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(200),
    Price DECIMAL(10,2) NOT NULL,
    Stock INT NOT NULL,
    ImageURL VARCHAR(255),
    CategoryId INT,
    FOREIGN KEY (CategoryId) REFERENCES CATEGORIES(CategoryId)
);

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

CREATE TYPE OrderProductType AS TABLE (
  ProductId INT,
  Quantity INT
);
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


go 
CREATE PROCEDURE RegisterUser
    @Name VARCHAR(100),
    @Email VARCHAR(100),
    @Password VARCHAR(255),
    @RoleName VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM USERS WHERE Email = @Email)
    BEGIN
        RAISERROR('El correo ya está registrado.', 16, 1);
        RETURN;
    END

    INSERT INTO USERS (Name, Email, PasswordHash, RoleName)
    VALUES (
        @Name,
        @Email,
        HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), @Password)),
        @RoleName
    );
END;
go;

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
CREATE PROCEDURE GetUserInfo
    @Email VARCHAR(100),
    @Password VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        UserId,
        Name,
        Email,
        RoleName,
        'Login correcto' AS Message
    FROM USERS
    WHERE Email = @Email 
    AND PasswordHash = HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), @Password));
    
    IF @@ROWCOUNT = 0
    BEGIN
        SELECT 'Credenciales inválidas' AS ErrorMessage;
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

EXEC RegisterUser
    @Name = 'Carlos Pérez',
    @Email = 'carlosperez@gmail.com',
    @Password = 'cliente123',
    @RoleName = 'Client';

EXEC RegisterUser
    @Name = 'Lucía Torres',
    @Email = 'luciatorres@gmail.com',
    @Password = 'distribuidor456',
    @RoleName = 'Distributor';



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

CREATE VIEW ProductWithCategory AS
SELECT 
    p.ProductId,
    p.Name AS ProductName,
    p.Description,
    p.Price,
    p.Stock,
    p.ImageURL,
    c.CategoryName
FROM 
    PRODUCTS p
INNER JOIN 
    CATEGORIES c ON p.CategoryId = c.CategoryId;
GO