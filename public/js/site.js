const WA_NUMBER = "+32456912464";
const WA_TEXT = "Hallo BotMatic, ik wil graag een demo zien.";

function setWhatsAppLinks() {
  const encoded = encodeURIComponent(WA_TEXT);
  const href = `https://wa.me/${WA_NUMBER.replace(/[^\d]/g, "")}?text=${encoded}`;
  document.querySelectorAll(".wa-link").forEach((link) => {
    link.setAttribute("href", href);
  });
}

function initMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((item) => {
    item.addEventListener("click", () => {
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initFaq() {
  const items = document.querySelectorAll(".faq-item");
  if (!items.length) return;

  items.forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.toggle("open");
      trigger.setAttribute("aria-expanded", String(isOpen));
      const icon = trigger.querySelector(".faq-icon");
      if (icon) icon.textContent = isOpen ? "−" : "+";
    });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function initLangSwitch() {
  const translations = {
    nl: {
      "nav-cta":    "Bekijk demo via WhatsApp",
      "nav-how":    "Hoe werkt het",
      "nav-who":    "Voor wie",
      "nav-price":  "Prijzen",
      "hero-title": "Meer rust in je inbox.<br />Meer tijd voor je klanten.",
    },
    fr: {
      "nav-cta":    "Voir la démo via WhatsApp",
      "nav-how":    "Comment ça marche",
      "nav-who":    "Pour qui",
      "nav-price":  "Tarifs",
      "hero-title": "Plus de sérénité dans votre boîte mail.<br />Plus de temps pour vos clients.",
    },
  };

  function applyLang(lang) {
    const t = translations[lang];
    if (!t) return;
    document.querySelectorAll("[data-key]").forEach((el) => {
      const key = el.getAttribute("data-key");
      if (t[key] !== undefined) el.innerHTML = t[key];
    });
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
  }

  const saved = localStorage.getItem("lang") || "nl";
  applyLang(saved);

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang));
  });
}

function initSectorDemo() {
  const cards = document.querySelectorAll(".sector-card");
  if (!cards.length) return;

  const panel = document.getElementById("sector-demo");
  const chatEl = document.getElementById("sector-demo-chat");

  const conversations = {
    beauty: [
      { from: "in",  text: "Hallo, hebben jullie morgen nog een plaatsje voor knippen en föhnen?" },
      { from: "out", text: "Goedemiddag! Ja, wij hebben morgen nog beschikbaarheid. Voormiddag of namiddag?" },
      { from: "in",  text: "Namiddag liefst, rond 14u." },
      { from: "out", text: "Perfect, 14u00 is beschikbaar. Mag ik je naam voor de reservatie?" },
      { from: "in",  text: "Sarah Peeters" },
      { from: "out", text: "Bedankt Sarah! Afspraak bevestigd voor morgen om 14u. Tot dan! 💇‍♀️" },
    ],
    garage: [
      { from: "in",  text: "Hoe lang duurt een grote beurt bij jullie?" },
      { from: "out", text: "Goedendag! Een grote beurt duurt gemiddeld 1,5 à 2u. Wil je meteen een afspraak inplannen?" },
      { from: "in",  text: "Ja graag, volgende week dinsdag?" },
      { from: "out", text: "Dinsdag hebben we plek om 8u30 of 13u00. Wat past jou?" },
      { from: "in",  text: "8u30 graag" },
      { from: "out", text: "Afspraak ingepland op dinsdag om 8u30. We sturen je een herinnering de dag ervoor. 🔧" },
    ],
    praktijk: [
      { from: "in",  text: "Zijn jullie volgende week beschikbaar voor een intakegesprek?" },
      { from: "out", text: "Goedendag! Ja, we hebben nog plaatsen. Welk type consult zoek je?" },
      { from: "in",  text: "Eerste afspraak met de kinesist" },
      { from: "out", text: "Prima! We hebben woensdagmiddag en vrijdagochtend vrij. Wat past het beste?" },
      { from: "in",  text: "Vrijdagochtend liever" },
      { from: "out", text: "Je intake is gepland voor vrijdag om 9u00. Bevestiging volgt via mail. ✅" },
    ],
    diensten: [
      { from: "in",  text: "Kunnen jullie volgende week voor een lekkende kraan langskomen?" },
      { from: "out", text: "Hallo! We hebben dinsdag en donderdag beschikbaarheid. Voorkeur?" },
      { from: "in",  text: "Dinsdag graag" },
      { from: "out", text: "Afspraak bevestigd voor dinsdag. Je ontvangt een sms wanneer de technieker onderweg is. 🔨" },
    ],
  };

  let timers = [];

  function showConversation(sector) {
    const msgs = conversations[sector];
    if (!msgs) return;
    timers.forEach(clearTimeout);
    timers = [];
    chatEl.innerHTML = "";
    panel.hidden = false;

    let delay = 0;
    msgs.forEach((msg, i) => {
      delay += i === 0 ? 150 : 700;
      const t = setTimeout(() => {
        const el = document.createElement("div");
        el.className = "bubble " + msg.from;
        el.textContent = msg.text;
        el.style.opacity = "0";
        el.style.transform = "translateY(6px)";
        chatEl.appendChild(el);
        requestAnimationFrame(() => {
          el.style.transition = "opacity 0.22s, transform 0.22s";
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        });
        chatEl.scrollTop = chatEl.scrollHeight;
      }, delay);
      timers.push(t);
    });

    setTimeout(() => {
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      cards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      showConversation(card.dataset.sector);
    });
  });
}

