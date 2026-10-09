$ErrorActionPreference = "Continue"
$base = "http://localhost:3093"
$endpoints = @(
  "/health/live",
  "/health/ready",
  "/farms",
  "/users",
  "/farms?includeInactive=true"
)
foreach ($ep in $endpoints) {
  $url = $base + $ep
  $resp = curl.exe -s -w "`nHTTP_STATUS:%{http_code}" $url
  Write-Host "=== GET $url ==="
  Write-Host $resp
  Write-Host ""
}
