import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // <-- ОБЯЗАТЕЛЬНО ДОЛЖЕН БЫТЬ ЭТОТ ИМПОРТ!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)