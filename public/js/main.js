// BotMatic Main Script - Light Luxury Edition

// 1. Cookie Banner
(function initCookieBanner() {
  const KEY = 'bm_cookies_accepted';
  if (localStorage.getItem(KEY)) return;

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.style.cssText = `
    position: fixed; bottom: 24px; left: 24px; right: 24px; z-index: 9990;
    max-width: 400px; padding: 24px; background: white;
    border-radius: 20px; box-shadow: 0 20px 60px -10px rgba(0,0,0,0.15);
    border: 1px solid #E2E8F0; display: flex; flex-direction: column; gap: 16px;
    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  `;

  banner.innerHTML = `
    <div>
      <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">🍪 Cookies?</div>
      <div style="font-size: 14px; color: #64748B; line-height: 1.5;">
        Wij gebruiken cookies om je ervaring te verbeteren. Geen zorgen, we slaan geen persoonlijke data op zonder toestemming.
      </div>
    </div>
    <div style="display: flex; gap: 12px;">
      <button id="accept-cookies" style="flex: 1; padding: 12px; background: #020617; color: white; border-radius: 12px; font-weight: 600; border: none; cursor: pointer;">Prima</button>
      <button id="decline-cookies" style="flex: 1; padding: 12px; background: white; color: #020617; border-radius: 12px; font-weight: 600; border: 1px solid #E2E8F0; cursor: pointer;">Nee, bedankt</button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('accept-cookies').onclick = () => {
    localStorage.setItem(KEY, 'true');
    banner.remove();
  };

  document.getElementById('decline-cookies').onclick = () => {
    localStorage.setItem(KEY, 'false'); // Still remember choice
    banner.remove();
  };

  // Add animation style
  const style = document.createElement('style');
  style.textContent = `@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
  document.head.appendChild(style);
})();

// 2. Animate Elements on Scroll (Optional polish)
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.card, .hero-content, .phone-mockup').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'all 0.6s ease-out';
  el.style.willChange = 'opacity, transform';
  observer.observe(el);
});
