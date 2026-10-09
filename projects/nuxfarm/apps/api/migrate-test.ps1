$ErrorActionPreference = "Continue"
# Apply pending Prisma migrations to the shared test database.
$env:DATABASE_URL = "postgresql://postgres:change-me@localhost:5433/nuxfarm_test"
Set-Location $PSScriptRoot
npx prisma migrate deploy
Write-Host "MIGRATE_EXIT=$LASTEXITCODE"
