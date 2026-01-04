require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Project, Application, Comment } = require('./models/Schemas');
const { auth, adminOnly } = require('./middleware/authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

// Підключення до БД
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

// ================= AUTH (Реєстрація та Вхід) =================

// Реєстрація
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, username, role } = req.body;
        
        // Перевірка чи існує
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });

        // Хешування пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ 
            email, 
            password: hashedPassword, 
            username, 
            role: role || 'freelancer' 
        });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Логін
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Створення токена
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user._id, username: user.username, role: user.role, walletAddress: user.walletAddress } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= USER CRUD (Профіль) =================

// Отримати свій профіль
app.get('/api/profile', auth, async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
});

// Оновити профіль (ім'я, гаманець, скіли)
app.put('/api/profile', auth, async (req, res) => {
    try {
        const { username, walletAddress, skills } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id, 
            { username, walletAddress, skills }, 
            { new: true }
        ).select('-password');
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Видалити свій акаунт
app.delete('/api/profile', auth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        // Також можна видалити всі проекти користувача, але поки залишимо
        res.json({ message: 'Account deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= PROJECT CRUD (Проекти) =================

// Створити проект (Тільки клієнт)
app.post('/api/projects', auth, async (req, res) => {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Only clients can create projects' });
    
    try {
        const { title, description, budget } = req.body;
        const newProject = new Project({
            title, description, budget, clientId: req.user.id
        });
        await newProject.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Отримати всі проекти (Для стрічки новин)
app.get('/api/projects', async (req, res) => {
    try {
        // Повертаємо тільки відкриті проекти, сортуємо за новизною
        const projects = await Project.find({ status: 'open' }).sort({ createdAt: -1 }).populate('clientId', 'username');
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Отримати мої проекти (Для клієнта і фрілансера)
app.get('/api/my-projects', auth, async (req, res) => {
    try {
        let projects;
        if (req.user.role === 'client') {
            projects = await Project.find({ clientId: req.user.id });
        } else {
            // Проекти, де фрілансер призначений виконавцем
            projects = await Project.find({ freelancerId: req.user.id });
        }
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Редагувати проект (наприклад, змінити статус або опис)
app.put('/api/projects/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        // Тільки власник може редагувати
        if (project.clientId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedProject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Видалити проект
app.delete('/api/projects/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (project.clientId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
        
        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= APPLICATIONS & LOGIC (Заявки) =================

// Подати заявку (Фрілансер)
app.post('/api/projects/:id/apply', auth, async (req, res) => {
    if (req.user.role !== 'freelancer') return res.status(403).json({ message: 'Only freelancers can apply' });

    try {
        const existingApp = await Application.findOne({ projectId: req.params.id, freelancerId: req.user.id });
        if (existingApp) return res.status(400).json({ message: 'Already applied' });

        const newApp = new Application({
            projectId: req.params.id,
            freelancerId: req.user.id,
            coverLetter: req.body.coverLetter
        });
        await newApp.save();
        res.json({ message: 'Application sent' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Отримати заявки для проекту (Клієнт)
app.get('/api/projects/:id/applications', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (project.clientId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        const apps = await Application.find({ projectId: req.params.id }).populate('freelancerId', 'username skills walletAddress');
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Прийняти заявку (Клієнт наймає фрілансера)
app.post('/api/applications/:appId/accept', auth, async (req, res) => {
    try {
        const app = await Application.findById(req.params.appId);
        const project = await Project.findById(app.projectId);

        if (project.clientId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        // Оновлюємо проект
        project.freelancerId = app.freelancerId;
        project.status = 'in_progress';
        project.contractId = req.body.contractId; // ID зі смарт-контракту, який прийде з фронту
        await project.save();

        // Оновлюємо статус заявки
        app.status = 'accepted';
        await app.save();

        res.json({ message: 'Freelancer hired', project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================= ADMIN CRUD (Адмінка) =================

// Отримати всіх користувачів
app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
});

// Видалити будь-якого користувача
app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted by admin' });
});

// Отримати взагалі всі проекти
app.get('/api/admin/projects', auth, adminOnly, async (req, res) => {
    const projects = await Project.find().populate('clientId', 'username');
    res.json(projects);
});

// Видалити будь-який проект (модерація)
app.delete('/api/admin/projects/:id', auth, adminOnly, async (req, res) => {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted by admin' });
});

// ================= COMMENTS (ЧАТ) =================

// Додати коментар
app.post('/api/projects/:id/comments', auth, async (req, res) => {
    try {
        const newComment = new Comment({
            projectId: req.params.id,
            authorId: req.user.id,
            text: req.body.text
        });
        await newComment.save();
        // Повертаємо коментар з даними автора (щоб одразу показати ім'я)
        const populatedComment = await Comment.findById(newComment._id).populate('authorId', 'username role');
        res.json(populatedComment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Отримати коментарі проекту
app.get('/api/projects/:id/comments', auth, async (req, res) => {
    try {
        // Лог 1: Проверяем, дошел ли запрос
        console.log(`📡 Запрос комментариев для ID: ${req.params.id}`);

        // Лог 2: Проверяем, существует ли модель Comment
        if (!Comment) {
            throw new Error("CRITICAL: Модель Comment не импортирована или undefined!");
        }

        const comments = await Comment.find({ projectId: req.params.id })
            .populate('authorId', 'username role')
            .sort({ createdAt: 1 });
        
        // Лог 3: Сколько нашли
        console.log(`✅ Найдено комментариев: ${comments.length}`);
        
        res.json(comments);
    } catch (err) {
        // !!! ВОТ ЭТО ПОКАЖЕТ ОШИБКУ В ТЕРМИНАЛЕ !!!
        console.error("🔥 ОШИБКА В GET /COMMENTS:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));