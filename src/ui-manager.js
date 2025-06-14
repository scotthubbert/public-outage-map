// UI management and Calcite component interactions
export class UIManager {
    constructor() {
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.counterContent = document.getElementById('counter-content');
        this.fiberCount = document.getElementById('fiber-count');
        this.electricCount = document.getElementById('electric-count');
        this.layersPanel = document.getElementById('layers-panel');
        this.statusAlert = document.getElementById('status-alert');
        this.alertMessage = document.getElementById('alert-message');
    }

    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.hidden = true;
        }
        if (this.counterContent) {
            this.counterContent.style.display = 'block';
        }
    }

    showCounterLoading() {
        // Optionally show loading state for counters during refresh
        if (this.fiberCount) {
            this.fiberCount.textContent = 'Fiber Offline: Loading...';
        }
        if (this.electricCount) {
            this.electricCount.textContent = 'Power Outage: Loading...';
        }
    }

    updateCounters(fiberCount, electricCount) {
        if (this.fiberCount) {
            this.fiberCount.textContent = `Fiber Offline: ${fiberCount}`;
        }
        if (this.electricCount) {
            this.electricCount.textContent = `Power Outage: ${electricCount}`;
        }
    }

    toggleLayersPanel() {
        if (this.layersPanel) {
            this.layersPanel.hidden = !this.layersPanel.hidden;
        }
    }

    showAlert(message, kind = 'info') {
        if (this.statusAlert && this.alertMessage) {
            this.alertMessage.textContent = message;
            this.statusAlert.kind = kind;
            this.statusAlert.hidden = false;
            this.statusAlert.open = true;
        }
    }

    hideAlert() {
        if (this.statusAlert) {
            this.statusAlert.hidden = true;
            this.statusAlert.open = false;
        }
    }

    // Mobile responsive adjustments
    setupResponsiveHandlers() {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;

            // Adjust UI for mobile
            if (isMobile) {
                // Make panels more mobile-friendly
                if (this.layersPanel) {
                    this.layersPanel.style.setProperty('--calcite-shell-panel-width', '100vw');
                }
            } else {
                // Reset for desktop
                if (this.layersPanel) {
                    this.layersPanel.style.removeProperty('--calcite-shell-panel-width');
                }
            }
        };

        // Initial call
        handleResize();

        // Add resize listener
        window.addEventListener('resize', handleResize);
    }

    // Keyboard accessibility helpers
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            // ESC to close panels
            if (e.key === 'Escape') {
                if (this.layersPanel && !this.layersPanel.hidden) {
                    this.layersPanel.hidden = true;
                }
            }

            // Ctrl/Cmd + R for refresh (prevent default and use our refresh)
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                // Trigger refresh action
                document.getElementById('refresh-action').click();
            }

            // H key for home
            if (e.key === 'h' || e.key === 'H') {
                document.getElementById('home-action').click();
            }

            // L key for layers panel
            if (e.key === 'l' || e.key === 'L') {
                this.toggleLayersPanel();
            }
        });
    }

    // Initialize all UI handlers
    init() {
        this.setupResponsiveHandlers();
        this.setupKeyboardHandlers();
    }
}