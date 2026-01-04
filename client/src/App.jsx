import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ProjectsFeed from './pages/ProjectsFeed';
// Ці дві сторінки ми зробимо в наступному кроці, але зарезервуємо місце
import ProjectDetails from './pages/ProjectDetails'; 
import Profile from './pages/Profile';
import CreateProject from './pages/CreateProject';

// Компонент захисту маршрутів
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Завантаження...</div>;
    if (!user) return <Navigate to="/" />;
    return children;
};

// Компонент тільки для гостей
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (!loading && user) return <Navigate to="/dashboard" />;
    return children;
};

export default function App() {
  return (
    <AuthProvider>
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            <Navbar />
            <Routes>
                {/* Публічні */}
                <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><Auth /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Auth isRegister /></PublicRoute>} />
                
                {/* Доступні всім */}
                <Route path="/projects" element={<ProjectsFeed />} />

                {/* Приватні */}
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/create-project" element={<PrivateRoute><CreateProject /></PrivateRoute>} />
                <Route path="/project/:id" element={<ProjectDetails />} /> 
            </Routes>
        </div>
    </AuthProvider>
  );
}