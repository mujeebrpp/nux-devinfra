$ErrorActionPreference = "Continue"
$base = "http://localhost:3093"

$farm = (curl.exe -s "$base/farms") | ConvertFrom-Json
$farmId = $farm.data[0].id
Write-Host "Farm ID: $farmId"

function Show-Get($path) {
  $url = $base + $path
  $resp = curl.exe -s -w "`nHTTP_STATUS:%{http_code}" $url
  Write-Host "=== GET $path ==="
  Write-Host ($resp -join "`n")
  Write-Host ""
}

function Show-Post($path, $body) {
  $url = $base + $path
  $resp = curl.exe -s -w "`nHTTP_STATUS:%{http_code}" -X POST -H "Content-Type: application/json" -d $body $url
  Write-Host "=== POST $path ==="
  Write-Host ($resp -join "`n")
  Write-Host ""
}

Show-Get "/farms/$farmId"
Show-Get "/farms/$farmId/locations"
Show-Get "/farms/$farmId/cycles"
Show-Get "/farms/$farmId/tasks"
Show-Get "/farms/$farmId/tasks/timeline"
Show-Get "/farms/$farmId/irrigation"
Show-Get "/farms/$farmId/irrigation/summary"
Show-Get "/farms/$farmId/inventory"
Show-Get "/farms/$farmId/inventory/low-stock"
Show-Get "/farms/$farmId/reports"

# Validation error path: bad UUID must return 400 with the wrapped error shape.
Show-Get "/farms/not-a-uuid"

# Create a task through the API.
$today = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.000Z")
$taskBody = @"
{"title":"API smoke test task","category":"Cultivation","status":"TODO","priority":"MEDIUM","dueDate":"$today"}
"@
Show-Post "/farms/$farmId/tasks" $taskBody

# Generate each report type through the API.
$types = @("OPERATIONS_OVERVIEW","CROP_CYCLE_SUMMARY","TASK_SUMMARY","IRRIGATION_SUMMARY","INVENTORY_SUMMARY")
foreach ($t in $types) {
  $body = @"
{"type":"$t","title":"Smoke $t"}
"@
  Show-Post "/farms/$farmId/reports/generate" $body
}
