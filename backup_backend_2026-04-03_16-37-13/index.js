const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const { createWorker } = require("tesseract.js");
const pdfPoppler = require("pdf-poppler");

const app = express();
app.use(cors());
app.use(express.json());

const uploadRoot = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

app.use("/uploads", express.static(uploadRoot));

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

function extractDocumentData(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();

  let number = "";
  let validUntil = "";

  const policyMatch =
    clean.match(/POLICY\s*NO\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)/i) ||
    clean.match(/Nr\.?\s*[:\-]?\s*([A-Z0-9\-\/]{4,})/i);

  if (policyMatch) {
    number = policyMatch[1].trim();
  }

  if (!number) {
    const licMatch = clean.match(/LICENCIJA\s*Nr\.?\s*([A-Z0-9\-]+)/i);
    if (licMatch) {
      number = licMatch[1].trim();
    }
  }

  const periodMatch = clean.match(/PERIOD\s*:\s*From\s*(\d{4}-\d{2}-\d{2})\s*(?:till|to|until)\s*(\d{4}-\d{2}-\d{2})/i);
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

app.post("/upload/:type/:id", upload.single("file"), async (req, res) => {
  try {
    console.log("UPLOAD HIT");

    let extracted = { number: "", validUntil: "" };

    if (req.file && req.file.filename.endsWith(".pdf")) {
      const buffer = fs.readFileSync(req.file.path);
      let parsedText = "";

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
            const pageText = content.items.map(item => item.str || "").join(" ");
            textParts.push(pageText);
          }

          parsedText = textParts.join(" ");
        } catch (e) {
          console.error("pdfjs fallback error:", e.message);
        }
      }

      if (!parsedText.trim() || parsedText.replace(/\s+/g, "").length < 80) {
        try {
          const outputDir = path.join(__dirname, "temp");
          fs.mkdirSync(outputDir, { recursive: true });

          const opts = {
            format: "png",
            out_dir: outputDir,
            out_prefix: path.basename(req.file.filename, ".pdf"),
            page: 1
          };

          opts.poppler_path = "C:\\poppler\\Library\\bin";
          await pdfPoppler.convert(req.file.path, opts);

          const imagePath = path.join(outputDir, opts.out_prefix + "-1.png");
          console.log("OCR IMAGE PATH:", imagePath);
          console.log("OCR IMAGE EXISTS:", fs.existsSync(imagePath));
          console.log("OCR IMAGE PATH:", imagePath);
          console.log("OCR IMAGE EXISTS:", fs.existsSync(imagePath));

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
      console.log("EXTRACTED:", extracted);
    }

    const fileUrl = `http://localhost:3001/uploads/${req.params.type}/${req.params.id}/${encodeURIComponent(req.file.filename)}`;

    res.json({
      alreadyExists: req.fileAlreadyExists || null,
      ok: true,
      fileName: req.file.filename,
      fileUrl,
      extracted
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.listen(3001, () => {
  console.log("Server started on http://localhost:3001");
});















