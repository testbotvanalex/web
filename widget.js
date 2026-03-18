(function () {
  'use strict';

  const script = document.currentScript || document.querySelector('script[data-client]');
  const clientId = script && script.getAttribute('data-client');
  if (!clientId) { console.warn('[BotMatic] data-client missing'); return; }

  const API = 'https://botmatic.be';
  const SESSION_KEY = 'bm_session_' + clientId;
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = 'bm_' + Math.random().toString(36).slice(2) + '_' + Date.now();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const css = `
    #bm-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #bm-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 999999;
      width: 56px; height: 56px; border-radius: 50%;
      background: #7c6cfc; border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(124,108,252,.45);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
    }
    #bm-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(124,108,252,.6); }
    #bm-btn svg { width: 26px; height: 26px; fill: #fff; }
    #bm-panel {
      position: fixed; bottom: 92px; right: 24px; z-index: 999998;
      width: 360px; max-height: 540px;
      background: #fff; border-radius: 18px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
      display: flex; flex-direction: column; overflow: hidden;
      opacity: 0; pointer-events: none;
      transform: translateY(16px) scale(.97);
      transition: opacity .22s, transform .22s;
    }
    #bm-panel.bm-open { opacity: 1; pointer-events: all; transform: translateY(0) scale(1); }
    #bm-header {
      background: #7c6cfc; padding: 16px 18px;
      display: flex; align-items: center; gap: 12px;
    }
    #bm-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(255,255,255,.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    #bm-title { color: #fff; font-weight: 700; font-size: 15px; }
    #bm-subtitle { color: rgba(255,255,255,.75); font-size: 12px; margin-top: 2px; }
    #bm-close {
      margin-left: auto; background: none; border: none;
      color: rgba(255,255,255,.8); cursor: pointer; font-size: 20px;
      line-height: 1; padding: 4px; border-radius: 6px;
    }
    #bm-close:hover { color: #fff; background: rgba(255,255,255,.15); }
    #bm-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
      min-height: 0;
    }
    #bm-messages::-webkit-scrollbar { width: 4px; }
    #bm-messages::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
    .bm-msg {
      max-width: 82%; padding: 10px 14px;
      border-radius: 16px; font-size: 14px; line-height: 1.45;
      word-break: break-word; animation: bm-pop .18s ease;
    }
    @keyframes bm-pop { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
    .bm-msg.bm-bot {
      background: #f3f0ff; color: #1a1a2e;
      border-bottom-left-radius: 4px; align-self: flex-start;
    }
    .bm-msg.bm-user {
      background: #7c6cfc; color: #fff;
      border-bottom-right-radius: 4px; align-self: flex-end;
    }
    .bm-typing { display: flex; gap: 5px; align-items: center; padding: 10px 14px; }
    .bm-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #7c6cfc; opacity: .4;
      animation: bm-bounce .9s infinite;
    }
    .bm-dot:nth-child(2) { animation-delay: .15s; }
    .bm-dot:nth-child(3) { animation-delay: .3s; }
    @keyframes bm-bounce { 0%,60%,100% { transform: none; opacity:.4; } 30% { transform: translateY(-5px); opacity:1; } }
    #bm-footer {
      padding: 12px; border-top: 1px solid #f0f0f0;
      display: flex; gap: 8px; align-items: flex-end;
    }
    #bm-input {
      flex: 1; border: 1.5px solid #e8e8e8; border-radius: 12px;
      padding: 10px 14px; font-size: 14px; outline: none;
      resize: none; max-height: 100px; line-height: 1.4;
      transition: border-color .15s;
    }
    #bm-input:focus { border-color: #7c6cfc; }
    #bm-send {
      width: 40px; height: 40px; border-radius: 12px;
      background: #7c6cfc; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background .15s;
    }
    #bm-send:hover { background: #6a5be8; }
    #bm-send:disabled { background: #ccc; cursor: default; }
    #bm-send svg { width: 18px; height: 18px; fill: #fff; }
    @media (max-width: 420px) {
      #bm-panel { width: calc(100vw - 16px); right: 8px; bottom: 80px; }
      #bm-btn { right: 16px; bottom: 16px; }
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── HTML ────────────────────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.id = 'bm-widget';
  wrap.innerHTML = `
    <div id="bm-panel">
      <div id="bm-header">
        <div id="bm-avatar">🤖</div>
        <div>
          <div id="bm-title">Ассистент</div>
          <div id="bm-subtitle">Онлайн · отвечает быстро</div>
        </div>
        <button id="bm-close" title="Закрыть">✕</button>
      </div>
      <div id="bm-messages"></div>
      <div id="bm-footer">
        <textarea id="bm-input" rows="1" placeholder="Напишите сообщение…"></textarea>
        <button id="bm-send">
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
    <button id="bm-btn" title="Открыть чат">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    </button>
  `;
  document.body.appendChild(wrap);

  const panel   = document.getElementById('bm-panel');
  const btn     = document.getElementById('bm-btn');
  const closeBtn = document.getElementById('bm-close');
  const messages = document.getElementById('bm-messages');
  const input   = document.getElementById('bm-input');
  const sendBtn = document.getElementById('bm-send');

  let open = false;
  let busy = false;
  let greeted = false;

  // ── Toggle ──────────────────────────────────────────────────────────────────
  function openWidget() {
    open = true;
    panel.classList.add('bm-open');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="#fff"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
    if (!greeted) { greeted = true; showGreeting(); }
    setTimeout(() => input.focus(), 250);
  }

  function closeWidget() {
    open = false;
    panel.classList.remove('bm-open');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="#fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
  }

  btn.addEventListener('click', () => open ? closeWidget() : openWidget());
  closeBtn.addEventListener('click', closeWidget);

  // ── Config ──────────────────────────────────────────────────────────────────
  fetch(API + '/api/widget/' + clientId + '/config')
    .then(r => r.ok ? r.json() : null)
    .then(cfg => {
      if (!cfg) return;
      document.getElementById('bm-title').textContent = cfg.name || 'Ассистент';
      if (cfg.greeting) document.getElementById('bm-subtitle').textContent = 'Онлайн · отвечает быстро';
      window._bmGreeting = cfg.greeting;
    })
    .catch(() => {});

  function showGreeting() {
    const text = window._bmGreeting || 'Привет! Чем могу помочь?';
    addMessage(text, 'bot');
  }

  // ── Messages ─────────────────────────────────────────────────────────────────
  function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = 'bm-msg bm-' + role;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'bm-msg bm-bot bm-typing';
    div.id = 'bm-typing';
    div.innerHTML = '<span class="bm-dot"></span><span class="bm-dot"></span><span class="bm-dot"></span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('bm-typing');
    if (el) el.remove();
  }

  // ── Send ────────────────────────────────────────────────────────────────────
  async function send() {
    const text = input.value.trim();
    if (!text || busy) return;

    busy = true;
    sendBtn.disabled = true;
    input.value = '';
    input.style.height = 'auto';

    addMessage(text, 'user');
    showTyping();

    try {
      const res = await fetch(API + '/api/widget/' + clientId + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = res.ok ? await res.json() : null;
      hideTyping();
      addMessage(data?.reply || 'Что-то пошло не так. Попробуйте позже.', 'bot');
    } catch {
      hideTyping();
      addMessage('Нет соединения. Проверьте интернет.', 'bot');
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

})();
