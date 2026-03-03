(function () {
  const CASH_DENOMS = [5, 10, 20, 50, 100, 200, 500];
  const CASH_ITEMS = CASH_DENOMS.map(function (v) { return { value: v, label: '€' + v }; });
  const CASH_DEFAULTS = {
    nieuwpoort: { targetTotal: 30000, drawer: 2500, min: { 5: 500, 10: 1000, 20: 3000, 50: 0, 100: 0, 200: 0, 500: 0 } },
    blankenberge: { targetTotal: 35000, drawer: 3000, min: { 5: 1500, 10: 3000, 20: 6000, 50: 0, 100: 0, 200: 0, 500: 0 } }
  };
  const HALL_LABELS_CASH = { nieuwpoort: "GP Nieuwpoort", blankenberge: "GP Blankenberge" };
  const NOTES_PACK_SIZE = 100;
  const CASH_STORAGE_KEY = "cash_state_v1";
  const CASH_SAMPLE = `ATM cassette configuration: 2024-02-05 11:00:00\nATM Cassettes\nTotal: 0 0 0 0 0 0 0\n\nCassettes(€)\nTotal: 500 1500 4000 3000 0 0 0\n\nSafe(€)\nTotal: 1000 2000 4000 6000 0 0 0`;

  const cashBodyEl = document.getElementById('cashGrid');
  const cashTotalsEl = document.getElementById('cashTotals');
  const cashOutputEl = document.getElementById('cashOutput');
  const cashInputEl = document.getElementById('cashInput');
  const cashStatusEl = document.getElementById('cashStatus');
  const hallEl = document.getElementById('hall');

  let cashRestoring = false, cashDebounce = null;
  let lastCashTotals = { cassettes: [], safe: [] };

  function curHall() { return hallEl.value; }
  function toEuro(v) { var n = parseFloat(String(v || '0').replace(',', '.').trim()); return isNaN(n) ? 0 : n; }
  function formatMoney(a) { return a.toFixed(2).replace('.', ','); }
  function setCashStatus(text, mode) {
    if (!cashStatusEl) return;
    cashStatusEl.textContent = text;
    cashStatusEl.classList.remove('ok', 'warn', 'error');
    if (mode) cashStatusEl.classList.add(mode);
  }

  CASH_ITEMS.forEach(function (item, idx) {
    var row = document.createElement('div');
    row.id = 'cash_row_' + idx;
    row.className = 'inv-row cash-row status-ok';
    row.innerHTML = `
    <div class="inv-denom">${item.label}</div>
    <div class="inv-name">
      <span class="inv-title" id="cs-meta-${idx}" style="font-size:12px;font-weight:600;color:#94a3b8">—</span>
      <div class="inv-bar-wrap"><div class="inv-bar-fill" id="cs-bar-${idx}" style="width:0%"></div></div>
    </div>
    <div class="inv-input-wrap">
      <span class="inv-input-lbl">Doel (€)</span>
      <input type="number" id="cash_goal_${idx}" min="0" step="10">
    </div>
    <div class="inv-badge ok" id="cashbadge_${idx}">✓ OK</div>
    <input type="number" id="cash_stock_${idx}" style="display:none" readonly>
    <input type="text" id="cash_order_eur_${idx}" style="display:none" readonly>
    <input type="number" id="cash_order_units_${idx}" style="display:none" readonly>`;
    document.getElementById('cashGrid').appendChild(row);
  });

  function applyCashDefaults() {
    var cfg = CASH_DEFAULTS[curHall()] || {};
    var effectiveTarget = Math.max(0, (cfg.targetTotal || 0) - (cfg.drawer || 0));
    var min = cfg.min || {};
    var baseTotal = 0;
    CASH_ITEMS.forEach(function (item, idx) {
      var m = min[item.value] || 0; baseTotal += m;
      document.getElementById('cash_goal_' + idx).value = m;
    });
    var rest = Math.max(0, effectiveTarget - baseTotal);
    var idx50 = CASH_ITEMS.findIndex(function (i) { return i.value === 50; });
    if (idx50 >= 0) { var cur = toEuro(document.getElementById('cash_goal_' + idx50).value); document.getElementById('cash_goal_' + idx50).value = cur + rest; }
    recalcCash(); setCashStatus('Defaults geladen', 'ok');
  }

  function saveCashState() {
    if (cashRestoring) return;
    var state = { hall: curHall(), input: cashInputEl.value, goals: [], stock: [] };
    CASH_ITEMS.forEach(function (_, idx) {
      state.goals.push(toEuro(document.getElementById('cash_goal_' + idx).value));
      state.stock.push(toEuro(document.getElementById('cash_stock_' + idx).value));
    });
    localStorage.setItem(CASH_STORAGE_KEY, JSON.stringify(state));
  }

  function loadCashState() {
    var raw = localStorage.getItem(CASH_STORAGE_KEY);
    if (!raw) { applyCashDefaults(); return; }
    var data; try { data = JSON.parse(raw); } catch (e) { applyCashDefaults(); return; }
    if (data.hall && CASH_DEFAULTS[data.hall]) hallEl.value = data.hall;
    applyCashDefaults();
    cashRestoring = true;
    if (Array.isArray(data.goals)) {
      CASH_ITEMS.forEach(function (_, idx) {
        if (data.goals[idx] !== undefined) document.getElementById('cash_goal_' + idx).value = data.goals[idx];
        if (data.stock && data.stock[idx] !== undefined) document.getElementById('cash_stock_' + idx).value = data.stock[idx];
      });
    }
    if (typeof data.input === 'string') cashInputEl.value = data.input;
    cashRestoring = false; recalcCash();
  }

  function extractTotalsFromSection(lines, sectionLabel) {
    var result = new Array(CASH_DENOMS.length).fill(0);
    var labelLc = sectionLabel.toLowerCase();
    var startIdx = -1;
    for (var i = 0; i < lines.length; i++) { if (lines[i].toLowerCase().startsWith(labelLc)) { startIdx = i; break; } }
    if (startIdx === -1) return result;
    for (var i = startIdx + 1; i < lines.length; i++) {
      var lc = lines[i].toLowerCase();
      if (lc.startsWith('total:')) {
        var nums = lines[i].match(/-?\d+/g) || [];
        for (var k = 0; k < CASH_DENOMS.length; k++) result[k] = nums[k] ? +nums[k] : 0;
        return result;
      }
      if ((lc.startsWith('coins(') || lc.startsWith('cassettes(') || lc.startsWith('safe(') || lc.startsWith('atm cassette')) && !lc.startsWith(labelLc)) break;
    }
    return result;
  }

  function readCashStock() {
    var txt = cashInputEl.value.trim();
    if (!txt) { alert('Plak eerst de cash-pagina uit Citech'); setCashStatus('Geen input', 'warn'); return; }
    var lines = txt.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l.length; });
    var cassettesTotals = extractTotalsFromSection(lines, 'cassettes(€)');
    var safeTotals = extractTotalsFromSection(lines, 'safe(€)');
    lastCashTotals = { cassettes: cassettesTotals, safe: safeTotals };
    CASH_ITEMS.forEach(function (item, idx) {
      document.getElementById('cash_stock_' + idx).value = (cassettesTotals[idx] || 0) + (safeTotals[idx] || 0);
    });
    recalcCash(); saveCashState();
    var sumDetected = [...cassettesTotals, ...safeTotals].reduce(function (a, b) { return a + b; }, 0);
    if (sumDetected === 0) setCashStatus('Geen totals gevonden', 'warn');
    else setCashStatus('Succesvol berekend', 'ok');
  }

  function recalcCash() {
    var totalOrderUnits = 0, totalOrderAmount = 0;
    CASH_ITEMS.forEach(function (item, idx) {
      var goal = toEuro(document.getElementById('cash_goal_' + idx).value);
      var stock = toEuro(document.getElementById('cash_stock_' + idx).value);
      var diff = Math.max(0, goal - stock);
      var notes = 0, orderAmount = 0;
      if (diff > 0 && item.value > 0) { var packs = Math.ceil(diff / item.value / NOTES_PACK_SIZE); notes = packs * NOTES_PACK_SIZE; orderAmount = notes * item.value; }
      var oEur = document.getElementById('cash_order_eur_' + idx);
      var oUnits = document.getElementById('cash_order_units_' + idx);
      oEur.value = notes > 0 ? '€ ' + formatMoney(orderAmount) : '';
      oUnits.value = notes;
      var row = document.getElementById('cash_row_' + idx);
      var badge = document.getElementById('cashbadge_' + idx);
      var barEl = document.getElementById('cs-bar-' + idx);
      var metaEl = document.getElementById('cs-meta-' + idx);
      if (metaEl) metaEl.textContent = 'Stock: €' + formatMoney(stock) + ' / Doel: €' + formatMoney(goal);
      if (barEl && goal > 0) {
        var pct = Math.min(100, Math.round(stock / goal * 100));
        barEl.style.width = pct + '%';
        barEl.className = 'inv-bar-fill' + (pct >= 100 ? ' over' : pct < 33 ? ' crit' : pct < 66 ? ' low' : '');
      }
      row.className = 'inv-row cash-row';
      if (notes > 0) {
        row.classList.add('status-order');
        badge.className = 'inv-badge order';
        badge.textContent = notes + ' st = €' + formatMoney(orderAmount);
      } else {
        row.classList.add('status-ok');
        badge.className = 'inv-badge ok';
        badge.textContent = '✓ Voldoende';
      }
      totalOrderUnits += notes; totalOrderAmount += orderAmount;
    });
    cashTotalsEl.textContent = 'Totaal bestellen: ' + totalOrderUnits + ' biljetten (per ' + NOTES_PACK_SIZE + ') / €' + formatMoney(totalOrderAmount);
    saveCashState();
  }

  function generateCashText() {
    recalcCash();
    var hallLabel = HALL_LABELS_CASH[curHall()] || curHall();
    var lines = ['Goeiemorgen,', '', 'Zou het mogelijk zijn om het volgende te bestellen bij Brinks voor de kust?', '', hallLabel + ':'];
    var hasAny = false, totalAmount = 0;
    CASH_ITEMS.forEach(function (item, idx) {
      var notes = parseInt(document.getElementById('cash_order_units_' + idx).value || '0', 10);
      if (notes > 0) { hasAny = true; var amount = notes * item.value; totalAmount += amount; lines.push(notes + ' x ' + item.value + ' € = ' + Math.round(amount).toLocaleString('nl-NL') + ' euro'); }
    });
    if (!hasAny) lines.push('Geen bijbestelling nodig.');
    else { lines.push(''); lines.push('Totaal ' + hallLabel + ' = ' + Math.round(totalAmount).toLocaleString('nl-NL') + ' euro'); lines.push('Geen storting'); }
    lines.push(''); lines.push('Dank u.');
    cashOutputEl.textContent = lines.join('\n'); saveCashState();
  }

  function copyCashText() {
    var c = cashOutputEl.textContent || ''; if (!c) return;
    navigator.clipboard.writeText(c).then(function () { alert('Gekopieerd!'); });
  }

  function generateCashAndCopy() { generateCashText(); copyCashText(); }

  function clearCashInput() {
    cashInputEl.value = '';
    CASH_ITEMS.forEach(function (_, idx) {
      document.getElementById('cash_stock_' + idx).value = 0;
      document.getElementById('cash_order_eur_' + idx).value = '';
      document.getElementById('cash_order_units_' + idx).value = 0;
    });
    recalcCash(); saveCashState();
  }

  function resetCashAll() {
    localStorage.removeItem(CASH_STORAGE_KEY); cashInputEl.value = '';
    lastCashTotals = { cassettes: [], safe: [] }; cashOutputEl.textContent = '';
    applyCashDefaults(); setCashStatus('Alles gereset', 'ok');
  }

  document.getElementById('readCashBtn').addEventListener('click', readCashStock);
  document.getElementById('clearCashBtn').addEventListener('click', clearCashInput);
  document.getElementById('cashGenTextBtn').addEventListener('click', generateCashText);
  document.getElementById('cashGenCopyBtn').addEventListener('click', generateCashAndCopy);
  document.getElementById('cashCopyBtn').addEventListener('click', copyCashText);
  document.getElementById('cashPrintBtn').addEventListener('click', function () { var w = window.open(''); w.document.write('<pre>' + (cashOutputEl.textContent || '') + '</pre>'); w.print(); w.close(); });
  document.getElementById('sampleCashBtn').addEventListener('click', function () { cashInputEl.value = CASH_SAMPLE; readCashStock(); });
  document.getElementById('stickyCashGenCopyBtn').addEventListener('click', generateCashAndCopy);
  document.getElementById('copyCashTableBtn').addEventListener('click', function () {
    var headers = ['Coupure', 'Gewenst (€)', 'Stock (€)', 'Order (€)', 'Order (biljetten)'];
    var rows = [headers.join('\t')];
    CASH_ITEMS.forEach(function (item, idx) {
      rows.push([item.label, document.getElementById('cash_goal_' + idx).value, document.getElementById('cash_stock_' + idx).value,
      document.getElementById('cash_order_eur_' + idx).value.replace(/[€\s]/g, ''), document.getElementById('cash_order_units_' + idx).value].join('\t'));
    });
    navigator.clipboard.writeText(rows.join('\n')).then(function () { setCashStatus('Tabel gekopieerd', 'ok'); });
  });
  document.getElementById('cashResetAllBtn').addEventListener('click', resetCashAll);

  cashBodyEl.addEventListener('input', function (e) {
    if (e.target && e.target.tagName === 'INPUT') {
      if (e.target.type === 'number' && e.target.value.includes('-')) e.target.value = e.target.value.replace(/-/g, '');
      recalcCash();
    }
  });

  cashInputEl.addEventListener('paste', function () { if (cashDebounce) clearTimeout(cashDebounce); cashDebounce = setTimeout(function () { if (cashInputEl.value.trim()) readCashStock(); }, 200); });
  cashInputEl.addEventListener('input', function () { if (cashDebounce) clearTimeout(cashDebounce); cashDebounce = setTimeout(function () { if (cashInputEl.value.trim()) readCashStock(); }, 350); });

  hallEl.addEventListener('change', applyCashDefaults);
  loadCashState();
})();