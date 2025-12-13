import { listAllWorksheets, validateWorksheet, listPeriods } from "../services/adminService.js";

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
                  <option value="completed" ${currentFilter === 'completed' ? 'selected' : ''}>✅ Selesai</option>
                  <option value="completed_late" ${currentFilter === 'completed_late' ? 'selected' : ''}>⚠️ Selesai Terlambat</option>
                  <option value="missed" ${currentFilter === 'missed' ? 'selected' : ''}>❌ Tidak Selesai</option>
                </select>
              </div>
           </div>
           <div class="toolbar-right">
             <button class="btn btn-outline btn-sm" data-open-modal="manage-periods" style="margin-right: 8px;">
               📅 Lihat & Kelola Periode
             </button>
             <button class="btn btn-outline btn-sm" data-manual-validate-all style="margin-right: 8px;">
               ⚡ Validasi Manual Semua
             </button>
             <button class="btn btn-primary btn-sm" data-export-worksheets>
               📊 Export Spreadsheet
             </button>
           </div>
        </div>

        <!-- Deadline Settings Card -->
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h3 class="card-title" style="margin: 0;">⚙️ Pengaturan Validasi Otomatis</h3>
            <button class="btn btn-sm btn-outline" data-toggle-deadline-settings>
              ${localStorage.getItem('worksheet-deadline-enabled') === 'true' ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
          <div class="card-body" data-deadline-settings-panel ${localStorage.getItem('worksheet-deadline-enabled') === 'true' ? '' : 'hidden'} style="display: ${localStorage.getItem('worksheet-deadline-enabled') === 'true' ? 'block' : 'none'};">
            <form data-form="worksheet-deadline">
              <div class="form-group">
                <label>Deadline Validasi Otomatis</label>
                <input 
                  type="datetime-local" 
                  name="deadline" 
                  value="${localStorage.getItem('worksheet-deadline') || ''}" 
                  class="form-control"
                  id="worksheet-deadline-input"
                />
                <small class="form-text text-muted">
                  Validasi akan berjalan secara otomatis pada waktu yang ditentukan. 
                  Contoh: 20 Oktober 2025 pukul 17:00 WIB
                </small>
              </div>
              <div class="form-group">
                <label>
                  <input 
                    type="checkbox" 
                    name="auto_validate_enabled" 
                    ${localStorage.getItem('worksheet-deadline-enabled') === 'true' ? 'checked' : ''}
                  />
                  Aktifkan Validasi Otomatis
                </label>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Simpan Pengaturan</button>
                <button type="button" class="btn btn-outline" data-cancel-deadline>Batal</button>
              </div>
              ${localStorage.getItem('worksheet-deadline') ? `
                <div class="alert alert-info" style="margin-top: 12px; padding: 12px; background: #e7f3ff; border-radius: 6px;">
                  <strong>Deadline Aktif:</strong> ${new Date(localStorage.getItem('worksheet-deadline')).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  })} WIB
                </div>
              ` : ''}
            </form>
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
                    <th style="width: 40px;">
                      <input type="checkbox" id="select-all-worksheets" data-select-all-worksheets />
                    </th>
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
                        ${ws.status === 'submitted' ? `
                          <input type="checkbox" class="worksheet-checkbox" data-worksheet-id="${ws.id}" />
                        ` : ''}
                      </td>
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
                      <td><span class="status-badge status-badge--${(ws.status || 'submitted').toLowerCase()}">${getStatusLabel(ws.status)}</span></td>
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
              <option value="completed">Selesai</option>
              <option value="completed_late">Selesai Terlambat</option>
              <option value="missed">Tidak Selesai</option>
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

      <!-- Create Period Modal -->
      <div class="modal" data-modal="manage-periods" hidden>
        <div class="modal-header">
          <h3>Buat Periode Worksheet</h3>
          <button class="modal-close" data-close-modal>×</button>
        </div>
        <form class="modal-form" data-form="create-period">
          <div class="form-group">
            <label>Judul Periode</label>
            <input type="text" name="title" required placeholder="Contoh: Worksheet Minggu 1" />
          </div>
          <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label>Tanggal Mulai</label>
              <input type="date" name="start_date" required />
            </div>
            <div>
              <label>Tanggal Selesai</label>
              <input type="date" name="end_date" required />
            </div>
          </div>
          <div class="form-group">
             <label>Batch ID</label>
             <input type="text" name="batch_id" required placeholder="asah-batch-1" value="asah-batch-1" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
            <button type="submit" class="btn btn-primary">Buat Periode</button>
          </div>
        </form>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <h4 style="margin: 0; font-size: 16px; font-weight: 700; color: #333; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">📋</span> Daftar Periode Aktif
                </h4>
                <span style="font-size: 12px; color: #666; background: #f5f5f5; padding: 4px 10px; border-radius: 12px;">Auto-refresh</span>
            </div>
            <div id="periods-list-container" style="max-height: 300px; overflow-y: auto; background: #fafafa; border-radius: 8px; padding: 4px;">
                <p class="text-muted text-center" style="padding: 20px;">Memuat periode...</p>
            </div>
        </div>
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
    'completed': 'Selesai',
    'completed_late': 'Selesai Terlambat',
    'missed': 'Tidak Selesai',
    'approved': 'Disetujui', // Legacy support
    'rejected': 'Ditolak', // Legacy support
    'late': 'Terlambat' // Legacy support
  };
  return labels[status] || status || 'Unknown';
}

