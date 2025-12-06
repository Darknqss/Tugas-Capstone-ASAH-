export class Router {
    constructor() {
        this.routes = {};
    }

    addRoute(path, component) {
        this.routes[path] = component;
    }

    navigate(path) {
        // Normalisasi path: buang "#" dan "/" di depan sebelum set hash
        const clean = String(path || "").replace(/^#/, "").replace(/^\//, "");
        window.location.hash = clean;
        this.loadRoute();
    }

    loadRoute() {
        // Try hash-based routing first (for anchor links)
        const hash = window.location.hash.slice(1);
        if (hash) {
            const routePath = `/${hash}`;
            const component = this.routes[routePath];
            if (component) {
                this.render(component);
                return;
            }
        }
        
        // Fall back to pathname-based routing
        let path = window.location.pathname.replace(/^\//, '') || '';
        if (!path) {
            // Check if user is admin and redirect accordingly
            try {
                const session = JSON.parse(localStorage.getItem('capstone-auth-session') || '{}');
                path = session?.user?.role === 'admin' ? 'admin-dashboard' : 'dashboard';
            } catch {
                path = 'dashboard';
            }
        }
        const routePath = `/${path}`;
        const component = this.routes[routePath] || this.routes['/dashboard'] || this.routes['/admin-dashboard'];
        this.render(component);
    }

    async render(component) {
        const app = document.getElementById('app');
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

        document.dispatchEvent(new CustomEvent('capstone:route-rendered'));
    }
}
// test 