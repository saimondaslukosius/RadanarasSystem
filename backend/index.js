require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const { createWorker } = require("tesseract.js");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
const { parseDocument } = require("./aiParser");
const LicenseExtractorCLI = require("./cli_license_extractor");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
const dashboardRouter = require("./routes/dashboard");
app.use("/api/dashboard", dashboardRouter);

const transportRouter = require("./routes/transport");
app.use("/api/transport", transportRouter);

const dataRoot = path.join(__dirname, "data");
const dataFiles = {
  clients: path.join(dataRoot, "clients.json"),
  carriers: path.join(dataRoot, "carriers.json"),
  orders: path.join(dataRoot, "orders.json"),
  settings: path.join(dataRoot, "settings.json"),
  imports: path.join(dataRoot, "imports.json")
};

const dataDefaults = {
  clients: [],
  carriers: [],
  orders: [],
  settings: {},
  imports: []
};

function ensureJsonStorage() {
  fs.mkdirSync(dataRoot, { recursive: true });

  Object.entries(dataFiles).forEach(([bucket, filePath]) => {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(dataDefaults[bucket], null, 2));
      return;
    }

    try {
      JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      console.warn(`Invalid JSON in ${filePath}, resetting to default.`, error.message);
      fs.writeFileSync(filePath, JSON.stringify(dataDefaults[bucket], null, 2));
    }
  });
}

