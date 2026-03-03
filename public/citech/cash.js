// =========================
// Config
// =========================

// номиналы, с которыми работаем
const CASH_DENOMS = [5, 10, 20, 50, 100, 200, 500];

const CASH_ITEMS = CASH_DENOMS.map((v) => ({
  value: v,
  label: "€" + v
}));

// минимальные суммы и цель по залу (в €)
// drawer = сколько примерно лежит в кассе и НЕ видно в Citech (учитываем как уже имеющееся)
const CASH_DEFAULTS = {
  nieuwpoort: {
    targetTotal: 30000,     // общая цель по залу
    drawer: 2500,           // постоянная касса, которая не видна в отчёте
    min: { 5: 500, 10: 1000, 20: 3000, 50: 0, 100: 0, 200: 0, 500: 0 }
  },
  blankenberge: {
    targetTotal: 35000,     // общая цель по залу
    drawer: 3000,           // касса не в отчёте
    min: { 5: 1500, 10: 3000, 20: 6000, 50: 0, 100: 0, 200: 0, 500: 0 }
  }
};

const HALL_LABELS_CASH = {
  nieuwpoort: "GP Nieuwpoort",
  blankenberge: "GP Blankenberge"
};

// размер пачки заказанных купюр
const NOTES_PACK_SIZE = 100;

// =========================
// Helpers
// =========================

function currentHall() {
  return document.getElementById("hall").value;
}

