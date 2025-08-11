// /assets/main.js
(function(){
  function ready(fn){ if(document.readyState!=='loading'){fn()} else {document.addEventListener('DOMContentLoaded', fn, {once:true})} }

  ready(function(){
    // Mobile menu
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

    // Active language pill by path
    (function(){
      var first = (location.pathname.replace(/^\/+/, '').split('/')[0] || 'en').toLowerCase();
      document.querySelectorAll('.lang .pill').forEach(function(a){
        var code = (a.getAttribute('href')||'').split('/')[1] || 'en';
        if(code.toLowerCase()===first){ a.classList.add('active'); }
      });
    })();

    // Optional: show a tiny thank-you message when coming back from Formspree redirect
    if(location.hash === '#sent'){
      var ok = document.querySelector('.form-ok');
      if(ok) ok.hidden = false;
    }
  });
})();
