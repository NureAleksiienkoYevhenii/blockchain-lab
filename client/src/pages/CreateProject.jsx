import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function CreateProject() {
    const [form, setForm] = useState({ title: '', description: '', budget: '' });
    const navigate = useNavigate();

    const create = async () => {
        await api.post('/projects', form);
        navigate('/dashboard');
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-6">Створити проект</h1>
            <input className="w-full border p-2 mb-4" placeholder="Назва" onChange={e => setForm({...form, title: e.target.value})} />
            <textarea className="w-full border p-2 mb-4 h-32" placeholder="Опис" onChange={e => setForm({...form, description: e.target.value})} />
            <input className="w-full border p-2 mb-6" type="number" placeholder="Бюджет (ETH)" onChange={e => setForm({...form, budget: e.target.value})} />
            <button onClick={create} className="bg-green-600 text-white px-6 py-2 rounded">Опублікувати</button>
        </div>
    );
}