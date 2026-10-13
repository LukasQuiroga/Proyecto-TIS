-- HU09: Registrar examenes
-- Agrega tipo de evaluacion y gestion/periodo academico al examen.

ALTER TABLE academico.examen
    ADD COLUMN tipo_evaluacion VARCHAR(30) NOT NULL;


ALTER TABLE academico.examen
    ADD COLUMN gestion VARCHAR(20) NOT NULL;


ALTER TABLE academico.examen
    ADD CONSTRAINT chk_examen_tipo_evaluacion
        CHECK (
            tipo_evaluacion IN (
                'PARCIAL',
                'FINAL',
                'PRACTICO',
                'RECUPERATORIO'
            )
        );


ALTER TABLE academico.examen
    ADD CONSTRAINT chk_examen_gestion
        CHECK (
            LENGTH(TRIM(gestion)) > 0
        );
