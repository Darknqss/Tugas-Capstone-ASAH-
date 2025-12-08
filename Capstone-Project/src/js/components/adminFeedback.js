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
    <div class="container content-section">
      <div class="section-header">
        <h1 class="section-title">360 Feedback - Admin</h1>
        <p class="section-description">Export dan kelola data feedback 360 derajat</p>
      </div>

      <div class="admin-actions-bar">
        <button class="btn btn-primary" id="export-feedback-btn" data-export-feedback>
          📥 Export Data Feedback (CSV)
        </button>
      </div>

      <div class="card admin-table-card">
        ${hasError ? `
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <p class="empty-state-text">Gagal memuat data feedback</p>
          </div>
        ` : feedbackData.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">💬</div>
            <p class="empty-state-text">Belum ada data feedback</p>
            <p class="empty-state-subtext">Data feedback akan muncul setelah peserta mengisi penilaian</p>
          </div>
        ` : `
          <div class="data-table">
            <table>
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
                    <td>${fb.reviewer_name || 'N/A'}</td>
                    <td>${fb.reviewee_name || 'N/A'}</td>
                    <td>${fb.group_name || 'N/A'}</td>
                    <td>${getContributionLabel(fb.contribution)}</td>
                    <td>${fb.reason?.substring(0, 50) || 'N/A'}${fb.reason?.length > 50 ? '...' : ''}</td>
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

function getContributionLabel(contribution) {
  const labels = {
    'sangat_signifikan': 'Sangat Signifikan',
    'signifikan': 'Signifikan',
    'cukup': 'Cukup',
    'kurang': 'Kurang'
  };
  return labels[contribution] || contribution || 'N/A';
}
