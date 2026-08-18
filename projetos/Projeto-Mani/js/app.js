// Controller — visão cliente
(() => {
    const state = {
        step: 1,
        serviceId: null,
        proId: null,
        date: null,
        time: null,
        calMonth: new Date().getMonth(),
        calYear: new Date().getFullYear()
    };

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    // Serviços
    function renderServices() {
        const grid = document.getElementById('servicesGrid');
        grid.innerHTML = BelleData.getServices().map(s => `
            <div class="service-card" data-service="${s.id}">
                <div class="service-icon">${s.icon}</div>
                <h3>${s.name}</h3>
                <p>${s.desc}</p>
                <div class="service-meta">
                    <span class="service-price">${BRL(s.price)}</span>
                    <span class="service-duration">⏱ ${s.duration} min</span>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', () => {
                state.serviceId = card.dataset.service;
                document.getElementById('agendamento').scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    renderServicePicker();
                    goToStep(1);
                }, 400);
            });
        });
    }

    function renderPros() {
        const grid = document.getElementById('prosGrid');
        grid.innerHTML = BelleData.getPros().map(p => `
            <div class="pro-card">
                <div class="pro-photo">
                    <img src="${p.photo}" alt="${p.name}" onerror="this.parentElement.innerHTML='<div style=&quot;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:60px;color:var(--rose)&quot;>${p.name.charAt(0)}</div>'">
                </div>
                <div class="pro-info">
                    <h3>${p.name}</h3>
                    <div class="pro-role">${p.role}</div>
                    <div class="pro-specs">${p.bio}</div>
                </div>
            </div>
        `).join('');
    }

    function renderGallery() {
        const g = document.getElementById('gallery');
        g.innerHTML = BelleData.getGallery().map(url => `
            <div class="gallery-item">
                <img src="${url}" alt="Trabalho" onerror="this.parentElement.style.background='linear-gradient(135deg, var(--rose), var(--gold))'; this.remove()">
            </div>
        `).join('');
    }

    // ============ BOOKING FLOW ============

    function renderServicePicker() {
        const el = document.getElementById('servicePicker');
        el.innerHTML = BelleData.getServices().map(s => `
            <button class="pick-item ${state.serviceId === s.id ? 'selected' : ''}" data-service="${s.id}" type="button">
                <div class="pick-icon">${s.icon}</div>
                <div class="pick-body">
                    <div class="pick-title">${s.name}</div>
                    <div class="pick-sub">${s.duration} min · <span class="pick-price">${BRL(s.price)}</span></div>
                </div>
            </button>
        `).join('');

        el.querySelectorAll('.pick-item').forEach(item => {
            item.addEventListener('click', () => {
                state.serviceId = item.dataset.service;
                el.querySelectorAll('.pick-item').forEach(x => x.classList.remove('selected'));
                item.classList.add('selected');
                updateActions();
            });
        });
    }

    function renderProPicker() {
        const el = document.getElementById('proPicker');
        const pros = BelleData.getProsForService(state.serviceId);
        el.innerHTML = pros.map(p => `
            <button class="pick-item ${state.proId === p.id ? 'selected' : ''}" data-pro="${p.id}" type="button">
                <div class="pick-icon"><img src="${p.photo}" alt="${p.name}" onerror="this.parentElement.textContent='${p.name.charAt(0)}'"></div>
                <div class="pick-body">
                    <div class="pick-title">${p.name}</div>
                    <div class="pick-sub">${p.role}</div>
                </div>
            </button>
        `).join('');

        el.querySelectorAll('.pick-item').forEach(item => {
            item.addEventListener('click', () => {
                state.proId = item.dataset.pro;
                el.querySelectorAll('.pick-item').forEach(x => x.classList.remove('selected'));
                item.classList.add('selected');
                updateActions();
            });
        });
    }

    function renderCalendar() {
        const monthLabel = document.getElementById('calMonth');
        const cal = document.getElementById('calendar');
        const y = state.calYear;
        const m = state.calMonth;

        monthLabel.textContent = `${MONTHS[m]} ${y}`;

        const first = new Date(y, m, 1);
        const startDow = first.getDay();
        const daysInMonth = new Date(y, m + 1, 0).getDate();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = DOW_SHORT.map(d => `<div class="cal-dow">${d}</div>`).join('');

        for (let i = 0; i < startDow; i++) {
            html += `<div class="cal-day disabled"></div>`;
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(y, m, d);
            const dateStr = BelleData.ymd(date);
            const isPast = date < today;
            const isSunday = date.getDay() === 0;
            const isToday = date.getTime() === today.getTime();
            const isSelected = state.date === dateStr;
            const disabled = isPast || isSunday;

            html += `<button type="button" class="cal-day ${disabled ? 'disabled' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}" ${disabled ? 'disabled' : ''}>${d}</button>`;
        }

        cal.innerHTML = html;

        cal.querySelectorAll('.cal-day:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                state.date = btn.dataset.date;
                state.time = null;
                cal.querySelectorAll('.cal-day').forEach(x => x.classList.remove('selected'));
                btn.classList.add('selected');
                renderTimeSlots();
                updateActions();
            });
        });
    }

    function renderTimeSlots() {
        const container = document.getElementById('timeSlotsContainer');
        const el = document.getElementById('timeSlots');
        const lbl = document.getElementById('selectedDateLabel');

        if (!state.date) { container.classList.add('hidden'); return; }
        container.classList.remove('hidden');
        lbl.textContent = fmtDateLong(state.date);

        // slots de 30min de 09:00 às 19:30
        const service = BelleData.getService(state.serviceId);
        const booked = BelleData.getBookedSlots(state.proId, state.date);
        const slots = [];
        for (let h = 9; h < 20; h++) {
            for (let mm = 0; mm < 60; mm += 30) {
                slots.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
            }
        }

        // marca como ocupado se cair dentro da duração de algum agendamento
        const isBooked = (slot) => {
            const [sh, sm] = slot.split(':').map(Number);
            const slotStart = sh * 60 + sm;
            const slotEnd = slotStart + service.duration;
            return booked.some(b => {
                const [bh, bm] = b.split(':').map(Number);
                const bStart = bh * 60 + bm;
                const bAppt = BelleData.getAppointmentsByPro(state.proId).find(a => a.date === state.date && a.time === b);
                const bDur = bAppt ? BelleData.getService(bAppt.serviceId).duration : 60;
                const bEnd = bStart + bDur;
                return slotStart < bEnd && slotEnd > bStart;
            });
        };

        el.innerHTML = slots.map(s => {
            const booked = isBooked(s);
            return `<button type="button" class="time-slot ${booked ? 'disabled' : ''} ${state.time === s ? 'selected' : ''}" data-time="${s}" ${booked ? 'disabled' : ''}>${s}</button>`;
        }).join('');

        el.querySelectorAll('.time-slot:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                state.time = btn.dataset.time;
                el.querySelectorAll('.time-slot').forEach(x => x.classList.remove('selected'));
                btn.classList.add('selected');
                updateActions();
            });
        });
    }

    function renderSummary() {
        const svc = BelleData.getService(state.serviceId);
        const pro = BelleData.getPro(state.proId);
        document.getElementById('sumService').textContent = svc ? `${svc.name} (${svc.duration}min)` : '—';
        document.getElementById('sumPro').textContent = pro ? pro.name : '—';
        document.getElementById('sumDate').textContent = state.date ? fmtDateLong(state.date) : '—';
        document.getElementById('sumTime').textContent = state.time || '—';
        document.getElementById('sumPrice').textContent = svc ? BRL(svc.price) : '—';
    }

    // ============ STEP NAVIGATION ============

    document.getElementById('prevMonth').addEventListener('click', () => {
        state.calMonth--;
        if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        state.calMonth++;
        if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
        renderCalendar();
    });

    function goToStep(step) {
        state.step = step;
        document.querySelectorAll('.booking-step').forEach(el => {
            el.classList.toggle('hidden', Number(el.dataset.step) !== step);
        });
        document.querySelectorAll('.step').forEach(el => {
            const n = Number(el.dataset.step);
            el.classList.toggle('active', n === step);
            el.classList.toggle('done', n < step);
        });

        if (step === 2) renderProPicker();
        if (step === 3) renderCalendar();
        if (step === 4) renderSummary();

        updateActions();
        document.querySelector('.booking-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function updateActions() {
        const prev = document.getElementById('prevStep');
        const next = document.getElementById('nextStep');
        prev.disabled = state.step === 1;

        if (state.step === 4) {
            next.textContent = 'Confirmar agendamento';
        } else {
            next.textContent = 'Continuar';
        }

        let canProceed = false;
        if (state.step === 1) canProceed = !!state.serviceId;
        if (state.step === 2) canProceed = !!state.proId;
        if (state.step === 3) canProceed = !!(state.date && state.time);
        if (state.step === 4) canProceed = true;
        next.disabled = !canProceed;
    }

    document.getElementById('prevStep').addEventListener('click', () => {
        if (state.step > 1) goToStep(state.step - 1);
    });

    document.getElementById('nextStep').addEventListener('click', () => {
        if (state.step === 4) {
            confirmBooking();
        } else if (state.step < 4) {
            if (state.step === 1 && !BelleData.getProsForService(state.serviceId).find(p => p.id === state.proId)) {
                state.proId = null;
            }
            goToStep(state.step + 1);
        }
    });

    function confirmBooking() {
        const form = document.getElementById('clientForm');
        if (!form.reportValidity()) return;

        const fd = new FormData(form);
        const service = BelleData.getService(state.serviceId);

        BelleData.addAppointment({
            serviceId: state.serviceId,
            proId: state.proId,
            date: state.date,
            time: state.time,
            clientName: fd.get('name'),
            clientPhone: fd.get('phone'),
            clientEmail: fd.get('email'),
            notes: fd.get('notes') || '',
            price: service.price
        });

        showToast('Agendamento confirmado! Enviaremos um lembrete no seu WhatsApp.', 'success');

        // reset
        state.step = 1;
        state.serviceId = null;
        state.proId = null;
        state.date = null;
        state.time = null;
        form.reset();
        renderServicePicker();
        goToStep(1);
    }

    // Init
    renderServices();
    renderPros();
    renderGallery();
    renderServicePicker();
    updateActions();
})();
