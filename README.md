# Sistem Manajemen Proyek Capstone - Daftar Periksa Fitur (Feature Checklist)


## 1. 🔐 Otentikasi & Profil Pengguna
| Fitur | Status | Detail Implementasi |
|-------|--------|---------------------|
| **Login (Masuk)** | ✅ Terimplementasi | `login.js`, `authService.js` |
| **Register (Daftar)** | ✅ Terimplementasi | `register.js`, `authService.js` |
| **Logout (Keluar)** | ✅ Terimplementasi | Sidebar/Navbar action |
| **Lihat Profil** | ✅ Terimplementasi | Sidebar/Panel Profil |
| **Update Profil** | ✅ Terimplementasi | Admin & Student bisa update (via `userService.js` & `adminService.js`). |

## 2. 👥 Manajemen Tim (Sisi Mahasiswa)
| Fitur | Status | Detail Implementasi |
|-------|--------|---------------------|
| **Pendaftaran Tim** | ✅ Terimplementasi | `teamRegistration.js` |
| **Validasi Komposisi** | ✅ Terimplementasi | Validasi aturan (Min/Max Member, Role) sebelum submit. |
| **Lihat Tim Saya** | ✅ Terimplementasi | `teamInfo.js` |
| **Status Tim** | ✅ Terimplementasi | Menampilkan status Pending/Accepted. |

## 3. 🛡️ Manajemen Tim (Sisi Admin)
| Fitur | Status | Detail Implementasi |
|-------|--------|---------------------|
| **List Semua Grup** | ✅ Terimplementasi | `adminTeamInfo.js` |
| **Validasi Grup** | ✅ Terimplementasi | Tombol Terima/Tolak di `adminTeamInfo.js` |
| **Atur Aturan Komposisi** | ✅ Terimplementasi | `adminDashboard.js` (Modal konfigurasi). |
| **Buat Grup Manual** | ✅ Terimplementasi | Admin bisa membuat grup manual. |
| **Tambah Anggota ke Grup** | ✅ Terimplementasi | Fitur "Add Member" di modal detail tim (`adminTeamInfo.js`). |
| **Status Anggota (Active/Inactive)** | ✅ Terimplementasi | Dropdown status pada list anggota (`adminTeamInfo.js`). |
| **Mahasiswa Tanpa Tim** | ✅ Terimplementasi | `adminUnassigned.js` |
| **Acak Tim (Randomize)** | ✅ Terimplementasi | `adminRandomize.js` (Fitur otomatisasi pembentukan tim). |
| **Upload Anggota Bulk** | ✅ Terimplementasi | Fitur upload ID anggota secara massal. |

## 4. 📅 Worksheet / Logbook (Jurnal Harian)
| Fitur | Status | Detail Implementasi |
|-------|--------|---------------------|
| **Submit Log Mingguan** | ✅ Terimplementasi | `worksheet.js` |
| **Lihat Riwayat** | ✅ Terimplementasi | Mahasiswa bisa melihat riwayat. |
| **Admin: List Semua** | ✅ Terimplementasi | `adminWorksheet.js` |
| **Admin: Validasi** | ✅ Terimplementasi | Approve/Reject/Late dengan Feedback. |

## 5. 📦 Pengumpulan Tugas & Dokumen
| Fitur | Status | Detail Implementasi |
|-------|--------|---------------------|
| **Lihat Dokumen Panduan** | ✅ Terimplementasi | `documents.js` |
| **Kumpul Tugas** | ✅ Terimplementasi | `deliverables.js` |
| **Admin: Lihat Submisi** | ✅ Terimplementasi | `adminDocuments.js` |

## 6. 🔄 Umpan Balik 360 (Feedback)
| Fitur | Status | Detail Implementasi |
|-------|--------|---------------------|
| **Kirim Feedback** | ✅ Terimplementasi | `feedback.js` |
| **Admin: Export Data** | ✅ Terimplementasi | `adminFeedback.js` |

## 7. ⏳ Timeline & Lainnya
| Fitur | Status | Detail Implementasi |
|-------|--------|---------------------|
| **Lihat Timeline** | ✅ Terimplementasi | `timeline.js` |
| **Admin: Kelola Timeline**| ✅ Terimplementasi | Buat/Edit/Hapus event timeline. |
