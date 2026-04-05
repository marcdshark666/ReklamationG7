const DEFAULTS_KEY = "reklamationg7-defaults";
const DRAFT_KEY = "reklamationg7-draft";
const SURVEY_URL = "https://rubinmedical.lime-forms.se/forms/nlCvHsnLaU7h4thf4stN";

const builtInDefaults = {
  default_name: "Marc J\u00f6nsson",
  default_guardian: "Marc J\u00f6nsson",
  default_email: "Marc.jonsson@stud.umed.lodz.pl",
  default_phone: "0708640865",
  default_address: "Gubbk\u00e4rrsv\u00e4gen 19B",
  default_zipcode: "16840",
  default_city: "Stockholm",
  default_serialno: "861743",
  default_clinic: "Solna Karolinska Diabetesmottagning",
  default_product: "Dexcom G7 Sensor",
  default_clean_insertion: "Ja",
  default_dexcom_username: "marcjonsson_d2",
};

const builtInCaseDefaults = {
  case_service: "Reklamation",
  case_placement: "Buken bredvid naveln",
  case_issue: "issue_stopped_values",
  case_error_message: "48 CGM unavailable alert",
  case_missing_values: "Mer \u00e4n 24 timmar i str\u00e4ck",
};

const issueCatalog = {
  issue_applicator_stuck: {
    label: "Sensorn fastnade i applikatorn (G7)",
    rubinValue: "1109",
  },
  issue_adhesive_loosened: {
    label: "Sensorh\u00e4ftan lossnade i f\u00f6rtid fr\u00e5n huden (G7)",
    rubinValue: "1186",
  },
  issue_stopped_values: {
    label: "Sensorn slutade visa v\u00e4rden (G7)",
    rubinValue: "1143",
  },
  issue_sensor_error_11: {
    label: "Sensorfel 11 (G7)",
    rubinValue: "1091",
  },
  issue_wrong_values: {
    label: "Sensorn visade felaktiga glukosv\u00e4rden (G7)",
    rubinValue: "1140",
  },
  issue_pairing_failed: {
    label: "Det gick inte att parkoppla sensorn (G7)",
    rubinValue: "1139",
  },
  issue_other: {
    label: "Annat fel",
    rubinValue: "1043",
  },
};

const legacyIssueLookup = {
  "Sensorn fastnade i applikatorn (G7)": "issue_applicator_stuck",
  "Sensorhaftan lossnade i fortid fran huden (G7)": "issue_adhesive_loosened",
  "Sensorh\u00e4ftan lossnade i f\u00f6rtid fr\u00e5n huden (G7)": "issue_adhesive_loosened",
  "Sensorn slutade visa varden (G7)": "issue_stopped_values",
  "Sensorn slutade visa v\u00e4rden (G7)": "issue_stopped_values",
  "Sensorfel 11 (G7)": "issue_sensor_error_11",
  "Sensorn visade felaktiga glukosvarden (G7)": "issue_wrong_values",
  "Sensorn visade felaktiga glukosv\u00e4rden (G7)": "issue_wrong_values",
  "Det gick inte att parkoppla sensorn (G7)": "issue_pairing_failed",
  "Annat fel": "issue_other",
};

const fieldLabels = {
  default_name: "Pumpanv\u00e4ndarens namn",
  default_guardian: "Eventuell m\u00e5lsman",
  default_email: "E-post",
  default_phone: "Mobilnummer",
  default_address: "Adress",
  default_zipcode: "Postnummer",
  default_city: "Stad",
  default_serialno: "Serienummer Tandem insulinpump",
  default_clinic: "Klinik",
  default_product: "Produkt",
  default_clean_insertion: "Spritsudd",
  case_service: "F\u00f6rfr\u00e5gan",
  case_lot_number: "Sensorns LOT nummer",
  case_end_date: "Utg\u00e5ngsdatum sensor",
  case_manufacture_date: "Tillverkningsdatum",
  case_error_date: "Datum d\u00e5 sensorn felade",
  case_days_remaining: "Dagar kvar n\u00e4r sensorn felade",
  case_insert_date: "Ins\u00e4ttningsdatum",
  case_placement: "Placering",
  case_issue: "Vilket fel upplevde ni med G7 sensorn?",
  case_error_message: "Vilket felmeddelande fick ni i Tandem insulinpump?",
  case_missing_values: "Under hur l\u00e5ng tid saknades sensorv\u00e4rden innan ni tog bort sensorn?",
};

