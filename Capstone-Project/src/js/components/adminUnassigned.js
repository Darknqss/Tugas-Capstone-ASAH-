import { getUnassignedStudents } from "../services/adminService.js";
import { readSession } from "../services/authService.js";

export async function AdminUnassignedPage() {
   let students = [];
   let isLoading = true;
   let error = null;

   try {
      // Fetch students without team (all batches)
      // adminService's getUnassignedStudents defaults to asah-batch-1 if null is passed and backend requires it.
      // However, if we want *all* and backend supports it, we might need to loop or change backend. 
      // Assuming the fix in adminService works for the user's batch.
      const response = await getUnassignedStudents(null);
      students = response?.data || [];

      console.log("[AdminUnassigned] Students:", students);
   } catch (err) {
      console.error("Error fetching unassigned students:", err);
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
             <h2 class="admin-page-title">Peserta Tanpa Tim</h2>
             <p class="admin-page-subtitle">Daftar mahasiswa yang belum masuk ke dalam kelompok manapun.</p>
          </div>
        </div>

        <!-- Content Grid -->
        <div style="display: grid; grid-template-columns: 1fr 350px; gap: 24px; align-items: start;">
           
           <!-- List Section (Left) -->
           <div class="card" style="box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: none; border-radius: 12px;">
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
                              </tr>
                           `).join('')}
                        </tbody>
                     </table>
                  `}
               </div>
           </div>

           <!-- Randomize Form Section (Right) -->
           <div class="card" style="box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: none; border-radius: 12px; position: sticky; top: 20px;">
               <div class="card-header-clean" style="padding: 20px; border-bottom: 1px solid #f1f5f9;">
                  <h3 class="card-title-clean" style="margin: 0; font-size: 1.1rem;">🎲 Randomize Team</h3>
               </div>
               <div style="padding: 24px;">
                  <p class="text-muted text-sm mb-4" style="line-height: 1.5;">Bentuk tim secara otomatis untuk peserta yang ada di daftar ini.</p>
                  
                  <form id="randomize-form" data-randomize-form>
                     <div class="form-group" style="margin-bottom: 16px;">
                       <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;">Target Batch ID</label>
                       <input type="text" name="batch_id" class="form-control" value="asah-batch-1" required placeholder="Contoh: asah-batch-1" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                     </div>
                     
                     <div class="form-group" style="margin-bottom: 16px;">
                       <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;">Ukuran Tim (Maksimal)</label>
                       <input type="number" name="team_size" class="form-control" value="5" min="2" max="10" required style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                     </div>
                     
                     <div class="form-group" style="margin-bottom: 24px;">
                       <label class="checkbox-wrapper" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                          <input type="checkbox" name="use_learning_path" checked style="width: 16px; height: 16px;">
                          <span style="font-size: 14px; color: #475569;">Pertimbangkan Learning Path</span>
                       </label>
                     </div>
                     
                     <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; padding: 12px;">
                        <span>🎲</span> Mulai Randomize
                     </button>
                  </form>
               </div>
           </div>

        </div>
      </div>
    </div>
  `;
}
