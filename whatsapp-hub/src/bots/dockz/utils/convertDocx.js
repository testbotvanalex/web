import { exec } from "child_process";
import path from "path";
import fs from "fs";

export default function convertDocxToPdf(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    const cmd = `soffice --headless --convert-to pdf --outdir ${outputDir} ${inputPath}`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("LibreOffice error:", stderr);
        return reject(err);
      }

      const pdfName = path.basename(inputPath).replace(".docx", ".pdf");
      const outputPath = path.join(outputDir, pdfName);

      if (!fs.existsSync(outputPath)) {
        return reject("PDF NOT GENERATED!");
      }

      resolve(outputPath);
    });
  });
}
