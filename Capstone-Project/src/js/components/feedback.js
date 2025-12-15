import { getFeedbackStatus, submitFeedback } from "../services/groupService.js";
import { getMyTeam } from "../services/groupService.js";
import { readSession } from "../services/authService.js";

export async function FeedbackPage() {
    const session = readSession();
    let feedbackStatus = [];
    let hasError = false;

    // Fetch Feedback Status (Source of Truth)
    try {
        const statusResponse = await getFeedbackStatus();
        feedbackStatus = statusResponse?.data || [];
    } catch (error) {
        console.error("Error fetching feedback status:", error);
        hasError = true;
    }

    console.log("[DEBUG] User Session:", session?.user);
    console.log("[DEBUG] Feedback Status:", feedbackStatus);

    // Filter for Pending Reviews
    // We trust the backend's 'status' field.
    // We also ensure we don't review ourselves if the backend accidentally returns us.
    const currentUserId = session?.user?.source_id || session?.user?.users_source_id;

    const membersToReview = feedbackStatus.filter(m => {
        const isPending = m.status === 'pending' || m.status === 'not_started';
        // Check if this is NOT me (just in case backend includes me)
        // Note: m.reviewee_source_id or m.reviewee_id should be checked against currentUserId
        const revieweeId = m.reviewee_id || m.reviewee_source_id;
        const isNotMe = revieweeId !== currentUserId;

        return isPending && isNotMe;
    });

    // Helper to Determine Empty State Message
    const renderEmptyState = () => {
        if (hasError) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p class="empty-state-text">Gagal memuat data penilaian</p>
                </div>
            `;
        }

        if (feedbackStatus.length === 0) {
            // No team members at all (or backend returns empty)
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <p class="empty-state-text">Tidak ada anggota tim untuk dinilai</p>
                    <p class="empty-state-subtext">Pastikan Anda sudah bergabung dalam tim</p>
                </div>
            `;
        }

        if (membersToReview.length === 0) {
            // All members reviewed
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">🎉</div>
                    <p class="empty-state-text">Semua penilaian selesai!</p>
                    <p class="empty-state-subtext">Anda telah menilai semua anggota tim Anda.</p>
                </div>
            `;
        }

        return ''; // Should not happen if filtered correctly, handled in main render
    };

    return `
        <div class="container content-section">
            <div class="section-header">
                <h1 class="section-title">360-Degree Feedback</h1>
                <p class="section-description">Penilaian antar anggota tim untuk evaluasi kontribusi</p>
            </div>

            <div class="dashboard-grid" style="grid-template-columns: 1fr;">
                <!-- Card 1: Status List -->
                <div class="card">
                    <h2 class="card-title">Status Penilaian</h2>
                    ${hasError ? renderEmptyState() : feedbackStatus.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">💬</div>
                            <p class="empty-state-text">Belum ada data tim</p>
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

                <!-- Card 2: Feedback Forms -->
                ${membersToReview.length > 0 ? `
                    <div class="card">
                        <h2 class="card-title">Beri Penilaian</h2>
                        <div class="feedback-forms-grid">
                            ${membersToReview.map(member => {
        // Use fields from Feedback Status response
        const revieweeSourceId = member.reviewee_source_id;
        const revieweeId = member.reviewee_id;
        // Prefer Source ID for the form as per contract example, but store both if needed
        const targetId = revieweeSourceId || revieweeId;

        return `
                                <div class="feedback-form-card">
                                    <h3>${member.name || 'N/A'}</h3>
                                    <form class="feedback-form" data-feedback-form data-reviewee-id="${targetId}">
                                        <!-- Hidden Inputs just in case -->
                                        ${revieweeId ? `<input type="hidden" name="reviewee_id" value="${revieweeId}">` : ''}

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
                                            <label for="contribution-${targetId}">Tingkat Kontribusi</label>
                                            <select id="contribution-${targetId}" name="contribution_level" required>
                                                <option value="" disabled selected>Pilih tingkat kontribusi</option>
                                                <option value="sangat_signifikan">Sangat Signifikan</option>
                                                <option value="signifikan">Signifikan</option>
                                                <option value="cukup">Cukup</option>
                                                <option value="kurang">Kurang</option>
                                            </select>
                                        </div>
                                        <div class="form-row">
                                            <label for="reason-${targetId}">Alasan</label>
                                            <textarea id="reason-${targetId}" name="reason" rows="3" placeholder="Jelaskan alasan penilaian Anda" required></textarea>
                                        </div>
                                        <div class="form-actions">
                                            <button type="submit" class="btn btn-primary btn-full">Kirim Penilaian</button>
                                        </div>
                                    </form>
                                </div>
                                `;
    }).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="card">
                       ${renderEmptyState()}
                    </div>
                `}
            </div>
        </div>
    `;
}