function toEuro(v) {
  if (v === null || v === undefined) return 0;
  const s = String(v).replace(",", ".").trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function formatMoney(amount) {
  return amount.toFixed(2).replace(".", ",");
}

function setCashStatus(text, mode) {
  if (!cashStatusEl) return;
  cashStatusEl.textContent = text;
  cashStatusEl.classList.remove("ok", "warn", "error");
  if (mode) cashStatusEl.classList.add(mode);
}

// =========================
// DOM
// =========================

const cashBodyEl = document.getElementById("cashBody");
const cashTotalsEl = document.getElementById("cashTotals");
const cashOutputEl = document.getElementById("cashOutput");

const readCashBtn = document.getElementById("readCashBtn");
const clearCashBtn = document.getElementById("clearCashBtn");
const cashGenTextBtn = document.getElementById("cashGenTextBtn");
const cashCopyBtn = document.getElementById("cashCopyBtn");
const cashPrintBtn = document.getElementById("cashPrintBtn");
const hallSelect = document.getElementById("hall");
const cashInputEl = document.getElementById("cashInput");
const cashGenCopyBtn = document.getElementById("cashGenCopyBtn");
const sampleCashBtn = document.getElementById("sampleCashBtn");
const stickyCashGenCopyBtn = document.getElementById("stickyCashGenCopyBtn");
const copyCashTableBtn = document.getElementById("copyCashTableBtn");
const cashResetAllBtn = document.getElementById("cashResetAllBtn");
const cashStatusEl = document.getElementById("cashStatus");

const CASH_STORAGE_KEY = "cash_state_v1";
const CASH_SAMPLE = `ATM cassette configuration: 2024-02-05 11:00:00
ATM Cassettes
Total: 0 0 0 0 0 0 0

Cassettes(€)
Total: 500 1500 4000 3000 0 0 0

Safe(€)
Total: 1000 2000 4000 6000 0 0 0`;

let cashRestoring = false;
let cashDebounce = null;
let lastCashTotals = { cassettes: [], safe: [] };

// =========================
// Build table
// =========================

CASH_ITEMS.forEach((item, idx) => {
  const tr = document.createElement("tr");
  tr.id = "cash_row_" + idx;
  tr.innerHTML = `
    <td>${item.label}</td>
    <td><input type="number" id="cash_goal_${idx}" min="0" step="10"></td>
    <td><input type="number" id="cash_stock_${idx}" min="0" step="10" readonly></td>
    <td><input type="text" id="cash_order_eur_${idx}" readonly></td>
    <td><input type="number" id="cash_order_units_${idx}" readonly></td>
  `;
  cashBodyEl.appendChild(tr);
});

// =========================
// Defaults per zaal
// =========================

function applyCashDefaults() {
  const hall = currentHall();
  const cfg = CASH_DEFAULTS[hall] || {};

  const targetTotal = cfg.targetTotal || 0;
  const drawerReserve = cfg.drawer || 0;
  const min = cfg.min || {};

  // Мы планируем только для ATM + сейфов:
  // цель для них = targetTotal - drawerReserve
  const effectiveTarget = Math.max(0, targetTotal - drawerReserve);

  // минимум по номиналам
  let baseTotal = 0;
  CASH_ITEMS.forEach((item, idx) => {
    const m = min[item.value] || 0;
    baseTotal += m;
    document.getElementById("cash_goal_" + idx).value = m;
  });

  // остаток до effectiveTarget отдаём на €50
  const rest = Math.max(0, effectiveTarget - baseTotal);
  const idx50 = CASH_ITEMS.findIndex((i) => i.value === 50);
  if (idx50 >= 0) {
    const cur = toEuro(document.getElementById("cash_goal_" + idx50).value);
    document.getElementById("cash_goal_" + idx50).value = cur + rest;
  }

  recalcCash();
  setCashStatus("Defaults geladen", "ok");
}

function saveCashState() {
  if (cashRestoring) return;
  const state = {
    hall: currentHall(),
    input: cashInputEl.value,
    goals: [],
    stock: []
  };

  CASH_ITEMS.forEach((_, idx) => {
    state.goals.push(toEuro(document.getElementById("cash_goal_" + idx).value));
    state.stock.push(toEuro(document.getElementById("cash_stock_" + idx).value));
  });

  localStorage.setItem(CASH_STORAGE_KEY, JSON.stringify(state));
}

function loadCashState() {
  const raw = localStorage.getItem(CASH_STORAGE_KEY);
  if (!raw) {
    applyCashDefaults();
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    applyCashDefaults();
    return;
  }

  if (data.hall && CASH_DEFAULTS[data.hall]) {
    hallSelect.value = data.hall;
  }

  applyCashDefaults();

  cashRestoring = true;
  if (Array.isArray(data.goals)) {
    CASH_ITEMS.forEach((_, idx) => {
      if (data.goals[idx] !== undefined)
        document.getElementById("cash_goal_" + idx).value = data.goals[idx];
      if (data.stock && data.stock[idx] !== undefined)
        document.getElementById("cash_stock_" + idx).value = data.stock[idx];
    });
  }
  if (typeof data.input === "string") {
    cashInputEl.value = data.input;
  }
  cashRestoring = false;
  recalcCash();
}

// =========================
// Parse Citech text
// =========================

function extractTotalsFromSection(lines, sectionLabel) {
  const result = new Array(CASH_DENOMS.length).fill(0);

  const labelLc = sectionLabel.toLowerCase();
  let startIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().startsWith(labelLc)) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) return result;

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const lc = line.toLowerCase();
    if (lc.startsWith("total:")) {
      const nums = line.match(/-?\d+/g) || [];
      for (let k = 0; k < CASH_DENOMS.length; k++) {
        result[k] = nums[k] ? +nums[k] : 0;
      }
      return result;
    }
    if (
      lc.startsWith("coins(") ||
      lc.startsWith("cassettes(") ||
      lc.startsWith("safe(") ||
      lc.startsWith("atm cassette")
    ) {
      if (!lc.startsWith(labelLc)) break;
    }
  }

  return result;
}

function readCashStock() {
  const txt = cashInputEl.value.trim();
  if (!txt) {
    alert("Plak eerst de cash-pagina uit Citech");
    setCashStatus("Geen input", "warn");
    return;
  }

  const lines = txt
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length);

  const cassettesTotals = extractTotalsFromSection(lines, "cassettes(€)");
  const safeTotals = extractTotalsFromSection(lines, "safe(€)");
  lastCashTotals = { cassettes: cassettesTotals, safe: safeTotals };

  CASH_ITEMS.forEach((item, idx) => {
    const amount =
      (cassettesTotals[idx] || 0) + (safeTotals[idx] || 0); // уже в €
    document.getElementById("cash_stock_" + idx).value = amount;
  });

  recalcCash();
  saveCashState();
  const sumDetected = [...cassettesTotals, ...safeTotals].reduce((a, b) => a + b, 0);
  if (sumDetected === 0) setCashStatus("Geen totals gevonden", "warn");
  else setCashStatus("Succesvol berekend", "ok");
}

