const { supabase } = require("../config/supabaseClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Login user logic
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} { token, user }
 */
async function loginUser(email, password) {
  // 1. Ambil User
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, password, name, role, users_source_id")
    .eq("email", email)
    .limit(1)
    .single();

  if (error || !user) {
    if (error) console.error("Login DB Error:", error);
    throw { code: "INVALID_CREDENTIALS", message: "Kredensial tidak valid." };
  }

  // 2. Cek Password
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw { code: "INVALID_CREDENTIALS", message: "Kredensial tidak valid." };
  }

  // 3. Cek JWT Secret
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw { code: "JWT_SECRET_MISSING", message: "Kesalahan konfigurasi server." };
  }

  // 4. Generate Token
  const token = jwt.sign(
    { userId: user.id, role: user.role, name: user.name },
    secret,
    { expiresIn: "8h" }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      name: user.name,
      role: user.role,
      users_source_id: user.users_source_id,
    },
  };
}

/**
 * Generate next users_source_id (FUIxxxx)
 */
async function generateUserSourceId() {
  const { data: lastUser } = await supabase
    .from("users")
    .select("users_source_id")
    .ilike("users_source_id", "FUI%")
    .order("users_source_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextId = "FUI0001";
  if (lastUser && lastUser.users_source_id) {
    const lastNum = parseInt(lastUser.users_source_id.replace("FUI", ""), 10);
    if (!isNaN(lastNum)) {
      nextId = `FUI${String(lastNum + 1).padStart(4, "0")}`;
    }
  }
  return nextId;
}

/**
 * Register user logic
 * @param {object} userData { email, password, name, role }
 * @returns {Promise<object>} { user }
 */
async function registerUser({ email, password, name, role }) {
  // 1. Cek Email Sudah Ada
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (existing && existing.id) {
    throw { code: "EMAIL_ALREADY_EXISTS", message: "Email sudah terdaftar." };
  }

  // 2. Hash Password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
  const hash = await bcrypt.hash(password, saltRounds);

  // 3. Generate Source ID
  const usersSourceId = await generateUserSourceId();

  // 4. Insert User
  const payload = {
    email,
    password: hash,
    name,
    role: role ? role.toUpperCase() : "STUDENT",
    users_source_id: usersSourceId,
    created_at: new Date().toISOString(),
  };

  // Default Batch ID logic (Valid until 2026-01-30)
  const cutoffDate = new Date("2026-01-30");
  if (new Date() < cutoffDate) {
    payload.batch_id = "asah-batch-1";
  }

  const { data: user, error } = await supabase
    .from("users")
    .insert(payload)
    .select("id, email, name, role, users_source_id, batch_id")
    .single();

  if (error) {
    console.error("Register DB Error:", error);
    throw { code: "DB_INSERT_FAILED", message: "Gagal mendaftarkan pengguna karena kesalahan database." };
  }

  return { user };
}

module.exports = {
  loginUser,
  registerUser,
};
