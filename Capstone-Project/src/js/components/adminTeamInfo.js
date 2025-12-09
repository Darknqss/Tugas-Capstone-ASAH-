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

  try {
    const response = await listAllGroups();
    groupsData = response?.data || [];
    if (selectedGroupId) {
      selectedGroup = groupsData.find((g) => g.group_id === selectedGroupId);
    }
  } catch (error) {
    console.error("Error fetching groups:", error);
  }

  console.log("Rendering AdminTeamInfoPage");
  return `
    <div class="admin-subpage-wrapper">
      
      <div class="container main-content-wrapper" style="margin-top: 30px;">
        <h2 class="mb-4 text-dark fw-bold">Manajemen Tim</h2>

        
        <!-- Main Toolbar (4 Buttons) -->
        <div class="admin-toolbar-card" style="justify-content: flex-start; gap: 12px;">
           <button class="btn-primary" data-admin-action="create-group">
             Buat Tim Baru
           </button>
           <button class="btn-secondary-icon" data-admin-action="set-rules">
             Atur Komposisi Tim
           </button>
           <button class="btn-secondary-icon" data-admin-action="export-data">
             Ekspor Data Tim
           </button>
           <button class="btn-secondary-icon" data-admin-action="randomize-teams">
             Randomize Peserta
           </button>
        </div>

        <!-- Filter & Search Bar (Secondary Toolbar) -->
        <div class="admin-toolbar-card" style="margin-top: -10px;">
           <div class="toolbar-left" style="flex: 1;">
              <h3 style="margin: 0; font-size: 18px; font-weight: 700;">Daftar Tim</h3>
           </div>
           <div class="toolbar-right">
              <div class="search-box">
                <input type="text" class="search-input-clean" placeholder="Cari tim..." data-search-groups />
              </div>
              <select class="filter-select-clean" data-filter-status>
                <option value="">Semua Status</option>
                <option value="pending">PENDING_VALIDATION</option>
                <option value="accepted">ACCEPTED</option>
                <option value="rejected">REJECTED</option>
                <option value="draft">DRAFT</option>
              </select>
           </div>
        </div>

        <!-- Full Width Groups Table -->
        <div class="card list-card">
          <div class="table-responsive">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Nama Tim</th>
                  <th>Batch ID</th>
                  <th>Status</th>
                  <th>Anggota</th>
                  <th>Proyek</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody data-groups-list>
                ${groupsData.length === 0
      ? `<tr><td colspan="6" class="empty-cell" style="text-align:center; padding: 40px;">Belum ada tim terdaftar</td></tr>`
      : groupsData.map((group) => `
                      <tr data-view-group="${group.group_id}">
                        <td>
                           <div class="fw-bold text-dark">${group.group_name || "-"}</div>
                        </td>
                        <td>${group.batch_id || "-"}</td>
                        <td>
                          <span class="status-indicator status-${(group.status || 'pending').toLowerCase()}">
                            ${(group.status || 'PENDING').toUpperCase().replace('_', ' ')}
                          </span>
                        </td>
                        <td>${group.members?.length || 0} anggota</td>
                        <td>
                           <span class="badge-pill">${(group.project_status || "NOT STARTED").replace("_", " ")}</span>
                        </td>
                        <td>
                          <div style="display: flex; gap: 8px;">
                            <button class="btn-link" data-view-group="${group.group_id}" style="font-weight:600; font-size:13px;">Detail</button>
                            <button class="btn-link" data-open-edit-group="${group.group_id}" style="font-weight:600; font-size:13px; color: #666;">Edit</button>
                          </div>
                        </td>
                      </tr>
                    `).join("")
    }
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Modals -->
      
      <!-- Detail Group Modal (New) -->
      <div class="modal" data-modal="group-detail" hidden>
         <div class="modal-header">
            <h3>Detail Tim</h3>
            <button class="modal-close" data-close-modal>×</button>
         </div>
         <div class="modal-body" data-group-detail-content style="padding: 0;">
            <!-- Content injected here via renderGroupDetail -->
         </div>
      </div>

      <!-- Create/Edit Group Modal -->
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

       <!-- Edit Panel -->
       <div class="modal" data-edit-group-panel hidden>
          <div class="modal-header">
            <h3>Edit Tim</h3>
            <button class="modal-close" onclick="this.closest('.modal').hidden = true">×</button>
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
                 <select name="status">
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                 </select>
             </div>
             <div class="form-actions">
              <button type="submit" class="btn btn-primary">Simpan</button>
             </div>
          </form>
       </div>

      <!-- Set Rules Modal -->
      <div class="modal" data-modal="set-rules" hidden>
        <div class="modal-header">
          <h3>Atur Komposisi Tim</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <form class="modal-form" data-form="set-rules">
          <div class="form-group">
            <label>Batch ID</label>
            <input type="text" name="batch_id" required placeholder="Contoh: batch-2024" />
          </div>
          <div class="form-group">
            <p class="text-sm text-muted">Tambahkan aturan minimal untuk setiap tim.</p>
            <div id="rules-list">
              <!-- Rules added dynamically -->
            </div>
            <button type="button" class="btn btn-secondary btn-small" data-add-rule>+ Tambah Aturan</button>
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
          <p class="confirmation-text">Apakah Anda yakin ingin melakukan tindakan ini?</p>
          <div class="form-group" data-rejection-reason-row hidden>
            <label>Alasan Penolakan</label>
            <textarea name="rejection_reason" rows="3" placeholder="Masukkan alasan penolakan..."></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary">Konfirmasi</button>
          </div>
        </form>
      </div>

      <!-- Edit User Modal -->
      <div class="modal" data-modal="edit-member" hidden>
         <div class="modal-header">
          <h3>Edit Member</h3>
           <button class="modal-close" data-close-modal>×</button>
         </div>
         <form class="modal-form" data-form="edit-member">
            <input type="hidden" name="user_id" />
            <div class="form-group">
               <label>Learning Path</label>
               <select name="learning_path">
                 <option value="Machine Learning">Machine Learning</option>
                  <option value="Cloud Computing">Cloud Computing</option>
                  <option value="Mobile Development">Mobile Development</option>
               </select>
            </div>
             <div class="form-actions">
                <button type="submit" class="btn btn-primary">Simpan</button>
             </div>
         </form>
      </div>

    </div>
  `;
}

