import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <nav className="bg-white border-b p-4 flex justify-between items-center">
            <Link to={user ? "/dashboard" : "/"} className="text-xl font-bold text-blue-600">
                CryptoWork
            </Link>
            
            <div className="flex gap-6 items-center">
                <Link to="/projects" className="text-gray-600 hover:text-black">Проекти</Link>
                
                {user ? (
                    <>
                        <Link to="/dashboard" className="text-gray-600 hover:text-black">Дешборд</Link>
                        <Link to="/profile" className="text-gray-600 hover:text-black">Профіль</Link>
                        <button onClick={() => { logout(); navigate('/'); }} className="text-red-500">
                            Вийти
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded">
                        Увійти
                    </Link>
                )}
            </div>
        </nav>
    );
}