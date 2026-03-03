// labels
const HALL_LABELS = {
  nieuwpoort: "GP Nieuwpoort",
  blankenberge: "GP Blankenberge"
};

// lijst van dranken
const DRINKS = [
  { key: "Carlsberg 0%", short: "Carlsberg" },
  { key: "Coca Cola",     short: "Cola" },
  { key: "Coca Zero",     short: "Zero" },
  { key: "Eau gaz",       short: "Bruis" },
  { key: "Eau plate",     short: "Plat" },
  { key: "Fanta Orange",  short: "Fanta" },
  { key: "FuzeTea Peach", short: "Fuze-tea" },
  { key: "Liefmans 0%",   short: "Liefmans" },
  { key: "MM Ace",        short: "Ace" },
  { key: "MM Orange",     short: "Orange" },
  { key: "Nalu",          short: "Nalu" },
  { key: "Red Bull",      short: "Red Bull" },
  { key: "Sprite",        short: "Sprite" }
];

// zaal defaults
const HALL_DEFAULTS = {
  nieuwpoort: {
    "Carlsberg 0%": { gewenst: 72,  bar: 16 },
    "Coca Cola":    { gewenst: 336, bar: 30 },
    "Coca Zero":    { gewenst: 336, bar: 18 },
    "Eau gaz":      { gewenst: 336, bar: 18 },
    "Eau plate":    { gewenst: 336, bar: 15 },
    "Fanta Orange": { gewenst: 120, bar: 18 },
    "FuzeTea Peach":{ gewenst: 72,  bar: 10 },
    "Liefmans 0%":  { gewenst: 72,  bar: 12 },
    "MM Ace":       { gewenst: 48,  bar: 5 },
    "Nalu":         { gewenst: 72,  bar: 10 },
    "Red Bull":     { gewenst: 72,  bar: 15 },
    "Sprite":       { gewenst: 72,  bar: 18 }
  },

  blankenberge: {
    "Carlsberg 0%": { gewenst: 72,  bar: 10 },
    "Coca Cola":    { gewenst: 336, bar: 36 },
    "Coca Zero":    { gewenst: 336, bar: 36 },
    "Eau gaz":      { gewenst: 336, bar: 24 },
    "Eau plate":    { gewenst: 336, bar: 24 },
    "Fanta Orange": { gewenst: 120, bar: 10 },
    "FuzeTea Peach":{ gewenst: 72,  bar: 5 },
    "Liefmans 0%":  { gewenst: 72,  bar: 10 },
    "MM Ace":       { gewenst: 48,  bar: 5 },
    "MM Orange":    { gewenst: 48,  bar: 5 },
    "Nalu":         { gewenst: 72,  bar: 5 },
    "Red Bull":     { gewenst: 72,  bar: 10 },
    "Sprite":       { gewenst: 72,  bar: 10 }
  }
};

const BOTTLES_PER_BAK = 24;

const hallEl = document.getElementById("hall");
const bodyEl = document.getElementById("calcBody");
const totalsEl = document.getElementById("totals");
const stockInputEl = document.getElementById("stockInput");

// buttons
const readStockBtn = document.getElementById("readStockBtn");
const genTextBtn = document.getElementById("genTextBtn");
const genCopyBtn = document.getElementById("genCopyBtn");
const copyBtn = document.getElementById("copyBtn");
const printBtn = document.getElementById("printBtn");
const clearStockBtn = document.getElementById("clearStockBtn");
const resetDefaultsBtn = document.getElementById("resetDefaultsBtn");
const sampleStockBtn = document.getElementById("sampleStockBtn");
const stickyGenCopyBtn = document.getElementById("stickyGenCopyBtn");
const copyTableBtn = document.getElementById("copyTableBtn");
const resetAllBtn = document.getElementById("resetAllBtn");
const stockStatusEl = document.getElementById("stockStatus");