// Function to attach to window or export to be called when modal opens
// Since we don't have a central event bus easily accessible, we'll attach a listener to the button
// But simpler: we just modify app.js to call this refresh or we use a mutation observer? 
// Actually, let's just expose a function and call it from app.js when opening modal?
// Or better, let's auto-load it when the page renders? No, inefficient.
// Let's add a global event listener for the button here.

document.addEventListener('click', async (e) => {
  if (e.target.closest('[data-open-modal="manage-periods"]')) {
    const container = document.getElementById('periods-list-container');
    if (!container) return;

    try {
      container.innerHTML = '<p class="text-muted text-center">Memuat periode...</p>';
      const response = await listPeriods();
      const periods = response.data || [];

      if (periods.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Belum ada periode dibuat.</p>';
        return;
      }

      container.innerHTML = `
        <div style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-top: 10px;">
          <table class="modern-table" style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead style="background-color: #f8f9fa; border-bottom: 2px solid #eee;">
              <tr>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #444; text-transform: uppercase; letter-spacing: 0.5px;">Judul Periode</th>
                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #444; text-transform: uppercase; letter-spacing: 0.5px;">Rentang Tanggal</th>
                <th style="padding: 12px 16px; text-align: right; font-weight: 600; color: #444; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${periods.map((p, index) => {
        const isFinished = new Date(p.end_date) < new Date();
        return `
                <tr style="border-bottom: 1px solid #eee; background-color: ${index % 2 === 0 ? '#fff' : '#fafafa'}; transition: background 0.2s;">
                  <td style="padding: 14px 16px; color: #333; font-weight: 500;">${p.title}</td>
                  <td style="padding: 14px 16px; color: #666;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span>📅</span>
                      <span>${formatDate(p.start_date)} - ${formatDate(p.end_date)}</span>
                    </div>
                  </td>
                  <td style="padding: 14px 16px; text-align: right;">
                    ${isFinished
            ? '<span style="font-size: 11px; padding: 4px 12px; border-radius: 20px; background: #eee; color: #777; font-weight: 600;">Selesai</span>'
            : `<div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                 <span style="font-size: 11px; padding: 4px 12px; border-radius: 20px; background: #e8f5e9; color: #2e7d32; font-weight: 600;">Aktif</span>
                 <button class="btn-xs btn-outline" data-remind-period="${p.id}" title="Kirim Email Pengingat" style="border-radius: 50%; width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center; border-color: #f59e0b; color: #f59e0b;">
                   🔔
                 </button>
               </div>`
          }
                  </td>
                </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      console.error("Failed to load periods:", error);
      container.innerHTML = '<p class="text-danger text-center">Gagal memuat periode.</p>';
    }
  }

  // Handle Remind Button Click
  if (e.target.closest('[data-remind-period]')) {
    const btn = e.target.closest('[data-remind-period]');
    const periodId = btn.dataset.remindPeriod;

    if (!confirm('Kirim email pengingat kepada mahasiswa yang belum mengumpulkan tugas pada periode ini?')) return;

    try {
      btn.disabled = true;
      btn.innerHTML = '...';
      const { remindPeriodStudents } = await import('../services/adminService.js');
      const response = await remindPeriodStudents(periodId);
      alert(`Pengingat berhasil dikirim! ${response.data.reminded_count} mahasiswa diingatkan.`);
    } catch (error) {
      console.error('Failed to send reminder:', error);
      alert(error.message || 'Gagal mengirim pengingat.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🔔';
      }
    }
  }
});