function readDataBucket(bucket) {
  const filePath = dataFiles[bucket];
  if (!filePath) {
    throw new Error(`Unknown data bucket: ${bucket}`);
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to read ${bucket} from ${filePath}:`, error.message);
    return dataDefaults[bucket];
  }
}

function writeDataBucket(bucket, value) {
  const filePath = dataFiles[bucket];
  if (!filePath) {
    throw new Error(`Unknown data bucket: ${bucket}`);
  }

  fs.writeFileSync(filePath, JSON.stringify(value ?? dataDefaults[bucket], null, 2));
}

ensureJsonStorage();

const uploadRoot = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

app.use("/uploads", express.static(uploadRoot));

function roundOrderNumbers(order) {
  const numericFields = ["clientPrice", "carrierPrice", "klKaina", "vezKaina", "profit", "margin"];
  const rounded = { ...order };
  numericFields.forEach(field => {
    if (rounded[field] !== undefined && rounded[field] !== null && rounded[field] !== "") {
      const val = parseFloat(rounded[field]);
      if (!isNaN(val)) rounded[field] = Math.round(val * 100) / 100;
    }
  });
  return rounded;
}

function safeName(name) {
  return String(name || "")
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_");
}

function findExistingSimilarFile(dir, originalName) {
  if (!fs.existsSync(dir)) return null;

  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext).toLowerCase();

  const files = fs.readdirSync(dir);
  return (
    files.find((file) => {
      const fileExt = path.extname(file).toLowerCase();
      const fileBase = path.basename(file, fileExt).toLowerCase();
      return fileExt === ext && fileBase.includes(base);
    }) || null
  );
}

function isTransportLicenseDocument(type) {
  return String(type || "").trim().toLowerCase() === "transporto licencija";
}

function getDocumentTitle(req) {
  const originalName = String(req?.file?.originalname || "");
  const isCarrierLicenseFile =
    req?.params?.type === "carrier" && /licencija|licenc|license/i.test(originalName);

  if (isCarrierLicenseFile) {
    return "Transporto licencija";
  }

  return (
    req?.body?.title ||
    req?.body?.name ||
    req?.body?.documentTitle ||
    req?.body?.documentName ||
    ""
  );
}

function extractDocumentData(text, priorityLicenseNumber = "") {
  const clean = String(text || "").replace(/\s+/g, " ").trim();

  let number = priorityLicenseNumber || "";
  let validUntil = "";

  const policyMatch =
    clean.match(/POLICY\s*NO\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)/i) ||
    clean.match(/Nr\.?\s*[:\-]?\s*([A-Z0-9\-\/]{4,})/i);

  if (!number && policyMatch) {
    number = policyMatch[1].trim();
  }

  if (!number) {
    const licMatch = clean.match(/LICENCIJA\s*Nr\.?\s*([A-Z0-9\-]+)/i);
    if (licMatch) {
      number = licMatch[1].trim();
    }
  }

  const periodMatch = clean.match(
    /PERIOD\s*:\s*From\s*(\d{4}-\d{2}-\d{2})\s*(?:till|to|until)\s*(\d{4}-\d{2}-\d{2})/i
  );
  if (periodMatch) {
    validUntil = periodMatch[2];
  }

  if (!validUntil) {
    const ikiMatch = clean.match(/Iki\s*(\d{4}-\d{2}-\d{2})/i);
    if (ikiMatch) {
      validUntil = ikiMatch[1];
    }
  }

  return { number, validUntil };
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.params.type;
    const id = req.params.id;

    const dir = path.join(uploadRoot, type, id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const type = req.params.type;
    const id = req.params.id;
    const dir = path.join(uploadRoot, type, id);

    const cleanOriginal = safeName(file.originalname);
    const existing = findExistingSimilarFile(dir, cleanOriginal);

    if (existing) {
      return cb(null, existing);
    }

    const unique = `${Date.now()}-${cleanOriginal}`;
    cb(null, unique);
  }
});

const upload = multer({ storage });
const licenseExtractor = new LicenseExtractorCLI();

app.get("/api/data", (req, res) => {
  try {
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      clients: readDataBucket("clients"),
      carriers: readDataBucket("carriers"),
      orders: readDataBucket("orders").map(roundOrderNumbers),
      settings: readDataBucket("settings"),
      imports: readDataBucket("imports")
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to read app data" });
  }
});

app.put("/api/data/:bucket", (req, res) => {
  try {
    const bucket = req.params.bucket;
    if (!(bucket in dataFiles)) {
      return res.status(400).json({ error: "Unknown data bucket" });
    }

    const nextValue = req.body?.data !== undefined ? req.body.data : req.body;
    const defaultValue = dataDefaults[bucket];
    const isValidShape = Array.isArray(defaultValue)
      ? Array.isArray(nextValue)
      : nextValue && typeof nextValue === "object" && !Array.isArray(nextValue);

    if (!isValidShape) {
      return res.status(400).json({ error: "Invalid data payload" });
    }

    writeDataBucket(bucket, nextValue);
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      bucket,
      filePath: dataFiles[bucket],
      data: readDataBucket(bucket)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to save app data" });
  }
});

// ── Sub-resource helpers ──────────────────────────────────────────────────────

function getCarrierSubArray(carrierId, field) {
  const carriers = readDataBucket("carriers");
  const carrier = carriers.find(c => String(c.id) === String(carrierId));
  if (!carrier) return null;
  return Array.isArray(carrier[field]) ? carrier[field] : [];
}

function addToCarrierSubArray(carrierId, field, item) {
  const carriers = readDataBucket("carriers");
  const idx = carriers.findIndex(c => String(c.id) === String(carrierId));
  if (idx === -1) return null;
  const newItem = { ...item, id: Date.now() };
  const updatedCarrier = {
    ...carriers[idx],
    [field]: [...(Array.isArray(carriers[idx][field]) ? carriers[idx][field] : []), newItem]
  };
  const updated = carriers.map((c, i) => i === idx ? updatedCarrier : c);
  writeDataBucket("carriers", updated);
  return { carrier: updatedCarrier, item: newItem };
}

function removeFromCarrierSubArray(carrierId, field, itemId) {
  const carriers = readDataBucket("carriers");
  const idx = carriers.findIndex(c => String(c.id) === String(carrierId));
  if (idx === -1) return null;
  const updatedCarrier = {
    ...carriers[idx],
    [field]: (Array.isArray(carriers[idx][field]) ? carriers[idx][field] : []).filter(x => String(x.id) !== String(itemId))
  };
  const updated = carriers.map((c, i) => i === idx ? updatedCarrier : c);
  writeDataBucket("carriers", updated);
  return { carrier: updatedCarrier };
}

function getClientSubArray(clientId, field) {
  const clients = readDataBucket("clients");
  const client = clients.find(c => String(c.id) === String(clientId));
  if (!client) return null;
  return Array.isArray(client[field]) ? client[field] : [];
}

function addToClientSubArray(clientId, field, item) {
  const clients = readDataBucket("clients");
  const idx = clients.findIndex(c => String(c.id) === String(clientId));
  if (idx === -1) return null;
  const newItem = { ...item, id: Date.now() };
  const updatedClient = {
    ...clients[idx],
    [field]: [...(Array.isArray(clients[idx][field]) ? clients[idx][field] : []), newItem]
  };
  const updated = clients.map((c, i) => i === idx ? updatedClient : c);
  writeDataBucket("clients", updated);
  return { client: updatedClient, item: newItem };
}

function removeFromClientSubArray(clientId, field, itemId) {
  const clients = readDataBucket("clients");
  const idx = clients.findIndex(c => String(c.id) === String(clientId));
  if (idx === -1) return null;
  const updatedClient = {
    ...clients[idx],
    [field]: (Array.isArray(clients[idx][field]) ? clients[idx][field] : []).filter(x => String(x.id) !== String(itemId))
  };
  const updated = clients.map((c, i) => i === idx ? updatedClient : c);
  writeDataBucket("clients", updated);
  return { client: updatedClient };
}

// ── Carrier sub-resource endpoints ───────────────────────────────────────────

// Managers (managerContacts)
app.get("/api/carriers/:id/managers", (req, res) => {
  const arr = getCarrierSubArray(req.params.id, "managerContacts");
  if (arr === null) return res.status(404).json({ error: "Carrier not found" });
  res.json(arr);
});
app.post("/api/carriers/:id/managers", (req, res) => {
  const result = addToCarrierSubArray(req.params.id, "managerContacts", req.body);
  if (!result) return res.status(404).json({ error: "Carrier not found" });
  res.json({ ok: true, item: result.item, carrier: result.carrier });
});
app.delete("/api/carriers/:id/managers/:itemId", (req, res) => {
  const result = removeFromCarrierSubArray(req.params.id, "managerContacts", req.params.itemId);
  if (!result) return res.status(404).json({ error: "Carrier not found" });
  res.json({ ok: true, carrier: result.carrier });
});

// Drivers
app.get("/api/carriers/:id/drivers", (req, res) => {
  const arr = getCarrierSubArray(req.params.id, "drivers");
  if (arr === null) return res.status(404).json({ error: "Carrier not found" });
  res.json(arr);
});
app.post("/api/carriers/:id/drivers", (req, res) => {
  const result = addToCarrierSubArray(req.params.id, "drivers", req.body);
  if (!result) return res.status(404).json({ error: "Carrier not found" });
  res.json({ ok: true, item: result.item, carrier: result.carrier });
});
app.delete("/api/carriers/:id/drivers/:itemId", (req, res) => {
  const result = removeFromCarrierSubArray(req.params.id, "drivers", req.params.itemId);
  if (!result) return res.status(404).json({ error: "Carrier not found" });
  res.json({ ok: true, carrier: result.carrier });
});

// Trucks
app.get("/api/carriers/:id/trucks", (req, res) => {
  const arr = getCarrierSubArray(req.params.id, "trucks");
  if (arr === null) return res.status(404).json({ error: "Carrier not found" });
  res.json(arr);
});
app.post("/api/carriers/:id/trucks", (req, res) => {
  const result = addToCarrierSubArray(req.params.id, "trucks", req.body);
  if (!result) return res.status(404).json({ error: "Carrier not found" });
  res.json({ ok: true, item: result.item, carrier: result.carrier });
});
app.delete("/api/carriers/:id/trucks/:itemId", (req, res) => {
  const result = removeFromCarrierSubArray(req.params.id, "trucks", req.params.itemId);
  if (!result) return res.status(404).json({ error: "Carrier not found" });
  res.json({ ok: true, carrier: result.carrier });
});

// Trailers
app.get("/api/carriers/:id/trailers", (req, res) => {
  const arr = getCarrierSubArray(req.params.id, "trailers");
  if (arr === null) return res.status(404).json({ error: "Carrier not found" });
  res.json(arr);
});
app.post("/api/carriers/:id/trailers", (req, res) => {
  const result = addToCarrierSubArray(req.params.id, "trailers", req.body);
  if (!result) return res.status(404).json({ error: "Carrier not found" });
  res.json({ ok: true, item: result.item, carrier: result.carrier });
});
app.delete("/api/carriers/:id/trailers/:itemId", (req, res) => {
  const result = removeFromCarrierSubArray(req.params.id, "trailers", req.params.itemId);
  if (!result) return res.status(404).json({ error: "Carrier not found" });
  res.json({ ok: true, carrier: result.carrier });
});

// ── Client sub-resource endpoints ────────────────────────────────────────────

app.get("/api/clients/:id/contacts", (req, res) => {
  const arr = getClientSubArray(req.params.id, "contacts");
  if (arr === null) return res.status(404).json({ error: "Client not found" });
  res.json(arr);
});
app.post("/api/clients/:id/contacts", (req, res) => {
  const result = addToClientSubArray(req.params.id, "contacts", req.body);
  if (!result) return res.status(404).json({ error: "Client not found" });
  res.json({ ok: true, item: result.item, client: result.client });
});
app.delete("/api/clients/:id/contacts/:itemId", (req, res) => {
  const result = removeFromClientSubArray(req.params.id, "contacts", req.params.itemId);
  if (!result) return res.status(404).json({ error: "Client not found" });
  res.json({ ok: true, client: result.client });
});

// ── Email ────────────────────────────────────────────────────────────────────
const { sendOrderToCarrier } = require("./emailService");

app.post("/api/email/send-order", async (req, res) => {
  try {
    const { orderId, documentHtml, toEmail } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: "orderId būtinas." });
    const result = await sendOrderToCarrier({ orderId, documentHtml, toEmail });
    res.json(result);
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/upload/:type/:id", upload.single("file"), async (req, res) => {
  try {
    console.log("UPLOAD HIT");

    let parsedText = "";
    let extracted = { number: "", validUntil: "" };
    let aiParsed = { documentType: "unknown", number: "", validUntil: "" };

    if (req.file && req.file.filename.endsWith(".pdf")) {
      const buffer = fs.readFileSync(req.file.path);
      let imagePath = "";
      let cliLicenseNumber = "";
      let cliValidUntil = "";
      const documentTitleForDetection = getDocumentTitle(req);

      console.log("REQ BODY:", req.body);
      console.log("REQ PARAMS:", req.params);
      console.log("DOCUMENT TITLE USED FOR DETECTION:", documentTitleForDetection);

      if (isTransportLicenseDocument(documentTitleForDetection)) {
        try {
          const result = await licenseExtractor.extract(req.file.path);
          cliLicenseNumber = result?.licenseNumber || "";
          cliValidUntil = result?.validUntil || "";
        } catch (e) {
          console.error("cli_license_extractor integration error:", e.message);
        }
      }

      try {
        const outputDir = path.join(__dirname, "temp");
        fs.mkdirSync(outputDir, { recursive: true });

        const outPrefix = path.join(outputDir, path.basename(req.file.filename, ".pdf"));
        const pdftoppmBin =
          process.platform === "win32"
            ? `"C:\\poppler\\Library\\bin\\pdftoppm.exe"`
            : "pdftoppm";
        await execAsync(
          `${pdftoppmBin} -r 150 -png -singlefile "${req.file.path}" "${outPrefix}"`
        );

        imagePath = `${outPrefix}.png`;
        console.log("OCR IMAGE PATH:", imagePath);
        console.log("OCR IMAGE EXISTS:", fs.existsSync(imagePath));
      } catch (e) {
        console.error("PNG setup error:", e.message);
      }

      try {
        const parser = new PDFParse({ data: buffer });
        const parsed = await parser.getText();
        parsedText = parsed.text || "";
      } catch (e) {
        console.error("PDFParse error:", e.message);
      }

      if (!parsedText.trim()) {
        try {
          const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
          const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
          const pdf = await loadingTask.promise;

          let textParts = [];
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items.map((item) => item.str || "").join(" ");
            textParts.push(pageText);
          }

          parsedText = textParts.join(" ");
        } catch (e) {
          console.error("pdfjs fallback error:", e.message);
        }
      }

      if (!parsedText.trim() || parsedText.replace(/\s+/g, "").length < 80) {
        try {
          const worker = await createWorker("lit+eng");
          const result = await worker.recognize(imagePath);
          parsedText = result.data.text || "";
          await worker.terminate();
        } catch (e) {
          console.error("OCR error:", e.message);
        }
      }

      console.log("PARSED TEXT:", parsedText);

      extracted = extractDocumentData(parsedText);
      if (cliLicenseNumber) {
        extracted.number = cliLicenseNumber;
      }
      if (!extracted.validUntil && cliValidUntil) {
        extracted.validUntil = cliValidUntil;
      }
      console.log("EXTRACTED:", extracted);
    }

    aiParsed = await parseDocument(parsedText);

    const fileUrl = `http://localhost:3001/uploads/${req.params.type}/${req.params.id}/${encodeURIComponent(req.file.filename)}`;

    res.json({
      alreadyExists: req.fileAlreadyExists || null,
      ok: true,
      fileName: req.file.filename,
      fileUrl,
      extracted,
      aiParsed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.listen(3001, () => {
  console.log("Server started on http://localhost:3001");
});






