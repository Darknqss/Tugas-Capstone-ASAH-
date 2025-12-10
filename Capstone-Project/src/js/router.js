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
            const hasUser = session?.user;
            const role = session?.user?.role;
            const isAdmin = role?.toLowerCase() === 'admin';

            // 1. Root path handling - Show landing page if not logged in
            if (path === '/' || path === '') {
                if (!hasUser) {
                    // User not logged in - show landing page
                    path = '/';
                    if (path !== window.location.pathname) {
                        window.history.replaceState({}, '', path);
                    }
                } else {
                    // User logged in - redirect to appropriate dashboard
                    path = isAdmin ? '/admin-dashboard' : '/dashboard';
                    if (path !== window.location.pathname) {
                        window.history.replaceState({}, '', path);
                    }
                }
            }
            // 2. Protect authenticated routes - redirect to landing if not logged in
            else if (path !== '/login' && path !== '/register' && path !== '/') {
                if (!hasUser) {
                    // User not logged in trying to access protected route - redirect to landing
                    path = '/';
                    window.history.replaceState({}, '', path);
                    return this.loadRoute();
                }
                // 3. Strict Role Redirection
                if (isAdmin) {
                    // Map Student paths to Admin paths associated with them
                    if (path === '/dashboard') path = '/admin-dashboard';
                    else if (path === '/team-information') path = '/admin-team-information';
                    else if (path === '/dokumen-timeline') path = '/admin-dokumen-timeline';
                    else if (path === '/individual-worksheet') path = '/admin-individual-worksheet';
                    else if (path === '/360-feedback') path = '/admin-360-feedback';

                    // If path was changed, update history
                    if (path !== window.location.pathname) {
                        window.history.replaceState({}, '', path);
                        // Recursively load the new route to ensure correct component
                        return this.loadRoute();
                    }
                } else if (!isAdmin && (path === '/admin-dashboard' || path.startsWith('/admin-'))) {
                    // Student trying to access Admin pages -> Redirect to Student Dashboard
                    path = '/dashboard';
                    window.history.replaceState({}, '', path);
                }
            }
        } catch (e) {
            console.warn("Router session check failed:", e);
            // If error, show landing page for root, or keep current path
            if (path === '/' || path === '') {
                path = '/';
            }
        }

        // Normalisasi path
        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        console.log(`[Router] Loading path: ${path}`);

        // Try to get component for current path, with fallbacks
        let component = this.routes[path];
        
        // Fallback logic
        if (!component) {
            if (path === '/' || path === '') {
                try {
                    const session = JSON.parse(localStorage.getItem('capstone-auth-session') || '{}');
                    const hasUser = session?.user;
                    const role = session?.user?.role;
                    const isAdmin = role?.toLowerCase() === 'admin';
                    
                    if (hasUser) {
                        component = isAdmin ? this.routes['/admin-dashboard'] : this.routes['/dashboard'];
                        if (isAdmin && window.location.pathname !== '/admin-dashboard') {
                            window.history.replaceState({}, '', '/admin-dashboard');
                        } else if (!isAdmin && window.location.pathname !== '/dashboard') {
                            window.history.replaceState({}, '', '/dashboard');
                        }
                    } else {
                        component = this.routes['/'];
                    }
                } catch (e) {
                    component = this.routes['/'];
                }
            } else {
                // Try dashboard routes as fallback for other paths
                try {
                    const session = JSON.parse(localStorage.getItem('capstone-auth-session') || '{}');
                    const hasUser = session?.user;
                    const role = session?.user?.role;
                    const isAdmin = role?.toLowerCase() === 'admin';
                    
                    if (hasUser) {
                        component = isAdmin ? this.routes['/admin-dashboard'] : this.routes['/dashboard'];
                    } else {
                        component = this.routes['/'];
                    }
                } catch (e) {
                    component = this.routes['/'];
                }
            }
        }

        if (component) {
            console.log(`[Router] Component found for ${path}`);
            // Pastikan URL tidak memiliki hash sebelum render
            if (window.location.hash) {
                window.history.replaceState({}, '', window.location.pathname + window.location.search);
            }
            this.render(component);
        } else {
            console.error(`[Router] 404 for ${path}`);
            // Fallback untuk 404
            const app = document.getElementById('app');
            app.innerHTML = '<div style="text-align:center;padding:40px;"><h2>404 - Halaman tidak ditemukan</h2><a href="/" data-link>Kembali ke Halaman Utama</a></div>';
        }
    }

    async render(component) {
        const app = document.getElementById('app');
        if (!app) {
            console.error('App element not found');
            return;
        }

        app.innerHTML = '<div style="text-align:center;padding:40px;">Memuat...</div>';

        app.classList.add('fade-in');

        try {
            const result = component();
            // Check if component returns a Promise
            if (result && typeof result.then === 'function') {
                const html = await result;
                app.innerHTML = html;
            } else {
                app.innerHTML = result;
            }
        } catch (error) {
            console.error('Error rendering component:', error);
            app.innerHTML = '<div style="text-align: center; padding: 50px; color: red;">Error loading page</div>';
        }

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