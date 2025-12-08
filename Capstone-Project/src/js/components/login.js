export function LoginPage() {
  return `
    <section class="auth-page">
      <div class="auth-card">
        <div class="auth-card__header">
          <p class="auth-breadcrumb">Capstone Team &rsaquo; Masuk</p>
          <h2 class="auth-title">Masuk</h2>
          <p class="auth-subtitle">Masukkan kredensial Anda untuk melanjutkan.</p>
        </div>

        <form class="auth-form" data-auth-form="login" novalidate>
          <div class="form-feedback" data-form-feedback hidden></div>

          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" name="email" placeholder="email@contoh.com" autocomplete="email" required />
            <p class="form-error" data-error="email"></p>
          </div>

          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" name="password" placeholder="Password" autocomplete="current-password" required />
            <p class="form-error" data-error="password"></p>
          </div>

          <button type="submit" class="btn btn-primary btn-full" data-submit-text="Masuk">Masuk</button>
        </form>

        <p class="auth-switch">
          Belum punya akun? <a href="/register" data-link>Daftar di sini</a>
        </p>
      </div>
    </section>
  `;
}
