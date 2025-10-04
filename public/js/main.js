
// Mobile menu toggle
const menuBtn = document.getElementById('menu-btn');
const menu = document.getElementById('mobile-menu');
if (menuBtn && menu) {
  menuBtn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });
}

// Animate on scroll (basic)
const animateEls = document.querySelectorAll('[data-animate]');
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('opacity-100', 'translate-y-0');
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });

animateEls.forEach(el => {
  el.classList.add('opacity-0', 'translate-y-4', 'transition', 'duration-700');
  obs.observe(el);
});
