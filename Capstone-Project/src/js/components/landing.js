export function LandingPage() {
  return `
    <!-- Hero Section -->
    <section class="landing-hero-section">
      <div class="landing-hero-background">
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
        <div class="floating-shape shape-3"></div>
      </div>
      <div class="container">
        <div class="landing-hero-content">
          <h1 class="landing-hero-title">
            Kelola Proyek Capstone Tim Anda
            <span class="gradient-text">Dengan Lebih Efisien</span>
          </h1>
          <p class="landing-hero-subtitle">
            Platform terpadu untuk mengelola proyek capstone tim Anda. 
            Akses dashboard, informasi tim, dokumen, worksheet, dan feedback dalam satu tempat.
          </p>
          <div class="landing-hero-buttons">
            <a href="/register" class="btn btn-primary btn-hero" data-link>
              <span>Mulai Sekarang</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
            <a href="/login" class="btn btn-hero-outline" data-link>
              Masuk ke Akun
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="landing-features-section">
      <div class="container">
        <div class="landing-section-header">
          <div class="section-badge">Fitur Unggulan</div>
          <h2 class="landing-section-title">Semua yang Anda Butuhkan</h2>
          <p class="landing-section-description">
            Platform lengkap dengan fitur-fitur canggih untuk mendukung kesuksesan proyek capstone tim Anda
          </p>
        </div>
        <div class="landing-features-grid">
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <div class="feature-icon-bg"></div>
              <div class="feature-icon">📊</div>
            </div>
            <h3 class="feature-title">Dashboard Interaktif</h3>
            <p class="feature-description">Pantau progress proyek dan aktivitas tim secara real-time dengan visualisasi yang jelas dan mudah dipahami</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <div class="feature-icon-bg"></div>
              <div class="feature-icon">👥</div>
            </div>
            <h3 class="feature-title">Informasi Tim</h3>
            <p class="feature-description">Kelola data anggota tim dan informasi kelompok dengan mudah, terorganisir, dan selalu ter-update</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <div class="feature-icon-bg"></div>
              <div class="feature-icon">📄</div>
            </div>
            <h3 class="feature-title">Dokumen & Timeline</h3>
            <p class="feature-description">Simpan dan kelola semua dokumen proyek di satu tempat dengan timeline yang jelas dan terstruktur</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <div class="feature-icon-bg"></div>
              <div class="feature-icon">📝</div>
            </div>
            <h3 class="feature-title">Individual Worksheet</h3>
            <p class="feature-description">Lacak kontribusi individu setiap anggota tim secara detail, transparan, dan akurat</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <div class="feature-icon-bg"></div>
              <div class="feature-icon">💬</div>
            </div>
            <h3 class="feature-title">360 Feedback</h3>
            <p class="feature-description">Berikan dan terima feedback konstruktif dari anggota tim untuk pengembangan bersama yang lebih baik</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <div class="feature-icon-bg"></div>
              <div class="feature-icon">🔐</div>
            </div>
            <h3 class="feature-title">Akses Terkontrol</h3>
            <p class="feature-description">Sistem keamanan yang handal dan terpercaya untuk melindungi data proyek Anda dengan maksimal</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h3 class="footer-title">Capstone Team Dashboard</h3>
            <p class="footer-description">
              Platform terpadu untuk mengelola proyek capstone tim Anda dengan lebih efisien dan terorganisir.
            </p>
          </div>
          <div class="footer-section">
            <h4 class="footer-heading">Fitur</h4>
            <ul class="footer-links">
              <li><a href="/dashboard" data-link>Dashboard</a></li>
              <li><a href="/team-information" data-link>Team Information</a></li>
              <li><a href="/dokumen-timeline" data-link>Dokumen & Timeline</a></li>
              <li><a href="/individual-worksheet" data-link>Individual Worksheet</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4 class="footer-heading">Bantuan</h4>
            <ul class="footer-links">
              <li><a href="/login" data-link>Masuk</a></li>
              <li><a href="/register" data-link>Daftar</a></li>
              <li><a href="#" onclick="return false;">Kebijakan Privasi</a></li>
              <li><a href="#" onclick="return false;">Syarat & Ketentuan</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4 class="footer-heading">Kontak</h4>
            <ul class="footer-links">
              <li>Email: support@capstone.com</li>
              <li>Phone: +62 123 456 789</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2025 Capstone Team Dashboard. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;
}

