-- HU09 (base): eliminar la redundancia entre nombre_asignatura y nombre_materia.
-- La materia pasa a referenciar siempre a una asignatura (id_asignatura NOT NULL)
-- y el nombre se obtiene por join. Se refuerza la unicidad.

-- 1) Crear asignaturas faltantes a partir de los nombres de materia sin asignatura.
INSERT INTO academico.asignatura (
    codigo_asignatura,
    nombre_asignatura,
    semestre,
    activo
)
SELECT
    'GEN-' || LPAD(g.id_referencia::text, 4, '0'),
    g.nombre,
    1,
    TRUE
FROM (
    SELECT
        LOWER(TRIM(m.nombre_materia)) AS clave,
        MIN(m.id_materia)             AS id_referencia,
        MIN(TRIM(m.nombre_materia))   AS nombre
    FROM academico.materia m
    WHERE m.id_asignatura IS NULL
    GROUP BY LOWER(TRIM(m.nombre_materia))
) g
WHERE NOT EXISTS (
    SELECT 1
    FROM academico.asignatura a
    WHERE LOWER(TRIM(a.nombre_asignatura)) = g.clave
);


-- 2) Enlazar cada materia con su asignatura por nombre normalizado.
UPDATE academico.materia m
SET id_asignatura = a.id_asignatura
FROM academico.asignatura a
WHERE m.id_asignatura IS NULL
  AND LOWER(TRIM(a.nombre_asignatura)) = LOWER(TRIM(m.nombre_materia));


-- 3) id_asignatura obligatorio (la materia siempre pertenece a una asignatura).
ALTER TABLE academico.materia
    ALTER COLUMN id_asignatura SET NOT NULL;


-- 4) Nueva unicidad: una oferta por (asignatura, grupo).
DROP INDEX IF EXISTS academico.idx_materia_nombre_grupo;

CREATE UNIQUE INDEX uq_materia_asignatura_grupo
    ON academico.materia (id_asignatura, grupo);


-- 5) Unicidad del nombre de asignatura (normalizado, sin mayusculas ni espacios externos).
CREATE UNIQUE INDEX uq_asignatura_nombre
    ON academico.asignatura (LOWER(TRIM(nombre_asignatura)));


-- 6) Quitar la columna redundante.
ALTER TABLE academico.materia
    DROP COLUMN nombre_materia;
