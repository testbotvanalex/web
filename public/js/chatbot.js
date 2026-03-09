(function () {
  var WA = 'https://wa.me/32456912464?text=Hallo%20BotMatic%2C%20ik%20wil%20graag%20een%20demo%20zien.';

  var flows = {
    start: {
      message: 'Hallo! 👋 Ik ben de BotMatic-assistent. Waarmee kan ik je helpen?',
      options: [
        { label: '🤖 Wat doet BotMatic?', next: 'what' },
        { label: '💶 Wat kost het?', next: 'price' },
        { label: '📱 Welke kanalen?', next: 'channels' },
        { label: '🚀 Gratis demo', next: 'demo' }
      ]
    },
    what: {
      message: 'BotMatic beantwoordt automatisch herhalende vragen via WhatsApp, Instagram en Messenger — 24/7, zonder dat jij iets hoeft te doen. Jouw team krijgt eindelijk rust. 🤖',
      options: [
        { label: '💶 Wat kost het?', next: 'price' },
        { label: '📱 Welke kanalen?', next: 'channels' },
        { label: '🚀 Gratis demo', next: 'demo' }
      ]
    },
    price: {
      message: 'Ons Basis-plan start vanaf €149/maand — alles inbegrepen, geen setupkosten, maandelijks opzegbaar. 💶',
      options: [
        { label: '📋 Alle prijzen bekijken', action: 'link', href: '/prijzen.html' },
        { label: '🚀 Gratis demo', next: 'demo' },
        { label: '← Terug', next: 'start' }
      ]
    },
    channels: {
      message: 'BotMatic werkt op WhatsApp ✅, Instagram ✅ en Facebook Messenger ✅ — allemaal vanuit één dashboard. Meer kanalen volgen. 📱',
      options: [
        { label: '💶 Wat kost het?', next: 'price' },
        { label: '🚀 Gratis demo', next: 'demo' },
        { label: '← Terug', next: 'start' }
      ]
    },
    demo: {
      message: 'Top keuze! 🎉 Stuur ons een berichtje via WhatsApp en we tonen je live hoe het werkt voor jouw sector.',
      options: [
        { label: '💬 Start demo via WhatsApp', action: 'wa' }
      ]
    }
  };

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
        '<div class="bm-options" id="bm-options"></div>' +
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
    d.textContent = text;
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

  function renderOptions(options) {
    var o = document.getElementById('bm-options');
    o.innerHTML = '';
    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'bm-opt';
      btn.textContent = opt.label;
      btn.addEventListener('click', function () { pick(opt); });
      o.appendChild(btn);
    });
  }

  function pick(opt) {
    addUser(opt.label);
    document.getElementById('bm-options').innerHTML = '';

    if (opt.action === 'wa') {
      showTyping();
      setTimeout(function () {
        hideTyping();
        addBot('We spreken je zo via WhatsApp! Tot zo 👋');
        setTimeout(function () {
          window.open(WA, '_blank');
        }, 800);
      }, 700);
      return;
    }

    if (opt.action === 'link') {
      window.location.href = opt.href;
      return;
    }

    if (opt.next && flows[opt.next]) {
      showTyping();
      setTimeout(function () {
        hideTyping();
        addBot(flows[opt.next].message);
        renderOptions(flows[opt.next].options);
      }, 750);
    }
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
    // remove badge
    var badge = trigger.querySelector('.bm-badge');
    if (badge) badge.remove();
    // start flow if fresh
    if (document.getElementById('bm-messages').children.length === 0) {
      setTimeout(function () {
        showTyping();
        setTimeout(function () {
          hideTyping();
          addBot(flows.start.message);
          renderOptions(flows.start.options);
        }, 900);
      }, 200);
    }
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

  function addBadge() {
    var trigger = document.getElementById('bm-trigger');
    if (isOpen || trigger.querySelector('.bm-badge')) return;
    var badge = document.createElement('span');
    badge.className = 'bm-badge';
    badge.textContent = '1';
    trigger.appendChild(badge);
  }

  document.addEventListener('DOMContentLoaded', function () {
    createWidget();
    document.getElementById('bm-trigger').addEventListener('click', function () {
      isOpen ? closeChat() : openChat();
    });
    document.getElementById('bm-close').addEventListener('click', closeChat);
    // show badge after 6s to invite interaction
    setTimeout(addBadge, 6000);
  });
})();
