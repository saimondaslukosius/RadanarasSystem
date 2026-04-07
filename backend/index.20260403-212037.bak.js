require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { PDFParse } = require("pdf-parse");
const { createWorker } = require("tesseract.js");
const pdfPoppler = require("pdf-poppler");
const { parseDocument } = require("./aiParser");

const execFileAsync = promisify(execFile);
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

function cleanLicenseOcrValue(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[O]/g, "0")
    .replace(/[S]/g, "5")
    .replace(/[I]/g, "1")
    .replace(/[^A-Z0-9-]/g, "");
}

function extractPatternLicenseNumber(value) {
  const cleaned = cleanLicenseOcrValue(value);
  const exactMatch = cleaned.match(/LIC-\d{8}-[A-Z]{4}/);
  if (exactMatch) {
    return exactMatch[0];
  }

  const broadMatch = cleaned.match(/LIC-[A-Z0-9]{8}-[A-Z0-9]{4}/);
  if (broadMatch) {
    return broadMatch[0];
  }

  return cleaned;
}

function getPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24 || buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("Invalid PNG file");
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function normalizeWord(word) {
  return String(word || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function findLicenseNumberRegion(words, imageWidth, imageHeight) {
  const wordList = Array.isArray(words) ? words : [];

  for (let i = 0; i < wordList.length; i += 1) {
    const current = wordList[i];
    const currentText = normalizeWord(current?.text);
    if (!currentText) {
      continue;
    }

    if (currentText.includes("LICENCIJANR")) {
      const x = Math.max(0, Math.floor((current.bbox?.x0 ?? current.x0 ?? 0) - 30));
      const y = Math.max(0, Math.floor((current.bbox?.y0 ?? current.y0 ?? 0) - 30));
      const right = Math.min(
        imageWidth,
        Math.floor((current.bbox?.x1 ?? current.x1 ?? 0) + imageWidth * 0.45)
      );
      const bottom = Math.min(
        imageHeight,
        Math.floor((current.bbox?.y1 ?? current.y1 ?? 0) + 60)
      );

      return {
        x,
        y,
        width: Math.max(1, right - x),
        height: Math.max(1, bottom - y)
      };
    }

    if (!currentText.includes("LICENCIJA")) {
      continue;
    }

    const currentY0 = current.bbox?.y0 ?? current.y0 ?? 0;
    const currentY1 = current.bbox?.y1 ?? current.y1 ?? 0;
    const nrWord = wordList.find((candidate, index) => {
      if (index === i) {
        return false;
      }

      const candidateText = normalizeWord(candidate?.text);
      if (!candidateText.startsWith("NR")) {
        return false;
      }

      const candidateY0 = candidate.bbox?.y0 ?? candidate.y0 ?? 0;
      const candidateY1 = candidate.bbox?.y1 ?? candidate.y1 ?? 0;
      const sameLine =
        Math.abs(candidateY0 - currentY0) < 35 || Math.abs(candidateY1 - currentY1) < 35;
      const toRight = (candidate.bbox?.x0 ?? candidate.x0 ?? 0) >= (current.bbox?.x0 ?? current.x0 ?? 0);
      return sameLine && toRight;
    });

    const anchor = nrWord || current;
    const x = Math.max(0, Math.floor((current.bbox?.x0 ?? current.x0 ?? 0) - 30));
    const y = Math.max(0, Math.floor(Math.min(currentY0, anchor.bbox?.y0 ?? anchor.y0 ?? 0) - 30));
    const right = Math.min(
      imageWidth,
      Math.floor((anchor.bbox?.x1 ?? anchor.x1 ?? 0) + imageWidth * 0.45)
    );
    const bottom = Math.min(
      imageHeight,
      Math.floor(Math.max(currentY1, anchor.bbox?.y1 ?? anchor.y1 ?? 0) + 60)
    );

    return {
      x,
      y,
      width: Math.max(1, right - x),
      height: Math.max(1, bottom - y)
    };
  }

  return null;
}

async function cropAndUpscalePng(sourcePath, targetPath, region, scale = 3) {
  const command = `
Add-Type -AssemblyName System.Drawing;
$src = '${sourcePath.replace(/'/g, "''")}';
$dst = '${targetPath.replace(/'/g, "''")}';
$x = ${Math.max(0, Math.floor(region.x))};
$y = ${Math.max(0, Math.floor(region.y))};
$w = ${Math.max(1, Math.floor(region.width))};
$h = ${Math.max(1, Math.floor(region.height))};
$scale = ${Math.max(1, Math.floor(scale))};
$image = [System.Drawing.Image]::FromFile($src);
try {
  $bitmap = New-Object System.Drawing.Bitmap ($w * $scale), ($h * $scale);
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap);
    try {
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality;
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality;
      $sourceRect = New-Object System.Drawing.Rectangle $x, $y, $w, $h;
      $destRect = New-Object System.Drawing.Rectangle 0, 0, ($w * $scale), ($h * $scale);
      $graphics.DrawImage($image, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel);
    } finally {
      $graphics.Dispose();
    }
    $bitmap.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png);
  } finally {
    $bitmap.Dispose();
  }
} finally {
  $image.Dispose();
}`;

  await execFileAsync("powershell", ["-NoProfile", "-Command", command]);
}

async function extractLicenseNumberFromPng(imagePath) {
  if (!fs.existsSync(imagePath)) {
    return "";
  }

  const { width, height } = getPngDimensions(imagePath);
  const locatorWorker = await createWorker("lit+eng");

  try {
    const locationResult = await locatorWorker.recognize(imagePath);
    const region = findLicenseNumberRegion(locationResult?.data?.words, width, height);
    if (!region) {
      return "";
    }

    const cropPath = path.join(
      path.dirname(imagePath),
      `${path.basename(imagePath, ".png")}.license-crop.png`
    );

    await cropAndUpscalePng(imagePath, cropPath, region, 3);

    const cropWorker = await createWorker("eng");
    try {
      await cropWorker.setParameters({
        tessedit_pageseg_mode: 7,
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-"
      });

      const cropResult = await cropWorker.recognize(cropPath);
      return extractPatternLicenseNumber(cropResult?.data?.text || "");
    } finally {
      await cropWorker.terminate();
    }
  } finally {
    await locatorWorker.terminate();
  }
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

app.post("/upload/:type/:id", upload.single("file"), async (req, res) => {
  try {
    console.log("UPLOAD HIT");

    let parsedText = "";
    let extracted = { number: "", validUntil: "" };
    let aiParsed = { documentType: "unknown", number: "", validUntil: "" };

    if (req.file && req.file.filename.endsWith(".pdf")) {
      const buffer = fs.readFileSync(req.file.path);
      let imagePath = "";
      let croppedLicenseNumber = "";

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

        imagePath = path.join(outputDir, `${opts.out_prefix}-1.png`);
        console.log("OCR IMAGE PATH:", imagePath);
        console.log("OCR IMAGE EXISTS:", fs.existsSync(imagePath));
        console.log("OCR IMAGE PATH:", imagePath);
        console.log("OCR IMAGE EXISTS:", fs.existsSync(imagePath));

        croppedLicenseNumber = await extractLicenseNumberFromPng(imagePath);
      } catch (e) {
        console.error("PNG crop OCR setup error:", e.message);
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

      extracted = extractDocumentData(parsedText, croppedLicenseNumber);
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