const defaultsFields = [
  "default_name",
  "default_guardian",
  "default_email",
  "default_phone",
  "default_address",
  "default_zipcode",
  "default_city",
  "default_serialno",
  "default_clinic",
  "default_product",
  "default_clean_insertion",
];

const caseFields = [
  "case_service",
  "case_lot_number",
  "case_end_date",
  "case_manufacture_date",
  "case_error_date",
  "case_days_remaining",
  "case_insert_date",
  "case_placement",
  "case_issue",
  "case_error_message",
  "case_missing_values",
];

const requiredFields = [
  ["case_lot_number", "Sensorns LOT nummer"],
  ["case_error_date", "Datum d\u00e5 sensorn felade"],
  ["case_insert_date", "Ins\u00e4ttningsdatum"],
];

const swedishMonths = {
  januari: "01",
  februari: "02",
  mars: "03",
  april: "04",
  maj: "05",
  juni: "06",
  juli: "07",
  augusti: "08",
  september: "09",
  oktober: "10",
  november: "11",
  december: "12",
};

const marcExample = {
  defaults: {
    default_name: "Marc J\u00f6nsson",
    default_guardian: "Marc J\u00f6nsson",
    default_email: "Marc.jonsson@stud.umed.lodz.pl",
    default_phone: "0708640865",
    default_address: "Gubbk\u00e4rsv\u00e4gen 19B",
    default_zipcode: "16840",
    default_city: "Stockholm",
    default_serialno: "861743",
    default_clinic: "Solna Karolinska Diabetesmottagning",
    default_product: "Dexcom G7 Sensor",
    default_clean_insertion: "Ja",
  },
  caseData: {
    case_service: "Reklamation",
    case_lot_number: "1825342008",
    case_end_date: "2027-05-31",
    case_error_date: "2026-04-04",
    case_days_remaining: "6",
    case_insert_date: "2026-03-31",
    case_placement: "Buken bredvid naveln",
    case_issue: "issue_stopped_values",
    case_error_message: "48 CGM unavailable alert",
    case_missing_values: "Mer \u00e4n 24 timmar i str\u00e4ck",
  },
  intakeText:
    "LOT 1825342008. Utg\u00e5ngsdatum 2027-05-31. Sensorn felade 2026-04-04. 6 dagar kvar. Felkod 48 CGM unavailable alert. Placering buken bredvid naveln.",
};

let uploadedImages = [];
let uploadedDocuments = [];
let lastOcrText = "";

function $(id) {
  return document.getElementById(id);
}

function getIssueLabel(code) {
  return issueCatalog[normalizeIssueValue(code)]?.label || "";
}

function getIssueRubinValue(code) {
  return issueCatalog[normalizeIssueValue(code)]?.rubinValue || issueCatalog.issue_other.rubinValue;
}

function normalizeIssueValue(value) {
  if (!value) {
    return "issue_stopped_values";
  }

  if (issueCatalog[value]) {
    return value;
  }

  return legacyIssueLookup[value] || "issue_other";
}

function fieldValues(ids) {
  return ids.reduce((result, id) => {
    result[id] = $(id).value;
    return result;
  }, {});
}

function setFieldValue(id, value) {
  const element = $(id);
  if (!element || value === undefined || value === null || value === "") {
    return;
  }

  if (id === "case_issue") {
    element.value = normalizeIssueValue(String(value).trim());
    return;
  }

  element.value = String(value).trim();
}

function applyValues(data = {}) {
  Object.entries(data).forEach(([id, value]) => {
    setFieldValue(id, value);
  });
}

function setStatus(message) {
  $("statusMessage").textContent = message;
}

function setParseNotes(items) {
  const container = $("parseNotes");
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = '<div class="parse-item">Inget nytt hittades \u00e4nnu.</div>';
    return;
  }

  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "parse-item";
    div.innerHTML = `<strong>${item.label}</strong><div class="feedback-item">${item.value}</div>`;
    container.appendChild(div);
  });
}

