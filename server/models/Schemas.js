const mongoose = require('mongoose');

// --- 1. Таблиця Користувачів ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Хешований пароль
  username: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['client', 'freelancer', 'admin'], 
    default: 'freelancer' 
  },
  walletAddress: { type: String, default: '' }, // Для виплат через блокчейн
  skills: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// --- 2. Таблиця Проектів ---
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true }, // В ETH
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Хто виконує
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'completed', 'paid'], 
    default: 'open' 
  },
  contractId: { type: Number, default: null }, // ID в смарт-контракті
  createdAt: { type: Date, default: Date.now }
});

// --- 3. Таблиця Заявок (Applications) ---
const applicationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String }, // Супровідний лист
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// --- 4. Таблиця Коментарів (НОВЕ) ---
const commentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);
const Application = mongoose.model('Application', applicationSchema);
const Comment = mongoose.model('Comment', commentSchema);

module.exports = { User, Project, Application, Comment };