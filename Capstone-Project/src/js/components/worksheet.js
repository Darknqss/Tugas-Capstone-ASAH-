export function WorksheetPage() {
    return `
        <div class="container content-section">
            <div class="section-header">
                <h1 class="section-title">Individual Worksheet</h1>
                <p class="section-description">Worksheet pribadi untuk tracking progres dan kontribusi individu</p>
            </div>

            <div class="dashboard-grid" style="grid-template-columns: 1fr;">
                <div class="card">
                    <h2 class="card-title">Tugas Saya</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">✅</div>
                        <p class="empty-state-text">Belum ada tugas</p>
                        <p class="empty-state-subtext">Tugas yang ditugaskan akan muncul di sini</p>
                    </div>
                </div>

                <div class="card">
                    <h2 class="card-title">Progres Mingguan</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <p class="empty-state-text">Belum ada data progres</p>
                        <p class="empty-state-subtext">Laporan progres mingguan akan ditampilkan</p>
                    </div>
                </div>

                <div class="card">
                    <h2 class="card-title">Catatan & Refleksi</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">📖</div>
                        <p class="empty-state-text">Belum ada catatan</p>
                        <p class="empty-state-subtext">Buat catatan dan refleksi pembelajaran Anda</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}