function buildExportPayload() {
  return {
    meta: {
      createdAt: new Date().toISOString(),
      exporter: "ReklamationG7",
      issueValue: getIssueRubinValue($("case_issue").value),
      dexcomUsername: builtInDefaults.default_dexcom_username,
    },
    defaults: fieldValues(defaultsFields),
    caseData: {
      ...fieldValues(caseFields),
      case_issue: normalizeIssueValue($("case_issue").value),
    },
    intakeText: $("intake_text").value,
    ocrText: lastOcrText,
    images: uploadedImages,
    documents: uploadedDocuments,
    rubinPreview: Object.fromEntries(buildRubinPayload()),
    missingFields: getMissingFields(),
  };
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(buildExportPayload()));
}

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) {
    return;
  }

  try {
    const payload = JSON.parse(raw);
    applyValues(payload.defaults);
    applyValues(payload.caseData);
    $("intake_text").value = payload.intakeText || "";
    lastOcrText = payload.ocrText || "";
    uploadedImages = payload.images || [];
    uploadedDocuments = payload.documents || [];
    applyValues(builtInDefaults);
    applyValues(builtInCaseDefaults);
    renderUploads();
  } catch (error) {
    console.error(error);
  }
}

function saveDefaults() {
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(fieldValues(defaultsFields)));
  renderPreview();
  renderMissingList();
  saveDraft();
  setStatus("Standarduppgifterna sparades lokalt.");
}

function loadDefaults() {
  applyValues(builtInDefaults);
  applyValues(builtInCaseDefaults);

  const raw = localStorage.getItem(DEFAULTS_KEY);
  if (!raw) {
    return;
  }

  try {
    applyValues(JSON.parse(raw));
    applyValues(builtInDefaults);
    applyValues(builtInCaseDefaults);
  } catch (error) {
    console.error(error);
  }
}

function mergeUniqueByKey(existingItems, nextItems, keySelector) {
  const seen = new Set(existingItems.map(keySelector));
  const merged = [...existingItems];

  nextItems.forEach((item) => {
    const key = keySelector(item);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  });

  return merged;
}

function clearDefaults() {
  localStorage.removeItem(DEFAULTS_KEY);
  defaultsFields.forEach((id) => {
    $(id).value = "";
  });
  applyValues(builtInDefaults);
  applyValues(builtInCaseDefaults);
  renderPreview();
  renderMissingList();
  saveDraft();
  setStatus("Standarduppgifterna rensades.");
}

function buildRubinPayload() {
  const defaults = fieldValues(defaultsFields);
  const caseData = fieldValues(caseFields);

  return [
    ["F\u00f6rfr\u00e5gan", caseData.case_service || "Reklamation"],
    ["Pumpanv\u00e4ndarens namn", defaults.default_name],
    ["Eventuell m\u00e5lsman", defaults.default_guardian],
    ["E-post", defaults.default_email],
    ["Mobilnummer", defaults.default_phone],
    ["Adress", defaults.default_address],
    ["Postnummer", defaults.default_zipcode],
    ["Stad", defaults.default_city],
    ["Serienummer Tandem insulinpump", defaults.default_serialno],
    ["Klinik", defaults.default_clinic],
    ["Produkt", defaults.default_product],
    ["Sensorns LOT nummer", caseData.case_lot_number],
    ["Utg\u00e5ngsdatum sensor", caseData.case_end_date],
    ["Ins\u00e4ttningsdatum", caseData.case_insert_date],
    ["Datum d\u00e5 sensorn felade", caseData.case_error_date],
    ["Placering", caseData.case_placement],
    ["Vilket fel upplevde ni med G7 sensorn?", getIssueLabel(caseData.case_issue)],
    ["Vilket felmeddelande fick ni i Tandem insulinpump?", caseData.case_error_message],
    ["Rengjorde du insticksst\u00e4llet med en spritsudd?", defaults.default_clean_insertion],
    ["Under hur l\u00e5ng tid saknades sensorv\u00e4rden innan ni tog bort sensorn?", caseData.case_missing_values],
    ["Jag f\u00f6rs\u00e4krar att alla uppgifter \u00e4r korrekta och sanningsenliga", "Ja"],
  ];
}

