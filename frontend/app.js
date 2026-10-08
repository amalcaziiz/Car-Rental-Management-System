/**
 * Car Rental Management System - Frontend App Client
 * Integrates with Node.js Express Backend APIs
 * Author: Amal Bashir Abdi 
 */

const API_BASE = '/api';

// State variables
let currentUser = null;
let activeTab = 'dashboard';
let categoriesCache = [];

// Try to parse active session user
const savedUser = sessionStorage.getItem('apex_user');
if (savedUser) {
    currentUser = JSON.parse(savedUser);
}

// ==========================================
// 1. DYNAMIC API REQUEST HANDLERS
// ==========================================

async function apiRequest(endpoint, method = 'GET', body = null) {
    const config = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
        config.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Server request failed');
        }
        return data;
    } catch (err) {
        showToast(err.message, 'danger');
        throw err;
    }
}

// ==========================================
// 2. STATE MANAGER & AUTH CONTROLLER
// ==========================================

function checkAuthentication() {
    const authPortal = document.getElementById('auth-portal');
    const appLayout = document.getElementById('app-layout');

    if (!currentUser) {
        authPortal.classList.remove('hidden');
        appLayout.classList.add('hidden');
        document.body.className = 'dark-theme';
    } else {
        authPortal.classList.add('hidden');
        appLayout.classList.remove('hidden');
        
        // Show correct pages and update badges
        document.body.className = `dark-theme role-${currentUser.role.toLowerCase()}`;
        document.getElementById('user-display-name').textContent = currentUser.username;
        const badge = document.getElementById('user-role-badge');
        badge.textContent = currentUser.role;
        badge.className = `role-badge ${currentUser.role.toLowerCase()}`;
        
        // Load categories cache once, then open initial view
        loadCategoriesCache().then(() => {
            switchTab(activeTab);
        });
    }
}

async function loadCategoriesCache() {
    try {
        categoriesCache = await apiRequest('/cars/categories');
    } catch (e) {
        console.error("Failed to load car categories", e);
    }
}

// ==========================================
// 3. UI GRAPH RENDERING & KPI LOGIC
// ==========================================

async function renderDashboard() {
    if (activeTab !== 'dashboard') return;

    try {
        const cars = await apiRequest('/cars');
        const rentals = await apiRequest('/rentals');
        const payments = await apiRequest('/payments');
        const audits = await apiRequest('/payments/audits');

        // Stats calculation
        const totalCars = cars.length;
        const activeRentals = rentals.filter(r => r.status === 'ONGOING').length;
        const maintenanceCars = cars.filter(c => c.status === 'MAINTENANCE').length;
        const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);

        document.getElementById('kpi-total-cars').textContent = totalCars;
        document.getElementById('kpi-active-rentals').textContent = activeRentals;
        document.getElementById('kpi-maintenance-cars').textContent = maintenanceCars;
        document.getElementById('kpi-revenue').textContent = `$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        // SVG Charts Render
        renderFleetStatusChart(cars);
        renderPaymentMethodChart(payments);
        renderCategoryChart(cars);

        // Recent Audits
        const recentAudits = [...audits].reverse().slice(0, 5);
        const auditsTbody = document.getElementById('recent-audits-tbody');
        auditsTbody.innerHTML = recentAudits.map(a => `
            <tr>
                <td>#${a.audit_id}</td>
                <td>#${a.rental_id}</td>
                <td><span class="status-pill done">${a.action}</span></td>
                <td>${a.action_date}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error("Dashboard render failed", e);
    }
}

function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
}

