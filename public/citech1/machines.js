// ─────────────────────────────────────────────────────────────
// machines.js  –  Sitech machine calculator (for citech1)
// Logic ported from sitech_web.html
// ─────────────────────────────────────────────────────────────

// HELPERS
function f(v) {
  const n = parseFloat(String(v || '0').replace(',', '.').replace('€', '').trim());
  return isNaN(n) ? 0 : n;
}
function eur(n) {
  return (Math.abs(n) / 100).toLocaleString('fr-BE', { minimumFractionDigits: 2 }) + ' €';
}
function eurS(n) {
  return (n > 0 ? '+' : '') + (n / 100).toLocaleString('fr-BE', { minimumFractionDigits: 2 }) + ' €';
}
function fmtVal(n) {
  return n.toLocaleString('fr-BE', { minimumFractionDigits: 2 }) + ' €';
}
function fmtDate(d) {
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}

const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4'];

// ─────────────────────────────────────────────────────────────
// PARSE  (handles both sitech website format and macro export)
// ─────────────────────────────────────────────────────────────
function parse(text) {
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^\uFEFF/, '');
  const lines = text.split('\n').filter(l => l.trim());
  if (!lines.length) throw new Error('Geen data geplakt');

  const machine = lines[0].trim();
  let hi = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Card Time') || lines[i].includes('Date\t') || lines[i].startsWith('Date\t')) {
      hi = i; break;
    }
  }
  if (hi === -1) throw new Error('Header niet gevonden.\nKopieer de hele pagina: Ctrl+A → Ctrl+C');

  const rows = [];
  for (let i = hi + 1; i < lines.length; i++) {
    const p = lines[i].split('\t');
    if (p.length < 10) continue;

    const first = p[0].trim();
    if (!first.match(/^\d{2}[/-]\d{2}[/-]\d{4}/) && !first.match(/^\d{4}-\d{2}-\d{2}/)) continue;

    // normalize date DD/MM/YYYY → YYYY-MM-DD
    let dateStr = first;
    if (first.match(/^\d{2}\/\d{2}\/\d{4}/)) {
      const [dd, mm, yyyy] = first.slice(0, 10).split('/');
      dateStr = `${yyyy}-${mm}-${dd}${first.slice(10)}`;
    }
    const dayKey = dateStr.slice(0, 10);
    const card = p[1].trim().replace(/\s/g, '');
    const value = f(p[2]);

    // Format A (sitech website): CardTime|Card|Value|Trans|Counters(datetime)|CoinIn|CoinOut|Bet|Win|...
    // Format B (macro export):   Date|Carte|ValeurCarte|CoinIn|CoinOut|Bets|Wins|CardOut|CardIn|KeyOut|BillIn
    const isSitechFormatA = p.length >= 15 && p[4] && p[4].trim().match(/^\d{4}-\d{2}-\d{2}/);

    let row = null;
    if (isSitechFormatA) {
      row = {
        day: dayKey, time: dateStr, card, value,
        coinIn: f(p[5]), coinOut: f(p[6]), bet: f(p[7]), win: f(p[8]),
        keyOut: f(p[9]), games: f(p[10]),
        cardOut: f(p[12] || 0), billIn: f(p[13] || 0),
        cardIn: f(p[14] || 0), hipayIn: f(p[15] || 0)
      };
    } else {
      row = {
        day: dayKey, time: dateStr, card, value,
        coinIn: f(p[3]), coinOut: f(p[4]), bet: f(p[5]), win: f(p[6]),
        cardOut: f(p[7]), cardIn: f(p[8]), keyOut: f(p[9]), billIn: f(p[10]),
        games: 0, hipayIn: 0
      };
    }
    rows.push(row);
  }

  if (!rows.length) throw new Error('Geen data-rijen gevonden.');
  return { machine, rows };
}

