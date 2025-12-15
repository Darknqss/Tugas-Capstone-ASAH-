import { getUseCases, getProfile } from "../services/userService.js";
import { getRules } from "../services/userService.js";

export async function TeamRegistrationPage() {
  console.log("[TEAM REG] ===== Starting Team Registration Page =====");

  let useCases = [];
  let rules = [];
  let userProfile = null;
  let hasError = false;
  let errorMessage = "";


  // 1. Fetch Profile first to get learning_path
  try {
    console.log("[TEAM REG] Step 1: Fetching user profile...");
    const profileResponse = await getProfile();
    userProfile = profileResponse?.data || {};
    console.log("✅ User Profile loaded:", userProfile?.learning_path);
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    // Proceed but maybe warn or assume no path
  }

  // 2. Fetch Use Cases
  try {
    console.log("[TEAM REG] Step 2: Fetching use cases...");
    const useCasesResponse = await getUseCases();
    useCases = useCasesResponse?.data || [];
    console.log("✅ Use Cases loaded:", useCases.length);
  } catch (error) {
    console.error("❌ Error fetching use cases:", error);
    hasError = true;
    errorMessage = "Gagal memuat use case. Silakan refresh halaman.";
  }

  // 3. Fetch Rules
  try {
    console.log("[TEAM REG] Step 3: Fetching rules...");
    const rulesResponse = await getRules();
    console.log("✅ Rules response:", rulesResponse);

    // Extract rules data
    let rulesData = [];
    if (Array.isArray(rulesResponse)) {
      rulesData = rulesResponse;
    } else if (rulesResponse?.data && Array.isArray(rulesResponse.data)) {
      rulesData = rulesResponse.data;
    }

    console.log("[DEBUG] Raw Rules Data:", rulesData);

    // Filter only active rules (ALLOW empty use_case_ref for Global Rules)
    rules = rulesData.filter(rule => {
      const isActive = rule.is_active === true || rule.is_active === 1 || rule.is_active === "1";
      return isActive; // Removed check for use_case_ref presence
    });

    console.log("[DEBUG] Active Rules Count:", rules.length);

  } catch (error) {
    console.error("❌ Error fetching rules:", error);
    rules = [];
  }

  // 1. Group rules by Reference (Source ID) first
  const rawRulesByRef = {};
  const globalRules = [];

  rules.forEach(rule => {
    const ref = String(rule.use_case_ref || '').trim();
    if (ref) {
      if (!rawRulesByRef[ref]) rawRulesByRef[ref] = [];
      rawRulesByRef[ref].push(rule);
    } else {
      globalRules.push(rule);
    }
  });

  // 2. Build Final Map Keyed by Use Case DB ID
  // This ensures app.js and badges can simply look up by ID and get ALL applicable rules
  const rulesByUseCase = {};

  if (useCases.length > 0) {
    useCases.forEach(uc => {
      const useCaseId = String(uc.id || '').trim();
      if (!useCaseId) return;

      const sourceId = uc.capstone_use_case_source_id || uc.source_id || '';

      const specificById = rawRulesByRef[useCaseId] || []; // If ref was DB ID
      const specificBySource = (sourceId && sourceId !== useCaseId) ? (rawRulesByRef[sourceId] || []) : []; // If ref was Source ID

      // Merge and deduplicate
      const combined = [...globalRules, ...specificById, ...specificBySource];
      const unique = [...new Map(combined.map(r => [r.id, r])).values()]; // unique by Rule ID

      rulesByUseCase[useCaseId] = unique;
    });
  }

  console.log("[DEBUG] ===== RULES MAPPING COMPLETE =====");
  console.log("[DEBUG] Total Use Cases:", useCases.length);
  console.log("[DEBUG] Global Rules Count:", globalRules.length);
  console.log("[DEBUG] rulesByUseCase Keys:", Object.keys(rulesByUseCase));
  console.log("[DEBUG] rulesByUseCase Full Map:", rulesByUseCase);

  // Log each use case and its rules
  useCases.forEach(uc => {
    const useCaseId = String(uc.id || '').trim();
    const sourceId = uc.capstone_use_case_source_id || '';
    const rules = rulesByUseCase[useCaseId] || [];
    console.log(`[DEBUG] Use Case: ${uc.name} (ID: ${useCaseId}, Source: ${sourceId}) => ${rules.length} rules`);
  });

  // ========== FILTER LOGIC START ==========
  // ⚠️ FILTERING TEMPORARILY DISABLED - SHOWING ALL USE CASES
  let filteredUseCases = useCases;
  console.log(`[DEBUG] Showing ALL ${filteredUseCases.length} Use Cases (filtering disabled)`);
  // ========== FILTER LOGIC END ==========

  // Build use case list (radio buttons)
  let useCasesListHtml = "";
  if (filteredUseCases.length > 0) {
    useCasesListHtml = filteredUseCases.map((uc, index) => {
      const sourceId = uc.capstone_use_case_source_id || uc.id || '';
      const useCaseId = String(uc.id || '').trim();
      const useCaseRules = rulesByUseCase[useCaseId] || [];

      return `
        <label class="use-case-item" data-use-case-id="${useCaseId}">
          <input 
            type="radio" 
            name="use_case_source_id" 
            value="${sourceId}" 
            id="use-case-${index}"
            required
            data-use-case-radio
          />
          <div class="use-case-content">
            <span class="use-case-name">${uc.name || 'N/A'}</span>
            ${uc.company ? `<span class="use-case-company">${uc.company}</span>` : ''}
            ${sourceId ? `<span class="use-case-id">${sourceId}</span>` : ''}
            ${useCaseRules.length > 0 ? `<span class="use-case-rules-badge">${useCaseRules.length} aturan</span>` : ''}
          </div>
        </label>
      `;
    }).join('');
  } else {
    const emptyMessage = userProfile?.learning_path
      ? `Tidak ada Use Case yang tersedia untuk Learning Path: <strong>${userProfile.learning_path}</strong>`
      : 'Belum ada use case tersedia.';

    useCasesListHtml = `<div class="use-case-empty">${emptyMessage}</div>`;
  }

  // Build rules display
  let rulesInfoHtml = "";
  if (rules.length > 0) {
    rulesInfoHtml = `
      <div class="rules-info-card">
        <div class="rules-header">
          <h3 class="rules-info-title">
            <span class="rules-icon">📋</span>
            Aturan Komposisi Tim
          </h3>
          <span class="rules-badge" data-rules-count>${rules.length} Aturan</span>
        </div>
        <div class="rules-content" data-rules-content>
          <div class="rules-placeholder">
            <span class="rules-placeholder-icon">👆</span>
            <p class="rules-placeholder-text">Pilih use case untuk melihat aturan komposisi tim</p>
          </div>
        </div>
        <div class="rules-footer" hidden data-rules-footer>
          <p class="rules-hint">
            <span class="rules-hint-icon">💡</span>
            Pastikan anggota tim memenuhi aturan di atas
          </p>
        </div>
      </div>
    `;
  } else {
    rulesInfoHtml = `
      <div class="rules-info-card">
        <div class="rules-empty">
          <div class="rules-empty-state">
            <span class="rules-empty-icon">✨</span>
            <p class="rules-empty-text">Belum ada aturan aktif</p>
            <p class="rules-empty-subtext">Semua use case tersedia</p>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="container content-section">
      <div class="section-header">
        <h1 class="section-title">Registrasi Tim</h1>
        <p class="section-description">Daftarkan tim Anda untuk mengikuti proyek capstone</p>
      </div>

      <div class="team-registration-page">
        ${hasError ? `
          <div class="error-card">
            <div class="error-icon">⚠️</div>
            <p class="error-message">${errorMessage}</p>
            <button class="btn btn-primary" onclick="window.location.reload()">Refresh Halaman</button>
          </div>
        ` : `
          <div class="registration-layout">
            <div class="registration-main">
              <div class="card registration-form-card">
                <h2 class="card-title">Form Registrasi Tim</h2>
                <p class="form-description">Isi detail tim Anda untuk melanjutkan proses capstone.</p>
                
                ${!userProfile?.learning_path || !userProfile?.university ? `
                  <div class="alert alert-warning" style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #fff3cd 0%, #fff8e1 100%); border: 2px solid #ffc107; border-radius: 10px; display: flex; align-items: start; gap: 12px;">
                    <span style="font-size: 24px;">⚠️</span>
                    <div style="flex: 1;">
                      <strong style="display: block; margin-bottom: 8px; color: #856404;">Profil Belum Lengkap</strong>
                      <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                        ${!userProfile?.learning_path ? 'Learning Path belum diset. ' : ''}
                        ${!userProfile?.university ? 'Universitas belum diisi. ' : ''}
                        Silakan lengkapi profil Anda terlebih dahulu dengan klik foto profil di pojok kanan atas.
                      </p>
                      <p style="margin: 8px 0 0 0; font-size: 13px; color: #856404;">
                        <strong>Format Learning Path yang benar:</strong><br>
                        • Machine Learning (ML)<br>
                        • Front-End Web & Back-End with AI (FEBE)<br>
                        • React & Back-End with AI (REBE)
                      </p>
                    </div>
                  </div>
                ` : ''}
                
                <form class="team-registration-form" data-registration-form>
                  <div class="form-feedback" data-form-feedback hidden></div>
                  
                  <div class="form-row">
                    <label for="team-name">Nama Tim <span class="required">*</span></label>
                    <input 
                      type="text" 
                      id="team-name" 
                      name="team_name" 
                      placeholder="Contoh: GEMBROT SQUAD" 
                      required 
                    />
                    <p class="form-hint">Masukkan nama tim yang unik dan mudah diingat</p>
                  </div>

                  <div class="form-row">
                    <label>Use Case <span class="required">*</span></label>
                    
                    ${userProfile?.learning_path ? `
                      <div class="filter-alert">
                        <span class="filter-icon">🔍</span>
                        <span>Menampilkan Use Case untuk path: <strong>${userProfile.learning_path}</strong></span>
                      </div>
                    ` : ''}

                    <div class="use-case-list">
                      ${useCasesListHtml}
                    </div>
                    <p class="form-hint">Pilih use case yang akan dikerjakan tim Anda.</p>
                  </div>

                  <div class="form-row">
                    <label for="member-ids">ID Anggota Tim (pisahkan dengan koma) <span class="required">*</span></label>
                    <textarea 
                      id="member-ids" 
                      name="member_source_ids" 
                      rows="4" 
                      placeholder="FUI0001, FUI0002, FUI0003" 
                      required
                      data-member-ids-input
                    ></textarea>
                    <div class="composition-status" data-composition-status hidden>
                      <div class="composition-status-content">
                        <span class="status-icon">ℹ️</span>
                        <span class="status-text">Komposisi tim akan divalidasi saat submit</span>
                      </div>
                    </div>
                    <p class="form-hint">Masukkan ID anggota tim, pisahkan dengan koma. Contoh: FUI0001, FUI0002, FUI0003</p>
                  </div>

                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary btn-large">
                      <span class="btn-text">Daftarkan Tim</span>
                      <span class="btn-loading" hidden>Memproses...</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div class="registration-sidebar">
              ${rulesInfoHtml}

              <div class="info-card">
                <div class="info-card-header">
                  <i>ℹ️</i> Informasi Penting
                </div>
                <ul class="info-list">
                  <li>Pastikan semua anggota tim sudah terdaftar di sistem</li>
                  <li>Gunakan ID anggota yang valid (format: FUI0001, dll)</li>
                  <li>Tim akan menunggu validasi dari admin setelah pendaftaran</li>
                  <li>Komposisi tim harus sesuai dengan aturan yang berlaku</li>
                </ul>
              </div>
            </div>
          </div>
        `}
      </div>
    </div>

    <script type="application/json" data-rules-data>
      ${JSON.stringify({ rulesByUseCase, rules })}
    </script>
  `;
}
