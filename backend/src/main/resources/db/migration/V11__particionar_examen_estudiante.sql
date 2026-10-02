DROP TABLE IF EXISTS academico.examen_estudiante;

CREATE TABLE academico.examen_estudiante (
    id_examen     BIGINT NOT NULL REFERENCES academico.examen (id_examen),
    id_estudiante BIGINT NOT NULL REFERENCES seguridad.usuario (id_usuario),
    PRIMARY KEY (id_examen, id_estudiante)
) PARTITION BY HASH (id_estudiante);

CREATE TABLE academico.examen_estudiante_p0 PARTITION OF academico.examen_estudiante
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE academico.examen_estudiante_p1 PARTITION OF academico.examen_estudiante
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE academico.examen_estudiante_p2 PARTITION OF academico.examen_estudiante
    FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE academico.examen_estudiante_p3 PARTITION OF academico.examen_estudiante
    FOR VALUES WITH (MODULUS 4, REMAINDER 3);

CREATE INDEX idx_examen_estudiante ON academico.examen_estudiante (id_estudiante);