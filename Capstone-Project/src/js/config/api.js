// API Configuration
// Menggunakan environment variable dari .env
// Pastikan di .env ada: BASE_URL=https://backendsw.vercel.app/api
// File vite.config.js akan expose BASE_URL sebagai VITE_BASE_URL
export const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'https://backendsw.vercel.app/api';
