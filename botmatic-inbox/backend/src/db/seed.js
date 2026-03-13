import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import db from "./index.js";

const companyEmail = "demo@botmatic.test";
const userEmail = "owner@botmatic.test";
const password = "demo12345";

const existingCompany = db
  .prepare("SELECT id FROM companies WHERE email = ?")
  .get(companyEmail);

if (!existingCompany) {
  const companyId = randomUUID();
  const companyPasswordHash = bcrypt.hashSync(password, 10);

  db.prepare(
    `INSERT INTO companies (
      id, name, email, password_hash, phone_number_id, access_token, verify_token
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    companyId,
    "Demo Company",
    companyEmail,
    companyPasswordHash,
    "123456789012345",
    "META_ACCESS_TOKEN_PLACEHOLDER",
    "botmatic_demo_verify_token"
  );

  const userId = randomUUID();
  const userPasswordHash = bcrypt.hashSync(password, 10);

  db.prepare(
    `INSERT INTO users (id, company_id, name, email, password_hash, role)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userId, companyId, "Demo Owner", userEmail, userPasswordHash, "admin");
}

console.log("Seed complete.");
console.log(`Company login: ${userEmail}`);
console.log(`Password: ${password}`);
