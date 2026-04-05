from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

import requests

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None

try:
    import pytesseract
except ImportError:  # pragma: no cover
    pytesseract = None


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
SESSION_DIR = SCRIPT_DIR / ".session" / "telegram"
RPA_SCRIPT = SCRIPT_DIR / "rubin_rpa.py"
SUBMIT_SCRIPT = SCRIPT_DIR / "submit-rubin.ps1"
PYTHON_PATH = PROJECT_ROOT / ".venv" / "Scripts" / "python.exe"
RUBIN_URL = "https://rubinmedical.lime-forms.se/forms/nlCvHsnLaU7h4thf4stN"
COMMON_TESSERACT_PATHS = [
    Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe"),
    Path(r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"),
    Path(r"C:\Users\PC\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
]

BUILT_IN_DEFAULTS: dict[str, str] = {
    "default_name": "Marc Jönsson",
    "default_guardian": "Marc Jönsson",
    "default_email": "Marc.jonsson@stud.umed.lodz.pl",
    "default_phone": "0708640865",
    "default_address": "Gubbkärrsvägen 19B",
    "default_zipcode": "16840",
    "default_city": "Stockholm",
    "default_serialno": "861743",
    "default_clinic": "Solna Karolinska Diabetesmottagning",
    "default_product": "Dexcom G7 Sensor",
    "default_clean_insertion": "Ja",
}

BUILT_IN_CASE_DEFAULTS: dict[str, str] = {
    "case_service": "Reklamation",
    "case_placement": "Buken bredvid naveln",
    "case_issue": "issue_stopped_values",
    "case_error_message": "48 CGM unavailable alert",
    "case_missing_values": "Mer än 24 timmar i sträck",
}

ISSUE_LABELS = {
    "issue_applicator_stuck": "Sensorn fastnade i applikatorn (G7)",
    "issue_adhesive_loosened": "Sensorhaftan lossnade i fortid fran huden (G7)",
    "issue_stopped_values": "Sensorn slutade visa varden (G7)",
    "issue_sensor_error_11": "Sensorfel 11 (G7)",
    "issue_wrong_values": "Sensorn visade felaktiga glukosvarden (G7)",
    "issue_pairing_failed": "Det gick inte att parkoppla sensorn (G7)",
    "issue_other": "Annat fel",
}

FIELD_LABELS = {
    "case_lot_number": "LOT-nummer",
    "case_end_date": "Utgangsdatum",
    "case_manufacture_date": "Tillverkningsdatum",
    "case_error_date": "Datum da sensorn felade",
    "case_insert_date": "Insattningsdatum",
    "case_days_remaining": "Dagar kvar",
    "case_placement": "Placering",
    "case_issue": "Feltyp",
    "case_error_message": "Felmeddelande",
    "case_missing_values": "Saknade sensorvarden",
}

REQUIRED_FIELDS = [
    ("case_lot_number", "LOT-nummer"),
    ("case_insert_date", "Insattningsdatum"),
    ("case_error_date", "Datum da sensorn felade"),
]

SWEDISH_MONTHS = {
    "januari": "01",
    "februari": "02",
    "mars": "03",
    "april": "04",
    "maj": "05",
    "juni": "06",
    "juli": "07",
    "augusti": "08",
    "september": "09",
    "oktober": "10",
    "november": "11",
    "december": "12",
}


def now_iso() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def build_empty_state(chat_id: int) -> dict[str, Any]:
    return {
        "chat_id": chat_id,
        "defaults": BUILT_IN_DEFAULTS.copy(),
        "caseData": BUILT_IN_CASE_DEFAULTS.copy(),
        "intakeText": "",
        "ocrText": "",
        "images": [],
        "documents": [],
        "awaitingSendConfirmation": False,
        "lastPreviewFingerprint": "",
        "lastPreviewImage": "",
        "lastPreviewResult": {},
        "updatedAt": now_iso(),
    }


def configure_tesseract() -> None:
    if pytesseract is None:
        return

    explicit = os.environ.get("TESSERACT_CMD", "").strip()
    if explicit:
        pytesseract.pytesseract.tesseract_cmd = explicit
        return

    for candidate in COMMON_TESSERACT_PATHS:
        if candidate.exists():
            pytesseract.pytesseract.tesseract_cmd = str(candidate)
            return


def chat_dir(chat_id: int) -> Path:
    directory = SESSION_DIR / str(chat_id)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def state_path(chat_id: int) -> Path:
    return chat_dir(chat_id) / "state.json"


def case_path(chat_id: int) -> Path:
    return chat_dir(chat_id) / "case-export.json"


def load_state(chat_id: int) -> dict[str, Any]:
    path = state_path(chat_id)
    if not path.exists():
        return build_empty_state(chat_id)

    payload = json.loads(path.read_text(encoding="utf-8"))
    state = build_empty_state(chat_id)
    state.update(payload)
    state["defaults"] = {**BUILT_IN_DEFAULTS, **payload.get("defaults", {})}
    state["caseData"] = {**BUILT_IN_CASE_DEFAULTS, **payload.get("caseData", {})}
    return state


def save_state(state: dict[str, Any]) -> None:
    state["updatedAt"] = now_iso()
    state_path(int(state["chat_id"])).write_text(
        json.dumps(state, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def export_payload(state: dict[str, Any]) -> dict[str, Any]:
    return {
        "meta": {
            "createdAt": now_iso(),
            "exporter": "ReklamationG7-Telegram",
            "source": "telegram-bot",
        },
        "defaults": state["defaults"],
        "caseData": state["caseData"],
        "intakeText": state.get("intakeText", ""),
        "ocrText": state.get("ocrText", ""),
        "images": state.get("images", []),
        "documents": state.get("documents", []),
    }


def write_case_file(state: dict[str, Any]) -> Path:
    path = case_path(int(state["chat_id"]))
    path.write_text(json.dumps(export_payload(state), ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def missing_fields(state: dict[str, Any]) -> list[str]:
    case_data = state["caseData"]
    return [label for key, label in REQUIRED_FIELDS if not str(case_data.get(key, "")).strip()]


def calculate_insert_date(error_date_value: str, days_remaining_value: str) -> str:
    if not error_date_value or not days_remaining_value:
        return ""
    try:
        error_day = date.fromisoformat(error_date_value)
        days_remaining = int(days_remaining_value)
    except ValueError:
        return ""

    elapsed_days = 10 - days_remaining
    return (error_day - timedelta(days=elapsed_days)).isoformat()


def parse_date_candidate(raw_value: str) -> str:
    if not raw_value:
        return ""

    value = raw_value.strip().lower().replace(".", "-").replace("/", "-")
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return value

    if re.fullmatch(r"\d{8}", value):
        return f"{value[:4]}-{value[4:6]}-{value[6:]}"

    match = re.fullmatch(r"(\d{1,2})-(\d{1,2})-(\d{4})", value)
    if match:
        day, month, year = match.groups()
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"

    match = re.fullmatch(r"(\d{1,2})\s+([a-zA-ZåäöÅÄÖ]+)\s+(\d{4})", value)
    if match:
        day, month_name, year = match.groups()
        month = SWEDISH_MONTHS.get(month_name.lower())
        if month:
            return f"{year}-{month}-{day.zfill(2)}"

    return ""


def extract_first(text: str, pattern: str) -> str:
    match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
    return match.group(1).strip() if match else ""


def extract_all_machine_dates(text: str) -> list[str]:
    values = [
        parse_date_candidate(match.group(0).replace("/", "-").replace(".", "-"))
        for match in re.finditer(r"20\d{2}[-/.]\d{2}[-/.]\d{2}", text)
    ]
    values = [value for value in values if value]
    return sorted(set(values))


def infer_lot(text: str) -> str:
    labelled = extract_first(text, r"\bLOT\b(?:\s*(?:nr|nummer|no))?\s*[:#\-]?\s*([A-Z0-9 ]{6,20})")
    if labelled:
        cleaned = re.sub(r"\s+", "", labelled)
        if 8 <= len(cleaned) <= 14:
            return cleaned

    candidates = []
    for match in re.finditer(r"\d[\d ]{7,14}\d", text):
        value = re.sub(r"\s+", "", match.group(0))
        if 8 <= len(value) <= 12 and not re.fullmatch(r"20\d{6}", value):
            candidates.append(value)
    return candidates[0] if candidates else ""


def infer_issue(text: str) -> str:
    lowered = text.lower()
    if "sensorfel 11" in lowered:
        return "issue_sensor_error_11"
    if any(token in lowered for token in ("felaktiga", "missvisande", "glukosvarden", "glukosvärden")):
        return "issue_wrong_values"
    if any(token in lowered for token in ("parkoppla", "koppla sig", "koppla ihop")):
        return "issue_pairing_failed"
    if "lossnade" in lowered:
        return "issue_adhesive_loosened"
    if "fastnade i applikator" in lowered:
        return "issue_applicator_stuck"
    if any(token in lowered for token in ("slutade visa", "cgm unavailable", "sensorfel", "saknades sensorvarden")):
        return "issue_stopped_values"
    return ""


def infer_end_date(text: str) -> str:
    labelled = extract_first(
        text,
        r"(?:utgangsdatum|utgångsdatum)(?:\s*sensor)?\s*[:\-]?\s*([0-9\/\-. ]{6,20}|[0-9]{1,2}\s+[a-zA-ZåäöÅÄÖ]+\s+[0-9]{4})",
    )
    parsed = parse_date_candidate(labelled)
    if parsed:
        return parsed

    dates = extract_all_machine_dates(text)
    return dates[-1] if dates else ""


def infer_manufacture_date(text: str, chosen_end_date: str, excluded_dates: list[str] | None = None) -> str:
    labelled = extract_first(
        text,
        r"(?:tillverkningsdatum|manufactured|mfg|prod(?:uction)? date)\s*[:\-]?\s*([0-9\/\-. ]{6,20})",
    )
    parsed = parse_date_candidate(labelled)
    if parsed:
        return parsed

    blocked = {chosen_end_date}
    if excluded_dates:
        blocked.update(value for value in excluded_dates if value)

    dates = [value for value in extract_all_machine_dates(text) if value not in blocked]
    if len(dates) < 2:
        return ""
    earliest = dates[0]
    return earliest


def infer_error_date(text: str) -> str:
    direct = extract_first(
        text,
        r"(?:datum da sensorn felade|datum da du fick sensorfel|feldatum|sensorn felade|felet uppstod)\s*[:\-]?\s*(20\d{2}[-/.]\d{2}[-/.]\d{2})",
    )
    if direct:
        return parse_date_candidate(direct)

    labelled = extract_first(
        text,
        r"(?:datum da sensorn felade|datum da du fick sensorfel|feldatum)\s*[:\-]?\s*([0-9\/\-. ]{6,20}|[0-9]{1,2}\s+[a-zA-ZåäöÅÄÖ]+\s+[0-9]{4})",
    )
    return parse_date_candidate(labelled)


def infer_insert_date(text: str) -> str:
    labelled = extract_first(
        text,
        r"(?:insattningsdatum|insatt|insattes|insattes)\s*[:\-]?\s*([0-9\/\-. ]{6,20}|[0-9]{1,2}\s+[a-zA-ZåäöÅÄÖ]+\s+[0-9]{4})",
    )
    return parse_date_candidate(labelled)


def infer_days_remaining(text: str) -> str:
    value = extract_first(text, r"(\d+)\s*dag(?:ar)?\s*kvar")
    return value


def infer_placement(text: str) -> str:
    value = extract_first(
        text,
        r"(?:placering|var pa kroppen|var på kroppen|satt pa|satt på)\s*[:\-]?\s*([^\n]+)",
    )
    if value:
        value = re.split(r"\b(?:lot|utgangsdatum|utgångsdatum|tillverkningsdatum|felkod|sensorn felade)\b", value, maxsplit=1, flags=re.IGNORECASE)[0].strip()
        return value.rstrip(" .,:;")
    if re.search(r"buken bredvid naveln", text, re.IGNORECASE):
        return "Buken bredvid naveln"
    if re.search(r"\bbuken\b", text, re.IGNORECASE):
        return "Buken"
    return ""


def infer_error_message(text: str) -> str:
    if re.search(r"48\s*cgm unavailable alert", text, re.IGNORECASE):
        return "48 CGM unavailable alert"
    value = extract_first(text, r"(?:felmeddelande|felkod)\s*[:\-]?\s*([^\n]+)")
    return value


def infer_missing_values(text: str) -> str:
    lowered = text.lower()
    if "mer an 24 timmar" in lowered or "mer än 24 timmar" in lowered or "mer an ett dygn" in lowered:
        return "Mer an 24 timmar i strack"
    hours = extract_first(text, r"(\d+)\s*timmar")
    if hours:
        return f"{hours} timmar"
    return ""


def merge_text_into_state(state: dict[str, Any], text: str) -> list[tuple[str, str]]:
    if not text.strip():
        return []

    case_data = state["caseData"]
    notes: list[tuple[str, str]] = []

    updates = {
        "case_lot_number": infer_lot(text),
        "case_end_date": infer_end_date(text),
        "case_error_date": infer_error_date(text),
        "case_insert_date": infer_insert_date(text),
        "case_days_remaining": infer_days_remaining(text),
        "case_placement": infer_placement(text),
        "case_error_message": infer_error_message(text),
        "case_missing_values": infer_missing_values(text),
    }

    end_date = updates["case_end_date"] or case_data.get("case_end_date", "")
    error_date = updates["case_error_date"] or case_data.get("case_error_date", "")
    insert_date = updates["case_insert_date"] or case_data.get("case_insert_date", "")
    manufacture_date = infer_manufacture_date(text, end_date, [error_date, insert_date])
    if manufacture_date:
        updates["case_manufacture_date"] = manufacture_date

    issue = infer_issue(text)
    if issue:
        updates["case_issue"] = issue

    for key, value in updates.items():
        if value:
            case_data[key] = value
            display_value = ISSUE_LABELS[value] if key == "case_issue" else value
            notes.append((FIELD_LABELS.get(key, key), display_value))

    if not case_data.get("case_insert_date"):
        calculated = calculate_insert_date(
            case_data.get("case_error_date", ""),
            case_data.get("case_days_remaining", ""),
        )
        if calculated:
            case_data["case_insert_date"] = calculated
            notes.append((FIELD_LABELS["case_insert_date"], calculated))

    return notes


def latest_case_summary(state: dict[str, Any]) -> str:
    case_data = state["caseData"]
    lines = [
        f"LOT: {case_data.get('case_lot_number', '—') or '—'}",
        f"Insattningsdatum: {case_data.get('case_insert_date', '—') or '—'}",
        f"Feldatum: {case_data.get('case_error_date', '—') or '—'}",
    ]
    return "\n".join(lines)


def preview_fingerprint(state: dict[str, Any]) -> str:
    return json.dumps(
        {"defaults": state["defaults"], "caseData": state["caseData"]},
        ensure_ascii=False,
        sort_keys=True,
    )


class TelegramBot:
    def __init__(self, token: str, poll_timeout: int = 45) -> None:
        self.token = token
        self.poll_timeout = poll_timeout
        self.session = requests.Session()
        self.api_base = f"https://api.telegram.org/bot{token}"
        self.file_base = f"https://api.telegram.org/file/bot{token}"

    def api(self, method: str, *, data: dict[str, Any] | None = None, files: dict[str, Any] | None = None) -> dict[str, Any]:
        response = self.session.post(
            f"{self.api_base}/{method}",
            data=data,
            files=files,
            timeout=120,
        )
        response.raise_for_status()
        payload = response.json()
        if not payload.get("ok"):
            raise RuntimeError(f"Telegram API error for {method}: {payload}")
        return payload["result"]

    def send_message(self, chat_id: int, text: str) -> None:
        self.api("sendMessage", data={"chat_id": str(chat_id), "text": text})

    def send_photo(self, chat_id: int, photo_path: Path, caption: str) -> None:
        with photo_path.open("rb") as photo_handle:
            self.api(
                "sendPhoto",
                data={"chat_id": str(chat_id), "caption": caption},
                files={"photo": photo_handle},
            )

    def get_updates(self, offset: int | None) -> list[dict[str, Any]]:
        payload = {
            "timeout": self.poll_timeout,
            "allowed_updates": json.dumps(["message"]),
        }
        if offset is not None:
            payload["offset"] = str(offset)
        return self.api("getUpdates", data=payload)

    def download_telegram_file(self, file_id: str, destination_dir: Path, fallback_name: str) -> Path:
        file_info = self.api("getFile", data={"file_id": file_id})
        file_path = file_info["file_path"]
        filename = Path(file_path).name or fallback_name
        destination = destination_dir / filename
        response = self.session.get(f"{self.file_base}/{file_path}", timeout=120)
        response.raise_for_status()
        destination.write_bytes(response.content)
        return destination

    def run_preview(self, state: dict[str, Any]) -> dict[str, Any]:
        case_file = write_case_file(state)
        completed = subprocess.run(
            [str(PYTHON_PATH), str(RPA_SCRIPT), "--case-file", str(case_file), "--headless"],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        output = (completed.stdout or completed.stderr).strip()
        if not output:
            raise RuntimeError("Preview-scriptet gav inget svar.")
        result = json.loads(output.splitlines()[-1])
        return result

    def run_submit(self, state: dict[str, Any]) -> dict[str, Any]:
        case_file = write_case_file(state)
        preview_result = self.run_preview(state)
        if not preview_result.get("success"):
            return preview_result

        submit_result = subprocess.run(
            [str(PYTHON_PATH), str(RPA_SCRIPT), "--case-file", str(case_file), "--headless", "--submit"],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        submit_output = (submit_result.stdout or submit_result.stderr).strip()
        if submit_output:
            parsed = json.loads(submit_output.splitlines()[-1])
            if parsed.get("success") and parsed.get("submitted"):
                parsed["automation"] = "python-rpa"
                return parsed

        fallback = subprocess.run(
            [
                "powershell",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(SUBMIT_SCRIPT),
                "-CaseFile",
                str(case_file),
                "-AsJson",
            ],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        fallback_output = (fallback.stdout or fallback.stderr).strip()
        if not fallback_output:
            raise RuntimeError("Fallback-submit gav inget svar.")
        parsed_fallback = json.loads(fallback_output.splitlines()[-1])
        parsed_fallback["automation"] = "powershell-direct-submit"
        parsed_fallback["previewResult"] = preview_result
        return parsed_fallback

    def ocr_image(self, image_path: Path) -> tuple[str, str]:
        if Image is None or pytesseract is None:
            return "", "OCR-biblioteken ar inte installerade lokalt an."

        try:
            image = Image.open(image_path)
            for language in ("swe+eng", "eng"):
                try:
                    text = pytesseract.image_to_string(image, lang=language)
                    if text.strip():
                        return text, "" if language == "swe+eng" else "Svensk OCR-data saknades, sa jag laste bilden med engelsk fallback."
                except Exception:
                    continue
            return "", "OCR kunde inte lasa text ur bilden."
        except Exception as error:  # noqa: BLE001
            return "", f"OCR kunde inte lasa bilden: {error}"

    def build_missing_message(self, state: dict[str, Any], notes: list[tuple[str, str]], extra_notice: str = "") -> str:
        lines: list[str] = []
        if notes:
            lines.append("Jag hittade detta nu:")
            for label, value in notes:
                lines.append(f"- {label}: {value}")
            lines.append("")

        missing = missing_fields(state)
        if missing:
            lines.append("Det jag fortfarande behover:")
            for label in missing:
                lines.append(f"🔴 {label}")
            lines.append("")
            lines.append("Du kan svara med vanlig text eller skicka en till bild.")
        else:
            lines.append("Allt obligatoriskt finns nu.")
            lines.append("Jag bygger nu en previewbild av Rubin-sidan innan nagot skickas.")

        if extra_notice:
            lines.append("")
            lines.append(extra_notice)

        lines.append("")
        lines.append(latest_case_summary(state))
        return "\n".join(lines)

    def maybe_send_preview(self, state: dict[str, Any], chat_id: int) -> None:
        if missing_fields(state):
            return

        fingerprint = preview_fingerprint(state)
        if state.get("awaitingSendConfirmation") and state.get("lastPreviewFingerprint") == fingerprint:
            return

        result = self.run_preview(state)
        state["lastPreviewResult"] = result
        if not result.get("success"):
            save_state(state)
            self.send_message(
                chat_id,
                "Jag kunde inte bygga preview-bilden an.\n"
                f"Fel: {result.get('message', 'okant fel')}",
            )
            return

        screenshot_path = Path(result["screenshotPath"])
        state["lastPreviewImage"] = str(screenshot_path)
        state["lastPreviewFingerprint"] = fingerprint
        state["awaitingSendConfirmation"] = True
        save_state(state)
        self.send_photo(
            chat_id,
            screenshot_path,
            "Har ar preview pa den ifyllda Rubin-sidan.\n"
            "Om allt ser ratt ut, skriv SKICKA.\n"
            "Om nagot ar fel, skicka bara ny text eller en ny bild sa uppdaterar jag.",
        )

    def handle_user_text(self, chat_id: int, state: dict[str, Any], text: str) -> None:
        normalized = text.strip().lower()

        if normalized == "/start":
            self.send_message(
                chat_id,
                "Skicka en bild pa forpackningen eller en text med sensoruppgifter.\n"
                "Jag forsoker lasa ut LOT, datum och annat automatiskt.\n"
                "Nar allt finns skickar jag tillbaka en previewbild av Rubin-formularet innan nagot skickas.",
            )
            return

        if normalized in {"/help", "help"}:
            self.send_message(
                chat_id,
                "Kommandon:\n"
                "/status - visa vad som saknas\n"
                "/preview - bygg ny previewbild\n"
                "/reset - borja om for detta arende\n"
                "SKICKA - skicka reklamationen efter preview",
            )
            return

        if normalized == "/reset":
            new_state = build_empty_state(chat_id)
            save_state(new_state)
            self.send_message(chat_id, "Jag rensade utkastet. Skicka en ny bild eller ny text nar du vill.")
            return

        if normalized == "/status":
            self.send_message(chat_id, self.build_missing_message(state, []))
            return

        if normalized == "/preview":
            if missing_fields(state):
                self.send_message(chat_id, self.build_missing_message(state, []))
            else:
                self.maybe_send_preview(state, chat_id)
            return

        if normalized in {"skicka", "send", "/send"}:
            if missing_fields(state):
                self.send_message(chat_id, self.build_missing_message(state, []))
                return

            if not state.get("awaitingSendConfirmation"):
                self.maybe_send_preview(state, chat_id)
                return

            result = self.run_submit(state)
            state["awaitingSendConfirmation"] = False
            save_state(state)

            if result.get("success"):
                automation = result.get("automation", "automatiken")
                http_status = result.get("httpStatus")
                if http_status:
                    self.send_message(
                        chat_id,
                        f"Reklamationen skickades via {automation}. HTTP-status: {http_status}",
                    )
                elif result.get("submitted"):
                    self.send_message(chat_id, f"Reklamationen skickades via {automation}.")
                else:
                    self.send_message(
                        chat_id,
                        "Jag fyllde sidan men kunde inte bekrafta att den skickades klart.\n"
                        "Kontrollera previewn igen eller kor formularet manuellt: "
                        f"{RUBIN_URL}",
                    )
            else:
                self.send_message(
                    chat_id,
                    "Skick misslyckades.\n"
                    f"Fel: {result.get('message', 'okant fel')}",
                )
            return

        state["intakeText"] = "\n".join(part for part in [state.get("intakeText", ""), text.strip()] if part)
        notes = merge_text_into_state(state, text)
        save_state(state)
        self.send_message(chat_id, self.build_missing_message(state, notes))
        self.maybe_send_preview(state, chat_id)

    def handle_photo_or_document(self, chat_id: int, state: dict[str, Any], message: dict[str, Any]) -> None:
        directory = chat_dir(chat_id)
        notes: list[tuple[str, str]] = []
        notices: list[str] = []

        caption = (message.get("caption") or "").strip()
        if caption:
            state["intakeText"] = "\n".join(part for part in [state.get("intakeText", ""), caption] if part)
            notes.extend(merge_text_into_state(state, caption))

        if message.get("photo"):
            photo = message["photo"][-1]
            downloaded = self.download_telegram_file(photo["file_id"], directory, "telegram-photo.jpg")
            state["images"].append({"name": downloaded.name, "path": str(downloaded)})
            ocr_text, ocr_notice = self.ocr_image(downloaded)
            if ocr_text:
                state["ocrText"] = "\n".join(part for part in [state.get("ocrText", ""), ocr_text] if part)
                notes.extend(merge_text_into_state(state, ocr_text))
            if ocr_notice:
                notices.append(ocr_notice)

        if message.get("document"):
            document = message["document"]
            downloaded = self.download_telegram_file(
                document["file_id"],
                directory,
                document.get("file_name", "telegram-document"),
            )
            state["documents"].append({"name": downloaded.name, "path": str(downloaded)})
            mime_type = document.get("mime_type", "")
            if mime_type.startswith("image/") or downloaded.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                ocr_text, ocr_notice = self.ocr_image(downloaded)
                if ocr_text:
                    state["ocrText"] = "\n".join(part for part in [state.get("ocrText", ""), ocr_text] if part)
                    notes.extend(merge_text_into_state(state, ocr_text))
                if ocr_notice:
                    notices.append(ocr_notice)
            elif downloaded.suffix.lower() in {".txt", ".md", ".json"}:
                text = downloaded.read_text(encoding="utf-8", errors="ignore")
                state["intakeText"] = "\n".join(part for part in [state.get("intakeText", ""), text] if part)
                notes.extend(merge_text_into_state(state, text))

        save_state(state)
        notice_text = "\n".join(notices)
        self.send_message(chat_id, self.build_missing_message(state, notes, notice_text))
        self.maybe_send_preview(state, chat_id)

    def handle_update(self, update: dict[str, Any]) -> None:
        message = update.get("message")
        if not message:
            return

        chat_id = int(message["chat"]["id"])
        state = load_state(chat_id)

        if message.get("text"):
            self.handle_user_text(chat_id, state, message["text"])
            return

        if message.get("photo") or message.get("document"):
            self.handle_photo_or_document(chat_id, state, message)
            return

        self.send_message(chat_id, "Skicka en bild, en textfil eller vanlig text sa kan jag fortsatta.")

    def poll_forever(self) -> None:
        SESSION_DIR.mkdir(parents=True, exist_ok=True)
        offset: int | None = None
        while True:
            try:
                updates = self.get_updates(offset)
                for update in updates:
                    offset = int(update["update_id"]) + 1
                    self.handle_update(update)
            except KeyboardInterrupt:
                raise
            except Exception as error:  # noqa: BLE001
                print(f"[telegram-bot] {error}", file=sys.stderr)
                time.sleep(3)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Telegram-bot for Dexcom G7 reklamationsflode.")
    parser.add_argument("--token", default=os.environ.get("TELEGRAM_BOT_TOKEN", ""), help="Telegram bot token")
    parser.add_argument("--poll-timeout", type=int, default=45, help="Long polling-timeout i sekunder")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.token:
        print("Telegram-token saknas. Satt TELEGRAM_BOT_TOKEN eller skicka --token.")
        return 1

    if not PYTHON_PATH.exists():
        print(f"Python hittades inte i .venv: {PYTHON_PATH}")
        return 1

    if not RPA_SCRIPT.exists():
        print(f"Rubin-RPA saknas: {RPA_SCRIPT}")
        return 1

    configure_tesseract()
    bot = TelegramBot(token=args.token, poll_timeout=args.poll_timeout)
    print("Telegram-boten ar igang. Tryck Ctrl+C for att stoppa.")
    bot.poll_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())
