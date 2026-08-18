// Controller — painel admin
(() => {
    const AUTH_KEY = 'belle_admin_auth';
    const CREDS = { user: 'admin', pass: 'belle2026' };

    const loginScreen = document.getElementById('loginScreen');
    const adminApp = document.getElementById('adminApp');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    function checkAuth() {
        return sessionStorage.getItem(AUTH_KEY) === '1';
    }

    function showApp() {
        loginScreen.classList.add('hidden');
        adminApp.classList.remove('hidden');
        initApp();
    }

    if (checkAuth()) showApp();

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(loginForm);
        if (fd.get('user') === CREDS.user && fd.get('pass') === CREDS.pass) {
            sessionStorage.setItem(AUTH_KEY, '1');
            loginError.classList.add('hidden');
            showApp();
        } else {
            loginError.classList.remove('hidden');
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem(AUTH_KEY);
        location.reload();
    });

    // ============ APP INIT ============
    let adminWeekStart = null;

    function initApp() {
        renderTodayBadge();
        renderDashboard();
        setupNav();
        setupAppointmentsView();
        setupCalendarView();
        renderServicesAdmin();
        renderProsAdmin();
    }

    function renderTodayBadge() {
        const d = new Date();
        document.getElementById('todayBadge').textContent = `${DOW_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
    }

    function setupNav() {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const view = btn.dataset.view;
                document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
                document.getElementById('view-' + view).classList.remove('hidden');

                const titles = {
                    dashboard: ['Dashboard', 'Visão geral do salão'],
                    appointments: ['Agendamentos', 'Lista completa de agendamentos'],
                    calendar: ['Agenda', 'Visão semanal por profissional'],
                    services: ['Serviços', 'Serviços oferecidos'],
                    pros: ['Profissionais', 'Time do salão']
                };
                document.getElementById('viewTitle').textContent = titles[view][0];
                document.getElementById('viewSubtitle').textContent = titles[view][1];

                if (view === 'appointments') renderAppointmentsTable();
                if (view === 'calendar') renderAdminCalendar();
                if (view === 'dashboard') renderDashboard();
            });
        });
    }

    // ============ DASHBOARD ============

    function renderDashboard() {
        const appts = BelleData.getAppointments();
        const today = BelleData.ymd(new Date());

        const validAppts = appts.filter(a => a.status !== 'cancelled');

        // Hoje
        const todayAppts = validAppts.filter(a => a.date === today);
        const revToday = todayAppts.reduce((s, a) => s + a.price, 0);
        document.getElementById('revToday').textContent = BRL(revToday);
        document.getElementById('revTodayCount').textContent = `${todayAppts.length} agendamento${todayAppts.length !== 1 ? 's' : ''}`;

        // Semana atual (segunda a domingo)
        const now = new Date();
        const weekStart = new Date(now);
        const dayIdx = (now.getDay() + 6) % 7;
        weekStart.setDate(now.getDate() - dayIdx);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        const weekAppts = validAppts.filter(a => {
            const d = new Date(a.date + 'T00:00:00');
            return d >= weekStart && d <= weekEnd;
        });
        const revWeek = weekAppts.reduce((s, a) => s + a.price, 0);
        document.getElementById('revWeek').textContent = BRL(revWeek);
        document.getElementById('revWeekCount').textContent = `${weekAppts.length} agendamentos`;

        // Mês atual
        const y = now.getFullYear(), m = now.getMonth();
        const monthAppts = validAppts.filter(a => {
            const [ay, am] = a.date.split('-').map(Number);
            return ay === y && am - 1 === m;
        });
        const revMonth = monthAppts.reduce((s, a) => s + a.price, 0);
        document.getElementById('revMonth').textContent = BRL(revMonth);
        document.getElementById('revMonthCount').textContent = `${monthAppts.length} agendamentos`;

        // Ticket médio (últimos 30 dias)
        const past30 = new Date(now);
        past30.setDate(past30.getDate() - 30);
        const p30Appts = validAppts.filter(a => new Date(a.date + 'T00:00:00') >= past30);
        const avg = p30Appts.length ? p30Appts.reduce((s, a) => s + a.price, 0) / p30Appts.length : 0;
        document.getElementById('avgTicket').textContent = BRL2(avg);

        renderWeekChart(validAppts, now);
        renderUpcoming(appts, today);
        renderTopServices(validAppts);
        renderProsRevenue(monthAppts);
    }

    function renderWeekChart(validAppts, now) {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = BelleData.ymd(d);
            const dayAppts = validAppts.filter(a => a.date === key);
            days.push({
                label: DOW_SHORT[d.getDay()],
                date: `${d.getDate()}/${d.getMonth() + 1}`,
                value: dayAppts.reduce((s, a) => s + a.price, 0),
                count: dayAppts.length
            });
        }
        const max = Math.max(1, ...days.map(d => d.value));
        const chart = document.getElementById('weekChart');
        chart.innerHTML = days.map(d => `
            <div class="chart-bar" title="${d.count} agendamentos">
                <div class="chart-bar-fill" style="height: ${(d.value / max) * 100}%">
                    <span class="chart-bar-value">${d.value > 0 ? BRL(d.value) : ''}</span>
                </div>
                <div class="chart-bar-label">${d.label}<br><small>${d.date}</small></div>
            </div>
        `).join('');
    }

    function renderUpcoming(appts, today) {
        const upcoming = appts
            .filter(a => a.date >= today && a.status === 'confirmed')
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
            .slice(0, 8);

        const el = document.getElementById('upcomingList');
        if (!upcoming.length) {
            el.innerHTML = '<div class="empty-state"><p>Nenhum agendamento futuro.</p></div>';
            return;
        }
        el.innerHTML = upcoming.map(a => {
            const svc = BelleData.getService(a.serviceId);
            const pro = BelleData.getPro(a.proId);
            const dateLabel = a.date === today ? 'Hoje' : fmtDate(a.date);
            return `
                <div class="upcoming-item">
                    <div class="up-time">${dateLabel}<br><strong>${a.time}</strong></div>
                    <div class="up-info">
                        <div class="up-client">${a.clientName}</div>
                        <div class="up-service">${svc.name} · ${pro.name}</div>
                    </div>
                    <div class="up-price"><strong>${BRL(a.price)}</strong></div>
                </div>
            `;
        }).join('');
    }

    function renderTopServices(validAppts) {
        const counts = {};
        validAppts.forEach(a => { counts[a.serviceId] = (counts[a.serviceId] || 0) + 1; });
        const top = Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        const max = Math.max(1, ...top.map(([, c]) => c));

        document.getElementById('topServices').innerHTML = top.map(([sid, count]) => {
            const svc = BelleData.getService(sid);
            return `
                <div class="top-item">
                    <div class="top-item-header">
                        <span>${svc.name}</span>
                        <strong>${count}</strong>
                    </div>
                    <div class="top-item-bar">
                        <div class="top-item-bar-fill" style="width: ${(count / max) * 100}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderProsRevenue(monthAppts) {
        const byPro = {};
        monthAppts.forEach(a => { byPro[a.proId] = (byPro[a.proId] || 0) + a.price; });
        const list = Object.entries(byPro).sort(([, a], [, b]) => b - a);
        const max = Math.max(1, ...list.map(([, v]) => v));

        document.getElementById('prosRevenue').innerHTML = list.map(([pid, val]) => {
            const pro = BelleData.getPro(pid);
            return `
                <div class="top-item">
                    <div class="top-item-header">
                        <span>${pro.name}</span>
                        <strong>${BRL(val)}</strong>
                    </div>
                    <div class="top-item-bar">
                        <div class="top-item-bar-fill" style="width: ${(val / max) * 100}%; background: linear-gradient(90deg, ${pro.color}, var(--gold))"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ============ APPOINTMENTS TABLE ============

    function setupAppointmentsView() {
        document.getElementById('apptSearch').addEventListener('input', renderAppointmentsTable);
        document.getElementById('apptStatusFilter').addEventListener('change', renderAppointmentsTable);
        document.getElementById('apptDateFilter').addEventListener('change', renderAppointmentsTable);
    }

    function renderAppointmentsTable() {
        const q = (document.getElementById('apptSearch').value || '').toLowerCase();
        const stFilter = document.getElementById('apptStatusFilter').value;
        const dtFilter = document.getElementById('apptDateFilter').value;
        const today = BelleData.ymd(new Date());
        const now = new Date();

        let appts = BelleData.getAppointments().slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

        if (stFilter !== 'all') appts = appts.filter(a => a.status === stFilter);

        if (dtFilter === 'today') appts = appts.filter(a => a.date === today);
        else if (dtFilter === 'week') {
            const ws = new Date(now); ws.setDate(now.getDate() - ((now.getDay() + 6) % 7)); ws.setHours(0,0,0,0);
            const we = new Date(ws); we.setDate(ws.getDate() + 6);
            appts = appts.filter(a => { const d = new Date(a.date + 'T00:00:00'); return d >= ws && d <= we; });
        }
        else if (dtFilter === 'month') {
            appts = appts.filter(a => a.date.startsWith(BelleData.ymd(now).slice(0, 7)));
        }
        else if (dtFilter === 'past') {
            appts = appts.filter(a => a.date < today);
        }

        if (q) {
            appts = appts.filter(a => {
                const svc = BelleData.getService(a.serviceId);
                const pro = BelleData.getPro(a.proId);
                return a.clientName.toLowerCase().includes(q) ||
                    a.clientPhone.toLowerCase().includes(q) ||
                    svc.name.toLowerCase().includes(q) ||
                    pro.name.toLowerCase().includes(q);
            });
        }

        const tbody = document.getElementById('apptTableBody');
        if (!appts.length) {
            tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><h3>Nenhum agendamento</h3><p>Nenhum resultado encontrado com os filtros atuais.</p></div></td></tr>`;
            return;
        }

        const statusLabels = { confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado' };

        tbody.innerHTML = appts.map(a => {
            const svc = BelleData.getService(a.serviceId);
            const pro = BelleData.getPro(a.proId);
            return `
                <tr>
                    <td><strong>${fmtDate(a.date)}</strong><br><span style="color:var(--text-muted);font-size:12px">${a.time}</span></td>
                    <td>
                        <div class="cli-name">${a.clientName}</div>
                        <div class="cli-phone">${a.clientPhone}</div>
                    </td>
                    <td>${svc.name}</td>
                    <td>${pro.name}</td>
                    <td><strong>${BRL(a.price)}</strong></td>
                    <td><span class="status-badge ${a.status}">${statusLabels[a.status]}</span></td>
                    <td>
                        <div class="row-actions">
                            ${a.status === 'confirmed' ? `<button class="icon-btn" data-action="complete" data-id="${a.id}" title="Marcar como concluído">✓</button>` : ''}
                            ${a.status !== 'cancelled' ? `<button class="icon-btn danger" data-action="cancel" data-id="${a.id}" title="Cancelar">✕</button>` : ''}
                            <button class="icon-btn danger" data-action="delete" data-id="${a.id}" title="Excluir">🗑</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.icon-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const action = btn.dataset.action;
                if (action === 'complete') { BelleData.updateAppointmentStatus(id, 'completed'); showToast('Agendamento concluído', 'success'); }
                if (action === 'cancel') { BelleData.updateAppointmentStatus(id, 'cancelled'); showToast('Agendamento cancelado'); }
                if (action === 'delete') {
                    if (!confirm('Excluir este agendamento?')) return;
                    BelleData.deleteAppointment(id);
                    showToast('Agendamento excluído');
                }
                renderAppointmentsTable();
                renderDashboard();
            });
        });
    }

    // ============ CALENDAR (weekly view) ============

    function setupCalendarView() {
        const now = new Date();
        adminWeekStart = new Date(now);
        adminWeekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        adminWeekStart.setHours(0, 0, 0, 0);

        document.getElementById('adminPrevWeek').addEventListener('click', () => {
            adminWeekStart.setDate(adminWeekStart.getDate() - 7);
            renderAdminCalendar();
        });
        document.getElementById('adminNextWeek').addEventListener('click', () => {
            adminWeekStart.setDate(adminWeekStart.getDate() + 7);
            renderAdminCalendar();
        });
    }

    function renderAdminCalendar() {
        const start = new Date(adminWeekStart);
        const end = new Date(start); end.setDate(start.getDate() + 6);
        document.getElementById('adminWeekLabel').textContent =
            `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)} — ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;

        const grid = document.getElementById('adminCalendar');
        const today = BelleData.ymd(new Date());

        // Header row
        let html = `<div class="admin-cal-header-cell">Hora</div>`;
        for (let i = 0; i < 7; i++) {
            const d = new Date(start); d.setDate(start.getDate() + i);
            const isToday = BelleData.ymd(d) === today;
            html += `<div class="admin-cal-header-cell ${isToday ? 'today' : ''}">${DOW_SHORT[d.getDay()]}<br><small>${d.getDate()}/${d.getMonth()+1}</small></div>`;
        }

        // Hours
        for (let h = 9; h < 20; h++) {
            html += `<div class="admin-cal-cell admin-cal-time">${String(h).padStart(2, '0')}:00</div>`;
            for (let i = 0; i < 7; i++) {
                const d = new Date(start); d.setDate(start.getDate() + i);
                const dateStr = BelleData.ymd(d);
                const cellAppts = BelleData.getAppointmentsByDate(dateStr)
                    .filter(a => parseInt(a.time.split(':')[0]) === h);
                const blocks = cellAppts.map(a => {
                    const svc = BelleData.getService(a.serviceId);
                    const pro = BelleData.getPro(a.proId);
                    return `<div class="appt-block ${a.status}" title="${a.clientName} — ${svc.name} — ${pro.name}"><strong>${a.time} ${a.clientName.split(' ')[0]}</strong><small>${svc.name.slice(0, 18)}</small></div>`;
                }).join('');
                html += `<div class="admin-cal-cell">${blocks}</div>`;
            }
        }
        grid.innerHTML = html;
    }

    // ============ SERVICES & PROS (view-only cards) ============

    function renderServicesAdmin() {
        const appts = BelleData.getAppointments().filter(a => a.status !== 'cancelled');
        const el = document.getElementById('servicesAdmin');
        el.innerHTML = BelleData.getServices().map(s => {
            const svcAppts = appts.filter(a => a.serviceId === s.id);
            const revenue = svcAppts.reduce((sum, a) => sum + a.price, 0);
            return `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon">${s.icon}</div>
                        <div>
                            <h3>${s.name}</h3>
                            <div class="admin-card-sub">${s.duration} min</div>
                        </div>
                    </div>
                    <div class="admin-card-body">
                        <p>${s.desc}</p>
                    </div>
                    <div class="admin-card-stats">
                        <div class="stat">
                            <span class="stat-label">Preço</span>
                            <span class="stat-value">${BRL(s.price)}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Agendamentos</span>
                            <span class="stat-value">${svcAppts.length}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Faturamento</span>
                            <span class="stat-value">${BRL(revenue)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderProsAdmin() {
        const appts = BelleData.getAppointments().filter(a => a.status !== 'cancelled');
        const el = document.getElementById('prosAdmin');
        el.innerHTML = BelleData.getPros().map(p => {
            const proAppts = appts.filter(a => a.proId === p.id);
            const revenue = proAppts.reduce((sum, a) => sum + a.price, 0);
            return `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-icon"><img src="${p.photo}" alt="${p.name}" onerror="this.parentElement.textContent='${p.name.charAt(0)}'"></div>
                        <div>
                            <h3>${p.name}</h3>
                            <div class="admin-card-sub">${p.role}</div>
                        </div>
                    </div>
                    <div class="admin-card-body">
                        <p>${p.bio}</p>
                    </div>
                    <div class="admin-card-stats">
                        <div class="stat">
                            <span class="stat-label">Serviços</span>
                            <span class="stat-value">${p.services.length}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Agendamentos</span>
                            <span class="stat-value">${proAppts.length}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Faturamento</span>
                            <span class="stat-value">${BRL(revenue)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
})();
