-- Habilita HASHBYTES si usas SQL Server
-- No necesario en versiones modernas, pero útil mencionarlo

-- Usuarios
CREATE TABLE USERS (
    UserId INT PRIMARY KEY IDENTITY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARBINARY(64) NOT NULL, -- HASHBYTES (SHA-256) genera 32 bytes = 64 hex
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
CREATE TABLE ORDERS (
    OrderId INT PRIMARY KEY IDENTITY,
    UserId INT NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    Status VARCHAR(50) DEFAULT 'Pending',
    DeliveryAddress VARCHAR(255),
    DiscountId INT NULL,
    Total DECIMAL(10,2) NOT NULL,
    DiscountedTotal DECIMAL(10,2),
    FOREIGN KEY (UserId) REFERENCES USERS(UserId),
    FOREIGN KEY (DiscountId) REFERENCES DISCOUNTS(DiscountId)
);

-- Detalle de pedidos
CREATE TABLE ORDER_DETAILS (
    DetailId INT PRIMARY KEY IDENTITY,
    OrderId INT,
    ProductId INT,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (OrderId) REFERENCES ORDERS(OrderId),
    FOREIGN KEY (ProductId) REFERENCES PRODUCTS(ProductId)
);

-- Notificaciones
CREATE TABLE NOTIFICATIONS (
    NotificationId INT PRIMARY KEY IDENTITY,
    UserId INT,
    Message VARCHAR(255),
    Date DATETIME DEFAULT GETDATE(),
    IsRead BIT DEFAULT 0,
    FOREIGN KEY (UserId) REFERENCES USERS(UserId)
);

-- Historial de estados
CREATE TABLE ORDER_STATUS_HISTORY (
    HistoryId INT PRIMARY KEY IDENTITY,
    OrderId INT,
    Status VARCHAR(50),
    ChangeDate DATETIME DEFAULT GETDATE(),
    Comment VARCHAR(255),
    FOREIGN KEY (OrderId) REFERENCES ORDERS(OrderId)
);

-- Descuentos por producto
CREATE TABLE PRODUCT_DISCOUNTS (
    ProductDiscountId INT PRIMARY KEY IDENTITY,
    ProductId INT,
    Percentage DECIMAL(5,2),
    StartDate DATETIME,
    EndDate DATETIME,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (ProductId) REFERENCES PRODUCTS(ProductId)
);

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
go 
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

