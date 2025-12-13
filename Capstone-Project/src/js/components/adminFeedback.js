import { exportFeedbackData } from "../services/adminService.js";

export async function AdminFeedbackPage() {
  let feedbackData = [];
  let hasError = false;

  try {
    const response = await exportFeedbackData();
    feedbackData = response?.data || [];
  } catch (error) {
    console.error("Error fetching feedback data:", error);
    hasError = true;
  }

  return `
    <div class="admin-subpage-wrapper">
      
      <div class="container main-content-wrapper" style="margin-top: 30px;">
         <h2 class="mb-4 text-dark fw-bold">360 Feedback</h2>

        
        <!-- Toolbar -->
        <div class="admin-toolbar-card">
           <div class="toolbar-left">
              <span class="text-sm text-muted">Total Data: <strong>${feedbackData.length}</strong> Entri</span>
           </div>
           <div class="toolbar-right">
              <button class="btn-primary-icon" id="export-feedback-btn" data-export-feedback>
                <span>📥</span> Download CSV
              </button>
           </div>
        </div>

        <!-- Table Card -->
        <div class="card list-card">
          <div class="table-responsive">
            ${hasError ? `
              <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">Gagal memuat data feedback</p>
              </div>
            ` : feedbackData.length === 0 ? `
              <div class="empty-state" style="padding: 60px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
                <h3 style="margin: 0; font-size: 18px; color: #333;">Belum ada feedback</h3>
                <p style="color: #666; margin-top: 8px;">Peserta akan mengisi penilaian di akhir periode.</p>
              </div>
            ` : `
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Reviewer</th>
                    <th>Reviewee</th>
                    <th>Nama Tim</th>
                    <th>Kontribusi</th>
                    <th>Alasan</th>
                  </tr>
                </thead>
                <tbody>
                  ${feedbackData.map(fb => `
                    <tr>
                      <td>
                        <div class="fw-bold text-dark">${fb.reviewer_name || 'N/A'}</div>
                      </td>
                      <td>
                        <div class="fw-bold text-dark">${fb.reviewee_name || 'N/A'}</div>
                      </td>
                      <td><span class="badge-pill">${fb.group_name || 'N/A'}</span></td>
                      <td>${getContributionLabel(fb.contribution)}</td>
                      <td>
                         <div class="text-sm text-muted text-truncate" style="max-width: 300px;" title="${fb.reason || ''}">
                             ${fb.reason || '-'}
                         </div>
                      </td>
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

function getContributionLabel(contribution) {
  const labels = {
    'sangat_signifikan': 'Sangat Signifikan',
    'signifikan': 'Signifikan',
    'cukup': 'Cukup',
    'kurang': 'Kurang'
  };
  return labels[contribution] || contribution || 'N/A';
}
