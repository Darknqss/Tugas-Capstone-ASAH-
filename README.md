🚀 Capstone Team Management Dashboard
📌 Deskripsi
Capstone Team Management Dashboard adalah aplikasi web yang dirancang untuk membantu admin dan user dalam mengelola seluruh proses capstone secara terpusat dan efisien. Mulai dari pengelolaan timeline, manajemen tim, pengiriman email otomatis, hingga pembagian tim secara acak (randomize team).

Aplikasi ini dibuat dengan tampilan yang responsif, ringan, dan mudah digunakan, sehingga mempermudah admin dan user dalam memantau dan mengelola aktivitas capstone.

🛠️ Tech Stack
Frontend: Vanilla JS + Vite
Backend: Node.js / Express.js
Database: Supabase Client
Styling: CSS
Email Service: Gmail (SMTP)
📋 Prerequisites
Pastikan sudah terinstall di perangkat Anda:

Node.js (minimal versi 18)
npm atau yarn
Git
🚀 Installation & Setup
Ikuti langkah-langkah berikut untuk menjalankan project secara lokal:

1️⃣ Clone Repository
git clone https://github.com/Darknqss/Tugas-Capstone-ASAH-.git
cd Tugas-Capstone-ASAH-
2️⃣ Install Dependencies
npm install
3️⃣ Konfigurasi Environment (Frontend)
Buat file .env di root project frontend dan isi dengan salah satu konfigurasi berikut.

Opsi 1: Contoh Aman (Disarankan untuk Repository Publik)
VITE_API_BASE_URL=http://localhost:5000
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
Opsi 2: Contoh Konfigurasi Lokal
VITE_API_BASE_URL=http://localhost:5000
EMAIL_SERVICE=gmail
EMAIL_USER=capstonetrack09@gmail.com
EMAIL_PASS=your_app_password
⚠️ Catatan: Gunakan App Password Gmail, bukan password email utama, dan jangan commit file .env ke repository publik.

4️⃣ Menjalankan Aplikasi
npm run dev
Aplikasi akan berjalan di: 👉 http://localhost:5173

✨ Features
🎨 Perbaikan dan peningkatan UI Profile Admin dan user
📝 Post Timeline pada Dashboard Admin
👥 Melihat detail tim beserta jumlah anggota
🔽 Dropdown status tim (Accepted, Pending, Rejected)
📧 Pengiriman email otomatis berdasarkan status tim
📦 Menampilkan grup pengirim deliverables di dashboard admin
🔀 Randomize team dari data unassigned students
⏱️ CRUD Timeline terintegrasi dengan pendaftaran capstone
📱 Dashboard admin responsif menggunakan Flexbox
🧩 Penyempurnaan seluruh fitur Individual Worksheet
🧭 Cara Penggunaan
Admin login ke Dashboard Admin
Admin mengelola timeline capstone (tambah, edit, hapus)
Admin melihat dan mengatur status tim
Sistem secara otomatis mengirim email notifikasi sesuai status tim
Admin dapat melakukan randomize team jika diperlukan
🧪 Backend Environment Variables
Untuk menjalankan backend, diperlukan konfigurasi environment variables berikut. Nilai asli tidak ditampilkan demi keamanan.

SUPABASE_URL= your_supabase_project_ur
SUPABASE_SERVICE_ROLE_KEY= your_service_role_key
PORT=3000
JWT_SECRET= your_jwt_secret
BCRYPT_SALT_ROUNDS=10
EMAIL_SERVICE=gmail
EMAIL_USER= your_email@gmail.com
EMAIL_PASS= your_app_password
EMAIL_FROM="Admin Capstone <email@example.com>"
⚠️ Keamanan: Jangan pernah menyertakan nilai asli .env ke repository publik.

📝 Catatan
Pastikan backend sudah berjalan sebelum menjalankan frontend
Seluruh fitur membutuhkan koneksi backend agar dapat berfungsi dengan normal
👨‍💻 Author
Team Capstone Project

I Made Gede Riyandhi Wiguna Putra — F014D5Y0797
Adinda Chandra Dimitri — F014D5X0047
Putu Aulia Devina Armana — F014D5X1581
I Gusti Komang Damar Ari Suputra — F014D5Y0783
Ida Bagus Agung Wiswa Pramana — F014D5Y0822
⭐ Jika project ini membantu, jangan lupa beri star di repository GitHub!
