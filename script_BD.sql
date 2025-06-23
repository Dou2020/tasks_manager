-- Crear la base de datos
CREATE DATABASE TaskManagerDB;
GO

USE TaskManagerDB;
GO

-- ================================================
-- TABLA: Users (Usuarios)
-- ================================================
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(50),
    last_name NVARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    last_login DATETIME2,
    
    -- Índices
    INDEX IX_Users_Username (username),
    INDEX IX_Users_Email (email),
    INDEX IX_Users_Active (is_active)
);

-- ================================================
-- TABLA: Categories (Categorías de tareas)
-- ================================================
CREATE TABLE Categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL,
    description NVARCHAR(200),
    color_hex NVARCHAR(7) DEFAULT '#007ACC', -- Color en hexadecimal
    icon NVARCHAR(50), -- Nombre del icono
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Índices
    INDEX IX_Categories_Name (name),
    INDEX IX_Categories_Active (is_active)
);

-- ================================================
-- TABLA: Priorities (Prioridades)
-- ================================================
CREATE TABLE Priorities (
    priority_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(20) NOT NULL, -- 'Alta', 'Media', 'Baja', 'Crítica'
    level_number INT NOT NULL, -- 1=Crítica, 2=Alta, 3=Media, 4=Baja
    color_hex NVARCHAR(7) DEFAULT '#FFA500',
    
    UNIQUE (level_number),
    INDEX IX_Priorities_Level (level_number)
);

-- ================================================
-- TABLA: Task_Status (Estados de tareas)
-- ================================================
CREATE TABLE Task_Status (
    status_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(30) NOT NULL, -- 'Pendiente', 'En Progreso', 'Completada', 'Cancelada'
    description NVARCHAR(100),
    color_hex NVARCHAR(7) DEFAULT '#28A745',
    is_final BIT DEFAULT 0, -- Indica si es un estado final (Completada/Cancelada)
    
    INDEX IX_TaskStatus_Name (name)
);

-- ================================================
-- TABLA: Tasks (Tareas principales)
-- ================================================
CREATE TABLE Tasks (
    task_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    description NTEXT,
    user_id INT NOT NULL,
    category_id INT,
    priority_id INT DEFAULT 3, -- Media por defecto
    status_id INT DEFAULT 1, -- Pendiente por defecto
    
    -- Fechas
    due_date DATETIME2,
    start_date DATETIME2,
    completed_date DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Campos adicionales
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    tags NVARCHAR(500), -- Tags separados por comas
    notes NTEXT,
    is_archived BIT DEFAULT 0,
    
    -- Claves foráneas
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (priority_id) REFERENCES Priorities(priority_id) ON DELETE SET DEFAULT,
    FOREIGN KEY (status_id) REFERENCES Task_Status(status_id) ON DELETE SET DEFAULT,
    
    -- Índices
    INDEX IX_Tasks_UserId (user_id),
    INDEX IX_Tasks_CategoryId (category_id),
    INDEX IX_Tasks_PriorityId (priority_id),
    INDEX IX_Tasks_StatusId (status_id),
    INDEX IX_Tasks_DueDate (due_date),
    INDEX IX_Tasks_CreatedAt (created_at),
    INDEX IX_Tasks_Archived (is_archived),
    INDEX IX_Tasks_Title (title)
);

-- ================================================
-- TABLA: Task_Comments (Comentarios de tareas)
-- ================================================
CREATE TABLE Task_Comments (
    comment_id INT IDENTITY(1,1) PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text NTEXT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    is_edited BIT DEFAULT 0,
    
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE NO ACTION,
    
    -- Índices
    INDEX IX_TaskComments_TaskId (task_id),
    INDEX IX_TaskComments_UserId (user_id),
    INDEX IX_TaskComments_CreatedAt (created_at)
);

-- ================================================
-- TABLA: Task_Attachments (Archivos adjuntos)
-- ================================================
CREATE TABLE Task_Attachments (
    attachment_id INT IDENTITY(1,1) PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_path NVARCHAR(500) NOT NULL,
    file_size BIGINT, -- Tamaño en bytes
    file_type NVARCHAR(50), -- MIME type
    uploaded_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE NO ACTION,
    
    -- Índices
    INDEX IX_TaskAttachments_TaskId (task_id),
    INDEX IX_TaskAttachments_UserId (user_id)
);

-- ================================================
-- TABLA: Task_History (Historial de cambios)
-- ================================================
CREATE TABLE Task_History (
    history_id INT IDENTITY(1,1) PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    action_type NVARCHAR(50) NOT NULL, -- 'CREATED', 'UPDATED', 'STATUS_CHANGED', 'DELETED'
    field_name NVARCHAR(50), -- Campo que cambió
    old_value NVARCHAR(MAX), -- Valor anterior
    new_value NVARCHAR(MAX), -- Nuevo valor
    change_description NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE NO ACTION,
    
    -- Índices
    INDEX IX_TaskHistory_TaskId (task_id),
    INDEX IX_TaskHistory_UserId (user_id),
    INDEX IX_TaskHistory_ActionType (action_type),
    INDEX IX_TaskHistory_CreatedAt (created_at)
);

-- ================================================
-- TABLA: User_Sessions (Sesiones de usuario - WebSocket)
-- ================================================
CREATE TABLE User_Sessions (
    session_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    socket_id NVARCHAR(100) NOT NULL,
    ip_address NVARCHAR(45),
    user_agent NVARCHAR(500),
    connected_at DATETIME2 DEFAULT GETDATE(),
    disconnected_at DATETIME2,
    is_active BIT DEFAULT 1,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    
    -- Índices
    INDEX IX_UserSessions_UserId (user_id),
    INDEX IX_UserSessions_SocketId (socket_id),
    INDEX IX_UserSessions_Active (is_active)
);