require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Project, Application } = require('./models/Schemas');

// Данные для генерации
const SKILLS = ['React', 'Node.js', 'Solidity', 'Python', 'Design', 'MongoDB', 'DevOps', 'Rust'];
const PROJECT_TITLES = [
    'Разработка DeFi платформы', 'NFT Маркетплейс', 'Лендинг для ICO', 
    'Аудит Смарт-контракта', 'Telegram бот для трейдинга', 'Копия Uniswap', 
    'Крипто-кошелек (Mobile)', 'Дашборд аналитики', 'DAO голосование', 
    'Интеграция IPFS'
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 MongoDB Connected');

        // 1. Очистка базы
        console.log('🧹 Clearing DB...');
        await User.deleteMany({});
        await Project.deleteMany({});
        await Application.deleteMany({});

        // Хешируем пароль один раз для всех
        const hashedPassword = await bcrypt.hash('123456', 10);

        // ================= USERS (26 шт) =================
        console.log('👤 Seeding Users...');
        const users = [];

        // 1 Админ
        users.push({
            email: 'admin@admin.com',
            password: hashedPassword,
            username: 'Super Admin',
            role: 'admin',
            walletAddress: '0xAdminWallet123'
        });

        // 10 Клиентов
        for (let i = 1; i <= 10; i++) {
            users.push({
                email: `client${i}@test.com`,
                password: hashedPassword,
                username: `Client ${i}`,
                role: 'client',
                walletAddress: `0xClientWallet${i}ABC`,
            });
        }

        // 15 Фрилансеров
        for (let i = 1; i <= 15; i++) {
            // Случайные навыки
            const randomSkill = SKILLS[Math.floor(Math.random() * SKILLS.length)];
            const randomSkill2 = SKILLS[Math.floor(Math.random() * SKILLS.length)];
            
            users.push({
                email: `freelancer${i}@test.com`,
                password: hashedPassword,
                username: `Freelancer ${i}`,
                role: 'freelancer',
                walletAddress: `0xFreelancerWallet${i}XYZ`,
                skills: `${randomSkill}, ${randomSkill2}`
            });
        }

        const savedUsers = await User.insertMany(users);
        console.log(`✅ Created ${savedUsers.length} users`);

        // Разделяем обратно для создания связей
        const clients = savedUsers.filter(u => u.role === 'client');
        const freelancers = savedUsers.filter(u => u.role === 'freelancer');

        // ================= PROJECTS (20 шт) =================
        console.log('📁 Seeding Projects...');
        const projects = [];

        // Каждый клиент создает по 2 проекта
        clients.forEach((client, index) => {
            for (let j = 0; j < 2; j++) {
                const title = PROJECT_TITLES[Math.floor(Math.random() * PROJECT_TITLES.length)];
                projects.push({
                    title: `${title} #${index + 1}-${j + 1}`,
                    description: `Нам нужен опытный разработчик для ${title}. Бюджет фиксированный, сроки сжатые.`,
                    budget: (Math.random() * 5).toFixed(2), // 0.00 - 5.00 ETH
                    clientId: client._id,
                    status: 'open'
                });
            }
        });

        const savedProjects = await Project.insertMany(projects);
        console.log(`✅ Created ${savedProjects.length} projects`);

        // ================= APPLICATIONS (30+ шт) =================
        console.log('📝 Seeding Applications...');
        const applications = [];

        // Проходимся по проектам и добавляем заявки
        savedProjects.forEach((project) => {
            // Берем 1-3 случайных фрилансера на каждый проект
            const randomFreelancers = freelancers
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.floor(Math.random() * 3) + 1);

            randomFreelancers.forEach(freelancer => {
                applications.push({
                    projectId: project._id,
                    freelancerId: freelancer._id,
                    coverLetter: `Привет! Я ${freelancer.username}, эксперт в ${freelancer.skills}. Готов выполнить ${project.title}.`,
                    status: 'pending'
                });
            });
        });

        const savedApps = await Application.insertMany(applications);
        console.log(`✅ Created ${savedApps.length} applications`);

        console.log('🎉 Database seeding completed successfully!');
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();