// ─────────────────────────────────────────────────────────────
// SESSION STATS
// Counters update only on card change → use nextSession.first as end
// ─────────────────────────────────────────────────────────────
function sessionStats(sess, nextSessFirstRow) {
  const F = sess[0];
  const L = sess[sess.length - 1];
  const N = nextSessFirstRow || L;

  const coinIn = N.coinIn - F.coinIn;
  const coinOut = N.coinOut - F.coinOut;
  const bet = N.bet - F.bet;
  const win = N.win - F.win;
  const cardIn = N.cardIn - F.cardIn;
  const cardOut = N.cardOut - F.cardOut;
  const billIn = N.billIn - F.billIn;
  const keyOut = N.keyOut - F.keyOut;
  const games = N.games - F.games;

  const coinIO = coinIn - coinOut;
  const betWin = bet - win;
  const reste = coinIO - betWin;
  const playerPnl = coinOut - coinIn;
  const credLeft = L.value;

  // suspicious: large CardIn with almost no bets
  const suspicious = cardIn > 5000 && Math.abs(bet) < 500;

  return {
    card: F.card, day: F.day, timeFrom: F.time, timeTo: L.time,
    trans: sess.length, games: Math.round(games),
    coinIn, coinOut, bet, win, cardIn, cardOut, billIn, keyOut,
    coinIO, betWin, reste, playerPnl, credLeft, suspicious
  };
}

// ─────────────────────────────────────────────────────────────
// GROUP SESSIONS
// Process all sessions first (so nextFirst can cross day boundary),
// then group by day.
// ─────────────────────────────────────────────────────────────
function groupRows(rows) {
  // Step 1: split all rows into sessions by card
  const allSessions = [];
  let cur = null, sess = [];
  for (const r of rows) {
    if (r.card !== cur) { if (sess.length) allSessions.push(sess); sess = []; cur = r.card; }
    sess.push(r);
  }
  if (sess.length) allSessions.push(sess);

  // Step 2: calculate stats with correct nextFirst
  const allStats = allSessions.map((s, i) => {
    const nextFirst = (i + 1 < allSessions.length) ? allSessions[i + 1][0] : null;
    return sessionStats(s, nextFirst);
  });

  // Step 3: group by day
  const byDay = {};
  for (const s of allStats) {
    if (!byDay[s.day]) byDay[s.day] = [];
    byDay[s.day].push(s);
  }

  const days = Object.keys(byDay).sort();
  return days.map(day => {
    const stats = byDay[day].filter(s => s.card !== '88888');
    const tot = {
      coinIn: stats.reduce((a, s) => a + s.coinIn, 0),
      coinOut: stats.reduce((a, s) => a + s.coinOut, 0),
      bet: stats.reduce((a, s) => a + s.bet, 0),
      win: stats.reduce((a, s) => a + s.win, 0),
      cardIn: stats.reduce((a, s) => a + s.cardIn, 0),
      cardOut: stats.reduce((a, s) => a + s.cardOut, 0),
      keyOut: stats.reduce((a, s) => a + s.keyOut, 0),
      reste: stats.reduce((a, s) => a + s.reste, 0),
      players: stats.length,
    };
    tot.coinIO = tot.coinIn - tot.coinOut;
    tot.betWin = tot.bet - tot.win;
    tot.rec2 = tot.coinIO;
    tot.diff = tot.betWin - tot.rec2;
    tot.credLeft = stats.length ? stats[stats.length - 1].credLeft : 0;
    return { day, sessions: stats, totals: tot };
  });
}

// ─────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────
let currentData = null;
let currentView = 'days';

function go() {
  const errEl = document.getElementById('machErr');
  const outEl = document.getElementById('machOut');
  errEl.style.display = 'none';
  outEl.style.display = 'none';
  try {
    const { machine, rows } = parse(document.getElementById('machInp').value);
    const days = groupRows(rows);
    currentData = { machine, rows, days };
    render(currentData, 'days');
  } catch (e) {
    errEl.textContent = '⚠ ' + e.message;
    errEl.style.display = 'block';
  }
}

function switchView(v) {
  currentView = v;
  if (currentData) render(currentData, v);
}