window.renderGroupDetail = renderGroupDetail;

function renderGroupDetail(group) {
  return `
    <div class="group-detail-view">
      
      <!-- Info Header -->
      <div class="detail-overview">
         <div class="detail-avatar-lg">${(group.group_name || "?").charAt(0).toUpperCase()}</div>
         <div>
            <h2 class="detail-group-name">${group.group_name || "Tanpa Nama"}</h2>
            <div class="detail-badges">
                <span class="badge-pill">${group.batch_id || "-"}</span>
                <span class="status-indicator status-${group.status || "pending"}">${(group.status || "pending")}</span>
            </div>
         </div>
         <div class="detail-actions-top">
             <button class="btn-icon" data-open-edit-group="${group.group_id}" title="Edit Info Tim">✎</button>
         </div>
      </div>

      <hr class="detail-divider" />

      <!-- Members Section -->
      <div class="detail-section">
        <div class="section-title-row">
            <h4>Anggota Tim (${group.members?.length || 0})</h4>
            <div class="row-actions">
               <button class="btn-text-sm" data-add-member="${group.group_id}">+ Add</button>
            </div>
        </div>
        
        <div class="members-grid-list">
          ${group.members && group.members.length > 0
      ? group.members
        .map(
          (member) => `
              <div class="member-card-compact">
                <div class="member-info-compact">
                  <div class="member-name">${member.full_name || member.email || "Unknown"}</div>
                  <div class="member-role">${member.email}</div>
                  <div class="member-path">${member.learning_path || "No Path"}</div>
                </div>
                <button class="btn-icon-tiny" data-edit-member="${member.user_id}">✎</button>
              </div>
            `
        )
        .join("")
      : "<div class='empty-members'>Belum ada anggota</div>"
    }
        </div>
      </div>

      <!-- Validation Actions -->
      <div class="detail-validation-area">
         <h4>Tindakan Validasi</h4>
         <div class="action-buttons-row">
           ${group.status === 'pending' || group.status === 'rejected' ? `
            <button class="btn-success-block" data-validate-group="${group.group_id}" data-validate-status="accepted">
               ✅ Terima Tim
            </button>
            <button class="btn-danger-block" data-validate-group="${group.group_id}" data-validate-status="rejected">
               ❌ Tolak Tim
            </button>
           ` : ''}
           
           ${group.status === 'accepted' ? `
             <div class="accepted-banner">
                <span>Tim ini telah diterima.</span>
                ${group.project_status !== 'in_progress' ? `
                  <button class="btn-primary-sm" data-start-project="${group.group_id}">Mulai Proyek 🚀</button>
                ` : '<span class="text-success fw-bold">Proyek Sedang Berjalan</span>'}
             </div>
           ` : ''}
         </div>
      </div>

    </div>
  `;
}

