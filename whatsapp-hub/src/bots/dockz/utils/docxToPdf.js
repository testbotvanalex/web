import { exec } from "child_process";
import path from "path";
import fs from "fs";

export function convertDocxToPdf(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    // Создаём директорию если нет
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const command = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ LibreOffice ERROR:", stderr || error);
        return reject(new Error("LibreOffice failed"));
      }

      const fileName = path.basename(inputPath).replace(/\.docx$/i, ".pdf");
      const pdfPath = path.join(outputDir, fileName);

      // Проверяем что PDF создан
      if (!fs.existsSync(pdfPath)) {
        console.error("❌ PDF NOT FOUND:", pdfPath);
        return reject(new Error("PDF was not generated"));
      }

      console.log("📄 PDF generated:", pdfPath);
      resolve(pdfPath);
    });
  });
}