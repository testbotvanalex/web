import '../i18n';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function About() {
  const { t, i18n } = useTranslation();

  return (
    <main style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '2rem' }}>
      <h1>{t('about')}</h1>
      <p>{t('about_text')}</p>

      <div style={{ margin: '1rem 0' }}>
        <button onClick={() => i18n.changeLanguage('en')}>EN</button>{' '}
        <button onClick={() => i18n.changeLanguage('nl')}>NL</button>{' '}
        <button onClick={() => i18n.changeLanguage('fr')}>FR</button>
      </div>

      <nav style={{ marginTop: '2rem' }}>
        <Link href="/">{t('home')}</Link>
      </nav>
    </main>
  );
}