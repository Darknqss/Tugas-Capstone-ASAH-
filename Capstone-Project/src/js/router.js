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
        let path = window.location.pathname.replace(/^\//, '') || 'dashboard';
        const routePath = `/${path}`;
        const component = this.routes[routePath] || this.routes['/dashboard'];
        this.render(component);
    }

    render(component) {
        const app = document.getElementById('app');
        app.innerHTML = component();
        app.classList.add('fade-in');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            app.classList.remove('fade-in');
        }, 500);

        document.dispatchEvent(new CustomEvent('capstone:route-rendered'));
    }
}