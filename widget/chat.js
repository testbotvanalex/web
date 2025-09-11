// Basic web chat widget script
(function(){
  function el(tag, attrs={}, html=""){ const e=document.createElement(tag); for(const k in attrs){ e.setAttribute(k, attrs[k]); } if(html) e.innerHTML=html; return e; }
  function addMsg(role, text){ const row=el('div',{class:'bm-row '+(role==='user'?'bm-user':'bm-bot')}); const b=el('div',{class:'bm-bubble'}); b.textContent=text; row.appendChild(b); msgs.appendChild(row); msgs.scrollTop=msgs.scrollHeight; }

  const fab = el('button',{id:'bm-chat-fab',title:'Chat'}); fab.textContent='Chat';
  const panel = el('div',{id:'bm-chat'});
  panel.innerHTML = `
    <div id="bm-head">
      <div class="title"><span class="dot"></span> BotMatic</div>
      <button id="bm-close" aria-label="Close">✕</button>
    </div>
    <div id="bm-msgs"></div>
    <div id="bm-quick"></div>
    <div id="bm-input">
      <input id="bm-q" type="text" placeholder="Type a message…" />
      <button id="bm-send">Send</button>
    </div>
  `;
  document.body.appendChild(fab);
  document.body.appendChild(panel);
  const msgs = panel.querySelector('#bm-msgs');
  const quick = panel.querySelector('#bm-quick');
  const input = panel.querySelector('#bm-q');
  const send = panel.querySelector('#bm-send');
  const closeBtn = panel.querySelector('#bm-close');

  // Quick replies
  const chips = [
    {t:'Ik ben salon', v:'sector: salon'},
    {t:'Ik ben garage', v:'sector: garage'},
    {t:'Restaurant', v:'sector: restaurant'},
    {t:'Vastgoed', v:'sector: vastgoed'},
    {t:'Prijzen', v:'pricing'},
    {t:'Demo', v:'demo'}
  ];
  chips.forEach(c=>{
    const chip=el('button',{class:'bm-chip','data-v':c.v}, c.t);
    chip.addEventListener('click', ()=> ask(c.v));
    quick.appendChild(chip);
  });

  function open(){ panel.style.display='block'; }
  function close(){ panel.style.display='none'; }
  fab.addEventListener('click', ()=> panel.style.display==='block'?close():open());
  closeBtn.addEventListener('click', close);

  // Greeting
  addMsg('bot',"👋 Hi! I'm your BotMatic assistant. Kies een optie of stel je vraag.");

  async function ask(q){
    addMsg('user', q);
    // Demo: simple routing (no backend)
    const reply = route(q);
    addMsg('bot', reply);
  }
  function route(q){
    q = (q||'').toLowerCase();
    if(q.includes('pricing') || q.includes('prijs') || q.includes('tarief')) return 'Onze plannen: Lite €30, Basic €120, Standard €150, Premium €200. Bekijk: /pricing.html';
    if(q.includes('demo')) return 'Top! Laat je gegevens achter op /contact.html of stuur ons via WhatsApp.';
    if(q.includes('salon')) return 'Voor salons: automatische afspraken, herinneringen, minder no-shows. Zie /sectors.html';
    if(q.includes('garage')) return 'Voor garages: offerte-aanvragen & planning via chat. Zie /sectors.html';
    if(q.includes('restaurant')) return 'Voor restaurants: reservaties zonder telefoon. Zie /sectors.html';
    if(q.includes('vastgoed')) return 'Voor vastgoed: leads kwalificeren & afspraken. Zie /sectors.html';
    return 'Ik kan helpen met kanalen, prijzen en demo. Probeer quick replies of vraag wat je wilt weten.';
  }

  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && input.value.trim()){ ask(input.value.trim()); input.value=''; }});
  send.addEventListener('click', ()=>{ if(input.value.trim()){ ask(input.value.trim()); input.value=''; }});
})();