import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

// 1. Check if user has a saved theme
// 2. If not, check their OS preference
const savedTheme = localStorage.getItem('theme');
let initialTheme = 'dark'; // Default fallback

if (savedTheme) {
  initialTheme = savedTheme;
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
  initialTheme = 'light';
}

// Apply it to the HTML tag immediately
document.documentElement.setAttribute('data-theme', initialTheme);
localStorage.setItem('theme', initialTheme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" />
  </StrictMode>,
)