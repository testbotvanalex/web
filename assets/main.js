@@
 (function(){
   function ready(fn){ if(document.readyState!=='loading'){fn()} else {document.addEventListener('DOMContentLoaded', fn, {once:true})} }
   const $ = (q,ctx=document)=>ctx.querySelector(q);
   const $$ = (q,ctx=document)=>Array.from(ctx.querySelectorAll(q));
   const dl = (...args)=>{ window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({ts:Date.now()}, ...args)); };
 
   // ===== I18N =====
   const I18N = {
@@
   };
 
-  // ===== i18n apply =====
-  function applyI18n(lang){
+  // ===== i18n apply =====
+  // PATCH: поддержка ?lang, сохранение в localStorage, активная кнопка, запись в URL
+  function applyI18n(lang){
     const dict = I18N[lang] || I18N.en;
     document.documentElement.lang = lang;
     document.documentElement.setAttribute('data-lang', lang);
 
     // text nodes
     document.querySelectorAll('[data-i18n]').forEach(el=>{
       const path = el.getAttribute('data-i18n').split('.');
       let val = dict;
       for(const key of path){ if(val && key in val){ val = val[key]; } }
-      if(typeof val === 'string'){ el.textContent = val; }
+      if(typeof val === 'string'){ el.textContent = val; }
     });
+    // html nodes (если нужно <strong> и т.п.)
+    document.querySelectorAll('[data-i18n-html]').forEach(el=>{
+      const path = el.getAttribute('data-i18n-html').split('.');
+      let val = dict;
+      for(const key of path){ if(val && key in val){ val = val[key]; } }
+      if(typeof val === 'string'){ el.innerHTML = val; }
+    });
     // placeholders
     document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
       const path = el.getAttribute('data-i18n-placeholder').split('.');
       let val = dict;
       for(const key of path){ if(val && key in val){ val = val[key]; } }
       if(typeof val === 'string'){ el.setAttribute('placeholder', val); }
     });
     // active pill
     document.querySelectorAll('.lang button').forEach(b=>{
       b.classList.toggle('active', b.dataset.lang === lang);
     });
 
     try { localStorage.setItem('botmatic_lang', lang); } catch(e){}
+    // обновляем URL (без перезагрузки)
+    try{
+      const url = new URL(location.href);
+      url.searchParams.set('lang', lang);
+      history.replaceState(null,'',url);
+    }catch(e){}
   }
 
+  // PATCH: безопасный навес слушателей (не падать, если элемента нет)
+  function on(el, ev, fn){ if(el) el.addEventListener(ev, fn); }
+
   // ===== Estimate logic =====
   function computeEstimate(state){
@@
   const modal = {
     open(url){
       const m = $('#demoModal'); const f = $('#demoFrame');
-      f.src = url || 'https://cal.com/your-handle?embed=true';
+      if(f) f.src = url || 'https://cal.com/your-handle?embed=true'; // TODO: замени handle
       m.classList.add('show'); m.removeAttribute('hidden');
       dl({event:'cta_demo_click'});
     },
     close(){
       const m = $('#demoModal'); const f = $('#demoFrame');
-      f.src = 'about:blank'; m.classList.remove('show'); m.setAttribute('hidden','');
+      if(f) f.src = 'about:blank';
+      if(m){ m.classList.remove('show'); m.setAttribute('hidden',''); }
     }
   };
 
   ready(function(){
     // Mobile menu
     const btn  = $('.mobile-toggle');
     const menu = $('#mainmenu');
-    if(btn && menu){
+    if(btn && menu){
       const closeMenu = ()=>{ menu.classList.remove('open'); document.body.classList.remove('menu-open'); btn.setAttribute('aria-expanded','false'); };
       btn.addEventListener('click', ()=>{
         const open = menu.classList.toggle('open'); document.body.classList.toggle('menu-open', open); btn.setAttribute('aria-expanded', String(open));
       });
       $$('#mainmenu a').forEach(a=>a.addEventListener('click', closeMenu));
-      document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMenu(); });
+      document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMenu(); });
       const mq = window.matchMedia('(min-width: 768px)'); const handleMQ=()=>{ if(mq.matches) closeMenu(); }; (mq.addEventListener?mq.addEventListener('change',handleMQ):mq.addListener(handleMQ));
     }
 
     // Language
