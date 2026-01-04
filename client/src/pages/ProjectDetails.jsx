import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { getEthereumContract } from '../blockchain';
import { ethers } from 'ethers';
import { Send, MessageSquare } from 'lucide-react'; // Іконки

export default function ProjectDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [project, setProject] = useState(null);
    const [applications, setApplications] = useState([]);
    const [comments, setComments] = useState([]); // Стан для коментарів
    const [newComment, setNewComment] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const getSafeId = (obj) => obj ? (obj._id || obj.id) : null;

    useEffect(() => {
        if (user) {
            loadData();
            loadComments(); // Завантажуємо коментарі
        }
    }, [id, user]); 

    const loadData = async () => {
        try {
            let found;
            try {
                const { data } = await api.get('/projects');
                found = data.find(p => p._id === id);
            } catch (e) {}

            if (!found) {
                const { data } = await api.get('/my-projects');
                found = data.find(p => p._id === id);
            }

            if (found) {
                setProject(found);
                const isOwner = getSafeId(user) === getSafeId(found.clientId);
                if (user?.role === 'client' && isOwner) {
                    const apps = await api.get(`/projects/${id}/applications`);
                    setApplications(apps.data);
                }
            }
        } catch (e) {
            console.error("Error loading project", e);
        }
    };

    const loadComments = async () => {
        try {
            const { data } = await api.get(`/projects/${id}/comments`);
            setComments(data);
        } catch (error) {
            console.error("Не вдалося завантажити коментарі");
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const { data } = await api.post(`/projects/${id}/comments`, { text: newComment });
            setComments([...comments, data]);
            setNewComment('');
        } catch (error) {
            alert("Помилка відправки коментаря");
        }
    };

    // --- БЛОКЧЕЙН ФУНКЦІЇ ---

    const checkWalletMatch = async (expectedAddress) => {
        try {
            const { signer } = await getEthereumContract();
            const currentAddress = await signer.getAddress();
            
            if (currentAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
                alert(`⚠️ УВАГА: У MetaMask обрано гаманець ${currentAddress.slice(0,6)}..., але в проекті ви записані як ${expectedAddress.slice(0,6)}...\n\nЗмініть акаунт у MetaMask!`);
                return false;
            }
            return true;
        } catch (e) {
            alert("Помилка перевірки гаманця. Ви підключили MetaMask?");
            return false;
        }
    };

    const hire = async (freelancerId, freelancerWallet) => {
        if (!freelancerWallet) return alert("У фрилансера немає гаманця!");
        try {
            setIsLoading(true);
            const { contract } = await getEthereumContract();
            const priceInWei = ethers.parseEther(project.budget.toString());

            console.log(`Наймаємо: ${freelancerWallet} за ${project.budget} ETH`);

            const tx = await contract.createProject(freelancerWallet, `Project DB_ID: ${id}`, { value: priceInWei });
            await tx.wait();

            const newContractId = await contract.projectCount();
            const app = applications.find(a => getSafeId(a.freelancerId) === freelancerId);
            
            await api.post(`/applications/${app._id}/accept`, { contractId: Number(newContractId) });
            alert(`Успішно! Гроші в контракті #${newContractId}`);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert("Помилка транзакції: " + (err.reason || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const completeWork = async () => {
        // Перевірка 1: Чи я фрілансер цього проекту?
        if (!await checkWalletMatch(user.walletAddress)) return;

        try {
            setIsLoading(true);
            const { contract } = await getEthereumContract();
            
            console.log(`Здаємо роботу по контракту ID: ${project.contractId}`);
            
            // Виклик
            const tx = await contract.markCompleted(project.contractId);
            console.log("Транзакцію відправлено:", tx.hash);
            
            await tx.wait();
            alert("Роботу здано в Блокчейн! Тепер клієнт має її прийняти.");
            
            // Оновлюємо сторінку
            window.location.reload(); 
        } catch (err) {
            console.error(err);
            // Виводимо причину помилки (наприклад, "Already completed" або "Only freelancer")
            alert("Помилка Блокчейну: " + (err.reason || err.message || "Unknown error"));
        } finally {
            setIsLoading(false);
        }
    };

    const finalizeProject = async () => {
        // Перевірка 1: Чи я замовник?
        if (!await checkWalletMatch(user.walletAddress)) return;

        try {
            setIsLoading(true);
            const { contract } = await getEthereumContract();

            console.log(`Виплачуємо кошти по контракту ID: ${project.contractId}`);

            const tx = await contract.releaseFunds(project.contractId);
            console.log("Транзакцію відправлено:", tx.hash);

            await tx.wait();
            
            // Тут в ідеалі треба оновити статус в БД на 'completed'
            alert("Гроші успішно виплачено фрілансеру!");
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            // Найчастіша помилка: "Work not completed yet"
            alert("Помилка Блокчейну: " + (err.reason || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    // --- РЕНДЕР ---

    if (!project) return <div className="p-10">Завантаження...</div>;

    const currentUserId = getSafeId(user);
    const ownerId = getSafeId(project.clientId);
    const freelancerId = getSafeId(project.freelancerId);
    const isOwner = currentUserId === ownerId;
    const isExecutor = currentUserId === freelancerId;

    // if (project.status !== 'open' && !isOwner && !isExecutor) {
    //     return <div className="p-10 text-center mt-10">⛔ Цей проект вже в роботі.</div>;
    // }

    return (
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded shadow relative mb-20">
            {isLoading && (
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-50 rounded">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                    <p className="text-xl font-bold">Обробка транзакції MetaMask...</p>
                    <p className="text-sm text-gray-500">Підтвердіть дію у вікні гаманця</p>
                </div>
            )}

            {/* ХЕДЕР ПРОЕКТУ */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{project.title}</h1>
                    <p className="text-sm text-gray-400">Smart Contract ID: {project.contractId || 'N/A'}</p>
                </div>
                <div className="text-right">
                     <span className="text-2xl font-bold text-green-600 block">{project.budget} ETH</span>
                     <span className={`text-sm px-2 py-1 rounded ${project.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {project.status.toUpperCase()}
                     </span>
                </div>
            </div>
            
            <p className="text-gray-700 whitespace-pre-wrap mb-8 bg-gray-50 p-4 rounded border">{project.description}</p>

            {/* КНОПКА ВИДАЛЕННЯ */}
            {isOwner && project.status === 'open' && (
                <div className="mb-6 flex justify-end">
                    <button 
                        onClick={async () => {
                            if(window.confirm("Видалити?")) {
                                await api.delete(`/projects/${id}`);
                                navigate('/dashboard');
                            }
                        }} 
                        className="text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-50"
                    >
                        🗑️ Видалити
                    </button>
                </div>
            )}

            {/* БЛОК ПОДАЧІ ЗАЯВКИ */}
            {user?.role === 'freelancer' && project.status === 'open' && (
                <div className="bg-blue-50 p-6 rounded border border-blue-100">
                    <h3 className="font-bold mb-2">Подати заявку</h3>
                    <textarea className="w-full p-2 border rounded mb-2" placeholder="Ваш супровідний лист..." value={coverLetter} onChange={e => setCoverLetter(e.target.value)} />
                    <button onClick={async () => {
                        if (!user.walletAddress) return alert("Вкажіть гаманець у профілі!");
                        await api.post(`/projects/${id}/apply`, { coverLetter });
                        alert('Заявку подано!');
                        setCoverLetter('');
                        loadData();
                    }} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Відправити</button>
                </div>
            )}

            {/* БЛОК ПРИЙНЯТТЯ ЗАЯВОК (КЛІЄНТ) */}
            {isOwner && project.status === 'open' && (
                <div className="mt-8">
                    <h3 className="font-bold text-xl mb-4">Кандидати ({applications.length})</h3>
                    {applications.map(app => (
                        <div key={app._id} className="border p-4 rounded mb-3 flex justify-between items-center bg-white shadow-sm">
                            <div>
                                <p className="font-bold">{app.freelancerId.username}</p>
                                <p className="text-gray-600">"{app.coverLetter}"</p>
                            </div>
                            <button onClick={() => hire(app.freelancerId._id, app.freelancerId.walletAddress)} className="bg-green-600 text-white px-4 py-2 rounded font-bold">Найняти</button>
                        </div>
                    ))}
                </div>
            )}

            {/* --- УПРАВЛІННЯ КОНТРАКТОМ (IN PROGRESS) --- */}
            {project.status === 'in_progress' && (
                <div className="mt-6 border-t pt-6 bg-gray-50 p-6 rounded">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                        ⚡ Дії Смарт-Контракту
                    </h3>
                    
                    {isExecutor && (
                        <div>
                            <p className="mb-4 text-gray-700">Ви виконуєте це замовлення. Коли закінчите, натисніть кнопку нижче, щоб записати факт виконання в Блокчейн.</p>
                            <button onClick={completeWork} className="bg-yellow-600 text-white px-6 py-3 rounded font-bold hover:bg-yellow-700 w-full md:w-auto shadow-lg">
                                🚀 Здати роботу (Mark Completed)
                            </button>
                        </div>
                    )}

                    {isOwner && (
                        <div>
                            <p className="mb-4 text-gray-700">Фрілансер працює. Якщо він здав роботу (статус в блокчейні оновиться), ви можете виплатити кошти.</p>
                            <button onClick={finalizeProject} className="bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-700 w-full md:w-auto shadow-lg">
                                💰 Прийняти роботу та виплатити (Release Funds)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- ЧАТ (КОМЕНТАРІ) --- */}
            <div className="mt-12">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Обговорення
                </h3>
                
                <div className="bg-gray-100 p-4 rounded-lg h-64 overflow-y-auto mb-4 space-y-3">
                    {comments.length === 0 && <p className="text-gray-400 text-center mt-10">Поки немає повідомлень. Почніть чат!</p>}
                    {comments.map(c => (
                        <div key={c._id} className={`flex flex-col ${getSafeId(c.authorId) === currentUserId ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg ${getSafeId(c.authorId) === currentUserId ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow'}`}>
                                <p className="text-xs opacity-75 mb-1">{c.authorId.username} ({c.authorId.role})</p>
                                <p>{c.text}</p>
                            </div>
                            <span className="text-xs text-gray-400 mt-1">{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                    ))}
                </div>

                <form onSubmit={handlePostComment} className="flex gap-2">
                    <input 
                        className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Написати повідомлення..." 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition">
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>

        </div>
    );
}