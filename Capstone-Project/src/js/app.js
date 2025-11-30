import { Router } from './router.js';
import { DashboardPage } from './components/dashboard.js';
import { TeamInfoPage } from './components/teamInfo.js';
import { DocumentsPage } from './components/documents.js';
import { WorksheetPage } from './components/worksheet.js';
import { FeedbackPage } from './components/feedback.js';

// Initialize the application
class App {
    constructor() {
        this.router = new Router();
        this.init();
    }

    init() {
        // Register routes
        this.registerRoutes();
        
        // Handle navigation clicks
        this.handleNavigation();
        
        // Load initial route
        this.router.loadRoute();
    }

    registerRoutes() {
        this.router.addRoute('/', DashboardPage);
        this.router.addRoute('/dashboard', DashboardPage);
        this.router.addRoute('/team-information', TeamInfoPage);
        this.router.addRoute('/dokumen-timeline', DocumentsPage);
        this.router.addRoute('/individual-worksheet', WorksheetPage);
        this.router.addRoute('/360-feedback', FeedbackPage);
    }

    handleNavigation() {
        // Handle link clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-link]')) {
                e.preventDefault();
                const href = e.target.getAttribute('href');
                // Use hash-based navigation for single page app
                window.location.hash = href;
                this.router.loadRoute();
                this.updateActiveLink(e.target);
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.router.loadRoute();
            this.updateActiveNavLink();
        });
        
        // Handle hash change
        window.addEventListener('hashchange', () => {
            this.router.loadRoute();
            this.updateActiveNavLink();
        });
    }

    updateActiveNavLink() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href').replace('#', '');
            if (href === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});