function drawPieChart(svgId, legendId, data) {
    const svg = document.getElementById(svgId);
    const legend = document.getElementById(legendId);
    svg.innerHTML = '';
    legend.innerHTML = '';

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        svg.innerHTML = `<text x="50" y="50" text-anchor="middle" fill="#9ca3af" font-size="6">No Data</text>`;
        return;
    }

    let accumulatedPercent = 0;

    data.forEach(slice => {
        const percent = slice.value / total;
        const [startX, startY] = getCoordinatesForPercent(accumulatedPercent);
        accumulatedPercent += percent;
        const [endX, endY] = getCoordinatesForPercent(accumulatedPercent);

        const r = 40;
        const cx = 50;
        const cy = 50;

        const x1 = cx + startX * r;
        const y1 = cy + startY * r;
        const x2 = cx + endX * r;
        const y2 = cy + endY * r;

        const largeArcFlag = percent > 0.5 ? 1 : 0;
        const pathData = percent === 1 
            ? `M 50 10 A 40 40 0 1 1 49.99 10 Z`
            : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', slice.color);
        path.setAttribute('stroke', '#0c0e15');
        path.setAttribute('stroke-width', '1');
        path.style.transition = 'all 0.3s ease';
        path.style.cursor = 'pointer';

        path.addEventListener('mouseenter', () => {
            path.setAttribute('transform', 'scale(1.05)');
            path.style.filter = 'drop-shadow(0 0 8px ' + slice.color + ')';
        });
        path.addEventListener('mouseleave', () => {
            path.setAttribute('transform', 'scale(1)');
            path.style.filter = 'none';
        });

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${slice.label}: ${slice.value} (${(percent * 100).toFixed(1)}%)`;
        path.appendChild(title);

        svg.appendChild(path);

        const legItem = document.createElement('div');
        legItem.className = 'legend-item';
        legItem.innerHTML = `
            <span class="legend-color" style="background-color: ${slice.color}"></span>
            <span>${slice.label} (${slice.value})</span>
        `;
        legend.appendChild(legItem);
    });
}

function renderFleetStatusChart(cars) {
    const statuses = {};
    cars.forEach(car => {
        statuses[car.status] = (statuses[car.status] || 0) + 1;
    });

    const chartData = [
        { label: 'Available', value: statuses['AVAILABLE'] || 0, color: '#10b981' },
        { label: 'Rented', value: statuses['RENTED'] || 0, color: '#f59e0b' },
        { label: 'Maintenance', value: statuses['MAINTENANCE'] || 0, color: '#ef4444' }
    ];
    drawPieChart('chart-fleet-status', 'legend-fleet-status', chartData);
}

function renderPaymentMethodChart(payments) {
    const methods = {};
    payments.forEach(p => {
        methods[p.method] = (methods[p.method] || 0) + p.amount;
    });

    const chartData = [
        { label: 'Cash', value: Math.round(methods['CASH'] || 0), color: '#a855f7' },
        { label: 'Card', value: Math.round(methods['CARD'] || 0), color: '#3b82f6' },
        { label: 'Mobile', value: Math.round(methods['MOBILE'] || 0), color: '#06b6d4' }
    ];
    drawPieChart('chart-payment-method', 'legend-payment-method', chartData);
}

function renderCategoryChart(cars) {
    const counts = {};
    cars.forEach(car => {
        const name = car.category_name || 'Other';
        counts[name] = (counts[name] || 0) + 1;
    });

    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];
    const chartData = Object.keys(counts).map((key, index) => ({
        label: key,
        value: counts[key],
        color: colors[index % colors.length]
    }));
    drawPieChart('chart-categories', 'legend-categories', chartData);
}

// ==========================================
// 4. TOAST NOTIFICATION UTILITY
// ==========================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animated slideInLeft`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'danger') icon = 'fa-circle-xmark';

    toast.innerHTML = `
        <i class="fa-solid ${icon} toast-icon"></i>
        <div class="toast-content">${message}</div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// 5. REST VIEW BUILDERS (CRUD GRID RENDERS)
// ==========================================

async function renderCarsTable() {
    const search = document.getElementById('cars-search-input').value.toLowerCase();
    const filter = document.getElementById('cars-filter-status').value;
    const tbody = document.getElementById('cars-tbody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">Loading fleet...</td></tr>';

    try {
        const cars = await apiRequest('/cars');
        const filtered = cars.filter(car => {
            const matchesSearch = car.brand.toLowerCase().includes(search) ||
                                  car.model.toLowerCase().includes(search) ||
                                  car.plate_number.toLowerCase().includes(search);
            const matchesFilter = filter === '' || car.status === filter;
            return matchesSearch && matchesFilter;
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">No vehicles found.</td></tr>';
            return;
        }

        filtered.forEach(car => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${car.car_id}</td>
                <td><strong>${car.brand}</strong> ${car.model}</td>
                <td>${car.year}</td>
                <td><span class="role-badge staff">${car.category_name}</span></td>
                <td><code>${car.plate_number}</code></td>
                <td>$${car.daily_rate}/day</td>
                <td><span class="status-pill ${car.status.toLowerCase()}">${car.status}</span></td>
                <td class="actions-col admin-only">
                    <div class="action-btns-wrapper">
                        <button class="btn-icon edit-btn" title="Edit Vehicle" onclick="openCrudModal('cars', ${car.car_id})">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon delete-btn" title="Delete Vehicle" onclick="deleteEntity('cars', ${car.car_id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--danger)">Error loading data.</td></tr>';
    }
}

async function renderCustomersTable() {
    const search = document.getElementById('customers-search-input').value.toLowerCase();
    const tbody = document.getElementById('customers-tbody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Loading customer index...</td></tr>';

    try {
        const customers = await apiRequest('/customers');
        const filtered = customers.filter(c => {
            return c.full_name.toLowerCase().includes(search) ||
                   c.phone.includes(search) ||
                   c.email.toLowerCase().includes(search) ||
                   c.national_id.toLowerCase().includes(search);
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No customers matching query.</td></tr>';
            return;
        }

        filtered.forEach(c => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${c.customer_id}</td>
                <td><strong>${c.full_name}</strong></td>
                <td>${c.phone}</td>
                <td>${c.email}</td>
                <td><code>${c.national_id}</code></td>
                <td>${c.created_at}</td>
                <td class="actions-col">
                    <div class="action-btns-wrapper">
                        <button class="btn-icon edit-btn" title="Edit Profile" onclick="openCrudModal('customers', ${c.customer_id})">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon delete-btn ${currentUser.role !== 'ADMIN' ? 'hidden' : ''}" title="Delete Profile" onclick="deleteEntity('customers', ${c.customer_id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--danger)">Error loading data.</td></tr>';
    }
}

async function renderRentalsTable() {
    const search = document.getElementById('rentals-search-input').value.toLowerCase();
    const filter = document.getElementById('rentals-filter-status').value;
    const tbody = document.getElementById('rentals-tbody');
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center">Loading rentals...</td></tr>';

    try {
        const rentals = await apiRequest('/rentals');
        const filtered = rentals.filter(r => {
            const matchesSearch = r.customer_name.toLowerCase().includes(search) || 
                                  `${r.car_brand} ${r.car_model}`.toLowerCase().includes(search);
            const matchesFilter = filter === '' || r.status === filter;
            return matchesSearch && matchesFilter;
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center">No rental deals found.</td></tr>';
            return;
        }

        filtered.reverse().forEach(r => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${r.rental_id}</td>
                <td><strong>${r.customer_name}</strong></td>
                <td>${r.car_brand} ${r.car_model} (${r.car_plate})</td>
                <td><span class="role-badge staff">${r.staff_name}</span></td>
                <td><small>${r.start_date} &rarr; ${r.end_date}</small></td>
                <td>${r.total_days} days</td>
                <td>$${Number(r.total_cost).toFixed(2)}</td>
                <td><span class="status-pill ${r.status.toLowerCase()}">${r.status}</span></td>
                <td class="actions-col">
                    <div class="action-btns-wrapper">
                        ${r.status === 'ONGOING' ? `
                            <button class="btn btn-secondary btn-sm" title="Return Car" onclick="triggerReturnProcedure(${r.rental_id})">
                                <i class="fa-solid fa-rotate-left"></i> Return
                            </button>
                        ` : ''}
                        <button class="btn-icon edit-btn" title="Edit Rental Details" onclick="openCrudModal('rentals', ${r.rental_id})">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon delete-btn ${currentUser.role !== 'ADMIN' ? 'hidden' : ''}" title="Delete Rental Record" onclick="deleteEntity('rentals', ${r.rental_id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--danger)">Error loading data.</td></tr>';
    }
}

async function renderPaymentsTable() {
    const tbody = document.getElementById('payments-tbody');
    const auditsTbody = document.getElementById('full-audits-tbody');
    
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Loading payments ledger...</td></tr>';
    auditsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Loading system audits...</td></tr>';

    try {
        const payments = await apiRequest('/payments');
        const rentals = await apiRequest('/rentals');
        const audits = await apiRequest('/payments/audits');

        tbody.innerHTML = '';
        let totalPaid = 0;

        payments.forEach(p => {
            totalPaid += Number(p.amount);
            const rental = rentals.find(r => r.rental_id === p.rental_id);
            const customerName = rental ? rental.customer_name : 'Unknown';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${p.payment_id}</td>
                <td>#${p.rental_id}</td>
                <td><strong>${customerName}</strong></td>
                <td>$${Number(p.amount).toFixed(2)}</td>
                <td><span class="role-badge staff">${p.method}</span></td>
                <td>${p.payment_date}</td>
                <td class="actions-col admin-only">
                    <div class="action-btns-wrapper">
                        <button class="btn-icon delete-btn ${currentUser.role !== 'ADMIN' ? 'hidden' : ''}" title="Delete Payment" onclick="deleteEntity('payments', ${p.payment_id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('total-paid-display').textContent = `$${totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

        const unpaidSum = rentals
            .filter(r => r.status === 'ONGOING')
            .reduce((sum, r) => sum + Number(r.total_cost), 0);
        document.getElementById('unpaid-rentals-display').textContent = `$${unpaidSum.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

        // Render full audits
        auditsTbody.innerHTML = [...audits].reverse().map(a => `
            <tr>
                <td>#${a.audit_id}</td>
                <td>#${a.rental_id}</td>
                <td><span class="status-pill done">${a.action}</span></td>
                <td>${a.action_date}</td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--danger)">Error loading.</td></tr>';
    }
}

