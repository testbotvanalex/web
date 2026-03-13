import db from "../db/index.js";

export function findCompanyByPhoneNumberId(phoneNumberId) {
  return db
    .prepare("SELECT * FROM companies WHERE phone_number_id = ?")
    .get(phoneNumberId);
}
