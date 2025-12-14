const { supabase } = require("../config/supabaseClient");

/**
 * Get user profile
 */
async function getProfileService(userId) {
  const { data: user, error } = await supabase
    .from("users")
    .select("name, email, role, university, learning_group, users_source_id, learning_path")
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw { code: "USER_NOT_FOUND", message: "Profil pengguna tidak ditemukan." };
  }

  return user;
}

/**
 * List available docs
 */
async function listAvailableDocsService() {
  const { data: docs, error } = await supabase
    .from("capstone_docs")
    .select("*")
    .order("order_idx", { ascending: true });

  if (error) {
    throw { code: "DB_SELECT_FAILED", message: "Gagal mengambil daftar dokumen." };
  }

  return docs;
}

/**
 * List project timeline
 */
async function listProjectTimelineService(userId) {
  // 1. Dapatkan batch_id pengguna
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("batch_id")
    .eq("id", userId)
    .single();

  if (userErr || !user) {
    throw { code: "USER_NOT_FOUND", message: "Data pengguna tidak ditemukan untuk mengambil timeline." };
  }

  const batchId = user.batch_id;

  // 2. Query timeline
  let query = supabase
    .from("capstone_timeline")
    .select("*")
    .order("created_at", { ascending: false });

  if (batchId) {
    query = query.eq("batch_id", batchId);
  }

  const { data: timelines, error: tlErr } = await query;

  if (tlErr) {
    throw { code: "DB_SELECT_FAILED", message: "Gagal mengambil timeline proyek." };
  }

  return timelines;
}

/**
 * List use cases
 */
async function listUseCasesService() {
  const { data: useCases, error } = await supabase
    .from("capstone_use_case")
    .select("*");

  if (error) {
    throw { code: "DB_SELECT_FAILED", message: "Gagal mengambil daftar use cases." };
  }

  return useCases;
}

/**
 * Create document
 */
async function createDocService(userId, { group_id, url, title }) {
  const payload = {
    url,
    created_at: new Date().toISOString(),
  };

  if (title) {
    payload.title = title;
  }

  const { data, error } = await supabase
    .from("capstone_docs")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    console.error("Supabase INSERT Error (createDoc):", error);
    throw { code: "DB_INSERT_FAILED", message: "Gagal mengupload dokumen." };
  }

  return data;
}

/**
 * Update user profile
 */
