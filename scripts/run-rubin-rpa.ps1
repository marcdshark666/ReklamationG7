param(
  [Parameter(Mandatory = $true)]
  [string]$CaseFile,
  [switch]$Submit,
  [switch]$Headless,
  [ValidateSet("edge", "chrome")]
  [string]$Browser = "edge"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $projectRoot ".venv\Scripts\python.exe"
$scriptPath = Join-Path $PSScriptRoot "rubin_rpa.py"

if (-not (Test-Path -LiteralPath $pythonPath)) {
  throw "Python hittades inte i .venv. Installera med: .\.venv\Scripts\python.exe -m pip install -r .\requirements.txt"
}

if (-not (Test-Path -LiteralPath $scriptPath)) {
  throw "RPA-skriptet hittades inte: $scriptPath"
}

$arguments = @(
  $scriptPath
  "--case-file"
  $CaseFile
  "--browser"
  $Browser
)

if ($Submit) {
  $arguments += "--submit"
}

if ($Headless) {
  $arguments += "--headless"
}

& $pythonPath @arguments
exit $LASTEXITCODE
