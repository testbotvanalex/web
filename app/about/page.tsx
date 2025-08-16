import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">{t('about')}</h1>
      <p>{t('about_text')}</p>
    </div>
  );
}