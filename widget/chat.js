// BotMatic Chat widget — clean, no badge
(function(){
  const $ = (s, r=document)=>r.querySelector(s);
  const el = (tag, cls, html)=>{ const n=document.createElement(tag); if(cls) n.className=cls; if(html!=null) n.innerHTML=html; return n; };
  const wait = (ms)=>new Promise(res=>setTimeout(res, ms));

  // FAB
  const fab = el('button','bm-chat-btn','💬');
  fab.setAttribute('aria-label','Open chat');
  document.body.appendChild(fab);

  // Panel
  const panel = el('div','bm-chat');
  panel.innerHTML = `
    <header>
      <div class="h-left">
        <div class="avatar">B</div>
        <div class="title">BotMatic</div>
      </div>
      <div class="h-right">
        <button type="button" data-min>–</button>
      </div>
    </header>
    <div class="bm-messages" id="bmMessages" aria-live="polite"></div>
    <div class="bm-typing" id="bmTyping"><span class="dots"><span></span><span></span><span></span></span> BotMatic typt…</div>
    <div class="bm-input">
      <input id="bmInput" type="text" placeholder="Schrijf een bericht…" />
      <button id="bmSend" type="button">Stuur</button>
    </div>
  `;
  document.body.appendChild(panel);

  const messages = $('#bmMessages', panel);
  const typing = $('#bmTyping', panel);
  const input = $('#bmInput', panel);
  const sendBtn = $('#bmSend', panel);

  function addMsg(text, who='bot'){
    const row = el('div','bm-msg'+(who==='me'?' me':''), '');
    const bubble = el('div','bubble', text);
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }
  function setTyping(v){ typing.style.display = v ? 'flex' : 'none'; }
  async function botSay(html, delay=450){ setTyping(true); await wait(delay); setTyping(false); addMsg(html,'bot'); }

  function greeting(){
    addMsg(`Hoi! 👋 Ik help met demo’s en prijzen.`, 'bot');
    addMsg(`
      Kies een optie hieronder of stel een vraag:
      <div class="bm-quick">
        <button class="bm-chip" data-q="Ik wil een demo">Ik wil een demo</button>
        <button class="bm-chip" data-q="Wat kost het?">Wat kost het?</button>
        <button class="bm-chip" data-q="Welke kanalen?">Welke kanalen?</button>
      </div>
    `, 'bot');
  }

  function leadForm(){
    addMsg(`
      Top! Laat even je gegevens achter, dan sturen we binnen 1 werkdag info.
      <div class="bm-form">
        <input id="bmName" placeholder="Naam" />
        <input id="bmEmail" type="email" placeholder="E-mail" />
      </div>
      <div class="bm-quick" style="margin-top:8px;">
        <button class="bm-chip" data-lead="send">Verzend</button>
      </div>
    `,'bot');
  }

  async function handleUser(text){
    const t = text.toLowerCase();
    if (t.includes('demo')) { await botSay('Graag! 🎯', 320); leadForm(); return; }
    if (t.includes('kost') || t.includes('prijs')) { await botSay('Basic €29/m • Standard €99/m • Premium €299/m. 14 dagen gratis proef.'); return; }
    if (t.includes('kanaal') || t.includes('channels') || t.includes('welke')) { await botSay('We ondersteunen WhatsApp, Instagram, Messenger, Telegram en website-widget. Welke wil je koppelen?'); return; }
    await botSay('Bedankt! Een collega bekijkt je vraag en neemt contact op.');
  }

  fab.addEventListener('click', ()=>{
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !panel.dataset.init){
      panel.dataset.init = '1';
      greeting();
    }
  });
  panel.querySelector('[data-min]').addEventListener('click', ()=>panel.classList.remove('open'));

  panel.addEventListener('click', (e)=>{
    const chip = e.target.closest('.bm-chip');
    if (chip && chip.dataset.q){ const q = chip.dataset.q; addMsg(q,'me'); handleUser(q); }
    if (chip && chip.dataset.lead === 'send'){
      const name = $('#bmName'); const email = $('#bmEmail');
      const ok = (name?.value||'').trim() && /\S+@\S+\.\S+/.test((email?.value||'').trim());
      if(!ok){ addMsg('Vul a.u.b. naam en een geldig e-mail in.', 'bot'); return; }
      try{
        const leads = JSON.parse(localStorage.getItem('bm_leads')||'[]');
        leads.push({name:name.value,email:email.value,ts:Date.now()});
        localStorage.setItem('bm_leads', JSON.stringify(leads));
      }catch(_){}
      addMsg('Dank je! Wij nemen snel contact op. ✅','bot');
    }
  });

  function send(){ const v=(input.value||'').trim(); if(!v) return; addMsg(v,'me'); input.value=''; handleUser(v); }
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') send(); });
})();