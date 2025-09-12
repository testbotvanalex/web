const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

/* Mobile menu toggle */
(() => {
  const btn = $('.burger'); const m = $('#mnav');
  if(!btn || !m) return;
  btn.addEventListener('click', ()=>{
    const opened = m.classList.toggle('open');
    btn.setAttribute('aria-expanded', opened ? 'true' : 'false');
  });
})();

/* Reveal on scroll */
(() => {
  const items = $$('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) { items.forEach(el=>el.classList.add('show')); return; }
  const io = new IntersectionObserver((entries, obs)=>{
    for (const en of entries){
      if(en.isIntersecting){ en.target.classList.add('show'); obs.unobserve(en.target); }
    }
  }, {threshold:.12});
  items.forEach(el=>io.observe(el));
})();

/* Footer year */
const y = $('#year'); if (y) y.textContent = new Date().getFullYear();