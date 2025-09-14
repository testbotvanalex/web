/* ===== i18n ===== */
const I18N = {
  nl:{meta_title:'BotMatic | AI-chatbots die omzet en support versnellen',
      nav_home:'Home',nav_features:'Kenmerken',nav_usecases:'Use cases',nav_pricing:'Prijzen',
      nav_demo:'Demo',nav_contact:'Contact',nav_faq:'FAQ',
      hero_title:'Automatiseer uw bedrijf met AI-chatbots',
      hero_sub:'+30% conversie, −70% supportbelasting. Bots voor WhatsApp, Instagram, Telegram en je website.',
      cta_primary:'Probeer 14 dagen gratis', cta_secondary:'Bekijk demo',
      logos_caption:'Vertrouwd door ondernemers in beauty, auto, vastgoed en horeca',
      rights:'Alle rechten voorbehouden.', cta_footer:'Start gratis proef',
      link_privacy:'Privacy', link_terms:'Voorwaarden', link_gdpr:'GDPR',
      contact_blurb:'Plan een demo of start je proefperiode. We reageren dezelfde dag.',
      form_name:'Naam', form_email:'E-mail', form_msg:'Vertel ons over je project…', cta_send:'Verzoek indienen',
      roi_title:'Bereken uw besparing', roi_q:'Verzoeken per maand:', roi_t:'Gem. tijd per verzoek (min):',
      roi_c:'Uurloon medewerker (€):', roi_a:'% geautomatiseerd:', roi_res_lbl:'Uw potentiële besparing', roi_per:'per maand',
      roi_note:'Schatting ter illustratie van potentiële voordelen.', roi_cta:'Vraag demo aan',
      billing_m:'Maandelijks', billing_y:'Jaarlijks', popular:'Populair', per:'/maand',
      p1_t:'Start', p2_t:'Zakelijk', p3_t:'Enterprise', choose:'Kies plan', contact_title:'Klaar om te starten?',
      privacy_title:'Privacybeleid', privacy_updated:'Laatst bijgewerkt', terms_title:'Algemene voorwaarden',
      faq_title:'Veelgestelde vragen',
      faq_q1:'Hoe lang duurt implementatie?', faq_a1:'Eerste versie: 3–7 dagen, afhankelijk van integraties en content.',
      faq_q2:'Werkt BotMatic met WhatsApp/Instagram/Telegram?', faq_a2:'Ja. Officiële API’s, meerdere kanalen tegelijk + website-widget.',
      faq_q3:'Is het GDPR-compliant?', faq_a3:'Ja. Minimale data, toegangsrollen, logging en verwerkersovereenkomsten.',
      faq_q4:'Hoe wordt de prijs berekend?', faq_a4:'Vast maandabonnement; optioneel AI-tokenverbruik. Zie Prijzen.',
      faq_q5:'Koppelen met kennisbank/CRM?', faq_a5:'Ja, via API/CSV en native connectors. We helpen met mapping en kwaliteit.',
      faq_q6:'Welke support krijg ik?', faq_a6:'E-mail/priority per plan. Enterprise: dedicated manager en SLA.'},
  fr:{meta_title:"BotMatic | Des chatbots IA pour accélérer ventes & support",
      nav_home:'Accueil',nav_features:'Fonctionnalités',nav_usecases:"Cas d’usage",nav_pricing:'Tarifs',
      nav_demo:'Démo',nav_contact:'Contact',nav_faq:'FAQ',
      hero_title:"Automatisez votre entreprise avec des chatbots IA",
      hero_sub:"+30 % de conversion, −70 % de charge support. Bots pour WhatsApp, Instagram, Telegram et votre site.",
      cta_primary:"Essai gratuit 14 jours", cta_secondary:"Voir la démo",
      logos_caption:"Plébiscité par beauté, auto, immobilier et restauration",
      rights:"Tous droits réservés.", cta_footer:"Démarrer l’essai",
      link_privacy:"Confidentialité", link_terms:"Conditions", link_gdpr:"RGPD",
      contact_blurb:"Planifiez une démo ou lancez l’essai. Réponse sous 24 h.",
      form_name:"Nom", form_email:"Email", form_msg:"Parlez-nous de votre projet…", cta_send:"Envoyer la demande",
      roi_title:"Calculez vos économies", roi_q:"Demandes par mois :", roi_t:"Temps moyen par demande (min) :",
      roi_c:"Coût horaire employé (€) :", roi_a:"Part automatisée (%) :", roi_res_lbl:"Économies potentielles", roi_per:"par mois",
      roi_note:"Estimation indicative des bénéfices.", roi_cta:"Demander une démo",
      billing_m:"Mensuel", billing_y:"Annuel", popular:"Populaire", per:"/mois",
      p1_t:'Start', p2_t:'Business', p3_t:'Enterprise', choose:"Choisir l’offre", contact_title:"Prêt à commencer ?",
      privacy_title:'Politique de confidentialité', privacy_updated:'Dernière mise à jour', terms_title:'Conditions générales',
      faq_title:"Questions fréquentes",
      faq_q1:"Combien de temps pour l’implémentation ?", faq_a1:"Une V1 en 3–7 jours selon les intégrations et le contenu.",
      faq_q2:"Compatible avec WhatsApp/Instagram/Telegram ?", faq_a2:"Oui, via API officielles. Multi-canal + widget site.",
      faq_q3:"Conforme au RGPD ?", faq_a3:"Oui. Données minimales, rôles, journalisation et DPA.",
      faq_q4:"Comment sont calculés les tarifs ?", faq_a4:"Abonnement mensuel; tokens IA en option. Voir Tarifs.",
      faq_q5:"Puis-je connecter ma base de connaissances/CRM ?", faq_a5:"Oui via API/CSV et connecteurs natifs. Aide au mapping/qualité.",
      faq_q6:"Quel support est inclus ?", faq_a6:"Email/prioritaire selon l’offre. Enterprise : manager dédié + SLA."},
  en:{meta_title:"BotMatic | AI chatbots to boost revenue & support",
      nav_home:'Home',nav_features:'Features',nav_usecases:'Use cases',nav_pricing:'Pricing',
      nav_demo:'Demo',nav_contact:'Contact',nav_faq:'FAQ',
      hero_title:"Automate your business with AI chatbots",
      hero_sub:"+30% conversion, −70% support load. Bots for WhatsApp, Instagram, Telegram and your website.",
      cta_primary:"Try 14 days free", cta_secondary:"Watch demo",
      logos_caption:"Trusted across beauty, auto, real estate and F&B",
      rights:"All rights reserved.", cta_footer:"Start free trial",
      link_privacy:"Privacy", link_terms:"Terms", link_gdpr:"GDPR",
      contact_blurb:"Book a demo or start your trial. Same-day reply.",
      form_name:"Name", form_email:"Email", form_msg:"Tell us about your project…", cta_send:"Submit request",
      roi_title:"Calculate your savings", roi_q:"Requests per month:", roi_t:"Avg time per request (min):",
      roi_c:"Employee hourly cost (€):", roi_a:"Automated share (%):", roi_res_lbl:"Your potential savings", roi_per:"per month",
      roi_note:"Estimate to illustrate potential benefits.", roi_cta:"Request a demo",
      billing_m:"Monthly", billing_y:"Yearly", popular:"Most popular", per:"/month",
      p1_t:'Starter', p2_t:'Business', p3_t:'Enterprise', choose:"Choose plan", contact_title:"Ready to start?",
      privacy_title:'Privacy Policy', privacy_updated:'Last updated', terms_title:'Terms & Conditions',
      faq_title:"Frequently asked questions",
      faq_q1:"How long does implementation take?", faq_a1:"Initial version in 3–7 days depending on integrations and content.",
      faq_q2:"Does BotMatic work with WhatsApp/Instagram/Telegram?", faq_a2:"Yes. Official APIs, multi-channel support, plus website widget.",
      faq_q3:"Is it GDPR-compliant?", faq_a3:"Yes. Minimal data retained, roles, logging, and DPAs.",
      faq_q4:"How is pricing calculated?", faq_a4:"Flat monthly per plan; optional AI token usage. See Pricing.",
      faq_q5:"Can we connect our knowledge base/CRM?", faq_a5:"Yes via API/CSV and native connectors. We help with mapping and content quality.",
      faq_q6:"What support do I get?", faq_a6:"Email/priority support per plan. Enterprise — dedicated manager and SLA."}
};

