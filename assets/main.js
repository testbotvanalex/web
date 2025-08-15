// /assets/main.js
(function(){
  const $=(q,d=document)=>d.querySelector(q), $$=(q,d=document)=>Array.from(d.querySelectorAll(q));

  const I18N={
    en:{
      nav:{home:"Home",pricing:"Pricing",usecases:"Use cases",faq:"FAQ",contact:"Contact"},
      cta:{demo:"Get a demo",pricing:"See pricing",usecases:"See use cases",start:"Start",wa:"WhatsApp"},
      home:{
        title:"Custom chatbots in 7–14 days",
        lead:"WhatsApp, Telegram, Instagram & web. We design, build and launch bots that convert — fast.",
        trust:"Trusted by small businesses & agencies",
        b1:{t:"Fast",d:"From brief to launch in 7–14 days with tight feedback loops."},
        b2:{t:"Custom",d:"Flows, tone and integrations tailored to your process."},
        b3:{t:"Integrated",d:"Calendars, CRM, payments, Sheets — we connect your stack."},
        "cta.t":"Ready to launch your chatbot?"
      },
      stats:{s1:"Lead→chat rate",s2:"Faster response",s3:"Automated handling"},
      pricing:{
        title:"Simple pricing",lead:"Pick a plan — upgrade anytime.",
        popular:"Most popular",
        starter:{title:"Starter",price:"€29",l1:"1 core flow (FAQ or lead capture)",l2:"1 platform (e.g. WhatsApp)",l3:"Up to 500 conversations/mo"},
        standard:{title:"Standard",price:"€99",l1:"Multi step flows (qualify + booking)",l2:"2 platforms",l3:"Priority support & updates",l4:"Up to 2,000 conversations/mo"},
        premium:{title:"Premium",price:"€299",l1:"Advanced AI & NLP tuning",l2:"Multi platform & system integrations",l3:"Dedicated PM & SLAs",l4:"Unlimited conversations"}
      },
      cases:{
        title:"Popular use cases",lead:"Short flows that convert — tailored to your business.",
        lead:{t:"Lead capture",d:"Turn clicks into qualified contacts with clear opt‑in and consent."},
        qual:{t:"Qualification",d:"Score leads by need, budget and timeline. Route instantly."},
        booking:{t:"Booking & reminders",d:"Auto‑book calendar slots, send reminders and follow‑ups."},
        pay:{t:"Payments / shop",d:"Checkout inside chat with Stripe and invoicing."}
      },
      faq:{
        title:"FAQ",lead:"Answers to common questions.",
        q1:{t:"How long does it take?",d:"Typically 7–14 days from brief to launch, depending on integrations."},
        q2:{t:"Which channels do you support?",d:"WhatsApp, Telegram, Instagram, web widget, and more on request."},
        q3:{t:"Do you handle GDPR?",d:"Yes. We include consent, data minimization and simple opt‑out."},
        q4:{t:"Can you integrate with our tools?",d:"We connect calendars, CRMs, payments, and spreadsheets via APIs."}
      },
      contact:{
        title:"Tell us about your bot",lead:"Share a few details and we’ll reply within 24h.",
        name:"Full name",email:"Work email",company:"Company / Industry",
        message:"What should the bot do? Platforms, flows, integrations…",
        gdpr:"I agree to be contacted about my request and accept the privacy policy.",
        send:"Send request",whatsapp:"Chat on WhatsApp"
      },
      ok:"✓ Thanks! We will reply within 24h."
    },
    nl:{
      nav:{home:"Home",pricing:"Prijzen",usecases:"Use cases",faq:"FAQ",contact:"Contact"},
      cta:{demo:"Plan een demo",pricing:"Bekijk prijzen",usecases:"Bekijk cases",start:"Start",wa:"WhatsApp"},
      home:{
        title:"Maatwerk chatbots in 7–14 dagen",
        lead:"WhatsApp, Telegram, Instagram & web. We bouwen en lanceren bots die converteren — snel.",
        trust:"Vertrouwd door kmo’s & agencies",
        b1:{t:"Snel",d:"Van briefing tot live in 7–14 dagen met korte feedback loops."},
        b2:{t:"Maatwerk",d:"Flows, tone of voice en integraties op maat van je proces."},
        b3:{t:"Geïntegreerd",d:"Agenda’s, CRM, betalingen, Sheets — we koppelen je stack."},
        "cta.t":"Klaar om je chatbot te lanceren?"
      },
      stats:{s1:"Lead→chat ratio",s2:"Sneller antwoord",s3:"Automatische afhandeling"},
      pricing:{
        title:"Eenvoudige prijzen",lead:"Kies een plan — upgraden kan altijd.",
        popular:"Meest gekozen",
        starter:{title:"Starter",price:"€29",l1:"1 kernflow (FAQ of lead capture)",l2:"1 platform (bv. WhatsApp)",l3:"Tot 500 conversaties/maand"},
        standard:{title:"Standaard",price:"€99",l1:"Meerstapsflows (kwalificatie + booking)",l2:"2 platformen",l3:"Prioritaire support & updates",l4:"Tot 2.000 conversaties/maand"},
        premium:{title:"Premium",price:"€299",l1:"Geavanceerde AI & NLP",l2:"Meerdere platformen & systemen",l3:"Dedicated PM & SLA’s",l4:"Onbeperkte conversaties"}
      },
      cases:{
        title:"Populaire use cases",lead:"Korte flows die converteren — op maat van jouw business.",
        lead:{t:"Lead capture",d:"Maak van kliks gekwalificeerde contacten met duidelijke opt‑in."},
        qual:{t:"Kwalificatie",d:"Scoreer leads op behoefte, budget en timing. Routeer direct."},
        booking:{t:"Boeken & reminders",d:"Plan automatisch agenda‑slots, stuur reminders en follow‑ups."},
        pay:{t:"Betalingen / shop",d:"Afrekenen in chat met Stripe en facturatie."}
      },
      faq:{
        title:"FAQ",lead:"Antwoorden op veelgestelde vragen.",
        q1:{t:"Hoe lang duurt het?",d:"Meestal 7–14 dagen van briefing tot live, afhankelijk van integraties."},
        q2:{t:"Welke kanalen ondersteunen jullie?",d:"WhatsApp, Telegram, Instagram, web widget, en meer op aanvraag."},
        q3:{t:"GDPR?",d:"Ja. Toestemming, dataminimalisatie en eenvoudige opt‑out inbegrepen."},
        q4:{t:"Koppelen jullie onze tools?",d:"Ja, agenda’s, CRM, betalingen en spreadsheets via API’s."}
      },
      contact:{
        title:"Vertel ons over je bot",lead:"Geef enkele details — we reageren binnen 24u.",
        name:"Volledige naam",email:"Zakelijk e‑mail",company:"Bedrijf / Sector",
        message:"Wat moet de bot doen? Platformen, flows, integraties…",
        gdpr:"Ik ga akkoord dat jullie me contacteren en accepteer het privacybeleid.",
        send:"Verstuur aanvraag",whatsapp:"Chat op WhatsApp"
      },
      ok:"✓ Bedankt! We reageren binnen 24 uur."
    },
    fr:{
      nav:{home:"Accueil",pricing:"Tarifs",usecases:"Cas d’usage",faq:"FAQ",contact:"Contact"},
      cta:{demo:"Demander une démo",pricing:"Voir les tarifs",usecases:"Voir les cas",start:"Commencer",wa:"WhatsApp"},
      home:{
        title:"Chatbots sur mesure en 7–14 jours",
        lead:"WhatsApp, Telegram, Instagram & web. Nous concevons, construisons et lançons des bots qui convertissent — vite.",
        trust:"Plébiscité par PME & agences",
        b1:{t:"Rapide",d:"Du brief au live en 7–14 jours avec itérations courtes."},
        b2:{t:"Sur‑mesure",d:"Parcours, ton et intégrations adaptés à vos process."},
        b3:{t:"Intégré",d:"Calendriers, CRM, paiements, Sheets — on connecte votre stack."},
        "cta.t":"Prêt à lancer votre chatbot ?"
      },
      stats:{s1:"Taux lead→chat",s2:"Réponse plus rapide",s3:"Traitement automatisé"},
      pricing:{
        title:"Tarification simple",lead:"Choisissez une offre — évolutive à tout moment.",
        popular:"Le plus populaire",
        starter:{title:"Starter",price:"€29",l1:"1 parcours clé (FAQ ou capture de leads)",l2:"1 plateforme (ex. WhatsApp)",l3:"Jusqu’à 500 conversations/mois"},
        standard:{title:"Standard",price:"€99",l1:"Parcours multi‑étapes (qualif + réservation)",l2:"2 plateformes",l3:"Support prioritaire & mises à jour",l4:"Jusqu’à 2 000 conversations/mois"},
        premium:{title:"Premium",price:"€299",l1:"IA & NLP avancés",l2:"Multi‑plateformes & systèmes",l3:"Chef de projet dédié & SLA",l4:"Conversations illimitées"}
      },
      cases:{
        title:"Cas d’usage populaires",lead:"Parcours courts et efficaces — adaptés à votre activité.",
        lead:{t:"Capture de leads",d:"Transformez les clics en contacts qualifiés avec opt‑in clair."},
        qual:{t:"Qualification",d:"Scorez par besoin, budget et délai. Routage instantané."},
        booking:{t:"Prise de RDV & rappels",d:"Réservation automatique, rappels et relances."},
        pay:{t:"Paiements / boutique",d:"Paiement en chat avec Stripe et facturation."}
      },
      faq:{
        title:"FAQ",lead:"Réponses aux questions fréquentes.",
        q1:{t:"Combien de temps ?",d:"Généralement 7–14 jours du brief au live, selon les intégrations."},
        q2:{t:"Quels canaux ?",d:"WhatsApp, Telegram, Instagram, widget web, et plus sur demande."},
        q3:{t:"RGPD ?",d:"Oui. Consentement, minimisation des données et opt‑out inclus."},
        q4:{t:"Intégrations ?",d:"Calendriers, CRM, paiements et feuilles de calcul via API."}
      },
      contact:{
        title:"Parlez‑nous de votre bot",lead:"Partagez quelques détails — réponse sous 24 h.",
        name:"Nom complet",email:"Email professionnel",company:"Entreprise / Secteur",
        message:"Que doit faire le bot ? Plateformes, parcours, intégrations…",
        gdpr:"J’accepte d’être contacté pour ma demande et j’accepte la politique de confidentialité.",
        send:"Envoyer la demande",whatsapp:"Discuter sur WhatsApp"
      },
      ok:"✓ Merci ! Réponse sous 24 h."
    }
  };

  function applyI18n(lang){
    if(!I18N[lang]) lang='en';
    document.documentElement.lang=lang;
    document.documentElement.setAttribute('data-lang',lang);
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const path=el.getAttribute('data-i18n').split('.');
      let val=I18N[lang];
      for(const k of path){ val = val?.[k]; }
      if(typeof val==='string') el.textContent=val;
    });
    document.querySelectorAll('.lang button').forEach(b=>{
      const on=b.dataset.lang===lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    try{
      localStorage.setItem('botmatic_lang',lang);
      const u=new URL(location.href); u.searchParams.set('lang',lang); history.replaceState(null,'',u);
    }catch{}
  }

  function bindLang(){
    document.querySelectorAll('.lang button').forEach(b=>b.addEventListener('click',()=>applyI18n(b.dataset.lang)));
    let initial='en';
    try{
      const saved=localStorage.getItem('botmatic_lang');
      initial = (new URL(location.href)).searchParams.get('lang') || saved || 'en';
    }catch{}
    applyI18n(initial);
  }

  function bindMenu(){
    const btn=document.querySelector('.mobile-toggle');
    const menu=document.getElementById('mainmenu');
    if(!btn||!menu) return;
    const scrim=document.createElement('div'); scrim.className='scrim'; document.body.appendChild(scrim); scrim.hidden=true;
    const close=()=>{menu.classList.remove('open'); document.body.classList.remove('menu-open'); btn.setAttribute('aria-expanded','false'); scrim.hidden=true;};
    const open =()=>{menu.classList.add('open'); document.body.classList.add('menu-open'); btn.setAttribute('aria-expanded','true'); scrim.hidden=false;};
    btn.addEventListener('click', ()=> menu.classList.contains('open')?close():open());
    scrim.addEventListener('click', close);
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
    document.querySelectorAll('#mainmenu a').forEach(a=>a.addEventListener('click', close));
    const mq=matchMedia('(min-width:900px)'); (mq.addEventListener?mq.addEventListener('change',()=>mq.matches&&close()):mq.addListener(()=>mq.matches&&close()));
  }

  function bindContact(){
    const form=document.getElementById('contactForm'), ok=document.getElementById('contactOk'); if(!form) return;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd=new FormData(form);
      if(!fd.get('name')||!fd.get('email')||!fd.get('gdpr')) return;
      ok.textContent = I18N[document.documentElement.getAttribute('data-lang')||'en'].ok;
      ok.classList.remove('hidden');
      form.reset();
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    bindLang(); bindMenu(); bindContact();
    const y=document.getElementById('y'); if(y) y.textContent=new Date().getFullYear();
  });
})();