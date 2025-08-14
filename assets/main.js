// main.js
(function(){
  function ready(fn){ if(document.readyState!=='loading'){fn()} else {document.addEventListener('DOMContentLoaded', fn, {once:true})} }
  const $ = (q,ctx=document)=>ctx.querySelector(q);
  const $$ = (q,ctx=document)=>Array.from(ctx.querySelectorAll(q));
  const dl = (...args)=>{ window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({ts:Date.now()}, ...args)); };

  // ===== I18N =====
  const I18N = {
    en:{ nav:{features:"Features",pricing:"Pricing",contact:"Contact",demo:"Get a Demo"},
      hero:{badge1:"⚡ 7–14 days delivery",badge2:"🧩 Fully custom flows",badge3:"🔌 CRM & payments",
        title:"Custom chatbots for WhatsApp, Telegram & Instagram — built fast",
        subtitle:"We build bots that capture leads, qualify them and auto book. Simple setup, rapid turnaround, ongoing support.",
        ctaPrimary:"Start a project", ctaSecondary:"See pricing"},
      stats:{s1:"Lead to chat rate",s2:"Faster response",s3:"Automated handling"},
      demo:{bot1:"Hi! I’m BotMatic. What do you need help with?",k1:"Book an appointment",k2:"Prices",k3:"Talk to agent",
        user1:"Book a facial this Friday",bot2:"Great! Morning or afternoon works best?",user2:"Afternoon",bot3:"Done ✅ 16:30 reserved. You’ll get a reminder 2h before."},
      funnel:{
        step1:{title:"What do you want to build?",lead:"Pick a use case. We’ll tailor the plan in 30 seconds."},
        cases:{lead:"Lead capture",qualify:"Qualification",booking:"Booking",payments:"Payments / Shop"},
        step2:{title:"Tell us a bit more",lead:"3 quick choices — channels, integrations and timeline."},
        q:{channels:{title:"Which channels?"},integrations:{title:"Integrations"},deadline:{title:"Deadline"}},
        actions:{seeplan:"See plan & price",book:"Book a demo",whatsapp:"Talk on WhatsApp"},
        step3:{title:"Recommended plan",lead:"This is a starting point — we tailor it on the demo call."}
      },
      features:{title:"Why teams choose BotMatic",lead:"Everything you need to go from idea to a live, revenue generating chatbot.",
        f1:{title:"Fast delivery",desc:"From brief to launch in 7–14 days with tight feedback loops."},
        f2:{title:"AI + buttons UX",desc:"Blend guided flows with AI answers for speed and control."},
        f3:{title:"Integrations",desc:"CRM, calendars, payments, Google Sheets — we connect your stack."},
        f4:{title:"Qualify & convert",desc:"Score leads, route hot prospects, and auto book in one flow."},
        f5:{title:"GDPR ready",desc:"Clear consent, data minimization and opt out built in."},
        f6:{title:"Ongoing support",desc:"We tune copy, steps and KPIs as your needs evolve."}},
      pricing:{title:"Simple pricing",lead:"Pick a plan — cancel or upgrade anytime. Custom enterprise plans on request.",
        starter:{title:"Starter",price:"€29",l1:"1 core flow (FAQ or lead capture)",l2:"1 platform (e.g. WhatsApp)",l3:"Up to 500 conversations/mo",cta:"Choose Starter",note:"Good for MVPs and small teams."},
        standard:{title:"Standard",price:"€99",l1:"Multi step flows (qualify + booking)",l2:"2 platforms",l3:"Priority support & updates",l4:"Up to 2,000 conversations/mo",cta:"Choose Standard",note:"Our most popular plan."},
        premium:{title:"Premium",price:"€299",l1:"Advanced AI & NLP tuning",l2:"Multi platform & system integrations",l3:"Dedicated PM & SLAs",l4:"Unlimited conversations",cta:"Choose Premium",note:"For scale ups and enterprises."}},
      contact:{title:"Tell us about your bot",lead:"Share a few details and we’ll get back within 24 hours.",
        name:"Full name", email:"Work email", company:"Company / Industry", message:"What should the bot do? Platforms, flows, integrations…",
        gdpr:"I agree to be contacted about my request and accept the privacy policy.", send:"Send request", emailus:"Email us", seedemo:"See demo"},
      footer:{tagline:"Custom chatbots for WhatsApp, Telegram, Instagram & web."}
    },
    nl:{ nav:{features:"Functies",pricing:"Prijzen",contact:"Contact",demo:"Vraag een demo"},
      hero:{badge1:"⚡ Levering in 7–14 dagen",badge2:"🧩 Volledig maatwerk",badge3:"🔌 CRM & betalingen",
        title:"Maatwerk chatbots voor WhatsApp, Telegram & Instagram — razendsnel gebouwd",
        subtitle:"We bouwen bots die leads vangen, kwalificeren en automatisch boeken. Simpele setup, snelle doorlooptijd, blijvende support.",
        ctaPrimary:"Start een project", ctaSecondary:"Bekijk prijzen"},
      stats:{s1:"Lead naar chat ratio",s2:"Snellere reactie",s3:"Automatische afhandeling"},
      demo:{bot1:"Hoi! Ik ben BotMatic. Waarmee kan ik helpen?",k1:"Afspraak maken",k2:"Prijzen",k3:"Praat met agent",
        user1:"Boek een gezichtsbehandeling voor vrijdag",bot2:"Top! Voorkeur voor ochtend of namiddag?",user2:"Namiddag",bot3:"Klaar ✅ 16:30 gereserveerd. Je krijgt 2u op voorhand een herinnering."},
      funnel:{
        step1:{title:"Wat wil je bouwen?",lead:"Kies een use case. In 30 sec tonen we een plan."},
        cases:{lead:"Lead capture",qualify:"Kwalificatie",booking:"Booking",payments:"Betalingen / Shop"},
        step2:{title:"Vertel kort wat meer",lead:"3 keuzes — kanalen, integraties en timing."},
        q:{channels:{title:"Welke kanalen?"},integrations:{title:"Integraties"},deadline:{title:"Deadline"}},
        actions:{seeplan:"Toon plan & prijs",book:"Plan een demo",whatsapp:"WhatsApp gesprek"},
        step3:{title:"Aanbevolen pakket",lead:"Startpunt — finetunen doen we tijdens de demo."}
      },
      features:{title:"Waarom teams voor BotMatic kiezen",lead:"Alles wat je nodig hebt om snel live te gaan met een chatbot die oplevert.",
        f1:{title:"Snel leveren",desc:"Van briefing tot live in 7–14 dagen met korte feedback loops."},
        f2:{title:"AI + knoppen UX",desc:"Geleide flows combineren met AI antwoorden voor snelheid en controle."},
        f3:{title:"Integraties",desc:"CRM, agenda’s, betalingen, Google Sheets — wij koppelen je stack."},
        f4:{title:"Kwalificeren & converteren",desc:"Scoor leads, stuur hot prospects door en boek automatisch."},
        f5:{title:"GDPR proof",desc:"Duidelijke toestemming, dataminimalisatie en opt out ingebouwd."},
        f6:{title:"Doorlopende support",desc:"We finetunen copy, stappen en KPI’s wanneer je groeit."}},
      pricing:{title:"Eenvoudige prijzen",lead:"Kies een plan — maandelijks opzegbaar of op te schalen. Enterprise op aanvraag.",
        starter:{title:"Starter",price:"€29",l1:"1 kernflow (FAQ of lead capture)",l2:"1 platform (bv. WhatsApp)",l3:"Tot 500 conversaties/maand",cta:"Kies Starter",note:"Voor MVP’s en kleine teams."},
        standard:{title:"Standaard",price:"€99",l1:"Meerstapsflows (kwalificatie + booking)",l2:"2 platformen",l3:"Prioritaire support & updates",l4:"Tot 2.000 conversaties/maand",cta:"Kies Standaard",note:"Meest gekozen plan."},
        premium:{title:"Premium",price:"€299",l1:"Geavanceerde AI & NLP",l2:"Meerdere platformen & systemen",l3:"Dedicated PM & SLA’s",l4:"Onbeperkte conversaties",cta:"Kies Premium",note:"Voor scale ups en enterprises."}},
      contact:{title:"Vertel ons over je bot",lead:"Geef wat details en we reageren binnen 24 uur.",
        name:"Volledige naam", email:"Zakelijk e‑mail", company:"Bedrijf / Sector", message:"Wat moet de bot doen? Platformen, flows, integraties…",
        gdpr:"Ik ga akkoord dat jullie me contacteren en accepteer het privacybeleid.", send:"Verstuur aanvraag", emailus:"Mail ons", seedemo:"Bekijk demo"},
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
      funnel:{
        step1:{title:"Que voulez‑vous créer ?",lead:"Choisissez un cas d’usage. En 30 s on propose un plan."},
        cases:{lead:"Capture de leads",qualify:"Qualification",booking:"Prise de RDV",payments:"Paiements / Boutique"},
        step2:{title:"Dites‑nous en plus",lead:"3 choix rapides — canaux, intégrations et délai."},
        q:{channels:{title:"Quels canaux ?"},integrations:{title:"Intégrations"},deadline:{title:"Délai"}},
        actions:{seeplan:"Voir l’offre & le prix",book:"Réserver une démo",whatsapp:"Parler sur WhatsApp"},
        step3:{title:"Offre recommandée",lead:"Point de départ — on ajuste pendant la démo."}
      },
      features:{title:"Pourquoi choisir BotMatic",lead:"Tout pour passer de l’idée à un chatbot qui génère des revenus.",
        f1:{title:"Livraison rapide",desc:"Du brief au live en 7–14 jours avec itérations serrées."},
        f2:{title:"IA + boutons",desc:"Mélange de parcours guidés et réponses IA pour vitesse & contrôle."},
        f3:{title:"Intégrations",desc:"CRM, calendriers, paiements, Google Sheets — on connecte votre stack."},
        f4:{title:"Qualifier & convertir",desc:"Score des leads, routage des prospects chauds et réservation auto."},
        f5:{title:"Conforme RGPD",desc:"Consentement clair, minimisation des données et opt out inclus."},
        f6:{title:"Support continu",desc:"On ajuste la copie, les étapes et KPI au fil du temps."}},
      pricing:{title:"Tarification simple",lead:"Choisissez un forfait — résiliable ou évolutif à tout moment. Entreprise sur demande.",
        starter:{title:"Starter",price:"€29",l1:"1 parcours clé (FAQ ou capture de leads)",l2:"1 plateforme (ex. WhatsApp)",l3:"Jusqu’à 500 conversations/mois",cta:"Choisir Starter",note:"Idéal pour MVP et petites équipes."},
        standard:{title:"Standard",price:"€99",l1:"Parcours multi‑étapes (qualif + réservation)",l2:"2 plateformes",l3:"Support prioritaire & mises à jour",l4:"Jusqu’à 2 000 conversations/mois",cta:"Choisir Standard",note:"Notre offre la plus populaire."},
        premium:{title:"Premium",price:"€299",l1:"IA & NLP avancés",l2:"Multi‑plateformes & systèmes",l3:"Chef de projet dédié & SLA",l4:"Conversations illimitées",cta:"Choisir Premium",note:"Pour scale ups et grands comptes."}},
      contact:{title:"Parlez‑nous de votre bot",lead:"Partagez quelques détails et nous revenons sous 24 h.",
        name:"Nom complet", email:"Email professionnel", company:"Entreprise / Secteur", message:"Que doit faire le bot ? Plateformes, parcours, intégrations…",
        gdpr:"J’accepte d’être contacté pour ma demande et j’accepte la politique de confidentialité.", send:"Envoyer la demande", emailus:"Nous écrire", seedemo:"Voir la démo"},
      footer:{tagline:"Chatbots sur mesure pour WhatsApp, Telegram, Instagram & web."}
    }
  };

  // ===== i18n apply =====
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

    try { localStorage.setItem('botmatic_lang', lang); } catch(e){}
  }

  // ===== Estimate logic =====
  function computeEstimate(state){
    // Simple rules:
    // - Base: Starter
    // - If 2+ channels OR integrations >=2 => Standard
    // - If payments + CRM OR deadline "ASAP" + 2+ channels => Premium
    let plan = 'Starter', price='€29', includes=[];
    const ch = state.channels.length, ig = state.integrations.length, asap = state.deadline==='ASAP';
    const hasStripe = state.integrations.includes('Stripe'), hasCRM = state.integrations.includes('CRM');

    if (ch >= 2 || ig >= 2) { plan='Standard'; price='€99'; }
    if ((hasStripe && hasCRM) || (asap && ch >= 2)) { plan='Premium'; price='€299'; }

    // Includes based on answers
    includes.push(`${state.usecaseLabel} flow`);
    includes.push(`${ch || 1} channel${ch>1?'s':''}`);
    if (ig>0) includes.push(`Integrations: ${state.integrations.join(', ')}`);
    includes.push(`Timeline: ${state.deadline}`);

    return {plan, price, includes};
  }

  // ===== Modal helpers =====
  const modal = {
    open(url){
      const m = $('#demoModal'); const f = $('#demoFrame');
      f.src = url || 'https://cal.com/your-handle?embed=true';
      m.classList.add('show'); m.removeAttribute('hidden');
      dl({event:'cta_demo_click'});
    },
    close(){
      const m = $('#demoModal'); const f = $('#demoFrame');
      f.src = 'about:blank'; m.classList.remove('show'); m.setAttribute('hidden','');
    }
  };

  ready(function(){
    // Mobile menu
    const btn  = $('.mobile-toggle');
    const menu = $('#mainmenu');
    if(btn && menu){
      const closeMenu = ()=>{ menu.classList.remove('open'); document.body.classList.remove('menu-open'); btn.setAttribute('aria-expanded','false'); };
      btn.addEventListener('click', ()=>{
        const open = menu.classList.toggle('open'); document.body.classList.toggle('menu-open', open); btn.setAttribute('aria-expanded', String(open));
      });
      $$('#mainmenu a').forEach(a=>a.addEventListener('click', closeMenu));
      document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMenu(); });
      const mq = window.matchMedia('(min-width: 768px)'); const handleMQ=()=>{ if(mq.matches) closeMenu(); }; (mq.addEventListener?mq.addEventListener('change',handleMQ):mq.addListener(handleMQ));
    }

    // Language
    let saved=null; try{ saved = localStorage.getItem('botmatic_lang'); }catch(e){}
    let initial = (saved && I18N[saved]) ? saved : (document.documentElement.getAttribute('lang') || 'nl');
    if(!I18N[initial]) initial='nl';
    applyI18n(initial);
    $$('.lang button').forEach(b=>b.addEventListener('click', ()=>applyI18n((b.dataset.lang||'en').toLowerCase())));

    // Funnel: Step 1
    const state = { usecase:'lead', usecaseLabel:'Lead capture', channels:[], integrations:[], deadline:'7–14 days' };
    $$('#usecases .case').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        state.usecase = btn.dataset.case;
        state.usecaseLabel = $('.case-t', btn).textContent.trim();
        $('#quiz').classList.remove('hidden'); $('#quiz').removeAttribute('aria-hidden');
        $('#quiz').scrollIntoView({behavior:'smooth', block:'start'});
        dl({event:'usecase_select', usecase:state.usecase, lang:document.documentElement.lang});
      });
    });

    // Funnel: Step 2
    $('#seePlan').addEventListener('click', ()=>{
      // collect selections
      state.channels = $$('#quiz [aria-label="Channels"] input:checked').map(i=>i.value);
      state.integrations = $$('#quiz [aria-label="Integrations"] input:checked').map(i=>i.value);
      const d = $('#quiz [name="deadline"]:checked'); state.deadline = d ? d.value : '7–14 days';

      dl({event:'quiz_complete', ...state, lang:document.documentElement.lang});

      // compute estimate
      const est = computeEstimate(state);
      $('#estPlan').textContent = est.plan;
      $('#estPrice').innerHTML = `${est.price} <small>/mo</small>`;
      const ul = $('#estIncludes'); ul.innerHTML='';
      est.includes.forEach(line=>{ const li=document.createElement('li'); li.textContent=line; ul.appendChild(li); });
      $('#estNote').textContent = `${state.usecaseLabel} · ${state.channels.join(', ') || '1 channel'} · ${state.integrations.join(', ') || 'No integrations'}`;

      // WA deeplink
      const summary = `Use case: ${state.usecaseLabel}\nChannels: ${state.channels.join(', ')||'1'}\nIntegrations: ${state.integrations.join(', ')||'none'}\nDeadline: ${state.deadline}\nRecommended: ${est.plan} (${est.price}/mo)`;
      const msg = encodeURIComponent(`Hi BotMatic! 👋\n${summary}`);
      $('#estWA').href = `https://wa.me/32400000000?text=${msg}`; // <- replace with your WhatsApp number

      // demo button
      $('#estDemo').onclick = ()=>modal.open('https://cal.com/your-handle?embed=true'); // <- replace handle

      // show section
      $('#estimate').classList.remove('hidden'); $('#estimate').removeAttribute('aria-hidden');
      $('#estimate').scrollIntoView({behavior:'smooth',block:'start'});
      dl({event:'estimate_view', plan:est.plan, lang:document.documentElement.lang});
    });

    // Pricing -> jump back to step 1 with hint
    $$('#pricing .plan .cta').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $('#usecases').scrollIntoView({behavior:'smooth', block:'start'});
        dl({event:'pricing_plan_click', plan: btn.closest('.plan')?.dataset.plan || 'unknown', lang:document.documentElement.lang});
      });
    });

    // Modal wiring
    $('.modal__close').addEventListener('click', modal.close);
    $('#demoModal').addEventListener('click', (e)=>{ if(e.target.id==='demoModal') modal.close(); });

    // Contact form (dummy)
    $('#contactForm').addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      if(!fd.get('name') || !fd.get('email') || !fd.get('gdpr')) return;
      dl({event:'form_submit_attempt', lang:document.documentElement.lang});
      // Replace with your POST endpoint if needed:
      $('#contactOk').textContent = '✓ Thanks! We will reply within 24h.'; $('#contactOk').hidden=false;
      e.currentTarget.reset();
      dl({event:'form_submit_success', lang:document.documentElement.lang});
    });
  });
})();
