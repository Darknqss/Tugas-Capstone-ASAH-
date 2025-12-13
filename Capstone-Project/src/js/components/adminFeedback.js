import { exportFeedbackData, listAllGroups, getGroupById } from "../services/adminService.js";

// Module-level state cache
let _cachedFeedbackData = [];
let _cachedGroupsData = [];

export async function AdminFeedbackPage() {
  let groups = [];
  let feedbackData = [];
  let hasError = false;

  try {
    const [groupsRes, feedbackRes] = await Promise.all([
      listAllGroups(),
      exportFeedbackData()
    ]);

    // Normalize groups data (handle different API responses)
    let basicGroups = [];
    if (groupsRes?.data && Array.isArray(groupsRes.data)) {
      basicGroups = groupsRes.data;
    } else if (groupsRes?.groups && Array.isArray(groupsRes.groups)) {
      basicGroups = groupsRes.groups;
    } else if (Array.isArray(groupsRes)) {
      basicGroups = groupsRes;
    }

    feedbackData = feedbackRes?.data || [];
    _cachedFeedbackData = feedbackData;

    // Robust Fetching
    groups = await Promise.all(basicGroups.map(async (g) => {
      try {
        const groupId = g.group_id || g.id || g.groupId;
        if (!groupId) return g;

        const detailRes = await getGroupById(groupId);
        const detail = detailRes?.data || detailRes || {};
        const merged = { ...g, ...detail };

        // Normalize members
        let members = [];
        if (merged.members && Array.isArray(merged.members)) members = merged.members;
        else if (merged.group_members && Array.isArray(merged.group_members)) members = merged.group_members;
        else if (merged.users && Array.isArray(merged.users)) members = merged.users;
        else if (merged.member_list && Array.isArray(merged.member_list)) members = merged.member_list;

        merged.members = members;
        return merged;
      } catch (e) {
        console.warn(`Failed to fetch details for group ${g.id}`, e);
        let members = [];
        if (g.members && Array.isArray(g.members)) members = g.members;
        else if (g.group_members && Array.isArray(g.group_members)) members = g.group_members;
        return { ...g, members };
      }
    }));

    _cachedGroupsData = groups;

    // DEBUG: Log data for troubleshooting progress bar
    console.log('[AdminFeedback] Total groups:', groups.length);
    console.log('[AdminFeedback] Total feedback entries:', feedbackData.length);
    if (feedbackData.length > 0) {
      console.log('[AdminFeedback] Sample feedback entry:', feedbackData[0]);
    }
    groups.forEach(g => {
      console.log(`[AdminFeedback] Group "${g.group_name}": ${g.members?.length || 0} members`);
      if (g.members?.length > 0) {
        console.log('[AdminFeedback] Sample member:', g.members[0]);
      }
    });

  } catch (error) {
    console.error("Error fetching feedback data:", error);
    hasError = true;
  }

  const uniqueReviewers = new Set(feedbackData.map(f => f.reviewer_name)).size;

  return `
    <div class="admin-subpage-wrapper">
      
      <div class="container main-content-wrapper" style="margin-top: 30px;">
        
        <!-- Header Section -->
        <div class="section-header mb-4">
          <h2 class="section-title fw-bold text-dark">360 Feedback - Admin</h2>
          <p class="section-description text-muted">Monitor dan export data feedback 360 derajat per tim</p>
        </div>

        <!-- Toolbar -->
        <div class="admin-toolbar-card">
           <div class="toolbar-left">
              <span class="text-sm text-muted">Total Entri: <strong>${feedbackData.length}</strong></span>
              <span class="text-sm text-muted ms-3">Reviewer: <strong>${uniqueReviewers}</strong></span>
           </div>
           <div class="toolbar-right">
              <!-- SINGLE EXPORT BUTTON -->
              <button class="btn-primary-icon" id="export-feedback-btn" data-export-feedback>
                <i class="bi bi-file-earmark-excel"></i> Export Data (Excel)
              </button>
           </div>
        </div>

        <!-- Groups List Table -->
        <div class="card list-card">
          <div class="table-responsive">
            ${hasError ? `
              <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">Gagal memuat data feedback</p>
              </div>
            ` : groups.length === 0 ? `
              <div class="empty-state" style="padding: 60px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                <h3 style="margin: 0; font-size: 18px; color: #333;">Belum ada tim</h3>
              </div>
            ` : `
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Nama Tim</th>
                    <th>Jumlah Anggota</th>
                    <th>Status Feedback</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${groups.map((group) => {
    const members = group.members || [];
    const groupName = group.group_name || group.name || '';
    const groupId = group.group_id || group.id;
    const totalMembers = members.length;

    // Build a list of all member identifiers for this group
    const memberIdentifiers = members.map(m => ({
      name: m.name || m.full_name || m.email || '',
      id: String(m.source_id || m.id || m.users_source_id || '')
    }));

    // Count members who have given feedback by checking all feedback data
    let membersWhoGaveFeedback = 0;
    memberIdentifiers.forEach(member => {
      const hasFeedback = feedbackData.some(f => {
        // Get reviewer info from feedback
        const reviewerName = f.reviewer?.name || f.reviewer_name || '';
        const reviewerId = String(f.reviewer?.users_source_id || f.reviewer?.id || f.reviewer_id || '');

        // Match by ID if available
        if (member.id && reviewerId && member.id === reviewerId) {
          return true;
        }
        // Match by name
        if (member.name && reviewerName && member.name === reviewerName) {
          return true;
        }
        return false;
      });
      if (hasFeedback) membersWhoGaveFeedback++;
    });

    const percent = totalMembers > 0 ? Math.round((membersWhoGaveFeedback / totalMembers) * 100) : 0;

    // Status indicator color based on progress
    const statusClass = percent === 100 ? 'status-accepted' : percent > 0 ? 'status-pending_validation' : 'status-draft';
    const statusText = percent === 100 ? '✅ Selesai' : percent > 0 ? '⏳ Dalam Progress' : '📝 Belum Dimulai';

    return `
                    <tr data-group-id="${groupId}" style="cursor: pointer;">
                      <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                          <div class="team-avatar">${(groupName || "?").charAt(0).toUpperCase()}</div>
                          <div class="fw-bold text-dark" style="font-size: 15px;">${groupName || 'Tim Tanpa Nama'}</div>
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span style="font-size: 18px;">👤</span>
                          <span style="font-weight: 600; color: var(--text-dark);">${totalMembers}</span>
                          <span style="font-size: 13px; color: #6c757d;">anggota</span>
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 100px; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                              <div style="width: ${percent}%; height: 100%; background: ${percent === 100 ? '#28a745' : '#4f46e5'}; border-radius: 4px; transition: width 0.3s;"></div>
                            </div>
                            <span style="font-size: 13px; font-weight: 600; color: ${percent === 100 ? '#28a745' : '#666'};">${membersWhoGaveFeedback}/${totalMembers}</span>
                          </div>
                          <span class="status-indicator ${statusClass}" style="font-size: 11px;">${statusText}</span>
                        </div>
                      </td>
                      <td>
                        <button class="btn-primary-sm" onclick="window.showFeedbackDetail('${groupId}')">
                           Lihat Detail
                        </button>
                      </td>
                    </tr>
                    `;
  }).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>
      </div>

      <!-- Feedback Detail Modal (Group Level) -->
      <div id="feedback-detail-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: none; justify-content: center; align-items: center; padding: 20px;">
        <div class="card modal-content" style="width: 100%; max-width: 900px; max-height: 90vh; overflow-y: auto; margin: auto; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.2); background: #fff; border-radius: 12px; display: flex; flex-direction: column;">
            
            <button class="btn-icon" onclick="document.getElementById('feedback-detail-modal').style.display='none'" style="position: absolute; top: 20px; right: 24px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; z-index: 10; line-height: 1;">&times;</button>
            
            <div class="card-header text-center" style="padding: 24px 32px; border-bottom: 1px solid #eee;">
               <h3 class="card-title mb-1 fw-bold text-dark" id="feedback-detail-title">Detail Feedback</h3>
               <p class="text-muted mb-0 small">Overview status pengisian feedback anggota tim.</p>
            </div>
            
            <div id="feedback-detail-content" style="padding: 32px; text-align: justify;">
               <!-- Content injected by JS -->
            </div>
        </div>
      </div>

      <!-- Member Feedback Detail Modal (Secondary Popup) -->
         <div id="member-feedback-modal" class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 10000; display: none; justify-content: center; align-items: center; padding: 20px;">
           <div class="card modal-content" style="width: 100%; max-width: 750px; max-height: 85vh; overflow-y: auto; margin: auto; position: relative; box-shadow: 0 15px 35px rgba(0,0,0,0.3); background: #fff; border-radius: 12px; display: flex; flex-direction: column;">
               
               <button class="btn-icon" onclick="document.getElementById('member-feedback-modal').style.display='none'" style="position: absolute; top: 20px; right: 24px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; z-index: 10; line-height: 1;">&times;</button>
               
               <div class="card-header text-center" style="padding: 24px 32px; border-bottom: 1px solid #eee; background-color: #f8f9fa;">
                  <h5 class="card-title mb-0 fw-bold text-dark" id="member-feedback-title">Feedback Member</h5>
               </div>
               
               <div id="member-feedback-content" style="padding: 32px; text-align: justify;">
                  <!-- Content injected by JS -->
               </div>
           </div>
         </div>

    </div>
  `;
}

// Global function to show modal (attached to window)
window.showFeedbackDetail = function (groupId) {
  const modal = document.getElementById('feedback-detail-modal');
  const titleEl = document.getElementById('feedback-detail-title');
  const contentEl = document.getElementById('feedback-detail-content');

  // Find group data
  const group = _cachedGroupsData.find(g => (g.id || g.group_id) == groupId);

  if (!group) {
    alert("Data grup tidak ditemukan");
    return;
  }

  if (titleEl) titleEl.textContent = `Detail Feedback: ${group.group_name || '-'}`;

  // Render content
  const members = group.members || [];
  const feedbackData = _cachedFeedbackData;

  if (members.length === 0) {
    contentEl.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                <h5 style="margin: 0; font-size: 18px; color: #333; font-weight: 600;">Tidak ada anggota di tim ini</h5>
            </div>
        `;
  } else {
    // --- MODERN TABLE LAYOUT (Matching adminTeamInfo style) ---
    let html = `
            <div class="table-responsive">
                <table class="modern-table" style="width: 100%;">
                    <thead>
                       <tr>
                          <th>Nama Anggota</th>
                          <th>Status</th>
                          <th>Total Review</th>
                          <th>Aksi</th>
                       </tr>
                    </thead>
                    <tbody>
        `;

    html += members.map(member => {
      const name = member.name || member.full_name || member.email || "Unknown";

      // Robust Logic to count feedback
      const givenFeedback = feedbackData.filter(f => {
        const reviewerId = String(f.reviewer?.users_source_id || f.reviewer?.id || f.reviewer_id || '');
        const reviewerName = f.reviewer?.name || f.reviewer_name || '';
        const memberId = String(member.source_id || member.id || member.users_source_id || '');

        if (memberId && reviewerId && memberId === reviewerId) return true;
        return reviewerName === name;
      });

      const count = givenFeedback.length;
      const isDone = count > 0;

      return `
             <tr style="cursor: pointer;">
                <td>
                   <div style="display: flex; align-items: center; gap: 12px;">
                       <div class="team-avatar">${(name || "?").charAt(0).toUpperCase()}</div>
                       <div>
                           <div style="font-weight: 600; color: #333; font-size: 14px;">${name}</div>
                           <div style="font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px;">${member.role || 'Member'}</div>
                       </div>
                   </div>
                </td>
                <td>
                   <span class="status-indicator ${isDone ? 'status-accepted' : 'status-rejected'}">
                      ${isDone ? '✅ SUDAH' : '❌ BELUM'}
                   </span>
                </td>
                <td>
                   <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-weight: 700; font-size: 16px; color: #333;">${count}</span>
                      <span style="font-size: 13px; color: #6c757d;">feedback</span>
                   </div>
                </td>
                <td>
                    <button class="btn-primary-sm" onclick="window.showMemberFeedback('${groupId}', '${name.replace(/'/g, "\\'")}')">
                       Lihat Detail
                    </button>
                </td>
             </tr>
             `;
    }).join('');

    html += `</tbody></table></div>`;
    contentEl.innerHTML = html;
  }

  if (modal) modal.style.display = 'flex';
};

