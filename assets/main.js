// FILE: main.js
const I18N = {
  nl:{
    nav:{features:"Functies",pricing:"Prijzen",contact:"Contact",demo:"Demo"},
    hero:{
      badge1:"⚡ 7–14 dagen oplevering", badge2:"🧩 Volledig maatwerk", badge3:"🔌 CRM & betalingen",
      title:"Chatbots voor WhatsApp, Telegram & websites — snel gebouwd",
      subtitle:"We bouwen bots die leads vangen, kwalificeren en automatisch afspraken boeken. Eenvoudige setup, snelle oplevering, doorlopend support.",
      ctaPrimary:"Start een project", ctaSecondary:"Bekijk prijzen", disclaimer:"Demo is illustratief. Integreren kan met WhatsApp, Telegram, webwidget."
    },
    stats:{s1:"Meer chats uit verkeer",s2:"Snellere reactie",s3:"Automatische afhandeling"},
    demo:{bot1:"Hoi! Ik ben BotMatic. Waarmee kan ik helpen?",k1:"Afspraak boeken",k2:"Prijzen",k3:"Contact met agent"},
    features:{title:"Wat je van ons krijgt",f1:"Diagnose, kwalificatie, FAQ, doorverbinden naar agent.",f2:"CRM, agenda’s, betalingen (Stripe), Google Sheets, webhooks.",f3:"Meertaligheid, statistieken, updates, support."},
    pricing:{title:"Prijzen",note:"Alle plannen inclusief gratis huidig advies/diagnose van je funnel.",gambling:"21+ Gokken kan verslavend zijn. Stop op tijd! Meer info: stopoptijd.be"},
    plans:{
      popular:"Meest gekozen",cta:"Kies dit plan",
      basic:{name:"Basis",l1:"1 kernfunctie (bv. FAQ)",l2:"1 platform",l3:"Standaard support",l4:"Tot 500 conversaties"},
      standard:{name:"Standaard",l1:"Meerdere taken/flows",l2:"2 platforms",l3:"Priority support",l4:"Tot 2.000 conversaties"},
      premium:{name:"Premium",l1:"Geavanceerde AI/NLP",l2:"Meerdere systemen",l3:"Toegewijde PM & support",l4:"Onbeperkte conversaties"}
    },
    contact:{title:"Vraag een demo"},
    form:{name:"Naam",platform:"Platform",message:"Bericht",gdpr:"Ik ga akkoord met verwerking van mijn gegevens volgens de privacyverklaring.",submit:"Versturen"}
  },
  fr:{
    nav:{features:"Fonctionnalités",pricing:"Tarifs",contact:"Contact",demo:"Démo"},
    hero:{
      badge1:"⚡ Livraison 7–14 jours", badge2:"🧩 100% sur-mesure", badge3:"🔌 CRM & paiements",
      title:"Chatbots pour WhatsApp, Telegram & sites — vite faits, bien faits",
      subtitle:"On construit des bots qui captent les leads, les qualifient et réservent automatiquement. Mise en place simple, livraison rapide, support continu.",
      ctaPrimary:"Démarrer un projet", ctaSecondary:"Voir les tarifs", disclaimer:"Démo illustrative. Intégrations possibles: WhatsApp, Telegram, widget web."
    },
    stats:{s1:"Plus de chats depuis le trafic",s2:"Réponse plus rapide",s3:"Traitement automatisé"},
    demo:{bot1:"Salut ! Je suis BotMatic. Je peux t’aider ?",k1:"Réserver un rendez-vous",k2:"Tarifs",k3:"Parler à un agent"},
    features:{title:"Ce que vous obtenez",f1:"Diagnostic, qualification, FAQ, transfert agent.",f2:"CRM, agendas, paiements (Stripe), Google Sheets, webhooks.",f3:"Multilingue, stats, mises à jour, support."},
    pricing:{title:"Tarifs",note:"Tous les plans incluent un diagnostic gratuit de votre tunnel.",gambling:"Jeux de hasard 21+. Jouez responsable. Plus d’info: stopoptijd.be"},
    plans:{
      popular:"Le plus choisi",cta:"Choisir",
      basic:{name:"Basique",l1:"1 fonctionnalité clé (ex. FAQ)",l2:"1 plateforme",l3:"Support standard",l4:"Jusqu’à 500 conversations"},
      standard:{name:"Standard",l1:"Plusieurs tâches/flows",l2:"2 plateformes",l3:"Support prioritaire",l4:"Jusqu’à 2 000 conversations"},
      premium:{name:"Premium",l1:"IA/NLP avancée",l2:"Multi-systèmes",l3:"Chef de projet dédié",l4:"Conversations illimitées"}
    },
    contact:{title:"Demander une démo"},
    form:{name:"Nom",platform:"Plateforme",message:"Message",gdpr:"J’accepte le traitement de mes données conformément à la politique de confidentialité.",submit:"Envoyer"}
  },
  en:{
    nav:{features:"Features",pricing:"Pricing",contact:"Contact",demo:"Demo"},
    hero:{
      badge1:"⚡ 7–14 days delivery", badge2:"🧩 Fully custom", badge3:"🔌 CRM & payments",
      title:"Custom chatbots for WhatsApp, Telegram & websites — built fast",
      subtitle:"We build bots that capture leads, qualify them and auto‑book. Simple setup, quick turnaround, ongoing support.",
      ctaPrimary:"Start a project", ctaSecondary:"See pricing", disclaimer:"Demo is illustrative. Integrations: WhatsApp, Telegram, web widget."
    },
    stats:{s1:"More chats from traffic",s2:"Faster responses",s3:"Automated handling"},
    demo:{bot1:"Hi! I’m BotMatic. What do you need?",k1:"Book an appointment",k2:"Pricing",k3:"Talk to an agent"},
    features:{title:"What you get",f1:"Diagnosis, qualification, FAQ, agent handoff.",f2:"CRM, calendars, payments (Stripe), Google Sheets, webhooks.",f3:"Multilingual, analytics, updates, support."},
    pricing:{title:"Pricing",note:"All plans include a free funnel health check.",gambling:"21+ Gambling can be addictive. Stop in time. More info: stopoptijd.be"},
    plans:{
      popular:"Most popular",cta:"Choose plan",
      basic:{name:"Basic",l1:"1 core feature (e.g., FAQ)",l2:"1 platform",l3:"Standard support",l4:"Up to 500 conversations"},
      standard:{name:"Standard",l1:"Multiple automations",l2:"2 platforms",l3:"Priority support",l4:"Up to 2,000 conversations"},
      premium:{name:"Premium",l1:"Advanced AI/NLP",l2:"Multiple systems",l3:"Dedicated PM & support",l4:"Unlimited conversations"}
    },
    contact:{title:"Request a demo"},
    form:{name:"Name",platform:"Platform",message:"Message",gdpr:"I agree to my data being processed per the privacy policy.",submit:"Send"}
  }
};

