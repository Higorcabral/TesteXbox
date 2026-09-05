/* ==========================================================================
   Mock data, Motor Oficina
   Model layer (MVC). Uses localStorage as persistence for appointments.
   ========================================================================== */

const OFICINA = {
  nome: "Motor 47",
  slogan: "Oficina & Diagnóstico",
  telefone: "(11) 4004-4700",
  endereco: "Av. das Turbinas, 470, São Paulo",
  horario: "Seg a Sáb · 08:00 – 18:00",
};

const SERVICOS = [
  {
    id: 1,
    nome: "Troca de Óleo Premium",
    categoria: "Manutenção",
    descricao: "Óleo sintético, filtro novo e checklist de 15 pontos.",
    preco: 189,
    duracao: 45,
    img: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: 2,
    nome: "Alinhamento e Balanceamento",
    categoria: "Suspensão",
    descricao: "Alinhamento 3D e balanceamento eletrônico das 4 rodas.",
    preco: 220,
    duracao: 60,
    img: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: 3,
    nome: "Revisão Completa",
    categoria: "Manutenção",
    descricao: "Revisão dos 30 itens de segurança e desempenho do veículo.",
    preco: 550,
    duracao: 180,
    img: "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: 4,
    nome: "Freios (Pastilhas + Discos)",
    categoria: "Segurança",
    descricao: "Substituição completa do sistema de frenagem dianteiro.",
    preco: 890,
    duracao: 120,
    img: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: 5,
    nome: "Diagnóstico Eletrônico",
    categoria: "Eletrônica",
    descricao: "Scanner OBD-II com leitura de todos os módulos do carro.",
    preco: 150,
    duracao: 45,
    img: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: 6,
    nome: "Higienização do Ar-Condicionado",
    categoria: "Conforto",
    descricao: "Limpeza do evaporador, troca de filtro e recarga de gás.",
    preco: 320,
    duracao: 90,
    img: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: 7,
    nome: "Suspensão Completa",
    categoria: "Suspensão",
    descricao: "Amortecedores, batentes, coxins e kit de reparo.",
    preco: 1280,
    duracao: 180,
    img: "https://images.unsplash.com/photo-1607853554439-0069ec0f29b6?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: 8,
    nome: "Troca de Embreagem",
    categoria: "Transmissão",
    descricao: "Kit completo com disco, platô e rolamento.",
    preco: 1650,
    duracao: 300,
    img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: 9,
    nome: "Polimento & Cristalização",
    categoria: "Estética",
    descricao: "Correção da pintura em 3 etapas e proteção cerâmica.",
    preco: 690,
    duracao: 240,
    img: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=70",
  },
];

const HORARIOS = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

const CLIENTES = [
  "Rafael Nogueira", "Juliana Souza", "Marcos Vinícius", "Beatriz Antunes",
  "Diego Ferrari", "Camila Ribeiro", "André Luiz", "Fernanda Prado",
  "Lucas Martins", "Patrícia Andrade", "Gustavo Lima", "Renata Xavier",
];

const CARROS = [
  { modelo: "Honda Civic 2022", placa: "BRA-2E19" },
  { modelo: "Toyota Corolla 2021", placa: "FGH-5B03" },
  { modelo: "Jeep Compass 2023", placa: "MEC-7A28" },
  { modelo: "VW Golf GTI 2020", placa: "TRK-9C77" },
  { modelo: "Hyundai HB20 2022", placa: "PRA-4F52" },
  { modelo: "Chevrolet Onix 2023", placa: "LMN-1D08" },
  { modelo: "Ford Ranger 2021", placa: "OFC-3G15" },
  { modelo: "Fiat Toro 2024", placa: "SPZ-6H41" },
];

/* Generate a realistic-looking pool of appointments spread across
   past ~30 days + next ~14 days. Persisted in localStorage. */
const STATUSES = ["confirmed", "done", "pending", "canceled"];

function seedAgendamentos() {
  const stored = localStorage.getItem("motor47.agendamentos");
  if (stored) return JSON.parse(stored);

  const list = [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Past 30 days: mostly done, some canceled
  for (let d = 30; d >= 1; d--) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - d);
    const qtd = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < qtd; i++) {
      const svc = SERVICOS[Math.floor(Math.random() * SERVICOS.length)];
      list.push(makeAgendamento(dia, svc, weightedPast()));
    }
  }

  // Today: mix of pending / confirmed / done
  const qtdHoje = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < qtdHoje; i++) {
    const svc = SERVICOS[Math.floor(Math.random() * SERVICOS.length)];
    const status = ["done", "confirmed", "confirmed", "pending"][i % 4];
    list.push(makeAgendamento(hoje, svc, status));
  }

  // Next 14 days: pending / confirmed
  for (let d = 1; d <= 14; d++) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() + d);
    const qtd = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < qtd; i++) {
      const svc = SERVICOS[Math.floor(Math.random() * SERVICOS.length)];
      list.push(makeAgendamento(dia, svc, Math.random() > 0.4 ? "confirmed" : "pending"));
    }
  }

  localStorage.setItem("motor47.agendamentos", JSON.stringify(list));
  return list;
}

function weightedPast() {
  const r = Math.random();
  if (r < 0.82) return "done";
  if (r < 0.94) return "canceled";
  return "confirmed";
}

let _idCounter = 1000;
function makeAgendamento(data, servico, status) {
  const horario = HORARIOS[Math.floor(Math.random() * HORARIOS.length)];
  const cliente = CLIENTES[Math.floor(Math.random() * CLIENTES.length)];
  const carro = CARROS[Math.floor(Math.random() * CARROS.length)];
  return {
    id: ++_idCounter,
    cliente,
    telefone: gerarTelefone(),
    carro: carro.modelo,
    placa: carro.placa,
    servicoId: servico.id,
    servico: servico.nome,
    preco: servico.preco,
    duracao: servico.duracao,
    data: fmtDate(data),
    horario,
    status,
    criadoEm: new Date().toISOString(),
  };
}

function gerarTelefone() {
  const d = () => Math.floor(Math.random() * 10);
  return `(11) 9${d()}${d()}${d()}${d()}-${d()}${d()}${d()}${d()}`;
}

function fmtDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function saveAgendamentos(list) {
  localStorage.setItem("motor47.agendamentos", JSON.stringify(list));
}

function addAgendamento(a) {
  const list = seedAgendamentos();
  a.id = Date.now();
  a.criadoEm = new Date().toISOString();
  a.status = a.status || "pending";
  list.push(a);
  saveAgendamentos(list);
  return a;
}

function getAgendamentos() {
  return seedAgendamentos();
}

function resetAgendamentos() {
  localStorage.removeItem("motor47.agendamentos");
}

/* Currency & date formatters */
const brl = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

const dtBR = (isoDate) => {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
};

const dtLongBR = (isoDate) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};
