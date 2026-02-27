const WA_NUMBER = '+32XXXXXXXXX';
const WA_TEXT = 'Hallo BotMatic, ik wil graag een demo zien.';

function setWhatsAppLinks() {
  const encoded = encodeURIComponent(WA_TEXT);
  const href = `https://wa.me/${WA_NUMBER.replace(/[^\d]/g, '')}?text=${encoded}`;
  document.querySelectorAll('.wa-link').forEach((link) => {
    link.setAttribute('href', href);
  });
}

function initMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('a').forEach((item) => {
    item.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initFaq() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(isOpen));
      const icon = trigger.querySelector('.faq-icon');
      if (icon) icon.textContent = isOpen ? '−' : '+';
    });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function initReveal() {
  const targets = [
    ...document.querySelectorAll('.page-title-block .container'),
    ...document.querySelectorAll('.hero-grid > *'),
    ...document.querySelectorAll('.section .container > *:first-child'),
    ...document.querySelectorAll('.card, .timeline-item, .case-line, .faq-item, .compare-column, .editorial-block, .cta-box')
  ];

  if (!targets.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  targets.forEach((el, index) => {
    el.classList.add('reveal');
    el.style.setProperty('--reveal-delay', `${Math.min(index * 24, 220)}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

function initHeroChat() {
  const body = document.getElementById('heroChatBody');
  if (!body) return;

  const messages = [
    { from: 'client', text: 'Hebben jullie morgen nog plaats?' },
    { from: 'bot',    text: 'Zeker! Voormiddag of namiddag?' },
    { from: 'client', text: 'Namiddag graag, rond 14u.' },
    { from: 'bot',    text: 'Prima. Mag ik je naam en nummer?' },
    { from: 'client', text: 'Sarah Peeters, 0477 xx xx xx' },
    { from: 'bot',    text: 'Bedankt Sarah! Je staat ingepland voor morgen 14u. Bevestiging volgt.' },
  ];

  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const timeStr = pad(now.getHours()) + ':' + pad(now.getMinutes());

  let index = 0;

  function addBubble(msg) {
    const el = document.createElement('div');
    el.className = 'chat-bubble from-' + (msg.from === 'bot' ? 'bot' : 'client');
    el.innerHTML = msg.text + '<div class="chat-bubble-time">' + timeStr + '</div>';
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'chat-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function step() {
    if (index >= messages.length) {
      setTimeout(() => {
        body.innerHTML = '';
        index = 0;
        setTimeout(step, 400);
      }, 3500);
      return;
    }

    const msg = messages[index];

    if (msg.from === 'bot') {
      const typing = showTyping();
      setTimeout(() => {
        typing.remove();
        addBubble(msg);
        index++;
        setTimeout(step, 1000);
      }, 1300);
    } else {
      addBubble(msg);
      index++;
      setTimeout(step, 900);
    }
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      setTimeout(step, 500);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  observer.observe(body);
}

window.addEventListener('DOMContentLoaded', () => {
  setWhatsAppLinks();
  initMenu();
  initFaq();
  initSmoothScroll();
  initReveal();
  initHeroChat();
});