function renderPreview() {
  const previewList = $("previewList");
  const template = $("previewItemTemplate");
  previewList.innerHTML = "";

  buildRubinPayload().forEach(([label, value]) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".preview-label").textContent = label;
    fragment.querySelector(".preview-value").textContent = value || "\u2014";
    previewList.appendChild(fragment);
  });
}

function getMissingFields() {
  return requiredFields
    .map(([id, label]) => ({
      id,
      label,
      value: $(id).value.trim(),
    }))
    .filter((item) => !item.value);
}

function renderMissingList() {
  const container = $("missingList");
  const missing = getMissingFields();
  container.innerHTML = "";

  if (!missing.length) {
    container.innerHTML =
      '<div class="missing-item ok-item">\u2705 Allt obligatoriskt \u00e4r ifyllt. Appen kan skicka till Rubin.</div>';
    return;
  }

  const summary = document.createElement("div");
  summary.className = "missing-item";
  summary.innerHTML = `<strong>\ud83d\udd34 ${missing.length} uppgift(er) saknas:</strong> <span>Komplettera bara det som listas nedan.</span>`;
  container.appendChild(summary);

  missing.forEach((item) => {
    const div = document.createElement("div");
    div.className = "missing-item";
    div.innerHTML = `<strong>\ud83d\udd34 Saknas:</strong> <span>${item.label}</span>`;
    container.appendChild(div);
  });
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseDateCandidate(rawValue) {
  if (!rawValue) {
    return "";
  }

  const value = rawValue.trim().toLowerCase().replace(/\./g, "-").replace(/\//g, "-");

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }

  let match = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    return `${match[3]}-${month}-${day}`;
  }

  match = value.match(/^(\d{1,2})\s+([a-z\u00e5\u00e4\u00f6]+)\s+(\d{4})$/i);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = swedishMonths[match[2].toLowerCase()];
    if (month) {
      return `${match[3]}-${month}-${day}`;
    }
  }

  return "";
}

