// Navigation System - Completely Redesigned

class NavigationSystem {
    constructor() {
        this.navLinks = document.querySelectorAll('.nav-menu a');
        this.sections = document.querySelectorAll('section[id]');
        this.hamburgerBtn = document.getElementById('hamburger-btn');
        this.navMenu = document.getElementById('nav-menu');
        this.observer = null;
        this.scrollHandler = null;
        this.isScrolling = false;
        this.clickTimeout = null;

        // Initialize navigation for all devices
        this.initSmoothScroll();
        this.initActiveDetection();

        // Handle resize events
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Initialize first active link
        this.updateActiveLink();
    }

    handleResize() {
        // Reinitialize to ensure proper functioning on all screen sizes
        this.updateActiveLink();
    }

    initSmoothScroll() {
        if (this.navLinks.length === 0) return;
        
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    // Immediately set active state for click responsiveness
                    this.setActiveLink(link);
                    
                    // Prevent scroll detection from interfering during smooth scroll
                    this.isScrolling = true;
                    
                    // Clear any existing timeouts to prevent conflicts
                    if (this.clickTimeout) {
                        clearTimeout(this.clickTimeout);
                    }
                    
                    // Clear any pending scroll detection changes
                    if (this.changeTimeout) {
                        clearTimeout(this.changeTimeout);
                    }

                    // Calculate proper offset (nav height is 60px from CSS)
                    const navHeight = 60;
                    const offsetTop = targetSection.offsetTop - navHeight - 10; // 10px extra padding

                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });

                    // Re-enable scroll detection after smooth scroll completes
                    // Extended time to ensure smooth scroll finishes completely
                    this.clickTimeout = setTimeout(() => {
                        this.isScrolling = false;
                        // Don't call updateActiveLink here - let natural scroll detection handle it
                    }, 1500); // Increased from 1000ms to 1500ms
                }
            });
        });
    }

    initActiveDetection() {
        if (this.sections.length === 0) return;

        // Use only scroll-based detection for more stable behavior
        this.initScrollListener();
    }

    initScrollListener() {
        let scrollTimeout;
        let lastActiveSection = null;
        let changeTimeout = null;
        
        this.scrollHandler = () => {
            if (this.isScrolling) return;
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const newActiveSection = this.determineActiveSection();
                
                // Only change if it's different from current and we haven't changed recently
                if (newActiveSection && newActiveSection !== lastActiveSection) {
                    // Clear any pending change
                    clearTimeout(changeTimeout);
                    
                    // Add delay to prevent rapid switching
                    changeTimeout = setTimeout(() => {
                        const link = document.querySelector(`.nav-menu a[href="#${newActiveSection.id}"]`);
                        if (link && !link.classList.contains('active')) {
                            this.setActiveLink(link);
                            lastActiveSection = newActiveSection;
                        }
                    }, 150); // 150ms delay to prevent flickering
                }
            }, 50); // Reduced debounce time for better responsiveness
        };
        
        window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }

    determineActiveSection() {
        if (this.sections.length === 0) return null;

        const navHeight = 60;
        const scrollTop = window.pageYOffset;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Special case: if at bottom of page, always show contact
        if (scrollTop + windowHeight >= documentHeight - 50) {
            return document.getElementById('contact');
        }
        
        // Special case: if at very top, always show hero
        if (scrollTop < 50) {
            return document.getElementById('hero');
        }

        let bestSection = null;
        let bestScore = -1;

        // Find section with best visibility score
        this.sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top;
            const sectionBottom = rect.bottom;
            const sectionHeight = rect.height;
            
            // Skip if section is completely out of view
            if (sectionBottom < navHeight || sectionTop > windowHeight) {
                return;
            }
            
            // Calculate visible portion
            const visibleTop = Math.max(sectionTop, navHeight);
            const visibleBottom = Math.min(sectionBottom, windowHeight);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            
            // Calculate visibility ratio and position score
            const visibilityRatio = visibleHeight / sectionHeight;
            
            // Prefer sections that are more centered in viewport
            const sectionCenter = (sectionTop + sectionBottom) / 2;
            const viewportCenter = (navHeight + windowHeight) / 2;
            const centerDistance = Math.abs(sectionCenter - viewportCenter);
            const maxDistance = windowHeight / 2;
            const centerScore = 1 - (centerDistance / maxDistance);
            
            // Combined score: visibility is more important than centering
            const score = (visibilityRatio * 0.8) + (centerScore * 0.2);
            
            // Only consider sections with significant visibility
            if (visibilityRatio > 0.3 && score > bestScore) {
                bestScore = score;
                bestSection = section;
            }
        });

        return bestSection;
    }

    updateActiveLink() {
        if (this.isScrolling) return;
        
        const activeSection = this.determineActiveSection();
        if (activeSection) {
            const link = document.querySelector(`.nav-menu a[href="#${activeSection.id}"]`);
            if (link && !link.classList.contains('active')) {
                this.setActiveLink(link);
            }
        }
    }

    setActiveLink(activeLink) {
        if (!activeLink || this.navLinks.length === 0) return;
        
        // Remove active class from all links
        this.navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to the target link
        activeLink.classList.add('active');
    }

    cleanup() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        if (this.scrollHandler) {
            window.removeEventListener('scroll', this.scrollHandler);
            this.scrollHandler = null;
        }
        
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }
    }
}

let navSystem;

function initNavSystem() {
    // Clean up existing instance if any
    if (navSystem) {
        navSystem.cleanup();
    }
    
    navSystem = new NavigationSystem();
}

// Export for main.js
window.initNavSystem = initNavSystem;