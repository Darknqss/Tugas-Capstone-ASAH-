import { getFeedbackStatus, submitFeedback } from "../services/groupService.js";
import { getMyTeam } from "../services/groupService.js";
import { readSession } from "../services/authService.js";

export async function FeedbackPage() {
    const session = readSession();
    let feedbackStatus = [];
    let teamMembers = [];
    let hasError = false;

    try {
        const statusResponse = await getFeedbackStatus();
        feedbackStatus = statusResponse?.data || [];
        
        const teamResponse = await getMyTeam();
        teamMembers = teamResponse?.data?.members || [];
    } catch (error) {
        console.error("Error fetching feedback data:", error);
        hasError = true;
    }

    // Filter out current user from members list
    const currentUserId = session?.user?.users_source_id;
    const membersToReview = teamMembers.filter(m => m.users_source_id !== currentUserId);

    return `
        <div class="container content-section">
            <div class="section-header">
                <h1 class="section-title">360-Degree Feedback</h1>
                <p class="section-description">Penilaian antar anggota tim untuk evaluasi kontribusi</p>
            </div>

            <div class="dashboard-grid" style="grid-template-columns: 1fr;">
                <div class="card">
                    <h2 class="card-title">Status Penilaian</h2>
                    ${hasError ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">⚠️</div>
                            <p class="empty-state-text">Gagal memuat status penilaian</p>
                        </div>
                    ` : feedbackStatus.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">💬</div>
                            <p class="empty-state-text">Belum ada data penilaian</p>
                        </div>
                    ` : `
                        <div class="feedback-status-list">
                            ${feedbackStatus.map(item => `
                                <div class="feedback-status-item">
                                    <span class="member-name">${item.name || 'N/A'}</span>
                                    <span class="status-badge status-badge--${item.status === 'completed' ? 'approved' : 'submitted'}">
                                        ${item.status === 'completed' ? 'Selesai' : 'Pending'}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

                ${membersToReview.length > 0 ? `
                    <div class="card">
                        <h2 class="card-title">Beri Penilaian</h2>
                        <div class="feedback-forms-grid">
                            ${membersToReview.map(member => `
                                <div class="feedback-form-card">
                                    <h3>${member.name || 'N/A'}</h3>
                                    <p class="member-id-text">${member.users_source_id || 'N/A'}</p>
                                    <form class="feedback-form" data-feedback-form data-reviewee-id="${member.users_source_id}">
                                        <div class="form-row">
                                            <label>Anggota Aktif?</label>
                                            <div class="radio-group">
                                                <label class="radio-label">
                                                    <input type="radio" name="is_member_active" value="true" checked />
                                                    <span>Ya</span>
                                                </label>
                                                <label class="radio-label">
                                                    <input type="radio" name="is_member_active" value="false" />
                                                    <span>Tidak</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div class="form-row">
                                            <label for="contribution-${member.users_source_id}">Tingkat Kontribusi</label>
                                            <select id="contribution-${member.users_source_id}" name="contribution_level" required>
                                                <option value="" disabled selected>Pilih tingkat kontribusi</option>
                                                <option value="sangat_signifikan">Sangat Signifikan</option>
                                                <option value="signifikan">Signifikan</option>
                                                <option value="cukup">Cukup</option>
                                                <option value="kurang">Kurang</option>
                                            </select>
                                        </div>
                                        <div class="form-row">
                                            <label for="reason-${member.users_source_id}">Alasan</label>
                                            <textarea id="reason-${member.users_source_id}" name="reason" rows="3" placeholder="Jelaskan alasan penilaian Anda" required></textarea>
                                        </div>
                                        <div class="form-actions">
                                            <button type="submit" class="btn btn-primary btn-full">Kirim Penilaian</button>
                                        </div>
                                    </form>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="card">
                        <div class="empty-state">
                            <div class="empty-state-icon">👥</div>
                            <p class="empty-state-text">Tidak ada anggota tim untuk dinilai</p>
                            <p class="empty-state-subtext">Pastikan Anda sudah bergabung dalam tim</p>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;
}
