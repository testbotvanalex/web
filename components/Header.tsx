export default function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur bg-black/30 border-b border-white/10">
      <nav className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
        <a href="/" className="font-extrabold">BotMatic</a>
        <div className="flex items-center gap-5 text-sm text-white/80">
          <a href="#offer" className="hover:text-white">Что внутри</a>
          <a href="#pricing" className="hover:text-white">Тарифы</a>
          <a href="#contact" className="hover:text-white">Контакты</a>
        </div>
      </nav>
    </header>
  );
}