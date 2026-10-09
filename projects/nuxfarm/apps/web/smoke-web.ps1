$ErrorActionPreference = "Continue"
$web = "http://localhost:3092"
$api = "http://localhost:3093"

$farm = (curl.exe -s "$api/farms") | ConvertFrom-Json
$farmId = $farm.data[0].id
Write-Host "Farm ID: $farmId"

$checks = @(
  @{ path = "/"; expect = "Dashboard" },
  @{ path = "/farms"; expect = "Riverside Demo Farm" },
  @{ path = "/farms/$farmId"; expect = "Locations" },
  @{ path = "/farms/$farmId/cycles"; expect = "Crop cycles" },
  @{ path = "/farms/$farmId/tasks"; expect = "Tasks" },
  @{ path = "/farms/$farmId/tasks?view=timeline"; expect = "Timeline" },
  @{ path = "/farms/$farmId/irrigation"; expect = "Irrigation" },
  @{ path = "/farms/$farmId/inventory"; expect = "Inventory" },
  @{ path = "/farms/$farmId/reports"; expect = "Reports" }
)

foreach ($c in $checks) {
  $html = curl.exe -s --max-time 20 "$web$($c.path)"
  $ok = $html -match [regex]::Escape($c.expect)
  $len = $html.Length
  $status = if ($ok) { "OK  " } else { "MISS" }
  Write-Host "$status $($c.path) ($len bytes, expect '$($c.expect)')"
  if (-not $ok -and $len -lt 3000) {
    Write-Host $html
  }
}

# Deep-link into the first cycle and first report.
$cycles = (curl.exe -s "$api/farms/$farmId/cycles") | ConvertFrom-Json
$cycleId = $cycles.data[0].id
$html = curl.exe -s --max-time 20 "$web/farms/$farmId/cycles/$cycleId"
Write-Host "$(if ($html -match 'Stage timeline') { 'OK  ' } else { 'MISS' }) /farms/$farmId/cycles/$cycleId (cycle detail)"

$reports = (curl.exe -s "$api/farms/$farmId/reports") | ConvertFrom-Json
if ($reports.data.Count -gt 0) {
  $reportId = $reports.data[0].id
  $html = curl.exe -s --max-time 20 "$web/farms/$farmId/reports/$reportId"
  Write-Host "$(if ($html -match 'Data') { 'OK  ' } else { 'MISS' }) /farms/$farmId/reports/$reportId (report detail)"
}
