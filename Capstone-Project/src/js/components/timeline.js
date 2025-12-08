import { getTimeline } from "../services/userService.js";

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC'
  };
  return date.toLocaleDateString('id-ID', options);
}

// Helper function to format date with time
function formatDateTime(dateString) {
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  };
  return date.toLocaleDateString('id-ID', options);
}

// Helper function to check if date is in the past
function isPastDate(dateString) {
  return new Date(dateString) < new Date();
}

// Helper function to check if date is today or in the future
function isUpcoming(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date >= today;
}

// Helper function to get status badge class
function getStatusClass(startAt, endAt) {
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);
  
  if (now < start) {
    return 'timeline-status--upcoming';
  } else if (now >= start && now <= end) {
    return 'timeline-status--active';
  } else {
    return 'timeline-status--completed';
  }
}

export async function TimelinePage() {
  let timelineData = [];
  
  try {
    const response = await getTimeline();
    timelineData = response?.data || [];
    
    // Sort by status: completed first, then active, then upcoming
    timelineData.sort((a, b) => {
      const statusA = getStatusClass(a.start_at, a.end_at);
      const statusB = getStatusClass(b.start_at, b.end_at);
      
      // Define order: completed (0), active (1), upcoming (2)
      const order = {
        'timeline-status--completed': 0,
        'timeline-status--active': 1,
        'timeline-status--upcoming': 2
      };
      
      const orderA = order[statusA] ?? 3;
      const orderB = order[statusB] ?? 3;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // If same status, sort by start date (earliest first for completed, latest first for upcoming)
      const dateA = new Date(a.start_at);
      const dateB = new Date(b.start_at);
      
      if (statusA === 'timeline-status--upcoming') {
        return dateA - dateB; // Upcoming: earliest first
      } else {
        return dateB - dateA; // Completed/Active: latest first
      }
    });
  } catch (error) {
    console.error("Error fetching timeline:", error);
  }

  return `
    <div class="container content-section">
      <div class="section-header">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <h1 class="section-title">Timeline Pengerjaan</h1>
            <p class="section-description">Jadwal milestone dan deadline capstone project</p>
          </div>
          <a href="/dokumen-timeline" class="btn btn-outline timeline-back-btn" data-link>
            Kembali ke Dokumen & Timeline
          </a>
        </div>
      </div>

      <div class="timeline-container">
        ${timelineData.length === 0 ? `
          <div class="card">
            <div class="empty-state">
              <div class="empty-state-icon">📅</div>
              <p class="empty-state-text">Timeline belum tersedia</p>
              <p class="empty-state-subtext">Jadwal milestone dan deadline akan muncul di sini</p>
            </div>
          </div>
        ` : `
          <div class="timeline-wrapper">
            ${timelineData.map((item, index) => {
              const isDeadline = item.title?.includes('[DEADLINE]');
              const statusClass = getStatusClass(item.start_at, item.end_at);
              const isSameDay = new Date(item.start_at).toDateString() === new Date(item.end_at).toDateString();
              
              return `
                <div class="timeline-item ${statusClass}" data-timeline-item>
                  <div class="timeline-marker">
                    <div class="timeline-marker-dot"></div>
                    ${index < timelineData.length - 1 ? '<div class="timeline-line"></div>' : ''}
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <h3 class="timeline-title">
                        ${isDeadline ? '<span class="timeline-badge timeline-badge--deadline">DEADLINE</span>' : ''}
                        ${item.title || 'Untitled'}
                      </h3>
                      <span class="timeline-status ${statusClass}">
                        ${statusClass === 'timeline-status--active' ? 'Sedang Berlangsung' : 
                          statusClass === 'timeline-status--completed' ? 'Selesai' : 'Akan Datang'}
                      </span>
                    </div>
                    <div class="timeline-dates">
                      <div class="timeline-date-item">
                        <span class="timeline-date-label">${isSameDay ? 'Tanggal' : 'Mulai'}:</span>
                        <span class="timeline-date-value">${formatDate(item.start_at)}</span>
                      </div>
                      ${!isSameDay ? `
                        <div class="timeline-date-item">
                          <span class="timeline-date-label">Selesai:</span>
                          <span class="timeline-date-value">${formatDate(item.end_at)}</span>
                        </div>
                      ` : ''}
                    </div>
                    ${item.description ? `
                      <p class="timeline-description">${item.description}</p>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