// ─────────────────────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────────────────────
function render({ machine, rows, days }, view) {
  const allStats = days.flatMap(d => d.sessions);
  const totalPnl = allStats.reduce((a, s) => a + s.playerPnl, 0);
  const pColor = totalPnl > 0 ? '#15803d' : totalPnl < 0 ? '#dc2626' : '#94a3b8';
  const pTxt = totalPnl > 0 ? 'Spelers wonnen' : totalPnl < 0 ? 'Machine won' : 'Nul';

  const allDays = days.map(d => d.day);
  const dateRange = allDays.length === 1
    ? fmtDate(allDays[0])
    : `${fmtDate(allDays[0])} → ${fmtDate(allDays[allDays.length - 1])}`;

  const lastDay = days[days.length - 1];
  const credLeft = lastDay.totals.credLeft;

  let html = '';

  // Machine header
  html += `
  <div class="mach-header">
    <div>
      <div class="mach-name">🎰 ${machine}</div>
      <div class="mach-date">📅 ${dateRange}</div>
    </div>
    <div class="mach-meta">
      ${days.length} dag · ${allStats.length} spelers<br>
      ${rows.filter(r => r.card !== '88888').length} transacties
    </div>
  </div>`;

  // Summary cards
  html += `
  <div class="mach-sum-row">
    <div class="mach-sum-card">
      <div class="msc-label">Totaal dagen</div>
      <div class="msc-value" style="color:#6366f1">${days.length}</div>
    </div>
    <div class="mach-sum-card">
      <div class="msc-label">Totaal spelers</div>
      <div class="msc-value" style="color:#0ea5e9">${allStats.length}</div>
    </div>
    <div class="mach-sum-card">
      <div class="msc-label">${pTxt}</div>
      <div class="msc-value" style="color:${pColor}">${eur(Math.abs(totalPnl))}</div>
    </div>
  </div>`;

  // Money banner — smart threshold: >50€ = player took card, ≤50€ = maybe stuck
  const STUCK_THRESHOLD = 50;
  const lastCard = lastDay.sessions.length ? lastDay.sessions[lastDay.sessions.length - 1].card : '';
  if (credLeft > STUCK_THRESHOLD) {
    // Large amount → player took card with credits, not stuck on machine
    html += `<div class="mach-banner mach-banner-card">
        <span class="mb-icon">💳</span>
        <div>
          <div class="mb-label">Tegoed op kaart bij sessie-einde</div>
          <div class="mb-amount">${fmtVal(credLeft)}</div>
          <div class="mb-sub">Kaart ${lastCard} — speler nam kaart mee</div>
        </div>
      </div>`;
  } else if (credLeft > 0.009) {
    // Small amount → possibly stuck on machine
    html += `<div class="mach-banner mach-banner-warn">
        <span class="mb-icon">⚠️</span>
        <div>
          <div class="mb-label">Mogelijk geld op machine!</div>
          <div class="mb-amount">${fmtVal(credLeft)}</div>
          <div class="mb-sub">Kaart ${lastCard} pakte geld mogelijk niet mee</div>
        </div>
      </div>`;
  } else {
    html += `<div class="mach-banner mach-banner-no">
        <span class="mb-icon">✅</span>
        <div>
          <div class="mb-label">Niets achtergebleven op machine</div>
          <div class="mb-amount" style="color:#94a3b8">0,00 €</div>
        </div>
      </div>`;
  }

  // 🔴 Red alert: SMALL credLeft + diff ≠ 0 (machine froze or data issue)
  const suspDays = days.filter(d => d.totals.credLeft > 0.009 && d.totals.credLeft <= STUCK_THRESHOLD && Math.abs(d.totals.diff) > 0.5);
  if (suspDays.length > 0) {
    suspDays.forEach(sd => {
      const t = sd.totals;
      html += `<div class="mach-alert-red">
        <div class="mar-icon">🔴</div>
        <div>
          <div class="mar-title">VERDACHT: geld op machine + verschil!</div>
          <div class="mar-body">
            📅 ${fmtDate(sd.day)} &nbsp;·&nbsp;
            Op machine: <b>${fmtVal(t.credLeft)}</b> &nbsp;·&nbsp;
            Verschil: <b>${eurS(t.diff)}</b>
          </div>
          <div class="mar-hint">Mogelijk: machine vastgelopen, kaart te vroeg uitgehaald of onvolledige data — controleer handmatig.</div>
        </div>
      </div>`;
    });
  }

  // View tabs
  html += `
  <div class="mach-vtabs">
    <button class="mach-vtab ${view === 'days' ? 'active' : ''}" onclick="switchView('days')">📅 Per dag</button>
    <button class="mach-vtab ${view === 'players' ? 'active' : ''}" onclick="switchView('players')">👤 Alle spelers</button>
  </div>`;

  if (view === 'days') {
    html += `<div>`;
    days.forEach((d, di) => { html += renderDay(d, di); });
    html += `</div>`;
  } else {
    html += `<div><div class="mach-section-label">ALLE SPELERS</div>`;
    let colorIdx = 0;
    allStats.forEach((s, i) => {
      html += renderPlayer(s, `P_${i}`, COLORS[colorIdx % COLORS.length]);
      if (s.card !== '88888') colorIdx++;
    });
    html += `</div>`;
  }

  const outEl = document.getElementById('machOut');
  outEl.innerHTML = html;
  outEl.style.display = 'block';
  outEl.scrollIntoView({ behavior: 'smooth' });

  // Open first day by default
  if (view === 'days') {
    setTimeout(() => {
      const el = document.getElementById('mdb0');
      if (el) {
        el.style.display = 'block';
        const ar = document.getElementById('mdtog0');
        if (ar) ar.classList.add('open');
      }
    }, 50);
  }
}

