$ErrorActionPreference = "Continue"
$env:DATABASE_URL = "postgresql://postgres:change-me@localhost:5433/nuxfarm_dev"
Set-Location $PSScriptRoot
npx prisma migrate dev --name init
Write-Host "MIGRATE_EXIT=$LASTEXITCODE"
