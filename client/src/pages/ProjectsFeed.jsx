import { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProjectsFeed() {
    const [projects, setProjects] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        // Завантажуємо тільки 'open' проекти
        api.get('/projects').then(res => setProjects(res.data));
    }, []);

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Біржа замовлень</h1>
                {user?.role === 'client' && (
                    <Link to="/create-project" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        + Створити проект
                    </Link>
                )}
            </div>

            <div className="space-y-4">
                {projects.map(p => (
                    <div key={p._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-blue-600">{p.title}</h2>
                                <p className="text-sm text-gray-400 mb-2">Замовник: {p.clientId?.username}</p>
                                <p className="text-gray-700 line-clamp-2">{p.description}</p>
                            </div>
                            <div className="text-right min-w-[100px]">
                                <p className="text-xl font-bold text-green-600">{p.budget} ETH</p>
                                <Link to={`/project/${p._id}`} className="mt-2 inline-block text-sm text-blue-500 hover:underline">
                                    Переглянути &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}