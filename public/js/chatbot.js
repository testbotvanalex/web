(function(){
  const $msgs = document.getElementById('bm-messages');
  const $form = document.getElementById('bm-form');
  const $input = document.getElementById('bm-input');

  const history = []; // [{role:'user'|'model', content:'...'}]

  function bubble(content, who='bot'){
    const wrap = document.createElement('div');
    wrap.className = 'flex gap-3 items-start ' + (who==='user' ? 'flex-row-reverse' : '');
    const avatar = document.createElement('div');
    avatar.className = 'h-8 w-8 rounded-full ' + (who==='user' ? 'bg-ink/80' : 'bg-brand/80');
    const msg = document.createElement('div');
    msg.className = (who==='user'
      ? 'bg-brand/10 border border-brand/20'
      : 'bg-slate-100') + ' rounded-xl p-3 w-full';
    msg.textContent = content;
    wrap.appendChild(avatar); wrap.appendChild(msg);
    $msgs.appendChild(wrap);
    $msgs.scrollTop = $msgs.scrollHeight;
  }

  // Приветствие
  bubble('Hallo! Waarmee kan ik je helpen vandaag?');

  $form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const text = ($input.value || '').trim();
    if(!text) return;

    // пользователь
    bubble(text, 'user');
    history.push({ role:'user', content:text });
    $input.value = '';

    // заглушка "печатает..."
    const typing = document.createElement('div');
    typing.className = 'text-sm text-slate-500 mt-2';
    typing.textContent = 'Typen...';
    $msgs.appendChild(typing);
    $msgs.scrollTop = $msgs.scrollHeight;

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await r.json();
      typing.remove();
      const reply = data.reply || 'Oké.';
      history.push({ role:'model', content: reply });
      bubble(reply, 'bot');
    } catch (err) {
      typing.remove();
      bubble('Er ging iets mis. Probeer opnieuw.', 'bot');
      console.error(err);
    }
  });
})();