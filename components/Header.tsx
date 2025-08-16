'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { t, i18n } = useTranslation();

  return (
    <header className="bg-white shadow p-4 flex flex-col sm:flex-row justify-between items-center">
      <div className="flex items-center gap-3 mb-2 sm:mb-0">
        <img src="/logo.png" alt="Botmatic Logo" className="h-10" />
        <span className="text-xl font-bold">Botmatic</span>
      </div>

      <nav className="flex gap-4 mb-2 sm:mb-0">
        <Link href="/">{t('home')}</Link>
        <Link href="/about">{t('about')}</Link>
      </nav>

      <div className="flex gap-2">
        <button onClick={() => i18n.changeLanguage('en')}>EN</button>
        <button onClick={() => i18n.changeLanguage('nl')}>NL</button>
        <button onClick={() => i18n.changeLanguage('fr')}>FR</button>
      </div>
    </header>
  );
}