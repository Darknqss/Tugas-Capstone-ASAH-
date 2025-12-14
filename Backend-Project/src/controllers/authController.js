const { loginUser, registerUser } = require("../services/authService");

// Helper untuk format error response
const buildErrorResponse = (res, status, message, code, fields = {}) => {
  return res.status(status).json({
    message,
    error: {
      code,
      ...(Object.keys(fields).length > 0 && { fields }),
    },
    meta: { timestamp: new Date().toISOString() },
  });
};

// Login pengguna
async function login(req, res) {
  const { email, password } = req.body || {};

  // 1. Validasi Input Dasar
  if (!email || !password) {
    const errorFields = {};
    if (!email) errorFields.email = "Email wajib diisi.";
    if (!password) errorFields.password = "Password wajib diisi.";
    return buildErrorResponse(res, 400, "Permintaan tidak valid. Beberapa field wajib diisi.", "VALIDATION_FAILED", errorFields);
  }

  try {
    const result = await loginUser(email, password);
    return res.status(200).json({
      message: "Login berhasil.",
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = err.code === "INVALID_CREDENTIALS" ? 401 : 500;
    return buildErrorResponse(res, status, err.message || "Terjadi kesalahan.", err.code || "INTERNAL_SERVER_ERROR");
  }
}

// Registrasi pengguna baru
async function register(req, res) {
  const { email, password, name } = req.body || {};

  // 1. Validasi Input Dasar
  const errorFields = {};
  if (!email) errorFields.email = "Email wajib diisi.";
  if (!password) errorFields.password = "Password wajib diisi.";
  if (!name) errorFields.name = "Nama lengkap wajib diisi.";

  if (Object.keys(errorFields).length > 0) {
    return buildErrorResponse(res, 400, "Data pendaftaran tidak lengkap.", "VALIDATION_FAILED", errorFields);
  }

  // 2. Force Role to 'student'
  // User tidak bisa set role sendiri saat register
  const fixedRole = "student";

  try {
    const result = await registerUser({ email, password, name, role: fixedRole });
    return res.status(201).json({
      message: "Pendaftaran berhasil. Silakan login.",
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    const status = err.code === "EMAIL_ALREADY_EXISTS" ? 409 : 500;
    return buildErrorResponse(res, status, err.message || "Terjadi kesalahan.", err.code || "INTERNAL_SERVER_ERROR");
  }
}

// Logout pengguna
async function logout(req, res) {
    return res.status(200).json({
        message: "Logout berhasil. Token Anda tidak lagi valid dan telah dihapus dari sisi klien.",
        data: {},
        meta: { timestamp: new Date().toISOString() },
    });
}

module.exports = { login, register, logout };


// kode lama
// const { supabase } = require("../config/supabaseClient");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");

// // Login pengguna
// async function login(req, res) {
//   const { email, password } = req.body || {};

//   // --- 1. Validasi Input Dasar (400 Bad Request) ---
//   const errorFields = {};
//   if (!email) errorFields.email = "Email wajib diisi.";
//   if (!password) errorFields.password = "Password wajib diisi.";

//   if (Object.keys(errorFields).length > 0) {
//     return res.status(400).json({
//       message: "Permintaan tidak valid. Beberapa field wajib diisi.",
//       error: {
//         code: "VALIDATION_FAILED",
//         fields: errorFields,
//       },
//       meta: { timestamp: new Date().toISOString() },
//     });
//   }

//   // --- 2. Ambil User ---
//   const { data: user, error } = await supabase
//     .from("users")
//     .select("id, email, password, full_name, role")
//     .eq("email", email)
//     .limit(1)
//     .single();

//   // --- 3. User Tidak Ditemukan atau Error DB (401 Unauthorized) ---
//   if (error || !user) {
//     return res.status(401).json({
//       message: "Kredensial tidak valid.",
//       error: { code: "INVALID_CREDENTIALS" },
//       meta: { timestamp: new Date().toISOString() },
//     });
//   }

//   // --- 4. Cek Password ---
//   const ok = await bcrypt.compare(password, user.password);
//   if (!ok) {
//     return res.status(401).json({
//       message: "Kredensial tidak valid.",
//       error: { code: "INVALID_CREDENTIALS" },
//       meta: { timestamp: new Date().toISOString() },
//     });
//   }

//   // --- 5. Cek JWT Secret (500 Internal Server Error) ---
//   const secret = process.env.JWT_SECRET;
//   if (!secret) {
//     return res.status(500).json({
//       message: "Kesalahan konfigurasi server.",
//       error: { code: "JWT_SECRET_MISSING" },
//       meta: { timestamp: new Date().toISOString() },
//     });
//   }

//   // --- 6. Sukses (200 OK) ---
//   const token = jwt.sign(
//     { userId: user.id, role: user.role, full_name: user.full_name },
//     secret,
//     { expiresIn: "8h" }
//   );

//   // Respon Sukses: TOKEN DIPINDAHKAN KE DALAM DATA
//   return res.status(200).json({
//     message: "Login berhasil.",
//     data: {
//       token, // <-- TOKEN ADA DI SINI
//       user: {
//         id: user.id,
//         email: user.email,
//         full_name: user.full_name,
//         role: user.role,
//       },
//     },
//     meta: { timestamp: new Date().toISOString() },
//   });
// }

// // Registrasi pengguna baru
// async function register(req, res) {
//   const { email, password, full_name, role } = req.body || {};

//   // --- 1. Validasi Input Dasar (400 Bad Request) ---
//   const errorFields = {};
//   if (!email) errorFields.email = "Email wajib diisi.";
//   if (!password) errorFields.password = "Password wajib diisi.";
//   if (!full_name) errorFields.full_name = "Nama lengkap wajib diisi.";

//   if (Object.keys(errorFields).length > 0) {
//     return res.status(400).json({
//       message: "Data pendaftaran tidak lengkap.",
//       error: {
//         code: "VALIDATION_FAILED",
//         fields: errorFields,
//       },
//       meta: { timestamp: new Date().toISOString() },
//     });
//   }

//   // --- 2. Validasi Role (400 Bad Request) ---
//   const normalizedRole = (role || "student").toLowerCase();
//   if (!["student", "admin"].includes(normalizedRole)) {
//     return res.status(400).json({
//       message: "Role tidak valid.",
//       error: {
//         code: "INVALID_ROLE",
//         fields: { role: "Role harus 'student' atau 'admin'." },
//       },
//       meta: { timestamp: new Date().toISOString() },
//     });
//   }

//   // --- 3. Cek Email Sudah Ada (409 Conflict) ---
//   const { data: existing } = await supabase
//     .from("users")
//     .select("id")
//     .eq("email", email)
//     .limit(1)
//     .maybeSingle();

//   if (existing && existing.id) {
//     return res.status(409).json({
//       message: "Email sudah terdaftar.",
//       error: { code: "EMAIL_ALREADY_EXISTS" },
//       meta: { timestamp: new Date().toISOString() },
//     });
//   }

//   // --- 4. Proses Pendaftaran ---
//   const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
//   const hash = await bcrypt.hash(password, saltRounds);
//   const payload = {
//     email,
//     password: hash,
//     full_name,
//     role: normalizedRole,
//     created_at: new Date().toISOString(),
//   };

//   const { data: user, error } = await supabase
//     .from("users")
//     .insert(payload)
//     .select("id, email, full_name, role")
//     .single();

//   // --- 5. Gagal Insert DB (500 Internal Server Error) ---
//   if (error) {
//     return res.status(500).json({
//       message: "Gagal mendaftarkan pengguna karena kesalahan database.",
//       error: { code: "DB_INSERT_FAILED" },
//       meta: { timestamp: new Date().toISOString() },
//     });
//   }

//   // --- 6. Sukses (201 Created) ---
//   // Respon Sukses
//   return res.status(201).json({
//     message: "Pendaftaran berhasil. Silakan login.",
//     data: {
//       // Data user di dalam objek 'data'
//       user: {
//         id: user.id,
//         email: user.email,
//         full_name: user.full_name,
//         role: user.role,
//       },
//     },
//     meta: { timestamp: new Date().toISOString() },
//   });
// }

// module.exports = { login, register };
