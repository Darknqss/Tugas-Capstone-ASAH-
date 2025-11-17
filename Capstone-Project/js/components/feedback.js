export function FeedbackPage() {
    return `
        <div class="container content-section">
            <div class="section-header">
                <h1 class="section-title">360-Degree Feedback</h1>
                <p class="section-description">Sistem evaluasi komprehensif dari berbagai perspektif</p>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <h2 class="card-title">Feedback dari Mentor</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">👨‍🏫</div>
                        <p class="empty-state-text">Belum ada feedback</p>
                        <p class="empty-state-subtext">Feedback dari mentor akan muncul di sini</p>
                    </div>
                </div>

                <div class="card">
                    <h2 class="card-title">Peer Review</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <p class="empty-state-text">Belum ada peer review</p>
                        <p class="empty-state-subtext">Review dari sesama anggota tim</p>
                    </div>
                </div>

                <div class="card">
                    <h2 class="card-title">Self Assessment</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">🪞</div>
                        <p class="empty-state-text">Belum ada self assessment</p>
                        <p class="empty-state-subtext">Evaluasi diri Anda sendiri</p>
                    </div>
                </div>

                <div class="card">
                    <h2 class="card-title">Hasil Evaluasi</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">📈</div>
                        <p class="empty-state-text">Belum ada hasil evaluasi</p>
                        <p class="empty-state-subtext">Rangkuman hasil evaluasi 360 derajat</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}