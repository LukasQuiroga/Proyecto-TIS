# Proyecto-TIS

Proyecto para la consultoría de TIS: control de exámenes.

## Stack

- **Backend:** Java 21, Spring Boot 4.1.0 (Maven), Spring Security + JWT
- **Base de datos:** PostgreSQL en la nube (Neon) + Flyway
- **Frontend:** React 19, Vite 8, JavaScript, Axios, React Router

## Requisitos

- Git
- Docker Desktop (abierto/corriendo)
- Java 21
- Node.js + pnpm (desarrollo local del frontend)

## Configuración

Copia el archivo de ejemplo y completa las credenciales de Neon, Brevo y el secreto JWT:

```powershell
Copy-Item .env.example .env
```

Variables principales en `.env`:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE` — conexión a Neon
- `BREVO_API_KEY` — envío de correos
- `JWT_SECRET` — clave para firmar los tokens JWT
- `BACKEND_PORT`, `FRONTEND_PORT` — puertos publicados por Docker Compose

> El `.env` está ignorado por git; no se suben credenciales al repositorio.

## Puesta en marcha con Docker (todo el stack)

Con Docker Desktop corriendo:

```powershell
docker compose up -d --build
```

- Frontend: http://localhost (puerto configurable con `FRONTEND_PORT`)
- Backend: http://localhost:8080 (puerto configurable con `BACKEND_PORT`)
- El backend conecta a Neon usando las variables del `.env`.
- El frontend (nginx) sirve la SPA y hace proxy de `/api` hacia el backend.

Para detener:

```powershell
docker compose down
```

## Puesta en marcha local (sin Docker)

1. Clonar e instalar el entorno local:

```powershell
git clone https://github.com/LukasQuiroga/Proyecto-TIS.git
cd Proyecto-TIS
Copy-Item .env.example .env
```

2. Levantar el backend (el wrapper descarga Maven; Flyway crea/actualiza el esquema en Neon):

```powershell
.\run.ps1
# o: .\mvnw.cmd spring-boot:run
```

> Si el puerto 8080 está ocupado: `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"`

3. Frontend (en otra terminal):

```powershell
Set-Location frontend
pnpm install
pnpm dev   # http://localhost:5173, proxy de /api a localhost:8080
```

## Base de datos (Neon)

- **Motor:** PostgreSQL en la nube (Neon). La conexión se configura en `.env` (`DB_*`).
- **Esquemas:** `seguridad` y `academico`.
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
  - `V12__usuario_facultad.sql`
  - `V13__crear_token_sesion.sql`

Flyway ejecuta automáticamente las migraciones pendientes al iniciar el backend.

### Connection string de Neon

```text
postgresql://usuario:CONTRASENA@ep-xxxx-yyyy-0000.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> Las credenciales van en el `.env` y no se suben al repositorio. El pooler de Neon requiere `DB_SSLMODE=require`.

## Convenciones

- Ramas por HU a partir de `develop` (ej. `HU04-RegistrosLogDeActividades`).
- Los cambios se integran en `develop`; no se trabaja directamente sobre `main`.
