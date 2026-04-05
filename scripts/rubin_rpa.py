from __future__ import annotations

import argparse
import json
import sys
import time
import unicodedata
from pathlib import Path
from typing import Any

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

SURVEY_URL = "https://rubinmedical.lime-forms.se/forms/nlCvHsnLaU7h4thf4stN"

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
    "default_overpatch": "Nej",
}

BUILT_IN_CASE_DEFAULTS: dict[str, str] = {
    "case_service": "Reklamation",
    "case_placement": "Buken bredvid naveln",
    "case_issue": "issue_stopped_values",
    "case_error_message": "48 CGM unavailable alert",
    "case_missing_values": "Mer än 24 timmar i sträck",
}

ISSUE_CATALOG: dict[str, dict[str, str]] = {
    "issue_applicator_stuck": {
        "label": "Sensorn fastnade i applikatorn (G7)",
        "value": "1109",
    },
    "issue_adhesive_loosened": {
        "label": "Sensorhäftan lossnade i förtid från huden (G7)",
        "value": "1186",
    },
    "issue_stopped_values": {
        "label": "Sensorn slutade visa värden (G7)",
        "value": "1143",
    },
    "issue_sensor_error_11": {
        "label": "Sensorfel 11 (G7)",
        "value": "1091",
    },
    "issue_wrong_values": {
        "label": "Sensorn visade felaktiga glukosvärden (G7)",
        "value": "1140",
    },
    "issue_pairing_failed": {
        "label": "Det gick inte att parkoppla sensorn (G7)",
        "value": "1139",
    },
    "issue_other": {
        "label": "Annat fel",
        "value": "1043",
    },
}

ISSUE_LOOKUP = {info["label"]: code for code, info in ISSUE_CATALOG.items()}

PRODUCT_VALUES = {
    "Dexcom G7 Sensor": "1050",
    "Dexcom G6 Sensor": "1010",
}

BUTTON_LABELS = ("Nasta", "Nästa", "Skicka", "Submit", "Send")


def json_result(success: bool, **extra: Any) -> str:
    payload = {"success": success, **extra}
    return json.dumps(payload, ensure_ascii=False)


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    return " ".join(ascii_only.lower().split())


def normalize_issue(value: str | None) -> str:
    if not value:
        return "issue_stopped_values"
    if value in ISSUE_CATALOG:
        return value
    return ISSUE_LOOKUP.get(value, "issue_other")


