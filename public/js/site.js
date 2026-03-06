const WA_NUMBER = "+32456912464";
const WA_TEXT = "Hallo BotMatic, ik wil graag een demo zien.";

function setWhatsAppLinks() {
  const encoded = encodeURIComponent(WA_TEXT);
  const href = `https://wa.me/${WA_NUMBER.replace(/[^\d]/g, "")}?text=${encoded}`;
  document.querySelectorAll(".wa-link").forEach((link) => {
    link.setAttribute("href", href);
  });
}

function initMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  nav.querySelectorAll("a").forEach((item) => {
    item.addEventListener("click", () => {
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initFaq() {
  const items = document.querySelectorAll(".faq-item");
  if (!items.length) return;

  items.forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.toggle("open");
      trigger.setAttribute("aria-expanded", String(isOpen));
      const icon = trigger.querySelector(".faq-icon");
      if (icon) icon.textContent = isOpen ? "−" : "+";
    });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setWhatsAppLinks();
  initMenu();
  initFaq();
  initSmoothScroll();
});
