/**
 * Generic transport-order field extractor.
 * Heuristic regex only — no AI, no client-specific templates.
 * Handles RPM Europe, typical DE/NL/PL/LT carrier order PDFs.
 */

const MONTHS = {
  jan:1, feb:2, mar:3, apr:4, may:5, jun:6,
  jul:7, aug:8, sep:9, oct:10, nov:11, dec:12
};

// ─── Low-level helpers ────────────────────────────────────────────────────────

function normalizeText(value) {
  return String(value || "").replace(/\r/g, "\n").replace(/[ \t]+/g, " ").trim();
}

// Return the first group-1 capture across an array of patterns
function firstMatch(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return String(m[1]).trim();
  }
  return "";
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDate(raw) {
  if (!raw) return "";
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD.MM.YYYY / DD/MM/YYYY / D.M.YYYY
  const dmy = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;
  // "May 26, 2025" / "April 25, 2025"
  const mdy = s.match(/^([a-z]{3})\w*\.?\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (mdy) {
    const m = MONTHS[mdy[1].toLowerCase()];
    if (m) return `${mdy[3]}-${String(m).padStart(2,"0")}-${String(mdy[2]).padStart(2,"0")}`;
  }
  // "26 May 2025"
  const dmy2 = s.match(/^(\d{1,2})\s+([a-z]{3})\w*\.?\s+(\d{4})$/i);
  if (dmy2) {
    const m = MONTHS[dmy2[2].toLowerCase()];
    if (m) return `${dmy2[3]}-${String(m).padStart(2,"0")}-${String(dmy2[1]).padStart(2,"0")}`;
  }
  return "";
}

// Search lines for the first line matching labelRe; return group 1
function findInLines(lines, labelRe) {
  for (const line of lines) {
    const m = line.match(labelRe);
    if (m && m[1]) return m[1].trim();
  }
  return "";
}

function findDateInLines(lines, labelRe) {
  return parseDate(findInLines(lines, labelRe));
}

// After the first line matching sectionRe, return the first parseable date within maxLook lines
function findDateAfterSection(lines, sectionRe, maxLook) {
  for (let i = 0; i < lines.length; i++) {
    if (!sectionRe.test(lines[i])) continue;
    for (let j = i + 1; j < Math.min(i + 1 + maxLook, lines.length); j++) {
      const d = parseDate(lines[j]);
      if (d) return { date: d, lineIndex: j };
    }
  }
  return null;
}

// ─── Section / block helpers ──────────────────────────────────────────────────

// Lines that start a new section and should stop block collection
const SECTION_BOUNDARIES = [
  /^route\s+\w/i,                           // Route Pickup, Route Delivery, …
  /^(?:pickup|collection|loading)(?:\s+(?:address|point|location|date))?$/i,
  /^(?:delivery|unloading|destination)(?:\s+(?:address|point|location|date))?$/i,
  /^page\s+\d/i,
];

function isSectionBoundary(line) {
  return SECTION_BOUNDARIES.some(re => re.test(line));
}

// Collect lines after the first line matching any of headerRes, stopping at the next section boundary
function getSectionLines(lines, ...headerRes) {
  for (let i = 0; i < lines.length; i++) {
    if (!headerRes.some(re => re.test(lines[i]))) continue;
    const result = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (isSectionBoundary(lines[j])) break;
      result.push(lines[j]);
    }
    return result;
  }
  return [];
}

// Extract "HH:MM - HH:MM" or single "HH:MM" from block lines
function parseTimeFromBlock(blockLines) {
  for (const ln of blockLines) {
    const tm = ln.match(/[-–]?\s*(\d{1,2}:\d{2})(?:\s+[-–]?\s*(\d{1,2}:\d{2}))?/);
    if (tm) return tm[2] ? `${tm[1]} - ${tm[2]}` : tm[1];
  }
  return "";
}

// Known country names (extend as needed)
const COUNTRY_RE = /^(netherlands|the netherlands|germany|deutschland|poland|polska|lithuania|lietuva|latvia|estonia|eesti|sweden|sverige|finland|suomi|belgium|belgique|belgi[eë]|france|united kingdom|uk|england|czech republic|czechia|slovakia|hungary|romania|austria|schweiz|switzerland|denmark|norge|norway|spain|espa[nñ]a|italy|italia|portugal|ukraine|belarus|luxembourg)$/i;

