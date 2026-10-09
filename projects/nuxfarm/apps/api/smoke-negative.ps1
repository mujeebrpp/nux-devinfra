$ErrorActionPreference = "Continue"
$base = "http://localhost:3094"
$farm = (curl.exe -s "$base/farms") | ConvertFrom-Json
$farmId = $farm.data[0].id

# OUT exceeding stock must be rejected with 400 and leave stock unchanged.
$items = (curl.exe -s "$base/farms/$farmId/inventory") | ConvertFrom-Json
$substrate = $items.data | Where-Object { $_.sku -eq "SUBSTRATE-POTTING" }
Write-Host "Before: $($substrate.quantity) $($substrate.unit)"
$body = @{ type = "OUT"; quantity = 999; reference = "must fail" } | ConvertTo-Json
Set-Content -Path "post-body.json" -Value $body -NoNewline
$resp = curl.exe -s -w "`nHTTP_STATUS:%{http_code}" -X POST -H "Content-Type: application/json" --data "@post-body.json" "$base/farms/$farmId/inventory/$($substrate.id)/transactions"
Write-Host "=== POST inventory OUT 999 (expect 400) ==="
Write-Host ($resp -join "`n")

$after = (curl.exe -s "$base/farms/$farmId/inventory/$($substrate.id)") | ConvertFrom-Json
Write-Host "After: $($after.data.quantity) $($after.data.unit)"

# Zero-quantity transaction must be rejected by schema validation.
$body = @{ type = "ADJUST"; quantity = 0 } | ConvertTo-Json
Set-Content -Path "post-body.json" -Value $body -NoNewline
$resp = curl.exe -s -w "`nHTTP_STATUS:%{http_code}" -X POST -H "Content-Type: application/json" --data "@post-body.json" "$base/farms/$farmId/inventory/$($substrate.id)/transactions"
Write-Host "=== POST inventory ADJUST 0 (expect 400) ==="
Write-Host ($resp -join "`n")

# Invalid cycle create (bad UUID location) must return 400 with issues.
$body = @{ name = "x"; crop = "y"; locationId = "not-a-uuid"; startDate = "2026-10-10" } | ConvertTo-Json
Set-Content -Path "post-body.json" -Value $body -NoNewline
$resp = curl.exe -s -w "`nHTTP_STATUS:%{http_code}" -X POST -H "Content-Type: application/json" --data "@post-body.json" "$base/farms/$farmId/cycles"
Write-Host "=== POST cycles with bad locationId (expect 400) ==="
Write-Host ($resp -join "`n")
