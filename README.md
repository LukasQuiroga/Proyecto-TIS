# Proyecto-TIS

Proyecto para la consultoría de TIS: control de exámenes.

## Stack

- **Backend:** Java 21, Spring Boot 4.1.0 (Maven)
- **Base de datos:** PostgreSQL 15.10 (Docker Compose + Flyway)
- **Frontend:** React 19, Vite 8, JavaScript, Axios, React Router

## Requisitos

- Git
- Docker Desktop (abierto/corriendo)
- Java 21
- Node.js
- pnpm

## Puesta en marcha

1. Clonar e instalar el entorno local:

```powershell
git clone https://github.com/LukasQuiroga/Proyecto-TIS.git
cd Proyecto-TIS
Copy-Item .env.example .env
```

2. Levantar PostgreSQL:

```powershell
docker compose up -d --wait
```

3. Levantar el backend:

```powershell
.\mvnw.cmd spring-boot:run
```

En macOS/Linux:

```bash
./mvnw spring-boot:run
```

> Si el puerto 8080 está ocupado: `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"`

4. Levantar el frontend en otra terminal:

```powershell
cd frontend
pnpm install
pnpm dev
```

El frontend se ejecuta normalmente en:

```text
http://localhost:5173
```

5. Verificar la base de datos:

```powershell
docker exec exampass-postgres psql -U exampass -d exampass -c "\dt seguridad.*"
docker exec exampass-postgres psql -U exampass -d exampass -c "\dt academico.*"
```

Las tablas del proyecto están organizadas principalmente en los esquemas `seguridad` y `academico`.

## Base de datos

- **Servidor:** contenedor `exampass-postgres` (puerto 5432), imagen `postgres:15.10`
- **BD / usuario / contraseña (por defecto):** `exampass` / `exampass` / `exampass` (configurable en `.env`)
- **Migraciones:** Flyway, scripts en `backend/src/main/resources/db/migration/`
  - `V1__init.sql`
  - `V2__log_actividad_exitosa.sql`
  - `V3__crear_permisos.sql`
  - `V4__recuperacion_contrasena.sql`
  - `V5__actualizar_permisos_modulos.sql`
  - `V6__eliminar_permiso_estudiantes.sql`
  - `V7__materia_examen_examen_estudiante.sql`
  - `V8__examen_auxiliar.sql`
  - `V9__examen_aula.sql`
  - `V10__separar_esquemas.sql`
  - `V11__particionar_examen_estudiante.sql`

Flyway ejecuta automáticamente las migraciones pendientes al iniciar el backend.

## Base de datos en la nube (Neon)

Para que todo el equipo comparta una misma base de datos:

1. Crear un proyecto en [Neon](https://neon.tech) y copiar el **connection string**:

```text
postgresql://usuario:CONTRASENA@ep-xxxx-yyyy-0000.us-east-2.aws.neon.tech/neondb?sslmode=require
```

2. Copiar `.env.cloud.example` → `.env` y rellenar `DB_HOST`, `DB_USER`, `DB_PASSWORD` y los demás datos correspondientes.

3. Levantar la aplicación con:

```powershell
.\run.ps1
```

`run.ps1` carga el `.env` y arranca Spring Boot; Flyway crea o actualiza el esquema.

> Las credenciales van en el `.env` y no se suben al repositorio.

> Para usar PostgreSQL local con Docker en lugar de Neon, configurar nuevamente las variables `DB_*` con los valores locales y levantar con `.\mvnw.cmd spring-boot:run`.

## Convenciones

- Ramas por HU a partir de `develop` (ej. `HU04-RegistrosLogDeActividades`).
- Los cambios se integran en `develop`; no se trabaja directamente sobre `main`.