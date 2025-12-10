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
                       <div class="fw-bold">${del.group?.group_name || 'N/A'}</div>
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
