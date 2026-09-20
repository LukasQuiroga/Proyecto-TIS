# Proyecto-TIS

Proyecto para la consultoría de TIS: control de exámenes.

## Stack

- **Backend:** Java 21, Spring Boot 4.1.0 (Maven)
- **Base de datos:** PostgreSQL 15.10 (Docker Compose + Flyway)
- **Frontend:** por definir

## Requisitos

- Git
- Docker Desktop (abierto/corriendo)
- Java 21

## Puesta en marcha

1. Clonar e instalar el entorno local:

```powershell
git clone https://github.com/LukasQuiroga/Proyecto-TIS.git
cd Proyecto-TIS
Copy-Item .env.example .env   # config local (exampass/exampass)
```

2. Levantar PostgreSQL:

```powershell
docker compose up -d --wait
```

3. Levantar la aplicación (el wrapper descarga Maven automáticamente; Flyway crea el esquema al iniciarse):

```powershell
.\mvnw.cmd spring-boot:run    # macOS/Linux: ./mvnw spring-boot:run
```

> Si el puerto 8080 está ocupado: `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"`

4. Verificar la base de datos:

```powershell
docker exec exampass-postgres psql -U exampass -d exampass -c "\dt"
```

Tablas esperadas: `rol`, `usuario`, `log_actividad` y `flyway_schema_history`.

## Base de datos

- **Servidor:** contenedor `exampass-postgres` (puerto 5432), imagen `postgres:15.10`
- **BD / usuario / contraseña (por defecto):** `exampass` / `exampass` / `exampass` (configurable en `.env`)
- **Migraciones:** Flyway, scripts en `backend/src/main/resources/db/migration/`
  - `V1__init.sql` — esquema inicial (rol, usuario, log_actividad) + roles semilla (ADMINISTRADOR, DOCENTE, ESTUDIANTE)

## Convenciones

- Ramas por HU a partir de `develop` (ej. `HU04-RegistrosLogDeActividades`).
- Los cambios se integran en `develop`; no se trabaja directamente sobre `main`.