-- HU09: Ventana "Registrar examen"
-- Agrega codigo, estado y descripcion al examen y permite almacenar el
-- registro sin capturar todavia la programacion (fecha, hora y aula),
-- que se completara en la etapa de programacion/habilitaciones.

ALTER TABLE academico.examen
    ADD COLUMN codigo VARCHAR(30);

ALTER TABLE academico.examen
    ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO';

ALTER TABLE academico.examen
    ADD COLUMN descripcion VARCHAR(500);

ALTER TABLE academico.examen
    ADD CONSTRAINT chk_examen_estado
        CHECK (
            estado IN (
                'ACTIVO',
                'PROGRAMADO',
                'EN_PREPARACION',
                'INACTIVO'
            )
        );

CREATE UNIQUE INDEX uq_examen_codigo
    ON academico.examen (UPPER(TRIM(codigo)));

ALTER TABLE academico.examen
    ALTER COLUMN fecha_examen DROP NOT NULL,
    ALTER COLUMN hora_inicio DROP NOT NULL,
    ALTER COLUMN hora_fin DROP NOT NULL,
    ALTER COLUMN aula DROP NOT NULL;
