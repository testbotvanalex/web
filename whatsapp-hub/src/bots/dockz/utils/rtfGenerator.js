import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export function generateDocx(templateName, data) {
  const templatesDir = "/var/www/docKZ/backend/src/templates";

  const templatePath = path.join(
    templatesDir,
    `${templateName}.docx`
  );

  console.log("📄 Using template:", templatePath);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const templateContent = fs.readFileSync(templatePath);

  const zip = new PizZip(templateContent);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.setData(data);
  doc.render();

  const buffer = doc.getZip().generate({ type: "nodebuffer" });

  const outputDocx = path.join(
    "/var/www/docKZ/backend/generated",
    `${templateName}_${Date.now()}.docx`
  );

  fs.writeFileSync(outputDocx, buffer);

  console.log("📄 DOCX saved:", outputDocx);

  return outputDocx;
}