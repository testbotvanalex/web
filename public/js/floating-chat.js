// Floating Chat Widget - Super Light Luxury Variant
(function () {
  // Prevent duplicate instances
  if (document.getElementById('bm-chat-root')) return;

  // 1. Inject CSS Styles
  const css = `
    #bm-chat-root { font-family: 'Plus Jakarta Sans', sans-serif; z-index: 9999; position: fixed; bottom: 24px; right: 24px; }
    
    .bm-float-btn {
      width: 64px; height: 64px; border-radius: 50%;
      background: #020617; color: white; border: none;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 28px; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .bm-float-btn:hover { transform: scale(1.1); }
    
    .bm-chat-window {
      position: absolute; bottom: 80px; right: 0;
      width: 380px; max-width: calc(100vw - 48px);
      height: 600px; max-height: 70vh;
      background: white; border-radius: 24px;
      box-shadow: 0 20px 60px -10px rgba(0,0,0,0.15);
      border: 1px solid #E2E8F0;
      display: flex; flex-direction: column;
      overflow: hidden; opacity: 0; transform: translateY(20px) scale(0.95);
      pointer-events: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .bm-chat-window.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
    
    .bm-header {
      background: #020617; padding: 20px; color: white;
      display: flex; align-items: center; gap: 12px;
    }
    .bm-avatar {
      width: 40px; height: 40px; background: white; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 20px;
    }
    .bm-title h3 { font-size: 16px; font-weight: 700; margin: 0; }
    .bm-title span { font-size: 12px; color: #94A3B8; display: flex; align-items: center; gap: 6px; }
    .bm-dot { width: 6px; height: 6px; background: #10B981; border-radius: 50%; box-shadow: 0 0 10px #10B981; }
    
    .bm-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; background: #F8FAFC; }
    
    .bm-msg { max-width: 80%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; animation: popUp 0.3s ease-out forwards; }
    .bm-msg.bot { background: white; color: #020617; border-bottom-left-radius: 4px; border: 1px solid #E2E8F0; align-self: flex-start; }
    .bm-msg.user { background: #020617; color: white; border-bottom-right-radius: 4px; align-self: flex-end; }
    
    .bm-input-area { padding: 16px; background: white; border-top: 1px solid #E2E8F0; display: flex; gap: 10px; }
    .bm-input { flex: 1; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px; font-family: inherit; font-size: 14px; outline: none; transition: 0.2s; background: #F8FAFC; color: #020617; }
    .bm-input:focus { border-color: #020617; background: white; }
    .bm-send { background: #10B981; color: white; border: none; width: 44px; height: 44px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .bm-send:hover { background: #059669; transform: scale(1.05); }
    
    @keyframes popUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `;
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);

  // 2. Create DOM Structure
  const root = document.createElement('div');
  root.id = 'bm-chat-root';
  root.innerHTML = `
    <div class="bm-chat-window" id="bm-window">
      <div class="bm-header">
        <div class="bm-avatar">🤖</div>
        <div class="bm-title">
          <h3>BotMatic</h3>
          <span><div class="bm-dot"></div> Online</span>
        </div>
      </div>
      <div class="bm-messages" id="bm-msgs"></div>
      <form class="bm-input-area" id="bm-form">
        <input type="text" class="bm-input" placeholder="Stel je vraag..." />
        <button type="submit" class="bm-send">➤</button>
      </form>
    </div>
    <button class="bm-float-btn" id="bm-btn">💬</button>
  `;
  document.body.appendChild(root);

  // 3. Logic
  const btn = document.getElementById('bm-btn');
  const win = document.getElementById('bm-window');
  const form = document.getElementById('bm-form');
  const input = form.querySelector('input');
  const msgs = document.getElementById('bm-msgs');

  let isOpen = false;
  const history = [];

  function toggle() {
    isOpen = !isOpen;
    if (isOpen) {
      win.classList.add('open');
      btn.innerHTML = '✕';
      if (msgs.children.length === 0) addMsg('Hoi! 👋 Waarmee kan ik je helpen?', 'bot');
      setTimeout(() => input.focus(), 100);

      // TRACKING
      console.log('Chat opened');

    } else {
      win.classList.remove('open');
      btn.innerHTML = '💬';
    }
  }

  function addMsg(text, sender) {
    const div = document.createElement('div');
    div.className = `bm-msg ${sender}`;
    div.innerText = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  btn.addEventListener('click', toggle);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addMsg(text, 'user');
    input.value = '';
    history.push({ role: 'user', content: text });

    // Simulate typing
    const typing = document.createElement('div');
    typing.className = 'bm-msg bot';
    typing.innerText = '...';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;

    try {
      // Real API call logic would go here
      // const res = await fetch('/api/chat', ...);
      await new Promise(r => setTimeout(r, 1000));

      typing.remove();
      const reply = "Bedankt voor je bericht! Dit is een demo. In de echte versie zou ik nu antwoorden met AI. 🚀";
      addMsg(reply, 'bot');
      history.push({ role: 'assistant', content: reply });

    } catch (err) {
      typing.remove();
      addMsg('Fout bij verbinden.', 'bot');
    }
  });

})();
