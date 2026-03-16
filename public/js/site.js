const WA_NUMBER = "+32456912464";
const WA_TEXT = "Hallo BotMatic, ik wil graag een demo zien.";
const DEMO_PAGE = "/demo";

function setWhatsAppLinks() {
  document.querySelectorAll(".wa-link").forEach((link) => {
    link.setAttribute("href", DEMO_PAGE);
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
      "nav-cta":       "Bekijk live demo",
      "nav-how":       "Hoe werkt het",
      "nav-who":       "Voor wie",
      "nav-price":     "Prijzen",
      "hero-tag":      "Chatbot voor WhatsApp, Instagram &amp; meer",
      "hero-title":    "De chatbot die klantvragen beantwoordt.<br />Automatisch, 24/7.",
      "hero-lead":     "BotMatic stuurt automatisch antwoord op terugkerende vragen, plant afspraken in en verbindt door naar jouw team — via WhatsApp, Instagram, Messenger en andere chatkanalen.",
      "hero-btn2":     "Open Instagram demo",
      "hero-li1":      "FAQ automatisch beantwoord: openingsuren, prijzen, beschikbaarheid.",
      "hero-li2":      "Afspraken ingepland zonder tussenkomst van je team.",
      "hero-li3":      "Complexe vragen doorgestuurd naar de juiste persoon.",
      "hero-pill1":    "Belgische KMO-focus",
      "hero-pill2":    "Klaar in enkele dagen",
      "hero-pill3":    "Maandelijks opzegbaar",
      "pain-tag":      "Herkenbaar?",
      "pain-title":    "Dit kost jouw team elke dag tijd en energie",
      "pain-1":        "Gemiste klanten omdat niemand op tijd antwoordde",
      "pain-2":        "Eindeloze herhalende vragen die je team energie kosten",
      "pain-3":        "Berichten van WhatsApp, Instagram, Messenger en nog meer tegelijk",
      "pain-4":        "Klanten die uren wachten op een simpele bevestiging",
      "pain-5":        "Nieuw personeel telkens opnieuw inwerken voor dezelfde antwoorden",
      "pain-6":        "Afspraken die verloren gaan in de chaos van je inbox",
      "pain-cta":      "BotMatic neemt dit volledig over.",
      "compare-h2":    "BotMatic vs manueel werken",
      "start-h2":      "Zo starten we",
      "start-step1-h": "1. Korte intake",
      "start-step1-p": "We bekijken je FAQ, afspraken en tone of voice.",
      "start-step2-h": "2. Setup op maat",
      "start-step2-p": "We bereiden jouw flows per kanaal voor met duidelijke regels.",
      "start-step3-h": "3. Live en bijsturen",
      "start-step3-p": "BotMatic draait mee. We finetunen op basis van echte gesprekken.",
      "final-h2":      "Wil je dit live zien voor jouw zaak?",
      "final-p":       "Stuur één WhatsApp en krijg een korte demo op maat.",
      "wa-bubble":     "WhatsApp demo",
      // hoe-werkt-het
      "hwh-h1":        "Zo wordt BotMatic jouw extra assistent",
      "hwh-lead":      "Geen technisch project. We bouwen een praktische opvolging voor je team met duidelijke afspraken en snelle feedback.",
      "hwh-cta-h2":    "Wil je jouw werkwijze in demo zien?",
      "hwh-cta-p":     "We tonen live hoe een gesprek wordt opgevolgd van eerste vraag tot doorsturing.",
      // voor-wie
      "vw-h1":         "Voor welke sectoren werkt BotMatic?",
      "vw-lead":       "Van kapsalon tot medische praktijk. Als je dagelijks terugkerende berichten krijgt, dan werkt BotMatic voor jouw team.",
      "vw-cta-h2":     "Werkt dit voor jouw sector?",
      "vw-cta-p":      "Stuur je sector en volume en we tonen een voorbeeld op maat.",
      // prijzen
      "prijs-h1":      "Prijzen die simpel en duidelijk blijven",
      "prijs-lead":    "Geen complexe opzet. Je kiest een maandplan en we stemmen de opvolging af op jouw team.",
      "prijs-cta-h2":  "Welke formule past bij jouw team?",
      "prijs-cta-p":   "Stuur je maandvolume en we adviseren meteen het juiste plan.",
      // faq
      "faq-h1":        "Veelgestelde vragen",
      "faq-lead":      "Alles wat je moet weten voor je start.",
      "faq-cta-h2":    "Staat jouw vraag er niet bij?",
      "faq-cta-p":     "Stel ze rechtstreeks via WhatsApp. We antwoorden snel.",
      // cases
      "cases-h1":      "Wat teams in de praktijk ervaren",
      "cases-lead":    "Drie korte voorbeelden van Belgische teams die dagelijkse chatdruk hebben verminderd.",
      "cases-cta-h2":  "Wil je een voorbeeld voor jouw sector?",
      "cases-cta-p":   "We tonen live hoe BotMatic reageert op jouw meest gestelde vragen.",
      // contact
      "contact-h1":    "Praat met ons over jouw inbox",
      "contact-lead":  "De snelste weg is WhatsApp. Of stuur ons een mail met je situatie.",
      "contact-cta-h2":"Wil je vandaag nog starten?",
      "contact-cta-p": "Laat je kanaal en sector weten. Dan tonen we je meteen de beste aanpak.",
      // vergelijking
      "verg-h1":       "BotMatic of klassieke bookingtool?",
      "verg-lead":     "Als je hoofdpijn komt van terugkerende gesprekken, dan heb je meer nodig dan alleen agenda-software.",
      "verg-cta-h2":   "Wil je zien wat beter past voor jouw team?",
      "verg-cta-p":    "Wij tonen het verschil met jouw eigen cases en berichten.",
    },
    fr: {
      "nav-cta":       "Voir la démo live",
      "nav-how":       "Comment ça marche",
      "nav-who":       "Pour qui",
      "nav-price":     "Tarifs",
      "hero-tag":      "Chatbot pour WhatsApp, Instagram &amp; plus",
      "hero-title":    "Le chatbot qui répond aux questions clients.<br />Automatiquement, 24/7.",
      "hero-lead":     "BotMatic envoie automatiquement des réponses aux questions récurrentes, planifie des rendez-vous et transfère vers votre équipe — via WhatsApp, Instagram, Messenger et d'autres canaux.",
      "hero-btn2":     "Ouvrir la démo Instagram",
      "hero-li1":      "FAQ répondue automatiquement : horaires, tarifs, disponibilités.",
      "hero-li2":      "Rendez-vous planifiés sans intervention de votre équipe.",
      "hero-li3":      "Questions complexes transmises à la bonne personne.",
      "hero-pill1":    "Focus PME belge",
      "hero-pill2":    "Prêt en quelques jours",
      "hero-pill3":    "Résiliable chaque mois",
      "pain-tag":      "Vous reconnaissez ?",
      "pain-title":    "Cela coûte du temps et de l'énergie à votre équipe chaque jour",
      "pain-1":        "Clients manqués parce que personne n'a répondu à temps",
      "pain-2":        "Questions répétitives interminables qui épuisent votre équipe",
      "pain-3":        "Messages de WhatsApp, Instagram, Messenger en même temps",
      "pain-4":        "Clients qui attendent des heures pour une simple confirmation",
      "pain-5":        "Former encore le nouveau personnel pour les mêmes réponses",
      "pain-6":        "Rendez-vous perdus dans le chaos de votre boîte de réception",
      "pain-cta":      "BotMatic prend tout ça en charge.",
      "compare-h2":    "BotMatic vs travail manuel",
      "start-h2":      "Comment on démarre",
      "start-step1-h": "1. Intake rapide",
      "start-step1-p": "On analyse votre FAQ, vos rendez-vous et votre style de réponse.",
      "start-step2-h": "2. Setup sur mesure",
      "start-step2-p": "On configure vos flux par canal avec des règles claires.",
      "start-step3-h": "3. Live et ajustements",
      "start-step3-p": "BotMatic tourne. On affine sur base de vraies conversations.",
      "final-h2":      "Vous voulez voir ça en direct pour votre entreprise ?",
      "final-p":       "Envoyez un WhatsApp et recevez une démo rapide sur mesure.",
      "wa-bubble":     "Démo WhatsApp",
      // hoe-werkt-het
      "hwh-h1":        "Comment BotMatic devient votre assistant supplémentaire",
      "hwh-lead":      "Pas un projet technique. On construit un suivi pratique pour votre équipe avec des règles claires et un feedback rapide.",
      "hwh-cta-h2":    "Vous voulez voir votre méthode de travail en démo ?",
      "hwh-cta-p":     "On montre en direct comment une conversation est suivie de la première question jusqu'au transfert.",
      // voor-wie
      "vw-h1":         "Pour quels secteurs fonctionne BotMatic ?",
      "vw-lead":       "Du salon de coiffure à la pratique médicale. Si vous recevez des messages récurrents chaque jour, BotMatic fonctionne pour votre équipe.",
      "vw-cta-h2":     "Est-ce que ça fonctionne pour votre secteur ?",
      "vw-cta-p":      "Envoyez votre secteur et volume et on vous montre un exemple sur mesure.",
      // prijzen
      "prijs-h1":      "Des tarifs simples et clairs",
      "prijs-lead":    "Pas de configuration complexe. Vous choisissez un plan mensuel et on adapte le suivi à votre équipe.",
      "prijs-cta-h2":  "Quelle formule convient à votre équipe ?",
      "prijs-cta-p":   "Envoyez votre volume mensuel et on conseille immédiatement le bon plan.",
      // faq
      "faq-h1":        "Questions fréquentes",
      "faq-lead":      "Tout ce que vous devez savoir avant de démarrer.",
      "faq-cta-h2":    "Votre question n'est pas ici ?",
      "faq-cta-p":     "Posez-la directement via WhatsApp. On répond rapidement.",
      // cases
      "cases-h1":      "Ce que les équipes vivent en pratique",
      "cases-lead":    "Trois exemples courts d'équipes belges qui ont réduit la pression quotidienne des messages.",
      "cases-cta-h2":  "Vous voulez un exemple pour votre secteur ?",
      "cases-cta-p":   "On montre en direct comment BotMatic répond à vos questions les plus fréquentes.",
      // contact
      "contact-h1":    "Parlez-nous de votre boîte de réception",
      "contact-lead":  "La voie la plus rapide est WhatsApp. Ou envoyez-nous un message avec votre situation.",
      "contact-cta-h2":"Vous voulez démarrer aujourd'hui ?",
      "contact-cta-p": "Indiquez votre canal et secteur. On vous montre immédiatement la meilleure approche.",
      // vergelijking
      "verg-h1":       "BotMatic ou outil de réservation classique ?",
      "verg-lead":     "Si vos maux de tête viennent de conversations répétitives, vous avez besoin de plus qu'un simple logiciel d'agenda.",
      "verg-cta-h2":   "Vous voulez voir ce qui convient mieux à votre équipe ?",
      "verg-cta-p":    "On montre la différence avec vos propres cas et messages.",
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
  const quickEl = chatEl.closest(".phone") && chatEl.closest(".phone").querySelector(".phone-quick");

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
    if (quickEl) quickEl.classList.remove("visible");
    timers.forEach(clearTimeout);
    timers = [];

    let delay = 800;
    messages.forEach((msg, i) => {
      const isLast = i === messages.length - 1;
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
        timers.push(setTimeout(() => {
          addBubble("in", msg.text);
          if (isLast && quickEl) {
            setTimeout(() => quickEl.classList.add("visible"), 400);
          }
        }, d));
      }
    });

    timers.push(setTimeout(play, delay + 3200));
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