async function renderMaintenanceTable() {
    const search = document.getElementById('maintenance-search-input').value.toLowerCase();
    const tbody = document.getElementById('maintenance-tbody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Loading maintenance logs...</td></tr>';

    try {
        const maintenance = await apiRequest('/maintenance');
        const filtered = maintenance.filter(m => {
            const carLabel = `${m.car_brand} ${m.car_model}`.toLowerCase();
            return m.issue_description.toLowerCase().includes(search) || carLabel.includes(search);
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No logs logged.</td></tr>';
            return;
        }

        filtered.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${m.maintenance_id}</td>
                <td><strong>${m.car_brand} ${m.car_model} (${m.car_plate})</strong></td>
                <td>${m.issue_description}</td>
                <td>$${Number(m.cost).toFixed(2)}</td>
                <td>${m.maintenance_date}</td>
                <td><span class="status-pill ${m.status.toLowerCase()}">${m.status}</span></td>
                <td class="actions-col">
                    <div class="action-btns-wrapper">
                        ${m.status === 'PENDING' ? `
                            <button class="btn btn-secondary btn-sm" onclick="completeMaintenance(${m.maintenance_id})">
                                <i class="fa-solid fa-check"></i> Fix Issue
                            </button>
                        ` : ''}
                        <button class="btn-icon edit-btn" title="Edit Maintenance" onclick="openCrudModal('maintenance', ${m.maintenance_id})">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon delete-btn ${currentUser.role !== 'ADMIN' ? 'hidden' : ''}" title="Delete Maintenance" onclick="deleteEntity('maintenance', ${m.maintenance_id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--danger)">Error loading.</td></tr>';
    }
}

async function renderInsuranceTable() {
    if (currentUser.role !== 'ADMIN') return;
    const search = document.getElementById('insurance-search-input').value.toLowerCase();
    const tbody = document.getElementById('insurance-tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Loading policies...</td></tr>';

    try {
        const policies = await apiRequest('/insurance');
        const filtered = policies.filter(ins => {
            const carLabel = `${ins.car_brand} ${ins.car_model}`.toLowerCase();
            return ins.provider.toLowerCase().includes(search) || carLabel.includes(search);
        });

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No active policies found.</td></tr>';
            return;
        }

        filtered.forEach(ins => {
            const expiry = new Date(ins.expiry_date);
            const status = expiry > new Date() ? 'Active' : 'Expired';
            const pillClass = expiry > new Date() ? 'available' : 'cancelled';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${ins.insurance_id}</td>
                <td><strong>${ins.car_brand} ${ins.car_model} (${ins.car_plate})</strong></td>
                <td>${ins.provider}</td>
                <td>$${Number(ins.cost).toFixed(2)}/yr</td>
                <td>${ins.expiry_date}</td>
                <td><span class="status-pill ${pillClass}">${status}</span></td>
                <td class="actions-col">
                    <div class="action-btns-wrapper">
                        <button class="btn-icon edit-btn" onclick="openCrudModal('insurance', ${ins.insurance_id})">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon delete-btn" onclick="deleteEntity('insurance', ${ins.insurance_id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--danger)">Error loading.</td></tr>';
    }
}

async function renderUsersTable() {
    if (currentUser.role !== 'ADMIN') return;
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Loading users...</td></tr>';

    try {
        const users = await apiRequest('/users');
        tbody.innerHTML = '';

        users.forEach(u => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${u.user_id}</td>
                <td><strong>${u.username}</strong></td>
                <td><span class="role-badge ${u.role.toLowerCase()}">${u.role}</span></td>
                <td>${u.created_at || 'N/A'}</td>
                <td class="actions-col">
                    <div class="action-btns-wrapper">
                        <button class="btn-icon edit-btn" onclick="openCrudModal('users', ${u.user_id})">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon delete-btn ${u.user_id === 1 ? 'hidden' : ''}" onclick="deleteEntity('users', ${u.user_id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--danger)">Error loading.</td></tr>';
    }
}

// ==========================================
// 6. ROUTE ACTIONS DISPATCHERS
// ==========================================

function switchTab(tabName) {
    activeTab = tabName;
    
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        if (li.getAttribute('data-tab') === tabName) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
        if (pane.id === `tab-${tabName}`) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });

    const titles = {
        dashboard: 'Dashboard Overview',
        cars: 'Fleet Management',
        customers: 'Customer Accounts',
        rentals: 'Rental Desk',
        payments: 'Revenue & Audits',
        maintenance: 'Maintenance Records',
        insurance: 'Insurance Policies',
        users: 'System Users',
        console: 'Simulated SQL Developer Console'
    };
    document.getElementById('page-title').textContent = titles[tabName] || 'Management System';

    if (tabName === 'dashboard') renderDashboard();
    if (tabName === 'cars') renderCarsTable();
    if (tabName === 'customers') renderCustomersTable();
    if (tabName === 'rentals') {
        populateRentalOptions();
        renderRentalsTable();
    }
    if (tabName === 'payments') renderPaymentsTable();
    if (tabName === 'maintenance') renderMaintenanceTable();
    if (tabName === 'insurance') renderInsuranceTable();
    if (tabName === 'users') renderUsersTable();
}

async function populateRentalOptions() {
    const custSel = document.getElementById('booking-customer');
    const carSel = document.getElementById('booking-car');
    const returnSel = document.getElementById('return-rental-select');

    custSel.innerHTML = '<option value="">Select Customer...</option>';
    carSel.innerHTML = '<option value="">Select Car...</option>';
    if (returnSel) returnSel.innerHTML = '<option value="">Select Active Rental...</option>';

    try {
        const customers = await apiRequest('/customers');
        const cars = await apiRequest('/cars');
        const rentals = await apiRequest('/rentals');

        customers.forEach(c => {
            custSel.innerHTML += `<option value="${c.customer_id}">${c.full_name} (${c.phone})</option>`;
        });

        cars.forEach(car => {
            if (car.status === 'AVAILABLE') {
                carSel.innerHTML += `<option value="${car.car_id}">${car.brand} ${car.model} ($${car.daily_rate}/day)</option>`;
            }
        });

        if (returnSel) {
            rentals.forEach(r => {
                if (r.status === 'ONGOING') {
                    returnSel.innerHTML += `<option value="${r.rental_id}">Rental #${r.rental_id} - ${r.customer_name} (${r.car_brand} ${r.car_model})</option>`;
                }
            });
        }
    } catch (e) {
        console.error("Dropdown loads failed", e);
    }
}

async function updateRentalCostEstimation() {
    const carId = document.getElementById('booking-car').value;
    const startStr = document.getElementById('booking-start-date').value;
    const endStr = document.getElementById('booking-end-date').value;

    const rateEl = document.getElementById('calc-daily-rate');
    const daysEl = document.getElementById('calc-total-days');
    const discEl = document.getElementById('calc-discount');
    const costEl = document.getElementById('calc-total-cost');

    if (!carId || !startStr || !endStr) {
        rateEl.textContent = '$0.00';
        daysEl.textContent = '0 days';
        discEl.textContent = '$0.00';
        costEl.textContent = '$0.00';
        return;
    }

    try {
        const car = await apiRequest(`/cars/${carId}`);
        const start = new Date(startStr);
        const end = new Date(endStr);

        if (end <= start) {
            rateEl.textContent = `$${car.daily_rate.toFixed(2)}`;
            daysEl.textContent = 'Invalid range';
            discEl.textContent = '$0.00';
            costEl.textContent = '$0.00';
            return;
        }

        const diffTime = Math.abs(end - start);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const rawCost = days * car.daily_rate;
        
        // Emulate Stored Function calc_cost
        let totalCost = rawCost;
        if (days >= 7) {
            totalCost = totalCost * 0.95;
        }
        const discountAmt = rawCost - totalCost;

        rateEl.textContent = `$${car.daily_rate.toFixed(2)}`;
        daysEl.textContent = `${days} day(s)`;
        discEl.textContent = discountAmt > 0 ? `-$${discountAmt.toFixed(2)}` : '$0.00';
        costEl.textContent = `$${totalCost.toFixed(2)}`;
    } catch (e) {
        console.error(e);
    }
}

async function triggerReturnProcedure(rentalId) {
    try {
        await apiRequest(`/rentals/${rentalId}/return`, 'POST');
        showToast(`Car returned successfully. Associated vehicle is now AVAILABLE.`, 'success');
        switchTab('rentals');
    } catch (e) {
        // Error toast shown inside apiRequest
    }
}

async function completeMaintenance(maintId) {
    try {
        await apiRequest(`/maintenance/${maintId}`, 'PUT', { status: 'DONE' });
        showToast(`Maintenance complete. Car marked AVAILABLE.`, 'success');
        renderMaintenanceTable();
    } catch (e) {
        // Error handled
    }
}

// ==========================================
// 7. CRUD FORM BUILDING MODALS
// ==========================================

async function openCrudModal(entity, id = null) {
    const modal = document.getElementById('crud-modal-overlay');
    const title = document.getElementById('modal-title');
    const entityInput = document.getElementById('crud-entity-type');
    const idInput = document.getElementById('crud-entity-id');
    const fieldsDiv = document.getElementById('dynamic-form-fields');

    entityInput.value = entity;
    idInput.value = id || '';
    fieldsDiv.innerHTML = 'Loading form fields...';

    const label = id ? 'Modify' : 'Add New';
    modal.classList.remove('hidden');

    try {
        if (entity === 'cars') {
            title.textContent = `${label} Fleet Vehicle`;
            const item = id ? await apiRequest(`/cars/${id}`) : {};
            
            let catOptions = '';
            categoriesCache.forEach(c => {
                catOptions += `<option value="${c.category_id}" ${item.category_id === c.category_id ? 'selected' : ''}>${c.category_name}</option>`;
            });

            fieldsDiv.innerHTML = `
                <div class="input-group">
                    <label>Vehicle Brand *</label>
                    <input type="text" id="car-brand" required value="${item.brand || ''}" placeholder="e.g. Ford">
                </div>
                <div class="input-group">
                    <label>Vehicle Model *</label>
                    <input type="text" id="car-model" required value="${item.model || ''}" placeholder="e.g. Explorer">
                </div>
                <div class="input-row">
                    <div class="input-group">
                        <label>Year *</label>
                        <input type="number" id="car-year" min="2000" required value="${item.year || 2023}">
                    </div>
                    <div class="input-group">
                        <label>Category *</label>
                        <select id="car-cat" required>${catOptions}</select>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-group">
                        <label>Plate Number *</label>
                        <input type="text" id="car-plate" required value="${item.plate_number || ''}" placeholder="AA000">
                    </div>
                    <div class="input-group">
                        <label>Daily Rental Rate ($) *</label>
                        <input type="number" id="car-rate" min="1" required value="${item.daily_rate || 50}">
                    </div>
                </div>
                <div class="input-group">
                    <label>Status</label>
                    <select id="car-status">
                        <option value="AVAILABLE" ${item.status === 'AVAILABLE' ? 'selected' : ''}>Available</option>
                        <option value="RENTED" ${item.status === 'RENTED' ? 'selected' : ''}>Rented</option>
                        <option value="MAINTENANCE" ${item.status === 'MAINTENANCE' ? 'selected' : ''}>Maintenance</option>
                    </select>
                </div>
            `;
        }

        else if (entity === 'customers') {
            title.textContent = `${label} Customer Profile`;
            const item = id ? await apiRequest(`/customers/${id}`) : {};
            fieldsDiv.innerHTML = `
                <div class="input-group">
                    <label>Full Name *</label>
                    <input type="text" id="cust-name" required value="${item.full_name || ''}">
                </div>
                <div class="input-group">
                    <label>Phone Number *</label>
                    <input type="text" id="cust-phone" required value="${item.phone || ''}">
                </div>
                <div class="input-group">
                    <label>Email Address *</label>
                    <input type="email" id="cust-email" required value="${item.email || ''}">
                </div>
                <div class="input-group">
                    <label>National Identity Card # *</label>
                    <input type="text" id="cust-nid" required value="${item.national_id || ''}">
                </div>
            `;
        }

        else if (entity === 'rentals') {
            title.textContent = `${label} Rental Transaction`;
            const item = id ? await apiRequest(`/rentals`) : [];
            const r = item.find(rent => rent.rental_id === Number(id)) || {};
            
            const customers = await apiRequest('/customers');
            const cars = await apiRequest('/cars');

            let custOpts = '';
            customers.forEach(c => {
                custOpts += `<option value="${c.customer_id}" ${r.customer_id === c.customer_id ? 'selected' : ''}>${c.full_name}</option>`;
            });

            let carOpts = '';
            cars.forEach(car => {
                carOpts += `<option value="${car.car_id}" ${r.car_id === car.car_id ? 'selected' : ''}>${car.brand} ${car.model} (${car.plate_number})</option>`;
            });

            fieldsDiv.innerHTML = `
                <div class="input-group">
                    <label>Customer *</label>
                    <select id="rent-cust" required>${custOpts}</select>
                </div>
                <div class="input-group">
                    <label>Car *</label>
                    <select id="rent-car" required>${carOpts}</select>
                </div>
                <div class="input-row">
                    <div class="input-group">
                        <label>Start Date *</label>
                        <input type="date" id="rent-start" required value="${r.start_date || ''}">
                    </div>
                    <div class="input-group">
                        <label>End Date *</label>
                        <input type="date" id="rent-end" required value="${r.end_date || ''}">
                    </div>
                </div>
                <div class="input-group">
                    <label>Rental Status</label>
                    <select id="rent-status">
                        <option value="ONGOING" ${r.status === 'ONGOING' ? 'selected' : ''}>Ongoing</option>
                        <option value="RETURNED" ${r.status === 'RETURNED' ? 'selected' : ''}>Returned</option>
                        <option value="CANCELLED" ${r.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            `;
        }

        else if (entity === 'maintenance') {
            title.textContent = `${label} Maintenance Record`;
            const logs = await apiRequest('/maintenance');
            const item = logs.find(m => m.maintenance_id === id) || {};
            const cars = await apiRequest('/cars');

            let carOpts = '';
            cars.forEach(car => {
                carOpts += `<option value="${car.car_id}" ${item.car_id === car.car_id ? 'selected' : ''}>${car.brand} ${car.model} (${car.plate_number})</option>`;
            });

            fieldsDiv.innerHTML = `
                <div class="input-group">
                    <label>Car *</label>
                    <select id="maint-car" required>${carOpts}</select>
                </div>
                <div class="input-group">
                    <label>Issue Description *</label>
                    <textarea id="maint-desc" required rows="3">${item.issue_description || ''}</textarea>
                </div>
                <div class="input-row">
                    <div class="input-group">
                        <label>Cost ($) *</label>
                        <input type="number" id="maint-cost" required value="${item.cost || 0}">
                    </div>
                    <div class="input-group">
                        <label>Status</label>
                        <select id="maint-status">
                            <option value="PENDING" ${item.status === 'PENDING' ? 'selected' : ''}>Pending</option>
                            <option value="DONE" ${item.status === 'DONE' ? 'selected' : ''}>Done</option>
                        </select>
                    </div>
                </div>
            `;
        }

        else if (entity === 'insurance') {
            title.textContent = `${label} Insurance Policy`;
            const policies = await apiRequest('/insurance');
            const item = policies.find(i => i.insurance_id === id) || {};
            const cars = await apiRequest('/cars');

            let carOpts = '';
            cars.forEach(car => {
                carOpts += `<option value="${car.car_id}" ${item.car_id === car.car_id ? 'selected' : ''}>${car.brand} ${car.model} (${car.plate_number})</option>`;
            });

            fieldsDiv.innerHTML = `
                <div class="input-group">
                    <label>Vehicle *</label>
                    <select id="ins-car" required>${carOpts}</select>
                </div>
                <div class="input-group">
                    <label>Provider *</label>
                    <input type="text" id="ins-provider" required value="${item.provider || ''}">
                </div>
                <div class="input-row">
                    <div class="input-group">
                        <label>Annual Cost ($) *</label>
                        <input type="number" id="ins-cost" required value="${item.cost || 200}">
                    </div>
                    <div class="input-group">
                        <label>Expiry Date *</label>
                        <input type="date" id="ins-expiry" required value="${item.expiry_date || ''}">
                    </div>
                </div>
            `;
        }

        else if (entity === 'users') {
            title.textContent = `${label} User Account`;
            const users = await apiRequest('/users');
            const item = users.find(u => u.user_id === id) || {};
            fieldsDiv.innerHTML = `
                <div class="input-group">
                    <label>Username *</label>
                    <input type="text" id="user-name" required value="${item.username || ''}" ${id ? 'disabled' : ''}>
                </div>
                <div class="input-group">
                    <label>Password *</label>
                    <input type="password" id="user-pass" required value="">
                </div>
                <div class="input-group">
                    <label>System Role *</label>
                    <select id="user-role" required>
                        <option value="STAFF" ${item.role === 'STAFF' ? 'selected' : ''}>Staff Member</option>
                        <option value="ADMIN" ${item.role === 'ADMIN' ? 'selected' : ''}>Administrator</option>
                    </select>
                </div>
            `;
        }

        else if (entity === 'payments') {
            title.textContent = `Record Payment Manually`;
            const rentals = await apiRequest('/rentals');
            let rentOpts = '';
            rentals.forEach(r => {
                rentOpts += `<option value="${r.rental_id}">Rental #${r.rental_id} - ${r.customer_name} ($${r.total_cost})</option>`;
            });

            fieldsDiv.innerHTML = `
                <div class="input-group">
                    <label>Linked Rental Transaction *</label>
                    <select id="pay-rental" required>${rentOpts}</select>
                </div>
                <div class="input-group">
                    <label>Amount Paid ($) *</label>
                    <input type="number" id="pay-amount" min="1" required value="100">
                </div>
                <div class="input-group">
                    <label>Payment Method *</label>
                    <select id="pay-method" required>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="MOBILE">Mobile Money</option>
                    </select>
                </div>
            `;
        }
    } catch (err) {
        fieldsDiv.innerHTML = '<span style="color:var(--danger)">Error compiling fields.</span>';
    }
}

function closeCrudModal() {
    document.getElementById('crud-modal-overlay').classList.add('hidden');
}

// --- Submit form edits to Express DB routes
document.getElementById('crud-dynamic-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const entity = document.getElementById('crud-entity-type').value;
    const id = document.getElementById('crud-entity-id').value || null;

    let payload = {};

    try {
        if (entity === 'cars') {
            payload = {
                brand: document.getElementById('car-brand').value,
                model: document.getElementById('car-model').value,
                year: Number(document.getElementById('car-year').value),
                category_id: Number(document.getElementById('car-cat').value),
                plate_number: document.getElementById('car-plate').value,
                daily_rate: Number(document.getElementById('car-rate').value),
                status: document.getElementById('car-status').value
            };
            if (id) {
                await apiRequest(`/cars/${id}`, 'PUT', payload);
                showToast(`Vehicle updated.`, 'success');
            } else {
                await apiRequest(`/cars`, 'POST', payload);
                showToast(`New vehicle added to database.`, 'success');
            }
        } 
        
        else if (entity === 'customers') {
            payload = {
                full_name: document.getElementById('cust-name').value,
                phone: document.getElementById('cust-phone').value,
                email: document.getElementById('cust-email').value,
                national_id: document.getElementById('cust-nid').value
            };
            if (id) {
                await apiRequest(`/customers/${id}`, 'PUT', payload);
                showToast(`Customer index entry modified.`, 'success');
            } else {
                await apiRequest(`/customers`, 'POST', payload);
                showToast(`Customer profile created in database.`, 'success');
            }
        }

        else if (entity === 'rentals') {
            payload = {
                customer_id: Number(document.getElementById('rent-cust').value),
                car_id: Number(document.getElementById('rent-car').value),
                start_date: document.getElementById('rent-start').value,
                end_date: document.getElementById('rent-end').value,
                status: document.getElementById('rent-status').value
            };
            if (id) {
                await apiRequest(`/rentals/${id}`, 'PUT', payload);
                showToast(`Rental deal parameters updated.`, 'success');
            } else {
                await apiRequest(`/rentals`, 'POST', {
                    ...payload,
                    user_id: currentUser.user_id
                });
                showToast(`New rental deal successfully created in database.`, 'success');
            }
        }

        else if (entity === 'maintenance') {
            payload = {
                car_id: Number(document.getElementById('maint-car').value),
                issue_description: document.getElementById('maint-desc').value,
                cost: Number(document.getElementById('maint-cost').value),
                status: document.getElementById('maint-status').value
            };
            if (id) {
                await apiRequest(`/maintenance/${id}`, 'PUT', payload);
                showToast(`Maintenance log entry updated.`, 'success');
            } else {
                await apiRequest(`/maintenance`, 'POST', payload);
                showToast(`Vehicle maintenance issue logged.`, 'success');
            }
        }

        else if (entity === 'insurance') {
            payload = {
                car_id: Number(document.getElementById('ins-car').value),
                provider: document.getElementById('ins-provider').value,
                cost: Number(document.getElementById('ins-cost').value),
                expiry_date: document.getElementById('ins-expiry').value
            };
            if (id) {
                await apiRequest(`/insurance/${id}`, 'PUT', payload);
                showToast(`Insurance contract updated.`, 'success');
            } else {
                await apiRequest(`/insurance`, 'POST', payload);
                showToast(`Insurance contract saved to database.`, 'success');
            }
        }

        else if (entity === 'users') {
            payload = {
                username: document.getElementById('user-name').value,
                password: document.getElementById('user-pass').value,
                role: document.getElementById('user-role').value
            };
            if (id) {
                await apiRequest(`/users/${id}`, 'PUT', {
                    password: payload.password,
                    role: payload.role
                });
                showToast(`User configuration modified.`, 'success');
            } else {
                await apiRequest(`/users`, 'POST', payload);
                showToast(`New system user account created.`, 'success');
            }
        }

        else if (entity === 'payments') {
            payload = {
                rental_id: Number(document.getElementById('pay-rental').value),
                amount: Number(document.getElementById('pay-amount').value),
                method: document.getElementById('pay-method').value
            };
            await apiRequest(`/payments`, 'POST', payload);
            showToast(`Manual cash ledger balance recorded.`, 'success');
        }

        closeCrudModal();
        switchTab(activeTab); // Reload active grid view
    } catch (err) {
        // Error toast is shown in apiRequest
    }
});

// --- Dynamic Delete Handlers
async function deleteEntity(entity, id) {
    if (entity === 'users' && Number(id) === 1) {
        showToast("Primary Administrator cannot be deleted.", "warning");
        return;
    }

    if (confirm(`Are you absolutely sure you want to delete this record (ID #${id})?`)) {
        try {
            await apiRequest(`/${entity}/${id}`, 'DELETE');
            showToast(`Record successfully deleted from database.`, 'success');
            switchTab(activeTab);
        } catch (e) {
            // Handled
        }
    }
}

// ==========================================
// 8. SIGNUP / LOGIN PORTAL HANDLERS
// ==========================================

document.getElementById('to-signup').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.add('active');
    document.querySelector('.auth-header h2').textContent = 'Sign Up';
});

document.getElementById('to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
    document.querySelector('.auth-header h2').textContent = 'Welcome Back';
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await apiRequest('/auth/login', 'POST', { username, password });
        if (res.success) {
            currentUser = res.user;
            sessionStorage.setItem('apex_user', JSON.stringify(currentUser));
            showToast(`Authenticated as ${currentUser.username}!`, 'success');
            checkAuthentication();
        }
    } catch (err) {
        // Toast is triggered by API function
    }
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;

    try {
        const res = await apiRequest('/auth/signup', 'POST', { username, password, role });
        if (res.success) {
            currentUser = res.user;
            sessionStorage.setItem('apex_user', JSON.stringify(currentUser));
            showToast(`Account registered and logged in!`, 'success');
            checkAuthentication();
        }
    } catch (err) {
        // Error toast triggered
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    sessionStorage.removeItem('apex_user');
    checkAuthentication();
});

// ==========================================
// 9. RETURN VEHICLE FORM INITIALIZATION
// ==========================================
// Return vehicle listeners will bind on bootstrap below.

// ==========================================
// 10. BOOTSTRAP INITIALIZATION
// ==========================================

// Global reset database
document.getElementById('refresh-state-btn').addEventListener('click', async () => {
    if (confirm("This will reset all vehicles, customers, users and rentals back to their original database seed values. Continue?")) {
        try {
            await fetch('/api/reset-seeds', { method: 'POST' });
            showToast("Database seed state reloaded!", 'success');
            switchTab(activeTab);
        } catch (e) {
            showToast("Failed to reset database", "danger");
        }
    }
});

// Sidebar links navigation
document.querySelectorAll('.sidebar-nav li').forEach(li => {
    li.addEventListener('click', () => {
        const tab = li.getAttribute('data-tab');
        switchTab(tab);
    });
});

// Cars Search & Filters
document.getElementById('cars-search-input').addEventListener('input', renderCarsTable);
document.getElementById('cars-filter-status').addEventListener('change', renderCarsTable);

// Customers Search
document.getElementById('customers-search-input').addEventListener('input', renderCustomersTable);

// Rentals Search & Filters
document.getElementById('rentals-search-input').addEventListener('input', renderRentalsTable);
document.getElementById('rentals-filter-status').addEventListener('change', renderRentalsTable);

// Booking calculator listeners
document.getElementById('booking-car').addEventListener('change', updateRentalCostEstimation);
document.getElementById('booking-start-date').addEventListener('change', updateRentalCostEstimation);
document.getElementById('booking-end-date').addEventListener('change', updateRentalCostEstimation);

// Submit booking form
document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const customer_id = document.getElementById('booking-customer').value;
    const car_id = document.getElementById('booking-car').value;
    const start_date = document.getElementById('booking-start-date').value;
    const end_date = document.getElementById('booking-end-date').value;

    try {
        await apiRequest('/rentals', 'POST', {
            customer_id,
            car_id,
            user_id: currentUser.user_id,
            start_date,
            end_date
        });
        showToast("Rental deal successfully booked!", 'success');
        document.getElementById('booking-form').reset();
        updateRentalCostEstimation();
        switchTab('rentals');
    } catch (err) {
        // Error toast triggered
    }
});

// Submit return form
const returnForm = document.getElementById('return-form');
if (returnForm) {
    returnForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rentalId = document.getElementById('return-rental-select').value;
        if (rentalId) {
            try {
                await triggerReturnProcedure(rentalId);
                showToast(`Car returned successfully.`, 'success');
                returnForm.reset();
            } catch (err) {
                // error handled
            }
        }
    });
}

// System Clock
setInterval(() => {
    const clock = document.getElementById('clock');
    if (clock) {
        clock.textContent = new Date().toLocaleTimeString();
    }
}, 1000);

// Kick off
checkAuthentication();
