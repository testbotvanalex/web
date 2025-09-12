const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

/* Reveal on scroll */
(function(){
  const items = $$('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) { items.forEach(el=>el.classList.add('show')); return; }
  const io = new IntersectionObserver((entries, obs)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){ en.target.classList.add('show'); obs.unobserve(en.target); }
    });
  }, {threshold:.12});
  items.forEach(el=>io.observe(el));
})();

/* Footer year */
const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

/* Generic binder (на будущее формы) */
function bindForm(id, {success='Bedankt! We sturen je zo info.'}={}){
  const f = $('#'+id); if(!f) return;
  const start = Date.now();
  f.addEventListener('submit', e=>{
    e.preventDefault();
    if(Date.now()-start<600) return;
    const email = f.querySelector('input[type="email"]');
    if(email && !/\S+@\S+\.\S+/.test((email.value||'').trim())){
      email.setCustomValidity('Vul een geldig e-mail in.'); email.reportValidity();
      setTimeout(()=>email.setCustomValidity(''), 1600);
      return;
    }
    alert(success);
    try{
      const data = Object.fromEntries(new FormData(f).entries());
      const store = JSON.parse(localStorage.getItem('bm_forms')||'[]');
      store.push({id, data, ts:Date.now()});
      localStorage.setItem('bm_forms', JSON.stringify(store));
    }catch(_){}
    f.reset();
  });
}
['heroEmailForm','leadForm','trialForm','contactForm'].forEach(id=>bindForm(id,{success:'Dank je! We nemen snel contact op.'}));