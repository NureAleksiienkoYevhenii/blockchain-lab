import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-blue-500 mb-6">CryptoWork</h1>
      <p className="text-xl text-gray-300 max-w-2xl mb-10">
        Перша фріланс-біржа, де гарантом виступає Блокчейн. 
        Жодних суперечок про оплату. Смарт-контракт захищає обидві сторони.
      </p>
      <div className="flex gap-6">
        <Link to="/login" className="px-8 py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-700 transition">
          Увійти
        </Link>
        <Link to="/register" className="px-8 py-3 border border-blue-600 rounded-lg font-bold hover:bg-blue-900/30 transition">
          Реєстрація
        </Link>
      </div>
    </div>
  );
}