ALTER TABLE academico.facultad
    ADD COLUMN plan_de_estudios VARCHAR(10) NOT NULL DEFAULT 'SEMESTRAL';

ALTER TABLE academico.facultad
    ADD CONSTRAINT chk_facultad_plan_de_estudios
        CHECK (
            plan_de_estudios IN ('SEMESTRAL', 'ANUAL')
        );

UPDATE academico.facultad
   SET plan_de_estudios = 'ANUAL'
 WHERE codigo IN ('FCM', 'FAyCH');
