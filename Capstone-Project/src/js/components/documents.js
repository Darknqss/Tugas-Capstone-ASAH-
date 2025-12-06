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

                <div class="card timeline-card">
                    <h2 class="card-title">Timeline Pengerjaan</h2>
                    <div class="timeline-preview">
                        <div class="timeline-preview-icon">📅</div>
                        <div class="timeline-preview-content">
                            <p class="timeline-preview-text">Lihat jadwal milestone dan deadline capstone project</p>
                            <a href="#timeline" class="btn btn-primary timeline-view-btn" data-link>
                                Lihat Timeline
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}