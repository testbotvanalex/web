import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadTemplate(templateName) {
  if (!templateName) throw new Error("Template name is required");

  const file = templateName.endsWith(".html") ? templateName : `${templateName}.html`;

  const paths = [
    path.join(process.cwd(), "templates", file),
    path.join(process.cwd(), "storage", file),
    path.join(__dirname, "..", "..", "templates", file),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      console.log("✅ Template found:", p);
      return fs.readFileSync(p, "utf8");
    }
  }

  throw new Error(`Template not found: ${file}`);
}

export function renderTemplate(content, data = {}) {
  let html = content || "";
  for (const [key, val] of Object.entries(data)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), val ?? "");
  }
  return html;
}