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
    <div class="admin-subpage-wrapper">
      
      <div class="container main-content-wrapper" style="margin-top: 30px;">
        <h2 class="mb-4 text-dark fw-bold">Individual Worksheet</h2>

        
        <!-- Toolbar -->
        <div class="admin-toolbar-card">
           <div class="toolbar-left">
              <div class="filter-box">
                <span class="text-sm font-semibold mr-2 text-muted">Filter:</span>
                <select class="filter-select-clean" id="worksheet-status-filter" data-worksheet-filter style="min-width: 200px;">
                  <option value="" ${!currentFilter ? 'selected' : ''}>Semua Status</option>
                  <option value="submitted" ${currentFilter === 'submitted' ? 'selected' : ''}>⏳ Menunggu Review</option>
                  <option value="approved" ${currentFilter === 'approved' ? 'selected' : ''}>✅ Disetujui</option>
                  <option value="rejected" ${currentFilter === 'rejected' ? 'selected' : ''}>❌ Ditolak</option>
                  <option value="late" ${currentFilter === 'late' ? 'selected' : ''}>⏰ Terlambat</option>
                </select>
              </div>
           </div>
           <div class="toolbar-right">
             <!-- Optional Export -->
           </div>
        </div>

        <!-- Table Card -->
        <div class="card list-card">
          <div class="table-responsive">
            ${hasError ? `
              <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">Gagal memuat data worksheet</p>
              </div>
            ` : worksheets.length === 0 ? `
              <div class="empty-state" style="padding: 60px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                <h3 style="margin: 0; font-size: 18px; color: #333;">Belum ada worksheet</h3>
                <p style="color: #666; margin-top: 8px;">Peserta belum mengirimkan laporan individu saat ini.</p>
              </div>
            ` : `
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Peserta</th>
                    <th>Periode</th>
                    <th>Aktivitas</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${worksheets.map(ws => `
                    <tr>
                      <td>
                        <div class="fw-bold">${ws.users?.name || 'Unknown'}</div>
                        <div class="text-xs text-muted">${ws.users?.email || 'N/A'}</div>
                      </td>
                      <td><span class="badge-pill">${formatDate(ws.period_start)} - ${formatDate(ws.period_end)}</span></td>
                      <td>
                        <div class="text-sm text-truncate" style="max-width: 300px;">
                            ${ws.activity_description || 'N/A'}
                        </div>
                      </td>
                      <td><span class="status-indicator status-${(ws.status || 'submitted').toLowerCase()}">${getStatusLabel(ws.status)}</span></td>
                      <td>
                        ${ws.status === 'submitted' ? `
                          <button class="btn-primary-sm" data-validate-worksheet="${ws.id}">Review</button>
                        ` : `
                          <span class="text-xs font-semibold text-muted">Reviewed</span>
                        `}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
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
            <label>Ubah Status</label>
            <select name="status" required>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="late">Terlambat</option>
            </select>
          </div>
          <div class="form-group">
            <label>Feedback (Opsional)</label>
            <textarea name="feedback" rows="4" placeholder="Berikan catatan perbaikan atau alasan penilaian..."></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Validasi</button>
          </div>
        </form>
      </div>

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
