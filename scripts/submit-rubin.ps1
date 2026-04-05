param(
  [Parameter(Mandatory = $true)]
  [string]$CaseFile,
  [switch]$AsJson
)

$ErrorActionPreference = "Stop"

function Get-Value {
  param(
    [object]$Object,
    [string]$Name
  )

  if ($null -eq $Object) {
    return ""
  }

  $property = $Object.PSObject.Properties[$Name]
  if ($null -eq $property) {
    return ""
  }

  return [string]$property.Value
}

function New-FieldData {
  param(
    [string]$Uuid,
    [int]$Index,
    [string]$Type,
    [string]$Label,
    [string]$Name,
    [object]$Value,
    [string]$ValueAsText = $null,
    [string]$FormattedValue = $null
  )

  $field = [ordered]@{
    value = $Value
    type = $Type
    label = $Label
    name = $Name
    include_in_submission = $true
    uuid = $Uuid
    index = $Index
    step = @{
      step_index = 0
    }
  }

  if ($null -ne $ValueAsText) {
    $field.value_as_text = $ValueAsText
  }

  if ($null -ne $FormattedValue) {
    $field.formattedValue = $FormattedValue
  }

  return $field
}

if (-not (Test-Path -LiteralPath $CaseFile)) {
  throw "Case-filen hittades inte: $CaseFile"
}

$case = Get-Content -LiteralPath $CaseFile -Raw | ConvertFrom-Json

$requestId = "reklamationg7-" + [guid]::NewGuid().ToString("N").Substring(0, 12)
$workDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sessionDir = Join-Path $workDir ".session"
New-Item -ItemType Directory -Force -Path $sessionDir | Out-Null

$cookieFile = Join-Path $sessionDir "cookies.txt"
$formFile = Join-Path $sessionDir "form.json"
$payloadFile = Join-Path $sessionDir "payload.json"
$responseFile = Join-Path $sessionDir "response.json"
$headerFile = Join-Path $sessionDir "response-headers.txt"

$jsonUrl = "https://rubinmedical.lime-forms.se/forms/nlCvHsnLaU7h4thf4stN/json?x_lime_forms_request_id=$requestId"
curl.exe -sS -c $cookieFile -b $cookieFile -H "Accept: application/json" $jsonUrl -o $formFile
$form = Get-Content -LiteralPath $formFile -Raw | ConvertFrom-Json

$xsrfRaw = ""
Get-Content -LiteralPath $cookieFile | ForEach-Object {
  if ($_ -match "XSRF-TOKEN\s+(\S+)$") {
    $script:xsrfRaw = $matches[1]
  }
}

if (-not $xsrfRaw) {
  throw "Kunde inte lasa XSRF-token fran cookie-filen."
}

$xsrf = [System.Uri]::UnescapeDataString($xsrfRaw)
$csrf = $form.form.csrf_token
$moduleUuid = "13ca66aa-0ac3-4bcf-9bad-0bb57bed6ce7"

$issueKey = Get-Value $case.caseData "case_issue"
$issueMap = @{
  "issue_applicator_stuck" = @{ value = "1109"; text = "Sensorn fastnade i applikatorn (G7)" }
  "issue_adhesive_loosened" = @{ value = "1186"; text = "Sensorhaftan lossnade i fortid fran huden (G7)" }
  "issue_stopped_values" = @{ value = "1143"; text = "Sensorn slutade visa varden (G7)" }
  "issue_sensor_error_11" = @{ value = "1091"; text = "Sensorfel 11 (G7)" }
  "issue_wrong_values" = @{ value = "1140"; text = "Sensorn visade felaktiga glukosvarden (G7)" }
  "issue_pairing_failed" = @{ value = "1139"; text = "Det gick inte att parkoppla sensorn (G7)" }
  "issue_other" = @{ value = "1043"; text = "Annat fel" }
  "Sensorn fastnade i applikatorn (G7)" = @{ value = "1109"; text = "Sensorn fastnade i applikatorn (G7)" }
  "Sensorhaftan lossnade i fortid fran huden (G7)" = @{ value = "1186"; text = "Sensorhaftan lossnade i fortid fran huden (G7)" }
  "Sensorn slutade visa varden (G7)" = @{ value = "1143"; text = "Sensorn slutade visa varden (G7)" }
  "Sensorfel 11 (G7)" = @{ value = "1091"; text = "Sensorfel 11 (G7)" }
  "Sensorn visade felaktiga glukosvarden (G7)" = @{ value = "1140"; text = "Sensorn visade felaktiga glukosvarden (G7)" }
  "Det gick inte att parkoppla sensorn (G7)" = @{ value = "1139"; text = "Det gick inte att parkoppla sensorn (G7)" }
  "Annat fel" = @{ value = "1043"; text = "Annat fel" }
}

$issueInfo = $issueMap[$issueKey]
if (-not $issueInfo) {
  $issueInfo = $issueMap["issue_other"]
}

