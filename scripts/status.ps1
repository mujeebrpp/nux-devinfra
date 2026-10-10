$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

docker compose ps

function Get-EnvPort($name) {
    $line = Get-Content .env | Where-Object { $_ -match "^$name=" } | Select-Object -First 1
    if ($line) { return ($line -replace "^$name=", "").Trim() }
    return $null
}

$postgresPort = Get-EnvPort "POSTGRES_PORT"
$pgadminPort = Get-EnvPort "PGADMIN_PORT"
$mailpitUiPort = Get-EnvPort "MAILPIT_UI_PORT"

Write-Host ""
Write-Host "PostgreSQL : localhost:$postgresPort"
Write-Host "pgAdmin    : http://localhost:$pgadminPort"
Write-Host "Mailpit    : http://localhost:$mailpitUiPort"
