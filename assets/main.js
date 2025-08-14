(function(){
  const $=(q,d=document)=>d.querySelector(q), $$=(q,d=document)=>Array.from(d.querySelectorAll(q));
  const I18N={
    en:{nav:{home:"Home",pricing:"Pricing",faq:"FAQ",contact:"Contact"},
        home:{title:"Custom chatbots — shipped in 7–14 days",lead:"WhatsApp, Telegram, Instagram & web. Simple setup, fast delivery, full customization."},
        pricing:{title:"Simple pricing",lead:"Pick a plan — upgrade anytime."},
        faq:{title:"FAQ",lead:"Answers to common questions."},
        contact:{title:"Contact",lead:"Tell us about your bot — we reply within 24h."}},
    nl:{nav:{home:"Home",pricing:"Prijzen",faq:"FAQ",contact:"Contact"},
        home:{title:"Maatwerk chatbots — 7–14 dagen",lead:"WhatsApp, Telegram, Instagram & web. Eenvoudige setup, snelle levering, volledig maatwerk."},
        pricing:{title:"Eenvoudige prijzen",lead:"Kies een plan — altijd te upgraden."},
        faq:{title:"FAQ",lead:"Antwoorden op veelgestelde vragen."},
        contact:{title:"Contact",lead:"Vertel over je bot — reactie binnen 24u."}},
    fr:{nav:{home:"Accueil",pricing:"Tarifs",faq:"FAQ",contact:"Contact"},
        home:{title:"Chatbots sur mesure — 7–14 jours",lead:"WhatsApp, Telegram, Instagram & web. Mise en place simple, livraison rapide, sur‑mesure."},
        pricing:{title:"Tarifs simples",lead:"Choisissez une offre — évolutive à tout moment."},
        faq:{title:"FAQ",lead:"Réponses aux questions fréquentes."},
        contact:{title:"Contact",lead:"Parlez‑nous de votre bot — réponse sous 24h."}}
  };

  function setLang(lang){
    const dict=I18N[lang]||I18N.en;
    document.documentElement.lang=lang; document.body.dataset.lang=lang;
    $$('[data-i18n]').forEach(el=>{
      const path=el.dataset.i18n.split('.'); let val=dict; for(const k of path){ val=val?.[k]; }
      if(typeof val==='string') el.textContent=val;
    });
    $$('.lang button').forEach(b=>b.classList.toggle('active', b.dataset.lang===lang));
    try{ localStorage.setItem('lang',lang); const u=new URL(location.href); u.searchParams.set('lang',lang); history.replaceState(null,'',u); }catch{}
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // активный пункт меню
    const path=location.pathname.replace(/\/+$/,'')||'/';
    $$('.menu a').forEach(a=>a.classList.toggle('active', a.getAttribute('href')===path));

    // язык
    let qp=null; try{ qp=new URL(location.href).searchParams.get('lang'); }catch{}
    const saved=localStorage.getItem('lang'); const initial=(qp&&I18N[qp])?qp:(saved&&I18N[saved])?saved:'en';
    setLang(initial);
    $$('.lang button').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));
  });
})();
