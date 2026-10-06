$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "WARNING: This deletes ALL local PostgreSQL and pgAdmin data." -ForegroundColor Yellow
$confirmation = Read-Host "Type RESET to continue"

if ($confirmation -ne "RESET") {
    Write-Host "Reset cancelled."
    exit 0
}

docker compose down -v
docker compose up -d

Write-Host ""
Write-Host "Local infrastructure reset complete."
docker compose ps
