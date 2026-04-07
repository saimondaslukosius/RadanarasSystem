const { createWorker } = require("tesseract.js");

(async () => {
  try {
    const imagePath = "C:\\Users\\saimo\\RadanarasSystem\\backend\\temp\\1775087493934-MB_TralveA_3_4a_Licencija_230907_103733-1.png";

    const zones = [
      { name: "ZONA_1", rect: { left: 300, top: 40, width: 260, height: 90 } },
      { name: "ZONA_2", rect: { left: 340, top: 40, width: 320, height: 100 } },
      { name: "ZONA_3", rect: { left: 380, top: 30, width: 260, height: 90 } },
      { name: "ZONA_4", rect: { left: 420, top: 30, width: 240, height: 90 } }
    ];

    const worker = await createWorker("eng");
    await worker.setParameters({
      tessedit_pageseg_mode: "7",
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-"
    });

    for (const z of zones) {
      const result = await worker.recognize(imagePath, { rectangle: z.rect });
      console.log(z.name + " START");
      console.log(result.data.text);
      console.log(z.name + " END");
    }

    await worker.terminate();
  } catch (e) {
    console.error("LICENSE OCR ERROR:", e.message);
  }
})();