// Parse a Route Pickup / Route Delivery block into address components
function parseAddressBlock(blockLines) {
  const r = { company: "", street: "", city: "", postalCode: "", country: "", contact: "" };
  for (const ln of blockLines) {
    if (!ln || parseDate(ln)) continue;                         // skip date lines
    if (/^[-–]?\s*\d{1,2}:\d{2}/.test(ln)) continue;          // skip time lines
    const ctLabel = ln.match(/^contact(?:\s*(?:person|name))?\s*[:\-]\s*(.+)$/i);
    if (ctLabel) { r.contact = r.contact || ctLabel[1].trim(); continue; }
    if (COUNTRY_RE.test(ln.trim())) { r.country = r.country || ln.trim(); continue; }
    // Line containing a postal code: "94101 Klaipeda" / "3542 AK Utrecht" / "12345 Berlin"
    const postalM = ln.match(/\b(\d{4,5}(?:[- ]?[A-Z]{2})?)\b/i);
    if (postalM && !r.postalCode) {
      r.postalCode = postalM[1];
      const rest = ln.replace(postalM[0], "").replace(/[,\s]+/g, " ").trim();
      if (rest && !r.city) r.city = rest;
      continue;
    }
    // Street: digit present + company already captured
    if (/\d/.test(ln) && r.company && !r.street) { r.street = ln; continue; }
    if (!r.company) { r.company = ln; continue; }
    if (!r.city && !/\d/.test(ln)) { r.city = ln; continue; }
    if (!r.contact && !/\d/.test(ln)) { r.contact = ln; }
  }
  return r;
}

// ─── VINs ─────────────────────────────────────────────────────────────────────

// Standard VIN: 17 chars, alphanumeric, no I / O / Q
function extractVinNumbers(text) {
  const matches = text.toUpperCase().match(/\b[A-HJ-NPR-Z0-9]{17}\b/g) || [];
  return [...new Set(matches)];
}

// ─── Price ────────────────────────────────────────────────────────────────────

// EU: 1.850,00 → 1850.00    US: 1,850.00 → 1850.00    850,00 → 850.00
function normalizeNumberFormat(raw) {
  if (!raw) return "";
  const s = raw.replace(/\s/g, "");
  if (s.includes(".") && s.includes(",")) {
    // whichever comes last is the decimal separator
    return s.lastIndexOf(",") > s.lastIndexOf(".")
      ? s.replace(/\./g, "").replace(",", ".")   // EU
      : s.replace(/,/g, "");                      // US
  }
  if (s.includes(",") && !s.includes(".")) {
    // comma with ≤2 trailing digits → decimal; otherwise thousands separator
    return /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  }
  return s;
}

function parsePrice(compact) {
  // Priority 1 — explicit "Total" line
  const totalM = compact.match(
    /(?:total|totaal|gesamt|somme|total\s+price)\s*:?\s*€?\s*([0-9][0-9.,]*[0-9])\s*(?:eur|€)?/i
  );
  if (totalM) return normalizeNumberFormat(totalM[1]);
  // Priority 2 — unit × price: "1.0 x € 1.850,00"
  const unitM = compact.match(
    /\b\d+(?:[.,]\d+)?\s*x\s*€?\s*([0-9][0-9.,]*[0-9])\s*(?:eur|€)?/i
  );
  if (unitM) return normalizeNumberFormat(unitM[1]);
  // Priority 3 — labelled freight / rate / price
  const raw = firstMatch(compact, [
    /(?:freight|rate|price|kaina|fracht|amount)\s*[:\-]?\s*€?\s*([0-9][0-9.,]*[0-9])\s*(?:eur|€)?/i,
    /(?:€|eur)\s+([0-9][0-9.,]*[0-9])/i,
    /([0-9][0-9.,]*[0-9])\s*(?:€|eur)/i,
  ]);
  return raw ? normalizeNumberFormat(raw) : "";
}

// ─── Cargo ────────────────────────────────────────────────────────────────────

function parseCargoType(compact) {
  // "7x Toyota Yaris" or "2x VW Golf" → the model part
  const nxM = compact.match(
    /\b\d+\s*x\s+([A-Za-z\xC0-ɏ][A-Za-z\xC0-ɏ0-9 \-]{3,50}?)(?=\s+VIN|\s{3,}|$)/i
  );
  if (nxM && nxM[1]) return nxM[1].trim();
  return firstMatch(compact, [
    /(?:vehicle\s+type|make\/model|cargo\s+type|goods\s+type|commodity)\s*[:\-]\s*([^\n:]{3,60}?)(?=\s{2,}|$)/i,
    /(?:cargo|goods|load|model)\s*[:\-]\s*([^\n:]{3,60}?)(?=\s{2,}|$)/i,
  ]);
}

// ─── Main entry point ─────────────────────────────────────────────────────────

