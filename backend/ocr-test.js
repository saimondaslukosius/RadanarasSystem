const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const { createWorker } = require("tesseract.js");

(async () => {
  const uploadsRoot = path.join(__dirname, "uploads", "carrier");
  const carrierDirs = fs.existsSync(uploadsRoot) ? fs.readdirSync(uploadsRoot) : [];
  let latestPdf = null;
  let latestTime = 0;

  for (const dir of carrierDirs) {
    const fullDir = path.join(uploadsRoot, dir);
    const files = fs.readdirSync(fullDir).filter(f => f.toLowerCase().endsWith(".pdf"));
    for (const file of files) {
      const fullPath = path.join(fullDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.mtimeMs > latestTime) {
        latestTime = stat.mtimeMs;
        latestPdf = fullPath;
      }
    }
  }

  if (!latestPdf) {
    console.log("NERASTAS PDF");
    process.exit(0);
  }

  console.log("TEST FILE:", latestPdf);

  const buffer = fs.readFileSync(latestPdf);
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();

  console.log("PDF TEXT LENGTH:", (parsed.text || "").length);

  const worker = await createWorker("eng");
  const result = await worker.recognize(latestPdf);
  console.log("OCR TEXT START");
  console.log(result.data.text);
  console.log("OCR TEXT END");
  await worker.terminate();
})();