// =========================
// Recalculate (per 100 notes)
// =========================

function recalcCash() {
  let totalOrderUnits = 0;
  let totalOrderAmount = 0;

  CASH_ITEMS.forEach((item, idx) => {
    const goal = toEuro(document.getElementById("cash_goal_" + idx).value);
    const stock = toEuro(document.getElementById("cash_stock_" + idx).value);

    let diff = goal - stock;
    if (diff < 0) diff = 0;

    let notes = 0;
    let orderAmount = 0;

    if (diff > 0 && item.value > 0) {
      const rawNeededNotes = diff / item.value;                // сколько купюр реально нужно
      const packs = Math.ceil(rawNeededNotes / NOTES_PACK_SIZE); // пачек по 100
      notes = packs * NOTES_PACK_SIZE;                         // заказ (кратно 100)
      orderAmount = notes * item.value;
    }

    const orderEurInput = document.getElementById("cash_order_eur_" + idx);
    const orderUnitsInput = document.getElementById(
      "cash_order_units_" + idx
    );

    if (notes > 0) {
      orderEurInput.value = "€ " + formatMoney(orderAmount);
      orderUnitsInput.value = notes;
    } else {
      orderEurInput.value = "";
      orderUnitsInput.value = 0;
    }

    const row = document.getElementById("cash_row_" + idx);
    row.classList.remove("row-red", "row-green", "row-amber");
    if (notes > 0) row.classList.add("row-red");
    else row.classList.add("row-green");
    if (stock === 0 && goal > 0 && (lastCashTotals.cassettes[idx] || lastCashTotals.safe[idx]) === 0) {
      row.classList.remove("row-green");
      row.classList.add("row-amber");
    }

    totalOrderUnits += notes;
    totalOrderAmount += orderAmount;
  });

  cashTotalsEl.textContent =
    `Totaal bestellen: ${totalOrderUnits} biljetten (per ${NOTES_PACK_SIZE}) / €${formatMoney(totalOrderAmount)}`;
  saveCashState();
}

// =========================
// E-mail tekst
// =========================

function generateCashText() {
  recalcCash();
  const hall = currentHall();
  const hallLabel = HALL_LABELS_CASH[hall] || hall;

  const formatEuroInt = (amount) =>
    Math.round(amount).toLocaleString("nl-NL");

  const lines = [];
  lines.push("Goeiemorgen,");
  lines.push("");
  lines.push("Zou het mogelijk zijn om het volgende te bestellen bij Brinks voor de kust?");
  lines.push("");
  lines.push(`${hallLabel}:`);

  let hasAny = false;
  let totalAmount = 0;

  CASH_ITEMS.forEach((item, idx) => {
    const notes = parseInt(
      document.getElementById("cash_order_units_" + idx).value || "0",
      10
    );
    if (notes > 0) {
      hasAny = true;
      const amount = notes * item.value;
      totalAmount += amount;
      lines.push(
        `${notes} x ${item.value} € = ${formatEuroInt(amount)} euro`
      );
    }
  });

  if (!hasAny) {
    lines.push("Geen bijbestelling nodig.");
  } else {
    lines.push("");
    lines.push(`Totaal ${hallLabel} = ${formatEuroInt(totalAmount)} euro`);
    lines.push("Geen storting");
  }

  lines.push("");
  lines.push("Dank u.");

  cashOutputEl.textContent = lines.join("\n");
  saveCashState();
}

// =========================
// Copy / print / PDF
// =========================

function copyCashText() {
  const content = cashOutputEl.textContent || "";
  if (!content) return;
  navigator.clipboard.writeText(content).then(() => {
    alert("Gekopieerd!");
  });
}

