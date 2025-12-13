import { getStudentsWithoutTeam, randomizeTeams, listAllGroups } from "../services/adminService.js";
import { readSession } from "../services/authService.js";

export async function AdminRandomizePage() {
   const session = readSession();
   let students = [];
   let isLoading = true;
   let error = null;
   let groups = [];

   try {
      // Fetch students without team (all batches)
      const [studentsResponse, groupsResponse] = await Promise.all([
         getStudentsWithoutTeam(null),
         listAllGroups()
      ]);

      students = studentsResponse?.data || [];
      groups = groupsResponse?.data || groupsResponse?.groups || [];

      console.log("[AdminRandomize] Unassigned students:", students);
   } catch (err) {
      console.error("Error fetching data:", err);
      error = "Gagal memuat data peserta.";
   } finally {
      isLoading = false;
   }

   return `
    <div class="admin-subpage-wrapper">
      <div class="container main-content-wrapper" style="margin-top: 30px; max-width: 1200px;">
        
        <!-- Header -->
        <div class="admin-page-header">
          <div>
             <a href="/admin-team-information" class="btn-text" data-link style="margin-bottom: 8px; display: inline-block; color: var(--primary-color); font-weight: 500;">← Kembali ke Manajemen Tim</a>
             <h2 class="admin-page-title">Randomize Team</h2>
             <p class="admin-page-subtitle">Bentuk tim secara otomatis untuk peserta yang belum memiliki kelompok.</p>
          </div>
        </div>

        <!-- Main Content -->
        <div class="row" style="display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start;">
           <!-- Left Column: Settings -->
           <div class="col-lg-4" style="flex: 1; min-width: 320px; max-width: 400px;">
              <div class="card" style="box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: none; border-radius: 12px;">
                 <div class="card-body" style="padding: 24px;">
                     <h3 class="card-title" style="margin-bottom: 16px; font-size: 1.25rem;">Konfigurasi Randomize</h3>
                     <p class="text-muted text-sm mb-4">Tentukan parameter pembentukan tim.</p>
                     
                     <form id="randomize-form" data-randomize-form>
                        <div class="form-group" style="margin-bottom: 20px;">
                           <label style="font-weight: 600; margin-bottom: 8px; display: block;">Target Batch ID</label>
                           <input type="text" name="batch_id" class="form-control" value="asah-batch-1" required placeholder="Contoh: asah-batch-1" style="height: 48px;">
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 20px;">
                           <label style="font-weight: 600; margin-bottom: 8px; display: block;">Ukuran Tim (Maksimal)</label>
                           <input type="number" name="team_size" class="form-control" value="5" min="2" max="10" required style="height: 48px;">
                        </div>

                        <div class="form-group" style="margin-bottom: 24px;">
                           <label class="checkbox-wrapper" style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
                              <input type="checkbox" name="use_learning_path" checked style="width: 18px; height: 18px; margin-top: 2px;">
                              <div>
                                  <span style="font-weight: 500;">Pertimbangkan Learning Path</span>
                                  <p class="text-xs text-muted mt-1" style="line-height: 1.4;">Prioritaskan satu learning path dalam satu tim.</p>
                              </div>
                           </label>
                        </div>

                        <div class="alert alert-info mt-4" style="background: #eef2ff; border: 1px solid #c7d2fe; color: #3730a3; border-radius: 8px;">
                           <div style="display: flex; gap: 8px; margin-bottom: 4px;"><strong>ℹ️ Info Saat Ini:</strong></div>
                           <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                              <li>Peserta Tanpa Tim: <strong>${students.length}</strong></li>
                              <li>Tim Terdaftar: <strong>${groups.length}</strong></li>
                           </ul>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block mt-4" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px; padding: 14px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                            <span>🎲</span>
                            <span>Mulai Randomize</span>
                        </button>
                     </form>
                 </div>
              </div>
           </div>

           <!-- Right Column: Unassigned Students List -->
           <div class="col-lg-8" style="flex: 2; min-width: 320px;">
              <div class="card" style="box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: none; border-radius: 12px; height: 100%;">
                 <div class="card-header-clean" style="padding: 24px; border-bottom: 1px solid #f1f5f9;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 class="card-title-clean" style="margin: 0; font-size: 1.25rem;">Daftar Peserta (Unassigned)</h3>
                        <span class="badge-pill" style="font-size: 13px; padding: 6px 12px;">${students.length} Peserta</span>
                    </div>
                 </div>

                 <div class="table-responsive" style="height: 600px; overflow-y: auto; padding: 0;">
                    ${isLoading ? `
                       <div class="loading-state" style="padding: 40px; text-align: center;"><div class="spinner"></div></div>
                    ` : error ? `
                       <div class="empty-state text-danger" style="padding: 40px;">${error}</div>
                    ` : students.length === 0 ? `
                       <div class="empty-state" style="padding: 60px 20px; text-align: center;">
                          <div class="empty-state-icon" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">✅</div>
                          <h4 style="margin-bottom: 8px; color: #1e293b;">Semua Beres!</h4>
                          <p style="color: #64748b;">Tidak ada peserta yang belum memiliki tim.</p>
                       </div>
                    ` : `
                       <table class="modern-table" style="width: 100%;">
                          <thead style="position: sticky; top: 0; background: white; z-index: 10; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                             <tr>
                                <th style="padding: 16px 24px;">Nama Peserta</th>
                                <th style="padding: 16px 24px;">Learning Path</th>
                                <th style="padding: 16px 24px;">Batch</th>
                                <th style="padding: 16px 24px;">ID</th>
                             </tr>
                          </thead>
                          <tbody>
                             ${students.map(s => `
                                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;">
                                   <td style="padding: 16px 24px;">
                                      <div class="d-flex align-items-center gap-3">
                                         <div class="avatar-circle-sm" style="width: 36px; height: 36px; background: linear-gradient(135deg, #6366f1, #818cf8); color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 600; font-size: 14px;">
                                            ${(s.full_name || s.name || '?').charAt(0).toUpperCase()}
                                         </div>
                                         <div style="display: flex; flex-direction: column;">
                                             <span class="fw-medium" style="color: #1e293b; font-weight: 500;">${s.full_name || s.name || 'Tanpa Nama'}</span>
                                             <span class="text-xs text-muted">${s.email || ''}</span>
                                         </div>
                                      </div>
                                   </td>
                                   <td style="padding: 16px 24px;"><span class="badge-outline" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 500;">${s.learning_path || '-'}</span></td>
                                   <td style="padding: 16px 24px;"><span class="text-sm text-muted">${s.batch_id || '-'}</span></td>
                                   <td style="padding: 16px 24px; font-family: monospace; font-size: 12px; color: #94a3b8;">${s.id || s.user_id || '-'}</td>
                                </tr>
                             `).join('')}
                          </tbody>
                       </table>
                    `}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  `;
}
