ALTER TABLE examen
    ADD COLUMN id_auxiliar BIGINT REFERENCES usuario (id_usuario);

CREATE INDEX idx_examen_auxiliar ON examen (id_auxiliar);