function copyCashTable() {
  const headers = ["Coupure","Gewenst (€)","Stock (€)","Order (€)","Order (biljetten)"];
  const rows = [headers.join("\t")];
  CASH_ITEMS.forEach((item, idx) => {
    const vals = [
      item.label,
      document.getElementById("cash_goal_" + idx).value,
      document.getElementById("cash_stock_" + idx).value,
      document.getElementById("cash_order_eur_" + idx).value.replace(/[€\s]/g, ""),
      document.getElementById("cash_order_units_" + idx).value
    ];
    rows.push(vals.join("\t"));
  });
  navigator.clipboard.writeText(rows.join("\n")).then(() => {
    setCashStatus("Tabel gekopieerd", "ok");
  });
}

function printCash() {
  const win = window.open("");
  win.document.write("<pre>" + (cashOutputEl.textContent || "") + "</pre>");
  win.print();
  win.close();
}

function pdfCash() {
  const content = cashOutputEl.textContent || "";
  if (!content) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  content.split("\n").forEach((line) => {
    doc.text(line, 10, y);
    y += 8;
  });
  const date = new Date().toISOString().slice(0, 10);
  const hallLabel = HALL_LABELS_CASH[currentHall()] || currentHall();
  doc.save(`geldbestelling_${hallLabel.replace(/\s+/g, "-")}_${date}.pdf`);
}

function clearCashInput() {
  cashInputEl.value = "";
  CASH_ITEMS.forEach((_, idx) => {
    document.getElementById("cash_stock_" + idx).value = 0;
    document.getElementById("cash_order_eur_" + idx).value = "";
    document.getElementById("cash_order_units_" + idx).value = 0;
  });
  recalcCash();
  saveCashState();
}

function resetCashAll() {
  localStorage.removeItem(CASH_STORAGE_KEY);
  cashInputEl.value = "";
  lastCashTotals = { cassettes: [], safe: [] };
  cashOutputEl.textContent = "";
  applyCashDefaults();
  setCashStatus("Alles gereset", "ok");
}

function applyCashSample() {
  cashInputEl.value = CASH_SAMPLE;
  readCashStock();
}

function generateCashAndCopy() {
  generateCashText();
  copyCashText();
}

function openCashWhatsApp() {
  generateCashText();
  const content = cashOutputEl.textContent || "";
  if (!content) return;
  const url = "https://wa.me/?text=" + encodeURIComponent(content);
  window.open(url, "_blank");
}

// =========================
// Events
// =========================

readCashBtn.addEventListener("click", readCashStock);
clearCashBtn.addEventListener("click", clearCashInput);
cashGenTextBtn.addEventListener("click", generateCashText);
cashGenCopyBtn.addEventListener("click", generateCashAndCopy);
cashCopyBtn.addEventListener("click", copyCashText);
cashPrintBtn.addEventListener("click", printCash);
sampleCashBtn.addEventListener("click", applyCashSample);
stickyCashGenCopyBtn.addEventListener("click", generateCashAndCopy);
copyCashTableBtn.addEventListener("click", copyCashTable);
cashResetAllBtn.addEventListener("click", resetCashAll);

cashBodyEl.addEventListener("input", (e) => {
  if (e.target && e.target.tagName === "INPUT") {
    if (e.target.type === "number" && e.target.value.includes("-")) {
      e.target.value = e.target.value.replace(/-/g, "");
    }
    recalcCash();
  }
});

hallSelect.addEventListener("change", applyCashDefaults);
cashInputEl.addEventListener("input", () => {
  if (cashDebounce) clearTimeout(cashDebounce);
  cashDebounce = setTimeout(() => {
    if (cashInputEl.value.trim()) readCashStock();
  }, 350);
});
cashInputEl.addEventListener("paste", () => {
  if (cashDebounce) clearTimeout(cashDebounce);
  cashDebounce = setTimeout(() => {
    if (cashInputEl.value.trim()) readCashStock();
  }, 200);
});

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    generateCashAndCopy();
  }
});

// init
loadCashState();