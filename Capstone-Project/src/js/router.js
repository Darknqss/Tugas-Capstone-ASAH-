export class Router {
    constructor() {
        this.routes = {};
    }

    addRoute(path, component) {
        this.routes[path] = component;
    }

    navigate(path) {
        // Normalisasi path: buang "#" dan pastikan ada "/" di depan
        let clean = String(path || "").replace(/^#/, "");
        if (!clean.startsWith('/')) {
            clean = '/' + clean;
        }

        // Split path dan query string jika ada (preserve query string)
        const [pathname, search] = clean.split('?');
        const fullPath = pathname + (search ? '?' + search : '');

        // Gunakan history API untuk path-based routing (BUKAN hash)
        window.history.pushState({}, '', fullPath);
        this.loadRoute();
    }

    loadRoute() {
        // Hapus hash dari URL jika ada (untuk backward compatibility)
        // Redirect hash ke pathname - HANYA jika hash ada, jangan tambahkan hash
        if (window.location.hash && window.location.hash !== '#') {
            const hashPath = window.location.hash.slice(1);
            let cleanHashPath = hashPath.startsWith('/') ? hashPath : '/' + hashPath;
            // Split untuk handle query string
            const [pathname, search] = cleanHashPath.split('?');
            const fullPath = pathname + (search ? '?' + search : '');
            // Redirect hash ke pathname (sekali saja) - ini akan trigger loadRoute lagi
            // Hapus hash dari URL dengan replaceState
            window.history.replaceState({}, '', fullPath);
            // Recurse untuk load route dengan pathname yang baru
            return this.loadRoute();
        }

        // Pastikan tidak ada hash di URL - hapus jika masih ada (untuk safety)
        if (window.location.hash) {
            window.history.replaceState({}, '', window.location.pathname + window.location.search);
        }

        // Gunakan pathname-based routing (BUKAN hash)
        let path = window.location.pathname;

        // Handle root path and Role-Based Redirection
        try {
            const session = JSON.parse(localStorage.getItem('capstone-auth-session') || '{}');
            const role = session?.user?.role;
            const isAdmin = role?.toLowerCase() === 'admin';

            // 1. Root path handling
            if (path === '/' || path === '') {
                path = isAdmin ? '/admin-dashboard' : '/dashboard';
                if (path !== window.location.pathname) {
                    window.history.replaceState({}, '', path);
                }
            }
            // 2. Strict Role Redirection
            else if (path !== '/login' && path !== '/register') {
                if (isAdmin && (path === '/dashboard' || path === '/team-information' || path === '/dokumen-timeline' || path === '/individual-worksheet')) {
                    // Admin trying to access Student pages -> Redirect to Admin Dashboard
                    path = '/admin-dashboard';
                    window.history.replaceState({}, '', path);
                    return this.loadRoute();
                } else if (!isAdmin && (path === '/admin-dashboard' || path.startsWith('/admin-'))) {
                    // Student trying to access Admin pages -> Redirect to Student Dashboard
                    path = '/dashboard';
                    window.history.replaceState({}, '', path);
                }
            }
        } catch (e) {
            console.warn("Router session check failed:", e);
            if (path === '/' || path === '') path = '/dashboard';
        }

        // Normalisasi path
        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        const component = this.routes[path] || this.routes['/dashboard'] || this.routes['/admin-dashboard'];
        if (component) {
            // Pastikan URL tidak memiliki hash sebelum render
            if (window.location.hash) {
                window.history.replaceState({}, '', window.location.pathname + window.location.search);
            }
            this.render(component);
        } else {
            // Fallback untuk 404
            const app = document.getElementById('app');
            app.innerHTML = '<div style="text-align:center;padding:40px;"><h2>404 - Halaman tidak ditemukan</h2><a href="/dashboard" data-link>Kembali ke Dashboard</a></div>';
        }
    }

    async render(component) {
        const app = document.getElementById('app');
        if (!app) {
            console.error('App element not found');
            return;
        }

        app.innerHTML = '<div style="text-align:center;padding:40px;">Memuat...</div>';

        try {
            const result = component();
            // Check if component returns a Promise
            if (result && typeof result.then === 'function') {
                app.innerHTML = await result;
            } else {
                app.innerHTML = result;
            }
        } catch (error) {
            console.error('Error rendering component:', error);
            app.innerHTML = '<div style="text-align:center;padding:40px;color:red;">Error loading page</div>';
        }

        app.classList.add('fade-in');

        // Remove animation class after animation completes
        setTimeout(() => {
            app.classList.remove('fade-in');
        }, 500);

        // Dispatch event setelah sedikit delay untuk memastikan DOM sudah ready
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('capstone:route-rendered'));
        }, 50);
    }
}
// test
// test 