$data = [ordered]@{}
$data["module-$moduleUuid`_part-0dc0230b-0f14-4b10-8ccf-1a74726bb107"] = New-FieldData "0dc0230b-0f14-4b10-8ccf-1a74726bb107" 3 "RadioButtonField" "Bekraftar Rubin-klistermarke pa sensorforpackningen" "logotyp_on_sensor" "Jag bekr\u00e4ftar att f\u00f6rpackningen till sensorn har ett klisterm\u00e4rke med Rubin Medicals logotyp p\u00e5 sig." "Jag bekr\u00e4ftar att f\u00f6rpackningen till sensorn har ett klisterm\u00e4rke med Rubin Medicals logotyp p\u00e5 sig." "Jag bekr\u00e4ftar att f\u00f6rpackningen till sensorn har ett klisterm\u00e4rke med Rubin Medicals logotyp p\u00e5 sig."
$data["module-$moduleUuid`_part-278941d1-a187-4a5c-8245-64f781c85359"] = New-FieldData "278941d1-a187-4a5c-8245-64f781c85359" 4 "SelectField" "Forfragan" "service" "Reklamation" "Reklamation" "Reklamation"
$data["module-$moduleUuid`_part-cec62f62-847e-4c54-9af5-4cce371e5733"] = New-FieldData "cec62f62-847e-4c54-9af5-4cce371e5733" 5 "TextField" "Pumpanvandarens namn" "name" (Get-Value $case.defaults "default_name") $null (Get-Value $case.defaults "default_name")
$data["module-$moduleUuid`_part-0ab1a153-afde-45cf-a892-64f3db94eecb"] = New-FieldData "0ab1a153-afde-45cf-a892-64f3db94eecb" 6 "TextField" "Eventuell malsman" "guardian" (Get-Value $case.defaults "default_guardian") $null (Get-Value $case.defaults "default_guardian")
$data["module-$moduleUuid`_part-e3482c36-3d94-4e22-af59-49ec6dd5b3af"] = New-FieldData "e3482c36-3d94-4e22-af59-49ec6dd5b3af" 7 "EmailField" "E-post" "email" (Get-Value $case.defaults "default_email") $null (Get-Value $case.defaults "default_email")
$data["module-$moduleUuid`_part-622a7cbe-a142-4732-8248-5034f3dddb60"] = New-FieldData "622a7cbe-a142-4732-8248-5034f3dddb60" 8 "TextField" "Mobilnummer" "phone" (Get-Value $case.defaults "default_phone") $null (Get-Value $case.defaults "default_phone")
$data["module-$moduleUuid`_part-b7d36311-db19-43d0-8831-ffaa63bd38ae"] = New-FieldData "b7d36311-db19-43d0-8831-ffaa63bd38ae" 9 "TextField" "Adress" "postaladdress" (Get-Value $case.defaults "default_address") $null (Get-Value $case.defaults "default_address")
$data["module-$moduleUuid`_part-e2436f41-2f9c-4d14-ba2f-ce62a5057445"] = New-FieldData "e2436f41-2f9c-4d14-ba2f-ce62a5057445" 10 "TextField" "Postnummer" "zipcode" (Get-Value $case.defaults "default_zipcode") $null (Get-Value $case.defaults "default_zipcode")
$data["module-$moduleUuid`_part-cde1b295-8c73-489d-9f24-df98c769fa9d"] = New-FieldData "cde1b295-8c73-489d-9f24-df98c769fa9d" 11 "TextField" "Stad" "city" (Get-Value $case.defaults "default_city") $null (Get-Value $case.defaults "default_city")
$serialValue = Get-Value $case.defaults "default_serialno"
$data["module-$moduleUuid`_part-0f2b7a0a-bcc3-41e5-9651-62da87ff770c"] = New-FieldData "0f2b7a0a-bcc3-41e5-9651-62da87ff770c" 12 "NumericField" "Serienummer Tandem insulinpump" "serialno" ([int64]($serialValue -replace "\D", "")) $null $serialValue
$data["module-$moduleUuid`_part-2d649b82-6bf2-4a26-be5b-78dbf009093e"] = New-FieldData "2d649b82-6bf2-4a26-be5b-78dbf009093e" 13 "TextField" "Klinik" "clinic" (Get-Value $case.defaults "default_clinic") $null (Get-Value $case.defaults "default_clinic")
$productText = Get-Value $case.defaults "default_product"
$productValue = if ($productText -eq "Dexcom G6 Sensor") { "1010" } else { "1050" }
$data["module-$moduleUuid`_part-dcffbb05-3ce1-4576-bb6e-ba5c887917bf"] = New-FieldData "dcffbb05-3ce1-4576-bb6e-ba5c887917bf" 14 "SelectField" "Produkt" "product" $productValue $productText $productText
$data["module-$moduleUuid`_part-b482eaa9-b517-409a-ab67-7ca051b8aad9"] = New-FieldData "b482eaa9-b517-409a-ab67-7ca051b8aad9" 15 "TextField" "Sensorns LOT nummer" "lot_number" (Get-Value $case.caseData "case_lot_number") $null (Get-Value $case.caseData "case_lot_number")
$data["module-$moduleUuid`_part-0e48c655-cf04-4422-aa6b-cd0d2a8efc55"] = New-FieldData "0e48c655-cf04-4422-aa6b-cd0d2a8efc55" 16 "DateField" "Utgangsdatum sensor" "end_date" (Get-Value $case.caseData "case_end_date") $null (Get-Value $case.caseData "case_end_date")
$data["module-$moduleUuid`_part-415bbadd-676a-41fa-a4d3-2c5b0b6661d0"] = New-FieldData "415bbadd-676a-41fa-a4d3-2c5b0b6661d0" 17 "DateField" "Insattningsdatum" "insert_date" (Get-Value $case.caseData "case_insert_date") $null (Get-Value $case.caseData "case_insert_date")
$data["module-$moduleUuid`_part-87029287-1921-4e19-8bf5-098b202e84b9"] = New-FieldData "87029287-1921-4e19-8bf5-098b202e84b9" 18 "DateField" "Datum da sensorn felade" "error_date" (Get-Value $case.caseData "case_error_date") $null (Get-Value $case.caseData "case_error_date")
$data["module-$moduleUuid`_part-356b5043-ed4a-4f76-b88f-49f72fb0b34b"] = New-FieldData "356b5043-ed4a-4f76-b88f-49f72fb0b34b" 19 "TextField" "Placering" "placement" (Get-Value $case.caseData "case_placement") $null (Get-Value $case.caseData "case_placement")
$data["module-$moduleUuid`_part-88d15c06-1852-49b5-ad2a-3fec035e5674"] = New-FieldData "88d15c06-1852-49b5-ad2a-3fec035e5674" 21 "SelectField" "Vilket fel upplevde ni med G7 sensorn?" "issue" $issueInfo.value $issueInfo.text $issueInfo.text
$data["module-$moduleUuid`_part-50f865cb-5af3-48f0-bc2c-5e6fe8dec114"] = New-FieldData "50f865cb-5af3-48f0-bc2c-5e6fe8dec114" 24 "TextField" "Vilket felmeddelande fick ni i Tandem insulinpump?" "error_message" (Get-Value $case.caseData "case_error_message") $null (Get-Value $case.caseData "case_error_message")
$cleanText = Get-Value $case.defaults "default_clean_insertion"
$data["module-$moduleUuid`_part-fe306382-3b4a-462b-a496-4b1eb06e8dda"] = New-FieldData "fe306382-3b4a-462b-a496-4b1eb06e8dda" 25 "RadioButtonField" "Rengjorde du insticksstallet med en spritsudd?" "clean_insertion" $cleanText $cleanText $cleanText
$data["module-$moduleUuid`_part-54cc9ef4-2e7f-45d4-9c8e-84d897deb703"] = New-FieldData "54cc9ef4-2e7f-45d4-9c8e-84d897deb703" 26 "TextField" "Under hur lang tid saknades sensorvarden innan ni tog bort sensorn?" "missing_values" (Get-Value $case.caseData "case_missing_values") $null (Get-Value $case.caseData "case_missing_values")
$data["module-$moduleUuid`_part-a0ca1f85-931c-419e-958f-cca93bc9dd5c"] = New-FieldData "a0ca1f85-931c-419e-958f-cca93bc9dd5c" 33 "RadioButtonField" "Informationen i reklamationsforfragan" "correct_information" "Jag forsakrar att alla uppgifter ar korrekta och sanningsenliga." "Jag forsakrar att alla uppgifter ar korrekta och sanningsenliga." "Jag forsakrar att alla uppgifter ar korrekta och sanningsenliga."
$data["xLimeFormsRequestId"] = $requestId

