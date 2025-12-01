export function TeamInfoPage() {
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
                    <div class="empty-state">
                        <div class="empty-state-icon">🎯</div>
                        <p class="empty-state-text">Informasi proyek akan muncul di sini</p>
                        <p class="empty-state-subtext">Setelah tim terbentuk dan proyek dimulai</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}