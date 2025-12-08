export function DeliverablesPage() {
    // Get document type from URL query
    const urlParams = new URLSearchParams(window.location.search);
    const documentType = urlParams.get("type") || "";
    
    // Note: Student tidak memiliki endpoint untuk list deliverables
    // Hanya admin yang bisa list deliverables via GET /api/admin/deliverables

    return `
        <div class="container content-section">
            <div class="section-header">
                <h1 class="section-title">Pengumpulan Deliverables</h1>
                <p class="section-description">Kumpulkan dokumen Project Plan, Laporan Akhir, dan Video Presentasi</p>
            </div>

            <div class="dashboard-grid" style="grid-template-columns: 1fr; max-width: 800px; margin: 0 auto;">
                <div class="card deliverable-submit-card">
                    <div class="card-header-icon">📤</div>
                    <h2 class="card-title">Submit Deliverable</h2>
                    <p class="card-subtitle">Kumpulkan dokumen Project Plan, Laporan Akhir, atau Video Presentasi Anda</p>
                    <form class="deliverable-form" data-deliverable-form>
                        <div class="form-row">
                            <label for="document-type">Jenis Dokumen</label>
                            <select id="document-type" name="document_type" required>
                                <option value="" disabled ${!documentType ? 'selected' : ''}>Pilih jenis dokumen</option>
                                <option value="PROJECT_PLAN" ${documentType === 'PROJECT_PLAN' ? 'selected' : ''}>📋 Project Plan</option>
                                <option value="FINAL_REPORT" ${documentType === 'FINAL_REPORT' ? 'selected' : ''}>📄 Final Report</option>
                                <option value="PRESENTATION_VIDEO" ${documentType === 'PRESENTATION_VIDEO' ? 'selected' : ''}>🎥 Presentation Video</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label for="file-path">URL File</label>
                            <input type="url" id="file-path" name="file_path" placeholder="https://drive.google.com/file/d/... atau https://youtube.com/watch?v=..." required />
                            <p class="form-hint">💡 Untuk Project Plan & Final Report: gunakan Google Drive. Untuk Video: gunakan link YouTube.</p>
                        </div>
                        <div class="form-row">
                            <label for="description">Deskripsi (Opsional)</label>
                            <textarea id="description" name="description" rows="4" placeholder="Tambahkan catatan atau deskripsi tentang dokumen yang dikumpulkan"></textarea>
                        </div>
                        <div class="form-actions">
                            <a href="/dokumen-timeline" class="btn btn-outline" data-link>← Kembali</a>
                            <button type="submit" class="btn btn-primary">Submit Deliverable</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}


