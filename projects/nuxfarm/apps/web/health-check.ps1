$ErrorActionPreference = "Continue"
$checks = @(
  @{ url = "http://localhost:3094/health/live";  label = "API new (3094) /health/live" },
  @{ url = "http://localhost:3094/health/ready"; label = "API new (3094) /health/ready" },
  @{ url = "http://localhost:3093/farms";    label = "API old (3093) /farms" },
  @{ url = "http://localhost:3094/farms";    label = "API new (3094) /farms" },
  @{ url = "http://localhost:3092/";         label = "Web  (3092) /" },
  @{ url = "http://localhost:3092/farms";    label = "Web  (3092) /farms" }
)
foreach ($c in $checks) {
  try {
    $r = Invoke-WebRequest -Uri $c.url -UseBasicParsing -TimeoutSec 8
    Write-Host ("{0}: HTTP {1} ({2} bytes)" -f $c.label, $r.StatusCode, $r.Content.Length)
  } catch {
    Write-Host ("{0}: FAILED - {1}" -f $c.label, $_.Exception.Message)
  }
}
