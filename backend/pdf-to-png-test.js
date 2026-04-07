const fs = require("fs");
const path = require("path");
const pdfPoppler = require("pdf-poppler");

(async () => {
  const pdfPath = "C:\\Users\\saimo\\RadanarasSystem\\backend\\uploads\\carrier\\CR20260402013001\\1775087493934-MB_TralveA_3_4a_Licencija_230907_103733.pdf";
  const outputDir = "C:\\Users\\saimo\\RadanarasSystem\\backend\\temp";
  fs.mkdirSync(outputDir, { recursive: true });

  const opts = {
    format: "png",
    out_dir: outputDir,
    out_prefix: "license_test",
    page: 1,
    poppler_path: "C:\\poppler\\Library\\bin"
  };

  try {
    await pdfPoppler.convert(pdfPath, opts);
    const imagePath = path.join(outputDir, "license_test-1.png");
    console.log("PNG EXISTS:", fs.existsSync(imagePath));
    console.log("PNG PATH:", imagePath);
  } catch (e) {
    console.error("PDF->PNG ERROR:", e.message);
  }
})();