function parseOrderDocumentText(rawText, clients = []) {
  const text = normalizeText(rawText);
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const compact = text.replace(/\n+/g, " ");

  // ── Order number ────────────────────────────────────────────────────────────
  const clientOrderNumber = firstMatch(compact, [
    /\bshipment\s*(?:id|no\.?|number)\s*[:\-]?\s*([A-Z0-9][\w\-\/]*)/i,
    /\btransport\s+order\s*(?:no\.?|number|#)?\s*[:\-]?\s*([A-Z0-9][\w\-\/]*)/i,
    /\breference\s*(?:id|no\.?|number)?\s*[:\-]?\s*([A-Z0-9][\w\-\/]*)/i,
    /\btour\s*(?:no\.?|number)\s*[:\-]?\s*([A-Z0-9][\w\-\/]*)/i,
    /\border\s*(?:no\.?|#|nr\.?|number)\s*[:\-]?\s*([A-Z0-9][\w\-\/]*)/i,
    /\bauftrag\s*(?:no\.?|nr\.?|number)\s*[:\-]?\s*([A-Z0-9][\w\-\/]*)/i,
    /\b(\d{3,}[-\/]\d{3,})\b/,
    /\b([A-Z]{2,5}[-\/]?\d{4,})\b/,
  ]);

  // ── Loading date — strict label match; Route Pickup block fallback ──────────
  const LOAD_DATE_RE = /^(?:collection|pickup|loading|load)\s*date\s*[:\-]?\s*(.+)$/i;
  let loadingDate = findDateInLines(lines, LOAD_DATE_RE);
  if (!loadingDate) {
    const found = (
      findDateAfterSection(lines, /^route\s+pickup$/i, 4) ||
      findDateAfterSection(lines, /^pickup$/i, 4) ||
      findDateAfterSection(lines, /^collection$/i, 4)
    );
    if (found) loadingDate = found.date;
  }

  // ── Unloading date — strict label match; Route Delivery block fallback ──────
  const UNLOAD_DATE_RE = /^(?:delivery|unloading|drop.?off)\s*date\s*[:\-]?\s*(.+)$/i;
  let unloadingDate = findDateInLines(lines, UNLOAD_DATE_RE);
  if (!unloadingDate) {
    const found = (
      findDateAfterSection(lines, /^route\s+delivery$/i, 4) ||
      findDateAfterSection(lines, /^delivery$/i, 4) ||
      findDateAfterSection(lines, /^unloading$/i, 4)
    );
    if (found) unloadingDate = found.date;
  }

  // ── Address blocks ──────────────────────────────────────────────────────────
  const pickupBlock = getSectionLines(lines,
    /^route\s+pickup$/i, /^pickup$/i, /^collection$/i, /^loading(?:\s+address)?$/i
  );
  const deliveryBlock = getSectionLines(lines,
    /^route\s+delivery$/i, /^delivery$/i, /^unloading$/i, /^destination$/i
  );

  const loadingAddr   = parseAddressBlock(pickupBlock);
  const unloadingAddr = parseAddressBlock(deliveryBlock);
  const loadingTime   = parseTimeFromBlock(pickupBlock);
  const unloadingTime = parseTimeFromBlock(deliveryBlock);

  // ── References ──────────────────────────────────────────────────────────────
  const loadingRef = findInLines(lines,
    /^(?:(?:loading|pickup)\s+)?ref(?:erence)?\s*[:\-]\s*(.+)$/i
  );
  const unloadingRef = findInLines(lines,
    /^(?:(?:delivery|unloading)\s+)?(?:ref(?:erence)?|pod)\s*[:\-]\s*(.+)$/i
  );

  // ── Vehicle execution ───────────────────────────────────────────────────────
  const truckPlate = firstMatch(compact, [
    /\btruck\s*(?:plate|no\.?|reg\.?)?\s*[:\-]\s*([A-Z0-9]+)/i,
  ]);
  const trailerPlate = firstMatch(compact, [
    /\btrailer\s*(?:plate|no\.?|reg\.?)?\s*[:\-]\s*([A-Z0-9]+)/i,
    /\bsemi\s*[:\-]\s*([A-Z0-9]+)/i,
  ]);
  const NAME_WORD = "[A-Za-z\xC0-ɏ]+";
  const driverName = firstMatch(compact, [
    new RegExp("\\bdriver\\s+name\\s*[:\\-]\\s*(" + NAME_WORD + "\\s+" + NAME_WORD + ")", "i"),
    new RegExp("\\bdriver\\s*[:\\-]\\s*(" + NAME_WORD + "\\s+" + NAME_WORD + ")", "i"),
    new RegExp("\\bvairuotojas\\s*[:\\-]\\s*(" + NAME_WORD + "\\s+" + NAME_WORD + ")", "i"),
  ]);

  // ── Contact / email / phone ─────────────────────────────────────────────────
  const clientContactName = findInLines(lines,
    /^contact(?:\s*(?:person|name))?\s*[:\-]\s*(.+)$/i
  );
  const clientEmail = firstMatch(compact, [
    /\bemail\s*:\s*([\w.+\-]+@[\w.\-]+\.[a-z]{2,})/i,
    /([\w.+\-]+@[\w.\-]+\.[a-z]{2,})/i,
  ]);
  const clientPhone = (
    findInLines(lines, /^(?:tel|phone|mob|mobile|gsm)\.?\s*[:\-]\s*(.+)$/i) ||
    findInLines(lines, /^(?:NL|DE|PL|LT|LV|EE|SE|FI|BE|FR|GB)\s+(.+)$/i) ||
    firstMatch(compact, [/\b(?:tel|phone|mob|gsm)\.?\s*[:\-]\s*([+\d][\d\s\-\(\)]{6,20})/i])
  );

  // ── Cargo ───────────────────────────────────────────────────────────────────
  const cargoType = parseCargoType(compact);

  // "7 Vehicles" directly, or count 7 rows each saying "1 Vehicles"
  const repeatedVehicleCount = (compact.match(/\b1\s*vehicles?\b/gi) || []).length;
  const quantity = firstMatch(compact, [
    /(?:qty|quantity|units?|pieces?|pcs|vnt)\s*[:\-]\s*(\d+)/i,
    /(\d+)\s*vehicles?\b/i,
    /(\d+)\s*x\s+[A-Za-z\xC0-ɏ]/i,
  ]) || (repeatedVehicleCount >= 2 ? String(repeatedVehicleCount) : "");

  const weight = firstMatch(compact, [
    /(?:weight|svoris|brutto|gross\s*weight)\s*[:\-]\s*(\d+(?:[.,]\d+)?\s*(?:kg|t|tonne?s?|tons?))/i,
    /\b(\d{3,}\s*kg)\b/i,
  ]);
  const ldm = firstMatch(compact, [
    /(?:ldm|loading\s*meters?|load\s*meters?)\s*[:\-]\s*(\d+(?:[.,]\d+)?)/i,
  ]);

  // ── VINs (17 chars, no I / O / Q) ──────────────────────────────────────────
  const vins = extractVinNumbers(text);
  const vinNumbers = vins.join("\n");

  // ── Client ──────────────────────────────────────────────────────────────────
  const clientName = firstMatch(text, [
    /(?:client|customer|užsakovas|klientas)\s*[:\-]\s*(.+)/i,
    /(?:company|įmonė)\s*[:\-]\s*(.+)/i,
  ]);
  const route = firstMatch(compact, [
    /([A-Za-z0-9 ,.\-\xC0-ɏ]+)\s*(?:→|->|-)\s*([A-Za-z0-9 ,.\-\xC0-ɏ]+)/i,
  ]);
  const clientPrice = parsePrice(compact);

  const matchedClient = clients.find(c => {
    const name = String(c.name || "").toLowerCase().trim();
    return name && compact.toLowerCase().includes(name);
  });

  return {
    clientName:    matchedClient?.name || clientName,
    clientId:      matchedClient?.id   || "",
    clientEmail,
    clientPhone,
    clientContactName,
    clientOrderNumber,
    clientPrice,
    currency:      clientPrice ? "EUR" : "",
    paymentTermDays: "",
    cargoType,
    quantity,
    weight,
    ldm,
    vinNumbers,
    loadingDate,
    loadingTime,
    loadingCompany:    loadingAddr.company,
    loadingAddress:    loadingAddr.street,
    loadingCity:       loadingAddr.city,
    loadingPostalCode: loadingAddr.postalCode,
    loadingCountry:    loadingAddr.country,
    loadingContact:    loadingAddr.contact || clientContactName,
    loadingRef,
    unloadingDate,
    unloadingTime,
    unloadingCompany:    unloadingAddr.company,
    unloadingAddress:    unloadingAddr.street,
    unloadingCity:       unloadingAddr.city,
    unloadingPostalCode: unloadingAddr.postalCode,
    unloadingCountry:    unloadingAddr.country,
    unloadingContact:    unloadingAddr.contact,
    unloadingRef,
    truckPlate,
    trailerPlate,
    driverName,
    route,
    notes:    "",
    rawText:  text,
    warnings: [],
    source:   "regex_mvp",
  };
}

module.exports = { parseOrderDocumentText };
