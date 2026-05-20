function cleanText(text = "") {
  return String(text || "").replace(/\r/g, "").trim();
}

function linesOf(text = "") {
  return cleanText(text).split("\n").map(l => l.trim()).filter(Boolean);
}

function firstMatch(text, patterns) {
  for (const re of patterns) {
    const m = String(text || "").match(re);
    if (m) return (m[1] || "").trim();
  }
  return "";
}

function normalizeMoney(value = "") {
  let s = String(value || "").replace(/[^\d.,]/g, "").trim();
  if (!s) return "";

  if (s.includes(".") && s.includes(",")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n.toFixed(2) : "";
}

function parsePrice(text = "") {
  const candidates = [];
  const src = String(text || "");

  const patterns = [
    /Total\s*€?\s*([0-9][0-9.,]*)/gi,
    /€\s*([0-9][0-9.,]*)\s*(?:Total)?/gi,
    /(?:Freight|Rate|Price|Amount)[^\n€]{0,80}€?\s*([0-9][0-9.,]*)/gi,
    /\d+(?:[.,]\d+)?\s*x\s*€\s*([0-9][0-9.,]*)/gi
  ];

  for (const re of patterns) {
    let m;
    while ((m = re.exec(src)) !== null) {
      const val = normalizeMoney(m[1]);
      if (val) candidates.push(Number(val));
    }
  }

  if (!candidates.length) return "";
  return Math.max(...candidates).toFixed(2);
}

const MONTHS = {
  jan: "01", january: "01",
  feb: "02", february: "02",
  mar: "03", march: "03",
  apr: "04", april: "04",
  may: "05",
  jun: "06", june: "06",
  jul: "07", july: "07",
  aug: "08", august: "08",
  sep: "09", sept: "09", september: "09",
  oct: "10", october: "10",
  nov: "11", november: "11",
  dec: "12", december: "12"
};

function parseDate(value = "") {
  const s = String(value || "").trim();

  let m = s.match(/\b(20\d{2})[-./](\d{1,2})[-./](\d{1,2})\b/);
  if (m) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;

  m = s.match(/\b(\d{1,2})[-./](\d{1,2})[-./](20\d{2})\b/);
  if (m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;

  m = s.match(/\b([A-Za-z]+)\s+(\d{1,2}),?\s+(20\d{2})\b/);
  if (m) {
    const mm = MONTHS[m[1].toLowerCase()];
    if (mm) return `${m[3]}-${mm}-${m[2].padStart(2,"0")}`;
  }

  m = s.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})\b/);
  if (m) {
    const mm = MONTHS[m[2].toLowerCase()];
    if (mm) return `${m[3]}-${mm}-${m[1].padStart(2,"0")}`;
  }

  return "";
}

