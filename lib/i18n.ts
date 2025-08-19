// lib/i18n.ts
export type Lang = "nl" | "fr" | "en";

export type PlanBreakdown = {
  channels: string;
  scenarios: string;
  dialogs: string;
  ai: string;
  integrations: string;
  support: string;
  setup: string;
};

export type Plan = {
  name: string;
  price: string;
  features: string[];        // краткий список (по-прежнему)
  breakdown: PlanBreakdown;  // детальный разбор
  cta: string;
  link: string;              // mailto или ссылка
  popular?: boolean;
  note?: string;             // примечание мелким шрифтом
};

export type FAQ = { q: string; a: string };

export type LocaleDict = {
  heroTitle: string;
  heroSub: string;
  ctaContact: string;
  ctaPricing: string;
  pricingTitle: string;
  detailsTitle: string;          // “Что входит”
  detailsLabels: {
    channels: string;
    scenarios: string;
    dialogs: string;
    ai: string;
    integrations: string;
    support: string;
    setup: string;
  };
  actions: {
    choose: string;
    whatsapp: string;
    email: string;
    collapse: string;
    expand: string;
  };
  plans: Plan[];
  contactTitle: string;
  contactDesc: string;
  email: string;
  gamble: string;
  faqTitle: string;
  faq: FAQ[];
};

const nl: LocaleDict = {
  heroTitle: "BotMatic • Slimme chatbots",
  heroSub:
    "Van lead tot klant: WhatsApp, Telegram, Website. Conversies omhoog — werk omlaag.",
  ctaContact: "Contact",
  ctaPricing: "Tarieven",
  pricingTitle: "Tarieven",
  detailsTitle: "Wat zit erin",
  detailsLabels: {
    channels: "Kanalen",
    scenarios: "Scenario’s",
    dialogs: "Dialogen",
    ai: "AI-functies",
    integrations: "Integraties",
    support: "Support",
    setup: "Implementatie",
  },
  actions: {
    choose: "Kiezen",
    whatsapp: "WhatsApp",
    email: "E-mail",
    collapse: "Minder details",
    expand: "Meer details",
  },
  plans: [
    {
      name: "Basis",
      price: "€29/maand",
      features: [
        "1 kanaal (bv. WhatsApp)",
        "1 scenario (FAQ/afspraak)",
        "tot 500 dialogen",
      ],
      breakdown: {
        channels: "1 (WhatsApp of Website)",
        scenarios: "1 basisstroom (FAQ of afspraak)",
        dialogs: "Tot 500 / maand",
        ai: "Snippets, basis intent-herkenning",
        integrations: "Webhook + e-mail notificaties",
        support: "E-mail binnen 1–2 werkdagen",
        setup: "Snelstart template inbegrepen",
      },
      cta: "Kiezen",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Basis%20Plan",
      note: "Perfect om te testen of als MVP.",
    },
    {
      name: "Standaard",
      price: "€99/maand",
      features: [
        "2 kanalen",
        "Meerdere scenario’s",
        "tot 2.000 dialogen",
        "CRM integratie",
      ],
      breakdown: {
        channels: "2 (WhatsApp + Website/Telegram)",
        scenarios: "Meerdere stromen (FAQ, afspraken, leads)",
        dialogs: "Tot 2.000 / maand",
        ai: "LLM-answers, entiteiten, formulieren",
        integrations: "CRM (HubSpot/Pipedrive) + Google Sheets",
        support: "Priority e-mail + 1 call/maand",
        setup: "Inrichting + training van uw team",
      },
      cta: "Meest gekozen",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Standaard%20Plan",
      popular: true,
      note: "Beste prijs/kwaliteit voor KMO’s.",
    },
    {
      name: "Premium",
      price: "€299/maand",
      features: [
        "Alle kanalen + integraties",
        "AI-offers & betalingen",
        "Onbeperkt dialogen*",
        "Toegewijde support",
      ],
      breakdown: {
        channels: "Alle (WhatsApp, Telegram, Web, Instagram*)",
        scenarios: "Onbeperkt, inclusief complexe flows",
        dialogs: "Fair-use onbeperkt*",
        ai: "Fine-tuned modellen, RAG, geavanceerde formulieren",
        integrations: "Volledige API, webhooks, ERP/CRM integraties",
        support: "Dedicated Slack/WhatsApp + SLA",
        setup: "Volledige implementatie + A/B testing",
      },
      cta: "Demo aanvragen",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Premium%20Plan",
      note: "*Fair-use beleid van toepassing.",
    },
  ],
  contactTitle: "Contact",
  contactDesc:
    "Vertel kort over je bedrijf en doel; we stellen een scenario en prijs voor.",
  email: "hello@botmatic.be",
  gamble:
    "21+ Gokken kan verslavend zijn. Stop op tijd! Meer info — www.stopoptijd.be",
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
};

