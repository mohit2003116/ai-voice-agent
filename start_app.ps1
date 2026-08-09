$ErrorActionPreference = "Stop"

function Test-CommandExists {
  param([string]$CommandName)

  return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

if (-not (Test-CommandExists "uv")) {
  Write-Error "Missing required command: uv"
}

if (-not (Test-CommandExists "pnpm")) {
  Write-Error "Missing required command: pnpm"
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start each service in its own PowerShell window so logs remain visible.
$localLiveKit = Join-Path $repoRoot "livekit-server.exe"
if (Test-CommandExists "livekit-server") {
  Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location '$repoRoot'; livekit-server --dev"
} elseif (Test-Path $localLiveKit) {
  Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location '$repoRoot'; .\livekit-server.exe --dev"
} else {
  Write-Warning "livekit-server was not found. Skipping local LiveKit startup and using your configured LIVEKIT_URL instead."
}

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location '$repoRoot\backend'; uv run python src/agent.py dev"
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", "Set-Location '$repoRoot\frontend'; pnpm dev"

Write-Host "Started backend and frontend in separate PowerShell windows."
