(function () {
  var WA = 'https://wa.me/32456912464?text=Hallo%20BotMatic%2C%20ik%20wil%20graag%20een%20demo%20zien.';
  var history = [];

  function createWidget() {
    var el = document.createElement('div');
    el.id = 'bm-chat-widget';
    el.innerHTML =
      '<button class="bm-trigger" id="bm-trigger" aria-label="Chat met BotMatic">' +
        '<svg class="bm-icon-bot" viewBox="0 0 32 32" fill="none" width="24" height="24">' +
          '<rect x="4" y="10" width="24" height="17" rx="3" fill="white" opacity="0.2"/>' +
          '<rect x="4" y="10" width="24" height="17" rx="3" stroke="white" stroke-width="1.8"/>' +
          '<circle cx="12" cy="19" r="2" fill="white"/>' +
          '<circle cx="20" cy="19" r="2" fill="white"/>' +
          '<path d="M12 23h8" stroke="white" stroke-width="1.8" stroke-linecap="round"/>' +
          '<path d="M10 10V8a6 6 0 0112 0v2" stroke="white" stroke-width="1.8"/>' +
          '<circle cx="16" cy="6" r="1.5" fill="white"/>' +
        '</svg>' +
        '<svg class="bm-icon-x" viewBox="0 0 24 24" fill="none" width="20" height="20" style="display:none">' +
          '<path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2.2" stroke-linecap="round"/>' +
        '</svg>' +
        '<span class="bm-trigger-label">Chat met ons</span>' +
      '</button>' +
      '<div class="bm-window" id="bm-window" aria-hidden="true">' +
        '<div class="bm-header">' +
          '<div class="bm-header-left">' +
            '<div class="bm-avatar">🤖</div>' +
            '<div>' +
              '<div class="bm-name">BotMatic Assistent</div>' +
              '<div class="bm-status"><span class="bm-dot"></span>Online</div>' +
            '</div>' +
          '</div>' +
          '<button class="bm-close" id="bm-close" aria-label="Sluiten">✕</button>' +
        '</div>' +
        '<div class="bm-messages" id="bm-messages"></div>' +
        '<div class="bm-input-row" id="bm-input-row">' +
          '<input class="bm-input" id="bm-input" type="text" placeholder="Stel een vraag..." autocomplete="off" />' +
          '<button class="bm-send" id="bm-send" aria-label="Verstuur">' +
            '<svg viewBox="0 0 24 24" fill="none" width="18" height="18">' +
              '<path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
  }

  function scrollBottom() {
    var m = document.getElementById('bm-messages');
    m.scrollTop = m.scrollHeight;
  }

  function showTyping() {
    var m = document.getElementById('bm-messages');
    var d = document.createElement('div');
    d.className = 'bm-msg bm-bot bm-typing';
    d.id = 'bm-typing';
    d.innerHTML = '<span></span><span></span><span></span>';
    m.appendChild(d);
    scrollBottom();
  }

  function hideTyping() {
    var t = document.getElementById('bm-typing');
    if (t) t.remove();
  }

  function addBot(text) {
    var m = document.getElementById('bm-messages');
    var d = document.createElement('div');
    d.className = 'bm-msg bm-bot';
    // detect WA CTA and add button
    if (text.toLowerCase().indexOf('whatsapp') !== -1) {
      d.innerHTML = text.replace(/\n/g, '<br>') +
        '<br><br><a href="' + WA + '" target="_blank" rel="noopener" class="bm-wa-btn">💬 Start demo via WhatsApp</a>';
    } else {
      d.textContent = text;
    }
    m.appendChild(d);
    scrollBottom();
  }

  function addUser(text) {
    var m = document.getElementById('bm-messages');
    var d = document.createElement('div');
    d.className = 'bm-msg bm-user';
    d.textContent = text;
    m.appendChild(d);
    scrollBottom();
  }

  function setInputEnabled(enabled) {
    var inp = document.getElementById('bm-input');
    var btn = document.getElementById('bm-send');
    inp.disabled = !enabled;
    btn.disabled = !enabled;
  }

  function sendMessage(text) {
    if (!text.trim()) return;
    addUser(text);
    document.getElementById('bm-input').value = '';
    setInputEnabled(false);
    showTyping();

    history.push({ role: 'user', content: text });

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: history.slice(-6) })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        var reply = data.reply || 'Sorry, even een probleem. Probeer opnieuw!';
        history.push({ role: 'assistant', content: reply });
        addBot(reply);
        setInputEnabled(true);
        document.getElementById('bm-input').focus();
      })
      .catch(function () {
        hideTyping();
        addBot('Sorry, even een technisch probleem. Stuur ons gerust een WhatsApp! 💬');
        setInputEnabled(true);
      });
  }

  var isOpen = false;

  function openChat() {
    var win = document.getElementById('bm-window');
    var trigger = document.getElementById('bm-trigger');
    isOpen = true;
    win.classList.add('bm-open');
    win.setAttribute('aria-hidden', 'false');
    trigger.querySelector('.bm-icon-bot').style.display = 'none';
    trigger.querySelector('.bm-icon-x').style.display = '';
    trigger.classList.add('bm-trigger-open');
    var badge = trigger.querySelector('.bm-badge');
    if (badge) badge.remove();
    if (document.getElementById('bm-messages').children.length === 0) {
      showTyping();
      setTimeout(function () {
        hideTyping();
        addBot('Hallo! 👋 Ik ben de BotMatic-assistent. Stel me gerust je vraag over onze chatbots voor Belgische KMO\'s!');
      }, 800);
    }
    setTimeout(function () {
      document.getElementById('bm-input').focus();
    }, 300);
  }

  function closeChat() {
    var win = document.getElementById('bm-window');
    var trigger = document.getElementById('bm-trigger');
    isOpen = false;
    win.classList.remove('bm-open');
    win.setAttribute('aria-hidden', 'true');
    trigger.querySelector('.bm-icon-bot').style.display = '';
    trigger.querySelector('.bm-icon-x').style.display = 'none';
    trigger.classList.remove('bm-trigger-open');
  }

  document.addEventListener('DOMContentLoaded', function () {
    createWidget();

    document.getElementById('bm-trigger').addEventListener('click', function () {
      isOpen ? closeChat() : openChat();
    });
    document.getElementById('bm-close').addEventListener('click', closeChat);

    document.getElementById('bm-send').addEventListener('click', function () {
      sendMessage(document.getElementById('bm-input').value);
    });

    document.getElementById('bm-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendMessage(this.value);
    });

    // badge after 6s
    setTimeout(function () {
      if (!isOpen) {
        var badge = document.createElement('span');
        badge.className = 'bm-badge';
        badge.textContent = '1';
        document.getElementById('bm-trigger').appendChild(badge);
      }
    }, 6000);
  });
})();
