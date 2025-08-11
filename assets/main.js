// /assets/main.js — safe ES5 version

(function(){
  // Run after DOM ready (works with/without defer)
  function ready(fn){
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  ready(function(){
    if(window.console) console.log('BotMatic main.js init');

    /* ========== Mobile menu ========== */
    var btn  = document.querySelector('.mobile-toggle');
    var menu = document.getElementById('mainmenu');
    if (btn && menu){
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

      // Close on link click
      var links = menu.querySelectorAll('a');
      for (var i=0; i<links.length; i++){
        links[i].addEventListener('click', closeMenu, false);
      }

      // Close on ESC
      document.addEventListener('keydown', function(e){
        if((e.key || e.keyCode) === 'Escape' || e.keyCode === 27) closeMenu();
      }, false);

      // Reset on desktop
      var mq = window.matchMedia('(min-width:768px)');
      var handleMQ = function(){ if(mq.matches) closeMenu(); };
      if(mq.addEventListener) mq.addEventListener('change', handleMQ);
      else if(mq.addListener) mq.addListener(handleMQ);
    }

    /* ========== Language pills active ========== */
    try{
      var firstSeg = (location.pathname.replace(/^\/+/, '').split('/')[0] || 'en').toLowerCase();
      var pills = document.querySelectorAll('.lang .pill');
      for (var j=0; j<pills.length; j++){
        var href = pills[j].getAttribute('href') || '/en/';
        var code = (href.split('/')[1] || 'en').toLowerCase();
        if(code === firstSeg){ pills[j].classList.add('active'); }
      }
    }catch(_){}

    /* ========== Hourly-rotating static demo ========== */
    (function(){
      var screen = document.querySelector('.screen');
      if(!screen){ if(window.console) console.warn('No .screen found'); return; }

      // Detect locale from <html lang="">
      var html = document.documentElement || document.getElementsByTagName('html')[0];
      var LOCALE = ((html && html.lang) ? html.lang : 'en').slice(0,2).toLowerCase();

      var DEMOS = {
        en: [
"Hi! I’m BotMatic. What do you need help with?\nBook an appointment | Prices | Talk to agent\nBook a facial this Friday\nGreat! Morning or afternoon works best?\nAfternoon\nDone ✅ 16:30 reserved. You’ll get a reminder 2h before.",
"Hi! I’m BotMatic. What do you need help with?\nBook an appointment | Prices | Talk to agent\nI need WhatsApp automation for leads\nNice — which industry are you in?\nBeauty & wellness\nPerfect. I’ll send a short demo to your email. What’s the address?",
"Hi! I’m BotMatic. What do you need help with?\nBook an appointment | Prices | Talk to agent\nPricing please\nWe have Starter (€29), Standard (€99), Premium (€299).\nI want Standard\nGreat choice. Want a 10‑min demo link now?",
"Hi! I’m BotMatic. What do you need help with?\nBook an appointment | Prices | Talk to agent\nCan I integrate with Google Calendar?\nYes — we sync availability and auto‑confirm bookings.\nSchedule a test booking Friday\nSure. 11:00 or 16:30?",
"Hi! I’m BotMatic. What do you need help with?\nBook an appointment | Prices | Talk to agent\nRoute hot leads to a human\nGot it. We can auto‑qualify and hand off to your team in WhatsApp.\nSounds good — show me setup steps\nBrief → flow draft → go‑live in 7–14 days ✅"
        ],
        nl: [
"Hoi! Ik ben BotMatic. Waarmee kan ik helpen?\nAfspraak maken | Prijzen | Praat met agent\nBoek een gezichtsbehandeling vrijdag\nTop! Ochtend of namiddag?\nNamiddag\nKlaar ✅ 16:30 gereserveerd. Je krijgt 2u vooraf een herinnering.",
"Hoi! Ik ben BotMatic. Waarmee kan ik helpen?\nAfspraak maken | Prijzen | Praat met agent\nIk wil WhatsApp‑automatisering voor leads\nNice — in welke sector?\nBeauty & wellness\nTop. Ik stuur een korte demo naar je e‑mail. Wat is het adres?",
"Hoi! Ik ben BotMatic. Waarmee kan ik helpen?\nAfspraak maken | Prijzen | Praat met agent\nWat kost het?\nWe hebben Starter (€29), Standaard (€99), Premium (€299).\nIk wil Standaard\nGraag! Wil je nu een demo‑link van 10 min?",
"Hoi! Ik ben BotMatic. Waarmee kan ik helpen?\nAfspraak maken | Prijzen | Praat met agent\nKan dit met Google Agenda koppelen?\nJa — we syncen beschikbaarheid en bevestigen automatisch.\nPlan een testboeking vrijdag\nSure. 11:00 of 16:30?",
"Hoi! Ik ben BotMatic. Waarmee kan ik helpen?\nAfspraak maken | Prijzen | Praat met agent\nHeet leads doorsturen naar een medewerker\nCheck. We kwalificeren automatisch en schakelen door in WhatsApp.\nKlinkt goed — wat zijn de stappen?\nBrief → flow‑schets → live in 7–14 dagen ✅"
        ],
        fr: [
"Salut ! Je suis BotMatic. Je peux t’aider ?\nPrendre rendez‑vous | Tarifs | Parler à un agent\nRéserver un soin visage vendredi\nParfait ! Matin ou après‑midi ?\nAprès‑midi\nC’est fait ✅ 16:30 réservé. Rappel 2h avant.",
"Salut ! Je suis BotMatic. Je peux t’aider ?\nPrendre rendez‑vous | Tarifs | Parler à un agent\nAutomatisation WhatsApp pour les leads\nTop — dans quel secteur ?\nBeauté & bien‑être\nParfait. J’envoie une démo courte par e‑mail. Quelle adresse ?",
"Salut ! Je suis BotMatic. Je peux t’aider ?\nPrendre rendez‑vous | Tarifs | Parler à un agent\nLes tarifs ?\nStarter (€29), Standard (€99), Premium (€299).\nJe prends Standard\nSuper. Tu veux un lien démo de 10 min maintenant ?",
"Salut ! Je suis BotMatic. Je peux t’aider ?\nPrendre rendez‑vous | Tarifs | Parler à un agent\nIntégration Google Agenda possible ?\nOui — on synchronise la dispo et on confirme auto.\nPlanifie un test vendredi\nAvec plaisir. 11:00 ou 16:30 ?",
"Salut ! Je suis BotMatic. Je peux t’aider ?\nPrendre rendez‑vous | Tarifs | Parler à un agent\nTransférer les leads chauds à un humain\nBien noté. On qualifie et on transfère dans WhatsApp.\nParfait — étapes ?\nBrief → maquette du flow → mise en ligne en 7–14 jours ✅"
        ]
      };

      var pool = DEMOS[LOCALE] || DEMOS.en;
      var hour = (new Date()).getHours();
      var idx  = hour % pool.length;
      var text = pool[idx];

      var lines = String(text || '').replace(/\r/g,'').split('\n');
      // Helpers
      function add(cls, t){
        var el = document.createElement('div');
        el.className = cls;
        el.textContent = t;
        screen.appendChild(el);
      }
      function addKB(line){
        if (line.indexOf('|') === -1) return false;
        var parts = line.split('|');
        if (parts.length < 2) return false;
        var kb = document.createElement('div');
        kb.className = 'kb';
        for (var k=0; k<parts.length; k++){
          var chip = document.createElement('span');
          chip.textContent = parts[k].replace(/^\s+|\s+$/g,'');
          kb.appendChild(chip);
        }
        screen.appendChild(kb);
        return true;
      }

      screen.innerHTML = '';
      for (var a=0; a<lines.length; a++){
        var t = lines[a];
        if(!t){ continue; }
        if(a === 0){ add('msg bot', t); continue; }
        if(addKB(t)) continue;
        var cls = (a % 2 === 0) ? 'msg user' : 'msg bot';
        add(cls, t);
      }
    })();

    /* ========== Fake submit → thank you (placeholder) ========== */
    (function(){
      var f = document.getElementById('contact-form');
      if(!f) return;
      f.addEventListener('submit', function(e){
        e.preventDefault();
        var ok = document.querySelector('.form-ok');
        if(ok) ok.hidden = false;
        f.reset();
      }, false);
    })();

  }); // ready
})();
