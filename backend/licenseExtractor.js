const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const { createWorker } = require("tesseract.js");
const pdfPoppler = require("pdf-poppler");

const LICENSE_PATTERN = /LIC[-\s]*([0-9A-Z]{8})[-\s]*([0-9A-Z]{4})/i;

function normalizeLicenseText(text) {
  return String(text || "")
    .toUpperCase()
    .replace(/O/g, "0")
    .replace(/S/g, "5")
    .replace(/I/g, "1");
}

function extractLicenseNumber(text) {
  const normalized = normalizeLicenseText(text);
  const match = normalized.match(LICENSE_PATTERN);

  if (!match) {
    return "";
  }

  return `LIC-${match[1]}-${match[2]}`;
}

async function extractPdfText(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();
  return parsed.text || "";
}

async function ocrFirstPage(pdfPath, tempDir) {
  fs.mkdirSync(tempDir, { recursive: true });

  const outPrefix = path.basename(pdfPath, path.extname(pdfPath));
  const opts = {
    format: "png",
    out_dir: tempDir,
    out_prefix: outPrefix,
    page: 1,
    poppler_path: "C:\\poppler\\Library\\bin"
  };

  await pdfPoppler.convert(pdfPath, opts);

  const imagePath = path.join(tempDir, `${outPrefix}-1.png`);
  const worker = await createWorker("lit+eng");

  try {
    const result = await worker.recognize(imagePath);
    return result.data.text || "";
  } finally {
    await worker.terminate();
  }
}

async function extractLicenseFromPdf(pdfPath, options = {}) {
  const tempDir = options.tempDir || path.join(__dirname, "temp");

  try {
    const pdfText = await extractPdfText(pdfPath);
    const numberFromText = extractLicenseNumber(pdfText);
    if (numberFromText) {
      return { number: numberFromText, source: "pdf-text" };
    }
  } catch (error) {
    console.error("licenseExtractor pdf-parse failed:", error.message);
  }

  try {
    const ocrText = await ocrFirstPage(pdfPath, tempDir);
    const numberFromOcr = extractLicenseNumber(ocrText);
    if (numberFromOcr) {
      return { number: numberFromOcr, source: "ocr" };
    }
  } catch (error) {
    console.error("licenseExtractor OCR failed:", error.message);
  }

  return { number: "", source: "none" };
}

module.exports = {
  extractLicenseFromPdf,
  extractLicenseNumber
};
