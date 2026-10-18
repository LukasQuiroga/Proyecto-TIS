-- HU09: Actualiza tipos de evaluacion del examen
-- Reemplaza PARCIAL por PRIMER_PARCIAL/SEGUNDO_PARCIAL y RECUPERATORIO por ESTANCIA.

ALTER TABLE academico.examen
    DROP CONSTRAINT chk_examen_tipo_evaluacion;


UPDATE academico.examen
    SET tipo_evaluacion = 'PRIMER_PARCIAL'
    WHERE tipo_evaluacion = 'PARCIAL';


UPDATE academico.examen
    SET tipo_evaluacion = 'ESTANCIA'
    WHERE tipo_evaluacion = 'RECUPERATORIO';


ALTER TABLE academico.examen
    ADD CONSTRAINT chk_examen_tipo_evaluacion
        CHECK (
            tipo_evaluacion IN (
                'PRIMER_PARCIAL',
                'SEGUNDO_PARCIAL',
                'FINAL',
                'PRACTICO',
                'ESTANCIA'
            )
        );
