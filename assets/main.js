(function(){
  const $ = (q,ctx=document)=>ctx.querySelector(q);
  const $$ = (q,ctx=document)=>Array.from(ctx.querySelectorAll(q));
  const on = (el,ev,fn)=>el&&el.addEventListener(ev,fn);
  const dl = (e)=>{ window.dataLayer = window.dataLayer || []; window.dataLayer.push({ts:Date.now(),...e}); };

  const I18N = {
    en:{ nav:{features:"Features",pricing:"Pricing",contact:"Contact",demo:"Get a Demo"},
      hero:{badge1:"⚡ 7–14 days delivery",badge2:"🧩 Fully custom flows",badge3:"🔌 CRM & payments",
        title:"Custom chatbots for WhatsApp, Telegram & Instagram — built fast",
        subtitle:"We build bots that capture leads, qualify them and auto-book. Simple setup, rapid turnaround, ongoing support.",
        ctaPrimary:"Start a project", ctaSecondary:"See pricing"},
      stats:{s1:"Lead to chat rate",s2:"Faster response",s3:"Automated handling"},
      demo:{bot1:"Hi! I’m BotMatic. What do you need help with?",k1:"Book an appointment",k2:"Prices",k3:"Talk to agent",
        user1:"Book a facial this Friday",bot2:"Great! Morning or afternoon works best?",user2:"Afternoon",bot3:"Done ✅ 16:30 reserved. You’ll get a reminder 2h before."},
      features:{title:"Why teams choose BotMatic",lead:"Everything you need to go from idea to a live, revenue-generating chatbot.",
        f1:{title:"Fast delivery",desc:"From brief to launch in 7–14 days with tight feedback loops."},
        f2:{title:"AI + buttons UX",desc:"Blend guided flows with AI answers for speed and control."},
        f3:{title:"Integrations",desc:"CRM, calendars, payments, Google Sheets — we connect your stack."}},
      pricing:{title:"Simple pricing",lead:"Pick a plan — cancel or upgrade anytime.",
        starter:{title:"Starter",price:"€29",l1:"1 core flow (FAQ or lead capture)",l2:"1 platform (e.g. WhatsApp)",l3:"Up to 500 conversations/mo",cta:"Choose Starter"},
        standard:{title:"Standard",price:"€99",l1:"Multi step flows (qualify + booking)",l2:"2 platforms",l3:"Priority support & updates",cta:"Choose Standard"},
        premium:{title:"Premium",price:"€299",l1:"Advanced AI & NLP tuning",l2:"Multi platform & integrations",l3:"Dedicated PM & SLAs",cta:"Choose Premium"},
        note:"All plans include a free mini audit. Custom enterprise plans on request."},
      contact:{title:"Tell us about your bot",lead:"Share a few details and we’ll get back within 24 hours.",
        name:"Full name", email:"Work email", message:"What should the bot do? Platforms, flows, integrations…",
        gdpr:"I agree to be contacted about my request and accept the privacy policy.", send:"Send request", emailus:"Email us"},
      footer:{tagline:"Custom chatbots for WhatsApp, Telegram, Instagram & web."}
    },
    nl:{ nav:{features:"Functies",pricing:"Prijzen",contact:"Contact",demo:"Vraag een demo"},
      hero:{badge1:"⚡ Levering in 7–14 dagen",badge2:"🧩 Volledig maatwerk",badge3:"🔌 CRM & betalingen",
        title:"Maatwerk chatbots voor WhatsApp, Telegram & Instagram — razendsnel gebouwd",
        subtitle:"We bouwen bots die leads vangen, kwalificeren en automatisch boeken. Simpele setup, snelle doorlooptijd, blijvende support.",
        ctaPrimary:"Start een project", ctaSecondary:"Bekijk prijzen"},
      stats:{s1:"Lead naar chat ratio",s2:"Snellere reactie",s3:"Automatische afhandeling"},
      demo:{bot1:"Hoi! Ik ben BotMatic. Waarmee kan ik helpen?",k1:"Afspraak maken",k2:"Prijzen",k3:"Praat met agent",
        user1:"Boek een gezichtsbehandeling voor vrijdag",bot2:"Top! Ochtend of namiddag?",user2:"Namiddag",bot3:"Klaar ✅ 16:30 gereserveerd. Je krijgt 2u op voorhand een herinnering."},
      features:{title:"Waarom teams voor BotMatic kiezen",lead:"Alles wat je nodig hebt om snel live te gaan met een chatbot die oplevert.",
        f1:{title:"Snel leveren",desc:"Van briefing tot live in 7–14 dagen met korte feedback loops."},
        f2:{title:"AI + knoppen UX",desc:"Geleide flows combineren met AI antwoorden voor snelheid en controle."},
        f3:{title:"Integraties",desc:"CRM, agenda’s, betalingen, Google Sheets — wij koppelen je stack."}},
      pricing:{title:"Eenvoudige prijzen",lead:"Kies een plan — maandelijks opzegbaar of op te schalen.",
        starter:{title:"Starter",price:"€29",l1:"1 kernflow (FAQ of lead capture)",l2:"1 platform (bv. WhatsApp)",l3:"Tot 500 conversaties/maand",cta:"Kies Starter"},
        standard:{title:"Standaard",price:"€99",l1:"Meerstapsflows (kwalificatie + booking)",l2:"2 platformen",l3:"Prioritaire support & updates",cta:"Kies Standaard"},
        premium:{title:"Premium",price:"€299",l1:"Geavanceerde AI & NLP",l2:"Meerdere platformen & integraties",l3:"Dedicated PM & SLA’s",cta:"Kies Premium"},
        note:"Alle pakketten inclusief gratis mini-audit. Enterprise op aanvraag."},
      contact:{title:"Vertel ons over je bot",lead:"Geef wat details en we reageren binnen 24 uur.",
        name:"Volledige naam", email:"Zakelijk e‑mail", message:"Wat moet de bot doen? Platformen, flows, integraties…",
        gdpr:"Ik ga akkoord dat jullie me contacteren en accepteer het privacybeleid.", send:"Verstuur aanvraag", emailus:"Mail ons"},
      footer:{tagline:"Maatwerk chatbots voor WhatsApp, Telegram, Instagram & web."}
    },
    fr:{ nav:{features:"Fonctionnalités",pricing:"Tarifs",contact:"Contact",demo:"Demander une démo"},
      hero:{badge1:"⚡ Livraison en 7–14 jours",badge2:"🧩 Parcours 100% sur mesure",badge3:"🔌 CRM & paiements",
        title:"Chatbots sur mesure pour WhatsApp, Telegram & Instagram — déployés vite",
        subtitle:"Nous créons des bots qui captent, qualifient et réservent automatiquement. Mise en place simple, délai court, support continu.",
        ctaPrimary:"Lancer un projet", ctaSecondary:"Voir les tarifs"},
      stats:{s1:"Taux lead→chat",s2:"Réponse plus rapide",s3:"Traitement automatisé"},
      demo:{bot1:"Salut ! Je suis BotMatic. Je peux t’aider ?",k1:"Prendre rendez‑vous",k2:"Tarifs",k3:"Parler à un agent",
        user1:"Réserver un soin visage vendredi",bot2:"Parfait ! Matin ou après‑midi ?",user2:"Après‑midi",bot3:"C’est fait ✅ 16:30 réservé. Rappel 2h avant."},
      features:{title:"Pourquoi choisir BotMatic",lead:"Tout pour passer de l’idée à un chatbot qui génère des revenus.",
        f1:{title:"Livraison rapide",desc:"Du brief au live en 7–14 jours avec itérations serrées."},
        f2:{title:"IA + boutons",desc:"Mélange de parcours guidés et réponses IA pour vitesse & contrôle."},
        f3:{title:"Intégrations",desc:"CRM, calendriers, paiements, Google Sheets — on connecte votre stack."}},
      pricing:{title:"Tarification simple",lead:"Choisissez un forfait — résiliable ou évolutif à tout moment.",
        starter:{title:"Starter",price:"€29",l1:"1 parcours clé (FAQ ou capture de leads)",l2:"1 plateforme (ex. WhatsApp)",l3:"Jusqu’à 500 conversations/mois",cta:"Choisir Starter"},
        standard:{title:"Standard",price:"€99",l1:"Parcours multi‑étapes (qualif + réservation)",l2:"2 plateformes",l3:"Support prioritaire & MAJ",cta:"Choisir Standard"},
        premium:{title:"Premium",price:"€299",l1:"IA & NLP avancés",l2:"Multi‑plateformes & intégrations",l3:"Chef de projet dédié & SLA",cta:"Choisir Premium"},
        note:"Tous les plans incluent un mini‑audit gratuit. Entreprise sur demande."},
      contact:{title:"Parlez‑nous de votre bot",lead:"Partagez quelques détails et nous revenons sous 24 h.",
        name:"Nom complet", email:"Email professionnel", message:"Que doit faire le bot ? Plateformes, parcours, intégrations…",
        gdpr:"J’accepte d’être contacté et j’accepte la politique de confidentialité.", send:"Envoyer la demande", emailus:"Nous écrire"},
      footer:{tagline:"Chatbots sur mesure pour WhatsApp, Telegram, Instagram & web."}
    }
  };

  function t(dict, path){
    return path.split('.').reduce((a,k)=>a&&a[k], dict);
  }

  function applyI18n(lang){
    const d = I18N[lang] || I18N.en;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      const v = t(d, key); if(typeof v==='string') el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      const key = el.getAttribute('data-i18n-placeholder');
      const v = t(d, key); if(typeof v==='string') el.setAttribute('placeholder', v);
    });
    $$('.lang button').forEach(b=>b.classList.toggle('active', b.dataset.lang===lang));

    // persist + URL
    try{ localStorage.setItem('botmatic_lang', lang); }catch(e){}
    try{ const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null,'',u); }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // Mobile menu
    const btn=$('.mobile-toggle'), menu=$('#mainmenu');
    if(btn && menu){
      const close=()=>{ menu.classList.remove('open'); document.body.classList.remove('menu-open'); btn.setAttribute('aria-expanded','false'); };
      btn.addEventListener('click', ()=>{
        const open = menu.classList.toggle('open'); document.body.classList.toggle('menu-open', open); btn.setAttribute('aria-expanded', String(open));
      });
      $$('#mainmenu a').forEach(a=>a.addEventListener('click', close));
      const mq=matchMedia('(min-width:768px)'); (mq.addEventListener?mq.addEventListener('change',()=>mq.matches&&close()):mq.addListener(()=>mq.matches&&close()));
    }

    // Language init
    let qp=null; try{ qp=new URL(location.href).searchParams.get('lang'); }catch(e){}
    let saved=null; try{ saved=localStorage.getItem('botmatic_lang'); }catch(e){}
    let initial = (qp && I18N[qp]) ? qp : (saved && I18N[saved]) ? saved : 'en';
    applyI18n(initial);
    $$('.lang button').forEach(b=>b.addEventListener('click', ()=>applyI18n(b.dataset.lang)));

    // Pricing → prefill contact
    $$('.cta-plan').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const plan = btn.closest('.plan')?.dataset.plan || 'Starter';
        const msg = $('#contact textarea[name="message"]');
        if(msg && !msg.value) msg.value = `[Selected plan]: ${plan}\n`;
        dl({event:'pricing_click', plan});
      });
    });

    // Contact form
    const form = $('#contactForm'), ok = $('#contactOk');
    if(form){
      form.addEventListener('submit', (e)=>{
        e.preventDefault();
        const fd = new FormData(form);
        if(!fd.get('name') || !fd.get('email') || !fd.get('gdpr')) return;
        if(ok){ ok.textContent='✓ Thanks! We will reply within 24h.'; ok.classList.remove('hidden'); }
        form.reset();
        dl({event:'contact_submit'});
      });
    }
  });
})();