function dateAfterLabel(text, labels) {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*:?\\s*([^\\n]+)`, "i");
    const m = text.match(re);
    if (m) {
      const d = parseDate(m[1]);
      if (d) return d;
    }
  }
  return "";
}

function findBlock(lines, startLabels) {
  const startIndex = lines.findIndex(l => startLabels.some(x => new RegExp(`^${x}$`, "i").test(l)));
  if (startIndex < 0) return [];

  const stopRe = /^(Route Pickup|Pickup|Collection|Loading|Route Delivery|Delivery|Unloading|Destination|Items|Carrier|Rate|Total|TRANSPORT ORDER|TERMS AND CONDITIONS|Page \d+)/i;
  const out = [];

  for (let i = startIndex + 1; i < lines.length; i++) {
    if (out.length > 0 && stopRe.test(lines[i])) break;
    out.push(lines[i]);
    if (out.length > 18) break;
  }

  return out;
}

function parseTime(block) {
  const joined = block.join(" ");
  const m = joined.match(/\b([01]?\d|2[0-3]):([0-5]\d)\s*[-–]\s*([01]?\d|2[0-3]):([0-5]\d)\b/);
  return m ? `${m[1].padStart(2,"0")}:${m[2]} - ${m[3].padStart(2,"0")}:${m[4]}` : "";
}

function cleanAddressLine(l = "") {
  return String(l || "")
    .replace(/•/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePostal(line = "") {
  const s = String(line || "");
  const patterns = [
    /\b([A-Z]{1,2}-?\d{4,6})\b/i,
    /\b(\d{4,6})\b/
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1].trim();
  }
  return "";
}

function parseCityFromAddress(line = "") {
  const s = cleanAddressLine(line);
  if (!s) return "";

  const commaParts = s.split(",").map(x => x.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    const last = commaParts[commaParts.length - 1];
    const beforeLast = commaParts[commaParts.length - 2];
    if (/\d/.test(last)) return beforeLast.replace(/\d+/g, "").trim();
  }

  const postal = parsePostal(s);
  if (postal) {
    const before = s.split(postal)[0].trim();
    const parts = before.split(/\s+/);
    return parts.slice(-1)[0] || "";
  }

  return "";
}

function parseAddressBlock(block) {
  const useful = block
    .map(cleanAddressLine)
    .filter(l =>
      l &&
      !parseDate(l) &&
      !/\b\d{1,2}:\d{2}\b/.test(l) &&
      !/^SKODA\s*•/i.test(l) &&
      !/^IMPORTANT/i.test(l) &&
      !/^All drivers/i.test(l)
    );

  const company = useful[0] || "";
  const address = useful[1] || "";
  const postalCode = parsePostal(address);
  const city = parseCityFromAddress(address) || parseCityFromAddress(company);

  return { company, address, city, postalCode };
}

function extractVinNumbers(text = "") {
  const found = String(text || "").match(/\b[A-HJ-NPR-Z0-9]{17}\b/g) || [];
  return [...new Set(found)].join("\n");
}

function parseQuantity(text = "") {
  const rows = String(text || "").match(/\b1\s+Vehicles?\b/gi);
  if (rows && rows.length > 1) return String(rows.length);

  return firstMatch(text, [
    /\b(\d+)\s+Vehicles?\b/i,
    /\bQuantity\s*:?\s*(\d+)\b/i,
    /\bQty\s*:?\s*(\d+)\b/i,
    /\b(\d+)\s*(?:pcs|units|vnt)\b/i
  ]);
}

function parseWeight(text = "") {
  const weights = [...String(text || "").matchAll(/\b([0-9]+(?:[.,][0-9]+)?)\s*(kg|t)\b/gi)]
    .map(m => `${m[1].replace(",", ".")} ${m[2].toLowerCase()}`);
  return weights.find(w => !w.startsWith("0 ")) || weights[0] || "";
}

function parseCargoType(text = "") {
  return firstMatch(text, [
    /Items\s+([A-Z0-9][A-Z0-9\s-]{2,40}MODEL)\s*:/i,
    /\b([A-Z0-9][A-Z0-9\s-]{2,40}MODEL)\s*:/i,
    /\bCargo\s*:?\s*([^\n]+)/i,
    /\bGoods\s*:?\s*([^\n]+)/i
  ]);
}

function parseOrderDocumentText(text = "", clients = []) {
  const rawText = cleanText(text);
  const lines = linesOf(rawText);

  const loadingBlock = findBlock(lines, ["Route Pickup", "Pickup", "Collection", "Loading"]);
  const unloadingBlock = findBlock(lines, ["Route Delivery", "Delivery", "Unloading", "Destination"]);

  const loadingAddress = parseAddressBlock(loadingBlock);
  const unloadingAddress = parseAddressBlock(unloadingBlock);

  const clientName = firstMatch(rawText, [
    /\n([A-Z0-9][^\n]{2,80}(?:B\.V\.|UAB|GmbH|Sp\. z o\.o\.|S\.A\.|Ltd\.?))\n/i
  ]);

  const clientEmail = firstMatch(rawText, [
    /Email\s*:?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
    /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/i
  ]);

  const clientContactName = firstMatch(rawText, [
    /Contact\s*:?\s*([A-Za-zÀ-ž]+(?:\s+[A-Za-zÀ-ž]+){1,3})/i
  ]).replace(/\s+Email.*$/i, "").trim();

  const clientOrderNumber = firstMatch(rawText, [
    /Shipment ID\s*\n\s*([A-Z0-9-]+)/i,
    /Shipment ID\s*:?\s*([A-Z0-9-]+)/i,
    /Order\s*(?:No|Number|Nr)?\.?\s*:?\s*([A-Z0-9-]+)/i,
    /Reference\s*:?\s*([A-Z0-9-]+)/i,
    /Tour\s*(?:No|Nr)?\.?\s*:?\s*([A-Z0-9-]+)/i,
    /\b(\d{3,}-\d{3,})\b/
  ]);

  const loadingDate =
    dateAfterLabel(rawText, ["Collection date", "Pickup date", "Loading date", "Load date"]) ||
    parseDate(loadingBlock[0] || "");

  const unloadingDate =
    dateAfterLabel(rawText, ["Delivery date", "Unloading date"]) ||
    parseDate(unloadingBlock[0] || "");

  const vinNumbers = extractVinNumbers(rawText);
  const cargoType = parseCargoType(rawText);
  const quantity = parseQuantity(rawText);
  const weight = parseWeight(rawText);
  const clientPrice = parsePrice(rawText);

  const truckPlate = firstMatch(rawText, [
    /TRUCK\s*:?\s*([A-Z0-9-]+)/i,
    /Truck plate\s*:?\s*([A-Z0-9-]+)/i
  ]);

  const trailerPlate = firstMatch(rawText, [
    /TRAILER\s*:?\s*([A-Z0-9-]+)/i,
    /Trailer plate\s*:?\s*([A-Z0-9-]+)/i
  ]);

  const driverName = firstMatch(rawText, [
    /DRIVER NAME\s*:?\s*([A-Za-zÀ-ž]+(?:\s+[A-Za-zÀ-ž]+){1,3})/i,
    /Driver\s*:?\s*([A-Za-zÀ-ž]+(?:\s+[A-Za-zÀ-ž]+){1,3})/i
  ]);

  const route = [loadingAddress.city, unloadingAddress.city].filter(Boolean).join(" → ");

  const matchedClient = clients.find(c =>
    clientName && String(c.name || "").toLowerCase().includes(clientName.toLowerCase().replace(/[.,]/g, ""))
  );

  return {
    clientName: matchedClient?.name || clientName,
    clientId: matchedClient?.id || "",
    clientEmail,
    clientPhone: "",
    clientContactName,
    clientOrderNumber,
    clientPrice,
    currency: clientPrice ? "EUR" : "",
    paymentTermDays: "",
    cargoType,
    quantity,
    weight,
    ldm: "",
    pallets: "",
    vinNumbers,
    loadingDate,
    loadingTime: parseTime(loadingBlock),
    loadingCompany: loadingAddress.company,
    loadingAddress: loadingAddress.address,
    loadingCity: loadingAddress.city,
    loadingPostalCode: loadingAddress.postalCode,
    loadingCountry: "",
    loadingContact: "",
    loadingRef: "",
    unloadingDate,
    unloadingTime: parseTime(unloadingBlock),
    unloadingCompany: unloadingAddress.company,
    unloadingAddress: unloadingAddress.address,
    unloadingCity: unloadingAddress.city,
    unloadingPostalCode: unloadingAddress.postalCode,
    unloadingCountry: "",
    unloadingContact: "",
    unloadingRef: "",
    driverName,
    truckPlate,
    trailerPlate,
    route,
    notes: vinNumbers ? `VIN numeriai:\n${vinNumbers}` : "",
    rawText,
    warnings: []
  };
}

module.exports = {
  parseOrderDocumentText
};
