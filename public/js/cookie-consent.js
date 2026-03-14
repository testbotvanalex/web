(function () {
  var GA_ID = 'G-W5B2VS39V0';
  var KEY = 'bm_cookie_consent';

  // Load GA4 dynamically
  function loadGA() {
    if (window._gaLoaded) return;
    window._gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  // Inject banner HTML
  function createBanner() {
    var div = document.createElement('div');
    div.id = 'bm-cookie-banner';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-label', 'Cookie toestemming');
    div.innerHTML =
      '<div class="bm-cookie-inner">' +
        '<div class="bm-cookie-text">' +
          '<strong>🍪 Cookies</strong> ' +
          'We gebruiken analytische cookies om te begrijpen hoe bezoekers onze site gebruiken. ' +
          '<a href="/cookies.html" class="bm-cookie-link">Meer info</a>' +
        '</div>' +
        '<div class="bm-cookie-btns">' +
          '<button id="bm-cookie-decline" class="bm-cookie-btn bm-cookie-btn-ghost">Weigeren</button>' +
          '<button id="bm-cookie-accept" class="bm-cookie-btn bm-cookie-btn-primary">Accepteren</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(div);
  }

  function showBanner() {
    var b = document.getElementById('bm-cookie-banner');
    if (b) setTimeout(function () { b.classList.add('bm-cookie-visible'); }, 50);
  }

  function hideBanner() {
    var b = document.getElementById('bm-cookie-banner');
    if (!b) return;
    b.classList.remove('bm-cookie-visible');
    setTimeout(function () { b.remove(); }, 400);
  }

  function accept() {
    localStorage.setItem(KEY, 'accepted');
    hideBanner();
    loadGA();
  }

  function decline() {
    localStorage.setItem(KEY, 'declined');
    hideBanner();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var consent = localStorage.getItem(KEY);

    if (consent === 'accepted') {
      loadGA();
      return;
    }

    if (consent === 'declined') {
      return;
    }

    // No choice yet — show banner after 1.2s
    createBanner();
    setTimeout(showBanner, 1200);

    document.getElementById('bm-cookie-accept').addEventListener('click', accept);
    document.getElementById('bm-cookie-decline').addEventListener('click', decline);
  });
})();
