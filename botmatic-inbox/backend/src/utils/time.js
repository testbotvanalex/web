export function nowIso() {
  return new Date().toISOString();
}

export function addDaysIso(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
