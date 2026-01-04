import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Auth({ isRegister = false }) {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '', username: '', role: 'freelancer' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isRegister) {
                await register(formData);
                alert('Реєстрація успішна! Увійдіть.');
                navigate('/login');
            } else {
                await login(formData.email, formData.password);
                navigate('/dashboard'); // Перекидає на дешборд після входу
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Помилка');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">{isRegister ? 'Реєстрація' : 'Вхід'}</h2>
                
                {isRegister && (
                    <>
                        <input className="w-full p-2 border rounded mb-3" placeholder="Нікнейм" 
                            onChange={e => setFormData({...formData, username: e.target.value})} required />
                        <select className="w-full p-2 border rounded mb-3" 
                            onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="freelancer">Я Фрілансер</option>
                            <option value="client">Я Клієнт</option>
                        </select>
                    </>
                )}
                
                <input className="w-full p-2 border rounded mb-3" type="email" placeholder="Email" 
                    onChange={e => setFormData({...formData, email: e.target.value})} required />
                <input className="w-full p-2 border rounded mb-6" type="password" placeholder="Пароль" 
                    onChange={e => setFormData({...formData, password: e.target.value})} required />
                
                <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">
                    {isRegister ? 'Зареєструватися' : 'Увійти'}
                </button>
            </form>
        </div>
    );
}