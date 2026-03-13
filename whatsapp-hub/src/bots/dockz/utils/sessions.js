const sessions = new Map();

export function saveSession(waId) {
  const session = crypto.randomUUID();
  sessions.set(session, waId);
  return session;
}

export function getWaIdBySession(session) {
  return sessions.get(session);
}