const fr: LocaleDict = {
  heroTitle: "BotMatic • Chatbots intelligents",
  heroSub:
    "De lead à client : WhatsApp, Telegram, Site web. Plus de conversions, moins de travail.",
  ctaContact: "Contact",
  ctaPricing: "Tarifs",
  pricingTitle: "Tarifs",
  detailsTitle: "Ce qui est inclus",
  detailsLabels: {
    channels: "Canaux",
    scenarios: "Scénarios",
    dialogs: "Dialogues",
    ai: "Fonctions IA",
    integrations: "Intégrations",
    support: "Support",
    setup: "Mise en place",
  },
  actions: {
    choose: "Choisir",
    whatsapp: "WhatsApp",
    email: "E-mail",
    collapse: "Moins de détails",
    expand: "Plus de détails",
  },
  plans: [
    {
      name: "Essentiel",
      price: "29 €/mois",
      features: ["1 canal", "1 scénario (FAQ/RDV)", "jusqu’à 500 dialogues"],
      breakdown: {
        channels: "1 (WhatsApp ou Site)",
        scenarios: "1 flux (FAQ ou prise de RDV)",
        dialogs: "Jusqu’à 500 / mois",
        ai: "Snippets, intents basiques",
        integrations: "Webhook + alertes e-mail",
        support: "E-mail sous 1–2 jours ouvrés",
        setup: "Démarrage rapide inclus",
      },
      cta: "Choisir",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Essentiel",
      note: "Idéal pour démarrer rapidement.",
    },
    {
      name: "Standard",
      price: "99 €/mois",
      features: [
        "2 canaux",
        "Scénarios multiples",
        "jusqu’à 2 000 dialogues",
        "Intégration CRM",
      ],
      breakdown: {
        channels: "2 (WhatsApp + Site/Telegram)",
        scenarios: "Multiples (FAQ, RDV, lead gen)",
        dialogs: "Jusqu’à 2 000 / mois",
        ai: "Réponses LLM, entités, formulaires",
        integrations: "CRM (HubSpot/Pipedrive) + Google Sheets",
        support: "E-mail prioritaire + 1 call/mois",
        setup: "Mise en place + formation",
      },
      cta: "Le plus choisi",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Standard",
      popular: true,
      note: "Le meilleur rapport qualité/prix.",
    },
    {
      name: "Premium",
      price: "299 €/mois",
      features: [
        "Tous canaux + intégrations",
        "Offres IA & paiements",
        "Dialogues illimités*",
        "Support dédié",
      ],
      breakdown: {
        channels: "Tous (WhatsApp, Telegram, Web, Instagram*)",
        scenarios: "Illimités, y compris complexes",
        dialogs: "Illimités* (fair-use)",
        ai: "Modèles personnalisés, RAG, formulaires avancés",
        integrations: "API complète, webhooks, ERP/CRM",
        support: "Slack/WhatsApp dédié + SLA",
        setup: "Implémentation complète + A/B tests",
      },
      cta: "Demander une démo",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Premium",
      note: "*Politique fair-use.",
    },
  ],
  contactTitle: "Contact",
  contactDesc:
    "Parlez brièvement de votre activité et de vos objectifs ; on propose un scénario et un prix.",
  email: "hello@botmatic.be",
  gamble:
    "Les jeux d’argent peuvent être addictifs. Jouez avec modération — www.stopoptijd.be",
  faqTitle: "FAQ",
  faq: [
    {
      q: "Délais d’implémentation ?",
      a: "Généralement 2–5 jours ouvrés selon la complexité.",
    },
    { q: "Upgrade/downgrade possible ?", a: "Oui, à tout moment." },
  ],
};

