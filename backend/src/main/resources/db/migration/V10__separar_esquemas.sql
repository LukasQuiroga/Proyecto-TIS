CREATE SCHEMA IF NOT EXISTS seguridad;
CREATE SCHEMA IF NOT EXISTS academico;

ALTER TABLE public.rol SET SCHEMA seguridad;
ALTER TABLE public.usuario SET SCHEMA seguridad;
ALTER TABLE public.permiso SET SCHEMA seguridad;
ALTER TABLE public.rol_permiso SET SCHEMA seguridad;
ALTER TABLE public.recuperacion_contrasena SET SCHEMA seguridad;
ALTER TABLE public.log_actividad SET SCHEMA seguridad;

ALTER TABLE public.materia SET SCHEMA academico;
ALTER TABLE public.examen SET SCHEMA academico;
ALTER TABLE public.examen_estudiante SET SCHEMA academico;