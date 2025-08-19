// lib/i18n.ts
export type Lang = "nl" | "fr" | "en";
export const languages: Lang[] = ["nl", "fr", "en"];

export type Plan = {
  name: string;
  priceMonthly: number; // € / месяц
  features: string[];
  cta: string;
  link: string;         // mailto или ссылка на форму/wa
  popular?: boolean;
};

export type FAQ = { q: string; a: string };

export type LocaleDict = {
  heroTitle: string;
  heroSub: string;
  ctaContact: string;
  ctaPricing: string;

  pricingTitle: string;
  toggleMonthly: string;
  toggleYearly: string;
  saveText: string;

  plans: Plan[];

  compareTitle: string;
  compareRows: { feature: string; basis: boolean; standard: boolean; premium: boolean }[];

  faqTitle: string;
  faq: FAQ[];

  contactTitle: string;
  contactDesc: string;
  email: string;
  gamble?: string;

  stickyDemo: string;
  stickyWhatsApp: string;
};

const tBase = {
  email: "hello@botmatic.be",
};

const nl: LocaleDict = {
  heroTitle: "BotMatic — Slimme chatbots voor groei",
  heroSub:
    "Krijg meer leads, plan afspraken en beantwoord vragen automatisch via WhatsApp, website en Telegram.",
  ctaContact: "Contact",
  ctaPricing: "Tarieven",

  pricingTitle: "Tarieven",
  toggleMonthly: "Maandelijks",
  toggleYearly: "Jaarlijks",
  saveText: "2 maanden gratis",

  plans: [
    {
      name: "Basis",
      priceMonthly: 29,
      features: [
        "1 kanaal (bv. WhatsApp)",
        "1 scenario (FAQ/afspraak)",
        "tot 500 dialogen",
      ],
      cta: "Start",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Basis%20Plan",
    },
    {
      name: "Standaard",
      priceMonthly: 99,
      features: [
        "2 kanalen",
        "Meerdere scenario’s",
        "tot 2.000 dialogen",
        "CRM integratie",
      ],
      cta: "Meest gekozen",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Standaard%20Plan",
      popular: true,
    },
    {
      name: "Premium",
      priceMonthly: 299,
      features: [
        "Alle kanalen + integraties",
        "AI-aanbiedingen & betalingen",
        "Onbeperkt dialogen",
        "Toegewijde support",
      ],
      cta: "Demo aanvragen",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Premium%20Plan",
    },
  ],

  compareTitle: "Vergelijk plannen",
  compareRows: [
    { feature: "WhatsApp kanaal", basis: true, standard: true, premium: true },
    { feature: "Website chat", basis: true, standard: true, premium: true },
    { feature: "Telegram", basis: false, standard: true, premium: true },
    { feature: "Meerdere scenario’s", basis: false, standard: true, premium: true },
    { feature: "CRM integratie", basis: false, standard: true, premium: true },
    { feature: "Betalingen", basis: false, standard: false, premium: true },
    { feature: "Toegewijde support", basis: false, standard: false, premium: true },
  ],

  faqTitle: "Veelgestelde vragen",
  faq: [
    {
      q: "Hoe snel kan de chatbot worden geïmplementeerd?",
      a: "Meestal binnen 2–5 werkdagen, afhankelijk van de complexiteit.",
    },
    {
      q: "Kan ik later upgraden of downgraden?",
      a: "Ja, u kunt op elk moment van pakket wisselen.",
    },
  ],

  contactTitle: "Contact",
  contactDesc:
    "Vertel kort over je bedrijf en doel; ik stel het scenario en prijs voor.",
  email: tBase.email,
  gamble: "21+ Gokken kan verslavend zijn. Stop op tijd! Meer info — www.stopoptijd.be",

  stickyDemo: "Demo",
  stickyWhatsApp: "WhatsApp",
};

