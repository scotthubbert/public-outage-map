// UI management and Calcite component interactions
export class UIManager {
    constructor(config = null) {
        console.log('UIManager initializing...', {
            isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
            hasCalciteDarkClass: document.documentElement.classList.contains('calcite-mode-dark'),
            config: config
        });

        this.config = config;
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.counterContent = document.getElementById('counter-content');
        this.fiberCount = document.getElementById('fiber-count');
        this.electricCount = document.getElementById('electric-count');
        this.electricChip = document.getElementById('electric-chip');
        this.electricToggle = document.getElementById('electric-toggle');
        this.layersPanel = document.getElementById('layers-panel');
        this.statusAlert = document.getElementById('status-alert');
        this.alertMessage = document.getElementById('alert-message');
        this.tenantLogo = document.getElementById('tenant-logo');

        console.log('Counter elements found:', {
            fiberCount: this.fiberCount?.textContent,
            electricCount: this.electricCount?.textContent,
            fiberStyles: this.fiberCount ? window.getComputedStyle(this.fiberCount) : null
        });

        // Initialize counters in loading state
        this.showCounterLoading();

        // Hide electric counter if not enabled
        if (!this.config?.features?.showElectric) {
            const electricCounter = document.getElementById('electric-counter');
            if (electricCounter) {
                electricCounter.style.display = 'none';
            }
        }

        // Set up tenant-specific UI
        this.setupTenantUI();
    }

    setupTenantUI() {
        if (!this.config) return;

        // Update page title
        document.title = `${this.config.tenant.name} - Network Status`;

        // Update favicon
        if (this.config.branding.favicon) {
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = this.config.branding.favicon;
        }

        // Update logo
        if (this.tenantLogo && this.config.branding.logo) {
            this.tenantLogo.src = this.config.branding.logo;
            this.tenantLogo.alt = `${this.config.tenant.name} Logo`;
        }

        // Handle power-related visibility
        this.updatePowerVisibility();

        // Update counter labels based on config
        this.updateCounterLabels();

        console.log(`UI configured for ${this.config.tenant.name}`);
    }

    updatePowerVisibility() {
        const showElectric = this.config?.features?.showElectric ?? true;

        // Hide/show electric counter chip
        if (this.electricChip) {
            this.electricChip.style.display = showElectric ? 'flex' : 'none';
        }

        // Hide/show electric toggle in layers panel
        if (this.electricToggle) {
            const toggleLabel = this.electricToggle.closest('calcite-label');
            if (toggleLabel) {
                toggleLabel.style.display = showElectric ? 'flex' : 'none';
            }
        }
    }

    updateCounterLabels() {
        if (!this.config) return;

        const fiberLabel = this.config.ui?.counters?.fiber || 'Fiber Offline';
        const electricLabel = this.config.ui?.counters?.electric || 'Power Outage';

        // Update the base labels (will be updated with counts later)
        if (this.fiberCount) {
            this.fiberCount.textContent = `${fiberLabel}: 0`;
        }
        if (this.electricCount && this.config?.features?.showElectric) {
            this.electricCount.textContent = `${electricLabel}: 0`;
        }
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
        console.log('Setting counters to loading state...');
        // Ensure counters are in loading state
        const fiberCounter = document.getElementById('fiber-counter');
        const electricCounter = document.getElementById('electric-counter');

        if (fiberCounter) {
            console.log('Fiber counter before loading:', {
                text: this.fiberCount?.textContent,
                classes: fiberCounter.className,
                computedStyles: window.getComputedStyle(fiberCounter)
            });

            fiberCounter.classList.add('loading');
            // Keep the current number but remove any labels
            if (this.fiberCount) {
                const currentText = this.fiberCount.textContent;
                const number = currentText.match(/\d+/);
                this.fiberCount.textContent = number ? number[0] : '0';
            }

            console.log('Fiber counter after loading:', {
                text: this.fiberCount?.textContent,
                classes: fiberCounter.className,
                computedStyles: window.getComputedStyle(fiberCounter)
            });
        }

        if (electricCounter && this.config?.features?.showElectric) {
            electricCounter.classList.add('loading');
            // Keep the current number but remove any labels
            if (this.electricCount) {
                const currentText = this.electricCount.textContent;
                const number = currentText.match(/\d+/);
                this.electricCount.textContent = number ? number[0] : '0';
            }
        }
    }

    updateCounters(fiberCount, electricCount) {
        console.log('Updating counters with new data:', { fiberCount, electricCount });

        const fiberLabel = this.config?.ui?.counters?.fiber || 'Fiber Offline';
        const electricLabel = this.config?.ui?.counters?.electric || 'Power Related';
        const showElectric = this.config?.features?.showElectric ?? true;

        // Update fiber counter
        const fiberCounter = document.getElementById('fiber-counter');
        if (fiberCounter) {
            console.log('Fiber counter before update:', {
                text: this.fiberCount?.textContent,
                classes: fiberCounter.className,
                computedStyles: window.getComputedStyle(fiberCounter)
            });

            fiberCounter.classList.remove('loading');
            if (this.fiberCount) {
                this.fiberCount.textContent = `${fiberLabel}: ${fiberCount}`;
            }

            console.log('Fiber counter after update:', {
                text: this.fiberCount?.textContent,
                classes: fiberCounter.className,
                computedStyles: window.getComputedStyle(fiberCounter)
            });
        }

        // Update electric counter if enabled
        const electricCounter = document.getElementById('electric-counter');
        if (electricCounter && showElectric) {
            electricCounter.classList.remove('loading');
            if (this.electricCount) {
                this.electricCount.textContent = `${electricLabel}: ${electricCount}`;
            }
        } else if (electricCounter) {
            electricCounter.style.display = 'none';
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