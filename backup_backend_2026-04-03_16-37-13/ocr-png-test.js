const { createWorker } = require("tesseract.js");

(async () => {
  try {
    const worker = await createWorker("lit+eng");
    const result = await worker.recognize("C:\\Users\\saimo\\RadanarasSystem\\backend\\temp\\license_test-1.png");
    console.log("OCR TEXT START");
    console.log(result.data.text);
    console.log("OCR TEXT END");
    await worker.terminate();
  } catch (e) {
    console.error("OCR ERROR:", e.message);
  }
})();
