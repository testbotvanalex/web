// /assets/main.js — fixed + hourly-rotating demo

(function(){
  function ready(fn){ if(document.readyState!=='loading'){fn()} else {document.addEventListener('DOMContentLoaded', fn, {once:true})} }

  ready(function(){

    // ===== Mobile menu =====
    var btn  = document.querySelector('.mobile-toggle');
    var menu = document.getElementById('mainmenu');
    if(btn && menu){
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
      Array.prototype.forEach.call(menu.querySelectorAll('a'), function(a){
        a.addEventListener('click', closeMenu, false);
      });
      document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeMenu(); }, false);
      var mq = window.matchMedia('(min-width: 768px)');
      var handleMQ = function(){ if(mq.matches){ closeMenu(); } };
      if(mq.addEventListener) mq.addEventListener('change', handleMQ); else mq.addListener(handleMQ);
    }

    // ===== Active language pill by path =====
    (function(){
      var first = (location.pathname.replace(/^\/+/, '').split('/')[0] || 'en').toLowerCase();
      document.querySelectorAll('.lang .pill').forEach(function(a){
        var code = (a.getAttribute('href')||'').split('/')[1] || 'en';
        if(code.toLowerCase()===first){ a.classList.add('active'); }
      });
    })();

    // ===== Hourly-rotating static demo (Variant A) =====
    (function(){
      var screen = document.querySelector('.screen');
      if(!screen) return;

      var LOCALE = (document.documentElement.lang || 'en').slice(0,2).toLowerCase();

      var DEMOS = {
        en: [
`Hi! I’m BotMatic. What do you need help with?
Book an appointment | Prices | Talk to agent
Book a facial this Friday
Great! Morning or afternoon works best?
Afternoon
Done ✅ 16:30 reserved. You’ll get a reminder 2h before.`,

`Hi! I’m BotMatic. What do you need help with?
Book an appointment | Prices | Talk to agent
I need WhatsApp automation for leads
Nice — which industry are you in?
Beauty & wellness
Perfect. I’ll send a short demo to your email. What’s the address?`,

`Hi! I’m BotMatic. What do you need help with?
Book an appointment | Prices | Talk to agent
Pricing please
We have Starter (€29), Standard (€99), Premium (€299).
I want Standard
Great choice. Want a 10‑min demo link now?`,

`Hi! I’m BotMatic. What do you need help with?
Book an appointment | Prices | Talk to agent
Can I integrate with Google Calendar?
Yes — we sync availability and auto‑confirm bookings.
Schedule a test booking Friday
Sure. 11:00 or 16:30?`,

`Hi! I’m BotMatic. What do you need help with?
Book an appointment | Prices | Talk to agent
Route hot leads to a human
Got it. We can auto‑qualify and hand off to your team in WhatsApp.
Sounds good — show me setup steps
Brief → flow draft → go‑live in 7–14 days ✅`
        ],
        nl: [
`Hoi! Ik ben BotMatic. Waarmee kan ik helpen?
Afspraak maken | Prijzen | Praat met agent
Boek een gezichtsbehandeling vrijdag
Top! Ochtend of namiddag?
Namiddag
Klaar ✅ 16:30 gereserveerd. Je krijgt 2u vooraf een herinnering.`,

`Hoi! Ik ben BotMatic. Waarmee kan ik helpen?
Afspraak maken | Prijzen | Praat met agent
Ik wil WhatsApp‑automatisering voor leads
Nice — in welke sector?
Beauty & wellness
Top. Ik stuur een korte demo naar je e‑mail. Wat is het adres?`,

`Hoi! Ik ben BotMatic. Waarmee kan ik helpen?
Afspraak maken | Prijzen | Praat met agent
Wat kost het?
We hebben Starter (€29), Standaard (€99), Premium (€299).
Ik wil Standaard
Graag! Wil je nu een demo‑link van 10 min?`,

`Hoi! Ik ben BotMatic. Waarmee kan ik helpen?
Afspraak maken | Prijzen | Praat met agent
Kan dit met Google Agenda koppelen?
Ja — we syncen beschikbaarheid en bevestigen automatisch.
Plan een testboeking vrijdag
Sure. 11:00 of 16:30?`,

`Hoi! Ik ben BotMatic. Waarmee kan ik helpen?
Afspraak maken | Prijzen | Praat met agent
Heet leads doorsturen naar een medewerker
Check. We kwalificeren automatisch en schakelen door in WhatsApp.
Klinkt goed — wat zijn de stappen?
Brief → flow‑schets → live in 7–14 dagen ✅`
        ],
        fr: [
`Salut ! Je suis BotMatic. Je peux t’aider ?
Prendre rendez‑vous | Tarifs | Parler à un agent
Réserver un soin visage vendredi
Parfait ! Matin ou après‑midi ?
Après‑midi
C’est fait ✅ 16:30 réservé. Rappel 2h avant.`,

`Salut ! Je suis BotMatic. Je peux t’aider ?
Prendre rendez‑vous | Tarifs | Parler à un agent
Automatisation WhatsApp pour les leads
Top — dans quel secteur ?
Beauté & bien‑être
Parfait. J’envoie une démo courte par e‑mail. Quelle adresse ?`,

`Salut ! Je suis BotMatic. Je peux t’aider ?
Prendre rendez‑vous | Tarifs | Parler à un agent
Les tarifs ?
Starter (€29), Standard (€99), Premium (€299).
Je prends Standard
Super. Tu veux un lien démo de 10 min maintenant ?`,

`Salut ! Je suis BotMatic. Je peux t’aider ?
Prendre rendez‑vous | Tarifs | Parler à un agent
Intégration Google Agenda possible ?
Oui — on synchronise la dispo et on confirme auto.
Planifie un test vendredi
Avec plaisir. 11:00 ou 16:30 ?`,

`Salut ! Je suis BotMatic. Je peux t’aider ?
Prendre rendez‑vous | Tarifs | Parler à un agent
Transférer les leads chauds à un humain
Bien noté. On qualifie et on transfère dans WhatsApp.
Parfait — étapes ?
Brief → maquette du flow → mise en ligne en 7–14 jours ✅`
        ]
      };

      var pool = DEMOS[LOCALE] || DEMOS.en;
      var hour = new Date().getHours();
      var idx  = hour % pool.length;
      var text = pool[idx];

      var lines = String(text).trim().split('\n').filter(Boolean);

      var add = function(cls, t){
        var el = document.createElement('div');
        el.className = cls;
        el.textContent = t;
        screen.appendChild(el);
      };

      var addKB = function(optsLine){
        if(optsLine.indexOf('|') === -1) return false;
        var parts = optsLine.split('|').map(function(s){ return s.trim(); }).filter(Boolean);
        if(parts.length < 2) return false;
        var kb = document.createElement('div');
        kb.className = 'kb';
        parts.forEach(function(p){
          var chip = document.createElement('span');
          chip.textContent = p;
          kb.appendChild(chip);
        });
        screen.appendChild(kb);
        return true;
      };

      screen.innerHTML = '';
      lines.forEach(function(t, i){
        if(i === 0){ add('msg bot', t); return; }
        if(addKB(t)) return;
        var cls = (i % 2 === 0) ? 'msg user' : 'msg bot';
        add(cls, t);
      });
    })();

  }); // ready
})();