-    let saved=null; try{ saved = localStorage.getItem('botmatic_lang'); }catch(e){}
-    let initial = (saved && I18N[saved]) ? saved : (document.documentElement.getAttribute('lang') || 'nl');
+    // PATCH: учитывать ?lang
+    let saved=null; try{ saved = localStorage.getItem('botmatic_lang'); }catch(e){}
+    let qp=null; try{ qp = new URL(location.href).searchParams.get('lang'); }catch(e){}
+    let initial = (qp && I18N[qp]) ? qp
+               : (saved && I18N[saved]) ? saved
+               : (document.documentElement.getAttribute('lang') || 'nl');
     if(!I18N[initial]) initial='nl';
     applyI18n(initial);
-    $$('.lang button').forEach(b=>b.addEventListener('click', ()=>applyI18n((b.dataset.lang||'en').toLowerCase())));
+    $$('.lang button').forEach(b=>b.addEventListener('click', ()=>applyI18n((b.dataset.lang||'en').toLowerCase())));
 
     // Funnel: Step 1
     const state = { usecase:'lead', usecaseLabel:'Lead capture', channels:[], integrations:[], deadline:'7–14 days' };
-    $$('#usecases .case').forEach(btn=>{
+    $$('#usecases .case').forEach(btn=>{
       btn.addEventListener('click', ()=>{
         state.usecase = btn.dataset.case;
-        state.usecaseLabel = $('.case-t', btn).textContent.trim();
-        $('#quiz').classList.remove('hidden'); $('#quiz').removeAttribute('aria-hidden');
-        $('#quiz').scrollIntoView({behavior:'smooth', block:'start'});
+        const t = $('.case-t', btn);
+        if(t) state.usecaseLabel = t.textContent.trim();
+        const qz = $('#quiz');
+        if(qz){ qz.classList.remove('hidden'); qz.removeAttribute('aria-hidden'); qz.scrollIntoView({behavior:'smooth', block:'start'}); }
         dl({event:'usecase_select', usecase:state.usecase, lang:document.documentElement.lang});
       });
     });
 
     // Funnel: Step 2
-    $('#seePlan').addEventListener('click', ()=>{
+    on($('#seePlan'),'click', ()=>{
       // collect selections
-      state.channels = $$('#quiz [aria-label="Channels"] input:checked').map(i=>i.value);
-      state.integrations = $$('#quiz [aria-label="Integrations"] input:checked').map(i=>i.value);
-      const d = $('#quiz [name="deadline"]:checked'); state.deadline = d ? d.value : '7–14 days';
+      state.channels = $$('#quiz [aria-label="Channels"] input:checked').map(i=>i.value);
+      state.integrations = $$('#quiz [aria-label="Integrations"] input:checked').map(i=>i.value);
+      const d = $('#quiz [name="deadline"]:checked'); state.deadline = d ? d.value : '7–14 days';
 
       dl({event:'quiz_complete', ...state, lang:document.documentElement.lang});
 
       // compute estimate
       const est = computeEstimate(state);
-      $('#estPlan').textContent = est.plan;
-      $('#estPrice').innerHTML = `${est.price} <small>/mo</small>`;
-      const ul = $('#estIncludes'); ul.innerHTML='';
+      const planEl = $('#estPlan'); if(planEl) planEl.textContent = est.plan;
+      const priceEl = $('#estPrice'); if(priceEl) priceEl.innerHTML = `${est.price} <small>/mo</small>`;
+      const ul = $('#estIncludes'); if(ul) ul.innerHTML='';
-      est.includes.forEach(line=>{ const li=document.createElement('li'); li.textContent=line; ul.appendChild(li); });
-      $('#estNote').textContent = `${state.usecaseLabel} · ${state.channels.join(', ') || '1 channel'} · ${state.integrations.join(', ') || 'No integrations'}`;
+      if(ul){ est.includes.forEach(line=>{ const li=document.createElement('li'); li.textContent=line; ul.appendChild(li); }); }
+      const note = $('#estNote'); if(note) note.textContent = `${state.usecaseLabel} · ${state.channels.join(', ') || '1 channel'} · ${state.integrations.join(', ') || 'No integrations'}`;
 
       // WA deeplink
       const summary = `Use case: ${state.usecaseLabel}\nChannels: ${state.channels.join(', ')||'1'}\nIntegrations: ${state.integrations.join(', ')||'none'}\nDeadline: ${state.deadline}\nRecommended: ${est.plan} (${est.price}/mo)`;
       const msg = encodeURIComponent(`Hi BotMatic! 👋\n${summary}`);
-      $('#estWA').href = `https://wa.me/32400000000?text=${msg}`; // <- replace with your WhatsApp number
+      const wa = $('#estWA');
+      if(wa) wa.href = `https://wa.me/32400000000?text=${msg}`; // TODO: замени номер
 
       // demo button
-      $('#estDemo').onclick = ()=>modal.open('https://cal.com/your-handle?embed=true'); // <- replace handle
+      const dmb = $('#estDemo');
+      if(dmb) dmb.onclick = ()=>modal.open('https://cal.com/your-handle?embed=true'); // TODO: замени handle
 
       // show section
-      $('#estimate').classList.remove('hidden'); $('#estimate').removeAttribute('aria-hidden');
-      $('#estimate').scrollIntoView({behavior:'smooth',block:'start'});
+      const estBox = $('#estimate');
+      if(estBox){
+        estBox.classList.remove('hidden'); estBox.removeAttribute('aria-hidden');
+        estBox.scrollIntoView({behavior:'smooth',block:'start'});
+      }
       dl({event:'estimate_view', plan:est.plan, lang:document.documentElement.lang});
     });
 
     // Pricing -> jump back to step 1 with hint
-    $$('#pricing .plan .cta').forEach(btn=>{
+    $$('#pricing .plan .cta').forEach(btn=>{
       btn.addEventListener('click', ()=>{
-        $('#usecases').scrollIntoView({behavior:'smooth', block:'start'});
+        const uc = $('#usecases');
+        if(uc) uc.scrollIntoView({behavior:'smooth', block:'start'});
         dl({event:'pricing_plan_click', plan: btn.closest('.plan')?.dataset.plan || 'unknown', lang:document.documentElement.lang});
       });
     });
 
     // Modal wiring
-    $('.modal__close').addEventListener('click', modal.close);
-    $('#demoModal').addEventListener('click', (e)=>{ if(e.target.id==='demoModal') modal.close(); });
+    on($('.modal__close'),'click', modal.close);
+    on($('#demoModal'),'click', (e)=>{ if(e.target.id==='demoModal') modal.close(); });
 
     // Contact form (dummy)
-    $('#contactForm').addEventListener('submit', (e)=>{
+    on($('#contactForm'),'submit', (e)=>{
       e.preventDefault();
       const fd = new FormData(e.currentTarget);
       if(!fd.get('name') || !fd.get('email') || !fd.get('gdpr')) return;
       dl({event:'form_submit_attempt', lang:document.documentElement.lang});
       // Replace with your POST endpoint if needed:
-      $('#contactOk').textContent = '✓ Thanks! We will reply within 24h.'; $('#contactOk').hidden=false;
+      const ok = $('#contactOk'); if(ok){ ok.textContent = '✓ Thanks! We will reply within 24h.'; ok.hidden=false; }
       e.currentTarget.reset();
       dl({event:'form_submit_success', lang:document.documentElement.lang});
     });
+
+    // ===== Chatbot Ideas widget (optional) =====
+    // Если на странице есть #idea-form — подключаем API /api/ideas
+    const ideaForm = $('#idea-form');
+    const ideaRes  = $('#idea-result');
+    const ideaLoad = $('#idea-loading');
+    if(ideaForm){
+      ideaForm.addEventListener('submit', async (ev)=>{
+        ev.preventDefault();
+        const fd = new FormData(ideaForm);
+        const description = (fd.get('description')||'').toString().trim();
+        const lang = (fd.get('lang')||document.documentElement.lang||'nl').toString().trim().slice(0,2);
+        if(!description){ alert('Please enter a short business description.'); return; }
+        if(ideaRes) ideaRes.innerHTML = '';
+        if(ideaLoad) ideaLoad.style.display = 'block';
+        try{
+          const res = await fetch('/api/ideas',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ description, lang }) });
+          const data = await res.json();
+          if(ideaLoad) ideaLoad.style.display = 'none';
+          if(!res.ok || !data?.ok){
+            if(ideaRes) ideaRes.innerHTML = `<span style="color:#b91c1c">Error: ${data?.error || res.status}</span>`;
+            return;
+          }
+          // Markdown -> HTML (жирный и переносы)
+          const html = data.text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>');
+          if(ideaRes) ideaRes.innerHTML = html;
+          dl({event:'ideas_success', lang});
+        }catch(err){
+          if(ideaLoad) ideaLoad.style.display = 'none';
+          if(ideaRes) ideaRes.innerHTML = `<span style="color:#b91c1c">Error: ${err.message}</span>`;
+          dl({event:'ideas_error', msg: err?.message});
+        }
+      });
+    }
   });
 })();
