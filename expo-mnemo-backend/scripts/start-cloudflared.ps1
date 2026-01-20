param(
  [string]$Port = "3000"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$cloudflared = Join-Path $repoRoot "tools\\cloudflared\\cloudflared.exe"

if (-not (Test-Path $cloudflared)) {
  Write-Host "cloudflared not found at $cloudflared"
  Write-Host "Download it first: tools\\cloudflared\\cloudflared.exe"
  exit 1
}

Write-Host "Starting Cloudflare quick tunnel to http://localhost:$Port"
Write-Host "Look for the URL that starts with https:// and update EXPO_PUBLIC_API_URL"

& $cloudflared tunnel --url "http://localhost:$Port"
