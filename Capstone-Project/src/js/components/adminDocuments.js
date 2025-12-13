import { listDeliverables, getTimeline } from "../services/adminService.js";

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  };
  return date.toLocaleDateString('id-ID', options);
}

// Helper function to get status badge class
function getStatusClass(startAt, endAt) {
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (now < start) {
    return 'timeline-status--upcoming';
  } else if (now >= start && now <= end) {
    return 'timeline-status--active';
  } else {
    return 'timeline-status--completed';
  }
}

export async function AdminDocumentsPage() {
  let deliverables = [];
  let hasError = false;
  let timelineData = [];
  let timelineError = false;

  // Get filter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const documentType = urlParams.get("document_type") || null;
  const currentFilter = urlParams.get("document_type") || "";

  try {
    const response = await listDeliverables(documentType);
    deliverables = response?.data || [];
  } catch (error) {
    console.error("Error fetching deliverables:", error);
    hasError = true;
  }

  try {
    const response = await getTimeline();
    timelineData = response?.data || [];

    // Sort by status: completed first, then active, then upcoming
    timelineData.sort((a, b) => {
      const statusA = getStatusClass(a.start_at, a.end_at);
      const statusB = getStatusClass(b.start_at, b.end_at);

      // Define order: completed (0), active (1), upcoming (2)
      const order = {
        'timeline-status--completed': 0,
        'timeline-status--active': 1,
        'timeline-status--upcoming': 2
      };

      const orderA = order[statusA] ?? 3;
      const orderB = order[statusB] ?? 3;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // If same status, sort by start date (earliest first for completed, latest first for upcoming)
      const dateA = new Date(a.start_at);
      const dateB = new Date(b.start_at);

      if (statusA === 'timeline-status--upcoming') {
        return dateA - dateB; // Upcoming: earliest first
      } else {
        return dateB - dateA; // Completed/Active: latest first
      }
    });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    timelineError = true;
  }

  return `
    <div class="admin-subpage-wrapper">
      
      <div class="container main-content-wrapper" style="margin-top: 30px;">
        <h2 class="mb-4 text-dark fw-bold">Dokumen & Timeline</h2>
        
        <!-- Toolbar -->
        <div class="admin-toolbar-card">
           <div class="toolbar-left">
              <div class="filter-box">
                <span class="text-sm font-semibold mr-2 text-muted">🔍 Filter:</span>
                <select class="filter-select-clean" id="deliverable-type-filter" data-deliverable-filter style="min-width: 200px;">
                  <option value="" ${!currentFilter ? 'selected' : ''}>📂 Semua Dokumen</option>
                  <option value="PROJECT_PLAN" ${currentFilter === 'PROJECT_PLAN' ? 'selected' : ''}>📋 Project Plan</option>
                  <option value="FINAL_REPORT" ${currentFilter === 'FINAL_REPORT' ? 'selected' : ''}>📄 Final Report</option>
                  <option value="PRESENTATION_VIDEO" ${currentFilter === 'PRESENTATION_VIDEO' ? 'selected' : ''}>🎥 Presentation Video</option>
                </select>
              </div>
           </div>
           <div class="toolbar-right">
              <!-- Optional: Add bulk actions or export if needed later -->
              <button class="btn-primary" data-open-modal="create-timeline" style="display: flex; align-items: center; gap: 8px;">
                <span>📅</span>
                <span>Buat Timeline</span>
              </button>
           </div>
        </div>

        <!-- Table Card -->
        <div class="card list-card">
          <div class="table-responsive">
          ${hasError ? `
            <div class="empty-state">
              <div class="empty-state-icon">⚠️</div>
              <p class="empty-state-text">Gagal memuat data deliverables</p>
            </div>
          ` : deliverables.length === 0 ? `
            <div class="empty-state" style="padding: 60px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📂</div>
              <h3 style="margin: 0; font-size: 18px; color: #333;">Belum ada dokumen</h3>
              <p style="color: #666; margin-top: 8px;">Tim belum mengumpulkan dokumen apapun untuk kategori ini.</p>
            </div>
          ` : `
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Nama Tim</th>
                  <th>Jenis Dokumen</th>
                  <th>File</th>
                  <th>Tanggal Submit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${deliverables.map(del => `
                  <tr>
                    <td>
                       <div class="fw-bold">${del.group_name || del.group?.group_name || 'N/A'}</div>
                    </td>
                    <td>
                      <span class="document-type-badge">
                        ${getDocumentTypeLabel(del.document_type) === 'Project Plan' ? '📋' : getDocumentTypeLabel(del.document_type) === 'Final Report' ? '📄' : '🎥'}
                        ${getDocumentTypeLabel(del.document_type)}
                      </span>
                    </td>
                    <td>
                      <a href="${del.file_path}" target="_blank" class="btn-link" rel="noopener noreferrer">
                        🔗 Buka File
                      </a>
                    </td>
                    <td>${formatDateTime(del.submitted_at)}</td>
                    <td><span class="status-indicator status-${(del.status || 'SUBMITTED').toLowerCase()}">${getStatusLabel(del.status)}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
          </div>
        </div>

        <!-- Timeline Section -->
        <div style="margin-top: 40px;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #333;">Timeline Pengerjaan</h2>
          
          ${timelineError ? `
            <div class="card">
              <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">Gagal memuat data timeline</p>
              </div>
            </div>
          ` : timelineData.length === 0 ? `
            <div class="card">
              <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p class="empty-state-text">Timeline belum tersedia</p>
                <p class="empty-state-subtext">Jadwal milestone dan deadline akan muncul di sini</p>
              </div>
            </div>
          ` : `
            <div class="timeline-wrapper">
              ${timelineData.map((item, index) => {
    const isDeadline = item.title?.includes('[DEADLINE]');
    const statusClass = getStatusClass(item.start_at, item.end_at);
    const isSameDay = new Date(item.start_at).toDateString() === new Date(item.end_at).toDateString();

    return `
                  <div class="timeline-item ${statusClass}" data-timeline-item>
                    <div class="timeline-marker">
                      <div class="timeline-marker-dot"></div>
                      ${index < timelineData.length - 1 ? '<div class="timeline-line"></div>' : ''}
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <h3 class="timeline-title">
                          ${isDeadline ? '<span class="timeline-badge timeline-badge--deadline">DEADLINE</span>' : ''}
                          ${item.title || 'Untitled'}
                        </h3>
                        <span class="timeline-status ${statusClass}">
                          ${statusClass === 'timeline-status--active' ? 'Sedang Berlangsung' :
        statusClass === 'timeline-status--completed' ? 'Selesai' : 'Akan Datang'}
                        </span>
                      </div>
                      <div class="timeline-dates">
                        <div class="timeline-date-item">
                          <span class="timeline-date-label">${isSameDay ? 'Tanggal' : 'Mulai'}:</span>
                          <span class="timeline-date-value">${formatDate(item.start_at)}</span>
                        </div>
                        ${!isSameDay ? `
                          <div class="timeline-date-item">
                            <span class="timeline-date-label">Selesai:</span>
                            <span class="timeline-date-value">${formatDate(item.end_at)}</span>
                          </div>
                        ` : ''}
                      </div>
                      ${item.description ? `
                        <p class="timeline-description">${item.description}</p>
                      ` : ''}
                      
                      <!-- Action Buttons -->
                      <div class="timeline-actions" style="margin-top: 12px; display: flex; gap: 8px; justify-content: flex-start;">
                          <button class="btn-sm btn-outline" data-edit-timeline='${JSON.stringify(item).replace(/'/g, "&#39;")}' title="Edit Timeline" style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; font-size: 13px; color: #4b5563; border-color: #d1d5db; background: white; transition: all 0.2s;">
                              <span>✏️</span> Edit
                          </button>
                          <button class="btn-sm btn-outline-danger" data-delete-timeline="${item.id}" title="Hapus Timeline" style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; font-size: 13px; color: #ef4444; border-color: #fca5a5; background: white; transition: all 0.2s;">
                              <span>🗑️</span> Hapus
                          </button>
                      </div>

                    </div>
                  </div>
                `;
  }).join('')}
            </div>
          `}
        </div>
        
      </div>
    </div>
    </div>

    <!-- Create Timeline Modal -->
    <div class="modal-backdrop" data-modal-backdrop hidden></div>
    <div class="modal" data-modal="create-timeline" hidden>
      <div class="modal-header">
        <h3>Buat Jadwal Timeline</h3>
        <button class="modal-close" data-close-modal>×</button>
      </div>
      <form class="modal-form" data-form="create-timeline">
        <div class="alert alert-info" style="font-size: 13px; margin-bottom: 16px; background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 10px; border-radius: 6px;">
           ℹ️ <strong>Info:</strong> Pendaftaran batch di Admin akan langsung diatur dari jadwal timeline ini (Kata kunci validasi: Register).
        </div>
        <div class="form-group">
          <label>Judul Timeline</label>
          <input type="text" name="title" required placeholder="Contoh: Pengumpulan Laporan Bab 1" />
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea name="description" rows="3" placeholder="Deskripsi singkat kegiatan..."></textarea>
        </div>
        <div class="form-group">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label>Tanggal Mulai</label>
              <input type="datetime-local" name="start_at" required />
            </div>
            <div>
              <label>Tanggal Selesai</label>
              <input type="datetime-local" name="end_at" required />
            </div>
          </div>
        </div>
        <div class="form-group">
           <label>Batch ID</label>
           <input type="text" name="batch_id" required placeholder="Contoh: asah-batch-1" value="asah-batch-1" />
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Jadwal</button>
        </div>
      </form>
    </div>

    <!-- Edit Timeline Modal -->
    <div class="modal" data-modal="edit-timeline" hidden>
      <div class="modal-header">
        <h3>Edit Jadwal Timeline</h3>
        <button class="modal-close" data-close-modal>×</button>
      </div>
      <form class="modal-form" data-form="edit-timeline">
        <input type="hidden" name="id" data-id-input />
        <div class="alert alert-info" style="font-size: 13px; margin-bottom: 16px; background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 10px; border-radius: 6px;">
           ℹ️ <strong>Info:</strong> Pendaftaran batch di Admin akan langsung diatur dari jadwal timeline ini (Kata kunci validasi: Register).
        </div>
        <div class="form-group">
          <label>Judul Timeline</label>
          <input type="text" name="title" required placeholder="Contoh: Pengumpulan Laporan Bab 1" />
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea name="description" rows="3" placeholder="Deskripsi singkat kegiatan..."></textarea>
        </div>
        <div class="form-group">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label>Tanggal Mulai</label>
              <input type="datetime-local" name="start_at" required />
            </div>
            <div>
              <label>Tanggal Selesai</label>
              <input type="datetime-local" name="end_at" required />
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-outline" data-close-modal>Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
        </div>
      </form>
    </div>
  `;
}

function getDocumentTypeLabel(type) {
  const labels = {
    'PROJECT_PLAN': 'Project Plan',
    'FINAL_REPORT': 'Final Report',
    'PRESENTATION_VIDEO': 'Presentation Video'
  };
  return labels[type] || type || 'N/A';
}

function getStatusLabel(status) {
  const labels = {
    'SUBMITTED': 'Terkirim',
    'REVIEWED': 'Direview',
    'APPROVED': 'Disetujui',
    'REJECTED': 'Ditolak'
  };
  return labels[status] || status || 'Unknown';
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
