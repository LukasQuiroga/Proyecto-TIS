CREATE TABLE recuperacion_contrasena (

    id_recuperacion BIGSERIAL PRIMARY KEY,


    id_usuario BIGINT NOT NULL,


    codigo_hash VARCHAR(100) NOT NULL,


    token_hash VARCHAR(100),


    fecha_creacion TIMESTAMP NOT NULL,


    fecha_expiracion TIMESTAMP NOT NULL,


    intentos_fallidos INTEGER DEFAULT 0,


    codigo_verificado BOOLEAN DEFAULT FALSE,


    usado BOOLEAN DEFAULT FALSE,


    CONSTRAINT fk_recuperacion_usuario

    FOREIGN KEY(id_usuario)

    REFERENCES usuario(id_usuario)

);