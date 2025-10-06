/**
 * PROG2002 A2 Assessment - Event Details Page JavaScript
 * Handles event details display, registration, and related events
 */

class EventDetailPage {
    constructor() {
        this.eventId = null;
        this.event = null;
        this.relatedEvents = [];
        this.init();
    }

    init() {
        this.eventId = Utils.getQueryParam('id');
        if (!this.eventId) {
            this.showErrorState('Event ID not provided');
            return;
        }

        this.loadEventDetails();
        this.initRegistrationModal();
        this.initShareModal();
    }

    // Load event details
    async loadEventDetails() {
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const content = document.getElementById('event-content');

        try {
            // Show loading state
            loadingState.style.display = 'block';
            errorState.style.display = 'none';
            content.style.display = 'none';

            // Fetch event details
            const response = await API.get(`/events/${this.eventId}`);
            this.event = response.data;

            if (!this.event) {
                this.showErrorState('Event not found');
                return;
            }

            // Render event details
            this.renderEventDetails();
            this.loadRelatedEvents();

            // Show content
            loadingState.style.display = 'none';
            content.style.display = 'block';

            // Track page view
            Analytics.trackEvent('Event', 'View', this.event.name);

        } catch (error) {
            console.error('Error loading event details:', error);
            this.showErrorState('Failed to load event details');
        }
    }

