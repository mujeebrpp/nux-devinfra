$ErrorActionPreference = "Continue"
Start-Transcript -Path "c:\dev\infrastructure\projects\nuxcafe\.db-setup2.log" -Force

Set-Location "c:\dev\infrastructure\projects\nuxcafe\apps\api"

Write-Output "=== Resetting dev database (fresh env: only leftover artifacts from a deleted migration) ==="
npx prisma migrate reset --force

Write-Output "=== Creating and applying the new init migration (dev) ==="
npx prisma migrate dev --name init

Write-Output "=== Generating the Prisma client ==="
npx prisma generate

Write-Output "=== Seeding the dev database ==="
npm run prisma:seed

Write-Output "=== Resetting + migrating the test database ==="
$env:DATABASE_URL = "postgresql://postgres:change-me@localhost:5433/nuxcafe_test"
npx prisma migrate reset --force
npx prisma migrate deploy

Write-Output "=== DB setup complete ==="
Stop-Transcript

