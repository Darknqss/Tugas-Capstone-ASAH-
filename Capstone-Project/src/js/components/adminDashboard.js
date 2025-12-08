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

  return `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <h1 class="hero-title">Dashboard Admin - ${displayName}</h1>
        <p class="hero-subtitle">Kelola dan pantau seluruh aktivitas capstone project</p>
      </div>
    </section>

    <!-- Analytics Dashboard -->
    <div class="container">
      <div class="section-header">
        <h1 class="section-title">Analitikal Dashboard</h1>
        <p class="section-description">Ringkasan statistik dan metrik capstone project</p>
      </div>

      <!-- Stats Grid -->
      <div class="admin-stats-grid">
        <div class="stat-card stat-card--primary">
          <div class="stat-card__icon">📊</div>
          <div class="stat-card__content">
            <div class="stat-card__value">${stats.totalGroups}</div>
            <div class="stat-card__label">Total Tim</div>
          </div>
        </div>

        <div class="stat-card stat-card--success">
          <div class="stat-card__icon">✅</div>
          <div class="stat-card__content">
            <div class="stat-card__value">${stats.acceptedGroups}</div>
            <div class="stat-card__label">Tim Diterima</div>
          </div>
        </div>

        <div class="stat-card stat-card--warning">
          <div class="stat-card__icon">⏳</div>
          <div class="stat-card__content">
            <div class="stat-card__value">${stats.pendingGroups}</div>
            <div class="stat-card__label">Menunggu Validasi</div>
          </div>
        </div>

        <div class="stat-card stat-card--danger">
          <div class="stat-card__icon">❌</div>
          <div class="stat-card__content">
            <div class="stat-card__value">${stats.rejectedGroups}</div>
            <div class="stat-card__label">Tim Ditolak</div>
          </div>
        </div>

        <div class="stat-card stat-card--info">
          <div class="stat-card__icon">🚀</div>
          <div class="stat-card__content">
            <div class="stat-card__value">${stats.inProgressProjects}</div>
            <div class="stat-card__label">Proyek Berjalan</div>
          </div>
        </div>
      </div>

      <!-- Recent Groups Table -->
      <div class="card" style="margin-top: 30px;">
        <div class="card-header">
          <h2 class="card-title">Tim Terbaru</h2>
          <a href="/admin-team-information" class="btn btn-primary btn-small" data-link>Lihat Semua</a>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nama Tim</th>
                <th>Batch ID</th>
                <th>Status</th>
                <th>Proyek</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${
                groupsData.length === 0
                  ? `<tr><td colspan="5" class="text-center">Belum ada tim terdaftar</td></tr>`
                  : groupsData
                      .slice(0, 5)
                      .map(
                        (group) => `
                  <tr>
                    <td><strong>${group.group_name || "-"}</strong></td>
                    <td>${group.batch_id || "-"}</td>
                    <td><span class="status-badge status-badge--${group.status || "pending"}">${(group.status || "pending").toUpperCase()}</span></td>
                    <td><span class="status-badge status-badge--${group.project_status || "not_started"}">${(group.project_status || "not_started").replace("_", " ").toUpperCase()}</span></td>
                    <td>
                      <a href="/admin-team-information?groupId=${group.group_id}" class="btn-link" data-link>Detail</a>
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
  `;
}

