// src/flows/notaryLookupFlow.js
// Notary lookup sub-flow: pick method -> search -> results -> confirm

const PAGE_SIZE = 10;

export function formatNotary(n) {
  const lines = [];
  lines.push("✅ Найден нотариус:");
  lines.push(n.full_name || "—");
  if (n.region) lines.push(n.region);
  if (n.address) lines.push(n.address);
  if (n.phone) lines.push(`☎️ ${n.phone}`);
  if (n.email) lines.push(`✉️ ${n.email}`);
  lines.push("");
  lines.push("Продолжаем?");
  return lines.join("\n");
}

export function slicePage(list, page) {
  const start = page * PAGE_SIZE;
  return list.slice(start, start + PAGE_SIZE);
}

export function getPageSize() {
  return PAGE_SIZE;
}
