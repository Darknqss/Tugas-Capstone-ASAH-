import { listAllWorksheets, validateWorksheet } from "../services/adminService.js";

export async function AdminWorksheetPage() {
  let worksheets = [];
  let hasError = false;

  // Get filter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get("status") || null;
  const currentFilter = urlParams.get("status") || "";

  try {
    const response = await listAllWorksheets(status);
    worksheets = response?.data || [];
  } catch (error) {
    console.error("Error fetching worksheets:", error);
    hasError = true;
  }

  return `
    <div class="container content-section">
      <div class="section-header">
        <h1 class="section-title">Individual Worksheet - Admin</h1>
        <p class="section-description">Review dan validasi worksheet individu peserta capstone</p>
      </div>

      <div class="admin-actions-bar">
        <div class="filter-group">
          <label>🔍 Filter Status:</label>
          <select id="worksheet-status-filter" data-worksheet-filter>
            <option value="" ${!currentFilter ? 'selected' : ''}>Semua Status</option>
            <option value="submitted" ${currentFilter === 'submitted' ? 'selected' : ''}>⏳ Menunggu Review</option>
            <option value="approved" ${currentFilter === 'approved' ? 'selected' : ''}>✅ Disetujui</option>
            <option value="rejected" ${currentFilter === 'rejected' ? 'selected' : ''}>❌ Ditolak</option>
            <option value="late" ${currentFilter === 'late' ? 'selected' : ''}>⏰ Terlambat</option>
          </select>
        </div>
      </div>

      <div class="card admin-table-card">
        ${hasError ? `
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <p class="empty-state-text">Gagal memuat data worksheet</p>
          </div>
        ` : worksheets.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <p class="empty-state-text">Belum ada worksheet</p>
            <p class="empty-state-subtext">Worksheet yang dikumpulkan akan muncul di sini</p>
          </div>
        ` : `
          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Periode</th>
                  <th>Aktivitas</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${worksheets.map(ws => `
                  <tr>
                    <td><strong>${ws.users?.name || 'N/A'}</strong></td>
                    <td>${ws.users?.email || 'N/A'}</td>
                    <td><span class="period-badge">${formatDate(ws.period_start)} - ${formatDate(ws.period_end)}</span></td>
                    <td class="activity-cell">${ws.activity_description?.substring(0, 60) || 'N/A'}${ws.activity_description?.length > 60 ? '...' : ''}</td>
                    <td><span class="status-badge status-badge--${ws.status || 'submitted'}">${getStatusLabel(ws.status)}</span></td>
                    <td>
                      ${ws.status === 'submitted' ? `
                        <button class="btn btn-sm btn-primary" data-validate-worksheet="${ws.id}">✏️ Review</button>
                      ` : ws.status === 'approved' ? `
                        <span class="status-badge status-badge--approved">✅ ${getStatusLabel(ws.status)}</span>
                      ` : ws.status === 'rejected' ? `
                        <span class="status-badge status-badge--rejected">❌ ${getStatusLabel(ws.status)}</span>
                      ` : `
                        <span class="status-badge status-badge--${ws.status || 'submitted'}">${getStatusLabel(ws.status)}</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Validate Worksheet Modal -->
      <div class="modal-backdrop" data-modal-backdrop hidden></div>
      <div class="modal" data-modal="validate-worksheet" hidden>
        <div class="modal-header">
          <h3>Validasi Worksheet</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <form class="modal-form" data-form="validate-worksheet">
          <input type="hidden" name="worksheet_id" data-worksheet-id-input />
          <div class="form-group">
            <label>Status</label>
            <select name="status" required>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="late">Terlambat</option>
            </select>
          </div>
          <div class="form-group">
            <label>Feedback</label>
            <textarea name="feedback" rows="4" placeholder="Berikan feedback untuk worksheet ini"></textarea>
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

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusLabel(status) {
  const labels = {
    'submitted': 'Menunggu Review',
    'approved': 'Disetujui',
    'rejected': 'Ditolak',
    'late': 'Terlambat'
  };
  return labels[status] || status || 'Unknown';
}
