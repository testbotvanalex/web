import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">{t('welcome')}</h1>
      <p className="mb-8">{t('description')}</p>
    </div>
  );
}