$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

docker compose ps

Write-Host ""
Write-Host "PostgreSQL : localhost:5432"
Write-Host "pgAdmin    : http://localhost:5050"
Write-Host "Mailpit    : http://localhost:8025"
