/**
 * PROG2002 A2 Assessment - Search Page JavaScript
 * Handles event search, filtering, and results display
 */

class SearchPage {
    constructor() {
        this.events = [];
        this.categories = [];
        this.currentFilters = {
            date: '',
            location: '',
            category: ''
        };
        this.init();
    }

    init() {
        this.loadCategories();
        this.initSearchForm();
        this.initClearFilters();
        this.loadInitialEvents();
        this.initShowAllEvents();
    }

    // Load event categories
    async loadCategories() {
        const categorySelect = document.getElementById('category');
        if (!categorySelect) return;

        try {
            const response = await API.get('/categories');
            this.categories = response.data || [];

            // Populate category options
            categorySelect.innerHTML = '<option value="">All Categories</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });

            // Check for category in URL parameters
            const urlCategory = Utils.getQueryParam('category');
            if (urlCategory) {
                categorySelect.value = urlCategory;
                this.currentFilters.category = urlCategory;
            }

        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Initialize search form
    initSearchForm() {
        const form = document.getElementById('search-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Real-time search on input change (debounced)
        const debouncedSearch = Utils.deounce(() => {
            this.handleSearch();
        }, 500);

        // Add input listeners for real-time search
        ['date', 'location', 'category'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', debouncedSearch);
                field.addEventListener('change', debouncedSearch);
            }
        });
    }

    // Handle search
    async handleSearch() {
        const form = document.getElementById('search-form');
        const formData = new FormData(form);
        
        // Update current filters
        this.currentFilters = {
            date: formData.get('date') || '',
            location: formData.get('location') || '',
            category: formData.get('category') || ''
        };

        // Update URL parameters
        Utils.updateQueryParams(this.currentFilters);

        // Perform search
        await this.searchEvents();
    }

    // Search events with filters
    async searchEvents() {
        const container = document.getElementById('events-grid');
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const noResultsState = document.getElementById('no-results-state');
        const resultsCount = document.getElementById('results-count');

        // Show loading state
        loadingState.style.display = 'block';
        container.style.display = 'none';
        errorState.style.display = 'none';
        noResultsState.style.display = 'none';

        try {
            // Build query string
            const params = new URLSearchParams();
            if (this.currentFilters.date) params.append('date', this.currentFilters.date);
            if (this.currentFilters.location) params.append('location', this.currentFilters.location);
            if (this.currentFilters.category) params.append('category', this.currentFilters.category);

            const endpoint = `/events/search?${params.toString()}`;
            const response = await API.get(endpoint);
            
            this.events = response.data || [];
            
            // Hide loading state
            loadingState.style.display = 'none';

            if (this.events.length === 0) {
                // Show no results state
                noResultsState.style.display = 'block';
                resultsCount.textContent = 'No events found';
            } else {
                // Show results
                container.style.display = 'grid';
                this.renderEvents(container);
                resultsCount.textContent = `${this.events.length} event${this.events.length !== 1 ? 's' : ''} found`;
                
                // Track search
                Analytics.trackEvent('Search', 'Events Found', `${this.events.length} results`);
            }

        } catch (error) {
            console.error('Error searching events:', error);
            loadingState.style.display = 'none';
            errorState.style.display = 'block';
            document.getElementById('error-message').textContent = 'Failed to search events. Please try again.';
            resultsCount.textContent = 'Search failed';
        }
    }

    // Render events
    renderEvents(container) {
        const eventsHTML = this.events.map(event => this.createEventCard(event)).join('');
        container.innerHTML = eventsHTML;

        // Add event listeners
        this.addEventListeners(container);
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

    // Add event listeners to event cards
    addEventListeners(container) {
        // Registration buttons
        container.querySelectorAll('.register-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const eventId = btn.dataset.eventId;
                Analytics.trackEvent('Search', 'Registration Click', `Event ${eventId}`);
                Modal.show('registration-modal');
            });
        });
    }

    // Initialize clear filters
    initClearFilters() {
        const clearBtn = document.getElementById('clear-filters');
        if (!clearBtn) return;

        clearBtn.addEventListener('click', () => {
            this.clearAllFilters();
            Analytics.trackEvent('Search', 'Clear Filters', 'All');
        });
    }

    // Clear all filters
    clearAllFilters() {
        // Reset form fields
        const form = document.getElementById('search-form');
        if (form) {
            form.reset();
        }

        // Reset current filters
        this.currentFilters = {
            date: '',
            location: '',
            category: ''
        };

        // Clear URL parameters
        Utils.updateQueryParams({});

        // Reload all events
        this.loadInitialEvents();

        Toast.success('Filters cleared');
    }

    // Load initial events (all events)
    async loadInitialEvents() {
        const container = document.getElementById('events-grid');
        const loadingState = document.getElementById('loading-state');
        const resultsCount = document.getElementById('results-count');

        try {
            loadingState.style.display = 'block';
            
            const response = await API.get('/events');
            this.events = response.data || [];
            
            loadingState.style.display = 'none';

            if (this.events.length === 0) {
                container.style.display = 'none';
                resultsCount.textContent = 'No events available';
            } else {
                container.style.display = 'grid';
                this.renderEvents(container);
                resultsCount.textContent = `${this.events.length} event${this.events.length !== 1 ? 's' : ''} available`;
            }

        } catch (error) {
            console.error('Error loading initial events:', error);
            loadingState.style.display = 'none';
            Utils.showError(container, 'Failed to load events. Please try again later.');
            resultsCount.textContent = 'Failed to load events';
        }
    }

    // Initialize show all events button
    initShowAllEvents() {
        const showAllBtn = document.getElementById('show-all-events');
        if (!showAllBtn) return;

        showAllBtn.addEventListener('click', () => {
            this.clearAllFilters();
        });
    }
}

// Initialize search page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SearchPage();
});

// Handle category links from footer
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="search.html?category="]');
    if (link) {
        e.preventDefault();
        const url = new URL(link.href);
        const category = url.searchParams.get('category');
        
        // Navigate to search page with category filter
        if (category) {
            window.location.href = `search.html?category=${category}`;
        }
    }
});