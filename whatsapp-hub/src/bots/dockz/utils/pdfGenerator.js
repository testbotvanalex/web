// backend/src/utils/pdfGenerator.js
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к Chrome, который поставили через
// `npx puppeteer browsers install chrome`
const CHROME_PATH =
  process.env.CHROME_PATH ||
  "/root/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome";

/**
 * Генерация PDF из HTML
 * @param {string} templateName - имя шаблона (например: "vozrazhenie")
 * @param {string} html - HTML-код
 * @returns {Promise<string>} - полный путь к PDF-файлу
 */
export async function generatePDF(templateName, html) {
  const outDir = path.join(__dirname, "..", "..", "generated");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const filename = `${templateName}_${Date.now()}.pdf`;
  const filePath = path.join(outDir, filename);

  console.log("📄 Генерация PDF:", {
    chromePath: CHROME_PATH,
    outDir,
    filePath,
  });

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "20mm",
        right: "20mm",
      },
    });

    console.log("✅ PDF создан:", filePath);
    return filePath;
  } finally {
    await browser.close();
  }
}