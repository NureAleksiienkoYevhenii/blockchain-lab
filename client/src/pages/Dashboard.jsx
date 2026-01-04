import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        api.get('/my-projects').then(res => setProjects(res.data));
    }, []);

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Привіт, {user.username}! 👋</h1>
            <p className="text-gray-500 mb-8">Роль: <span className="uppercase font-bold text-blue-600">{user.role}</span></p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Статистика (фейкова для прикладу) */}
                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm">Активні проекти</h3>
                    <p className="text-3xl font-bold">{projects.filter(p => p.status === 'in_progress').length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm">Завершено</h3>
                    <p className="text-3xl font-bold">{projects.filter(p => p.status === 'completed').length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
                    <h3 className="text-gray-500 text-sm">Всього зароблено/витрачено</h3>
                    <p className="text-3xl font-bold">ETH {projects.reduce((acc, p) => acc + (p.status === 'completed' ? p.budget : 0), 0).toFixed(2)}</p>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Мої Проекти</h2>
            {projects.length === 0 ? <p>У вас поки немає проектів.</p> : (
                <div className="grid gap-4">
                    {projects.map(p => (
                        <div key={p._id} className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{p.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded ${p.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {p.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold">{p.budget} ETH</span>
                                <Link to={`/project/${p._id}`} className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700">
                                    Деталі
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}