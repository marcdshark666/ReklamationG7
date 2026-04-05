# ReklamationG7

En fristående webbapp för att samla in Dexcom G7-reklamationer till Rubin Medical, spara standarduppgifter och exportera ärenden som JSON. Repo:t innehåller också ett PowerShell-skript som försöker skicka samma data till Rubin Medicals Lime Forms-endpoint.

## Vad som finns här

- `index.html` - webbappen
- `styles.css` - stil
- `app.js` - logik för defaults, ärendeformulär, bildpreview och export/import
- `scripts/submit-rubin.ps1` - PowerShell-spår för att skicka ett exporterat JSON-ärende till Rubin Medical

## Rekommenderat arbetssätt

1. Öppna `index.html` i webbläsaren.
2. Fyll i dina standarduppgifter en gång.
3. Lägg in ärendespecifik information och valfria bilder.
4. Kontrollera "Rubin-preview".
5. Exportera ärendet till JSON.
6. Kör `scripts/submit-rubin.ps1` med den exporterade JSON-filen om du vill prova automatisk submit.

## Lokal användning

Du kan öppna webbappen direkt genom att dubbelklicka på `index.html`.

## PowerShell-submit

Exempel:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\submit-rubin.ps1 -CaseFile .\case-export.json
```

Skriptet:

- hämtar aktuell formkonfiguration från Rubin Medicals Lime Forms
- bygger en payload för G7-sensorreklamation
- försöker skicka in ärendet
- skriver ut HTTP-status och serversvar

Observera att Rubin Medicals backend kan ändras över tid. Om endpointen eller CSRF-flödet ändras kan skriptet behöva uppdateras.

## Varför inte UiPath eller Blue Prism här?

Den praktiska jämförelsen för just detta repo blev:

- `UiPath`: stark för större RPA-flöden, men inte tillgänglig som direkt `winget`-paket på den här datorn i vårt testflöde, och kräver normalt konto-/portalflöde.
- `Blue Prism`: ännu tyngre enterprise-spår och inte heller direktinstallerbar här via `winget`.
- `Den här lösningen`: snabbast att få i drift för ett konkret formulärflöde och lättast att versionshantera i GitHub.

## Nästa steg

Bra fortsättning efter första commit:

- lägga till OCR för förpackningsbilder
- lägga till GitHub Pages-deploy
- lägga till Playwright eller annan browser automation när Node finns installerat
