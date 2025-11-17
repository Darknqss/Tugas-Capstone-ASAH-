export function TeamInfoPage() {
    return `
        <div class="container content-section">
            <div class="section-header">
                <h1 class="section-title">Team Information</h1>
                <p class="section-description">Informasi lengkap tentang tim dan anggota proyek capstone</p>
            </div>

            <div class="dashboard-grid" style="grid-template-columns: 1fr;">
                <div class="card">
                    <h2 class="card-title">Informasi Tim</h2>
                    <div class="registration-row">
                        <span class="registration-label">Registration</span>
                        <button class="btn-registration">Registration Here</button>
                    </div>
                </div>

                <div class="card">
                    <h2 class="card-title">Anggota Tim</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <p class="empty-state-text">Belum ada anggota terdaftar</p>
                        <p class="empty-state-subtext">Silakan melakukan registrasi terlebih dahulu</p>
                    </div>
                </div>

                <div class="card">
                    <h2 class="card-title">Detail Proyek</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">🎯</div>
                        <p class="empty-state-text">Informasi proyek akan muncul di sini</p>
                        <p class="empty-state-subtext">Setelah tim terbentuk dan proyek dimulai</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}