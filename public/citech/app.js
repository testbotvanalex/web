(function () {
  const HALL_LABELS = { nieuwpoort: "GP Nieuwpoort", blankenberge: "GP Blankenberge" };
  const DRINKS = [
    { key: "Carlsberg 0%", short: "Carlsberg" }, { key: "Coca Cola", short: "Cola" }, { key: "Coca Zero", short: "Zero" },
    { key: "Eau gaz", short: "Bruis" }, { key: "Eau plate", short: "Plat" }, { key: "Fanta Orange", short: "Fanta" },
    { key: "FuzeTea Peach", short: "Fuze-tea" }, { key: "Liefmans 0%", short: "Liefmans" }, { key: "MM Ace", short: "Ace" },
    { key: "MM Orange", short: "Orange" }, { key: "Nalu", short: "Nalu" }, { key: "Red Bull", short: "Red Bull" },
    { key: "Sprite", short: "Sprite" }
  ];
  const HALL_DEFAULTS = {
    nieuwpoort: {
      "Carlsberg 0%": { gewenst: 72, bar: 16 }, "Coca Cola": { gewenst: 336, bar: 30 }, "Coca Zero": { gewenst: 336, bar: 18 },
      "Eau gaz": { gewenst: 336, bar: 18 }, "Eau plate": { gewenst: 336, bar: 15 }, "Fanta Orange": { gewenst: 120, bar: 18 },
      "FuzeTea Peach": { gewenst: 72, bar: 10 }, "Liefmans 0%": { gewenst: 72, bar: 12 }, "MM Ace": { gewenst: 48, bar: 5 },
      "Nalu": { gewenst: 72, bar: 10 }, "Red Bull": { gewenst: 72, bar: 15 }, "Sprite": { gewenst: 72, bar: 18 }
    },
    blankenberge: {
      "Carlsberg 0%": { gewenst: 72, bar: 10 }, "Coca Cola": { gewenst: 336, bar: 36 }, "Coca Zero": { gewenst: 336, bar: 36 },
      "Eau gaz": { gewenst: 336, bar: 24 }, "Eau plate": { gewenst: 336, bar: 24 }, "Fanta Orange": { gewenst: 120, bar: 10 },
      "FuzeTea Peach": { gewenst: 72, bar: 5 }, "Liefmans 0%": { gewenst: 72, bar: 10 }, "MM Ace": { gewenst: 48, bar: 5 },
      "MM Orange": { gewenst: 48, bar: 5 }, "Nalu": { gewenst: 72, bar: 5 }, "Red Bull": { gewenst: 72, bar: 10 },
      "Sprite": { gewenst: 72, bar: 10 }
    }
  };
  const BOTTLES_PER_BAK = 24;
  const STORAGE_KEY = "drink_state_v1";
  const SAMPLE_STOCK = `2024-02-05 11:00:00\nCarlsberg 0% 0 0 24\nCoca Cola 0 0 120\nCoca Zero 0 0 96\nEau gaz 0 0 144\nEau plate 0 0 132\nFanta Orange 0 0 36\nFuzeTea Peach 0 0 12\nLiefmans 0% 0 0 24\nMM Ace 0 0 6\nMM Orange 0 0 12\nNalu 0 0 24\nRed Bull 0 0 48\nSprite 0 0 24`;

  const hallEl = document.getElementById('hall');
  const bodyEl = document.getElementById('drankGrid');
  const totalsEl = document.getElementById('totals');
  const stockInputEl = document.getElementById('stockInput');
  const stockStatusEl = document.getElementById('stockStatus');

  let isRestoring = false, stockDebounce = null, lastFound = [];

  DRINKS.forEach(function (d, idx) {
    var row = document.createElement('tr');
    row.id = 'row_' + idx;
    row.innerHTML = `
      <td class="tbl-name">${d.short}</td>
      <td class="tbl-num"><span id="gew_txt_${idx}">—</span><input type="number" id="gew_${idx}" style="display:none" readonly></td>
      <td class="tbl-num"><span id="bar_txt_${idx}">—</span><input type="number" id="bar_${idx}" style="display:none" readonly></td>
      <td class="tbl-num">
        <input type="number" id="stock_${idx}" min="0" value="0" class="tbl-input">
        <span class="tbl-breakdown" id="breakdown_${idx}"></span>
      </td>
      <td class="tbl-status"><span class="tbl-badge ok" id="bestelbadge_${idx}">✓ OK</span></td>
      <input type="number" id="achterfl_${idx}" style="display:none" readonly>
      <input type="number" id="achterbak_${idx}" style="display:none" readonly>
      <input type="number" id="rest_${idx}" style="display:none" readonly>
      <input type="number" id="bestel_${idx}" style="display:none" readonly>`;
    document.getElementById('drankGrid').appendChild(row);
  });

  function curHall() { return hallEl.value; }
  function toInt(v) { var n = parseInt(v || '0', 10); return isNaN(n) ? 0 : n; }
  function updateStatus(text, mode) {
    if (!stockStatusEl) return;
    stockStatusEl.textContent = text;
    stockStatusEl.classList.remove('ok', 'warn', 'error');
    if (mode) stockStatusEl.classList.add(mode);
  }

  function saveState() {
    if (isRestoring) return;
    var state = { hall: curHall(), stockInput: stockInputEl.value, gew: [], bar: [], stock: [] };
    DRINKS.forEach(function (_, idx) {
      state.gew.push(toInt(document.getElementById('gew_' + idx).value));
      state.bar.push(toInt(document.getElementById('bar_' + idx).value));
      state.stock.push(toInt(document.getElementById('stock_' + idx).value));
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function applyDefaults() {
    var defs = HALL_DEFAULTS[curHall()];
    DRINKS.forEach(function (d, idx) {
      var def = defs[d.key];
      document.getElementById('gew_' + idx).value = def ? def.gewenst : '';
      document.getElementById('bar_' + idx).value = def ? def.bar : '';
      document.getElementById('stock_' + idx).value = 0;
      document.getElementById('achterfl_' + idx).value = 0;
      document.getElementById('achterbak_' + idx).value = 0;
      document.getElementById('rest_' + idx).value = 0;
      document.getElementById('bestel_' + idx).value = 0;
    });
    recalc(); saveState(); updateStatus('defaults geladen', 'ok');
  }

  function loadState() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { applyDefaults(); return; }
    var data; try { data = JSON.parse(raw); } catch (e) { applyDefaults(); return; }
    if (data.hall && HALL_DEFAULTS[data.hall]) hallEl.value = data.hall;
    applyDefaults();
    isRestoring = true;
    if (Array.isArray(data.gew)) {
      DRINKS.forEach(function (_, idx) {
        if (data.gew[idx] !== undefined) document.getElementById('gew_' + idx).value = data.gew[idx];
        if (data.bar[idx] !== undefined) document.getElementById('bar_' + idx).value = data.bar[idx];
        if (data.stock[idx] !== undefined) document.getElementById('stock_' + idx).value = data.stock[idx];
      });
    }
    if (typeof data.stockInput === 'string') stockInputEl.value = data.stockInput;
    isRestoring = false; recalc();
  }

  function readStock(silent) {
    var txt = stockInputEl.value.trim();
    if (!txt) { if (!silent) alert('Plak eerst de STOCK actuel'); updateStatus('Geen input', 'warn'); return; }
    var lines = txt.split(/\r?\n/).map(function (l) { return l.trim(); });
    var normalize = function (s) { return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); };
    var matchKey = function (line, key) { var ln = normalize(line), k = normalize(key); if (ln.includes(k)) return true; return k.split(' ').every(function (t) { return ln.includes(t); }); };
    var isTimestamp = function (l) { return /\d{4}-\d{2}-\d{2}/.test(l) || /\d{2}:\d{2}:\d{2}/.test(l); };
    lastFound = [];
    DRINKS.forEach(function (d, idx) {
      var val = 0, found = false;
      for (var i = 0; i < lines.length; i++) {
        if (matchKey(lines[i], d.key)) {
          found = true;
          var nums = (lines[i].match(/-?\d+/g) || []).map(function (x) { return +x; });
          if (nums.length >= 1) { val = isTimestamp(lines[i]) ? nums[nums.length - 1] : nums.length >= 3 ? nums[2] : nums[nums.length - 1]; }
          break;
        }
      }
      document.getElementById('stock_' + idx).value = val;
      lastFound[idx] = found;
    });
    recalc(); saveState();
    var okCount = lastFound.filter(Boolean).length;
    if (okCount === 0) updateStatus('Geen regels herkend', 'warn');
    else if (okCount < DRINKS.length) updateStatus('Gedeeltelijk (' + okCount + '/' + DRINKS.length + ')', 'warn');
    else updateStatus('Succesvol berekend', 'ok');
  }

  function recalc() {
    var total = 0;
    DRINKS.forEach(function (d, idx) {
      var gewenst = toInt(document.getElementById('gew_' + idx).value);
      var bar = toInt(document.getElementById('bar_' + idx).value);
      var stock = toInt(document.getElementById('stock_' + idx).value);
      var achterTotaal = Math.max(0, stock - bar);
      var achterBakken = Math.floor(achterTotaal / BOTTLES_PER_BAK);
      var restFlessen = achterTotaal % BOTTLES_PER_BAK;
      var voorraadBakken = Math.floor(stock / BOTTLES_PER_BAK);
      var gewenstBakken = Math.ceil(gewenst / BOTTLES_PER_BAK || 0);
      var bestelBakken = Math.max(0, gewenstBakken - voorraadBakken);
      document.getElementById('achterfl_' + idx).value = achterTotaal;
      document.getElementById('achterbak_' + idx).value = achterBakken;
      document.getElementById('rest_' + idx).value = restFlessen;
      document.getElementById('bestel_' + idx).value = bestelBakken;
      var gewTxt = document.getElementById('gew_txt_' + idx);
      var barTxt = document.getElementById('bar_txt_' + idx);
      if (gewTxt) gewTxt.textContent = gewenst;
      if (barTxt) barTxt.textContent = bar;
      var breakdown = document.getElementById('breakdown_' + idx);
      if (breakdown) {
        var volleBakken = Math.floor(stock / BOTTLES_PER_BAK);
        var restFl = stock % BOTTLES_PER_BAK;
        breakdown.textContent = volleBakken + ' bak' + (restFl > 0 ? ' + ' + restFl + ' fl' : '');
      }
      var row = document.getElementById('row_' + idx);
      var badge = document.getElementById('bestelbadge_' + idx);
      row.className = '';
      if (bestelBakken > 0) {
        row.className = 'tr-order';
        badge.className = 'tbl-badge order'; badge.textContent = '+' + bestelBakken + ' bak';
      } else if (achterBakken === 0 && restFlessen === 0) {
        row.className = 'tr-empty';
        badge.className = 'tbl-badge warn'; badge.textContent = '⚠ Leeg achter';
      } else {
        row.className = 'tr-ok';
        badge.className = 'tbl-badge ok'; badge.textContent = '✓ OK';
      }
      if (lastFound[idx] === false) { row.className = 'tr-warn'; badge.className = 'tbl-badge warn'; badge.textContent = '? Niet gevonden'; }
      total += bestelBakken;
    });
    totalsEl.textContent = 'Totaal bestellen: ' + total + ' bak(ken)';
    saveState();
  }

  function generateText() {
    recalc();
    var hall = HALL_LABELS[curHall()];
    var text = 'Drankbestelling – ' + hall + '\n\n';
    DRINKS.forEach(function (d, idx) { var b = toInt(document.getElementById('bestel_' + idx).value); if (b > 0) text += '• ' + d.short + ': ' + b + ' bak(ken)\n'; });
    document.getElementById('output').textContent = text.trim();
    saveState();
  }

  function copyText() {
    var c = document.getElementById('output').textContent;
    if (!c) return;
    navigator.clipboard.writeText(c).then(function () { alert('Gekopieerd!'); });
  }

  function copyTable() {
    var headers = ['Naam', 'Gewenst (fl)', 'Bar (fl)', 'Stock (fl)', 'Achter fl', 'Achter bak', 'Aangebroken', 'Bestel bak'];
    var rows = [headers.join('\t')];
    DRINKS.forEach(function (d, idx) {
      rows.push([d.short, document.getElementById('gew_' + idx).value, document.getElementById('bar_' + idx).value,
      document.getElementById('stock_' + idx).value, document.getElementById('achterfl_' + idx).value,
      document.getElementById('achterbak_' + idx).value, document.getElementById('rest_' + idx).value,
      document.getElementById('bestel_' + idx).value].join('\t'));
    });
    navigator.clipboard.writeText(rows.join('\n')).then(function () { updateStatus('Tabel gekopieerd', 'ok'); });
  }

  function generateAndCopy() { generateText(); copyText(); }
  function clearStockInput() {
    stockInputEl.value = '';
    DRINKS.forEach(function (_, idx) {
      ['stock', 'achterfl', 'achterbak', 'rest', 'bestel'].forEach(function (f) { document.getElementById(f + '_' + idx).value = 0; });
    });
    recalc(); saveState();
  }
  function resetAll() {
    localStorage.removeItem(STORAGE_KEY); stockInputEl.value = ''; lastFound = [];
    document.getElementById('output').textContent = '';
    applyDefaults(); updateStatus('Alles gereset', 'ok');
  }

  document.getElementById('readStockBtn').addEventListener('click', function () { readStock(false); });
  document.getElementById('genTextBtn').addEventListener('click', generateText);
  document.getElementById('genCopyBtn').addEventListener('click', generateAndCopy);
  document.getElementById('copyBtn').addEventListener('click', copyText);
  document.getElementById('printBtn').addEventListener('click', function () { var w = window.open(''); w.document.write('<pre>' + document.getElementById('output').textContent + '</pre>'); w.print(); w.close(); });
  document.getElementById('clearStockBtn').addEventListener('click', clearStockInput);
  document.getElementById('resetDefaultsBtn').addEventListener('click', function () { stockInputEl.value = ''; applyDefaults(); });
  document.getElementById('sampleStockBtn').addEventListener('click', function () { stockInputEl.value = SAMPLE_STOCK; readStock(true); });
  document.getElementById('stickyGenCopyBtn').addEventListener('click', generateAndCopy);
  document.getElementById('copyTableBtn').addEventListener('click', copyTable);
  document.getElementById('resetAllBtn').addEventListener('click', resetAll);

  stockInputEl.addEventListener('paste', function () { if (stockDebounce) clearTimeout(stockDebounce); stockDebounce = setTimeout(function () { readStock(true); }, 200); });
  stockInputEl.addEventListener('input', function () { if (stockDebounce) clearTimeout(stockDebounce); stockDebounce = setTimeout(function () { readStock(true); }, 350); });

  bodyEl.addEventListener('input', function (e) {
    if (e.target && e.target.tagName === 'INPUT') {
      if (e.target.type === 'number' && e.target.value.includes('-')) e.target.value = e.target.value.replace(/-/g, '');
      recalc();
    }
  });

  hallEl.addEventListener('change', applyDefaults);
  loadState();
})();