window.showMemberFeedback = function (groupId, memberName) {
  const modal = document.getElementById('member-feedback-modal');
  const titleEl = document.getElementById('member-feedback-title');
  const contentEl = document.getElementById('member-feedback-content');

  // Find member to get ID if possible
  const group = _cachedGroupsData.find(g => (g.id || g.group_id) == groupId);
  const member = group?.members?.find(m => (m.name || m.full_name) === memberName);

  const feedbackData = _cachedFeedbackData.filter(f => {
    if (!member) return (f.reviewer_name === memberName);

    if (f.reviewer?.users_source_id && member.source_id) {
      return f.reviewer.users_source_id == member.source_id;
    }
    if (f.reviewer?.id && member.id) {
      return f.reviewer.id == member.id;
    }
    const revName = f.reviewer?.name || f.reviewer_name;
    return revName === memberName;
  });

  if (titleEl) titleEl.innerHTML = `Feedback dari <span class="text-primary fw-bold">${memberName}</span>`;

  if (feedbackData.length === 0) {
    contentEl.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📭</div>
                <h5 style="margin: 0; font-size: 18px; color: #333; font-weight: 600;">Belum ada feedback</h5>
                <p style="color: #6c757d; margin-top: 8px; font-size: 14px;">Member ini belum memberikan penilaian.</p>
            </div>
        `;
  } else {
    contentEl.innerHTML = `
            <div class="table-responsive">
                <table class="modern-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Reviewee</th>
                            <th>Kontribusi</th>
                            <th style="width: 45%;">Alasan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${feedbackData.map(fb => {
      const revieweeName = fb.reviewee?.name || fb.reviewee_name || '-';
      const contribution = fb.contribution_level || fb.contribution || 'N/A';

      return `
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div class="team-avatar" style="width: 32px; height: 32px; font-size: 12px;">${(revieweeName || "?").charAt(0).toUpperCase()}</div>
                                        <span style="font-weight: 600; color: #333;">${revieweeName}</span>
                                    </div>
                                </td>
                                <td>
                                    <span class="status-indicator status-pending_validation">
                                        ${getContributionLabel(contribution)}
                                    </span>
                                </td>
                                <td style="text-align: justify; line-height: 1.6; color: #555; font-size: 13px;">${fb.reason || '-'}</td>
                            </tr>
                        `;
    }).join('')}
                    </tbody>
                </table>
            </div>
        `;
  }

  if (modal) modal.style.display = 'flex';
};

function getContributionLabel(contribution) {
  if (!contribution) return 'N/A';
  // Dynamic formatting: replace underscores with spaces and capitalize each word
  return contribution
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}