function renderDay(d, di) {
  const t = d.totals;
  const dayLabel = fmtDate(d.day);

  let html = `
  <div class="mach-day">
    <div class="mach-day-header" onclick="togDay(${di})">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="mach-day-title">📅 ${dayLabel}</div>
        <div style="font-size:12px;color:#94a3b8">${d.sessions.length} spelers</div>
      </div>
      <div style="display:flex;align-items:center;gap:20px">
        <div class="mach-day-stats">
          <div class="mds">
            <div class="mds-l">Coin In-Out</div>
            <div class="mds-v" style="color:${t.coinIO >= 0 ? '#4ade80' : '#f87171'}">${eurS(t.coinIO)}</div>
          </div>
          <div class="mds">
            <div class="mds-l">Reste</div>
            <div class="mds-v" style="color:${t.reste >= 0 ? '#4ade80' : '#f87171'}">${eurS(t.reste)}</div>
          </div>
          ${t.credLeft > 0 ? `<div class="mds"><div class="mds-l">${t.credLeft > 50 ? 'Tegoed kaart' : 'Op machine'}</div><div class="mds-v" style="color:${t.credLeft > 50 ? '#60a5fa' : '#fbbf24'}">${fmtVal(t.credLeft)}</div></div>` : ''}
        </div>
        <div class="mach-day-toggle" id="mdtog${di}">▼</div>
      </div>
    </div>
    <div class="mach-day-body" id="mdb${di}" style="display:none">
      <div class="mach-day-sum">
        <div class="mach-day-sum-cell">
          <div class="mdsc-l">Coin In / Out</div>
          <div class="mdsc-v">${eur(t.coinIn)} / ${eur(t.coinOut)}</div>
        </div>
        <div class="mach-day-sum-cell">
          <div class="mdsc-l">rec2 (Coin In-Out)</div>
          <div class="mdsc-v" style="color:${t.coinIO >= 0 ? '#15803d' : '#dc2626'}">${eurS(t.coinIO)}</div>
        </div>
        <div class="mach-day-sum-cell">
          <div class="mdsc-l">Bet-Win</div>
          <div class="mdsc-v" style="color:${t.betWin >= 0 ? '#15803d' : '#dc2626'}">${eurS(t.betWin)}</div>
        </div>
        <div class="mach-day-sum-cell">
          <div class="mdsc-l">Verschil ${Math.abs(t.diff) > 1 ? '⚠️' : ''}</div>
          <div class="mdsc-v" style="color:${Math.abs(t.diff) < 0.1 ? '#94a3b8' : Math.abs(t.diff) < 5 ? '#d97706' : '#dc2626'}">${eurS(t.diff)}</div>
        </div>
      </div>`;

  d.sessions.forEach((s, i) => {
    html += renderPlayer(s, `D${di}P${i}`, COLORS[i % COLORS.length]);
  });

  html += `</div></div>`;
  return html;
}

