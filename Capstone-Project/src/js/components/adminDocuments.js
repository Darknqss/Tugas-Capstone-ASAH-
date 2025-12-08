import { listDeliverables } from "../services/adminService.js";

export async function AdminDocumentsPage() {
  let deliverables = [];
  let hasError = false;

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

  return `
    <div class="container content-section">
      <div class="section-header">
        <h1 class="section-title">Dokumen & Timeline - Admin</h1>
        <p class="section-description">Kelola dokumen deliverables yang dikumpulkan peserta</p>
      </div>

      <div class="admin-actions-bar">
        <div class="filter-group">
          <label>🔍 Filter Jenis Dokumen:</label>
          <select id="deliverable-type-filter" data-deliverable-filter>
            <option value="" ${!currentFilter ? 'selected' : ''}>Semua Jenis</option>
            <option value="PROJECT_PLAN" ${currentFilter === 'PROJECT_PLAN' ? 'selected' : ''}>📋 Project Plan</option>
            <option value="FINAL_REPORT" ${currentFilter === 'FINAL_REPORT' ? 'selected' : ''}>📄 Final Report</option>
            <option value="PRESENTATION_VIDEO" ${currentFilter === 'PRESENTATION_VIDEO' ? 'selected' : ''}>🎥 Presentation Video</option>
          </select>
        </div>
      </div>

      <div class="card admin-table-card">
        ${hasError ? `
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <p class="empty-state-text">Gagal memuat data deliverables</p>
          </div>
        ` : deliverables.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <p class="empty-state-text">Belum ada deliverables</p>
            <p class="empty-state-subtext">Deliverables yang dikumpulkan akan muncul di sini</p>
          </div>
        ` : `
          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>Nama Tim</th>
                  <th>Jenis Dokumen</th>
                  <th>File Path</th>
                  <th>Tanggal Submit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${deliverables.map(del => `
                  <tr>
                    <td><strong>${del.group?.group_name || 'N/A'}</strong></td>
                    <td>
                      <span class="document-type-badge">
                        ${getDocumentTypeLabel(del.document_type) === 'Project Plan' ? '📋' : getDocumentTypeLabel(del.document_type) === 'Final Report' ? '📄' : '🎥'}
                        ${getDocumentTypeLabel(del.document_type)}
                      </span>
                    </td>
                    <td><a href="${del.file_path}" target="_blank" class="link-primary" rel="noopener noreferrer">🔗 Lihat File</a></td>
                    <td>${formatDateTime(del.submitted_at)}</td>
                    <td><span class="status-badge status-badge--${(del.status || 'SUBMITTED').toLowerCase()}">${getStatusLabel(del.status)}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
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