const STORAGE_KEY = "drink_state_v1";
const SAMPLE_STOCK = `2024-02-05 11:00:00
Carlsberg 0% 0 0 24
Coca Cola 0 0 120
Coca Zero 0 0 96
Eau gaz 0 0 144
Eau plate 0 0 132
Fanta Orange 0 0 36
FuzeTea Peach 0 0 12
Liefmans 0% 0 0 24
MM Ace 0 0 6
MM Orange 0 0 12
Nalu 0 0 24
Red Bull 0 0 48
Sprite 0 0 24`;

let isRestoring = false;
let stockDebounce = null;
let lastFound = [];

// build table
DRINKS.forEach((d, idx) => {
  const row = document.createElement("tr");
  row.id = "row_" + idx;
  row.innerHTML = `
    <td>${d.short}</td>
    <td><input type="number" id="gew_${idx}" min="0" readonly class="readonly-input"></td>
    <td><input type="number" id="bar_${idx}" min="0" readonly class="readonly-input"></td>
    <td><input type="number" id="stock_${idx}" min="0" value="0"></td>
    <td><input type="number" id="achterfl_${idx}" readonly></td>
    <td><input type="number" id="achterbak_${idx}" readonly></td>
    <td><input type="number" id="rest_${idx}" readonly></td>
    <td><input type="number" id="bestel_${idx}" readonly></td>
  `;
  bodyEl.appendChild(row);
});

function currentHall() {
  return hallEl.value;
}

function toInt(v) {
  const n = parseInt(v || "0", 10);
  return isNaN(n) ? 0 : n;
}

