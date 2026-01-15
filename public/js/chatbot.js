(function(){
  const $msgs = document.getElementById('bm-messages');
  const $form = document.getElementById('bm-form');
  const $input = document.getElementById('bm-input');

  if (!$msgs || !$form || !$input) return;

  const history = []; // [{role:'user'|'model', content:'...'}]

  // Sound notification (optional)
  function playNotification() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
  }

  function bubble(content, who='bot', animate=true){
    const wrap = document.createElement('div');
    wrap.className = 'flex gap-3 items-start ' + (who==='user' ? 'flex-row-reverse' : '');
    
    // Animation classes
    if (animate) {
      wrap.style.opacity = '0';
      wrap.style.transform = 'translateY(10px)';
      wrap.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }

    const avatar = document.createElement('div');
    avatar.className = 'h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ' 
      + (who==='user' ? 'bg-gradient-to-br from-slate-600 to-slate-800' : 'bg-gradient-to-br from-brand to-brand2');
    avatar.innerHTML = who === 'user' ? '👤' : '🤖';

    const msg = document.createElement('div');
    msg.className = (who==='user'
      ? 'bg-brand/10 border border-brand/20 dark:bg-brand/20 dark:border-brand/30'
      : 'bg-slate-100 dark:bg-slate-700 dark:text-slate-100') + ' rounded-xl p-3 max-w-[85%]';
    msg.textContent = content;

    wrap.appendChild(avatar); 
    wrap.appendChild(msg);
    $msgs.appendChild(wrap);
    $msgs.scrollTop = $msgs.scrollHeight;

    // Trigger animation
    if (animate) {
      requestAnimationFrame(() => {
        wrap.style.opacity = '1';
        wrap.style.transform = 'translateY(0)';
      });
    }
  }

  function createTypingIndicator() {
    const wrap = document.createElement('div');
    wrap.className = 'flex gap-3 items-start typing-indicator';
    wrap.id = 'typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-brand to-brand2 text-white text-xs';
    avatar.innerHTML = '🤖';

    const dots = document.createElement('div');
    dots.className = 'bg-slate-100 dark:bg-slate-700 rounded-xl p-3 flex gap-1 items-center';
    dots.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;

    wrap.appendChild(avatar);
    wrap.appendChild(dots);
    return wrap;
  }

  // Add typing indicator styles
  const style = document.createElement('style');
  style.textContent = `
    .typing-dot {
      width: 8px;
      height: 8px;
      background: linear-gradient(135deg, #7c3aed, #22d3ee);
      border-radius: 50%;
      animation: typingBounce 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    .typing-dot:nth-child(3) { animation-delay: 0s; }
    @keyframes typingBounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Greeting
  bubble('Hallo! Waarmee kan ik je helpen vandaag?');

  $form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const text = ($input.value || '').trim();
    if(!text) return;

    // User message
    bubble(text, 'user');
    history.push({ role:'user', content:text });
    $input.value = '';

    // Animated typing indicator
    const typing = createTypingIndicator();
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
      playNotification();
    } catch (err) {
      typing.remove();
      bubble('Er ging iets mis. Probeer opnieuw.', 'bot');
      console.error(err);
    }
  });
})();