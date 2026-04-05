import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import db from "../db/index.js";
import { addDaysIso } from "../utils/time.js";

export function authenticateUser(email, password) {
  const user = db
    .prepare(
      `SELECT users.*, companies.name AS company_name
       FROM users
       JOIN companies ON companies.id = users.company_id
       WHERE users.email = ?`
    )
    .get(email);

  if (!user) return null;
  const matches = bcrypt.compareSync(password, user.password_hash);
  if (!matches) return null;
  return user;
}

export function createAuthSession(user) {
  const sessionId = randomUUID();
  const expiresAt = addDaysIso(7);

  db.prepare(
    `INSERT INTO auth_sessions (id, user_id, company_id, expires_at)
     VALUES (?, ?, ?, ?)`
  ).run(sessionId, user.id, user.company_id, expiresAt);

  return {
    id: sessionId,
    expiresAt,
  };
}

export function findAuthSession(sessionId) {
  return db
    .prepare(
      `SELECT
         auth_sessions.*,
         users.name,
         users.email,
         users.role,
         companies.name AS company_name
       FROM auth_sessions
       JOIN users ON users.id = auth_sessions.user_id
       JOIN companies ON companies.id = auth_sessions.company_id
       WHERE auth_sessions.id = ?
         AND auth_sessions.expires_at > CURRENT_TIMESTAMP`
    )
    .get(sessionId);
}

export function deleteAuthSession(sessionId) {
  db.prepare("DELETE FROM auth_sessions WHERE id = ?").run(sessionId);
}
