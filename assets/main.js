// main.js
(function(){
  function ready(fn){ if(document.readyState!=='loading'){fn()} else {document.addEventListener('DOMContentLoaded', fn, {once:true})} }

  const I18N = {
    en:{
      nav:{features:"Features",pricing:"Pricing",contact:"Contact",demo:"Get a Demo"},
      hero:{
        badge1:"⚡ 7–14 days delivery",
        badge2:"🧩 Fully custom flows",
        badge3:"🔌 CRM & payments",
        title:"Custom chatbots for WhatsApp, Telegram & Instagram — built fast",
        subtitle:"We build bots that capture leads, qualify them and auto‑book. Simple setup, rapid turnaround, ongoing support.",
        ctaPrimary:"Start a project",
        ctaSecondary:"See pricing"
      },
      stats:{s1:"Lead‑to‑chat rate",s2:"Faster response",s3:"Automated handling"},
      demo:{
        bot1:"Hi! I’m BotMatic. What do you need help with?",
        k1:"Book an appointment", k2:"Prices", k3:"Talk to agent",
        user1:"Book a facial this Friday", bot2:"Great! Morning or afternoon works best?",
        user2:"Afternoon", bot3:"Done ✅ 16:30 reserved. You’ll get a reminder 2h before."
      },
      features:{
        title:"Why teams choose BotMatic",
        lead:"Everything you need to go from idea to a live, revenue‑generating chatbot.",
        f1:{title:"Fast delivery",desc:"From brief to launch in 7–14 days with tight feedback loops."},
        f2:{title:"AI + buttons UX",desc:"Blend guided flows with AI answers for speed and control."},
        f3:{title:"Integrations",desc:"CRM, calendars, payments, Google Sheets — we connect your stack."},
        f4:{title:"Qualify & convert",desc:"Score leads, route hot prospects, and auto‑book in one flow."},
        f5:{title:"GDPR‑ready",desc:"Clear consent, data minimization and opt‑out built‑in."},
        f6:{title:"Ongoing support",desc:"We tune copy, steps and KPIs as your needs evolve."}
      },
      pricing:{
        title:"Simple pricing",
        lead:"Pick a plan — cancel or upgrade anytime. Custom enterprise plans on request.",
        starter:{title:"Starter",price:"€29",l1:"1 core flow (FAQ or lead capture)",l2:"1 platform (e.g. WhatsApp)",l3:"Up to 500 conversations/mo",cta:"Choose Starter",note:"Good for MVPs and small teams."},
        standard:{title:"Standard",price:"€99",l1:"Multi‑step flows (qualify + booking)",l2:"2 platforms",l3:"Priority support & updates",l4:"Up to 2,000 conversations/mo",cta:"Choose Standard",note:"Our most popular plan."},
        premium:{title:"Premium",price:"€299",l1:"Advanced AI & NLP tuning",l2:"Multi‑platform & system integrations",l3:"Dedicated PM & SLAs",l4:"Unlimited conversations",cta:"Choose Premium",note:"For scale‑ups and enterprises."}
      },
      contact:{
        title:"Tell us about your bot",
        lead:"Share a few details and we’ll get back within 24 hours.",
        name:"Full name", email:"Work email", company:"Company / Industry",
        message:"What should the bot do? Platforms, flows, integrations…",
        gdpr:"I agree to be contacted about my request and accept the privacy policy.",
        send:"Send request", emailus:"Email us", seedemo:"See demo"
      },
      footer:{tagline:"Custom chatbots for WhatsApp, Telegram, Instagram & web."}
    },
    nl:{
      nav:{features:"Functies",pricing:"Prijzen",contact:"Contact",demo:"Vraag een demo"},
      hero:{
        badge1:"⚡ Levering in 7–14 dagen",
        badge2:"🧩 Volledig maatwerk",
        badge3:"🔌 CRM & betalingen",
        title:"Maatwerk chatbots voor WhatsApp, Telegram & Instagram — razendsnel gebouwd",
        subtitle:"We bouwen bots die leads vangen, kwalificeren en automatisch boeken. Simpele setup, snelle doorlooptijd, blijvende support.",
        ctaPrimary:"Start een project",
        ctaSecondary:"Bekijk prijzen"
      },
      stats:{s1:"Lead‑naar‑chat ratio",s2:"Snellere reactie",s3:"Automatische afhandeling"},
      demo:{
        bot1:"Hoi! Ik ben BotMatic. Waarmee kan ik helpen?",
        k1:"Afspraak maken", k2:"Prijzen", k3:"Praat met agent",
        user1:"Boek een gezichtsbehandeling voor vrijdag", bot2:"Top! Voorkeur voor ochtend of namiddag?",
        user2:"Namiddag", bot3:"Klaar ✅ 16:30 gereserveerd. Je krijgt 2u op voorhand een herinnering."
      },
      features:{
        title:"Waarom teams voor BotMatic kiezen",
        lead:"Alles wat je nodig hebt om snel live te gaan met een chatbot die oplevert.",
        f1:{title:"Snel leveren",desc:"Van briefing tot live in 7–14 dagen met korte feedback‑loops."},
        f2:{title:"AI + knoppen UX",desc:"Geleide flows combineren met AI‑antwoorden voor snelheid en controle."},
        f3:{title:"Integraties",desc:"CRM, agenda’s, betalingen, Google Sheets — wij koppelen je stack."},
        f4:{title:"Kwalificeren & converteren",desc:"Scoor leads, stuur hot prospects door en boek automatisch."},
        f5:{title:"GDPR‑proof",desc:"Duidelijke toestemming, dataminimalisatie en opt‑out ingebouwd."},
        f6:{title:"Doorlopende support",desc:"We finetunen copy, stappen en KPI’s wanneer je groeit."}
      },
      pricing:{
        title:"Eenvoudige prijzen",
        lead:"Kies een plan — maandelijks opzegbaar of op te schalen. Enterprise op aanvraag.",
        starter:{title:"Starter",price:"€29",l1:"1 kernflow (FAQ of lead capture)",l2:"1 platform (bv. WhatsApp)",l3:"Tot 500 conversaties/maand",cta:"Kies Starter",note:"Voor MVP’s en kleine teams."},
        standard:{title:"Standaard",price:"€99",l1:"Meerstapsflows (kwalificatie + booking)",l2:"2 platformen",l3:"Prioritaire support & updates",l4:"Tot 2.000 conversaties/maand",cta:"Kies Standaard",note:"Meest gekozen plan."},
        premium:{title:"Premium",price:"€299",l1:"Geavanceerde AI & NLP",l2:"Meerdere platformen & systemen",l3:"Dedicated PM & SLA’s",l4:"Onbeperkte conversaties",cta:"Kies Premium",note:"Voor scale‑ups en enterprises."}
      },
      contact:{
        title:"Vertel ons over je bot",
        lead:"Geef wat details en we reageren binnen 24 uur.",
        name:"Volledige naam", email:"Zakelijk e‑mail", company:"Bedrijf / Sector",
        message:"Wat moet de bot doen? Platformen, flows, integraties…",
        gdpr:"Ik ga akkoord dat jullie me contacteren en accepteer het privacybeleid.",
        send:"Verstuur aanvraag", emailus:"Mail ons", seedemo:"Bekijk demo"
      },
      footer:{tagline:"Maatwerk chatbots voor WhatsApp, Telegram, Instagram & web."}
    },
    fr:{
      nav:{features:"Fonctionnalités",pricing:"Tarifs",contact:"Contact",demo:"Demander une démo"},
      hero:{
        badge1:"⚡ Livraison en 7–14 jours",
        badge2:"🧩 Parcours 100% sur‑mesure",
        badge3:"🔌 CRM & paiements",
        title:"Chatbots sur‑mesure pour WhatsApp, Telegram & Instagram — déployés vite",
        subtitle:"Nous créons des bots qui captent, qualifient et réservent automatiquement. Mise en place simple, délai court, support continu.",
        ctaPrimary:"Lancer un projet",
        ctaSecondary:"Voir les tarifs"
      },
      stats:{s1:"Taux lead→chat",s2:"Réponse plus rapide",s3:"Traitement automatisé"},
      demo:{
        bot1:"Salut ! Je suis BotMatic. Je peux t’aider ?",
        k1:"Prendre rendez‑vous", k2:"Tarifs", k3:"Parler à un agent",
        user1:"Réserver un soin visage vendredi", bot2:"Parfait ! Matin ou après‑midi ?",
        user2:"Après‑midi", bot3:"C’est fait ✅ 16:30 réservé. Rappel 2h avant."
      },
      features:{
        title:"Pourquoi choisir BotMatic",
        lead:"Tout pour passer de l’idée à un chatbot qui génère des revenus.",
        f1:{title:"Livraison rapide",desc:"Du brief au live en 7–14 jours avec itérations serrées."},
        f2:{title:"IA + boutons",desc:"Mélange de parcours guidés et réponses IA pour vitesse & contrôle."},
        f3:{title:"Intégrations",desc:"CRM, calendriers, paiements, Google Sheets — on connecte votre stack."},
        f4:{title:"Qualifier & convertir",desc:"Scorage de leads, routage des prospects chauds et réservation auto."},
        f5:{title:"Conforme RGPD",desc:"Consentement clair, minimisation des données et opt‑out inclus."},
        f6:{title:"Support continu",desc:"On ajuste la copie, les étapes et KPI au fil du temps."}
      },
      pricing:{
        title:"Tarification simple",
        lead:"Choisissez un forfait — résiliable ou évolutif à tout moment. Entreprise sur demande.",
        starter:{title:"Starter",price:"€29",l1:"1 parcours clé (FAQ ou capture de leads)",l2:"1 plateforme (ex. WhatsApp)",l3:"Jusqu’à 500 conversations/mois",cta:"Choisir Starter",note:"Idéal pour MVP et petites équipes."},
        standard:{title:"Standard",price:"€99",l1:"Parcours multi‑étapes (qualif + réservation)",l2:"2 plateformes",l3:"Support prioritaire & mises à jour",l4:"Jusqu’à 2 000 conversations/mois",cta:"Choisir Standard",note:"Notre offre la plus populaire."},
        premium:{title:"Premium",price:"€299",l1:"IA & NLP avancés",l2:"Multi‑plateformes & systèmes",l3:"Chef de projet dédié & SLA",l4:"Conversations illimitées",cta:"Choisir Premium",note:"Pour scale‑ups et grands comptes."}
      },
      contact:{
        title:"Parlez‑nous de votre bot",
        lead:"Partagez quelques détails et nous revenons vers vous sous 24h.",
        name:"Nom complet", email:"Email professionnel", company:"Entreprise / Secteur",
        message:"Que doit faire le bot ? Plateformes, parcours, intégrations…",
        gdpr:"J’accepte d’être contacté au sujet de ma demande et j’accepte la politique de confidentialité.",
        send:"Envoyer la demande", emailus:"Nous écrire", seedemo:"Voir la démo"
      },
      footer:{tagline:"Chatbots sur‑mesure pour WhatsApp, Telegram, Instagram & web."}
    }
  };

  function applyI18n(lang){
    const dict = I18N[lang] || I18N.en;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);

    // text nodes
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const path = el.getAttribute('data-i18n').split('.');
      let val = dict;
      for(const key of path){ if(val && key in val){ val = val[key]; } }
      if(typeof val === 'string'){ el.textContent = val; }
    });

    // placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      const path = el.getAttribute('data-i18n-placeholder').split('.');
      let val = dict;
      for(const key of path){ if(val && key in val){ val = val[key]; } }
      if(typeof val === 'string'){ el.setAttribute('placeholder', val); }
    });

    // active pill
    document.querySelectorAll('.lang button').forEach(b=>{
      b.classList.toggle('active', b.dataset.lang === lang);
    });

    // persist
    try { localStorage.setItem('botmatic_lang', lang); } catch(e){}
  }

  ready(function(){
    // Mobile menu
    var btn  = document.querySelector('.mobile-toggle');
    var menu = document.getElementById('mainmenu');
    if(btn && menu){
      var closeMenu = function(){
        menu.classList.remove('open');
        document.body.classList.remove('menu-open');
        btn.setAttribute('aria-expanded','false');
      };
      btn.addEventListener('click', function(){
        var open = menu.classList.toggle('open');
        document.body.classList.toggle('menu-open', open);
        btn.setAttribute('aria-expanded', String(open));
      }, false);
      Array.prototype.forEach.call(menu.querySelectorAll('a'), function(a){
        a.addEventListener('click', closeMenu, false);
      });
      document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeMenu(); }, false);
      var mq = window.matchMedia('(min-width: 768px)');
      var handleMQ = function(){ if(mq.matches){ closeMenu(); } };
      if(mq.addEventListener) mq.addEventListener('change', handleMQ); else mq.addListener(handleMQ);
    }

    // Language
    var saved = null;
    try { saved = localStorage.getItem('botmatic_lang'); } catch(e){}
    var initial = (saved && I18N[saved]) ? saved : (document.documentElement.getAttribute('lang') || 'en');
    if(!I18N[initial]) initial = 'en';
    applyI18n(initial);

    document.querySelectorAll('.lang button').forEach(function(b){
      b.addEventListener('click', function(){
        var lang = (b.getAttribute('data-lang') || 'en').toLowerCase();
        applyI18n(lang);
      }, false);
    });
  });
})();
