import { readSession } from "../services/authService.js";
import { getMyTeam, getMyWorksheets } from "../services/groupService.js";

export async function DashboardPage() {
    const session = readSession();
    const displayName = session?.user?.name || session?.user?.full_name || session?.user?.email || 'Pengunjung';
    const heroTitle = session?.user
        ? `Selamat Datang, ${displayName}`
        : 'Selamat Datang, Silahkan Login terlebih dahulu';
    const heroSubtitle = session?.user
        ? 'Semoga aktivitas belajarmu menyenangkan.'
        : 'Silakan login untuk mengakses seluruh fitur dashboard.';

    // Initialize data containers
    let teamData = null;
    let worksheetsData = [];
    let hasTeam = false;

    // Fetch data if user is logged in
    if (session?.user) {
        try {
            const [teamRes, worksheetsRes] = await Promise.allSettled([
                getMyTeam(),
                getMyWorksheets()
            ]);

            if (teamRes.status === 'fulfilled' && teamRes.value?.data) {
                teamData = teamRes.value.data;
                hasTeam = true;
            }

            if (worksheetsRes.status === 'fulfilled' && worksheetsRes.value?.data) {
                worksheetsData = Array.isArray(worksheetsRes.value.data) ? worksheetsRes.value.data : [];
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    }



    // Render Helpers
    const renderTeamCard = () => {
        if (hasTeam) {
            return `
                <div class="card">
                    <h2 class="card-title">Team Information</h2>
                    <div class="registration-row">
                        <div class="team-info-summary">
                            <h3 style="margin: 0; font-size: 1.1rem;">${teamData.group_name || 'Tim Kamu'}</h3>
                            <p style="margin: 5px 0 0; color: #666; font-size: 0.9rem;">
                                ${teamData.status === 'accepted' ? '✅ Terverifikasi' : '⏳ Menunggu Verifikasi'}
                            </p>
                        </div>
                        <a href="/team-information" class="btn btn-primary btn-small" style="text-decoration: none;" data-link>Lihat Detail Tim</a>
                    </div>
                </div>
            `;
        }
        return `
            <div class="card">
                <h2 class="card-title">Team Information</h2>
                <div class="registration-row">
                    <span class="registration-label">Registration</span>
                    <button class="btn-registration" data-registration-toggle>Registration Here</button>
                </div>
            </div>
        `;
    };

    const renderDocsAndTimeline = () => {
        return `
            <style>
                .nav-card-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    background-color: #f0f4f8 !important;
                }
            </style>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: center; margin-top: 10px;">
                <a href="/dokumen-timeline" class="nav-card-hover" style="display: block; padding: 20px; background: #f8f9fa; border-radius: 8px; text-decoration: none; color: inherit; transition: all 0.3s ease;" data-link>
                    <div style="font-size: 3rem; margin-bottom: 10px;">📄</div>
                    <span style="font-weight: 600; color: #333; font-size: 1.1rem;">Dokumen</span>
                </a>
                <a href="/timeline" class="nav-card-hover" style="display: block; padding: 20px; background: #f8f9fa; border-radius: 8px; text-decoration: none; color: inherit; transition: all 0.3s ease;" data-link>
                    <div style="font-size: 3rem; margin-bottom: 10px;">📅</div>
                    <span style="font-weight: 600; color: #333; font-size: 1.1rem;">Timeline</span>
                </a>
            </div>
        `;
    };

    const renderWorksheets = () => {
        if (worksheetsData.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <p class="empty-state-text">Belum ada worksheet</p>
                    <p class="empty-state-subtext">Worksheet individu akan muncul di sini</p>
                </div>
            `;
        }

        const getStatusLabel = (status) => {
            const labels = {
                'completed': 'Selesai',
                'completed_late': 'Selesai Terlambat',
                'missed': 'Tidak Selesai',
                'pending': 'Belum Dikerjakan'
            };
            return labels[status] || status;
        };

        const getStatusClass = (status) => {
            const classes = {
                'completed': 'status-badge--completed',
                'completed_late': 'status-badge--completed_late',
                'missed': 'status-badge--missed',
                'pending': 'status-badge--pending'
            };
            return classes[status] || 'status-badge--pending';
        };

        const itemsHtml = worksheetsData.slice(0, 5).map(item => {
            // Determine period title: check for period object, or title, or fallback
            let periodText = 'Masih Aktif';
            if (item.period && item.period.title) {
                periodText = item.period.title;
            } else if (item.week) {
                periodText = `Minggu ke-${item.week}`;
            } else if (item.start_date) {
                // Fallback to start date if no title
                periodText = new Date(item.start_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
            }

            return `
            <div class="list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee;">
                <div>
                    <h4 style="margin: 0; font-size: 1rem; color: #333;">${item.title || 'Individual Worksheet'}</h4>
                    <p style="margin: 4px 0 0; font-size: 0.85rem; color: #666;">${periodText}</p>
                </div>
                <span class="status-badge ${getStatusClass(item.status || 'pending')}">
                    ${getStatusLabel(item.status || 'pending')}
                </span>
            </div>
        `}).join('');

        return `
            <div class="content-list">
                ${itemsHtml}
                <div style="margin-top: 15px; text-align: center;">
                    <a href="/individual-worksheet" class="btn-link" style="text-decoration: none;" data-link>Lihat Semua</a>
                </div>
            </div>
        `;
    };

    return `
        <!-- Hero Section -->
        <section class="hero-section">
            <div class="container">
                <h1 class="hero-title">${heroTitle}</h1>
                <p class="hero-subtitle">${heroSubtitle}</p>
            </div>
        </section>

        <!-- Dashboard Content -->
        <div class="container">
            <div class="dashboard-grid">
                <div>
                    <!-- Team Information Card -->
                    ${renderTeamCard()}

                    <!-- Individual Worksheet Card -->
                    <div class="card" style="margin-top: 30px;">
                        <h2 class="card-title">Individual Worksheet</h2>
                        ${renderWorksheets()}
                    </div>
                </div>

                <div>
                    <!-- Documents & Timeline Card -->
                    <div class="card">
                        <h2 class="card-title">Documents & Timeline</h2>
                        ${renderDocsAndTimeline()}
                    </div>

                    <!-- 360-Degree Feedback Card -->
                    <div class="card" style="margin-top: 30px;">
                        <h2 class="card-title">360-Degree Feedback</h2>
                        <div class="empty-state">
                            <div class="empty-state-icon">💬</div>
                            <p class="empty-state-text">Belum ada feedback</p>
                            <p class="empty-state-subtext">Feedback 360 derajat akan muncul di sini</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}