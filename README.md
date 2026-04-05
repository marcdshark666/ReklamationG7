# ReklamationG7

En bild-forst-webbapp for Dexcom G7-reklamationer till Rubin Medical, plus en lokal Python-robot som kan fylla Rubin-formularet i Edge.

## Flode

1. Starta den lokala servern:

```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

2. Oppna `http://localhost:8765`
3. Ladda upp bild, foto eller textfil hogst upp
4. Appen laser in uppgifterna och fyller falten automatiskt
5. Om nagot saknas markeras det i rott
6. Tryck pa `Skicka vidare till Rubin`

Nar du skickar forsoker appen nu:

1. kora den lokala Python-roboten i Edge
2. falla tillbaka till direkt-submit om roboten inte kan starta

## Python-RPA

Projektet innehaller nu en lokal Playwright-bot:

- `scripts/rubin_rpa.py` - fyller Rubin Medicals formular i browsern
- `scripts/run-rubin-rpa.ps1` - enkel PowerShell-start for roboten
- `requirements.txt` - Python-beroenden

Om du vill kora roboten manuellt mot en exporterad case-fil:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-rubin-rpa.ps1 -CaseFile .\.tmp\case-export.json
```

Om du vill att roboten verkligen ska skicka in reklamationen:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-rubin-rpa.ps1 -CaseFile .\.tmp\case-export.json -Submit -Headless
```

## Installera om det behovs igen

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r .\requirements.txt
```

Roboten anvander installerad Microsoft Edge om den finns, annars Google Chrome.

## Filer

- `index.html` - bild-forst-granssnitt
- `styles.css` - layout och rodamarkeringar
- `app.js` - OCR, parser, preview och lokalt submitflode
- `server.ps1` - lokal webbserver och brygga till Rubin
- `scripts/submit-rubin.ps1` - direkt-submit till Lime Forms
- `scripts/rubin_rpa.py` - Python-robot for Rubin-formularet
- `scripts/run-rubin-rpa.ps1` - PowerShell-start for Python-roboten
