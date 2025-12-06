import { getDocs, getUseCases } from "../services/userService.js";

export async function TeamInfoPage() {
    // Default URLs from provided data
    const defaultPlaybookUrl = "https://docs.google.com/document/d/1z-HCRlfXRUPcoajplkAfQYCilrSVKvUnWsFR1iWpRSw/edit?tab=t.0#heading=h.prr63i3mvc13";
    const defaultUseCaseUrl = "https://docs.google.com/document/d/1eLAy7YapeT6jSzQ5D4LnK6dF5Wn_vIlPaap_8mrXRAY/edit?tab=t.sz6jqfw4pqyd#heading=h.v7gz6yhxhk72";
    
    let playbookUrl = defaultPlaybookUrl;
    let useCaseUrl = defaultUseCaseUrl;

    try {
        const docsResponse = await getDocs();
        const useCasesResponse = await getUseCases();
        
        const docs = docsResponse?.data || [];
        const useCases = useCasesResponse?.data || [];
        
        // Find Capstone Playbook (capstone_docs_source_id: "1" or title contains "playbook")
        const playbook = docs.find(doc => 
            doc.capstone_docs_source_id === "1" || 
            doc.title?.toLowerCase().includes("playbook")
        );
        if (playbook?.url) {
            playbookUrl = playbook.url;
        }
        
        // Find Use Case document (capstone_docs_source_id: "2" or title contains "use-case")
        const useCase = useCases.find(uc => 
            uc.capstone_docs_source_id === "2" || 
            uc.title?.toLowerCase().includes("use-case") ||
            uc.title?.toLowerCase().includes("use case")
        );
        if (useCase?.url) {
            useCaseUrl = useCase.url;
        }
    } catch (error) {
        console.error("Error fetching docs/use cases:", error);
        // Use default URLs if API fails
    }

    return `
        <div class="container content-section">
            <div class="section-header">
                <h1 class="section-title">Team Information</h1>
                <p class="section-description">Informasi lengkap tentang tim dan anggota proyek capstone</p>
            </div>

            <div class="dashboard-grid" style="grid-template-columns: 1fr;">
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
                            <label for="member-id">ID Anggota</label>
                            <input type="text" id="member-id" name="member_id" placeholder="Masukkan ID anggota (NIM)" required />
                        </div>
                        <div class="form-row">
                            <label for="learning-path">Learning Path</label>
                            <select id="learning-path" name="learning_path" required>
                                <option value="" disabled selected>Pilih learning path</option>
                                <option value="Machine Learning">Machine Learning</option>
                                <option value="Cloud Computing">Cloud Computing</option>
                                <option value="Front-End">Front-End</option>
                                <option value="Back-End">Back-End</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label for="use-case">Use Case</label>
                            <select id="use-case" name="use_case" required>
                                <option value="" disabled selected>Pilih use case</option>
                                <option value="Smart Agriculture">Smart Agriculture</option>
                                <option value="Smart City Services">Smart City Services</option>
                                <option value="Financial Technology">Financial Technology</option>
                                <option value="Healthcare Monitoring">Healthcare Monitoring</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Daftarkan Tim</button>
                        </div>
                    </form>
                    <div class="registration-summary" data-registration-summary hidden></div>
                </div>

                <div class="card">
                    <h2 class="card-title">Anggota Tim</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <p class="empty-state-text">Belum ada anggota terdaftar</p>
                        <p class="empty-state-subtext">Silakan melakukan registrasi terlebih dahulu</p>
                    </div>
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