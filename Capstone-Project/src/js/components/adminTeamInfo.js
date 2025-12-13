import { readSession } from "../services/authService.js";
import {
  listAllGroups,
  validateGroupRegistration,
  setGroupRules,
  createGroup,
} from "../services/adminService.js";

export async function AdminTeamInfoPage() {
  const session = readSession();

  // Get groupId from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const selectedGroupId = urlParams.get("groupId");

  // Fetch groups data
  let groupsData = [];
  let selectedGroup = null;
  let isLoading = true;
  let errorMessage = null;

  try {
    console.log("[AdminTeamInfo] Fetching groups data...");
    const response = await listAllGroups();
    console.log("[AdminTeamInfo] API Response:", response);

    // Handle different response structures
    // Try response.data first, then response.groups, then response directly, or empty array
    if (response?.data && Array.isArray(response.data)) {
      groupsData = response.data;
      console.log("[AdminTeamInfo] Found data in response.data:", groupsData.length, "groups");
    } else if (response?.groups && Array.isArray(response.groups)) {
      groupsData = response.groups;
      console.log("[AdminTeamInfo] Found data in response.groups:", groupsData.length, "groups");
    } else if (Array.isArray(response)) {
      groupsData = response;
      console.log("[AdminTeamInfo] Response is directly an array:", groupsData.length, "groups");
    } else {
      groupsData = [];
      console.warn("[AdminTeamInfo] Unexpected response structure:", response);
    }

    // Normalize field names - handle different API field naming conventions
    // Fetch detailed info for each group to get member count (N+1 query workaround)
    console.log("[AdminTeamInfo] Fetching detailed info for " + groupsData.length + " groups...");

    // Import getGroupById locally to avoid circular dependency issues if any
    const { getGroupById } = await import("../services/adminService.js");

    // Enrich groups data with details
    const enrichedGroups = await Promise.all(groupsData.map(async (simpleGroup) => {
      try {
        const groupId = simpleGroup.group_id || simpleGroup.id || simpleGroup.groupId;
        if (!groupId) return simpleGroup;

        const detailResponse = await getGroupById(groupId);
        const detail = detailResponse?.data || detailResponse || {};

        if (simpleGroup.group_name === "Generasi Jaya" || simpleGroup.group_name?.includes("Generasi")) {
          console.log("[DEBUG] Generasi Jaya Raw Detail:", detail);
        }

        // Merge simple data with detailed data (prefer detail)
        return { ...simpleGroup, ...detail };
      } catch (err) {
        // Fallback to simple group data if detail fetch fails (e.g. 500 error)
        console.warn(`[AdminTeamInfo] Failed to fetch detail for group ${simpleGroup.group_id}. Using basic data.`);
        return simpleGroup;
      }
    }));

    groupsData = enrichedGroups;

    groupsData = groupsData.map(group => {
      // Map different possible field names to consistent ones
      // Handle members field - could be members, group_members, users, or nested structure
      let members = [];
      if (group.members && Array.isArray(group.members)) {
        members = group.members;
      } else if (group.group_members && Array.isArray(group.group_members)) {
        members = group.group_members;
      } else if (group.users && Array.isArray(group.users)) {
        members = group.users;
      } else if (group.member_list && Array.isArray(group.member_list)) {
        members = group.member_list;
      }

      // Helper to extract use case info
      // Helper to extract use case info
      let ucName = null;
      let ucCompany = null;
      let ucSourceId = group.use_case_source_id || group.use_case_id || group.use_case_ref || null;

      // 1. Try to get from nested object (Preferred)
      if (group.use_case && typeof group.use_case === 'object') {
        ucName = group.use_case.name || group.use_case.title || group.use_case.use_case_name || null;
        ucCompany = group.use_case.company || group.use_case.company_name || group.use_case.use_case_company || null;
        ucSourceId = group.use_case.capstone_use_case_source_id || group.use_case.source_id || ucSourceId;
      } else if (group.useCase && typeof group.useCase === 'object') {
        ucName = group.useCase.name || group.useCase.title || group.useCase.useCaseName || null;
        ucCompany = group.useCase.company || group.useCase.companyName || group.useCase.useCaseCompany || null;
        ucSourceId = group.useCase.capstoneUseCaseSourceId || ucSourceId;
      }

      // 2. Fallback to direct properties if still null, but ONLY if they are strings
      if (!ucName && typeof group.use_case_name === 'string') ucName = group.use_case_name;
      if (!ucName && typeof group.use_case === 'string') ucName = group.use_case;

      if (!ucCompany && typeof group.use_case_company === 'string') ucCompany = group.use_case_company;

      // 3. Final safety check: if ucName is somehow still an object, assume it failed and clear it
      if (typeof ucName === 'object') ucName = null;

      return {
        group_id: group.group_id || group.id || group.groupId || null,
        group_name: group.group_name || group.name || group.groupName || "-",
        batch_id: group.batch_id || group.batchId || group.batch_id || "-",
        status: group.status || group.group_status || "pending",
        project_status: group.project_status || group.projectStatus || "not_started",
        members: members, // Use normalized members array
        use_case_source_id: ucSourceId,
        use_case_name: ucName,
        use_case_company: ucCompany,
        description: group.description || group.desc || null,
        ...group // Keep all other fields
      };
    });

    console.log("[AdminTeamInfo] Groups with members count:", groupsData.map(g => ({
      name: g.group_name,
      members_count: g.members?.length || 0,
      members: g.members
    })));

    console.log("[AdminTeamInfo] Normalized groups data:", groupsData);

    if (selectedGroupId) {
      selectedGroup = groupsData.find((g) =>
        g.group_id === selectedGroupId ||
        g.id === selectedGroupId ||
        String(g.group_id) === String(selectedGroupId)
      );
      console.log("[AdminTeamInfo] Selected group:", selectedGroup);
    }

    isLoading = false;
  } catch (error) {
    console.error("[AdminTeamInfo] Error fetching groups:", error);
    console.error("[AdminTeamInfo] Error details:", {
      message: error?.message,
      status: error?.status,
      details: error?.details
    });
    isLoading = false;
    errorMessage = error?.message || error?.details?.message || "Gagal memuat data tim. Silakan refresh halaman.";

    // Show more detailed error if available
    if (error?.status === 401) {
      errorMessage = "Sesi Anda telah berakhir. Silakan login kembali.";
    } else if (error?.status === 403) {
      errorMessage = "Anda tidak memiliki akses untuk melihat data tim.";
    } else if (error?.status === 404) {
      errorMessage = "Endpoint tidak ditemukan. Pastikan API endpoint benar.";
    } else if (error?.status >= 500) {
      errorMessage = "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
    }
  }

  // Calculate statistics
  const stats = {
    total: groupsData.length,
    pending: groupsData.filter(g => (g.status || '').toLowerCase().includes('pending')).length,
    accepted: groupsData.filter(g => (g.status || '').toLowerCase() === 'accepted').length,
    rejected: groupsData.filter(g => (g.status || '').toLowerCase() === 'rejected').length,
    inProgress: groupsData.filter(g => (g.project_status || '').toLowerCase() === 'in_progress').length,
  };

  return `
    <div class="admin-subpage-wrapper">
      <div class="container main-content-wrapper" style="margin-top: 30px;">
        <!-- Header Section -->
        <div class="admin-page-header">
          <div>
            <h2 class="admin-page-title">Manajemen Tim</h2>
            <p class="admin-page-subtitle">Kelola dan pantau semua tim yang terdaftar</p>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="admin-stats-grid" style="margin-bottom: 30px;">
          <div class="stat-card-modern stat-total">
            <div class="stat-icon-wrapper">👥</div>
            <div class="stat-info">
              <div class="stat-label">Total Tim</div>
              <div class="stat-number">${stats.total}</div>
            </div>
          </div>
          <div class="stat-card-modern stat-warning">
            <div class="stat-icon-wrapper">⏳</div>
            <div class="stat-info">
              <div class="stat-label">Menunggu Validasi</div>
              <div class="stat-number">${stats.pending}</div>
            </div>
          </div>
          <div class="stat-card-modern stat-success">
            <div class="stat-icon-wrapper">✅</div>
            <div class="stat-info">
              <div class="stat-label">Diterima</div>
              <div class="stat-number">${stats.accepted}</div>
            </div>
          </div>
          <div class="stat-card-modern stat-active">
            <div class="stat-icon-wrapper">🚀</div>
            <div class="stat-info">
              <div class="stat-label">Proyek Berjalan</div>
              <div class="stat-number">${stats.inProgress}</div>
            </div>
          </div>
        </div>
        
        <!-- Main Toolbar -->
        <div class="admin-toolbar-card" style="justify-content: flex-start; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
          <button class="btn-primary" data-admin-action="create-group" style="display: flex; align-items: center; gap: 8px;">
            <span>➕</span>
            <span>Buat Tim Baru</span>
          </button>
          <button class="btn-secondary-icon" data-admin-action="set-registration-period" style="display: flex; align-items: center; gap: 8px;">
            <span>📅</span>
            <span>Atur Periode Pendaftaran</span>
          </button>
          <button class="btn-secondary-icon" data-admin-action="set-rules" style="display: flex; align-items: center; gap: 8px;">
            <span>⚙️</span>
            <span>Atur Komposisi Tim</span>
          </button>
          <button class="btn-secondary-icon" data-admin-action="export-data" style="display: flex; align-items: center; gap: 8px;">
            <span>📥</span>
            <span>Ekspor Data Tim</span>
          </button>
          
          <a href="/admin-unassigned-students" class="btn-secondary-icon" data-link style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit; margin-left: auto;">
            <span>🎲</span>
            <span>Randomize & Unassigned</span>
          </a>
        </div>

        <!-- Filter & Search Bar -->
        <div class="admin-toolbar-card" style="margin-bottom: 20px;">
          <div class="toolbar-left" style="flex: 1;">
            <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: var(--text-dark);">Daftar Tim</h3>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6c757d;">${stats.total} tim terdaftar</p>
          </div>
          <div class="toolbar-right">
            <div class="search-box">
              <input type="text" class="search-input-clean" placeholder="🔍 Cari tim..." data-search-groups />
            </div>
            <select class="filter-select-clean" data-filter-status>
              <option value="">Semua Status</option>
              <option value="pending_validation">PENDING_VALIDATION</option>
              <option value="accepted">ACCEPTED</option>
              <option value="rejected">REJECTED</option>
              <option value="draft">DRAFT</option>
            </select>
          </div>
        </div>

        <!-- Error Message -->
        ${errorMessage ? `
          <div class="alert alert-error" style="margin-bottom: 20px; padding: 16px; background: #fee; border: 1px solid #fcc; border-radius: 8px; color: #c33;">
            <strong>⚠️ Error:</strong> ${errorMessage}
          </div>
        ` : ''}

        <!-- Loading State -->
        ${isLoading ? `
          <div class="loading-state" style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
            <p style="color: #6c757d; font-size: 16px;">Memuat data tim...</p>
          </div>
        ` : ''}

        <!-- Groups Table -->
        ${!isLoading ? `
          <div class="card list-card" style="box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); border: 1px solid #e9ecef;">
            <div class="table-responsive">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Nama Tim</th>
                    <th>Batch ID</th>
                    <th>Status</th>
                    <th>Anggota</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody data-groups-list>
                  ${groupsData.length === 0 && !isLoading
        ? `<tr>
                        <td colspan="5" class="empty-cell" style="text-align:center; padding: 60px 40px;">
                          <div style="font-size: 64px; margin-bottom: 16px;">📋</div>
                          <div style="font-size: 16px; color: #6c757d; font-weight: 600; margin-bottom: 8px;">Belum ada tim terdaftar</div>
                          <div style="font-size: 14px; color: #999; margin-bottom: 16px;">Klik "Buat Tim Baru" untuk menambahkan tim pertama</div>
                          ${errorMessage ? `<div style="font-size: 12px; color: #c33; padding: 8px; background: #fee; border-radius: 4px; display: inline-block;">⚠️ ${errorMessage}</div>` : ''}
                        </td>
                      </tr>`
        : groupsData.map((group) => {
          // Ensure we use normalized fields
          const groupId = group.group_id || group.id || group.groupId || null;
          const groupName = group.group_name || group.name || group.groupName || "-";
          const batchId = group.batch_id || group.batchId || "-";
          const status = (group.status || 'pending').toLowerCase();
          const projectStatus = (group.project_status || 'not_started').toLowerCase();

          // Calculate member count - ensure we use the normalized members array
          const rawMembers = group.members || group.group_members || group.users || [];
          const membersArray = Array.isArray(rawMembers) ? rawMembers : [];
          const memberCount = membersArray.length;

          console.log(`[AdminTeamInfo] Group ${groupName}: ${memberCount} members`, membersArray);

          // Skip rendering if no valid group_id
          if (!groupId) {
            console.warn("[AdminTeamInfo] Group without ID:", group);
            return '';
          }

          return `
                          <tr data-view-group="${groupId}" style="cursor: pointer;" data-group-id="${groupId}">
                            <td>
                              <div style="display: flex; align-items: center; gap: 12px;">
                                <div class="team-avatar">${(groupName || "?").charAt(0).toUpperCase()}</div>
                                <div>
                                  <div class="fw-bold text-dark" style="font-size: 15px;">${groupName}</div>
                                  ${group.description ? `<div style="font-size: 12px; color: #6c757d; margin-top: 2px;">${group.description}</div>` : ''}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span class="badge-pill" style="font-family: monospace; font-size: 12px;">${batchId}</span>
                            </td>
                            <td>
                              <span class="status-indicator status-${status}">
                                ${(group.status || 'PENDING').toUpperCase().replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td>
                              <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 18px;">👤</span>
                                <span style="font-weight: 600; color: var(--text-dark);">${memberCount}</span>
                                <span style="font-size: 13px; color: #6c757d;">anggota</span>
                              </div>
                            </td>
                            <td>
                              <div style="display: flex; gap: 8px;">
                                <button class="btn-link" data-view-group="${groupId}" style="font-weight:600; font-size:13px; color: var(--secondary-color);">
                                  👁️ Detail
                                </button>
                                <button class="btn-link" data-open-edit-group="${groupId}" style="font-weight:600; font-size:13px; color: #666;">
                                  ✏️ Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        `;
        }).join("")
      }
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

      </div>

      <!-- Modals -->
      
      <!-- Detail Group Modal -->
      <div class="modal-backdrop" data-modal-backdrop hidden></div>
      <div class="modal" data-modal="group-detail" hidden style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3>Detail Tim</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <div class="modal-body" data-group-detail-content style="padding: 0;">
          <!-- Content injected here via renderGroupDetail -->
        </div>
      </div>

      <!-- Create Group Modal -->
      <div class="modal-backdrop" data-modal-backdrop hidden></div>
      <div class="modal" data-modal="create-group" hidden>
        <div class="modal-header">
          <h3>Buat Tim Baru</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <form class="modal-form" data-form="create-group">
          <div class="form-group">
            <label>Nama Tim</label>
            <input type="text" name="group_name" required placeholder="Contoh: Team Awesome" />
          </div>
          <div class="form-group">
            <label>Batch ID</label>
            <input type="text" name="batch_id" required placeholder="Contoh: batch-2024" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary">Buat Tim</button>
          </div>
        </form>
      </div>

      <!-- Edit Group Modal -->
      <div class="modal" data-modal="edit-group" hidden>
        <div class="modal-header">
          <h3>Edit Tim</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <form class="modal-form" data-edit-group-form>
          <input type="hidden" name="group_id" />
          <div class="form-group">
            <label>Nama Tim</label>
            <input type="text" name="group_name" required />
          </div>
          <div class="form-group">
            <label>Batch ID</label>
            <input type="text" name="batch_id" required />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select name="status" data-validate-status>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div class="form-group" data-rejection-reason-group hidden>
            <label>Alasan Penolakan <span style="color:red">*</span></label>
            <textarea name="rejection_reason" rows="3" class="form-input" placeholder="Wajib diisi jika status Rejected"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>

      <!-- Set Rules Modal -->
      <div class="modal" data-modal="set-rules" hidden style="max-width: 600px;">
        <div class="modal-header">
          <h3>Atur Komposisi Tim</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <form class="modal-form" data-form="set-rules">
          <div class="form-group">
            <label>Batch ID</label>
            <input type="text" name="batch_id" required placeholder="Contoh: batch-2024" />
            <p class="form-hint">Batch ID untuk periode capstone ini</p>
          </div>
          <div class="form-group">
            <label>Use Case (Opsional)</label>
            <input type="text" name="use_case_ref" placeholder="ID Use Case (opsional)" />
            <p class="form-hint">Kosongkan jika aturan berlaku untuk semua use case</p>
          </div>
          <div class="form-group">
            <p class="text-sm text-muted" style="margin-bottom: 12px;">
              <strong>Tambahkan aturan komposisi tim berdasarkan Learning Path.</strong><br>
              Contoh: Tim harus memiliki minimal 2 ML dan 3 FEBE
            </p>
            <div id="rules-list" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;">
              <!-- Rules added dynamically -->
            </div>
            <button type="button" class="btn btn-secondary btn-small" data-add-rule style="width: 100%;">+ Tambah Aturan Komposisi</button>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="is_active" checked />
              Aktifkan aturan ini
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Aturan</button>
          </div>
        </form>
      </div>

      <!-- Validate Group Modal -->
      <div class="modal" data-modal="validate-group" hidden>
        <div class="modal-header">
          <h3 data-modal-title>Validasi Tim</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <form class="modal-form" data-form="validate-group" data-validation-form>
          <input type="hidden" name="group_id" data-group-id-input />
          <input type="hidden" name="action" />
          <div class="form-group">
            <p class="confirmation-text" style="font-size: 15px; margin-bottom: 16px;">
              <strong data-confirmation-message>Apakah Anda yakin ingin melakukan tindakan ini?</strong>
            </p>
            <div data-group-info style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px;">
              <div><strong>Nama Tim:</strong> <span data-group-name>-</span></div>
              <div><strong>Batch ID:</strong> <span data-group-batch>-</span></div>
              <div><strong>Jumlah Anggota:</strong> <span data-group-members>-</span></div>
            </div>
          </div>
          <div class="form-group" data-rejection-reason-row hidden>
            <label style="font-weight: 600; margin-bottom: 8px;">Alasan Penolakan <span style="color: #c33;">*</span></label>
            <textarea name="rejection_reason" rows="4" placeholder="Masukkan alasan penolakan tim...&#10;Contoh: Komposisi tim tidak sesuai dengan aturan yang berlaku" required style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; font-family: inherit;"></textarea>
            <p class="form-hint" style="margin-top: 6px; font-size: 12px; color: #6c757d;">Alasan penolakan wajib diisi dan akan dikirim ke tim yang ditolak.</p>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary" data-submit-text>Konfirmasi</button>
          </div>
        </form>
      </div>

      <!-- Edit Member Modal -->
      <div class="modal" data-modal="edit-member" hidden>
        <div class="modal-header">
          <h3>Edit Member</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <form class="modal-form" data-form="edit-member">
          <input type="hidden" name="user_id" />
          <div class="form-group">
            <label>Learning Path</label>
            <select name="learning_path" required>
              <option value="">Pilih Learning Path</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="Front-End & Back-End">Front-End & Back-End</option>
              <option value="React & Back-End">React & Back-End</option>
              <option value="Cloud Computing">Cloud Computing</option>
              <option value="Mobile Development">Mobile Development</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary">Simpan</button>
          </div>
        </form>
      </div>

      <!-- Registration Period Modal -->
      <div class="modal" data-modal="registration-period" hidden>
        <div class="modal-header">
          <h3>Atur Periode Pendaftaran</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <form class="modal-form" data-form="registration-period">
          <div class="alert alert-warning" style="font-size: 14px; background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; padding: 15px; border-radius: 6px; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
            <strong>Periode Pendaftaran Dikelola Otomatis</strong>
            <p style="margin-top: 8px; margin-bottom: 0;">
              Silakan akses menu <strong>Dokumen & Timeline</strong> untuk mengubah jadwal pendaftaran (Timeline).
              Perubahan di Timeline akan otomatis memperbarui periode pendaftaran ini.
            </p>
          </div>
          <div class="form-actions" style="justify-content: center; margin-top: 20px;">
            <button type="button" class="btn btn-primary" data-close-modal>Mengerti</button>
          </div>
        </form>
      </div>

      <!-- Randomize Teams Modal -->
      <div class="modal" data-modal="randomize-teams" hidden>
        <div class="modal-header">
          <h3>Randomize Peserta</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <form class="modal-form" data-form="randomize-teams">
          <div class="form-group">
            <p class="text-sm text-muted" style="margin-bottom: 16px;">
              Fitur ini akan secara otomatis membentuk tim untuk peserta yang belum memiliki tim berdasarkan progres belajar mereka.
            </p>
            <label>Batch ID</label>
            <input type="text" name="batch_id" required placeholder="Contoh: batch-2024" />
          </div>
          <div class="form-group">
            <label>Jumlah Anggota per Tim</label>
            <input type="number" name="team_size" min="2" max="10" value="5" required />
            <p class="form-hint">Jumlah anggota yang diinginkan per tim</p>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="respect_learning_path" checked />
              Pertimbangkan Learning Path
            </label>
            <p class="form-hint">Centang untuk mempertimbangkan learning path saat randomize</p>
          </div>
          <div class="alert alert-warning" style="background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
            <strong>⚠️ Peringatan:</strong> Tindakan ini akan membentuk tim secara otomatis. Pastikan semua peserta yang ingin di-randomize sudah terdaftar di sistem.
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary">Mulai Randomize</button>
          </div>
        </form>
      </div>

      <!-- Upload Members Modal -->
      <div class="modal" data-modal="upload-members" hidden>
        <div class="modal-header">
          <h3>Upload Anggota Tim</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <form class="modal-form" data-form="upload-members">
          <input type="hidden" name="group_id" />
          <div class="form-group">
            <label>ID Anggota (pisahkan dengan koma atau baris baru)</label>
            <textarea name="member_ids" rows="8" placeholder="FUI0001, FUI0002, FUI0003&#10;atau&#10;FUI0001&#10;FUI0002&#10;FUI0003" required></textarea>
            <p class="form-hint">Masukkan ID anggota yang akan ditambahkan ke tim. Bisa dipisahkan dengan koma atau baris baru.</p>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary">Upload Anggota</button>
          </div>
        </form>
      </div>

    </div>
  `;
}

window.renderGroupDetail = renderGroupDetail;

function renderGroupDetail(group) {
  console.log("[renderGroupDetail] Rendering group:", group);

  // Normalize group data to ensure consistent field names
  // Handle members field - could be members, group_members, users, or nested structure
  let members = [];
  if (group.members && Array.isArray(group.members)) {
    members = group.members;
  } else if (group.group_members && Array.isArray(group.group_members)) {
    members = group.group_members;
  } else if (group.users && Array.isArray(group.users)) {
    members = group.users;
  } else if (group.member_list && Array.isArray(group.member_list)) {
    members = group.member_list;
  }

  const normalizedGroup = {
    group_id: group.group_id || group.id || group.groupId || null,
    group_name: group.group_name || group.name || group.groupName || "Tanpa Nama",
    batch_id: group.batch_id || group.batchId || group.batch_id || "-",
    status: group.status || group.group_status || "pending",
    project_status: group.project_status || group.projectStatus || "not_started",
    members: members,
    use_case_name: group.use_case_name || group.use_case || group.use_case_name || null,
    use_case_company: group.use_case_company || group.use_case_company || null,
    use_case_source_id: group.use_case_source_id || group.use_case_id || group.use_case_ref || null,
    description: group.description || group.desc || null,
    ...group
  };

  console.log("[renderGroupDetail] Normalized group:", normalizedGroup);
  console.log("[renderGroupDetail] Members count:", normalizedGroup.members.length);
  console.log("[renderGroupDetail] Use case:", normalizedGroup.use_case_name);

  const membersArray = normalizedGroup.members || [];
  const status = (normalizedGroup.status || 'pending').toLowerCase();

  // Get status display text and color
  const statusConfig = {
    'pending': { text: 'PENDING VALIDATION', color: '#f57c00', bg: '#fff8e1' },
    'accepted': { text: 'ACCEPTED', color: '#2e7d32', bg: '#e8f5e9' },
    'rejected': { text: 'REJECTED', color: '#d32f2f', bg: '#ffebee' },
    'draft': { text: 'DRAFT', color: '#757575', bg: '#f5f5f5' }
  };

  const statusInfo = statusConfig[status] || statusConfig['pending'];

  return `
    <div class="group-detail-view-modern">
      
      <!-- Header Section with Team Name -->
      <div class="detail-header-modern">
        <div class="detail-avatar-modern">
          ${(normalizedGroup.group_name || "?").charAt(0).toUpperCase()}
        </div>
        <div class="detail-header-content">
          <h2 class="detail-title-modern">${normalizedGroup.group_name || "Tanpa Nama"}</h2>
          <div class="detail-status-badge-modern" style="background: ${statusInfo.bg}; color: ${statusInfo.color};">
            <span class="status-dot" style="background: ${statusInfo.color};"></span>
            ${statusInfo.text}
          </div>
        </div>
      </div>

      <!-- Use Case Section -->
      <div class="detail-card-modern">
        <div class="detail-card-header">
          <div class="detail-card-icon">📋</div>
          <h3 class="detail-card-title">Use Case</h3>
        </div>
        <div class="detail-card-content">
          ${normalizedGroup.use_case
      ? `
              <div class="use-case-display">
                <div class="use-case-name-display">${normalizedGroup.use_case.name}</div>
                ${normalizedGroup.use_case_company ? `<div class="use-case-company-display">${normalizedGroup.use_case_company}</div>` : ''}
                ${normalizedGroup.use_case_source_id ? `<div class="use-case-id-display">ID: ${normalizedGroup.use_case_source_id}</div>` : ''}
              </div>
            `
      : '<div class="empty-state-text">Belum ada use case yang dipilih</div>'
    }
        </div>
      </div>

      <!-- Members Section -->
      <div class="detail-card-modern">
        <div class="detail-card-header" style="justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
             <div class="detail-card-icon">👥</div>
             <h3 class="detail-card-title">Anggota Tim <span class="member-count-badge">${membersArray.length}</span></h3>
          </div>
          <button class="btn-sm btn-primary-outline" data-open-add-member="${normalizedGroup.group_id}" style="padding: 6px 12px; font-size: 13px;">
             + Tambah Anggota
          </button>
        </div>
        <div class="detail-card-content">
          ${membersArray.length > 0
      ? `
              <div class="members-list-modern">
                ${membersArray.map((member, index) => {
        const memberId = member.user_id || member.users_source_id || member.id || member.userId || "";
        const memberName = member.full_name || member.name || member.fullName || member.email || "Unknown";
        const memberEmail = member.email || "-";
        const memberRole = member.learning_path || member.learningPath || "-";


        return `
                  <div class="member-item-modern">
                    <div class="member-avatar-modern" style="background: ${['#e0f2fe', '#f0fdf4', '#faf5ff', '#fff7ed'][index % 4]}; color: ${['#0369a1', '#15803d', '#7e22ce', '#c2410c'][index % 4]};">
                      ${(memberName).charAt(0).toUpperCase()}
                    </div>
                    <div class="member-info-modern">
                      <div class="member-name-modern">${memberName}</div>
                      <div class="member-email-modern">${memberEmail}</div>
                      <div class="member-role-badge-modern">${memberRole}</div>
                    </div>
                    <div class="member-actions-modern" style="display: flex; gap: 8px;">
                       <button class="btn-icon-sm" data-edit-member="${memberId}" data-group-id="${normalizedGroup.group_id}" title="Edit Member">
                          ✏️
                       </button>
                       <button class="btn-icon-sm btn-icon-danger" data-remove-member="${memberId}" data-group-id="${normalizedGroup.group_id}" title="Hapus Anggota" style="color: #ef4444; border-color: #fecaca; background: #fef2f2;">
                          🗑️
                       </button>
                    </div>
                  </div>
                `;
      }).join('')}
              </div>
            `
      : `
              <div class="empty-members-modern">
                <div class="empty-icon">👤</div>
                <div class="empty-text">Belum ada anggota tim</div>
                <div class="empty-hint">Tambahkan anggota melalui tombol di atas</div>
              </div>
            `
    }
        </div >
      </div >

      </div >
      
                  <!-- Validation Actions (Different actions based on status) -->
      <div class="detail-card-modern" style="border: none; background: transparent; padding: 0; box-shadow: none; margin-top: 20px;">
        <div style="display: flex; gap: 12px;">
          ${status === 'pending' || status === 'rejected' ? `
          <button class="btn btn-primary" style="flex: 1; background-color: #2e7d32; border-color: #2e7d32; padding: 12px; font-weight: 600;" 
            data-validate-group="${normalizedGroup.group_id}" data-validate-status="accepted">
            ✅ Terima Tim & Kirim Email
          </button>
          ` : ''}

          ${status === 'pending' || status === 'accepted' ? `
          <button class="btn btn-danger" style="flex: 1; background-color: #d32f2f; border-color: #d32f2f; padding: 12px; font-weight: 600;" 
            data-validate-group="${normalizedGroup.group_id}" data-validate-status="rejected">
            ❌ Tolak Tim (dengan Alasan)
          </button>
          ` : ''}
        </div>
      </div>

      <!-- Add Member Modal -->
      <div class="modal-backdrop" id="add-member-modal" hidden>
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <h2>Tambah Anggota Tim</h2>
            <button class="btn-icon" data-close-add-member-modal>×</button>
          </div>
          <div class="modal-body">
            <form id="add-member-form" data-add-member-form>
               <input type="hidden" name="group_id" value="${normalizedGroup.group_id}">
               <div class="form-group">
                 <label>User ID (UUID)</label>
                 <input type="text" name="user_id" class="form-control" placeholder="Masukkan ID Peserta" required>
                 <small class="text-muted">Masukkan UUID peserta yang belum memiliki tim.</small>
               </div>
               <div class="modal-actions">
                 <button type="button" class="btn-secondary" data-close-add-member-modal>Batal</button>
                 <button type="submit" class="btn-primary">
                    <span>+</span> Tambahkan
                 </button>
               </div>
            </form>
      </div>

      <!-- Edit Member Modal -->
      <div class="modal-backdrop" id="edit-member-modal" hidden>
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <h2>Edit Learning Path</h2>
            <button class="btn-icon" data-close-edit-member-modal>×</button>
          </div>
          <div class="modal-body">
            <form id="edit-member-form" data-edit-member-form>
               <input type="hidden" name="user_id">
               <input type="hidden" name="group_id">
               
               <div class="form-group">
                 <label>Pilih Learning Path Baru</label>
                 <select name="learning_path" class="form-control" required>
                    <option value="" disabled selected>Pilih Path...</option>
                    <option value="Machine Learning (ML)">Machine Learning (ML)</option>
                    <option value="Cloud Computing (CC)">Cloud Computing (CC)</option>
                    <option value="Mobile Development (MD)">Mobile Development (MD)</option>
                    <option value="Front-End Web & Back-End with AI (FEBE)">Front-End Web & Back-End with AI (FEBE)</option>
                 </select>
               </div>

               <div class="modal-actions">
                 <button type="button" class="btn-secondary" data-close-edit-member-modal>Batal</button>
                 <button type="submit" class="btn-primary">
                    💾 Simpan Perubahan
                 </button>
               </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  `;
}
