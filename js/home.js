/**
 * PROG2002 A2 Assessment - Home Page JavaScript
 * Handles dynamic content loading and interactions for the home page
 */

class HomePage {
    constructor() {
        this.featuredEvents = [];
        this.init();
    }

    init() {
        this.loadFeaturedEvents();
        this.loadStatistics();
        this.initContactForm();
        this.initScrollAnimations();
    }

    // Load featured upcoming events
    async loadFeaturedEvents() {
        const container = document.getElementById('featured-events');
        if (!container) return;

        try {
            Utils.showLoading(container);
            
            const response = await API.get('/events/featured/upcoming');
            this.featuredEvents = response.data || [];
            
            if (this.featuredEvents.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i class="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl font-semibold text-gray-600 mb-2">No upcoming events</h3>
                        <p class="text-gray-500">Check back soon for new events!</p>
                    </div>
                `;
                return;
            }

            this.renderFeaturedEvents(container);
            
        } catch (error) {
            console.error('Error loading featured events:', error);
            Utils.showError(container, 'Failed to load featured events. Please try again later.');
        }
    }

    // Render featured events
    renderFeaturedEvents(container) {
        const eventsHTML = this.featuredEvents.map(event => this.createEventCard(event)).join('');
        container.innerHTML = eventsHTML;

        // Add event listeners for registration buttons
        container.querySelectorAll('.register-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const eventId = btn.dataset.eventId;
                Analytics.trackEvent('Home', 'Registration Click', `Event ${eventId}`);
                Modal.show('registration-modal');
            });
        });
    }

    // Create event card HTML
    createEventCard(event) {
        const status = Utils.getEventStatus(event.event_date, event.end_date, event.status_id);
        const daysUntil = Utils.getDaysUntilEvent(event.event_date);
        const progressPercentage = event.fundraising_goal > 0 
            ? Math.round((event.current_raised / event.fundraising_goal) * 100)
            : 0;

        return `
            <div class="card event-card">
                <div class="relative">
                    <img src="${event.image_url || 'https://via.placeholder.com/400x200?text=Charity+Event'}" 
                         alt="${Utils.escapeHtml(event.name)}" 
                         class="card-image"
                         onerror="this.src='https://via.placeholder.com/400x200?text=Charity+Event'">
                    <div class="event-status ${status.class}">
                        ${status.label}
                    </div>
                    ${event.is_featured ? '<div class="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-semibold">Featured</div>' : ''}
                </div>
                <div class="card-content">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="${event.icon_class || 'fas fa-calendar'} text-primary-blue"></i>
                        <span class="text-sm text-gray-600">${event.category_name || 'Event'}</span>
                    </div>
                    <h3 class="card-title">
                        <a href="event-detail.html?id=${event.id}" class="hover:text-primary-green">
                            ${Utils.escapeHtml(event.name)}
                        </a>
                    </h3>
                    <p class="card-text">${Utils.truncateText(event.short_description, 120)}</p>
                    
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-calendar-day"></i>
                            <span>${Utils.formatDateOnly(event.event_date)}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${Utils.escapeHtml(event.location)}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-ticket-alt"></i>
                            <span>${event.ticket_price > 0 ? Utils.formatCurrency(event.ticket_price) : 'Free'}</span>
                        </div>
                    </div>

                    ${event.fundraising_goal > 0 ? `
                        <div class="mb-4">
                            <div class="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>${progressPercentage}%</span>
                            </div>
                            <div class="progress-container">
                                <div class="progress-bar ${Utils.getProgressBarClass(progressPercentage)}" 
                                     style="width: ${progressPercentage}%"></div>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                ${Utils.formatCurrency(event.current_raised)} of ${Utils.formatCurrency(event.fundraising_goal)}
                            </div>
                        </div>
                    ` : ''}

                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-500">
                            ${daysUntil}
                        </div>
                        <button class="btn btn-primary register-btn" data-event-id="${event.id}">
                            <i class="fas fa-user-plus"></i> Register
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Load statistics
    async loadStatistics() {
        try {
            const eventsResponse = await API.get('/events');
            const events = eventsResponse.data || [];

            // Calculate statistics
            const activeEvents = events.filter(event => {
                const status = Utils.getEventStatus(event.event_date, event.end_date, event.status_id);
                return status.status === 'upcoming' || status.status === 'active';
            }).length;

            const totalParticipants = events.reduce((sum, event) => sum + (event.current_attendees || 0), 0);
            const totalFunds = events.reduce((sum, event) => sum + (event.current_raised || 0), 0);

            // Animate counters
            this.animateCounter('events-count', activeEvents);
            this.animateCounter('organizations-count', 3); // Hardcoded for demo
            this.animateCounter('participants-count', totalParticipants);
            this.animateCounter('funds-raised', totalFunds, true);

        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    // Animate counter
    animateCounter(elementId, targetValue, isCurrency = false) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let currentValue = 0;
        const increment = targetValue / 50;
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            
            if (isCurrency) {
                element.textContent = Utils.formatCurrency(Math.floor(currentValue));
            } else {
                element.textContent = Math.floor(currentValue);
            }
        }, 30);
    }

    // Initialize contact form
    initContactForm() {
        const form = document.querySelector('#contact form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContactSubmission(form);
        });
    }

    // Handle contact form submission
    async handleContactSubmission(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Basic validation
        FormValidator.clearAllErrors(form);
        let hasErrors = false;

        if (!FormValidator.isRequired(data.name)) {
            FormValidator.showFieldError('name', 'Name is required');
            hasErrors = true;
        }

        if (!FormValidator.isValidEmail(data.email)) {
            FormValidator.showFieldError('email', 'Please enter a valid email address');
            hasErrors = true;
        }

        if (!FormValidator.isRequired(data.subject)) {
            FormValidator.showFieldError('subject', 'Subject is required');
            hasErrors = true;
        }

        if (!FormValidator.isRequired(data.message)) {
            FormValidator.showFieldError('message', 'Message is required');
            hasErrors = true;
        }

        if (hasErrors) {
            Toast.error('Please correct the errors above');
            return;
        }

        try {
            // Simulate form submission
            Toast.success('Thank you for your message! We will get back to you soon.');
            form.reset();
            Analytics.trackEvent('Contact', 'Form Submitted', data.subject);
        } catch (error) {
            console.error('Error submitting contact form:', error);
            Toast.error('Failed to send message. Please try again later.');
        }
    }

    // Initialize scroll animations
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe cards and sections
        document.querySelectorAll('.card, .section').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
}

// Initialize home page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomePage();
});