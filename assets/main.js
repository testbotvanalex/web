// main.js
// ===== Helpers =====
const $ = (q,ctx=document)=>ctx.querySelector(q);
const $$ = (q,ctx=document)=>Array.from(ctx.querySelectorAll(q));

// ===== I18N =====
const I18N = {
  en:{
    eyebrow:"Custom chatbots in 7–14 days",
    h1:"We build WhatsApp, Telegram & Instagram chatbots — fast",
    lead:"Simple setup, quick delivery, fully tailored flows for lead capture, qualification, booking and payments.",
    badge1:"Avg. go‑live: 9 days", badge2:"GDPR‑ready", badge3:"EN / NL / FR",
    cta_demo:"Get a demo", cta_start:"Start a project", cta_submit:"Send",
    form_title:"Tell us about your bot",
    label_name:"Name", label_company:"Company", label_contact:"WhatsApp or Email",
    label_usecase:"Use case", opt_choose:"Choose…",
    label_budget:"Budget (€/mo)", label_deadline:"Deadline",
    err_required:"This field is required.", err_contact:"Enter valid WhatsApp or email.", err_gdpr:"Please accept the privacy terms.",
    gdpr_copy:"I agree to the processing of my data as described in the",
    form_note:"We’ll reply within 24 hours.",
    features_title:"What we deliver",
    f1_t:"Lead capture", f1_d:"Forms & flows connected to Google Sheets / CRM.",
    f2_t:"Qualification", f2_d:"Score leads with rules or AI.",
    f3_t:"Booking", f3_d:"Calendly/Cal.com integration + reminders.",
    f4_t:"Payments", f4_d:"Stripe checkout & invoicing flows.",
    pricing_title:"Pricing", p_cta:"Choose plan",
    p1_t:"Starter", p1_price:"29", p1_f1:"Essential flows", p1_f2:"1 channel (e.g. WhatsApp)", p1_f3:"Basic support",
    p2_t:"Growth",  p2_price:"99", p2_f1:"Advanced flows + AI", p2_f2:"2 channels", p2_f3:"Integrations (Sheets/Calendly)",
    p3_t:"Premium", p3_price:"299", p3_f1:"Full customization", p3_f2:"3+ channels", p3_f3:"Priority SLA + migration",
    demo_title:"Book a demo",
    footer_tag:"Chatbots for WhatsApp, Telegram & Instagram"
  },
  nl:{
    eyebrow:"Aangepaste chatbots in 7–14 dagen",
    h1:"Wij bouwen WhatsApp-, Telegram- en Instagram-chatbots — snel",
    lead:"Eenvoudige setup, snelle levering, volledig op maat voor lead capture, kwalificatie, booking en betalingen.",
    badge1:"Gem. livegang: 9 dagen", badge2:"GDPR‑klaar", badge3:"EN / NL / FR",
    cta_demo:"Plan een demo", cta_start:"Start een project", cta_submit:"Verzenden",
    form_title:"Vertel ons over je bot",
    label_name:"Naam", label_company:"Bedrijf", label_contact:"WhatsApp of e‑mail",
    label_usecase:"Use case", opt_choose:"Kies…",
    label_budget:"Budget (€/mnd)", label_deadline:"Deadline",
    err_required:"Dit veld is verplicht.", err_contact:"Voer geldige WhatsApp of e‑mail in.", err_gdpr:"Accepteer het privacybeleid.",
    gdpr_copy:"Ik ga akkoord met de verwerking van mijn gegevens zoals beschreven in het",
    form_note:"Wij antwoorden binnen 24 uur.",
    features_title:"Wat wij leveren",
    f1_t:"Lead capture", f1_d:"Formulieren & flows gekoppeld aan Google Sheets / CRM.",
    f2_t:"Kwalificatie", f2_d:"Score leads met regels of AI.",
    f3_t:"Boeken", f3_d:"Integratie met Calendly/Cal.com + reminders.",
    f4_t:"Betalingen", f4_d:"Stripe checkout & facturatieflows.",
    pricing_title:"Prijzen", p_cta:"Kies pakket",
    p1_t:"Starter", p1_price:"29", p1_f1:"Essentiële flows", p1_f2:"1 kanaal (bv. WhatsApp)", p1_f3:"Basis support",
    p2_t:"Growth",  p2_price:"99", p2_f1:"Geavanceerde flows + AI", p2_f2:"2 kanalen", p2_f3:"Integraties (Sheets/Calendly)",
    p3_t:"Premium", p3_price:"299", p3_f1:"Volledige maatwerk", p3_f2:"3+ kanalen", p3_f3:"Priority SLA + migratie",
    demo_title:"Plan een demo",
    footer_tag:"Chatbots voor WhatsApp, Telegram & Instagram"
  },
  fr:{
    eyebrow:"Chatbots sur mesure en 7–14 jours",
    h1:"Nous créons des chatbots WhatsApp, Telegram & Instagram — rapidement",
    lead:"Mise en place simple, livraison rapide, parcours personnalisés pour la capture, qualification, prise de rendez‑vous et paiements.",
    badge1:"Mise en ligne moy.: 9 jours", badge2:"Conforme RGPD", badge3:"EN / NL / FR",
    cta_demo:"Réserver une démo", cta_start:"Lancer un projet", cta_submit:"Envoyer",
    form_title:"Parlez‑nous de votre bot",
    label_name:"Nom", label_company:"Société", label_contact:"WhatsApp ou e‑mail",
    label_usecase:"Cas d’usage", opt_choose:"Choisir…",
    label_budget:"Budget (€/mois)", label_deadline:"Échéance",
    err_required:"Champ requis.", err_contact:"Entrez un WhatsApp ou e‑mail valide.", err_gdpr:"Veuillez accepter la politique de confidentialité.",
    gdpr_copy:"J’accepte le traitement de mes données comme décrit dans la",
    form_note:"Réponse sous 24 h.",
    features_title:"Ce que nous livrons",
    f1_t:"Capture de leads", f1_d:"Formulaires & flux reliés à Google Sheets / CRM.",
    f2_t:"Qualification", f2_d:"Score des leads via règles ou IA.",
    f3_t:"Prise de RDV", f3_d:"Intégration Calendly/Cal.com + rappels.",
    f4_t:"Paiements", f4_d:"Stripe checkout & facturation.",
    pricing_title:"Tarifs", p_cta:"Choisir l’offre",
    p1_t:"Starter", p1_price:"29", p1_f1:"Parcours essentiels", p1_f2:"1 canal (ex. WhatsApp)", p1_f3:"Support basique",
    p2_t:"Growth",  p2_price:"99", p2_f1:"Parcours avancés + IA", p2_f2:"2 canaux", p2_f3:"Intégrations (Sheets/Calendly)",
    p3_t:"Premium", p3_price:"299", p3_f1:"Personnalisation totale", p3_f2:"3+ canaux", p3_f3:"SLA prioritaire + migration",
    demo_title:"Réserver une démo",
    footer_tag:"Chatbots pour WhatsApp, Telegram & Instagram"
  }
};