function saveState() {
  if (isRestoring) return;
  const state = {
    hall: currentHall(),
    stockInput: stockInputEl.value,
    gew: [],
    bar: [],
    stock: []
  };

  DRINKS.forEach((_, idx) => {
    state.gew.push(toInt(document.getElementById("gew_" + idx).value));
    state.bar.push(toInt(document.getElementById("bar_" + idx).value));
    state.stock.push(toInt(document.getElementById("stock_" + idx).value));
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    applyDefaults();
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    applyDefaults();
    return;
  }

  if (data.hall && HALL_DEFAULTS[data.hall]) {
    hallEl.value = data.hall;
  }

  applyDefaults();

  isRestoring = true;
  if (Array.isArray(data.gew)) {
    DRINKS.forEach((_, idx) => {
      if (data.gew[idx] !== undefined)
        document.getElementById("gew_" + idx).value = data.gew[idx];
      if (data.bar[idx] !== undefined)
        document.getElementById("bar_" + idx).value = data.bar[idx];
      if (data.stock[idx] !== undefined)
        document.getElementById("stock_" + idx).value = data.stock[idx];
    });
  }
  if (typeof data.stockInput === "string") {
    stockInputEl.value = data.stockInput;
  }
  isRestoring = false;
  recalc();
}

// apply defaults
function applyDefaults() {
  const defs = HALL_DEFAULTS[currentHall()];
  DRINKS.forEach((d, idx) => {
    const def = defs[d.key];
    if (def) {
      document.getElementById("gew_" + idx).value = def.gewenst;
      document.getElementById("bar_" + idx).value = def.bar;
    } else {
      document.getElementById("gew_" + idx).value = "";
      document.getElementById("bar_" + idx).value = "";
    }
    document.getElementById("stock_" + idx).value = 0;
    document.getElementById("achterfl_" + idx).value = 0;
    document.getElementById("achterbak_" + idx).value = 0;
    document.getElementById("rest_" + idx).value = 0;
    document.getElementById("bestel_" + idx).value = 0;
  });
  recalc();
  saveState();
  updateStatus("defaults geladen", "ok");
}

hallEl.addEventListener("change", applyDefaults);

// STOCK parsing
function readStock(silent = false) {
  const txt = stockInputEl.value.trim();
  if (!txt) {
    if (!silent) alert("Plak eerst de STOCK actuel");
    updateStatus("Geen input", "warn");
    return;
  }

  const lines = txt.split(/\r?\n/).map((l) => l.trim());

  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const matchKey = (line, key) => {
    const ln = normalize(line);
    const k = normalize(key);
    if (ln.includes(k)) return true;
    const tokens = k.split(" ");
    return tokens.every((t) => ln.includes(t));
  };

  const isTimestamp = (l) =>
    /\d{4}-\d{2}-\d{2}/.test(l) || /\d{2}:\d{2}:\d{2}/.test(l);

  lastFound = [];
  DRINKS.forEach((d, idx) => {
    let val = 0;
    let found = false;
    for (const line of lines) {
      if (matchKey(line, d.key)) {
        found = true;
        const nums = (line.match(/-?\d+/g) || []).map((x) => +x);
        if (nums.length >= 1) {
          if (isTimestamp(line)) {
            val = nums[nums.length - 1]; // resultaat
          } else if (nums.length >= 3) {
            val = nums[2];
          } else {
            val = nums[nums.length - 1];
          }
        }
        break;
      }
    }
    document.getElementById("stock_" + idx).value = val;
    lastFound[idx] = found;
  });

  recalc();
  saveState();
  const okCount = lastFound.filter(Boolean).length;
  if (okCount === 0) updateStatus("Geen regels herkend", "warn");
  else if (okCount < DRINKS.length) updateStatus(`Gedeeltelijk (${okCount}/${DRINKS.length})`, "warn");
  else updateStatus("Succesvol berekend", "ok");
}

// recalculatie
function recalc() {
  let total = 0;

  DRINKS.forEach((d, idx) => {
    const gewenst = toInt(document.getElementById("gew_" + idx).value);
    const bar = toInt(document.getElementById("bar_" + idx).value);
    const stock = toInt(document.getElementById("stock_" + idx).value);

    // alles achter bar
    let achterTotaal = stock - bar;
    if (achterTotaal < 0) achterTotaal = 0;

    const achterBakken = Math.floor(achterTotaal / BOTTLES_PER_BAK);
    const restFlessen = achterTotaal % BOTTLES_PER_BAK;

    const voorraadBakken = Math.floor(stock / BOTTLES_PER_BAK);
    const gewenstBakken = Math.ceil(gewenst / BOTTLES_PER_BAK || 0);
    const bestelBakken = Math.max(0, gewenstBakken - voorraadBakken);

    document.getElementById("achterfl_" + idx).value = achterTotaal;
    document.getElementById("achterbak_" + idx).value = achterBakken;
    document.getElementById("rest_" + idx).value = restFlessen;
    document.getElementById("bestel_" + idx).value = bestelBakken;

    const row = document.getElementById("row_" + idx);
    row.classList.remove("row-red", "row-orange", "row-green", "row-amber");

    if (bestelBakken > 0) row.classList.add("row-red");
    else if (achterBakken === 0 && restFlessen === 0) row.classList.add("row-orange");
    else row.classList.add("row-green");

    if (lastFound[idx] === false) {
      row.classList.remove("row-green");
      row.classList.add("row-amber");
    }

    total += bestelBakken;
  });

  totalsEl.textContent = `Totaal bestellen: ${total} bak(ken)`;
  saveState();
}

function generateText() {
  recalc();
  const hall = HALL_LABELS[currentHall()];
  let text = `Drankbestelling – ${hall}\n\n`;

  DRINKS.forEach((d, idx) => {
    const bestel = toInt(document.getElementById("bestel_" + idx).value);
    if (bestel > 0) text += `• ${d.short}: ${bestel} bak(ken)\n`;
  });

  document.getElementById("output").textContent = text.trim();
  saveState();
}

function copyTable() {
  const headers = [
    "Naam",
    "Gewenst (fl)",
    "Bar (fl)",
    "Stock (fl)",
    "Achter fl",
    "Achter bak",
    "Aangebroken",
    "Bestel bak"
  ];
  const rows = [headers.join("\t")];
  DRINKS.forEach((d, idx) => {
    const vals = [
      d.short,
      document.getElementById("gew_" + idx).value,
      document.getElementById("bar_" + idx).value,
      document.getElementById("stock_" + idx).value,
      document.getElementById("achterfl_" + idx).value,
      document.getElementById("achterbak_" + idx).value,
      document.getElementById("rest_" + idx).value,
      document.getElementById("bestel_" + idx).value
    ];
    rows.push(vals.join("\t"));
  });
  navigator.clipboard.writeText(rows.join("\n")).then(() => {
    updateStatus("Tabel gekopieerd", "ok");
  });
}

function copyText() {
  const content = document.getElementById("output").textContent;
  if (!content) return;
  navigator.clipboard.writeText(content).then(() => {
    alert("Gekopieerd!");
  });
}

function printList() {
  const win = window.open("");
  win.document.write(
    "<pre>" + document.getElementById("output").textContent + "</pre>"
  );
  win.print();
  win.close();
}

function exportPDF() {
  const content = document.getElementById("output").textContent || "";
  if (!content) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  content.split("\n").forEach((line) => {
    doc.text(line, 10, y);
    y += 8;
  });

  const date = new Date().toISOString().slice(0, 10);
  const hallLabel = HALL_LABELS[currentHall()] || currentHall();
  doc.save(`drankbestelling_${hallLabel.replace(/\s+/g, "-")}_${date}.pdf`);
}

function clearStockInput() {
  stockInputEl.value = "";
  DRINKS.forEach((_, idx) => {
    document.getElementById("stock_" + idx).value = 0;
    document.getElementById("achterfl_" + idx).value = 0;
    document.getElementById("achterbak_" + idx).value = 0;
    document.getElementById("rest_" + idx).value = 0;
    document.getElementById("bestel_" + idx).value = 0;
  });
  recalc();
  saveState();
}

function resetDefaults() {
  stockInputEl.value = "";
  applyDefaults();
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  stockInputEl.value = "";
  lastFound = [];
  document.getElementById("output").textContent = "";
  applyDefaults();
  updateStatus("Alles gereset", "ok");
}

function applySampleStock() {
  stockInputEl.value = SAMPLE_STOCK;
  readStock(true);
}

function generateAndCopy() {
  generateText();
  copyText();
}

function openWhatsApp() {
  generateText();
  const content = document.getElementById("output").textContent || "";
  if (!content) return;
  const url = "https://wa.me/?text=" + encodeURIComponent(content);
  window.open(url, "_blank");
}

function updateStatus(text, mode) {
  if (!stockStatusEl) return;
  stockStatusEl.textContent = text;
  stockStatusEl.classList.remove("ok", "warn", "error");
  if (mode) stockStatusEl.classList.add(mode);
}

// events
readStockBtn.addEventListener("click", () => readStock(false));
stockInputEl.addEventListener("input", () => {
  if (stockDebounce) clearTimeout(stockDebounce);
  stockDebounce = setTimeout(() => readStock(true), 350);
});
stockInputEl.addEventListener("paste", () => {
  if (stockDebounce) clearTimeout(stockDebounce);
  stockDebounce = setTimeout(() => readStock(true), 200);
});
genTextBtn.addEventListener("click", generateText);
genCopyBtn.addEventListener("click", generateAndCopy);
copyBtn.addEventListener("click", copyText);
printBtn.addEventListener("click", printList);
clearStockBtn.addEventListener("click", clearStockInput);
resetDefaultsBtn.addEventListener("click", resetDefaults);
sampleStockBtn.addEventListener("click", applySampleStock);
stickyGenCopyBtn.addEventListener("click", generateAndCopy);
copyTableBtn.addEventListener("click", copyTable);
resetAllBtn.addEventListener("click", resetAll);

bodyEl.addEventListener("input", (e) => {
  if (e.target && e.target.tagName === "INPUT") {
    if (e.target.type === "number" && e.target.value.includes("-")) {
      e.target.value = e.target.value.replace(/-/g, "");
    }
    recalc();
  }
});

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    generateAndCopy();
  }
});

// init
loadState();