const fr: LocaleDict = {
  heroTitle: "BotMatic — Chatbots intelligents pour la croissance",
  heroSub:
    "Plus de leads, prise de rendez-vous et réponses automatisées via WhatsApp, site web et Telegram.",
  ctaContact: "Contact",
  ctaPricing: "Tarifs",

  pricingTitle: "Tarifs",
  toggleMonthly: "Mensuel",
  toggleYearly: "Annuel",
  saveText: "2 mois offerts",

  plans: [
    {
      name: "Essentiel",
      priceMonthly: 29,
      features: [
        "1 canal (ex. WhatsApp)",
        "1 scénario (FAQ/rendez-vous)",
        "jusqu’à 500 dialogues",
      ],
      cta: "Commencer",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Essentiel",
    },
    {
      name: "Standard",
      priceMonthly: 99,
      features: [
        "2 canaux",
        "Scénarios multiples",
        "jusqu’à 2 000 dialogues",
        "Intégration CRM",
      ],
      cta: "Le plus choisi",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Standard",
      popular: true,
    },
    {
      name: "Premium",
      priceMonthly: 299,
      features: [
        "Tous canaux + intégrations",
        "Offres IA & paiements",
        "Dialogues illimités",
        "Support dédié",
      ],
      cta: "Demander une démo",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Premium",
    },
  ],

  compareTitle: "Comparer les offres",
  compareRows: [
    { feature: "WhatsApp", basis: true, standard: true, premium: true },
    { feature: "Chat de site", basis: true, standard: true, premium: true },
    { feature: "Telegram", basis: false, standard: true, premium: true },
    { feature: "Scénarios multiples", basis: false, standard: true, premium: true },
    { feature: "Intégration CRM", basis: false, standard: true, premium: true },
    { feature: "Paiements", basis: false, standard: false, premium: true },
    { feature: "Support dédié", basis: false, standard: false, premium: true },
  ],

  faqTitle: "Questions fréquentes",
  faq: [
    {
      q: "Quel est le délai de mise en place ?",
      a: "Généralement 2 à 5 jours ouvrés selon la complexité.",
    },
    {
      q: "Puis-je changer d’offre plus tard ?",
      a: "Oui, à tout moment (upgrade/downgrade).",
    },
  ],

  contactTitle: "Contact",
  contactDesc:
    "Parlez-moi de votre objectif ; je propose un scénario et un prix.",
  email: tBase.email,

  stickyDemo: "Démo",
  stickyWhatsApp: "WhatsApp",
};

const en: LocaleDict = {
  heroTitle: "BotMatic — Smart chatbots that grow your business",
  heroSub:
    "Capture more leads, book meetings, and auto-answer via WhatsApp, Website, and Telegram.",
  ctaContact: "Contact",
  ctaPricing: "Pricing",

  pricingTitle: "Pricing",
  toggleMonthly: "Monthly",
  toggleYearly: "Yearly",
  saveText: "2 months free",

  plans: [
    {
      name: "Basic",
      priceMonthly: 29,
      features: ["1 channel (e.g. WhatsApp)", "1 flow (FAQ/booking)", "up to 500 dialogs"],
      cta: "Start",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Basic",
    },
    {
      name: "Standard",
      priceMonthly: 99,
      features: [
        "2 channels",
        "Multiple flows",
        "up to 2,000 dialogs",
        "CRM integration",
      ],
      cta: "Most popular",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Standard",
      popular: true,
    },
    {
      name: "Premium",
      priceMonthly: 299,
      features: [
        "All channels + integrations",
        "AI offers & payments",
        "Unlimited dialogs",
        "Dedicated support",
      ],
      cta: "Request demo",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Premium",
    },
  ],

  compareTitle: "Compare plans",
  compareRows: [
    { feature: "WhatsApp channel", basis: true, standard: true, premium: true },
    { feature: "Website chat", basis: true, standard: true, premium: true },
    { feature: "Telegram", basis: false, standard: true, premium: true },
    { feature: "Multiple flows", basis: false, standard: true, premium: true },
    { feature: "CRM integration", basis: false, standard: true, premium: true },
    { feature: "Payments", basis: false, standard: false, premium: true },
    { feature: "Dedicated support", basis: false, standard: false, premium: true },
  ],

  faqTitle: "FAQ",
  faq: [
    {
      q: "How fast can we go live?",
      a: "Usually within 2–5 business days depending on scope.",
    },
    {
      q: "Can I upgrade or downgrade later?",
      a: "Yes — switch anytime.",
    },
  ],

  contactTitle: "Contact",
  contactDesc:
    "Tell me your goal; I’ll propose a scenario and pricing that fits.",
  email: tBase.email,

  stickyDemo: "Demo",
  stickyWhatsApp: "WhatsApp",
};

export const t: Record<Lang, LocaleDict> = { nl, fr, en };

export function getT(lang: Lang): LocaleDict {
  return t[lang] ?? t.en;
}