function renderPlayer(s, uid, color) {
  const pnl = s.playerPnl;
  let bCls, bTxt, rLbl;
  if (s.suspicious) { bCls = 'warn'; bTxt = '⚠ VERDACHT'; rLbl = 'controleren'; }
  else if (pnl > 0) { bCls = 'win'; bTxt = '+' + eur(pnl); rLbl = 'GEWONNEN'; }
  else if (pnl < 0) { bCls = 'lose'; bTxt = '-' + eur(Math.abs(pnl)); rLbl = 'VERLOREN'; }
  else { bCls = 'zero'; bTxt = '0,00 €'; rLbl = 'NUL'; }

  const tF = s.timeFrom.slice(11, 16) || s.timeFrom.slice(0, 10);
  const tT = s.timeTo.slice(11, 16) || s.timeTo.slice(0, 10);
  const init = s.card.slice(-2);
  const leftYes = s.credLeft > 0.009;

  return `
  <div class="mach-pcard">
    <div class="mach-phead" onclick="togPlayer('${uid}')">
      <div class="mach-avatar" style="background:${color}">${init}</div>
      <div class="mach-pinfo">
        <div class="mach-card-num">Kaart: ${s.card}</div>
        <div class="mach-ptime">🕐 ${tF} → ${tT} &nbsp;·&nbsp; ${s.trans} trans. &nbsp;·&nbsp; ${s.games} spellen</div>
      </div>
      <div class="mach-presult">
        <div class="mach-badge ${bCls}">${bTxt}</div>
        <div class="mach-rlabel">${rLbl}</div>
      </div>
    </div>
    <div class="mach-pdetails" id="md_${uid}">
      <div class="mach-drow">
        <div class="mach-ditem"><div class="mdi-l">Spellen</div><div class="mdi-v">${s.games}</div></div>
        <div class="mach-ditem"><div class="mdi-l">Coin In</div><div class="mdi-v">${eur(s.coinIn)}</div></div>
        <div class="mach-ditem"><div class="mdi-l">Coin Out</div><div class="mdi-v">${eur(s.coinOut)}</div></div>
        <div class="mach-ditem"><div class="mdi-l">Ставки</div><div class="mdi-v">${eur(s.bet)}</div></div>
        <div class="mach-ditem"><div class="mdi-l">Выигрыш</div><div class="mdi-v">${eur(s.win)}</div></div>
        <div class="mach-ditem"><div class="mdi-l">Card In</div><div class="mdi-v ${s.suspicious ? 'warn' : ''}">${eur(s.cardIn)}</div></div>
        <div class="mach-ditem"><div class="mdi-l">Card Out</div><div class="mdi-v">${eur(s.cardOut)}</div></div>
        <div class="mach-ditem"><div class="mdi-l">Итог игрока</div><div class="mdi-v ${pnl >= 0 ? 'pos' : 'neg'}">${eurS(pnl)}</div></div>
      </div>
      ${s.suspicious ? `<div class="mach-warn-box">⚠️ <b>Verdachte transactie:</b> Card In ${eur(s.cardIn)} — bijna geen inzetten. Mogelijke conversie van kaart naar cash.</div>` : ''}
      <div class="mach-left-banner ${leftYes ? 'yes' : 'no'}">
        <span>${leftYes ? '💵 Geld achtergebleven op machine' : '✅ Geld meegenomen'}</span>
        <span class="mlb-amount">${leftYes ? fmtVal(s.credLeft) : '0,00 €'}</span>
      </div>
    </div>
  </div>`;
}

function togDay(di) {
  const body = document.getElementById('mdb' + di);
  const arrow = document.getElementById('mdtog' + di);
  const open = body.style.display === 'none';
  body.style.display = open ? 'block' : 'none';
  arrow.classList.toggle('open', open);
}

function togPlayer(uid) {
  document.getElementById('md_' + uid).classList.toggle('open');
}

// Keyboard shortcut
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') go();
});
