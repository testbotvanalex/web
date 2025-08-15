// assets/main.js (v5 — i18n + mobile menu + SPA-lite + contact success)
(function(){
  const $=(q,d=document)=>d.querySelector(q), $$=(q,d=document)=>Array.from(d.querySelectorAll(q));
  const sameOrigin = (u)=>{ try{ const x=new URL(u,location.href); return x.origin===location.origin; }catch{ return false; } };

  const I18N={
    en:{
      nav:{home:"Home",pricing:"Pricing",faq:"FAQ",contact:"Contact"},
      home:{
        title:"Custom chatbots — shipped in 7–14 days",
        lead:"WhatsApp, Telegram, Instagram & web. Simple setup, fast delivery, full customization.",
        feature1:"⚡ Fast delivery",
        feature2:"🧩 Custom flows",
        feature3:"🔌 Integrations",
        ctaDemo:"Get a demo",
        ctaPricing:"See pricing",
        trust:"Trusted by small businesses & agencies",
        usecases:{title:"Popular use cases",
          lead:{title:"Lead capture",desc:"Turn clicks into conversations and collect qualified contacts."},
          qual:{title:"Qualification",desc:"Score & route prospects based on needs and budget."},
          booking:{title:"Booking & reminders",desc:"Auto‑book appointments and send reminders."},
          pay:{title:"Payments / shop",desc:"Sell via chat with Stripe and invoicing integrations."}
        },
        how:{title:"How it works",
          s1:{title:"Brief",desc:"30‑min call to define use cases, tone, and integrations."},
          s2:{title:"Build & iterate",desc:"We ship a working draft within a week, you give feedback."},
          s3:{title:"Launch & support",desc:"Go live, monitor KPIs, and tune copy/flows monthly."}
        },
        testimonial:{quote:"“We started booking 30% more appointments after adding the WhatsApp bot. Setup took a week.”",name:"Elise V.",role:"Owner, Beauty Studio",cta:"See plans"}
      },
      pricing:{title:"Simple pricing",lead:"Pick a plan — upgrade anytime."},
      faq:{title:"FAQ",lead:"Answers to common questions."},
      contact:{title:"Contact",lead:"Tell us about your bot — we reply within 24h."},
      ok:"✓ Thanks! We will reply within 24h."
    },
    nl:{
      nav:{home:"Home",pricing:"Prijzen",faq:"FAQ",contact:"Contact"},
      home:{
        title:"Maatwerk chatbots — 7–14 dagen",
        lead:"WhatsApp, Telegram, Instagram & web. Eenvoudige setup, snelle levering, volledig maatwerk.",
        feature1:"⚡ Snelle levering",
        feature2:"🧩 Maatwerk flows",
        feature3:"🔌 Integraties",
        ctaDemo:"Plan een demo",
        ctaPricing:"Bekijk prijzen",
        trust:"Vertrouwd door kmo’s & agencies",
        usecases:{title:"Populaire use cases",
          lead:{title:"Lead capture",desc:"Maak van kliks gesprekken en verzamel gekwalificeerde contacten."},
          qual:{title:"Kwalificatie",desc:"Score & routeer prospects op basis van behoefte en budget."},
          booking:{title:"Boeken & reminders",desc:"Boek afspraken automatisch en stuur herinneringen."},
          pay:{title:"Betalingen / shop",desc:"Verkoop via chat met Stripe en facturatie‑koppelingen."}
        },
        how:{title:"Zo werken we",
          s1:{title:"Briefing",desc:"30‑min call om use cases, tone of voice en integraties af te stemmen."},
          s2:{title:"Bouwen & itereren",desc:"Binnen een week een werkende draft, jij geeft feedback."},
          s3:{title:"Launch & support",desc:"Live gaan, KPI’s volgen en maandelijks bijsturen."}
        },
        testimonial:{quote:"“Na WhatsApp‑bot plannen we 30% meer afspraken. Setup duurde één week.”",name:"Elise V.",role:"Eigenares, Beauty Studio",cta:"Bekijk plannen"}
      },
      pricing:{title:"Eenvoudige prijzen",lead:"Kies een plan — altijd te upgraden."},
      faq:{title:"FAQ",lead:"Antwoorden op veelgestelde vragen."},
      contact:{title:"Contact",lead:"Vertel over je bot — reactie binnen 24u."},
      ok:"✓ Bedankt! We reageren binnen 24 uur."
    },
    fr:{
      nav:{home:"Accueil",pricing:"Tarifs",faq:"FAQ",contact:"Contact"},
      home:{
        title:"Chatbots sur mesure — 7–14 jours",
        lead:"WhatsApp, Telegram, Instagram & web. Mise en place simple, livraison rapide, sur‑mesure.",
        feature1:"⚡ Livraison rapide",
        feature2:"🧩 Parcours sur mesure",
        feature3:"🔌 Intégrations",
        ctaDemo:"Demander une démo",
        ctaPricing:"Voir les tarifs",
        trust:"Plébiscité par PME & agences",
        usecases:{title:"Cas d’usage populaires",
          lead:{title:"Capture de leads",desc:"Transformez les clics en conversations et contacts qualifiés."},
          qual:{title:"Qualification",desc:"Scorez et orientez selon besoins et budget."},
          booking:{title:"Prise de RDV & rappels",desc:"Réservation automatique et rappels."},
          pay:{title:"Paiements / boutique",desc:"Vendez en chat avec Stripe et facturation."}
        },
        how:{title:"Notre méthode",
          s1:{title:"Brief",desc:"30 min pour cadrer les cas d’usage, le ton et les intégrations."},
          s2:{title:"Build & itérations",desc:"Un brouillon fonctionnel en une semaine, vous réagissez."},
          s3:{title:"Mise en ligne & support",desc:"Live, suivi des KPI et ajustements mensuels."}
        },
        testimonial:{quote:"« +30% de rendez‑vous grâce au bot WhatsApp. Mise en place en une semaine. »",name:"Elise V.",role:"Gérante, Beauty Studio",cta:"Voir les offres"}
      },
      pricing:{title:"Tarifs simples",lead:"Choisissez une offre — évolutive à tout moment."},
      faq:{title:"FAQ",lead:"Réponses aux questions fréquentes."},
      contact:{title:"Contact",lead:"Parlez‑nous de votre bot — réponse sous 24h."},
      ok:"✓ Merci ! Réponse sous 24 h."
    }
  };

  function translate(lang){
    const dict=I18N[lang]||I18N.en;
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(el=>{
      const path=el.getAttribute('data-i18n').split('.');
      let v=dict; for(const k of path){ v=v?.[k]; }
      if(typeof v==='string') el.textContent=v;
    });
    $$('.lang button').forEach(b=>{
      const active=b.dataset.lang===lang;
      b.classList.toggle('active',active);
      b.setAttribute('aria-pressed',String(active));
    });
    try{
      localStorage.setItem('lang',lang);
      const u=new URL(location.href); u.searchParams.set('lang',lang); history.replaceState(null,'',u);
    }catch{}
  }

  function setActiveNav(){
    const path=location.pathname.replace(/\/+$/,'')||'/';
    $$('.menu a').forEach(a=>a.classList.toggle('active', a.getAttribute('href')===path));
  }

  function bindMobileMenu(){
    const btn=$('.mobile-toggle'), menu=$('#mainmenu'), scrim=$('[data-scrim]');
    if(!btn||!menu||!scrim) return;
    const close=()=>{ menu.classList.remove('open'); document.body.classList.remove('menu-open'); btn.setAttribute('aria-expanded','false'); scrim.hidden=true; };
    const open =()=>{ menu.classList.add('open'); document.body.classList.add('menu-open'); btn.setAttribute('aria-expanded','true'); scrim.hidden=false; };
    btn.addEventListener('click', ()=> menu.classList.contains('open')?close():open());
    scrim.addEventListener('click', close);
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
    $$('#mainmenu a').forEach(a=>a.addEventListener('click', close));
    const mq=matchMedia('(min-width:900px)'); (mq.addEventListener?mq.addEventListener('change',()=>mq.matches&&close()):mq.addListener(()=>mq.matches&&close()));
  }

  async function pjaxNavigate(url){
    try{
      const res = await fetch(url, {headers:{'X-PJAX':'1'}});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const html = await res.text();
      const tmp = document.createElement('div'); tmp.innerHTML = html;
      const nextMain = tmp.querySelector('#pjax-root'); const nextTitle = tmp.querySelector('title')?.textContent || document.title;
      if(!nextMain) throw new Error('No main');
      $('#pjax-root').innerHTML = nextMain.innerHTML;
      document.title = nextTitle;
      history.pushState({}, '', url);
      setActiveNav();
      translate(document.documentElement.lang||'en');
      bindContactForm();
      window.scrollTo({top:0,behavior:'smooth'});
    }catch{ location.href=url; }
  }

  function bindSPA(){
    document.body.addEventListener('click',(e)=>{
      const a=e.target.closest('a'); if(!a) return;
      const href=a.getAttribute('href')||''; if(href.startsWith('#')||a.target==='_blank') return;
      if(!sameOrigin(href)) return;
      e.preventDefault();
      const u=new URL(href,location.href); pjaxNavigate(u.pathname+u.search);
    });
    window.addEventListener('popstate',()=>pjaxNavigate(location.pathname+location.search));
  }

  function bindLang(){
    $$('.lang button').forEach(b=>b.addEventListener('click',()=>translate(b.dataset.lang)));
    let qp=null; try{ qp=new URL(location.href).searchParams.get('lang'); }catch{}
    const saved=localStorage.getItem('lang'); const initial=(qp&&I18N[qp])?qp:(saved&&I18N[saved])?saved:'en';
    translate(initial);
  }

  function bindContactForm(){
    const form=$('#contactForm'), ok=$('#contactOk'); if(!form) return;
    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const fd=new FormData(form);
      if(!fd.get('name')||!fd.get('email')||!fd.get('gdpr')) return;
      const lang=document.documentElement.lang||'en';
      if(ok){ ok.textContent=(I18N[lang]?.ok)||I18N.en.ok; ok.classList.remove('hidden'); }
      form.reset();
    },{once:false});
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    setActiveNav();
    bindLang();
    bindMobileMenu();
    bindSPA();
    bindContactForm();
    document.getElementById('y') && (document.getElementById('y').textContent = new Date().getFullYear());
  });
})();