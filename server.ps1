param(
  [int]$Port = 8765
)

$ErrorActionPreference = "Stop"

function Write-JsonResponse {
  param(
    [System.Net.HttpListenerResponse]$Response,
    [object]$Payload,
    [int]$StatusCode = 200
  )

  $json = $Payload | ConvertTo-Json -Depth 8
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $Response.StatusCode = $StatusCode
  $Response.ContentType = "application/json; charset=utf-8"
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Response.OutputStream.Close()
}

function Write-FileResponse {
  param(
    [System.Net.HttpListenerResponse]$Response,
    [string]$Path,
    [string]$ContentType
  )

  $content = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
  $Response.StatusCode = 200
  $Response.ContentType = "$ContentType; charset=utf-8"
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Response.OutputStream.Close()
}

$root = $PSScriptRoot
$submitScript = Join-Path $root "scripts\submit-rubin.ps1"
$rpaScript = Join-Path $root "scripts\run-rubin-rpa.ps1"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Host ""
Write-Host "ReklamationG7-servern kör nu på http://localhost:$Port/"
Write-Host "Öppna adressen ovan i webbläsaren och tryck Ctrl+C här för att stoppa servern."
Write-Host ""

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $path = $request.Url.AbsolutePath

    try {
      switch ($path) {
        "/" {
          Write-FileResponse -Response $response -Path (Join-Path $root "index.html") -ContentType "text/html"
          continue
        }
        "/index.html" {
          Write-FileResponse -Response $response -Path (Join-Path $root "index.html") -ContentType "text/html"
          continue
        }
        "/styles.css" {
          Write-FileResponse -Response $response -Path (Join-Path $root "styles.css") -ContentType "text/css"
          continue
        }
        "/app.js" {
          Write-FileResponse -Response $response -Path (Join-Path $root "app.js") -ContentType "application/javascript"
          continue
        }
        "/api/health" {
          Write-JsonResponse -Response $response -Payload @{
            ok = $true
            port = $Port
            submitScript = (Test-Path $submitScript)
            pythonRpa = (Test-Path $rpaScript)
          }
          continue
        }
        "/api/submit-case" {
          if ($request.HttpMethod -ne "POST") {
            Write-JsonResponse -Response $response -Payload @{ success = $false; message = "Method not allowed." } -StatusCode 405
            continue
          }

          $reader = [System.IO.StreamReader]::new($request.InputStream, $request.ContentEncoding)
          $body = $reader.ReadToEnd()
          $reader.Close()

          $tempDir = Join-Path $root ".tmp"
          New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
          $caseFile = Join-Path $tempDir "case-export.json"
          Set-Content -LiteralPath $caseFile -Value $body -Encoding UTF8

          $result = $null
          $rpaRaw = $null
          $rpaError = $null

          if (Test-Path $rpaScript) {
            try {
              $rpaRaw = & powershell -ExecutionPolicy Bypass -File $rpaScript -CaseFile $caseFile -Submit -Headless
              if ($rpaRaw) {
                $result = $rpaRaw | ConvertFrom-Json
                if ($result.success -and $result.mode -eq "submit" -and $result.submitted -ne $true) {
                  $result = $null
                  $rpaError = "Python-RPA fyllde sidan men kunde inte bekrafta att reklamationen verkligen skickades."
                }
              }
            } catch {
              $rpaError = $_.Exception.Message
            }
          }

          if (-not $result -or -not $result.success) {
            $fallbackRaw = & powershell -ExecutionPolicy Bypass -File $submitScript -CaseFile $caseFile -AsJson
            $result = $fallbackRaw | ConvertFrom-Json
            $result | Add-Member -NotePropertyName automation -NotePropertyValue "powershell-direct-submit" -Force

            if ($rpaError) {
              $result | Add-Member -NotePropertyName pythonRpaError -NotePropertyValue $rpaError -Force
            } elseif ($rpaRaw) {
              $result | Add-Member -NotePropertyName pythonRpaResult -NotePropertyValue $rpaRaw -Force
            }
          } else {
            $result | Add-Member -NotePropertyName automation -NotePropertyValue "python-rpa" -Force
          }

          Write-JsonResponse -Response $response -Payload $result -StatusCode 200
          continue
        }
        default {
          Write-JsonResponse -Response $response -Payload @{ success = $false; message = "Not found." } -StatusCode 404
          continue
        }
      }
    } catch {
      Write-JsonResponse -Response $response -Payload @{
        success = $false
        message = $_.Exception.Message
      } -StatusCode 500
    }
  }
} finally {
  if ($listener.IsListening) {
    $listener.Stop()
  }
  $listener.Close()
}
