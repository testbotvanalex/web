// src/utils/notaryDb.js
// Lightweight CSV loader + fuzzy search for notaries (no deps)

import fs from "fs";

function normalize(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripBom(s = "") {
  return String(s).replace(/^\uFEFF/, "");
}

// Very small CSV parser: supports comma/semicolon, quotes
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };

  const detectDelim = (line) => {
    let semi = 0;
    let comma = 0;
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { i++; continue; }
        inQ = !inQ;
        continue;
      }
      if (inQ) continue;
      if (ch === ';') semi++;
      else if (ch === ',') comma++;
    }
    return semi >= comma ? ';' : ',';
  };
  const delim = detectDelim(lines[0]);

  const parseLine = (line) => {
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (!inQ && ch === delim) {
        out.push(cur); cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map(v => v.trim());
  };

  const firstCols = parseLine(lines[0]);
  const normalizedHeaders = firstCols.map(h => normalize(h));

  const KNOWN_HEADERS = new Set([
    "id", "notary_id", "full_name", "fio", "фио", "name", "notary_name",
    "фамилия имя отчество", "surname", "lastname",
    "region", "город", "city", "область", "регион",
    "address", "адрес", "street", "location",
    "phone", "телефон", "mobile", "tel",
    "email", "почта", "e-mail", "mail",
  ].map(h => normalize(h)));

  const looksLikeHeader = normalizedHeaders.some(h => KNOWN_HEADERS.has(h));

  // Headerless CSV: treat every line as data
  if (!looksLikeHeader) {
    const rows = [];
    for (let i = 0; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (!cols.some(Boolean)) continue;
      rows.push(cols);
    }
    return { headers: [], rows, headerless: true };
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (!cols.some(Boolean)) continue;
    const obj = {};
    for (let c = 0; c < normalizedHeaders.length; c++) obj[normalizedHeaders[c]] = cols[c] ?? "";
    rows.push(obj);
  }

  return { headers: normalizedHeaders, rows, headerless: false };
}

function pickField(obj, candidates) {
  for (const k of candidates) {
    const nk = normalize(k);
    for (const key of Object.keys(obj)) {
      if (key === nk) return obj[key];
    }
  }
  return "";
}

function makeNotary(row, idx) {
  // Try to map from unknown column names (we support a lot)
  const id = pickField(row, ["id", "notary_id"]) || String(idx + 1);

  const full_name =
    pickField(row, ["full_name", "fio", "фио", "name", "notary_name", "фамилия имя отчество"]) ||
    pickField(row, ["surname", "lastname"]) ||
    "";

  const region =
    pickField(row, ["region", "город", "city", "область", "регион"]) || "";

  const address =
    pickField(row, ["address", "адрес", "street", "location"]) || "";

  const phone =
    pickField(row, ["phone", "телефон", "mobile", "tel"]) || "";

  const email =
    pickField(row, ["email", "почта", "e-mail", "mail"]) || "";

  return {
    id,
    full_name,
    region,
    address,
    phone,
    email,
    _n_name: normalize(full_name),
    _n_region: normalize(region),
    _n_addr: normalize(address),
  };
}

function makeNotaryFromArray(cols, idx) {
  // Expected order (common): id; full_name; iin; address; phone; email
  const id = stripBom(cols[0] ?? "") || String(idx + 1);
  const full_name = cols[1] ?? "";
  const address = cols[3] ?? "";
  const phone = cols[4] ?? "";
  const email = cols[5] ?? "";

  return {
    id,
    full_name,
    region: "",
    address,
    phone,
    email,
    _n_name: normalize(full_name),
    _n_region: "",
    _n_addr: normalize(address),
  };
}

function scoreNotary(n, q) {
  // Token-based fuzzy scoring
  if (!q) return 0;
  const tokens = q.split(" ").filter(Boolean);
  let score = 0;

  const hay = `${n._n_name} ${n._n_region} ${n._n_addr}`;
  if (hay.includes(q)) score += 50;

  for (const t of tokens) {
    if (n._n_name.startsWith(t)) score += 25;
    if (n._n_name.includes(t)) score += 15;
    if (n._n_region.includes(t)) score += 6;
    if (n._n_addr.includes(t)) score += 4;
  }

  // Prefer exact-ish full_name match
  if (n._n_name === q) score += 80;
  return score;
}

export class NotaryDb {
  constructor() {
    this.items = [];
    this.ready = false;
  }

  loadFromFile(filePath) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { rows, headerless } = parseCSV(raw);

    this.items = rows
      .map((r, i) => (headerless ? makeNotaryFromArray(r, i) : makeNotary(r, i)))
      .filter(n => n.full_name);
    this.ready = true;

    return { count: this.items.length };
  }

  search(query, limit = 50) {
    if (!this.ready) return [];
    const q = normalize(query);
    if (!q) return [];

    const scored = [];
    for (const n of this.items) {
      const s = scoreNotary(n, q);
      if (s > 0) scored.push({ n, s });
    }

    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, limit).map(x => x.n);
  }

  getById(id) {
    const sid = String(id);
    return this.items.find(x => String(x.id) === sid) || null;
  }
}
