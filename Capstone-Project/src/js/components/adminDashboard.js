import { readSession } from "../services/authService.js";
import { listAllGroups } from "../services/adminService.js";

export async function AdminDashboardPage() {
  const session = readSession();
  const displayName =
    session?.user?.full_name || session?.user?.email || "Admin";

  // Fetch analytics data
  let groupsData = [];
  let stats = {
    totalGroups: 0,
    acceptedGroups: 0,
    pendingGroups: 0,
    rejectedGroups: 0,
    inProgressProjects: 0,
  };

  try {
    const response = await listAllGroups();
    groupsData = response?.data || [];
    stats.totalGroups = groupsData.length;
    stats.acceptedGroups = groupsData.filter(
      (g) => g.status === "accepted"
    ).length;
    stats.pendingGroups = groupsData.filter(
      (g) => g.status === "pending"
    ).length;
    stats.rejectedGroups = groupsData.filter(
      (g) => g.status === "rejected"
    ).length;
    stats.inProgressProjects = groupsData.filter(
      (g) => g.project_status === "in_progress"
    ).length;
  } catch (error) {
    console.error("Error fetching groups:", error);
  }

  // Get current date for greeting
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const currentDate = new Date().toLocaleDateString('id-ID', dateOptions);

  return `
    <div class="admin-dashboard-wrapper">
      <!-- Modern Hero Section -->
      <section class="admin-hero">
        <div class="container">
          <div class="admin-hero-content">
            <div class="hero-text">
              <span class="hero-date">${currentDate}</span>
              <h1 class="hero-greeting">Selamat Datang, ${displayName} 👋</h1>
              <p class="hero-message">Berikut adalah ringkasan aktivitas Capstone Project hari ini.</p>
            </div>
          </div>
        </div>
        <div class="hero-pattern"></div>
      </section>

      <div class="container main-dashboard-content">
        <!-- Stats Overview Row -->
        <div class="stats-overview-grid">
          <div class="stat-card-modern stat-total">
            <div class="stat-icon-wrapper">
              <div class="stat-icon">👥</div>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Tim</span>
              <span class="stat-number">${stats.totalGroups}</span>
            </div>
          </div>
          
          <div class="stat-card-modern stat-success">
            <div class="stat-icon-wrapper">
              <div class="stat-icon">✅</div>
            </div>
            <div class="stat-info">
              <span class="stat-label">Tim Diterima</span>
              <span class="stat-number">${stats.acceptedGroups}</span>
            </div>
          </div>

          <div class="stat-card-modern stat-warning">
            <div class="stat-icon-wrapper">
              <div class="stat-icon">⏳</div>
            </div>
            <div class="stat-info">
              <span class="stat-label">Menunggu Validasi</span>
              <span class="stat-number">${stats.pendingGroups}</span>
            </div>
          </div>

          <div class="stat-card-modern stat-active">
            <div class="stat-icon-wrapper">
              <div class="stat-icon">🚀</div>
            </div>
            <div class="stat-info">
              <span class="stat-label">Proyek Berjalan</span>
              <span class="stat-number">${stats.inProgressProjects}</span>
            </div>
          </div>
        </div>

        <!-- Main Feature Grid (The 4 Requested Areas) -->
        <h2 class="section-heading-lg">Akses Cepat & Kelola</h2>
        <div class="feature-card-grid">
          <!-- Team Information -->
          <a href="/admin-team-information" class="feature-card color-blue-gradient" data-link style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div class="feature-icon-lg" style="margin-bottom: 12px;">👥</div>
            <div class="feature-content">
              <h3>Team Information</h3>
              <p>Kelola data tim, validasi pendaftaran, dan lihat detail anggota mahasiswa.</p>
            </div>
            <div class="feature-action" style="justify-content: center; width: 100%;">
              <span>Kelola Tim</span>
              <div class="feature-arrow">→</div>
            </div>
          </a>

          <!-- Dokumen & Timeline -->
          <a href="/admin-dokumen-timeline" class="feature-card color-green-gradient" data-link style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div class="feature-icon-lg" style="margin-bottom: 12px;">📁</div>
            <div class="feature-content">
              <h3>Dokumen & Timeline</h3>
              <p>Pantau progress deliverable, project plan, dan timeline pengerjaan tim.</p>
            </div>
             <div class="feature-action" style="justify-content: center; width: 100%;">
              <span>Cek Dokumen</span>
              <div class="feature-arrow">→</div>
            </div>
          </a>

          <!-- Individual Worksheet -->
          <a href="/admin-individual-worksheet" class="feature-card color-orange-gradient" data-link style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div class="feature-icon-lg" style="margin-bottom: 12px;">📝</div>
            <div class="feature-content">
              <h3>Individual Worksheet</h3>
              <p>Validasi laporan mingguan individu (logbook) dari setiap mahasiswa.</p>
            </div>
             <div class="feature-action" style="justify-content: center; width: 100%;">
              <span>Validasi Worksheet</span>
              <div class="feature-arrow">→</div>
            </div>
          </a>

          <!-- 360 Feedback -->
          <a href="/admin-360-feedback" class="feature-card color-purple-gradient" data-link style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div class="feature-icon-lg" style="margin-bottom: 12px;">🔄</div>
            <div class="feature-content">
              <h3>360 Feedback</h3>
              <p>Lihat dan export hasil penilaian evaluasi rekan setim (Peer Review).</p>
            </div>
            <div class="feature-action" style="justify-content: center; width: 100%;">
              <span>Lihat Feedback</span>
              <div class="feature-arrow">→</div>
            </div>
          </a>
        </div>

        <!-- Recent Activity Section -->
        <div class="dashboard-section">
          <div class="card recent-activity-card">
            <div class="card-header-clean">
              <div>
                <h2 class="card-title-clean">Pendaftar Terbaru</h2>
                <p class="card-subtitle">5 tim terakhir yang mendaftar dan membutuhkan validasi</p>
              </div>
              <a href="/admin-team-information" class="btn-text" data-link>Lihat Semua Tim →</a>
            </div>
            
            <div class="table-responsive">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Nama Tim</th>
                    <th>Batch</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${groupsData.length === 0
      ? `<tr><td colspan="4" class="empty-cell">Belum ada tim terdaftar</td></tr>`
      : groupsData
        .slice(0, 5)
        .map(
          (group) => `
                      <tr>
                        <td>
                          <div class="team-name-cell">
                            <div class="team-avatar">${(group.group_name || "?").charAt(0).toUpperCase()}</div>
                            <span>${group.group_name || "Tanpa Nama"}</span>
                          </div>
                        </td>
                        <td><span class="badge-pill">${group.batch_id || "-"}</span></td>
                        <td><span class="status-indicator status-${group.status || "pending"}">${(group.status || "pending")}</span></td>
                        <td class="text-right">
                          <a href="/admin-team-information?groupId=${group.group_id}" class="btn-icon" data-link title="Detail">
                            ↗
                          </a>
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
        </div>
      </div>
    </div>
  `;
}

