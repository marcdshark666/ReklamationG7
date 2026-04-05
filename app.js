const DEFAULTS_KEY = "reklamationg7-defaults";
const DRAFT_KEY = "reklamationg7-draft";

const issueValueMap = {
  "Sensorn fastnade i applikatorn (G7)": "1109",
  "Sensorhaftan lossnade i fortid fran huden (G7)": "1186",
  "Sensorn slutade visa varden (G7)": "1143",
  "Sensorfel 11 (G7)": "1091",
  "Sensorn visade felaktiga glukosvarden (G7)": "1140",
  "Det gick inte att parkoppla sensorn (G7)": "1139",
  "Annat fel": "1043",
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
  "case_error_date",
  "case_days_remaining",
  "case_insert_date",
  "case_placement",
  "case_issue",
  "case_error_message",
  "case_missing_values",
];

const marcExample = {
  defaults: {
    default_name: "Marc Jonsson",
    default_guardian: "Marc Jonsson",
    default_email: "Marc.jonsson@stud.umed.lodz.pl",
    default_phone: "0708640865",
    default_address: "Gubbkarsvagen 19B",
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
    case_issue: "Sensorn slutade visa varden (G7)",
    case_error_message: "48 CGM unavailable alert",
    case_missing_values: "Mer an 24 timmar i strack",
  },
};

let uploadedImages = [];

function $(id) {
  return document.getElementById(id);
}

function fieldValues(ids) {
  return ids.reduce((result, id) => {
    result[id] = $(id).value;
    return result;
  }, {});
}

function applyValues(data = {}) {
  Object.entries(data).forEach(([id, value]) => {
    const element = $(id);
    if (element) {
      element.value = value ?? "";
    }
  });
}

function setStatus(message) {
  $("statusMessage").textContent = message;
}

function saveDefaults() {
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(fieldValues(defaultsFields)));
  setStatus("Defaults sparade lokalt. Nasta arende kan starta fran samma bas.");
  renderPreview();
}

function loadDefaults() {
  const raw = localStorage.getItem(DEFAULTS_KEY);
  if (!raw) {
    return;
  }

  try {
    applyValues(JSON.parse(raw));
    setStatus("Tidigare defaults laddades fran webblasaren.");
  } catch (error) {
    console.error(error);
    setStatus("Defaults kunde inte lasas. Du kan spara dem pa nytt.");
  }
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
    uploadedImages = payload.images || [];
    renderImages();
    renderPreview();
    setStatus("Senaste utkastet aterstalldes.");
  } catch (error) {
    console.error(error);
  }
}

function clearDefaults() {
  localStorage.removeItem(DEFAULTS_KEY);
  defaultsFields.forEach((id) => {
    $(id).value = "";
  });
  $("default_product").value = "Dexcom G7 Sensor";
  $("default_clean_insertion").value = "Ja";
  renderPreview();
  setStatus("Defaults rensades fran webblasaren.");
}

function buildRubinPayload() {
  const defaults = fieldValues(defaultsFields);
  const caseData = fieldValues(caseFields);

  return [
    ["Forfragan", caseData.case_service || "Reklamation"],
    ["Pumpanvandarens namn", defaults.default_name],
    ["Eventuell malsman", defaults.default_guardian],
    ["E-post", defaults.default_email],
    ["Mobilnummer", defaults.default_phone],
    ["Adress", defaults.default_address],
    ["Postnummer", defaults.default_zipcode],
    ["Stad", defaults.default_city],
    ["Serienummer Tandem insulinpump", defaults.default_serialno],
    ["Klinik", defaults.default_clinic],
    ["Produkt", defaults.default_product],
    ["Sensorns LOT nummer", caseData.case_lot_number],
    ["Utgangsdatum sensor", caseData.case_end_date],
    ["Insattningsdatum", caseData.case_insert_date],
    ["Datum da sensorn felade", caseData.case_error_date],
    ["Placering", caseData.case_placement],
    ["Vilket fel upplevde ni med G7 sensorn?", caseData.case_issue],
    ["Vilket felmeddelande fick ni i Tandem insulinpump?", caseData.case_error_message],
    ["Rengjorde du insticksstallet med en spritsudd?", defaults.default_clean_insertion],
    ["Under hur lang tid saknades sensorvarden innan ni tog bort sensorn?", caseData.case_missing_values],
    ["Bekraftelse om Rubin-klistermarke", "Ja"],
    ["Jag forsakrar att alla uppgifter ar korrekta och sanningsenliga", "Ja"],
  ];
}