const en: LocaleDict = {
  heroTitle: "BotMatic • Smart chatbots",
  heroSub:
    "From lead to customer: WhatsApp, Telegram, Website. Higher conversions, less work.",
  ctaContact: "Contact",
  ctaPricing: "Pricing",
  pricingTitle: "Pricing",
  detailsTitle: "What’s included",
  detailsLabels: {
    channels: "Channels",
    scenarios: "Scenarios",
    dialogs: "Dialogs",
    ai: "AI features",
    integrations: "Integrations",
    support: "Support",
    setup: "Setup",
  },
  actions: {
    choose: "Choose",
    whatsapp: "WhatsApp",
    email: "Email",
    collapse: "Hide details",
    expand: "See details",
  },
  plans: [
    {
      name: "Basic",
      price: "€29/mo",
      features: ["1 channel", "1 scenario (FAQ/booking)", "up to 500 dialogs"],
      breakdown: {
        channels: "1 (WhatsApp or Website)",
        scenarios: "1 flow (FAQ or booking)",
        dialogs: "Up to 500 / month",
        ai: "Snippets, basic intents",
        integrations: "Webhook + email notifications",
        support: "Email in 1–2 business days",
        setup: "Quick-start template",
      },
      cta: "Choose",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Basic",
      note: "Great for MVPs and pilots.",
    },
    {
      name: "Standard",
      price: "€99/mo",
      features: [
        "2 channels",
        "Multiple scenarios",
        "up to 2,000 dialogs",
        "CRM integration",
      ],
      breakdown: {
        channels: "2 (WhatsApp + Website/Telegram)",
        scenarios: "Multiple (FAQ, bookings, leads)",
        dialogs: "Up to 2,000 / month",
        ai: "LLM answers, entities, forms",
        integrations: "CRM (HubSpot/Pipedrive) + Google Sheets",
        support: "Priority email + 1 call/mo",
        setup: "Setup + team training",
      },
      cta: "Most popular",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Standard",
      popular: true,
      note: "Best value for SMEs.",
    },
    {
      name: "Premium",
      price: "€299/mo",
      features: [
        "All channels + integrations",
        "AI offers & payments",
        "Unlimited dialogs*",
        "Dedicated support",
      ],
      breakdown: {
        channels: "All (WhatsApp, Telegram, Web, Instagram*)",
        scenarios: "Unlimited, incl. complex flows",
        dialogs: "Unlimited* (fair-use)",
        ai: "Fine-tuned models, RAG, advanced forms",
        integrations: "Full API, webhooks, ERP/CRM",
        support: "Dedicated Slack/WhatsApp + SLA",
        setup: "Full implementation + A/B tests",
      },
      cta: "Request demo",
      link: "mailto:hello@botmatic.be?subject=BotMatic%20Premium",
      note: "*Fair-use policy applies.",
    },
  ],
  contactTitle: "Contact",
  contactDesc:
    "Tell us about your business and goal; we’ll propose a flow and price.",
  email: "hello@botmatic.be",
  gamble: "Gambling can be addictive. 21+. www.stopoptijd.be",
  faqTitle: "FAQ",
  faq: [
    {
      q: "How fast can we go live?",
      a: "Usually within 2–5 business days, depending on complexity.",
    },
    { q: "Can I upgrade/downgrade later?", a: "Yes, anytime." },
  ],
};

export const t: Record<Lang, LocaleDict> = { nl, fr, en };

export function getT(lang: Lang): LocaleDict {
  return t[lang] || t.en;
}