function extractFirst(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function inferIssue(text) {
  if (/sensorfel\s*11/i.test(text)) {
    return "issue_sensor_error_11";
  }
  if (/felaktiga|missvisande|glukosv[a\u00e4]rden/i.test(text)) {
    return "issue_wrong_values";
  }
  if (/parkoppla|koppla sig|koppla ihop/i.test(text)) {
    return "issue_pairing_failed";
  }
  if (/lossnade/i.test(text)) {
    return "issue_adhesive_loosened";
  }
  if (/fastnade i applikator/i.test(text)) {
    return "issue_applicator_stuck";
  }
  if (/slutade visa v[a\u00e4]rden|saknades sensorv[a\u00e4]rden|cgm unavailable|sensorfel/i.test(text)) {
    return "issue_stopped_values";
  }
  return "";
}

function calculateInsertDate() {
  const errorDateValue = $("case_error_date").value;
  const daysRemainingValue = Number($("case_days_remaining").value);

  if (!errorDateValue || Number.isNaN(daysRemainingValue)) {
    setStatus("\ud83d\udd34 Ange b\u00e5de feldatum och dagar kvar innan ins\u00e4ttningsdatum kan r\u00e4knas ut.");
    return;
  }

  const elapsedDays = 10 - daysRemainingValue;
  const errorDate = new Date(`${errorDateValue}T12:00:00`);
  errorDate.setDate(errorDate.getDate() - elapsedDays);
  $("case_insert_date").value = toIsoDate(errorDate);
  renderPreview();
  renderMissingList();
  saveDraft();
  setStatus("Ins\u00e4ttningsdatum r\u00e4knades ut fr\u00e5n 10-dagarsperioden.");
}

function findUnlabelledFutureDate(text) {
  const matches = [...text.matchAll(/20\d{2}-\d{2}-\d{2}/g)].map((match) => match[0]);
  if (!matches.length) {
    return "";
  }

  const sorted = [...new Set(matches)].sort();
  return sorted[sorted.length - 1];
}

function extractAllMachineDates(text) {
  const matches = [...text.matchAll(/20\d{2}[-/.]\d{2}[-/.]\d{2}/g)]
    .map((match) => match[0].replace(/[/.]/g, "-"))
    .map((value) => parseDateCandidate(value))
    .filter(Boolean);

  return [...new Set(matches)].sort();
}

function cleanTrailingKeywords(value) {
  if (!value) {
    return "";
  }

  return value
    .replace(/\b(?:utg[aå]ngsdatum|tillverkningsdatum|felkod|placement|placering|lot|sensorn felade)\b.*$/i, "")
    .trim();
}

function inferManufactureDate(text, chosenEndDate) {
  const labelledManufacture = extractFirst(
    text,
    /(?:tillverkningsdatum|manufactured|mfg|prod(?:uction)? date)\s*[:\-]?\s*([0-9\/\-. ]{6,20})/i,
  );
  const parsedLabelledManufacture = parseDateCandidate(labelledManufacture);
  if (parsedLabelledManufacture) {
    return parsedLabelledManufacture;
  }

  const dates = extractAllMachineDates(text);
  if (dates.length < 2) {
    return "";
  }

  const earliest = dates[0];
  if (chosenEndDate && earliest === chosenEndDate && dates.length > 1) {
    return dates[1];
  }

  return earliest === chosenEndDate ? "" : earliest;
}

function inferLotFromOcr(text) {
  const labelledLot = extractFirst(text, /\bLOT\b(?:\s*(?:nr|nummer|no))?\s*[:#\-]?\s*([A-Z0-9]{6,14})\b/i);
  if (labelledLot) {
    return labelledLot.replace(/\s{2,}/g, " ").trim();
  }

  const numberCandidates = [...text.matchAll(/\d[\d ]{7,14}\d/g)]
    .map((match) => match[0].replace(/\s+/g, ""))
    .filter((value) => value.length >= 8 && value.length <= 12)
    .filter((value) => !/^20\d{6}$/.test(value));

  return numberCandidates[0] || "";
}

function fillFromText(text) {
  const notes = [];
  const foundValues = {};

  const lotValue =
    extractFirst(text, /lot(?:\s*nr|\s*nummer)?\s*[:\-]?\s*([A-Z0-9]{6,14})/i) || inferLotFromOcr(text);
  if (lotValue) {
    foundValues.case_lot_number = lotValue.replace(/\s{2,}/g, " ").trim();
  }

  const endDateRaw = extractFirst(
    text,
    /utg[a\u00e5]ngsdatum(?:\s*sensor)?\s*[:\-]?\s*([0-9\/\-. ]{6,20}|[0-9]{1,2}\s+[a-z\u00e5\u00e4\u00f6]+\s+[0-9]{4})/i,
  );
  const parsedEndDate = parseDateCandidate(endDateRaw) || findUnlabelledFutureDate(text);
  if (parsedEndDate) {
    foundValues.case_end_date = parsedEndDate;
  }

  const manufactureDate = inferManufactureDate(text, parsedEndDate || $("case_end_date").value);
  if (manufactureDate) {
    foundValues.case_manufacture_date = manufactureDate;
  }

  const directErrorDate =
    extractFirst(text, /(?:datum d[a\u00e5] sensorn felade|datum d[a\u00e5] du fick sensorfel|feldatum|sensorn felade)\s*[:\-]?\s*(20\d{2}[-/.]\d{2}[-/.]\d{2})/i) ||
    extractFirst(text, /\bfelet uppstod\s*[:\-]?\s*(20\d{2}[-/.]\d{2}[-/.]\d{2})/i);
  const errorDateRaw =
    directErrorDate ||
    extractFirst(
      text,
      /(?:datum d[a\u00e5] sensorn felade|datum d[a\u00e5] du fick sensorfel|feldatum)\s*[:\-]?\s*([0-9\/\-. ]{6,20}|[0-9]{1,2}\s+[a-z\u00e5\u00e4\u00f6]+\s+[0-9]{4})/i,
    );
  const parsedErrorDate = parseDateCandidate(errorDateRaw);
  if (parsedErrorDate) {
    foundValues.case_error_date = parsedErrorDate;
  }

  const insertDateRaw = extractFirst(
    text,
    /ins[a\u00e4]ttningsdatum\s*[:\-]?\s*([0-9\/\-. ]{6,20}|[0-9]{1,2}\s+[a-z\u00e5\u00e4\u00f6]+\s+[0-9]{4})/i,
  );
  const parsedInsertDate = parseDateCandidate(insertDateRaw);
  if (parsedInsertDate) {
    foundValues.case_insert_date = parsedInsertDate;
  }

  const daysRemaining = extractFirst(text, /(\d+)\s*dag(?:ar)?\s*kvar/i);
  if (daysRemaining) {
    foundValues.case_days_remaining = daysRemaining;
  }

  const placement = cleanTrailingKeywords(
    extractFirst(
      text,
      /(?:placering|var p[a\u00e5] kroppen|satt p[a\u00e5])\s*[:\-]?\s*([^\n]+?)(?=\b(?:felkod|lot|utg[a\u00e5]ngsdatum|tillverkningsdatum|sensorn felade)\b|$)/i,
    ),
  );
  if (placement) {
    foundValues.case_placement = placement;
  } else if (/buken bredvid naveln/i.test(text)) {
    foundValues.case_placement = "Buken bredvid naveln";
  } else if (/buken/i.test(text)) {
    foundValues.case_placement = "Buken";
  }

  if (/48\s*cgm unavailable alert/i.test(text)) {
    foundValues.case_error_message = "48 CGM unavailable alert";
  } else {
    const errorMessage = extractFirst(text, /(?:felmeddelande|felkod)\s*[:\-]?\s*([^\n]+)/i);
    if (errorMessage) {
      foundValues.case_error_message = errorMessage;
    }
  }

  if (/mer [a\u00e4]n 24 timmar|mer [a\u00e4]n ett dygn/i.test(text)) {
    foundValues.case_missing_values = "Mer \u00e4n 24 timmar i str\u00e4ck";
  } else {
    const hoursMissing = extractFirst(text, /(\d+)\s*timmar/i);
    if (hoursMissing) {
      foundValues.case_missing_values = `${hoursMissing} timmar`;
    }
  }

  const issue = inferIssue(text);
  if (issue) {
    foundValues.case_issue = issue;
  }

  Object.entries(foundValues).forEach(([id, value]) => {
    setFieldValue(id, value);
    notes.push({ label: fieldLabels[id] || id, value: id === "case_issue" ? getIssueLabel(value) : value });
  });

  applyValues(builtInDefaults);
  applyValues(builtInCaseDefaults);

  if (!foundValues.case_insert_date && $("case_error_date").value && $("case_days_remaining").value) {
    calculateInsertDate();
    if ($("case_insert_date").value) {
      notes.push({
        label: fieldLabels.case_insert_date,
        value: $("case_insert_date").value,
      });
    }
  }

  return notes;
}

async function runOcrOnImages() {
  if (!uploadedImages.length) {
    lastOcrText = "";
    return "";
  }

  if (!window.Tesseract) {
    setStatus("\ud83d\udd34 OCR-biblioteket kunde inte laddas. Kontrollera internetanslutningen.");
    return "";
  }

  const chunks = [];

  for (let index = 0; index < uploadedImages.length; index += 1) {
    const image = uploadedImages[index];
    setStatus(`L\u00e4ser bild ${index + 1} av ${uploadedImages.length}...`);
    const result = await window.Tesseract.recognize(image.dataUrl, "swe+eng");
    if (result?.data?.text) {
      chunks.push(result.data.text);
    }
  }

  lastOcrText = chunks.join("\n\n");
  return lastOcrText;
}

function getUploadedDocumentText() {
  return uploadedDocuments
    .filter((document) => document.text)
    .map((document) => document.text)
    .join("\n\n");
}

async function parseIntake(options = {}) {
  const { autoSubmit = false } = options;
  const manualText = $("intake_text").value.trim();
  const uploadedText = getUploadedDocumentText();
  let ocrText = lastOcrText;

  if (uploadedImages.length) {
    ocrText = await runOcrOnImages();
  }

  const combinedText = [manualText, uploadedText, ocrText].filter(Boolean).join("\n\n");
  const notes = [];

  if (uploadedDocuments.length) {
    notes.push({
      label: "Filer",
      value: uploadedDocuments.map((document) => document.name).join(", "),
    });
  }

  notes.push(...fillFromText(combinedText));

  setParseNotes(notes);
  renderPreview();
  renderMissingList();
  saveDraft();

  const missing = getMissingFields();

  if (!notes.length) {
    setStatus("\ud83d\udd34 Inget s\u00e4kert hittades automatiskt. L\u00e4gg till tydligare bilder eller skriv det som saknas.");
    return;
  }

  if (!missing.length && autoSubmit) {
    setStatus("Allt obligatoriskt hittades. F\u00f6rs\u00f6ker skicka automatiskt till Rubin...");
    await submitToRubin({ autoTriggered: true });
    return;
  }

  if (missing.length) {
    setStatus(`\ud83d\udd34 Appen fyllde i mycket men ${missing.length} uppgift(er) saknas fortfarande.`);
    return;
  }

  setStatus("Filerna l\u00e4stes in och alla f\u00e4lt ser kompletta ut. Du kan skicka nu.");
}

function renderUploads() {
  const container = $("imagePreview");
  container.innerHTML = "";

  if (!uploadedImages.length && !uploadedDocuments.length) {
    const empty = document.createElement("div");
    empty.className = "parse-item";
    empty.textContent = "Inga filer uppladdade \u00e4nnu.";
    container.appendChild(empty);
    return;
  }

  uploadedImages.forEach((image) => {
    const card = document.createElement("article");
    card.className = "image-card";

    const img = document.createElement("img");
    img.src = image.dataUrl;
    img.alt = image.name;

    const meta = document.createElement("div");
    meta.className = "image-card-meta";
    meta.innerHTML = `<strong>${image.name}</strong><span>Bild</span>`;

    card.appendChild(img);
    card.appendChild(meta);
    container.appendChild(card);
  });

  uploadedDocuments.forEach((documentItem) => {
    const card = document.createElement("article");
    card.className = "file-card";

    const meta = document.createElement("div");
    meta.className = "file-card-meta";
    meta.innerHTML = `
      <strong>${documentItem.name}</strong>
      <span>${documentItem.type || "Fil"}</span>
      <div class="file-badge">${documentItem.text ? "Text hittad" : "Ingen text l\u00e4st"}</div>
    `;

    card.appendChild(meta);
    container.appendChild(card);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isTextFile(file) {
  return (
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    /\.(txt|md|json)$/i.test(file.name)
  );
}

async function handlePickedFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) {
    return;
  }

  const nextImages = [];
  const nextDocuments = [];

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      const dataUrl = await fileToDataUrl(file);
      nextImages.push({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
      });
      continue;
    }

    if (isTextFile(file)) {
      const text = await file.text();
      nextDocuments.push({
        name: file.name,
        type: file.type || "text/plain",
        size: file.size,
        text,
      });
      continue;
    }

    nextDocuments.push({
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      text: "",
    });
  }

  uploadedImages = mergeUniqueByKey(
    uploadedImages,
    nextImages,
    (image) => `${image.name}-${image.size}`,
  );
  uploadedDocuments = mergeUniqueByKey(
    uploadedDocuments,
    nextDocuments,
    (documentItem) => `${documentItem.name}-${documentItem.size}`,
  );

  renderUploads();
  renderMissingList();
  saveDraft();
  setStatus(`Lade till ${files.length} ny(a) fil(er). L\u00e4ser nu inneh\u00e5llet automatiskt...`);
  await parseIntake({ autoSubmit: true });
}

async function handleIntakeFiles(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) {
    return;
  }
  event.target.value = "";
  await handlePickedFiles(files);
}

function downloadJson() {
  const payload = buildExportPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "case-export.json";
  link.click();
  URL.revokeObjectURL(url);
  setStatus("JSON exporterades.");
}

function copySummary() {
  const text = buildRubinPayload()
    .map(([label, value]) => `${label}: ${value || "\u2014"}`)
    .join("\n");

  navigator.clipboard
    .writeText(text)
    .then(() => {
      setStatus("Rubin-sammanfattningen kopierades.");
    })
    .catch(() => {
      setStatus("\ud83d\udd34 Kopiering misslyckades. Testa igen i en vanlig webbl\u00e4sarflik.");
    });
}

function importJson(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      applyValues(payload.defaults || {});
      applyValues(payload.caseData || {});
      $("intake_text").value = payload.intakeText || "";
      lastOcrText = payload.ocrText || "";
      uploadedImages = payload.images || [];
      uploadedDocuments = payload.documents || [];
      renderUploads();
      renderPreview();
      renderMissingList();
      setParseNotes([]);
      saveDraft();
      setStatus("JSON importerades.");
    } catch (error) {
      console.error(error);
      setStatus("\ud83d\udd34 Importen misslyckades. Kontrollera att filen \u00e4r en giltig export.");
    }
  };
  reader.readAsText(file);
}