function renderPreview() {
  const previewList = $("previewList");
  const template = $("previewItemTemplate");
  previewList.innerHTML = "";

  buildRubinPayload().forEach(([label, value]) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".preview-label").textContent = label;
    fragment.querySelector(".preview-value").textContent = value || "-";
    previewList.appendChild(fragment);
  });
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function calculateInsertDate() {
  const errorDateValue = $("case_error_date").value;
  const daysRemainingValue = Number($("case_days_remaining").value);

  if (!errorDateValue || Number.isNaN(daysRemainingValue)) {
    setStatus("Ange bade feldatum och dagar kvar innan insattningsdatum kan raknas ut.");
    return;
  }

  const elapsedDays = 10 - daysRemainingValue;
  const errorDate = new Date(`${errorDateValue}T12:00:00`);
  errorDate.setDate(errorDate.getDate() - elapsedDays);
  $("case_insert_date").value = toISODate(errorDate);
  renderPreview();
  saveDraft();
  setStatus("Insattningsdatum raknades ut fran 10-dagarsperioden.");
}

function buildExportPayload() {
  const defaults = fieldValues(defaultsFields);
  const caseData = fieldValues(caseFields);

  return {
    meta: {
      createdAt: new Date().toISOString(),
      exporter: "ReklamationG7",
      issueValue: issueValueMap[caseData.case_issue] || "",
    },
    defaults,
    caseData,
    rubinPreview: Object.fromEntries(buildRubinPayload()),
    images: uploadedImages,
  };
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
  setStatus("JSON exporterades. Du kan nu anvanda den i submit-skriptet.");
}

function copySummary() {
  const text = buildRubinPayload()
    .map(([label, value]) => `${label}: ${value || "-"}`)
    .join("\n");

  navigator.clipboard
    .writeText(text)
    .then(() => {
      setStatus("Rubin-sammanfattningen kopierades till urklipp.");
    })
    .catch(() => {
      setStatus("Kunde inte kopiera automatiskt. Testa igen i en vanlig flik.");
    });
}

function renderImages() {
  const container = $("imagePreview");
  container.innerHTML = "";

  if (!uploadedImages.length) {
    const empty = document.createElement("p");
    empty.className = "hero-text";
    empty.textContent = "Inga bilder tillagda annu.";
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
    meta.innerHTML = `<strong>${image.name}</strong><span>${image.type || "Bild"}</span>`;

    card.appendChild(img);
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

async function handleImages(event) {
  const files = Array.from(event.target.files || []);
  const nextImages = [];

  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    nextImages.push({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
    });
  }

  uploadedImages = nextImages;
  renderImages();
  saveDraft();
  setStatus(`Lade till ${uploadedImages.length} bild(er) i arendet.`);
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
      uploadedImages = payload.images || [];
      renderImages();
      renderPreview();
      saveDraft();
      setStatus("JSON importerades och formularet uppdaterades.");
    } catch (error) {
      console.error(error);
      setStatus("Importen misslyckades. Kontrollera att filen ar en giltig export.");
    }
  };
  reader.readAsText(file);
}

function loadMarcExample() {
  applyValues(marcExample.defaults);
  applyValues(marcExample.caseData);
  renderPreview();
  saveDraft();
  setStatus("Marc-exemplet laddades in i formularet.");
}

function bindAutoSave() {
  [...defaultsFields, ...caseFields].forEach((id) => {
    $(id).addEventListener("input", () => {
      renderPreview();
      saveDraft();
    });
    $(id).addEventListener("change", () => {
      renderPreview();
      saveDraft();
    });
  });
}

function init() {
  loadDefaults();
  loadDraft();
  renderImages();
  renderPreview();
  bindAutoSave();

  $("saveDefaultsBtn").addEventListener("click", saveDefaults);
  $("resetDefaultsBtn").addEventListener("click", clearDefaults);
  $("calculateInsertDateBtn").addEventListener("click", calculateInsertDate);
  $("downloadJsonBtn").addEventListener("click", downloadJson);
  $("copySummaryBtn").addEventListener("click", copySummary);
  $("loadMarcExampleBtn").addEventListener("click", loadMarcExample);
  $("imageInput").addEventListener("change", handleImages);
  $("importJsonInput").addEventListener("change", importJson);
}

init();