def load_case_file(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    defaults = {**BUILT_IN_DEFAULTS, **payload.get("defaults", {})}
    case_data = {**BUILT_IN_CASE_DEFAULTS, **payload.get("caseData", {})}
    case_data["case_issue"] = normalize_issue(case_data.get("case_issue"))
    return {"defaults": defaults, "caseData": case_data, "meta": payload.get("meta", {})}


def ensure_required_fields(payload: dict[str, Any]) -> list[str]:
    case_data = payload["caseData"]
    required = {
        "case_lot_number": "Sensorns LOT nummer",
        "case_insert_date": "Insattningsdatum",
        "case_error_date": "Datum da sensorn felade",
    }
    missing = []
    for key, label in required.items():
        if not str(case_data.get(key, "")).strip():
            missing.append(label)
    return missing


def find_browser_executable(browser_name: str) -> str:
    candidates = {
        "edge": [
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        ],
        "chrome": [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        ],
    }

    for candidate in candidates[browser_name]:
        if Path(candidate).exists():
            return candidate
    raise FileNotFoundError(f"Hittade ingen installerad {browser_name}-webblasare.")


def ensure_tmp_dir(case_file: Path) -> Path:
    tmp_dir = case_file.parent
    tmp_dir.mkdir(parents=True, exist_ok=True)
    return tmp_dir


def set_input_value(page: Any, name: str, value: str) -> None:
    if value is None:
        return
    locator = page.locator(f'[name="{name}"]:visible').first
    locator.wait_for(state="visible", timeout=15000)
    text_value = str(value)
    try:
        locator.fill(text_value)
    except Exception:  # noqa: BLE001
        # Rubin's date picker inputs are readonly, so we set the value manually
        # and dispatch the events that the form listens for.
        locator.evaluate(
            """(element, nextValue) => {
                element.removeAttribute("readonly");
                element.value = nextValue;
                element.dispatchEvent(new Event("input", { bubbles: true }));
                element.dispatchEvent(new Event("change", { bubbles: true }));
                element.dispatchEvent(new Event("blur", { bubbles: true }));
            }""",
            text_value,
        )


def set_select_value(
    page: Any,
    name: str,
    *,
    label: str | None = None,
    value: str | None = None,
    visible_only: bool = False,
) -> None:
    selector = f'select[name="{name}"]'
    if visible_only:
        selector += ":visible"
    else:
        selector += ":visible"
    locator = page.locator(selector).first
    locator.wait_for(state="visible", timeout=15000)

    last_error: Exception | None = None
    for option in ({"label": label} if label else None, {"value": value} if value else None):
        if not option:
            continue
        try:
            locator.select_option(**option)
            return
        except Exception as error:  # noqa: BLE001
            last_error = error

    if last_error:
        raise last_error


def get_radio_candidates(page: Any, name: str) -> list[dict[str, Any]]:
    script = """
    (groupName) => Array.from(document.querySelectorAll(`input[name="${groupName}"]`))
      .filter((input) => {
        const style = window.getComputedStyle(input);
        return style.display !== "none" && style.visibility !== "hidden";
      })
      .map((input, index) => {
      let text = "";
      const parentLabel = input.closest("label");
      if (parentLabel) {
        text = parentLabel.innerText || "";
      }
      if (!text && input.id) {
        const explicitLabel = document.querySelector(`label[for="${input.id}"]`);
        if (explicitLabel) {
          text = explicitLabel.innerText || "";
        }
      }
      if (!text) {
        const container = input.closest(".field, .form-group, .question, .limeform-field") || input.parentElement;
        if (container) {
          text = container.innerText || "";
        }
      }
      return {
        index,
        value: input.value || "",
        text: (text || "").replace(/\\s+/g, " ").trim()
      };
    });
    """
    return page.evaluate(script, name)


def set_radio_value(page: Any, name: str, wanted_text: str | None = None) -> None:
    inputs = page.locator(f'input[name="{name}"]:visible')
    count = inputs.count()
    if count == 0:
        raise RuntimeError(f"Hittade ingen radiogrupp med namnet {name}.")
    if count == 1 and not wanted_text:
        inputs.first.check(force=True)
        return

    candidates = get_radio_candidates(page, name)
    target = normalize_text(wanted_text or "")
    for candidate in candidates:
        candidate_text = normalize_text(candidate.get("text", ""))
        candidate_value = normalize_text(candidate.get("value", ""))
        if target and (target in candidate_text or target == candidate_value):
            inputs.nth(candidate["index"]).check(force=True)
            return

    if count == 1:
        inputs.first.check(force=True)
        return

    raise RuntimeError(f"Kunde inte valja radiovarde {wanted_text!r} for {name}.")


def try_click_matching_buttons(page: Any, allow_submit: bool) -> list[str]:
    clicked: list[str] = []
    targets = {normalize_text(label) for label in BUTTON_LABELS}
    max_clicks = 2 if allow_submit else 1

    for _ in range(max_clicks):
        buttons = page.locator("button, input[type='submit']")
        total = buttons.count()
        clicked_this_round = False

        for index in range(total):
            button = buttons.nth(index)
            if not button.is_visible():
                continue

            try:
                label = (button.inner_text() or button.get_attribute("value") or "").strip()
            except Exception:  # noqa: BLE001
                label = (button.get_attribute("value") or "").strip()

            normalized = normalize_text(label)
            if normalized in targets:
                button.click()
                clicked.append(label)
                page.wait_for_load_state("networkidle", timeout=15000)
                time.sleep(1)
                clicked_this_round = True
                break

        if not clicked_this_round:
            break

    return clicked


def run_robot(case_file: Path, browser_name: str, headless: bool, submit: bool) -> dict[str, Any]:
    payload = load_case_file(case_file)
    missing = ensure_required_fields(payload)
    if missing:
        return {
            "success": False,
            "message": "Kan inte starta roboten eftersom vissa uppgifter saknas.",
            "missingFields": missing,
        }

    defaults = payload["defaults"]
    case_data = payload["caseData"]
    issue_info = ISSUE_CATALOG[case_data["case_issue"]]
    executable_path = find_browser_executable(browser_name)
    tmp_dir = ensure_tmp_dir(case_file)
    screenshot_path = tmp_dir / f"rubin-rpa-{time.strftime('%Y%m%d-%H%M%S')}.png"

    browser = None
    page = None

    with sync_playwright() as playwright:
        try:
            browser = playwright.chromium.launch(
                executable_path=executable_path,
                headless=headless,
                slow_mo=150 if not headless else 0,
            )
            context = browser.new_context(locale="sv-SE")
            page = context.new_page()
            page.goto(SURVEY_URL, wait_until="domcontentloaded")
            page.wait_for_load_state("networkidle", timeout=20000)

            set_radio_value(page, "logotyp_on_sensor")
            set_select_value(page, "service", label=case_data["case_service"])
            set_input_value(page, "name", defaults["default_name"])
            set_input_value(page, "guardian", defaults["default_guardian"])
            set_input_value(page, "email", defaults["default_email"])
            set_input_value(page, "phone", defaults["default_phone"])
            set_input_value(page, "postaladdress", defaults["default_address"])
            set_input_value(page, "zipcode", defaults["default_zipcode"])
            set_input_value(page, "city", defaults["default_city"])
            set_input_value(page, "serialno", defaults["default_serialno"])
            set_input_value(page, "clinic", defaults["default_clinic"])
            set_select_value(
                page,
                "product",
                label=defaults["default_product"],
                value=PRODUCT_VALUES.get(defaults["default_product"]),
            )
            set_input_value(page, "lot_number", case_data["case_lot_number"])
            set_input_value(page, "end_date", case_data.get("case_end_date", ""))
            set_input_value(page, "insert_date", case_data["case_insert_date"])
            set_input_value(page, "error_date", case_data["case_error_date"])
            set_input_value(page, "placement", case_data["case_placement"])
            set_select_value(
                page,
                "issue",
                label=issue_info["label"],
                value=issue_info["value"],
                visible_only=True,
            )

            try:
                set_radio_value(page, "dexcom_used", defaults.get("default_overpatch", "Nej"))
            except RuntimeError:
                pass

            set_input_value(page, "error_message", case_data["case_error_message"])
            set_radio_value(page, "clean_insertion", defaults["default_clean_insertion"])
            set_input_value(page, "missing_values", case_data["case_missing_values"])
            set_radio_value(page, "correct_information")

            page.screenshot(path=str(screenshot_path), full_page=True)
            clicked_buttons: list[str] = []
            if submit:
                clicked_buttons = try_click_matching_buttons(page, allow_submit=True)
                page.screenshot(path=str(screenshot_path), full_page=True)

            current_url = page.url
            page_text = page.locator("body").inner_text(timeout=10000)
            success_markers = ("tack", "mottagit", "registrerad", "skickad", "received")
            submitted = submit and (
                current_url != SURVEY_URL
                or any(marker in normalize_text(page_text) for marker in success_markers)
            )

            context.close()
            browser.close()
            return {
                "success": True,
                "mode": "submit" if submit else "fill-only",
                "submitted": submitted,
                "browser": browser_name,
                "browserExecutable": executable_path,
                "screenshotPath": str(screenshot_path),
                "currentUrl": current_url,
                "clickedButtons": clicked_buttons,
            }
        except Exception as error:  # noqa: BLE001
            if page is not None:
                try:
                    page.screenshot(path=str(screenshot_path), full_page=True)
                except Exception:  # noqa: BLE001
                    pass
            if browser is not None:
                browser.close()
            return {
                "success": False,
                "message": str(error),
                "screenshotPath": str(screenshot_path),
                "browser": browser_name,
                "browserExecutable": executable_path,
            }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fyll Rubin Medicals reklamationsformular via Playwright.")
    parser.add_argument("--case-file", required=True, help="JSON-export fran ReklamationG7.")
    parser.add_argument("--submit", action="store_true", help="Forsok klicka vidare och skicka in formularet.")
    parser.add_argument("--headless", action="store_true", help="Kor browsern utan synligt fonster.")
    parser.add_argument(
        "--browser",
        default="edge",
        choices=("edge", "chrome"),
        help="Vilken installerad browser som ska anvandas.",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    case_file = Path(args.case_file).expanduser().resolve()

    if not case_file.exists():
        print(json_result(False, message=f"Case-filen hittades inte: {case_file}"))
        return 1

    try:
        result = run_robot(
            case_file=case_file,
            browser_name=args.browser,
            headless=args.headless,
            submit=args.submit,
        )
        print(json.dumps(result, ensure_ascii=False))
        return 0 if result.get("success") else 1
    except FileNotFoundError as error:
        print(json_result(False, message=str(error)))
        return 1
    except PlaywrightTimeoutError as error:
        print(json_result(False, message=f"Tidsgrans overskreds: {error}"))
        return 1
    except Exception as error:  # noqa: BLE001
        print(json_result(False, message=str(error)))
        return 1


if __name__ == "__main__":
    sys.exit(main())