function loadMarcExample() {
  applyValues(marcExample.defaults);
  applyValues(marcExample.caseData);
  $("intake_text").value = marcExample.intakeText;
  uploadedImages = [];
  uploadedDocuments = [];
  lastOcrText = "";
  renderUploads();
  renderPreview();
  renderMissingList();
  saveDraft();
  setParseNotes([{ label: "Exempel", value: "Marc-exemplet laddades in." }]);
  setStatus("Marc-exemplet laddades in.");
}

async function submitToRubin(options = {}) {
  const { autoTriggered = false } = options;
  renderMissingList();
  const missing = getMissingFields();

  if (missing.length) {
    setStatus(
      autoTriggered
        ? `\ud83d\udd34 Automatisk skickning stoppades eftersom ${missing.length} uppgift(er) saknas.`
        : "\ud83d\udd34 Kan inte skicka \u00e4nnu. Fyll i det som \u00e4r markerat som saknat.",
    );
    return;
  }

  setStatus("Skickar \u00e4rendet till Rubin Medical...");

  try {
    const response = await fetch("/api/submit-case", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildExportPayload()),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Skick misslyckades.");
    }

    const automationLabel =
      result.automation === "python-rpa"
        ? "lokal Python-robot"
        : result.automation === "powershell-direct-submit"
          ? "direkt-submit"
          : "automatiken";

    setStatus(
      result.httpStatus
        ? `\u00c4rendet skickades till Rubin via ${automationLabel}. HTTP-status: ${result.httpStatus}`
        : `\u00c4rendet skickades till Rubin via ${automationLabel}.`,
    );
  } catch (error) {
    console.error(error);
    setStatus(
      "\ud83d\udd34 Automatiskt skick misslyckades. Anv\u00e4nd knappen l\u00e4ngst ner om du vill \u00f6ppna Rubin manuellt.",
    );
  }
}

