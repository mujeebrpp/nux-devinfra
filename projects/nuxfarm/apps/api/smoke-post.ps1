$ErrorActionPreference = "Continue"
$port = if ($env:API_PORT) { $env:API_PORT } else { "3094" }
$base = "http://localhost:$port"
$farm = (curl.exe -s "$base/farms") | ConvertFrom-Json
$farmId = $farm.data[0].id
Write-Host "Farm ID: $farmId"

$today = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.000Z")

# Task creation body written to a file so quoting is preserved.
$taskBody = @{
  title = "API smoke test task"
  category = "Cultivation"
  status = "TODO"
  priority = "MEDIUM"
  dueDate = $today
} | ConvertTo-Json
Set-Content -Path "post-body.json" -Value $taskBody -NoNewline

$resp = curl.exe -s -w "`nHTTP_STATUS:%{http_code}" -X POST -H "Content-Type: application/json" --data "@post-body.json" "$base/farms/$farmId/tasks"
Write-Host "=== POST /farms/$farmId/tasks ==="
Write-Host ($resp -join "`n")
Write-Host ""

foreach ($t in @("OPERATIONS_OVERVIEW","CROP_CYCLE_SUMMARY","TASK_SUMMARY","IRRIGATION_SUMMARY","INVENTORY_SUMMARY")) {
  $body = @{ type = $t; title = "Smoke $t" } | ConvertTo-Json
  Set-Content -Path "post-body.json" -Value $body -NoNewline
  $resp = curl.exe -s -w "`nHTTP_STATUS:%{http_code}" -X POST -H "Content-Type: application/json" --data "@post-body.json" "$base/farms/$farmId/reports/generate"
  Write-Host "=== POST /farms/$farmId/reports/generate ($t) ==="
  Write-Host ($resp -join "`n")
  Write-Host ""
}

# Inventory transaction: OUT of substrate.
$txBody = @{ type = "OUT"; quantity = 2; reference = "Smoke test usage" } | ConvertTo-Json
Set-Content -Path "post-body.json" -Value $txBody -NoNewline
$items = (curl.exe -s "$base/farms/$farmId/inventory") | ConvertFrom-Json
$substrate = $items.data | Where-Object { $_.sku -eq "SUBSTRATE-POTTING" }
$resp = curl.exe -s -w "`nHTTP_STATUS:%{http_code}" -X POST -H "Content-Type: application/json" --data "@post-body.json" "$base/farms/$farmId/inventory/$($substrate.id)/transactions"
Write-Host "=== POST inventory OUT transaction ==="
Write-Host ($resp -join "`n")
Write-Host ""

# Irrigation log creation.
$logBody = @{
  method = "MANUAL"
  irrigatedAt = $today
  durationMinutes = 10
  volumeLiters = 80
  notes = "Smoke test log"
} | ConvertTo-Json
Set-Content -Path "post-body.json" -Value $logBody -NoNewline
$resp = curl.exe -s -w "`nHTTP_STATUS:%{http_code}" -X POST -H "Content-Type: application/json" --data "@post-body.json" "$base/farms/$farmId/irrigation"
Write-Host "=== POST /farms/$farmId/irrigation ==="
Write-Host ($resp -join "`n")
