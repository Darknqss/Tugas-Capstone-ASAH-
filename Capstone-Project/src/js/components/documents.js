export function DocumentsPage() {
    // Note: Student tidak memiliki endpoint untuk list deliverables
    // Hanya admin yang bisa list deliverables via GET /api/admin/deliverables

    return `
        <div class="container content-section">
            <div class="section-header">
                <h1 class="section-title">Dokumen & Timeline</h1>
                <p class="section-description">Kelola dokumen proyek dan timeline pengerjaan capstone</p>
            </div>

            <style>
                .deliverable-card {
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .deliverable-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                }
                .btn-primary {
                    text-decoration: none !important;
                }
            </style>
            <div class="dashboard-grid" style="grid-template-columns: 1fr; gap: 24px;">
                <div class="card">
                    <h2 class="card-title">Dokumen Proyek</h2>
                    <div class="deliverables-grid">
                        <div class="deliverable-card">
                            <div class="deliverable-icon">📋</div>
                            <h3>Project Plan</h3>
                            <p>Kumpulkan dokumen Project Plan Anda</p>
                            <a href="/deliverables?type=PROJECT_PLAN" class="btn btn-primary" style="text-decoration: none;" data-link>Kumpulkan</a>
                        </div>
                        <div class="deliverable-card">
                            <div class="deliverable-icon">📄</div>
                            <h3>Laporan Akhir</h3>
                            <p>Kumpulkan laporan akhir proyek</p>
                            <a href="/deliverables?type=FINAL_REPORT" class="btn btn-primary" style="text-decoration: none;" data-link>Kumpulkan</a>
                        </div>
                        <div class="deliverable-card">
                            <div class="deliverable-icon">🎥</div>
                            <h3>Video Presentasi</h3>
                            <p>Kumpulkan link video YouTube presentasi</p>
                            <a href="/deliverables?type=PRESENTATION_VIDEO" class="btn btn-primary" style="text-decoration: none;" data-link>Kumpulkan</a>
                        </div>
                    </div>
                </div>

                <div class="card timeline-card">
                    <h2 class="card-title">Timeline Pengerjaan</h2>
                    <div class="timeline-preview">
                        <div class="timeline-preview-icon">📅</div>
                        <div class="timeline-preview-content">
                            <p class="timeline-preview-text">Lihat jadwal milestone dan deadline capstone project</p>
                            <a href="/timeline" class="btn btn-primary timeline-view-btn" style="text-decoration: none;" data-link>
                                Lihat Timeline
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}