# ReklamationG7

En fristaende webbapp for att samla in Dexcom G7-reklamationer till Rubin Medical, spara standarduppgifter och exportera arenden som JSON. Repo:t innehaller ocksa ett PowerShell-skript som forsoker skicka samma data till Rubin Medicals Lime Forms-endpoint.

## Vad som finns har

- `index.html` - webbappen
- `styles.css` - stil
- `app.js` - logik for defaults, arendeformular, bildpreview och export/import
- `scripts/submit-rubin.ps1` - PowerShell-spar for att skicka ett exporterat JSON-arende till Rubin Medical

## Rekommenderat arbetssatt

1. Oppna `index.html` i webblasaren.
2. Fyll i dina standarduppgifter en gang.
3. Lagg in arendespecifik information och valfria bilder.
4. Kontrollera "Rubin-preview".
5. Exportera arendet till JSON.
6. Kor `scripts/submit-rubin.ps1` med den exporterade JSON-filen om du vill prova automatisk submit.

## Lokal anvandning

Du kan oppna webbappen direkt genom att dubbelklicka pa `index.html`.

## PowerShell-submit

Exempel:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\submit-rubin.ps1 -CaseFile .\case-export.json
```

Skriptet:

- hamtar aktuell formkonfiguration fran Rubin Medicals Lime Forms
- bygger en payload for G7-sensorreklamation
- forsoker skicka in arendet
- skriver ut HTTP-status och serversvar

Observera att Rubin Medicals backend kan andras over tid. Om endpointen eller CSRF-flodet andras kan skriptet behova uppdateras.

## Varfor inte UiPath eller Blue Prism har?

Den praktiska jamforelsen for just detta repo blev:

- `UiPath`: stark for storre RPA-floden, men inte tillganglig som direkt `winget`-paket pa den har datorn i vart testflode, och kraver normalt konto-/portalflode.
- `Blue Prism`: annu tyngre enterprise-spar och inte heller direktinstallerbar har via `winget`.
- `Den har losningen`: snabbast att fa i drift for ett konkret formularflode och lattast att versionshantera i GitHub.

## Nasta steg

Bra fortsattning efter forsta commit:

- lagga till OCR for forpackningsbilder
- lagga till GitHub Pages-deploy
- lagga till Playwright eller annan browser automation nar Node finns installerat
