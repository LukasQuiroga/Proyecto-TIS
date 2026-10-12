CREATE TABLE academico.ambiente (
    id_ambiente BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    capacidad INTEGER NOT NULL,
    ubicacion VARCHAR(150) NOT NULL,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_ambiente_codigo
        CHECK (codigo ~ '^[A-Za-z0-9_-]+$'),

    CONSTRAINT chk_ambiente_nombre
        CHECK (
            LENGTH(TRIM(nombre)) >= 3
            AND LENGTH(nombre) <= 100
        ),

    CONSTRAINT chk_ambiente_capacidad
        CHECK (capacidad > 0),

    CONSTRAINT chk_ambiente_ubicacion
        CHECK (
            LENGTH(TRIM(ubicacion)) >= 3
            AND LENGTH(ubicacion) <= 150
        )
);

CREATE UNIQUE INDEX uq_ambiente_codigo_normalizado
    ON academico.ambiente (UPPER(TRIM(codigo)));

CREATE INDEX idx_ambiente_nombre
    ON academico.ambiente (nombre);

CREATE INDEX idx_ambiente_disponible
    ON academico.ambiente (disponible);

ALTER TABLE academico.examen
    ADD COLUMN id_ambiente BIGINT;

ALTER TABLE academico.examen
    ADD CONSTRAINT fk_examen_ambiente
        FOREIGN KEY (id_ambiente)
        REFERENCES academico.ambiente(id_ambiente)
        ON DELETE RESTRICT;

CREATE INDEX idx_examen_ambiente
    ON academico.examen(id_ambiente);

CREATE OR REPLACE FUNCTION academico.validar_ambiente_examen()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.id_ambiente IS NULL THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM academico.ambiente a
        WHERE a.id_ambiente = NEW.id_ambiente
          AND a.disponible = TRUE
    ) THEN
        RAISE EXCEPTION
            'El ambiente seleccionado no se encuentra disponible';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM academico.examen e
        WHERE e.id_ambiente = NEW.id_ambiente
          AND e.fecha_examen = NEW.fecha_examen
          AND e.id_examen <> COALESCE(NEW.id_examen, -1)
          AND e.hora_inicio < NEW.hora_fin
          AND e.hora_fin > NEW.hora_inicio
    ) THEN
        RAISE EXCEPTION
            'El ambiente ya se encuentra asignado a otro examen en ese horario';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_ambiente_examen
BEFORE INSERT OR UPDATE OF id_ambiente, fecha_examen, hora_inicio, hora_fin
ON academico.examen
FOR EACH ROW
EXECUTE FUNCTION academico.validar_ambiente_examen();