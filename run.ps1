# Levanta el backend cargando las variables del .env (PostgreSQL local o Neon).
# Uso: .\run.ps1 [opciones de spring-boot:run]

$envFile = Join-Path $PSScriptRoot ".env"

if (Test-Path $envFile) {

    foreach ($line in Get-Content $envFile) {

        if ($line -match '^\s*([^#][^=]*)=(.*)$') {

            $nombre = $matches[1].Trim()
            $valor = $matches[2].Trim()

            [Environment]::SetEnvironmentVariable(
                $nombre,
                $valor
            )
        }
    }
}

& ".\mvnw.cmd" spring-boot:run @args