function initHeroChat() {
  const chatEl = document.getElementById("hero-chat");
  if (!chatEl) return;

  const messages = [
    { from: "in",  text: "Hallo! Hebben jullie morgen nog plaats?" },
    { from: "out", text: "Ja, zeker. Voormiddag of namiddag?" },
    { from: "in",  text: "Namiddag rond 14u." },
    { from: "out", text: "Perfect. Stuur je naam en telefoonnummer en we bevestigen meteen." },
    { from: "in",  text: "Dank je! 😊" },
  ];

  let timers = [];

  function addBubble(from, text) {
    const el = document.createElement("div");
    el.className = "bubble " + from;
    el.textContent = text;
    el.style.opacity = "0";
    el.style.transform = "translateY(5px)";
    chatEl.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transition = "opacity 0.25s, transform 0.25s";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
    chatEl.scrollTop = chatEl.scrollHeight;
    return el;
  }

  function addTyping() {
    const el = document.createElement("div");
    el.className = "bubble out typing-bubble";
    el.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    el.style.opacity = "0";
    el.style.transform = "translateY(5px)";
    chatEl.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transition = "opacity 0.25s, transform 0.25s";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
    chatEl.scrollTop = chatEl.scrollHeight;
    return el;
  }

  function play() {
    chatEl.innerHTML = "";
    timers.forEach(clearTimeout);
    timers = [];

    let delay = 800;
    messages.forEach((msg) => {
      if (msg.from === "out") {
        const tStart = delay;
        delay += 500;
        const tShow = delay;
        delay += 1600;
        let typingEl;
        timers.push(setTimeout(() => { typingEl = addTyping(); }, tStart));
        timers.push(setTimeout(() => { if (typingEl) typingEl.remove(); addBubble("out", msg.text); }, tShow));
      } else {
        const d = delay;
        delay += 1800;
        timers.push(setTimeout(() => addBubble("in", msg.text), d));
      }
    });

    timers.push(setTimeout(play, delay + 2800));
  }

  play();
}

window.addEventListener("DOMContentLoaded", () => {
  setWhatsAppLinks();
  initMenu();
  initFaq();
  initSmoothScroll();
  initLangSwitch();
  initSectorDemo();
  initHeroChat();
});