/* ===== Helpers ===== */
function localeFor(lang){
  if(lang==='fr') return 'fr-FR';
  if(lang==='en') return 'en-GB'; // евро, но англ интерфейс
  return 'nl-NL';
}
function eur(value, lang=document.documentElement.lang){
  return new Intl.NumberFormat(localeFor(lang), { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(value);
}

/* ===== Language switch ===== */
function setLang(lang){
  document.documentElement.lang = lang;
  const dict = I18N[lang] || I18N.en;
  document.querySelectorAll('[data-lang-key]').forEach(el=>{
    const key = el.getAttribute('data-lang-key');
    if(!key || !(key in dict)) return;
    if(el.tagName==='INPUT' || el.tagName==='TEXTAREA'){ el.placeholder = dict[key]; }
    else if(el.tagName==='TITLE'){ el.textContent = dict[key]; }
    else { el.textContent = dict[key]; }
  });
  localStorage.setItem('lang', lang);
  document.querySelectorAll('.lang-btn').forEach(b=>{
    if(b.dataset.lang===lang){ b.classList.add('bg-white','text-[var(--accent)]'); b.classList.remove('text-black/60'); }
    else { b.classList.remove('bg-white','text-[var(--accent)]'); b.classList.add('text-black/60'); }
  });
}
function initLang(){ setLang(localStorage.getItem('lang')||'nl'); }

/* ===== Mobile menu (ARIA) ===== */
function initMenu(){
  const menuBtn=document.getElementById('menuBtn');
  const mobileMenu=document.getElementById('mobileMenu');
  if(!menuBtn||!mobileMenu) return;
  menuBtn.setAttribute('aria-controls','mobileMenu');
  menuBtn.setAttribute('aria-expanded','false');
  menuBtn.addEventListener('click',()=>{
    const expanded = menuBtn.getAttribute('aria-expanded')==='true';
    menuBtn.setAttribute('aria-expanded', String(!expanded));
    mobileMenu.classList.toggle('hidden');
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && menuBtn.getAttribute('aria-expanded')==='true'){
      menuBtn.setAttribute('aria-expanded','false');
      mobileMenu.classList.add('hidden');
    }
  });
}

/* ===== Active nav highlight ===== */
function highlightActiveNav(){
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('[data-nav] a').forEach(a=>{
    const href = (a.getAttribute('href')||'').toLowerCase();
    if(href.endsWith(path)) a.classList.add('nav-active');
  });
}

/* ===== Fade-in on scroll ===== */
function initFadeIn(){
  const io=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible')}})},{threshold:.15});
  document.querySelectorAll('.fade-in').forEach(el=>io.observe(el));
}

/* ===== ROI Calculator (EUR) ===== */
function initROI(){
  const q=document.getElementById('q'), t=document.getElementById('t'), c=document.getElementById('c'), a=document.getElementById('a');
  const qv=document.getElementById('qv'), tv=document.getElementById('tv'), cv=document.getElementById('cv'), av=document.getElementById('av'), res=document.getElementById('res');
  if(!q||!t||!c||!a||!qv||!tv||!cv||!av||!res) return;
  function calc(){
    const L=document.documentElement.lang;
    const Q=Number(q.value)||0, T=Number(t.value)||0, C=Number(c.value)||0, A=Number(a.value)||0;
    qv.textContent = Q.toLocaleString(localeFor(L));
    tv.textContent = T; cv.textContent = C; av.textContent = A;
    const hours=(Q*T*(A/100))/60;
    const saving=Math.max(0, Math.round(hours*C));
    res.textContent = new Intl.NumberFormat(localeFor(L), {style:'currency', currency:'EUR'}).format(saving);
  }
  [q,t,c,a].forEach(el=>el.addEventListener('input',calc)); calc();
}

/* ===== Pricing toggle (EUR, yearly -15%) ===== */
function initPricingToggle(){
  const m=document.getElementById('btn-monthly');
  const y=document.getElementById('btn-yearly');
  const prices=[...document.querySelectorAll('.price')];
  if(!m||!y||!prices.length) return;
  let yearly=false;
  function render(){
    const L=document.documentElement.lang;
    prices.forEach(p=>{
      const base=parseFloat(p.dataset.base);
      if(isNaN(base)) return;
      const price = yearly ? Math.round(base*0.85) : base;
      p.textContent = new Intl.NumberFormat(localeFor(L),{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(price);
    });
  }
  m.addEventListener('click',()=>{ yearly=false; m.classList.add('active'); y.classList.remove('active'); render(); });
  y.addEventListener('click',()=>{ yearly=true;  y.classList.add('active'); m.classList.remove('active'); render(); });
  // default
  m.classList.add('active'); render();
}

/* ===== Lead forms (friendly message) ===== */
function initLeadForms(){
  document.querySelectorAll('form[data-lead]').forEach(form=>{
    const status=form.querySelector('.formStatus');
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const L=document.documentElement.lang;
      const msg = L==='fr' ? 'Merci ! Nous vous recontactons très vite.' :
                  L==='en' ? "Thanks! We'll get back to you shortly." :
                             'Bedankt! We nemen snel contact op.';
      if(status) status.textContent = msg;
      form.reset();
    });
  });
}

/* ===== Boot ===== */
window.addEventListener('DOMContentLoaded',()=>{
  initLang(); initMenu(); highlightActiveNav(); initFadeIn(); initROI(); initPricingToggle(); initLeadForms();
  document.querySelectorAll('.lang-btn').forEach(b=>b.addEventListener('click',e=>setLang(e.target.dataset.lang)));
});