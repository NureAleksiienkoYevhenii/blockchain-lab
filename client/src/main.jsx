import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 1. Імпортуємо Router
import App from './App.jsx'
import './index.css' // Або ваші стилі, якщо файл називається інакше

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* 2. Обгортаємо весь App у BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)