// Model — dados mockados e persistência (localStorage)
const BelleData = (() => {
    const STORAGE_KEY = 'belle_studio_data_v1';

    const SERVICES = [
        { id: 's1', name: 'Manicure Simples', desc: 'Corte, lixamento e esmaltação com produtos premium.', price: 45, duration: 45, category: 'unhas', icon: '💅' },
        { id: 's2', name: 'Manicure em Gel', desc: 'Esmalte em gel de longa duração, até 3 semanas.', price: 90, duration: 90, category: 'unhas', icon: '✨' },
        { id: 's3', name: 'Pedicure', desc: 'Cuidado completo com seus pés, com hidratação e esfoliação.', price: 55, duration: 60, category: 'unhas', icon: '🦶' },
        { id: 's4', name: 'Combo Mani + Pedi', desc: 'Mãos e pés impecáveis num só atendimento.', price: 85, duration: 90, category: 'unhas', icon: '💖' },
        { id: 's5', name: 'Corte Feminino', desc: 'Corte moderno feito por especialistas.', price: 90, duration: 60, category: 'cabelo', icon: '✂️' },
        { id: 's6', name: 'Corte Masculino', desc: 'Corte clássico ou moderno com acabamento perfeito.', price: 55, duration: 45, category: 'cabelo', icon: '💈' },
        { id: 's7', name: 'Escova Modeladora', desc: 'Cabelo alinhado, brilhoso e com movimento.', price: 70, duration: 60, category: 'cabelo', icon: '💇' },
        { id: 's8', name: 'Coloração', desc: 'Coloração profissional com produtos de alta qualidade.', price: 220, duration: 180, category: 'cabelo', icon: '🎨' },
        { id: 's9', name: 'Hidratação Capilar', desc: 'Tratamento reparador profundo para cabelos danificados.', price: 130, duration: 90, category: 'cabelo', icon: '💧' },
        { id: 's10', name: 'Design de Sobrancelhas', desc: 'Design personalizado que valoriza seu rosto.', price: 40, duration: 30, category: 'estetica', icon: '👁️' }
    ];

    const PROS = [
        { id: 'p1', name: 'Ana Costa', role: 'Manicure Sênior', bio: '10 anos de experiência em nail art.', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80', services: ['s1', 's2', 's3', 's4'], color: '#C87891' },
        { id: 'p2', name: 'Julia Ferreira', role: 'Manicure & Design', bio: 'Especialista em unhas em gel e nail art.', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80', services: ['s1', 's2', 's3', 's4', 's10'], color: '#D4A574' },
        { id: 'p3', name: 'Roberto Alves', role: 'Cabeleireiro', bio: 'Cortes masculinos e femininos com técnica autoral.', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', services: ['s5', 's6', 's7'], color: '#4A5FBF' },
        { id: 'p4', name: 'Camila Santos', role: 'Cabeleireira & Colorista', bio: 'Colorista certificada especializada em blondes.', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', services: ['s5', 's7', 's8', 's9'], color: '#8B5B9E' }
    ];

    const GALLERY = [
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
        'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=600&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
        'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=600&q=80',
        'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&q=80',
        'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80'
    ];

    // Gera agendamentos mockados iniciais (últimos 30 dias até 15 dias no futuro)
    function seedAppointments() {
        const appts = [];
        const now = new Date();
        const names = ['Maria Silva', 'João Pereira', 'Beatriz Almeida', 'Carlos Oliveira', 'Fernanda Souza', 'Rafael Costa', 'Larissa Martins', 'Paula Ribeiro', 'Gustavo Lima', 'Isabela Rocha', 'Marcos Vinicius', 'Amanda Nunes', 'Patrícia Dias', 'Renata Barros', 'Thiago Ramos'];
        const phones = ['(11) 98765-4321', '(11) 97654-3210', '(11) 96543-2109', '(11) 95432-1098', '(11) 94321-0987'];

        let id = 1;
        for (let d = -30; d <= 15; d++) {
            const date = new Date(now);
            date.setDate(date.getDate() + d);
            const dow = date.getDay();
            if (dow === 0) continue; // domingo fechado

            const count = dow === 6 ? 5 + Math.floor(rnd(d) * 4) : 3 + Math.floor(rnd(d) * 4);
            for (let i = 0; i < count; i++) {
                const svc = SERVICES[Math.floor(rnd(d * 100 + i) * SERVICES.length)];
                const availablePros = PROS.filter(p => p.services.includes(svc.id));
                const pro = availablePros[Math.floor(rnd(d * 100 + i * 3) * availablePros.length)];
                const name = names[Math.floor(rnd(d * 200 + i * 7) * names.length)];
                const phone = phones[Math.floor(rnd(d * 300 + i * 11) * phones.length)];
                const hour = 9 + Math.floor(rnd(d * 400 + i * 13) * 10);
                const minute = Math.floor(rnd(d * 500 + i * 17) * 2) * 30;

                const dateStr = ymd(date);
                const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                const status = d < 0 ? (rnd(d + i) > 0.1 ? 'completed' : 'cancelled') : 'confirmed';

                appts.push({
                    id: 'a' + id++,
                    serviceId: svc.id,
                    proId: pro.id,
                    date: dateStr,
                    time: timeStr,
                    clientName: name,
                    clientPhone: phone,
                    clientEmail: name.toLowerCase().replace(' ', '.') + '@email.com',
                    notes: '',
                    status,
                    price: svc.price,
                    createdAt: new Date(date.getTime() - 86400000 * 3).toISOString()
                });
            }
        }
        return appts;
    }

    function rnd(seed) {
        const x = Math.sin(seed * 9999 + 1) * 10000;
        return x - Math.floor(x);
    }

    function ymd(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        const initial = { appointments: seedAppointments() };
        save(initial);
        return initial;
    }

    function save(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    let state = load();

    return {
        services: SERVICES,
        pros: PROS,
        gallery: GALLERY,

        getServices: () => SERVICES,
        getService: (id) => SERVICES.find(s => s.id === id),
        getPros: () => PROS,
        getPro: (id) => PROS.find(p => p.id === id),
        getProsForService: (serviceId) => PROS.filter(p => p.services.includes(serviceId)),
        getGallery: () => GALLERY,

        getAppointments: () => state.appointments,
        getAppointment: (id) => state.appointments.find(a => a.id === id),
        getAppointmentsByDate: (dateStr) => state.appointments.filter(a => a.date === dateStr),
        getAppointmentsByPro: (proId) => state.appointments.filter(a => a.proId === proId),
        getBookedSlots: (proId, dateStr) => state.appointments
            .filter(a => a.proId === proId && a.date === dateStr && a.status !== 'cancelled')
            .map(a => a.time),

        addAppointment: (appt) => {
            const newAppt = {
                ...appt,
                id: 'a' + Date.now(),
                status: 'confirmed',
                createdAt: new Date().toISOString()
            };
            state.appointments.push(newAppt);
            save(state);
            return newAppt;
        },

        updateAppointmentStatus: (id, status) => {
            const a = state.appointments.find(x => x.id === id);
            if (a) { a.status = status; save(state); }
            return a;
        },

        deleteAppointment: (id) => {
            state.appointments = state.appointments.filter(a => a.id !== id);
            save(state);
        },

        resetData: () => {
            localStorage.removeItem(STORAGE_KEY);
            state = load();
        },

        ymd
    };
})();

// Helpers
const BRL = (n) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const BRL2 = (n) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DOW_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DOW_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function showToast(msg, type = '') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.classList.remove('show'), 3200);
}

function fmtDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function fmtDateLong(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return `${DOW_LONG[dt.getDay()]}, ${d} de ${MONTHS[m - 1]}`;
}
