export function DocumentsPage() {
    return `
        <div class="container content-section">
            <div class="section-header">
                <h1 class="section-title">Dokumen & Timeline</h1>
                <p class="section-description">Kelola dokumen proyek dan timeline pengerjaan capstone</p>
            </div>

            <div class="dashboard-grid" style="grid-template-columns: 1fr;">
                <div class="card">
                    <h2 class="card-title">Dokumen Proyek</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">📂</div>
                        <p class="empty-state-text">Belum ada dokumen yang diunggah</p>
                        <p class="empty-state-subtext">Upload dokumen proposal, laporan, dan dokumentasi proyek</p>
                    </div>
                </div>

                <div class="card">
                    <h2 class="card-title">Timeline Pengerjaan</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">📅</div>
                        <p class="empty-state-text">Timeline belum tersedia</p>
                        <p class="empty-state-subtext">Jadwal milestone dan deadline akan muncul di sini</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}