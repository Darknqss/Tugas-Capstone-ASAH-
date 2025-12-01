export function DashboardPage() {
    return `
        <!-- Hero Section -->
        <section class="hero-section">
            <div class="container">
                <h1 class="hero-title">Selamat Datang, Silahkan Login terlebih dahulu</h1>
                <p class="hero-subtitle">Semoga aktivitas belajarmu menyenangkan.</p>
            </div>
        </section>

        <!-- Dashboard Content -->
        <div class="container">
            <div class="dashboard-grid">
                <div>
                    <!-- Team Information Card -->
                    <div class="card">
                        <h2 class="card-title">Team Information</h2>
                        <div class="registration-row">
                            <span class="registration-label">Registration</span>
                            <button class="btn-registration">Registration Here</button>
                        </div>
                    </div>

                    <!-- Individual Worksheet Card -->
                    <div class="card" style="margin-top: 30px;">
                        <h2 class="card-title">Individual Worksheet</h2>
                        <div class="empty-state">
                            <div class="empty-state-icon">📝</div>
                            <p class="empty-state-text">Belum ada worksheet</p>
                            <p class="empty-state-subtext">Worksheet individu akan muncul di sini</p>
                        </div>
                    </div>
                </div>

                <div>
                    <!-- Documents & Timeline Card -->
                    <div class="card">
                        <h2 class="card-title">Documents & Timeline</h2>
                        <div class="empty-state">
                            <div class="empty-state-icon">📄</div>
                            <p class="empty-state-text">Belum ada dokumen atau timeline</p>
                            <p class="empty-state-subtext">Dokumen dan timeline akan muncul di sini</p>
                        </div>
                    </div>

                    <!-- 360-Degree Feedback Card -->
                    <div class="card" style="margin-top: 30px;">
                        <h2 class="card-title">360-Degree Feedback</h2>
                        <div class="empty-state">
                            <div class="empty-state-icon">💬</div>
                            <p class="empty-state-text">Belum ada feedback</p>
                            <p class="empty-state-subtext">Feedback 360 derajat akan muncul di sini</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}