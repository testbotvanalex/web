// ========= i18n =========
const COPY = {
  nl: {
    nav:{home:"Home",sectors:"Sectoren",pricing:"Tarieven",about:"Over ons",contact:"Contact"},
    cookie:{text:"We gebruiken cookies om je ervaring te verbeteren. Door verder te gaan, ga je akkoord.",accept:"Akkoord",decline:"Weigeren"},
    // Home
    home:{title:"Chatbots die leads omzetten in klanten",subtitle:"WhatsApp, Telegram en website — één premium assistent die 24/7 verkoopt en afspraken plant.",ctaPrimary:"Probeer gratis",ctaSecondary:"Bekijk sectoren",b1:"2 weken gratis",b2:"GDPR-proof",b3:"Multi-taal",compareTitle:"Zonder bot vs. Met bot",w1:"Gemiste berichten ’s avonds",w2:"Trage reactie → verlies van lead",g1:"Instant antwoord 24/7",g2:"Automatische planning & reminders",bestPlan:"Meest gekozen: Standard",demo:"Vraag demo"},
    // Sectors
    sectors:{title:"Sectoren",subtitle:"Kant-en-klare flows per niche — direct inzetbaar.",beauty:"Automatische intake + afspraakplanning, diagnose-flow, upsell behandelingen.",garage:"Offerte-aanvragen, check-in voor service, voorraadvragen, proefritten.",restaurant:"Reserveren, menukaart, allergenen, no-show reductie via reminders.",re:"Leads kwalificeren, afspraken voor bezichtiging, FAQ over dossiers.",cleaning:"Schoonmaak aanvragen, prijsinschatting via vragenboom, routes.",other:"We bouwen flows op maat: support, sales, back-office integraties."},
    // Pricing
    pricing:{title:"Tarieven",subtitle:"Start in minuten. Annuleren kan maandelijks. 2 weken gratis.",basic:"Basic",standard:"Standard",premium:"Premium",best:"Meest gekozen",f1:"Website-widget",f2:"WhatsApp ontvangst",f3:"Standaard FAQ",f4:"E-mail lead export",s1:"WhatsApp + Telegram",s2:"Afspraken & reminders",s3:"Meertalige flows",s4:"Basis integraties (Google Sheet)",p1:"Volledige automatisering",p2:"Custom integraties (CRM/Payments)",p3:"Prioritaire support",p4:"Setup inbegrepen",note:"* Prijzen excl. BTW. WhatsApp-nummers en verkeer kunnen extra kosten hebben."},
    // About
    about:{title:"Over BotMatic",p1:"We bouwen praktische chatbots die echt werken: minder handwerk, meer verkoop.",p2:"Focus: WhatsApp, Telegram en website. Volledig GDPR-proof, meertalig en met duidelijke ROI.",b1:"2 weken gratis proef",b2:"Setup binnen 48 uur",b3:"Transparante prijzen",valuesTitle:"Onze aanpak",valuesText:"Snel live, duidelijke KPI’s, integraties op maat wanneer nodig. We starten met jouw sector-template en finetunen op basis van doelen.",cta:"Plan een kennismaking"},
    // Contact
    contact:{title:"Contact",subtitle:"Stel een vraag of vraag een demo aan. We antwoorden snel."},
    form:{name:"Naam",email:"E-mail",sector:"Sector",msg:"Bericht",gdpr:"Ik ga akkoord met verwerking volgens GDPR.",submit:"Verstuur",note:"Door te verzenden ga je akkoord met onze voorwaarden en privacy."},
    btn:{demo:"Vraag demo",pricing:"Tarieven",whatsapp:"WhatsApp",try:"Probeer gratis"}
  },
  ru: {
    nav:{home:"Главная",sectors:"Секторы",pricing:"Тарифы",about:"О нас",contact:"Контакты"},
    cookie:{text:"Мы используем cookies для улучшения опыта. Продолжая, вы соглашаетесь.",accept:"Согласен",decline:"Отказаться"},
    // Home
    home:{title:"Чат-боты, которые превращают лиды в клиентов",subtitle:"WhatsApp, Telegram и сайт — один премиум-ассистент, который 24/7 продаёт и записывает.",ctaPrimary:"Попробовать бесплатно",ctaSecondary:"Секторы",b1:"2 недели бесплатно",b2:"GDPR-совместимо",b3:"Мультиязычно",compareTitle:"Без бота vs. С ботом",w1:"Потерянные сообщения вечером",w2:"Медленный ответ → потеря лида",g1:"Мгновенные ответы 24/7",g2:"Автозапись и напоминания",bestPlan:"Популярный: Standard",demo:"Запросить демо"},
    // Sectors
    sectors:{title:"Секторы",subtitle:"Готовые сценарии по нишам — сразу к работе.",beauty:"Авто-опрос + запись, диагностика, допродажи процедур.",garage:"Заявки на ремонт/сервис, наличие, тест-драйвы.",restaurant:"Бронирование, меню, аллергены, снижение no-show.",re:"Квалификация лидов, просмотры, ответы на вопросы.",cleaning:"Заявки на уборку, расчёт цены, маршруты.",other:"Решения под ключ: поддержка, продажи, интеграции."},
    // Pricing
    pricing:{title:"Тарифы",subtitle:"Старт за минуты. Отмена помесячно. 2 недели бесплатно.",basic:"Basic",standard:"Standard",premium:"Premium",best:"Самый популярный",f1:"Виджет на сайт",f2:"Приём WhatsApp",f3:"Стандартный FAQ",f4:"Экспорт лидов на e-mail",s1:"WhatsApp + Telegram",s2:"Запись и напоминания",s3:"Мультиязычные сценарии",s4:"Базовые интеграции (Google Sheet)",p1:"Полная автоматизация",p2:"Кастомные интеграции (CRM/Оплата)",p3:"Приоритетная поддержка",p4:"Онбординг включен",note:"* Цены без НДС. Номера WhatsApp и трафик могут оплачиваться отдельно."},
    // About
    about:{title:"О BotMatic",p1:"Делаем практичных ботов, которые дают результат: меньше рутины, больше продаж.",p2:"Фокус: WhatsApp, Telegram и сайт. GDPR, мультиязычность и понятная окупаемость.",b1:"2 недели бесплатно",b2:"Запуск за 48 часов",b3:"Прозрачные цены",valuesTitle:"Наш подход",valuesText:"Быстрый запуск, чёткие KPI, интеграции по мере необходимости. Берём отраслевой шаблон и доводим под цели.",cta:"Назначить встречу"},
    // Contact
    contact:{title:"Контакты",subtitle:"Задайте вопрос или запросите демо. Ответим быстро."},
    form:{name:"Имя",email:"E-mail",sector:"Сектор",msg:"Сообщение",gdpr:"Согласен с обработкой данных по GDPR.",submit:"Отправить",note:"Отправляя форму, вы соглашаетесь с условиями и приватностью."},
    btn:{demo:"Демо",pricing:"Тарифы",whatsapp:"WhatsApp",try:"Попробовать"}
  }
};

