import { getUseCases, getProfile } from "../services/userService.js";
import { getRules } from "../services/userService.js";

export async function TeamRegistrationPage() {
  let useCases = [];
  let rules = [];
  let userProfile = null;
  let hasError = false;
  let errorMessage = "";

  // 1. Fetch Profile first to get learning_path
  try {
    const profileResponse = await getProfile();
    userProfile = profileResponse?.data || {};
    console.log("✅ User Profile loaded:", userProfile?.learning_path);
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    // Proceed but maybe warn or assume no path
  }

  // 2. Fetch Use Cases
  try {
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
    const rulesResponse = await getRules();
    console.log("✅ Rules response:", rulesResponse);

    // Extract rules data
    let rulesData = [];
    if (Array.isArray(rulesResponse)) {
      rulesData = rulesResponse;
    } else if (rulesResponse?.data && Array.isArray(rulesResponse.data)) {
      rulesData = rulesResponse.data;
    }

    // Filter only active rules with use_case_ref
    rules = rulesData.filter(rule =>
      rule.is_active === true &&
      rule.use_case_ref !== null &&
      rule.use_case_ref !== undefined &&
      rule.use_case_ref !== ''
    );
  } catch (error) {
    console.error("❌ Error fetching rules:", error);
    rules = [];
  }

  // Group rules by use_case_ref for easy lookup
  const rulesByUseCase = {};
  rules.forEach(rule => {
    const ref = String(rule.use_case_ref || '').trim();
    if (ref) {
      if (!rulesByUseCase[ref]) {
        rulesByUseCase[ref] = [];
      }
      rulesByUseCase[ref].push(rule);
    }
  });

  // ========== FILTER LOGIC START ==========
  let filteredUseCases = [];

  if (useCases.length > 0) {
    const userPath = userProfile?.learning_path?.trim();

    filteredUseCases = useCases.filter(uc => {
      const useCaseId = String(uc.id || '').trim();
      const ucRules = rulesByUseCase[useCaseId] || [];

      // If user has no learning path set yet, maybe show all? 
      // Or show only those with NO learning_path restrictions?
      // Assuming if path not set, show all to encourage exploration? 
      // User Prompt: "learning_path hanya bisa diset SEKALI... filterin sesuai dengan rules"
      // If no path, we can't filter by path.
      if (!userPath) return true;

      // Find if this Use Case has any rule strictly related to 'learning_path'
      const pathRules = ucRules.filter(r => r.user_attribute === 'learning_path');

      // If NO rules about learning_path, then it's open to everyone (Generic)
      if (pathRules.length === 0) {
        return true;
      }

      // If HAS rules about learning_path, User MUST match AT LEAST ONE of the allowed paths
      const isMatch = pathRules.some(rule => {
        // Helper to normalize: lowercase, remove parens content, trim
        const norm = (str) => str?.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();

        return norm(rule.attribute_value) === norm(userPath) ||
          rule.attribute_value === userPath; // fallback to exact
      });

      return isMatch;
    });

    console.log(`Filtered Use Cases: ${filteredUseCases.length} (User Path: ${userPath})`);
  }
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
            Pastikan komposisi tim memenuhi semua aturan di atas
          </p>
        </div>
      </div>
    `;
  } else {
    rulesInfoHtml = `
      <div class="rules-info-card rules-info-card--empty">
        <div class="rules-header">
          <h3 class="rules-info-title">
            <span class="rules-icon">📋</span>
            Aturan Komposisi Tim
          </h3>
        </div>
        <div class="rules-content">
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

                    <div class="use-case-list-wrapper">
                      <div class="use-case-list" data-use-case-list>
                        ${useCasesListHtml}
                      </div>
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
                <h3 class="info-title">
                  <span class="info-icon">ℹ️</span>
                  Informasi Penting
                </h3>
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

