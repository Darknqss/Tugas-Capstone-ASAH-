// API Configuration
// Menggunakan environment variable dari .env
// Pastikan di .env ada: BASE_URL=https://capsdc-09.vercel.app/
// File vite.config.js akan expose BASE_URL sebagai VITE_BASE_URL
// API_BASE_URL akan otomatis menambahkan /api di akhir
const baseUrl = import.meta.env.VITE_BASE_URL || 'https://capsdc-09.vercel.app/';
// Pastikan baseUrl tidak berakhir dengan /api, lalu tambahkan /api
const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
export const API_BASE_URL = `${cleanBaseUrl}/api`;