function t(path){
  const lang = localStorage.getItem('lang') || 'nl';
  const dict = COPY[lang] || COPY.nl;
  return path.split('.').reduce((acc,k)=>acc?.[k], dict) ?? '';
}

function applyLang(lang){
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if(typeof val === 'string') el.textContent = val;
  });
}

// init language and bind
document.querySelectorAll('.lang-btn').forEach(b=> b.addEventListener('click', ()=> applyLang(b.dataset.lang)));
applyLang(localStorage.getItem('lang') || 'nl');

// year
const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();

// cookie
const cookieBar = document.getElementById('cookieBar');
const cookieKey = 'cookieConsent';
if(cookieBar && !localStorage.getItem(cookieKey)){ cookieBar.style.display='block'; }
const acc = document.getElementById('cookieAccept');
const dec = document.getElementById('cookieDecline');
acc && acc.addEventListener('click', ()=>{ localStorage.setItem(cookieKey,'yes'); cookieBar.style.display='none'; });
dec && dec.addEventListener('click', ()=>{ localStorage.setItem(cookieKey,'no'); cookieBar.style.display='none'; });

// forms (demo only)
const leadForm = document.getElementById('leadForm');
if(leadForm){
  leadForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(leadForm).entries());
    console.log('Lead:', data);
    alert(localStorage.getItem('lang')==='ru' ? 'Спасибо! Свяжемся скоро.' : 'Bedankt! We nemen snel contact op.');
    leadForm.reset();
  });
}