$payload = [ordered]@{
  data = $data
  captchaToken = $null
}

$payload | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $payloadFile -Encoding utf8

$status = curl.exe -sS `
  -o $responseFile `
  -D $headerFile `
  -w "%{http_code}" `
  -b $cookieFile `
  -c $cookieFile `
  -H "Accept: application/json" `
  -H "Content-Type: application/json" `
  -H "Origin: https://rubinmedical.lime-forms.se" `
  -H "Referer: https://rubinmedical.lime-forms.se/forms/nlCvHsnLaU7h4thf4stN" `
  -H "User-Agent: Mozilla/5.0" `
  -H "X-Requested-With: XMLHttpRequest" `
  -H "X-XSRF-TOKEN: $xsrf" `
  -H "X-CSRF-TOKEN: $csrf" `
  --data-binary "@$payloadFile" `
  "https://rubinmedical.lime-forms.se/forms/nlCvHsnLaU7h4thf4stN"

$result = [ordered]@{
  success = ([int]$status -ge 200 -and [int]$status -lt 300)
  httpStatus = [int]$status
  response = (Get-Content -LiteralPath $responseFile -Raw)
  headers = (Get-Content -LiteralPath $headerFile -Raw)
  sessionDir = $sessionDir
}

if ($AsJson) {
  $result | ConvertTo-Json -Depth 8
} else {
  Write-Host "HTTP-status: $($result.httpStatus)"
  Write-Host ""
  Write-Host "Svar fran Rubin Medical:"
  Write-Host $result.response
}
