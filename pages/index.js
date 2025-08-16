import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

export default function Home() {
  const { t } = useTranslation('common');

  return (
    <main style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1>{t('heroTitle')}</h1>
      <a 
        href="https://wa.me/ВАШ_НОМЕР" 
        style={{ display: 'inline-block', padding: '10px 20px', background: '#25D366', color: '#fff', textDecoration: 'none', borderRadius: '5px' }}
      >
        {t('ctaButton')}
      </a>
      <nav style={{ marginTop: '1rem' }}>
        <Link href="/" locale="en">EN</Link> |{' '}
        <Link href="/" locale="ru">RU</Link> |{' '}
        <Link href="/" locale="nl">NL</Link>
      </nav>
    </main>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common']))
    }
  };
}