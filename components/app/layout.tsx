import './styles.css';
import '../i18n';
import Header from '../components/Header';

export const metadata = {
  title: 'Botmatic',
  description: 'Automation and chatbots for business growth',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-800">
        <Header />
        <main className="max-w-5xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}