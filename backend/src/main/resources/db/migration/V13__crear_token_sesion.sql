CREATE TABLE seguridad.token_sesion (
    id_token BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    token_id VARCHAR(100) NOT NULL UNIQUE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_token_sesion_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES seguridad.usuario(id_usuario)
        ON DELETE CASCADE
);

CREATE INDEX idx_token_sesion_usuario
    ON seguridad.token_sesion(id_usuario);

CREATE INDEX idx_token_sesion_token_id
    ON seguridad.token_sesion(token_id);