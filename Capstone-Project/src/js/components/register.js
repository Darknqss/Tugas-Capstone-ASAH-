export function RegisterPage() {
  return `
    <section class="auth-page">
      <div class="auth-card">
        <div class="auth-card__header">
          <p class="auth-breadcrumb">Capstone Team &rsaquo; Pendaftaran</p>
          <h2 class="auth-title">Daftar</h2>
          <p class="auth-subtitle">Masukkan data sesuai sertifikat yang akan diterbitkan.</p>
        </div>

        <form class="auth-form" data-auth-form="register" novalidate>
          <div class="form-feedback" data-form-feedback hidden></div>

          <div class="form-group">
            <label for="register-fullname">Nama Lengkap</label>
            <input type="text" id="register-fullname" name="full_name" placeholder="Nama Lengkap" autocomplete="name" required />
            <p class="form-hint">Masukkan nama asli Anda, akan digunakan pada sertifikat.</p>
            <p class="form-error" data-error="full_name"></p>
          </div>

          <div class="form-group">
            <label for="register-email">Email</label>
            <input type="email" id="register-email" name="email" placeholder="email@contoh.com" autocomplete="email" required />
            <p class="form-hint">Gunakan alamat email aktif Anda.</p>
            <p class="form-error" data-error="email"></p>
          </div>

          <div class="form-group">
            <label for="register-password">Password</label>
            <input type="password" id="register-password" name="password" placeholder="Minimal 8 karakter" autocomplete="new-password" minlength="8" required />
            <p class="form-hint">Gunakan minimal 8 karakter kombinasi huruf dan angka.</p>
            <p class="form-error" data-error="password"></p>
          </div>

          <div class="form-group form-group--inline">
            <label for="register-role">Role</label>
            <select id="register-role" name="role">
              <option value="student" selected>Student</option>
              <option value="admin">Admin</option>
            </select>
            <p class="form-hint">Pilih peran Anda pada platform.</p>
            <p class="form-error" data-error="role"></p>
          </div>

          <button type="submit" class="btn btn-primary btn-full" data-submit-text="Daftar">Daftar</button>
        </form>

        <div class="auth-separator">
          <span>Atau</span>
        </div>

        <button type="button" class="btn btn-outline btn-full" disabled>
          Daftar dengan Google (Coming Soon)
        </button>

        <p class="auth-switch">
          Sudah punya akun?
          <a href="#login" data-link>Masuk sekarang</a>
        </p>
      </div>
    </section>
  `;
}