async function updateProfileService(userId, { name, university, learning_group, learning_path }) {
  // Hanya update yang ada nilainya
  const updates = {};
  if (name) updates.name = name;
  if (university) updates.university = university;
  if (learning_group) updates.learning_group = learning_group;

  // Validasi Enum Learning Path
  if (learning_path) {
    const validPaths = [
      "Machine Learning (ML)", 
      "Front-End Web & Back-End with AI (FEBE)", 
      "React & Back-End with AI (REBE)"
    ];
    if (!validPaths.includes(learning_path)) {
      throw { 
        code: "INVALID_LEARNING_PATH", 
        message: "Learning Path tidak valid. Pilih antara: ML, FEBE, atau REBE." 
      };
    }
    
    // Logic: Cek apakah user sudah punya learning path sebelumnya
    // Jika sudah ada (tidak null/empty), maka TIDAK BOLEH ganti lagi ("Cuma sekali aja")
    const { data: currentUser, error: userErr } = await supabase
      .from("users")
      .select("learning_path")
      .eq("id", userId)
      .single();

    if (!userErr && currentUser && currentUser.learning_path) {
       // Cek apakah nilai baru beda dengan yang lama. Kalau sama, ya skip aja (allow).
       // Tapi kalau beda, reject.
       if (currentUser.learning_path !== learning_path) {
          throw { 
            code: "LEARNING_PATH_LOCKED", 
            message: "Learning Path sudah dipilih sebelumnya dan tidak bisa diubah lagi. Hubungi admin jika ada kesalahan." 
          };
       }
    }
    
    updates.learning_path = learning_path;
  }

  if (Object.keys(updates).length === 0) {
    throw { code: "NO_CHANGES", message: "Tidak ada data yang diubah." };
  }

  updates.updated_at = new Date().toISOString();

  const { data: user, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select("name, email, role, university, learning_group, learning_path")
    .single();

  if (error) {
    throw { code: "DB_UPDATE_FAILED", message: "Gagal memperbarui profil." };
  }

  return user;
}

/**
 * Get group rules
 */
async function getGroupRulesService(userId) {
  // Ambil batch_id user
  const { data: user } = await supabase
    .from("users")
    .select("batch_id")
    .eq("id", userId)
    .single();

  if (!user || !user.batch_id) {
    throw { code: "USER_BATCH_NOT_FOUND", message: "Batch ID pengguna tidak ditemukan." };
  }

  const { data: rules, error } = await supabase
    .from("capstone_group_rules")
    .select("*")
    .eq("batch_id", user.batch_id)
    .eq("is_active", true);

  if (error) {
    throw { code: "DB_SELECT_FAILED", message: "Gagal mengambil aturan grup." };
  }

  return rules;
}

/**
 * Register team
 */
async function registerTeamService(creatorId, { group_name, member_source_ids, use_case_source_id }) {
  // 0. Validasi Profil Creator & Ambil Source ID
  const { data: creator, error: creatorErr } = await supabase
    .from("users")
    .select("learning_path, university, batch_id, users_source_id")
    .eq("id", creatorId)
    .single();

  if (creatorErr || !creator) {
    throw { code: "USER_NOT_FOUND", message: "Data pengguna tidak ditemukan." };
  }

  if (!creator.learning_path || !creator.university) {
    throw { 
      code: "PROFILE_INCOMPLETE", 
      message: "Profil Anda belum lengkap. Harap lengkapi Learning Path dan Universitas sebelum mendaftar." 
    };
  }

  const batchId = creator.batch_id || "asah-batch-1";

  // 1. Validasi Anggota (Source ID)
  // Pastikan creator's source_id ada di dalam member_source_ids
  if (!member_source_ids.includes(creator.users_source_id)) {
    throw { code: "INVALID_MEMBER_ID", message: "Ketua kelompok harus termasuk dalam daftar anggota." };
  }

  // Validasi Use Case Source ID & Resolve to UUID
  if (!use_case_source_id) {
    throw { code: "VALIDATION_FAILED", message: "Use Case Code (Source ID) wajib diisi." };
  }

  const { data: useCase, error: ubErr } = await supabase
    .from("capstone_use_case")
    .select("id")
    .eq("capstone_use_case_source_id", use_case_source_id)
    .single();

  if (ubErr || !useCase) {
    throw { code: "USE_CASE_NOT_FOUND", message: "Use Case tidak ditemukan." };
  }

  const use_case_id = useCase.id;

  // Resolve Source IDs to UUIDs
  const { data: members, error: membersErr } = await supabase
    .from("users")
    .select("id, learning_path, batch_id, users_source_id")
    .in("users_source_id", member_source_ids);

  if (membersErr || members.length !== member_source_ids.length) {
    throw { code: "INVALID_MEMBER_ID", message: "Satu atau lebih ID anggota tidak valid." };
  }

  const member_ids = members.map(m => m.id);

  // 2. Cek Double Submission
  const { data: existingMemberships, error: existErr } = await supabase
    .from("capstone_group_member")
    .select("user_ref, capstone_groups!inner(status)")
    .in("user_ref", member_ids)
    .eq("capstone_groups.status", "accepted");

  if (existErr) {
    console.error("Check existing members error:", existErr);
    throw { code: "DB_ERROR", message: "Gagal memvalidasi keanggotaan." };
  }

  if (existingMemberships && existingMemberships.length > 0) {
    const doubleUserIds = existingMemberships.map((m) => m.user_ref);
    throw { 
      code: "DOUBLE_SUBMISSION", 
      message: "Beberapa anggota sudah terdaftar di tim lain yang valid.",
      fields: { doubleUserIds }
    };
  }

  // 3. Validasi Komposisi Tim (Berdasarkan Use Case Rules)
  const { data: rules } = await supabase
    .from("capstone_group_rules")
    .select("*")
    .eq("use_case_ref", use_case_id)
    .eq("is_active", true);

  if (!rules || rules.length === 0) {
    throw { code: "RULES_NOT_FOUND", message: "Tidak ada aturan yang ditemukan untuk Use Case ini." };
  }

  const composition = {};
  members.forEach((m) => {
    const path = m.learning_path;
    composition[path] = (composition[path] || 0) + 1;
  });

  for (const rule of rules) {
    if (rule.user_attribute === "learning_path") {
      const requiredCount = parseInt(rule.value);
      const actualCount = composition[rule.attribute_value] || 0;

      let isValid = false;
      if (rule.operator === ">=") isValid = actualCount >= requiredCount;
      else if (rule.operator === "<=") isValid = actualCount <= requiredCount;
      else if (rule.operator === "=") isValid = actualCount === requiredCount;
      else isValid = actualCount == requiredCount;

      if (!isValid) {
        throw { 
          code: "INVALID_COMPOSITION", 
          message: `Komposisi tim tidak memenuhi syarat: ${rule.attribute_value} harus ${rule.operator} ${rule.value}.` 
        };
      }
    }
  }

  // 4. Simpan Data Tim
  const { data: group, error: groupErr } = await supabase
    .from("capstone_groups")
    .insert({
      group_name,
      batch_id: batchId,
      creator_user_ref: creatorId,
      use_case_ref: use_case_id,
      status: "pending_validation",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (groupErr) {
    throw { code: "DB_INSERT_FAILED", message: "Gagal membuat grup." };
  }

  // 5. Insert Members
  const memberInserts = member_ids.map((uid) => {
    const memberData = members.find((m) => m.id === uid);
    return {
      group_ref: group.id,
      user_ref: uid,
      user_id: memberData ? memberData.users_source_id : null, // Masukkan Source ID ke kolom user_id
      role: uid === creatorId ? "leader" : "member",
      state: "active",
      joined_at: new Date().toISOString(),
    };
  });

  const { error: memberInsertErr } = await supabase
    .from("capstone_group_member")
    .insert(memberInserts);

  if (memberInsertErr) {
    console.error("Member insert error:", memberInsertErr);
    throw { code: "DB_INSERT_FAILED", message: "Gagal menambahkan anggota tim." };
  }

  return group;
}

/**
 * Get team details for a user
 */
async function getTeamService(userId) {
  // 1. Cari group_id dimana user ini menjadi anggota
  const { data: membership, error: memErr } = await supabase
    .from("capstone_group_member")
    .select("group_ref")
    .eq("user_ref", userId)
    .maybeSingle();

  if (memErr) {
    throw { code: "DB_ERROR", message: "Gagal mengambil data keanggotaan." };
  }

  if (!membership) {
    throw { code: "NO_TEAM", message: "Anda belum bergabung dengan tim manapun." };
  }

  const groupId = membership.group_ref;

  // 2. Ambil detail grup dan anggotanya
  const { data: group, error: groupErr } = await supabase
    .from("capstone_groups")
    .select(`
      id, 
      group_name, 
      status, 
      batch_id,
      members:capstone_group_member (
        user_ref,
        role,
        users:user_ref (name, email, learning_path, university)
      )
    `)
    .eq("id", groupId)
    .single();

  if (groupErr || !group) {
    throw { code: "GROUP_NOT_FOUND", message: "Data tim tidak ditemukan." };
  }

  // Format response agar lebih rapi
  const formattedGroup = {
    id: group.id,
    group_name: group.group_name,
    status: group.status,
    batch_id: group.batch_id,
    members: group.members.map(m => ({
      id: m.user_ref,
      name: m.users?.name,
      email: m.users?.email,
      role: m.role,
      learning_path: m.users?.learning_path,
      university: m.users?.university
    }))
  };

  return formattedGroup;
}

module.exports = {
  getProfileService,
  listAvailableDocsService,
  listProjectTimelineService,
  listUseCasesService,
  createDocService,
  updateProfileService,
  getGroupRulesService,
  registerTeamService,
  getTeamService,
};
