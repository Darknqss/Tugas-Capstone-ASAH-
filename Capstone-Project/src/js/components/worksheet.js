import { getMyWorksheets, submitWorksheet } from "../services/groupService.js";
import { readSession } from "../services/authService.js";

export async function WorksheetPage() {
    const session = readSession();
    let worksheets = [];
    let hasError = false;

    try {
        const response = await getMyWorksheets();
        worksheets = response?.data || [];
    } catch (error) {
        console.error("Error fetching worksheets:", error);
        hasError = true;
    }

    return `
        <div class="container content-section">
            <div class="section-header">
                <h1 class="section-title">Individual Worksheet</h1>
                <p class="section-description">Laporan aktivitas individu mingguan untuk tracking progres</p>
            </div>

            <div class="dashboard-grid worksheet-grid">
                <div class="card worksheet-form-card">
                    <div class="card-header">
                        <h2 class="card-title">Submit Worksheet Baru</h2>
                        <p class="card-subtitle">Lengkapi form di bawah untuk melaporkan aktivitas mingguan Anda</p>
                    </div>
                    <form class="worksheet-form" data-worksheet-form>
                        <div class="form-row-group">
                            <div class="form-row">
                                <label for="period-start">Periode Mulai</label>
                                <input type="date" id="period-start" name="period_start" required />
                                <p class="form-hint">Tanggal mulai periode aktivitas</p>
                            </div>
                            <div class="form-row">
                                <label for="period-end">Periode Akhir</label>
                                <input type="date" id="period-end" name="period_end" required />
                                <p class="form-hint">Tanggal akhir periode aktivitas</p>
                            </div>
                        </div>
                        <div class="form-row">
                            <label for="activity-description">Deskripsi Aktivitas</label>
                            <textarea id="activity-description" name="activity_description" rows="5" placeholder="Contoh: Membuat API Login dan Register, melakukan testing, dll." required></textarea>
                            <p class="form-hint">Jelaskan aktivitas yang telah Anda lakukan selama periode ini</p>
                        </div>
                        <div class="form-row">
                            <label for="proof-url">URL Bukti (GitHub, dll)</label>
                            <input type="url" id="proof-url" name="proof_url" placeholder="https://github.com/capstone-team/backend/pull/1" required />
                            <p class="form-hint">Link ke PR, commit, atau bukti aktivitas lainnya</p>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-full">Submit Worksheet</button>
                        </div>
                    </form>
                </div>

                <div class="card">
                    <h2 class="card-title">Riwayat Worksheet</h2>
                    ${hasError ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">⚠️</div>
                            <p class="empty-state-text">Gagal memuat data worksheet</p>
                        </div>
                    ` : worksheets.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">📝</div>
                            <p class="empty-state-text">Belum ada worksheet</p>
                            <p class="empty-state-subtext">Worksheet yang telah dikumpulkan akan muncul di sini</p>
                        </div>
                    ` : `
                        <div class="worksheets-list">
                            ${worksheets.map(ws => `
                                <div class="worksheet-item">
                                    <div class="worksheet-header">
                                        <h3>${formatDate(ws.period_start)} - ${formatDate(ws.period_end)}</h3>
                                        <span class="status-badge status-badge--${ws.status || 'submitted'}">${getStatusLabel(ws.status)}</span>
                                    </div>
                                    <p class="worksheet-description">${ws.activity_description || 'Tidak ada deskripsi'}</p>
                                    ${ws.proof_url ? `<a href="${ws.proof_url}" target="_blank" class="worksheet-proof-link">Lihat Bukti →</a>` : ''}
                                    ${ws.feedback ? `<div class="worksheet-feedback"><strong>Feedback:</strong> ${ws.feedback}</div>` : ''}
                                    <div class="worksheet-meta">
                                        <span>Dikirim: ${formatDateTime(ws.submitted_at)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusLabel(status) {
    const labels = {
        'submitted': 'Menunggu Review',
        'approved': 'Disetujui',
        'rejected': 'Ditolak',
        'late': 'Terlambat'
    };
    return labels[status] || status || 'Unknown';
}
