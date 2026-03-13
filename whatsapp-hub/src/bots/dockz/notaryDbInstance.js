import path from "path";
import { NotaryDb } from "./utils/notaryDb.js";

export const notaryDb = new NotaryDb();

const NOTARIES_CSV_PATH = process.env.NOTARIES_CSV_PATH || path.resolve(process.cwd(), "notatius.csv");

try {
  const res = notaryDb.loadFromFile(NOTARIES_CSV_PATH);
  console.log(`✅ Loaded ${res.count} notaries from CSV (${NOTARIES_CSV_PATH}).`);
} catch (e) {
  console.error("❌ Failed to load notaries CSV:", e.message);
}
