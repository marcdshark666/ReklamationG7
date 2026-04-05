param(
  [string]$Token = $env:TELEGRAM_BOT_TOKEN
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $projectRoot ".venv\Scripts\python.exe"
$scriptPath = Join-Path $PSScriptRoot "telegram_bot.py"

if (-not (Test-Path -LiteralPath $pythonPath)) {
  throw "Python hittades inte i .venv. Installera med: .\.venv\Scripts\python.exe -m pip install -r .\requirements.txt"
}

if (-not (Test-Path -LiteralPath $scriptPath)) {
  throw "Telegram-skriptet hittades inte: $scriptPath"
}

if (-not $Token) {
  throw "Ingen Telegram-token hittades. Satt TELEGRAM_BOT_TOKEN eller skicka -Token direkt."
}

& $pythonPath $scriptPath --token $Token
exit $LASTEXITCODE
