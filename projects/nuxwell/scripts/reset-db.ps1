<#
.SYNOPSIS
  Resets the NuxWell development database and re-seeds it.

.DESCRIPTION
  Replays all migrations against nuxwell_dev (dropping local
  changes) and re-runs the seed script. Development data only -
  automated tests never use this script (they use nuxwell_test
  via Jest global setup).

.EXAMPLE
  ./scripts/reset-db.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$apiDir = Join-Path $projectRoot "apps" "api"

if (-not (Test-Path (Join-Path $projectRoot ".env.local"))) {
  Write-Error "Missing .env.local. Copy .env.local.example to .env.local first."
  exit 1
}

# Load DATABASE_URL from the project env contract.
$envFile = Get-Content (Join-Path $projectRoot ".env.local")
foreach ($line in $envFile) {
  if ($line -match "^\s*DATABASE_URL=(.+)$") {
    $env:DATABASE_URL = $Matches[1].Trim()
  }
}

if (-not $env:DATABASE_URL) {
  Write-Error "DATABASE_URL not found in .env.local"
  exit 1
}

$dbName = ([System.Uri]$env:DATABASE_URL).Segments[-1].TrimEnd("/")
if (-not $dbName.EndsWith("_dev")) {
  Write-Warning "DATABASE_URL points at '$dbName' - this script resets development databases only."
  $answer = Read-Host "Continue? (y/N)"
  if ($answer -ne "y") { exit 0 }
}

Write-Host "Resetting NuxWell development database '$dbName'..." -ForegroundColor Cyan
Set-Location $apiDir
npx prisma migrate reset --force
Write-Host "Re-seeding development data..." -ForegroundColor Cyan
npx tsx prisma/seed.ts
Write-Host "Done. Development database '$dbName' is migrated and seeded." -ForegroundColor Green