// ===== Language init & switch =====
const langButtons = $$('.lang button');
function setLang(l){
  if(!I18N[l]) l='en';
  document.documentElement.lang = l;
  localStorage.setItem('bm_lang', l);
  $$('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(I18N[l][key]) el.textContent = I18N[l][key];
  });
  langButtons.forEach(b=>b.setAttribute('aria-current', b.dataset.lang===l ? 'true' : 'false'));
}
langButtons.forEach(btn=>btn.addEventListener('click', ()=>setLang(btn.dataset.lang)));
setLang(localStorage.getItem('bm_lang') || document.documentElement.lang || 'en');

// ===== CTA handlers =====
window.openStartProject = function(){
  window.dataLayer = window.dataLayer || [];
  dataLayer.push({event:'cta_start_click', lang: document.documentElement.lang});
  $('#leadForm').scrollIntoView({behavior:'smooth', block:'start'});
}
window.openDemoModal = function(){
  window.dataLayer = window.dataLayer || [];
  dataLayer.push({event:'cta_demo_click', lang: document.documentElement.lang});
  const m = document.getElementById('demoModal');
  $('#demoFrame').src = 'https://cal.com/your-handle?embed=true'; // replace with your scheduling link
  m.classList.add('show'); m.removeAttribute('hidden');
}
window.closeDemoModal = function(){
  const m = document.getElementById('demoModal');
  $('#demoFrame').src='about:blank';
  m.classList.remove('show'); m.setAttribute('hidden','');
}
document.getElementById('demoModal').addEventListener('click', (e)=>{ if(e.target.id==='demoModal') closeDemoModal(); });

// ===== Form validation & submit =====
const emailRx=/^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
const waRx=/^\+?\d{8,15}$/;

$('#leadForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const l=document.documentElement.lang||'en';
  const v=(id)=>$('#'+id).value.trim();
  let ok=true;

  ['name','company','usecase'].forEach(id=>{
    const valid = !!v(id);
    $('#err-'+id).style.display = valid ? 'none' : 'block';
    ok = ok && valid;
  });

  const contact=v('contactField'); 
  const isValidContact = emailRx.test(contact) || waRx.test(contact);
  $('#err-contact').style.display = isValidContact ? 'none':'block'; ok = ok && isValidContact;

  const gdpr = $('#gdpr').checked; $('#err-gdpr').style.display = gdpr ? 'none':'block'; ok = ok && gdpr;
  if(!ok) return;

  const payload={
    name:v('name'), company:v('company'), contact,
    usecase:v('usecase'), budget:v('budget'), deadline:v('deadline'), lang:l, ts: new Date().toISOString()
  };

  window.dataLayer = window.dataLayer || [];
  dataLayer.push({event:'form_submit_attempt', ...payload});

  fetch('/api/lead', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)})
    .then(r=>{
      if(!r.ok) throw new Error('Request failed');
      dataLayer.push({event:'form_submit_success', lang:l});
      $('#leadForm').reset();
      $('#form-note').textContent = I18N[l].form_note + ' ✓';
      alert('Thanks! We will get back within 24h.');
    })
    .catch(()=>{
      dataLayer.push({event:'form_submit_error', lang:l});
      alert('Submission failed. Please try again or WhatsApp us.');
    });
});

// ===== Pricing buttons -> open modal =====
document.addEventListener('click',(e)=>{
  const t=e.target.closest('[data-plan]');
  if(!t) return;
  window.dataLayer = window.dataLayer || [];
  dataLayer.push({event:'pricing_plan_click', plan:t.getAttribute('data-plan'), lang:document.documentElement.lang});
  openDemoModal();
});

// ===== Footer year =====
document.getElementById('y').textContent = new Date().getFullYear();
