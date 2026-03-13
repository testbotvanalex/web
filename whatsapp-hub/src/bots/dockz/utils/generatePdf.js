// backend/src/utils/generatePdf.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Папка с DOCX-шаблонами:
// /var/www/docKZ/backend/templates
const TEMPLATE_DIR = path.join(__dirname, "../../templates");

// Папка для готовых PDF/DOCX:
// /var/www/docKZ/backend/generated
const OUTPUT_DIR = path.join(__dirname, "../../generated");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Генерация PDF из DOCX-шаблона через LibreOffice
 *
 * @param {string} templateName - имя шаблона без расширения (например "zayavlenie")
 * @param {object} data - объект с данными (bailiff_name, client_full_name и т.д.)
 * @param {string} baseName - базовое имя файла без расширения (например "zayavlenie_1765029230561")
 * @returns {Promise<string>} путь к PDF на сервере
 */
export default async function generatePDF(templateName, data, baseName) {
  console.log("📄 DOCX->PDF: start", { templateName, baseName });

  const templatePath = path.join(TEMPLATE_DIR, `${templateName}.docx`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`DOCX template not found: ${templatePath}`);
  }

  try {
    // 1) Читаем DOCX-шаблон
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    // 2) Собираем DOCX с подставленными полями
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Чтобы отсутствующие ключи не падали с ошибкой — подставляем пустую строку
    const safeData = new Proxy(data || {}, {
      get(target, prop) {
        return target[prop] ?? "";
      },
    });

    doc.setData(safeData);

    try {
      doc.render();
    } catch (e) {
      console.error("🔥 DOCX render error:", e);
      if (e.properties && e.properties.errors) {
        e.properties.errors.forEach(err => console.error(err));
      }
      throw e;
    }

    const buf = doc.getZip().generate({ type: "nodebuffer" });

    // 3) Сохраняем временный DOCX
    const docxFilename = `${baseName}.docx`;
    const docxPath = path.join(OUTPUT_DIR, docxFilename);
    fs.writeFileSync(docxPath, buf);

    console.log("📄 DOCX generated:", docxPath);

    // 4) Конвертируем LibreOffice в PDF
    console.log("🖨 Starting LibreOffice to create PDF...");

    await execFileAsync("libreoffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      OUTPUT_DIR,
      docxPath,
    ]);

    const pdfPath = path.join(OUTPUT_DIR, `${baseName}.pdf`);

    if (!fs.existsSync(pdfPath)) {
      throw new Error("PDF not created by LibreOffice");
    }

    console.log("✅ PDF created:", pdfPath);
    return pdfPath;
  } catch (err) {
    console.error("🔥 ERROR GENERATING DOCX/PDF:", err);
    throw err;
  }
}