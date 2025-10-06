/**
 * PROG2002 A2 Assessment - Main JavaScript Module
 * Shared utilities and common functionality across all pages
 */

// API Configuration
const API_CONFIG = {
    baseUrl: window.location.origin + '/api',
    timeout: 10000,
    retries: 3
};

// Utility Functions
const Utils = {
    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        };
        return date.toLocaleDateString('en-AU', options);
    },

    // Format date only
    formatDateOnly(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };
        return date.toLocaleDateString('en-AU', options);
    },

    // Format time only
    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD'
        }).format(amount);
    },

    // Get event status
    getEventStatus(eventDate, endDate, statusId) {
        const now = new Date();
        const eventStart = new Date(eventDate);
        const eventEnd = new Date(endDate);
        
        if (statusId === 4) return { 
            status: 'suspended', 
            label: 'Suspended', 
            class: 'status-suspended' 
        };
        if (statusId === 5) return { 
            status: 'cancelled', 
            label: 'Cancelled', 
            class: 'status-suspended' 
        };
        if (eventEnd < now) return { 
            status: 'past', 
            label: 'Past Event', 
            class: 'status-past' 
        };
        if (eventStart <= now && eventEnd >= now) return { 
            status: 'active', 
            label: 'Active Now', 
            class: 'status-active' 
        };
        return { 
            status: 'upcoming', 
            label: 'Upcoming', 
            class: 'status-upcoming' 
        };
    },

    // Truncate text
    truncateText(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    // Calculate days until event
    getDaysUntilEvent(eventDate) {
        const now = new Date();
        const event = new Date(eventDate);
        const diffTime = event - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'Event has passed';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        return `${diffDays} days`;
    },

    // Get progress bar class
    getProgressBarClass(percentage) {
        if (percentage >= 100) return 'progress-green';
        if (percentage >= 75) return 'progress-blue';
        if (percentage >= 50) return 'progress-yellow';
        if (percentage >= 25) return 'progress-orange';
        return 'progress-red';
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Get query parameter
    getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    // Update URL parameters
    updateQueryParams(params) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key]) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.replaceState({}, '', url);
    }
};

// API Client
const API = {
    // Make API request with error handling
    async request(endpoint, options = {}) {
        const url = `${API_CONFIG.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    // GET request
    async get(endpoint) {
        return this.request(endpoint);
    },

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

// Modal Management
const Modal = {
    // Show modal
    show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    },

    // Hide modal
    hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    },

    // Initialize modal event listeners
    init() {
        // Close modal on button click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-btn') || e.target.classList.contains('modal')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hide(modal.id);
                }
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    this.hide(openModal.id);
                }
            }
        });
    }
};

// Toast Notifications
const Toast = {
    // Show toast notification
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getIcon(type)}"></i>
                <span>${Utils.escapeHtml(message)}</span>
            </div>
        `;

        // Add styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Remove after duration
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    },

    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    },

    getBackgroundColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    },

    success(message) {
        this.show(message, 'success');
    },

    error(message) {
        this.show(message, 'error');
    },

    warning(message) {
        this.show(message, 'warning');
    },

    info(message) {
        this.show(message, 'info');
    }
};

// Navigation Management
const Navigation = {
    // Initialize navigation
    init() {
        this.updateActiveNav();
    },

    // Update active navigation item
    updateActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const linkPage = href.split('/').pop();
            
            if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
};

// Form Validation
const FormValidator = {
    // Validate email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate required field
    isRequired(value) {
        return value && value.trim().length > 0;
    },

    // Show field error
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('error');
            
            // Remove existing error message
            const existingError = field.parentNode.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
            
            // Add error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error text-red-500 text-sm mt-1';
            errorDiv.textContent = message;
            field.parentNode.appendChild(errorDiv);
        }
    },

    // Clear field error
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('error');
            const errorDiv = field.parentNode.querySelector('.field-error');
            if (errorDiv) {
                errorDiv.remove();
            }
        }
    },

    // Clear all errors
    clearAllErrors(form) {
        const errorFields = form.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
        
        const errorMessages = form.querySelectorAll('.field-error');
        errorMessages.forEach(error => error.remove());
    }
};

// Analytics and Tracking (placeholder)
const Analytics = {
    // Track page view
    trackPageView(page) {
        console.log('Page view:', page);
        // Implement actual analytics tracking here
    },

    // Track event
    trackEvent(category, action, label = '') {
        console.log('Event:', { category, action, label });
        // Implement actual event tracking here
    }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize core components
    Modal.init();
    Navigation.init();
    
    // Track page view
    Analytics.trackPageView(window.location.pathname);
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Handle registration modal for any register buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('register-btn')) {
        e.preventDefault();
        const eventId = e.target.dataset.eventId;
        if (eventId) {
            Analytics.trackEvent('Global', 'Registration Click', `Event ${eventId}`);
            Modal.show('registration-modal');
        }
    }
});

// Handle social media links
document.addEventListener('click', (e) => {
    if (e.target.closest('.footer-section a[href="#"]')) {
        e.preventDefault();
        Toast.info('Social media links are for demonstration purposes');
    }
});