    // Show error state
    showErrorState(message) {
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const content = document.getElementById('event-content');

        loadingState.style.display = 'none';
        content.style.display = 'none';
        errorState.style.display = 'block';

        // Update error message if element exists
        const errorMessage = errorState.querySelector('#error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }

    // Render event details
    renderEventDetails() {
        // Hero section
        this.renderHeroSection();

        // Event information
        this.renderEventInfo();

        // Event description
        this.renderDescription();

        // Fundraising progress
        this.renderFundraisingProgress();

        // Event tags
        this.renderEventTags();

        // Organization info
        this.renderOrganizationInfo();
    }

    // Render hero section
    renderHeroSection() {
        const heroContent = document.getElementById('event-hero-content');
        if (!heroContent) return;

        const status = Utils.getEventStatus(this.event.event_date, this.event.end_date, this.event.status_id);

        heroContent.innerHTML = `
            <h1>${Utils.escapeHtml(this.event.name)}</h1>
            <div class="flex items-center justify-center gap-4 mt-4">
                <div class="event-status ${status.class}">
                    ${status.label}
                </div>
                ${this.event.is_featured ? '<div class="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">Featured Event</div>' : ''}
            </div>
        `;
    }

    // Render event information
    renderEventInfo() {
        // Date and time
        const datetimeElement = document.getElementById('event-datetime');
        if (datetimeElement) {
            datetimeElement.innerHTML = `
                ${Utils.formatDateOnly(this.event.event_date)}<br>
                ${Utils.formatTime(this.event.event_date)} - ${Utils.formatTime(this.event.end_date)}
            `;
        }

        // Location
        const locationElement = document.getElementById('event-location');
        if (locationElement) {
            locationElement.innerHTML = `
                ${Utils.escapeHtml(this.event.location)}<br>
                ${this.event.venue_details ? `<small class="text-gray-500">${Utils.escapeHtml(this.event.venue_details)}</small>` : ''}
            `;
        }

        // Price
        const priceElement = document.getElementById('event-price');
        if (priceElement) {
            priceElement.textContent = this.event.ticket_price > 0 
                ? Utils.formatCurrency(this.event.ticket_price)
                : 'Free Entry';
        }

        // Availability
        const availabilityElement = document.getElementById('event-availability');
        if (availabilityElement) {
            if (this.event.max_attendees) {
                const remaining = this.event.max_attendees - (this.event.current_attendees || 0);
                availabilityElement.innerHTML = `
                    ${remaining > 0 ? `${remaining} spots remaining` : 'Sold Out'}<br>
                    <small class="text-gray-500">${this.event.current_attendees || 0} of ${this.event.max_attendees} registered</small>
                `;
            } else {
                availabilityElement.textContent = 'Open Registration';
            }
        }
    }

    // Render event description
    renderDescription() {
        const descriptionElement = document.getElementById('event-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = `
                <p class="text-lg leading-relaxed mb-4">${Utils.escapeHtml(this.event.short_description)}</p>
                <div class="prose max-w-none">
                    ${this.event.full_description ? this.formatDescription(this.event.full_description) : ''}
                </div>
            `;
        }
    }

    // Format description text
    formatDescription(text) {
        // Convert line breaks to paragraphs
        const paragraphs = text.split('\n\n').filter(p => p.trim());
        return paragraphs.map(p => `<p>${Utils.escapeHtml(p)}</p>`).join('\n');
    }

    // Render fundraising progress
    renderFundraisingProgress() {
        const section = document.getElementById('fundraising-section');
        if (!section || !this.event.fundraising_goal) return;

        const progressPercentage = Math.round((this.event.current_raised / this.event.fundraising_goal) * 100);

        // Update progress elements
        document.getElementById('funds-raised').textContent = Utils.formatCurrency(this.event.current_raised);
        document.getElementById('funds-goal').textContent = `of ${Utils.formatCurrency(this.event.fundraising_goal)}`;
        document.getElementById('progress-percentage').textContent = `${progressPercentage}%`;

        const progressBar = document.getElementById('progress-bar');
        progressBar.className = `progress-bar ${Utils.getProgressBarClass(progressPercentage)}`;
        progressBar.style.width = `${progressPercentage}%`;

        // Animate progress bar
        setTimeout(() => {
            progressBar.style.transition = 'width 1s ease-in-out';
        }, 100);
    }

    // Render event tags
    renderEventTags() {
        const tagsContainer = document.getElementById('event-tags');
        if (!tagsContainer || !this.event.tags || this.event.tags.length === 0) {
            const section = document.getElementById('tags-section');
            if (section) section.style.display = 'none';
            return;
        }

        const tagsHTML = this.event.tags.map(tag => `
            <span class="px-3 py-1 rounded-full text-sm font-medium" 
                  style="background-color: ${tag.color_code}20; color: ${tag.color_code}">
                <i class="fas fa-tag mr-1"></i>${Utils.escapeHtml(tag.name)}
            </span>
        `).join('');

        tagsContainer.innerHTML = tagsHTML;
    }

    // Render organization information
    renderOrganizationInfo() {
        if (!this.event.organization_name) {
            const section = document.getElementById('organization-section');
            if (section) section.style.display = 'none';
            return;
        }

        // Organization name and description
        document.getElementById('org-name').textContent = this.event.organization_name;
        document.getElementById('org-description').textContent = 
            this.event.organization_description || 'A dedicated organization working for meaningful causes.';

        // Contact information
        const contactContainer = document.getElementById('org-contact');
        const contacts = [];

        if (this.event.org_contact_email) {
            contacts.push(`
                <div class="flex items-center gap-2">
                    <i class="fas fa-envelope text-primary-blue"></i>
                    <a href="mailto:${this.event.org_contact_email}" class="text-primary-blue hover:underline">
                        ${this.event.org_contact_email}
                    </a>
                </div>
            `);
        }

        if (this.event.org_contact_phone) {
            contacts.push(`
                <div class="flex items-center gap-2">
                    <i class="fas fa-phone text-primary-green"></i>
                    <span>${this.event.org_contact_phone}</span>
                </div>
            `);
        }

        if (this.event.org_website_url) {
            contacts.push(`
                <div class="flex items-center gap-2">
                    <i class="fas fa-globe text-secondary-coral"></i>
                    <a href="${this.event.org_website_url}" target="_blank" rel="noopener noreferrer" 
                       class="text-secondary-coral hover:underline">
                        Visit Website
                    </a>
                </div>
            `);
        }

        contactContainer.innerHTML = contacts.join('');
    }

    // Load related events
    async loadRelatedEvents() {
        const container = document.getElementById('related-events');
        if (!container) return;

        try {
            Utils.showLoading(container);

            // Fetch events from same category or organization
            const params = new URLSearchParams();
            if (this.event.category_id) params.append('category', this.event.category_id);
            
            const response = await API.get(`/events/search?${params.toString()}`);
            let relatedEvents = response.data || [];

            // Filter out current event and limit to 3
            relatedEvents = relatedEvents
                .filter(event => event.id !== parseInt(this.eventId))
                .slice(0, 3);

            if (relatedEvents.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-8">
                        <p class="text-gray-500">No related events found.</p>
                    </div>
                `;
                return;
            }

            // Render related events
            const eventsHTML = relatedEvents.map(event => this.createRelatedEventCard(event)).join('');
            container.innerHTML = eventsHTML;

        } catch (error) {
            console.error('Error loading related events:', error);
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-gray-500">Failed to load related events.</p>
                </div>
            `;
        }
    }

    // Create related event card
    createRelatedEventCard(event) {
        const status = Utils.getEventStatus(event.event_date, event.end_date, event.status_id);
        const daysUntil = Utils.getDaysUntilEvent(event.event_date);

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
                </div>
                <div class="card-content">
                    <h3 class="card-title">
                        <a href="event-detail.html?id=${event.id}" class="hover:text-primary-green">
                            ${Utils.escapeHtml(event.name)}
                        </a>
                    </h3>
                    <p class="card-text">${Utils.truncateText(event.short_description, 100)}</p>
                    
                    <div class="space-y-1 mb-3">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-calendar-day"></i>
                            <span>${Utils.formatDateOnly(event.event_date)}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${Utils.escapeHtml(event.location)}</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-500">
                            ${daysUntil}
                        </div>
                        <a href="event-detail.html?id=${event.id}" class="btn btn-outline btn-sm">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Initialize registration modal
    initRegistrationModal() {
        const registerBtn = document.getElementById('register-btn');
        if (!registerBtn) return;

        registerBtn.addEventListener('click', () => {
            // Check if event is available
            if (this.event.max_attendees && this.event.current_attendees >= this.event.max_attendees) {
                Toast.error('This event is sold out');
                return;
            }

            Analytics.trackEvent('Event', 'Registration Click', this.event.name);
            Modal.show('registration-modal');
        });
    }

    // Initialize share modal
    initShareModal() {
        const shareBtn = document.getElementById('share-btn');
        const shareModal = document.getElementById('share-modal');
        const shareUrlInput = document.getElementById('share-url');
        const copyBtn = document.getElementById('copy-url');

        if (!shareBtn || !shareModal || !shareUrlInput || !copyBtn) return;

        // Update share URL when modal opens
        shareBtn.addEventListener('click', () => {
            const shareUrl = `${window.location.origin}${window.location.pathname}?id=${this.eventId}`;
            shareUrlInput.value = shareUrl;
            Modal.show('share-modal');
        });

        // Copy URL functionality
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(shareUrlInput.value);
                Toast.success('Link copied to clipboard!');
                Analytics.trackEvent('Event', 'Share', this.event.name);
            } catch (err) {
                console.error('Failed to copy URL:', err);
                Toast.error('Failed to copy link');
            }
        });
    }
}

// Initialize event page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EventDetailPage();
});