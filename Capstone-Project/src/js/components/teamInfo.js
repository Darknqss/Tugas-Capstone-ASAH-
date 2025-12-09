import { getDocs, getUseCases } from "../services/userService.js";
import { getMyTeam } from "../services/groupService.js";

export async function TeamInfoPage() {
    // Default URLs from provided data
    const defaultPlaybookUrl = "https://docs.google.com/document/d/1z-HCRlfXRUPcoajplkAfQYCilrSVKvUnWsFR1iWpRSw/edit?tab=t.0#heading=h.prr63i3mvc13";
    const defaultUseCaseUrl = "https://docs.google.com/document/d/1eLAy7YapeT6jSzQ5D4LnK6dF5Wn_vIlPaap_8mrXRAY/edit?tab=t.sz6jqfw4pqyd#heading=h.v7gz6yhxhk72";
    
    let playbookUrl = defaultPlaybookUrl;
    let useCaseUrl = defaultUseCaseUrl;
    let useCasesOptions = "";
    let teamData = null;

    // Fetch Use Cases - Independent error handling
    try {
        const useCasesResponse = await getUseCases();
        console.log("Use Cases Response:", useCasesResponse); // Debug log
        const useCases = useCasesResponse?.data || [];
        console.log("Use Cases Data:", useCases); // Debug log
        
        // Build use case options
        // Menggunakan capstone_use_case_source_id sebagai value sesuai API contract
        if (useCases && useCases.length > 0) {
            useCasesOptions = useCases.map(uc => {
                // Gunakan capstone_use_case_source_id sebagai value (sesuai API contract)
                const sourceId = uc.capstone_use_case_source_id || uc.id || '';
                // Format display: "Nama Use Case - Company (Source ID)"
                const displayName = `${uc.name || 'N/A'}${uc.company ? ` - ${uc.company}` : ''}${sourceId ? ` (${sourceId})` : ''}`;
                return `<option value="${sourceId}">${displayName}</option>`;
            }).join('');
            console.log("Use Cases Options Generated:", useCasesOptions.length, "characters"); // Debug log
        } else {
            console.warn("No use cases found in response");
            useCasesOptions = '<option value="" disabled>Belum ada use case tersedia</option>';
        }
    } catch (error) {
        console.error("Error fetching use cases:", error);
        useCasesOptions = '<option value="" disabled>Gagal memuat use case. Silakan refresh halaman.</option>';
    }

    // Fetch Docs - Independent error handling
    try {
        const docsResponse = await getDocs();
        const docs = docsResponse?.data || [];
        
        // Find Capstone Playbook (capstone_docs_source_id: "1" or title contains "playbook")
        const playbook = docs.find(doc => 
            doc.capstone_docs_source_id === "1" || 
            doc.title?.toLowerCase().includes("playbook")
        );
        if (playbook?.url) {
            playbookUrl = playbook.url;
        }
        
        // Find Use Case document (capstone_docs_source_id: "2" or title contains "use-case")
        const useCase = docs.find(doc => 
            doc.capstone_docs_source_id === "2" || 
            doc.title?.toLowerCase().includes("use-case") ||
            doc.title?.toLowerCase().includes("use case")
        );
        if (useCase?.url) {
            useCaseUrl = useCase.url;
        }
    } catch (error) {
        console.error("Error fetching docs:", error);
        // Use default URLs if API fails
    }

    // Fetch Team Data - Independent error handling (bisa gagal jika user belum punya tim)
    try {
        const teamResponse = await getMyTeam();
        teamData = teamResponse?.data || null;
    } catch (error) {
        // Error ini normal jika user belum bergabung dengan tim
        // Tidak perlu log error karena ini expected behavior
        teamData = null;
    }
    
    // Render team members
    let teamMembersHtml = "";
    if (teamData?.members && teamData.members.length > 0) {
        teamMembersHtml = `
            <div class="team-members-list">
                <div class="team-info-header">
                    <h3>${teamData.group_name || 'Tim Saya'}</h3>
                    <span class="status-badge status-badge--${(teamData.status || 'pending').toLowerCase().replace(/_/g, '-')}">${(teamData.status || 'Pending').replace(/_/g, ' ')}</span>
                </div>
                <div class="members-table-container">
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Role</th>
                                <th>Learning Path</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${teamData.members.map(member => `
                                <tr>
                                    <td><strong>${member.name || 'N/A'}</strong></td>
                                    <td><span class="role-badge role-badge--${(member.role || 'member').toLowerCase()}">${(member.role || 'member').charAt(0).toUpperCase() + (member.role || 'member').slice(1)}</span></td>
                                    <td>${member.learning_path || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        teamMembersHtml = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p class="empty-state-text">Belum ada anggota terdaftar</p>
                <p class="empty-state-subtext">Silakan melakukan registrasi terlebih dahulu</p>
            </div>
        `;
    }

    return `
        <div class="container content-section">
            <div class="section-header">
                <h1 class="section-title">Team Information</h1>
                <p class="section-description">Informasi lengkap tentang tim dan anggota proyek capstone</p>
            </div>

            <div class="dashboard-grid" style="grid-template-columns: 1fr;">
                ${!teamData || !teamData.id ? `
                <div class="card">
                    <h2 class="card-title">Informasi Tim</h2>
                    <div class="registration-row">
                        <span class="registration-label">Registration</span>
                        <button class="btn-registration" data-registration-toggle>Registration Here</button>
                    </div>
                </div>

                <div class="card registration-form-card" data-registration-panel hidden>
                    <h2 class="card-title">Registrasi Tim</h2>
                    <p class="section-description" style="margin-bottom:16px;">Isi detail tim Anda untuk melanjutkan proses capstone.</p>
                    <form class="team-registration-form" data-registration-form>
                        <div class="form-row">
                            <label for="team-name">Nama Tim</label>
                            <input type="text" id="team-name" name="team_name" placeholder="Contoh: GEMBROT SQUAD" required />
                        </div>
                        <div class="form-row">
                            <label for="use-case">Use Case</label>
                            <select id="use-case" name="use_case_source_id" required>
                                <option value="" disabled selected>Pilih use case</option>
                                ${useCasesOptions}
                            </select>
                            <p class="form-hint">Pilih use case yang akan dikerjakan tim Anda</p>
                        </div>
                        <div class="form-row">
                            <label for="member-ids">ID Anggota Tim (pisahkan dengan koma)</label>
                            <textarea id="member-ids" name="member_source_ids" rows="3" placeholder="FUI0001, FUI0002, FUI0003" required></textarea>
                            <p class="form-hint">Masukkan ID anggota tim, pisahkan dengan koma. Contoh: FUI0001, FUI0002, FUI0003</p>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Daftarkan Tim</button>
                        </div>
                    </form>
                    <div class="registration-summary" data-registration-summary hidden></div>
                </div>
                ` : ''}

                <div class="card">
                    <h2 class="card-title">Anggota Tim</h2>
                    ${teamMembersHtml}
                </div>

                <div class="card">
                    <h2 class="card-title">Detail Proyek</h2>
                    <div class="project-detail-grid">
                        <div class="project-detail-card">
                            <div class="project-detail-icon">📘</div>
                            <h3 class="project-detail-title">Capstone Playbook</h3>
                            <p class="project-detail-description">Panduan lengkap untuk mengerjakan proyek capstone</p>
                            ${playbookUrl ? `
                                <a href="${playbookUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary project-detail-link">
                                    Buka Dokumen
                                </a>
                            ` : `
                                <p class="project-detail-placeholder">Dokumen belum tersedia</p>
                            `}
                        </div>
                        <div class="project-detail-card">
                            <div class="project-detail-icon">📋</div>
                            <h3 class="project-detail-title">Use Case Capstone Project</h3>
                            <p class="project-detail-description">Daftar use case yang dapat dipilih untuk proyek capstone</p>
                            ${useCaseUrl ? `
                                <a href="${useCaseUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary project-detail-link">
                                    Buka Dokumen
                                </a>
                            ` : `
                                <p class="project-detail-placeholder">Dokumen belum tersedia</p>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}