// lib/i18n.ts

export type Plan = {
  name: string;
  price: string;
  features: string[];
  cta: string;
  link: string;        // mailto или ссылка
  popular?: boolean;
};

export type FAQ = { q: string; a: string };

export type LocaleDict = {
  heroTitle: string;
  heroSub: string;
  ctaContact: string;
  ctaPricing: string;
  offerTitle?: string;
  offer?: [string, string][];
  pricingTitle: string;
  plans: Plan[];
  contactTitle: string;
  contactDesc: string;
  email: string;
  gamble: string;
  faqTitle: string;
  faq: FAQ[];
};

export const languages = ["nl", "fr", "en"] as const;
export type Lang = (typeof languages)[number];

// ===== Переводы =====
export const t: Record<Lang, LocaleDict> = {
  nl: {
    heroTitle: "BotMatic • Slimme chatbots",
    heroSub: "Van lead tot klant: WhatsApp, Telegram, Website. Alles geautomatiseerd.",
    ctaContact: "Contact",
    ctaPricing: "Tarieven",
    pricingTitle: "Tarieven",
    plans: [
      {
        name: "Basis",
        price: "€29/maand",
        features: ["1 kanaal (bv. WhatsApp)", "1 scenario (FAQ/afspraak)", "tot 500 dialogen"],
        cta: "Kiezen",
        link: "mailto:hello@botmatic.be?subject=BotMatic%20Basis%20Plan",
      },
      {
        name: "Standaard",
        price: "€99/maand",
        features: ["2 kanalen", "Meerdere scenario’s", "tot 2.000 dialogen", "CRM integratie"],
        cta: "Meest gekozen",
        link: "mailto:hello@botmatic.be?subject=BotMatic%20Standaard%20Plan",
        popular: true,
      },
      {
        name: "Premium",
        price: "€299/maand",
        features: ["Alle kanalen + integraties", "AI-offers & betalingen", "Onbeperkt dialogen", "Toegewijde support"],
        cta: "Demo aanvragen",
        link: "mailto:hello@botmatic.be?subject=BotMatic%20Premium%20Plan",
      },
    ],
    contactTitle: "Contact",
    contactDesc: "Vertel kort over je bedrijf en doel; ik stel een scenario en prijs voor.",
    email: "hello@botmatic.be",
    gamble: "21+ Gokken kan verslavend zijn. Stop op tijd! Meer info — www.stopoptijd.be",
    faqTitle: "Veelgestelde vragen",
    faq: [
      { q: "Hoe snel kan de chatbot worden geïmplementeerd?", a: "Meestal binnen 2–5 werkdagen, afhankelijk van de complexiteit." },
      { q: "Kan ik later upgraden of downgraden?", a: "Ja, u kunt op elk moment van pakket wisselen." },
    ],
  },

  fr: {
    heroTitle: "BotMatic • Chatbots intelligents",
    heroSub: "De prospect à client : WhatsApp, Telegram, Site Web. Tout automatisé.",
    ctaContact: "Contact",
    ctaPricing: "Tarifs",
    pricingTitle: "Tarifs",
    plans: [
      {
        name: "Basique",
        price: "29€/mois",
        features: ["1 canal (ex. WhatsApp)", "1 scénario (FAQ/rendez-vous)", "jusqu’à 500 dialogues"],
        cta: "Choisir",
        link: "mailto:hello@botmatic.be?subject=BotMatic%20Basique%20Plan",
      },
      {
        name: "Standard",
        price: "99€/mois",
        features: ["2 canaux", "Scénarios multiples", "jusqu’à 2 000 dialogues", "Intégration CRM"],
        cta: "Le plus choisi",
        link: "mailto:hello@botmatic.be?subject=BotMatic%20Standard%20Plan",
        popular: true,
      },
      {
        name: "Premium",
        price: "299€/mois",
        features: ["Tous canaux + intégrations", "Offres IA & paiements", "Dialogues illimités", "Support dédié"],
        cta: "Demander une démo",
        link: "mailto:hello@botmatic.be?subject=BotMatic%20Premium%20Plan",
      },
    ],
    contactTitle: "Contact",
    contactDesc: "Présentez brièvement votre entreprise et vos objectifs; nous proposons un scénario et un prix.",
    email: "hello@botmatic.be",
    gamble: "18+ Jouer comporte des risques. Jouez avec modération. Plus d’infos — www.stopoptijd.be",
    faqTitle: "Questions fréquentes",
    faq: [
      { q: "En combien de temps puis-je avoir mon chatbot ?", a: "Généralement en 2 à 5 jours ouvrés, selon la complexité." },
      { q: "Puis-je changer de plan plus tard ?", a: "Oui, vous pouvez monter/descendre d’offre à tout moment." },
    ],
  },

  en: {
    heroTitle: "BotMatic • Smart chatbots",
    heroSub: "From lead to customer: WhatsApp, Telegram, Website. Fully automated.",
    ctaContact: "Contact",
    ctaPricing: "Pricing",
    pricingTitle: "Pricing",
    plans: [
      {
        name: "Basic",
        price: "€29/mo",
        features: ["1 channel (e.g. WhatsApp)", "1 scenario (FAQ/booking)", "up to 500 dialogs"],
        cta: "Choose",
        link: "mailto:hello@botmatic.be?subject=BotMatic%20Basic%20Plan",
      },
      {
        name: "Standard",
        price: "€99/mo",
        features: ["2 channels", "Multiple scenarios", "up to 2,000 dialogs", "CRM integration"],
        cta: "Most popular",
        link: "mailto:hello@botmatic.be?subject=BotMatic%20Standard%20Plan",
        popular: true,
      },
      {
        name: "Premium",
        price: "€299/mo",
        features: ["All channels + integrations", "AI offers & payments", "Unlimited dialogs", "Dedicated support"],
        cta: "Request demo",
        link: "mailto:hello@botmatic.be?subject=BotMatic%20Premium%20Plan",
      },
    ],
    contactTitle: "Contact",
    contactDesc: "Tell us briefly about your business and goals; we’ll suggest a scenario and price.",
    email: "hello@botmatic.be",
    gamble: "21+ Gambling can be addictive. Play responsibly! More info — www.stopoptijd.be",
    faqTitle: "Frequently asked questions",
    faq: [
      { q: "How fast can the chatbot be implemented?", a: "Usually within 2–5 business days, depending on complexity." },
      { q: "Can I upgrade or downgrade later?", a: "Yes, you can switch plans at any time." },
    ],
  },
};

// Хелпер
export function getT(lang: Lang): LocaleDict {
  return t[lang] ?? t["en"];
}