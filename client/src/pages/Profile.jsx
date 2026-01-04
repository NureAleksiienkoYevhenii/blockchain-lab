import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import api from '../api';
import { ethers } from 'ethers'; // Імпорт

export default function Profile() {
    const { user } = useAuth();
    const [editMode, setEditMode] = useState(false);
    const [data, setData] = useState({ 
        username: user?.username, 
        walletAddress: user?.walletAddress || '', 
        skills: user?.skills || '' 
    });

    // --- НОВА ФУНКЦІЯ ---
    const connectWallet = async () => {
        if (!window.ethereum) return alert('Встановіть MetaMask!');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setData({ ...data, walletAddress: address });
        } catch (err) {
            console.error(err);
            alert('Не вдалося підключити гаманець');
        }
    };
    // --------------------

    const save = async () => {
        try {
            await api.put('/profile', data);
            setEditMode(false);
            alert('Профіль оновлено!');
        } catch (e) {
            alert('Помилка збереження');
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded shadow">
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Мій Профіль</h1>
                <button onClick={() => editMode ? save() : setEditMode(true)} className="text-blue-600 font-bold">
                    {editMode ? 'Зберегти' : 'Редагувати'}
                </button>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-gray-500 text-sm">Email</label>
                    <input disabled value={user?.email} className="w-full p-2 bg-gray-100 rounded" />
                </div>
                <div>
                    <label className="block text-gray-500 text-sm">Ім'я</label>
                    <input disabled={!editMode} value={data.username} onChange={e => setData({...data, username: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                
                {/* --- ОНОВЛЕНИЙ ІНПУТ --- */}
                <div>
                    <label className="block text-gray-500 text-sm">Гаманець (MetaMask)</label>
                    <div className="flex gap-2">
                        <input 
                            disabled={!editMode} 
                            value={data.walletAddress} 
                            onChange={e => setData({...data, walletAddress: e.target.value})} 
                            className="w-full p-2 border rounded" 
                            placeholder="0x..."
                        />
                        {editMode && (
                            <button onClick={connectWallet} className="bg-orange-500 text-white px-3 rounded whitespace-nowrap hover:bg-orange-600">
                                Connect 🦊
                            </button>
                        )}
                    </div>
                </div>
                {/* ----------------------- */}

                {user?.role === 'freelancer' && (
                    <div>
                        <label className="block text-gray-500 text-sm">Навички</label>
                        <input disabled={!editMode} value={data.skills} onChange={e => setData({...data, skills: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                )}
            </div>
        </div>
    );
}