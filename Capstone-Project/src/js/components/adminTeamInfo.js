import { readSession } from "../services/authService.js";
import {
  listAllGroups,
  validateGroupRegistration,
  setGroupRules,
  createGroup,
} from "../services/adminService.js";

export async function AdminTeamInfoPage() {
  const session = readSession();

  // Get groupId from URL params (menggunakan pathname + search, bukan hash)
  const urlParams = new URLSearchParams(window.location.search);
  const selectedGroupId = urlParams.get("groupId");

  // Fetch groups data
  let groupsData = [];
  let selectedGroup = null;
  let rulesData = [];

  try {
    const response = await listAllGroups();
    groupsData = response?.data || [];
    if (selectedGroupId) {
      selectedGroup = groupsData.find((g) => g.group_id === selectedGroupId);
    }
  } catch (error) {
    console.error("Error fetching groups:", error);
  }

  return `
    <div class="container content-section">
      <div class="section-header">
        <h1 class="section-title">Team Information - Admin</h1>
        <p class="section-description">Kelola registrasi tim, validasi komposisi, dan atur periode pendaftaran</p>
      </div>

      <!-- Action Buttons -->
      <div class="admin-actions-bar">
        <button class="btn btn-primary" data-admin-action="create-group">Buat Tim Baru</button>
        <button class="btn btn-outline" data-admin-action="set-rules">Atur Komposisi Tim</button>
        <button class="btn btn-outline" data-admin-action="export-data">Ekspor Data Tim</button>
        <button class="btn btn-outline" data-admin-action="randomize">Randomize Peserta</button>
      </div>

      <!-- Groups List -->
      <div class="card" style="margin-top: 24px;">
        <div class="card-header">
          <h2 class="card-title">Daftar Tim</h2>
          <div class="card-header-actions">
            <input type="text" class="search-input" placeholder="Cari tim..." data-search-groups />
            <select class="filter-select" data-filter-status>
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
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
              ${
                groupsData.length === 0
                  ? `<tr><td colspan="6" class="text-center">Belum ada tim terdaftar</td></tr>`
                  : groupsData
                      .map(
                        (group) => `
                  <tr data-group-id="${group.group_id}">
                    <td><strong>${group.group_name || "-"}</strong></td>
                    <td>${group.batch_id || "-"}</td>
                    <td><span class="status-badge status-badge--${group.status || "pending"}">${(group.status || "pending").toUpperCase()}</span></td>
                    <td>${group.members?.length || 0} anggota</td>
                    <td><span class="status-badge status-badge--${group.project_status || "not_started"}">${(group.project_status || "not_started").replace("_", " ").toUpperCase()}</span></td>
                    <td>
                      <button class="btn-link" data-view-group="${group.group_id}">Detail</button>
                      <button class="btn-link" data-edit-group="${group.group_id}">Edit</button>
                    </td>
                  </tr>
                `
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Group Detail Panel -->
      <div class="card admin-detail-panel" data-group-detail-panel ${selectedGroup ? '' : 'hidden'} style="margin-top: 24px;">
        <div class="card-header">
          <h2 class="card-title">Detail Tim</h2>
          <button class="btn-link" data-close-detail>✕ Tutup</button>
        </div>
        <div data-group-detail-content>
          ${selectedGroup ? renderGroupDetail(selectedGroup) : '<p class="text-muted">Pilih tim untuk melihat detail</p>'}
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
            <label>Learning Path</label>
            <select name="learning_path" required>
              <option value="">Pilih Learning Path</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="Cloud Computing">Cloud Computing</option>
              <option value="Front-End">Front-End</option>
              <option value="Back-End">Back-End</option>
            </select>
          </div>
          <div class="form-group">
            <label>Operator</label>
            <select name="operator" required>
              <option value=">=">>=</option>
              <option value="<="><=</option>
              <option value="==">==</option>
            </select>
          </div>
          <div class="form-group">
            <label>Nilai Minimum</label>
            <input type="number" name="value" required placeholder="Contoh: 2" min="1" />
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
          <h3>Validasi Tim</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <form class="modal-form" data-form="validate-group">
          <input type="hidden" name="group_id" data-group-id-input />
          <div class="form-group">
            <label>Status</label>
            <select name="status" required data-validate-status>
              <option value="accepted">Diterima</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
          <div class="form-group" data-rejection-reason-group hidden>
            <label>Alasan Penolakan</label>
            <textarea name="rejection_reason" rows="4" placeholder="Masukkan alasan penolakan..."></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary">Validasi</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderGroupDetail(group) {
  return `
    <div class="group-detail">
      <div class="detail-section">
        <h3>Informasi Tim</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Nama Tim:</span>
            <span class="detail-value">${group.group_name || "-"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Batch ID:</span>
            <span class="detail-value">${group.batch_id || "-"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status:</span>
            <span class="detail-value"><span class="status-badge status-badge--${group.status || "pending"}">${(group.status || "pending").toUpperCase()}</span></span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status Proyek:</span>
            <span class="detail-value"><span class="status-badge status-badge--${group.project_status || "not_started"}">${(group.project_status || "not_started").replace("_", " ").toUpperCase()}</span></span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Anggota Tim</h3>
        <div class="members-list">
          ${
            group.members && group.members.length > 0
              ? group.members
                  .map(
                    (member) => `
              <div class="member-card">
                <div class="member-info">
                  <strong>${member.full_name || member.email || "Unknown"}</strong>
                  <span class="member-email">${member.email || "-"}</span>
                </div>
                <div class="member-actions">
                  <button class="btn-link btn-small" data-edit-member="${member.user_id}">Edit</button>
                </div>
              </div>
            `
                  )
                  .join("")
              : "<p class='text-muted'>Belum ada anggota</p>"
          }
        </div>
        <div class="detail-actions" style="margin-top: 16px;">
          <button class="btn btn-outline btn-small" data-upload-members="${group.group_id}">Upload Anggota</button>
          <button class="btn btn-outline btn-small" data-add-member="${group.group_id}">Tambah Anggota</button>
        </div>
      </div>

      <div class="detail-section">
        <h3>Aksi Validasi</h3>
        <div class="validation-actions">
          <button class="btn btn-primary" data-validate-group="${group.group_id}" data-validate-status="accepted">Terima Tim</button>
          <button class="btn btn-danger" data-validate-group="${group.group_id}" data-validate-status="rejected">Tolak Tim</button>
          ${group.status === "accepted" ? `<button class="btn btn-outline" data-start-project="${group.group_id}">Mulai Proyek</button>` : ""}
        </div>
      </div>
    </div>
  `;
}