// --- helpers
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

function setLang(lang){
  const dict = I18N[lang] || I18N.nl;
  document.documentElement.lang = lang;
  localStorage.setItem('lang', lang);
  // map [data-i18n="a.b.c"]
  $$('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n').split('.');
    let v = dict;
    key.forEach(k => v = (v||{})[k]);
    if(typeof v === 'string') el.textContent = v;
  });
  $$('.lang-btn').forEach(b=>b.classList.toggle('active', b.dataset.lang===lang));
}

function initLang(){
  const saved = localStorage.getItem('lang');
  const guess = (navigator.language || 'nl').slice(0,2);
  setLang(saved || (['nl','fr','en'].includes(guess)?guess:'nl'));
}

function smoothNav(){
  $$('.nav a, .cta a').forEach(a=>{
    a.addEventListener('click', e=>{
      if(a.hash){
        e.preventDefault();
        document.querySelector(a.hash).scrollIntoView({behavior:'smooth',block:'start'});
        history.pushState(null,'',a.hash);
      }
    });
  });
}

function burger(){
  const btn = $('.burger'), nav = $('.nav');
  btn.addEventListener('click', ()=>{
    const open = nav.style.display === 'flex';
    nav.style.display = open ? 'none' : 'flex';
    btn.setAttribute('aria-expanded', String(!open));
  });
}

function form(){
  const form = $('#contactForm'), note = $('#formNote');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    note.textContent = '…';
    const data = Object.fromEntries(new FormData(form).entries());
    // 🔌 Замените на ваш endpoint (Formspree/EmailJS/own API/Vercel function)
    try{
      // пример: await fetch('https://formspree.io/f/xxxx', {method:'POST', headers:{'Accept':'application/json'}, body:new FormData(form)});
      await new Promise(r=>setTimeout(r,600)); // имитация
      form.reset();
      note.textContent = {nl:"Bedankt! We nemen snel contact op.",
                          fr:"Merci ! On vous recontacte rapidement.",
                          en:"Thanks! We’ll get back to you soon."}[document.documentElement.lang] || "Thanks!";
    }catch(err){
      note.textContent = {nl:"Er ging iets mis. Probeer opnieuw.",
                          fr:"Une erreur est survenue. Réessayez.",
                          en:"Something went wrong. Try again."}[document.documentElement.lang] || "Error";
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  initLang();
  $$('.lang-btn').forEach(b=>b.addEventListener('click', ()=>setLang(b.dataset.lang)));
  smoothNav();
  burger();
  form();
});