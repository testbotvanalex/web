// assets/main.js (v3) — i18n + мобильное меню + SPA-lite (PJAX) + iPad фиксы
(function(){
  const $=(q,d=document)=>d.querySelector(q), $$=(q,d=document)=>Array.from(d.querySelectorAll(q));
  const sameOrigin = (u)=>{ try{ const x=new URL(u,location.href); return x.origin===location.origin; }catch{ return false; } };

  // ---- I18N
  const I18N={
    en:{nav:{home:"Home",pricing:"Pricing",faq:"FAQ",contact:"Contact"},
        home:{title:"Custom chatbots — shipped in 7–14 days",lead:"WhatsApp, Telegram, Instagram & web. Simple setup, fast delivery, full customization.",feature1:"⚡ Fast delivery",feature2:"🧩 Custom flows",feature3:"🔌 Integrations",ctaDemo:"Get a demo",ctaPricing:"See pricing"},
        pricing:{title:"Simple pricing",lead:"Pick a plan — upgrade anytime."},
        faq:{title:"FAQ",lead:"Answers to common questions."},
        contact:{title:"Contact",lead:"Tell us about your bot — we reply within 24h."},
        ok:"✓ Thanks! We will reply within 24h."},
    nl:{nav:{home:"Home",pricing:"Prijzen",faq:"FAQ",contact:"Contact"},
        home:{title:"Maatwerk chatbots — 7–14 dagen",lead:"WhatsApp, Telegram, Instagram & web. Eenvoudige setup, snelle levering, volledig maatwerk.",feature1:"⚡ Snelle levering",feature2:"🧩 Maatwerk flows",feature3:"🔌 Integraties",ctaDemo:"Plan een demo",ctaPricing:"Bekijk prijzen"},
        pricing:{title:"Eenvoudige prijzen",lead:"Kies een plan — altijd te upgraden."},
        faq:{title:"FAQ",lead:"Antwoorden op veelgestelde vragen."},
        contact:{title:"Contact",lead:"Vertel over je bot — reactie binnen 24u."},
        ok:"✓ Bedankt! We reageren binnen 24 uur."},
    fr:{nav:{home:"Accueil",pricing:"Tarifs",faq:"FAQ",contact:"Contact"},
        home:{title:"Chatbots sur mesure — 7–14 jours",lead:"WhatsApp, Telegram, Instagram & web. Mise en place simple, livraison rapide, sur‑mesure.",feature1:"⚡ Livraison rapide",feature2:"🧩 Parcours sur mesure",feature3:"🔌 Intégrations",ctaDemo:"Demander une démo",ctaPricing:"Voir les tarifs"},
        pricing:{title:"Tarifs simples",lead:"Choisissez une offre — évolutive à tout moment."},
        faq:{title:"FAQ",lead:"Réponses aux questions fréquentes."},
        contact:{title:"Contact",lead:"Parlez‑nous de votre bot — réponse sous 24h."},
        ok:"✓ Merci ! Réponse sous 24 h."}
  };

  function translate(lang){
    const dict=I18N[lang]||I18N.en;
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(el=>{
      const path = el.getAttribute('data-i18n').split('.');
      let v=dict; for(const k of path){ v=v?.[k]; }
      if(typeof v==='string') el.textContent = v;
    });
    // update pills
    $$('.lang button').forEach(b=>{
      const active = b.dataset.lang===lang;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    // persist + URL param
    try{
      localStorage.setItem('lang',lang);
      const u = new URL(location.href); u.searchParams.set('lang',lang); history.replaceState(null,'',u);
    }catch{}
  }

  // Active state for menu
  function setActiveNav(){
    const path=location.pathname.replace(/\/+$/,'')||'/';
    $$('.menu a').forEach(a=>a.classList.toggle('active', a.getAttribute('href')===path));
  }

  // Mobile menu
  function bindMobileMenu(){
    const btn=$('.mobile-toggle'), menu=$('#mainmenu'), scrim = document.querySelector('[data-scrim]');
    if(!btn||!menu||!scrim) return;
    const close=()=>{ menu.classList.remove('open'); document.body.classList.remove('menu-open'); btn.setAttribute('aria-expanded','false'); scrim.hidden=true; };
    const open =()=>{ menu.classList.add('open'); document.body.classList.add('menu-open'); btn.setAttribute('aria-expanded','true'); scrim.hidden=false; };
    btn.addEventListener('click', ()=> menu.classList.contains('open') ? close() : open());
    scrim.addEventListener('click', close);
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
    $$('#mainmenu a').forEach(a=>a.addEventListener('click', close));
    // close on desktop resize
    const mq = matchMedia('(min-width:900px)'); (mq.addEventListener?mq.addEventListener('change',()=>mq.matches&&close()):mq.addListener(()=>mq.matches&&close()));
  }

  // SPA-lite (PJAX): fetch only <main id="pjax-root"> content
  async function pjaxNavigate(url){
    try{
      const res = await fetch(url, {headers:{'X-PJAX':'1'}});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const html = await res.text();
      const tmp = document.createElement('div'); tmp.innerHTML = html;
      const nextMain = tmp.querySelector('#pjax-root'); const nextTitle = tmp.querySelector('title')?.textContent || document.title;
      if(!nextMain) throw new Error('No main');
      document.querySelector('#pjax-root').innerHTML = nextMain.innerHTML;
      document.title = nextTitle;
      history.pushState({}, '', url);
      setActiveNav();
      // re-translate to current lang
      const lang = document.documentElement.lang || 'en';
      translate(lang);
      // re-bind contact form if on contact page
      bindContactForm();
      // scroll to top
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){
      location.href = url; // graceful fallback
    }
  }

  function bindSPA(){
    document.body.addEventListener('click', (e)=>{
      const a = e.target.closest('a');
      if(!a) return;
      const href = a.getAttribute('href')||'';
      if(href.startsWith('#') || a.target==='_blank') return;
      if(!sameOrigin(href)) return;
      e.preventDefault();
      pjaxNavigate(new URL(href, location.href).pathname + new URL(href, location.href).search);
    });
    window.addEventListener('popstate', ()=>pjaxNavigate(location.pathname+location.search));
  }

  function bindLang(){
    $$('.lang button').forEach(b=>b.addEventListener('click', ()=>translate(b.dataset.lang)));
    let qp=null; try{ qp=new URL(location.href).searchParams.get('lang'); }catch{}
    const saved=localStorage.getItem('lang'); const initial=(qp&&I18N[qp])?qp:(saved&&I18N[saved])?saved:'en';
    translate(initial);
  }

  function bindContactForm(){
    const form = $('#contactForm'), ok = $('#contactOk');
    if(!form) return;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      if(!fd.get('name') || !fd.get('email') || !fd.get('gdpr')) return;
      const lang = document.documentElement.lang || 'en';
      ok.textContent = (I18N[lang]?.ok)||I18N.en.ok;
      ok.classList.remove('hidden');
      form.reset();
    }, {once:false});
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    setActiveNav();
    bindLang();
    bindMobileMenu();
    bindSPA();
    bindContactForm();
  });
})();
