// =============================================================================
// JIRA Backlog Manager - Main JavaScript
// =============================================================================

// Global state
let currentSort = {column: null, direction: 'asc'};
let filteredTickets = [];
let allTickets = [];

// =============================================================================
// Initialization
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Backlog Manager loaded');
    console.log('Backlog data:', backlogData);

    allTickets = [...backlogData.tickets_summary];
    filteredTickets = [...allTickets];

    initializeBacklogTable();
    initializeFilters();
});

// =============================================================================
// Backlog Table
// =============================================================================

function initializeBacklogTable() {
    renderBacklogTable();
    setupTableSorting();
}

function renderBacklogTable() {
    const tbody = document.getElementById('backlogTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    filteredTickets.forEach(ticket => {
        const row = document.createElement('tr');

        // Priorité CSS class
        const priorityClass = getPriorityClass(ticket.priority);

        row.innerHTML = `
            <td><a href="${JIRA_URL}/browse/${ticket.key}" target="_blank" class="issue-key">${ticket.key}</a></td>
            <td><a href="${JIRA_URL}/browse/${ticket.key}" target="_blank" class="issue-title">${escapeHtml(ticket.title)}</a></td>
            <td><span class="type-badge">${ticket.issue_type}</span></td>
            <td><span class="status-badge ${getStatusClass(ticket.status)}">${ticket.status}</span></td>
            <td><span class="${priorityClass}">${ticket.priority}</span></td>
            <td>${escapeHtml(ticket.assignee)}</td>
            <td class="text-center">${ticket.story_points || '-'}</td>
            <td class="text-center">${ticket.estimate_hours ? ticket.estimate_hours.toFixed(1) + 'h' : '-'}</td>
            <td>${formatDate(ticket.created)}</td>
        `;

        tbody.appendChild(row);
    });

    updateTicketsCount();
}

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('done') || statusLower.includes('closed')) return 'status-done';
    if (statusLower.includes('progress') || statusLower.includes('review')) return 'status-in-progress';
    if (statusLower.includes('block')) return 'status-blocked';
    return 'status-todo';
}

function getPriorityClass(priority) {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('highest') || priorityLower.includes('high')) return 'priority-high';
    if (priorityLower.includes('low')) return 'priority-low';
    return 'priority-medium';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateTicketsCount() {
    const total = allTickets.length;
    const filtered = filteredTickets.length;

    // Mettre à jour le titre si élément existe
    const countElement = document.querySelector('.tickets-section h2');
    if (countElement) {
        countElement.textContent = `Tickets du Backlog (${filtered} / ${total})`;
    }
}

// =============================================================================
// Table Sorting
// =============================================================================

function setupTableSorting() {
    const headers = document.querySelectorAll('th[data-sort]');

    headers.forEach(header => {
        header.classList.add('sortable');
        header.addEventListener('click', function() {
            const column = this.dataset.sort;
            sortTable(column);
        });
    });
}

function sortTable(column) {
    // Toggle direction if same column
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // Sort data
    filteredTickets.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // Handle null/undefined
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';

        // Convert to appropriate type
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return currentSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // String comparison
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();

        if (currentSort.direction === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
    });

    // Update UI
    updateSortIndicators();
    renderBacklogTable();
}

function updateSortIndicators() {
    // Remove all sort classes
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
    });

    // Add current sort class
    const currentHeader = document.querySelector(`th[data-sort="${currentSort.column}"]`);
    if (currentHeader) {
        currentHeader.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }
}

// =============================================================================
// Filters
// =============================================================================

function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const typeFilter = document.getElementById('typeFilter');

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }

    if (priorityFilter) {
        priorityFilter.addEventListener('change', applyFilters);
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const priorityFilter = document.getElementById('priorityFilter')?.value || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';

    filteredTickets = allTickets.filter(ticket => {
        // Search filter
        const matchesSearch = !searchTerm ||
            ticket.key.toLowerCase().includes(searchTerm) ||
            ticket.title.toLowerCase().includes(searchTerm) ||
            ticket.assignee.toLowerCase().includes(searchTerm);

        // Status filter
        const matchesStatus = !statusFilter || ticket.status === statusFilter;

        // Priority filter
        const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;

        // Type filter
        const matchesType = !typeFilter || ticket.issue_type === typeFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });

    // Re-apply current sort
    if (currentSort.column) {
        sortTable(currentSort.column);
    } else {
        renderBacklogTable();
    }
}

// =============================================================================
// Utility Functions
// =============================================================================

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatPercent(value) {
    return Math.round(value) + '%';
}

// =============================================================================
// Export Functions (pour réutilisation)
// =============================================================================

window.BacklogManager = {
    refresh: initializeBacklogTable,
    applyFilters: applyFilters,
    sortTable: sortTable
};
