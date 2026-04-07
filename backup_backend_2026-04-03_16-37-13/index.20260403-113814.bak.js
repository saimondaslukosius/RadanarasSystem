const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PDFParse } = require("pdf-parse");

const app = express();
app.use(cors());
app.use(express.json());

const uploadRoot = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

app.use("/uploads", express.static(uploadRoot));

function safeName(name) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_");
}

function findExistingSimilarFile(dir, originalName) {
  if (!fs.existsSync(dir)) return null;

  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext).toLowerCase();

  const files = fs.readdirSync(dir);
  return files.find((file) => {
    const fileExt = path.extname(file).toLowerCase();
    const fileBase = path.basename(file, fileExt).toLowerCase();
    return fileExt === ext && fileBase.includes(base);
  }) || null;
}

function extractDocumentData(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();

  let number = "";
  let validUntil = "";

  const policyMatch =
    clean.match(/POLICY\s*NO\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)/i) ||
    clean.match(/Policy\s*No\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)/i) ||
    clean.match(/Nr\.?\s*[:\-]?\s*([A-Z0-9\-\/]{4,})/i);

  if (policyMatch) {
    number = policyMatch[1].trim();
  }

  const periodMatch = clean.match(/PERIOD\s*:\s*From\s*(\d{4}[.\-\/]\d{2}[.\-\/]\d{2})\s*(?:till|to|until)\s*(\d{4}[.\-\/]\d{2}[.\-\/]\d{2})/i);
  if (periodMatch) {
    validUntil = periodMatch[2].replace(/\./g, "-").replace(/\//g, "-");
  }

  if (!validUntil) {
    const rangeMatch = clean.match(/from\s*(\d{4}[.\-\/]\d{2}[.\-\/]\d{2})\s*(?:\d{2}:\d{2}:\d{2})?\s*(?:to|till|until)\s*(\d{4}[.\-\/]\d{2}[.\-\/]\d{2})/i);
    if (rangeMatch) {
      validUntil = rangeMatch[2].replace(/\./g, "-").replace(/\//g, "-");
    }
  }

  if (!validUntil) {
    const allDates = [...clean.matchAll(/\b(20\d{2}[.\-\/]\d{2}[.\-\/]\d{2})\b/g)].map((m) =>
      m[1].replace(/\./g, "-").replace(/\//g, "-")
    );
    if (allDates.length > 0) {
      validUntil = allDates.sort().slice(-1)[0];
    }
  }

  return { number, validUntil };
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.params.type || req.body.type;
    const id = req.params.id || req.body.id;

    if (!type || !id) {
      return cb(new Error("Missing type or id"));
    }

    const dir = path.join(uploadRoot, type, id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const type = req.params.type || req.body.type;
    const id = req.params.id || req.body.id;
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

app.post("/upload/:type/:id", upload.single("file"), async (req, res) => { console.log("UPLOAD HIT");
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let extracted = {
      number: "",
      validUntil: ""
    };

    const ext = path.extname(req.file.filename).toLowerCase();
    if (ext === ".pdf") {
      try {
        const buffer = fs.readFileSync(req.file.path);
        const parser = new PDFParse({ data: buffer });
        const parsed = await parser.getText();
        console.log('=== PDF TEXT START ===');
        console.log(parsed.text);
        console.log('=== PDF TEXT END ===');
        extracted = extractDocumentData(parsed.text);
      } catch (err) {
        console.error("PDF parse error:", err.message);
      }
    }

    console.log("EXTRACTED DATA:", extracted);    const fileUrl = `http://localhost:3001/uploads/${req.params.type}/${req.params.id}/${encodeURIComponent(req.file.filename)}`;

    res.json({
      ok: true,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl,
      extracted
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Upload failed",
      details: error.message
    });
  }
});

app.listen(3001, () => {
  console.log("Server started on http://localhost:3001");
});