function openRubinSurvey() {
  window.open(SURVEY_URL, "_blank", "noopener,noreferrer");
}

function bindAutoSave() {
  [...defaultsFields, ...caseFields, "intake_text"].forEach((id) => {
    $(id).addEventListener("input", () => {
      renderPreview();
      renderMissingList();
      saveDraft();
    });
    $(id).addEventListener("change", () => {
      renderPreview();
      renderMissingList();
      saveDraft();
    });
  });
}

function init() {
  loadDefaults();
  loadDraft();
  $("case_issue").value = normalizeIssueValue($("case_issue").value);
  renderUploads();
  renderPreview();
  renderMissingList();
  setParseNotes([]);
  bindAutoSave();

  $("saveDefaultsBtn").addEventListener("click", saveDefaults);
  $("resetDefaultsBtn").addEventListener("click", clearDefaults);
  $("calculateInsertDateBtn").addEventListener("click", calculateInsertDate);
  $("downloadJsonBtn").addEventListener("click", downloadJson);
  $("copySummaryBtn").addEventListener("click", copySummary);
  $("loadMarcExampleBtn").addEventListener("click", loadMarcExample);
  $("galleryInput").addEventListener("change", handleIntakeFiles);
  $("cameraInput").addEventListener("change", handleIntakeFiles);
  $("importJsonInput").addEventListener("change", importJson);
  $("parseIntakeBtn").addEventListener("click", () => parseIntake({ autoSubmit: false }));
  $("submitToRubinBtn").addEventListener("click", () => submitToRubin({ autoTriggered: false }));
  $("openRubinBtn").addEventListener("click", openRubinSurvey);
  $("openRubinBottomBtn").addEventListener("click", openRubinSurvey);
  $("openGalleryBtn").addEventListener("click", () => $("galleryInput").click());
  $("openCameraBtn").addEventListener("click", () => $("cameraInput").click());
  $("chooseFilesBtn").addEventListener("click", () => $("galleryInput").click());
}

init();
