CREATE TABLE rol (
    id_rol           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_rol       VARCHAR(50)  NOT NULL UNIQUE,
    descripcion_rol  VARCHAR(255),
    fecha_asignacion TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE usuario (
    id_usuario       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_rol           BIGINT       NOT NULL REFERENCES rol (id_rol),
    nombre           VARCHAR(80)  NOT NULL,
    apellido         VARCHAR(80)  NOT NULL,
    carrera          VARCHAR(120),
    correo           VARCHAR(150) NOT NULL UNIQUE,
    contrasena       VARCHAR(255) NOT NULL,
    carnet_identidad VARCHAR(30)  UNIQUE,
    codigo_sis       VARCHAR(20)  UNIQUE,
    celular          VARCHAR(30),
    activo           BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_creacion   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE log_actividad (
    id_log      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario  BIGINT       REFERENCES usuario (id_usuario) ON DELETE SET NULL,
    tipo_accion VARCHAR(50)  NOT NULL,
    descripcion TEXT         NOT NULL,
    ip_origen   VARCHAR(45),
    fecha       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuario_correo    ON usuario (correo);
CREATE INDEX idx_log_usuario_fecha ON log_actividad (id_usuario, fecha);

INSERT INTO rol (nombre_rol, descripcion_rol) VALUES
    ('ADMINISTRADOR', 'Acceso total al sistema'),
    ('DOCENTE',       'Gestiona los exámenes'),
    ('ESTUDIANTE',    'Rinde los exámenes');