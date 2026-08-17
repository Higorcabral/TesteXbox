/* ==========================================================================
   Agendamento controller — Motor 47
   ========================================================================== */

const state = {
  servicoId: null,
  data: null,
  horario: null,
};

document.addEventListener("DOMContentLoaded", () => {
  hydrateServicos();
  preselectFromQuery();
  setupDateInput();
  bindEvents();
  updateSummary();
});

function hydrateServicos() {
  const sel = document.getElementById("servico");
  sel.innerHTML =
    `<option value="">Selecione um serviço</option>` +
    SERVICOS.map(
      (s) => `<option value="${s.id}">${s.nome} — ${brl(s.preco)}</option>`
    ).join("");
}

function preselectFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("servico");
  if (id) {
    document.getElementById("servico").value = id;
    state.servicoId = Number(id);
  }
}

function setupDateInput() {
  const input = document.getElementById("data");
  const today = new Date();
  today.setDate(today.getDate() + 1); // amanhã como mínimo
  const max = new Date();
  max.setDate(max.getDate() + 30);
  input.min = ymd(today);
  input.max = ymd(max);
}

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function bindEvents() {
  document.getElementById("servico").addEventListener("change", (e) => {
    state.servicoId = Number(e.target.value) || null;
    updateSummary();
  });

  document.getElementById("data").addEventListener("change", (e) => {
    state.data = e.target.value || null;
    state.horario = null;
    renderSlots();
    updateSummary();
  });

  document.getElementById("telefone").addEventListener("input", (e) => {
    e.target.value = maskPhone(e.target.value);
  });

  document.getElementById("placa").addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  document.getElementById("booking-form").addEventListener("submit", onSubmit);
}

function maskPhone(v) {
  v = v.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 2) return v;
  if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}

function renderSlots() {
  const slotsEl = document.getElementById("slots");
  const hint = document.getElementById("slots-hint");

  if (!state.data) {
    slotsEl.innerHTML = "";
    hint.textContent = "Selecione uma data";
    return;
  }

  const taken = getTakenSlots(state.data);
  hint.textContent = `${HORARIOS.length - taken.length} horários livres`;

  slotsEl.innerHTML = HORARIOS.map((h) => {
    const isTaken = taken.includes(h);
    const isSelected = state.horario === h;
    const classes = ["slot"];
    if (isTaken) classes.push("is-taken");
    if (isSelected) classes.push("is-selected");
    return `<button type="button" class="${classes.join(" ")}" data-hora="${h}" ${isTaken ? "disabled" : ""}>${h}</button>`;
  }).join("");

  slotsEl.querySelectorAll(".slot:not(.is-taken)").forEach((el) => {
    el.addEventListener("click", () => {
      state.horario = el.dataset.hora;
      renderSlots();
      updateSummary();
    });
  });
}

function getTakenSlots(dateISO) {
  const list = getAgendamentos();
  return list
    .filter((a) => a.data === dateISO && a.status !== "canceled")
    .map((a) => a.horario);
}

function updateSummary() {
  const svc = SERVICOS.find((s) => s.id === state.servicoId);
  document.getElementById("s-servico").textContent = svc ? svc.nome : "—";
  document.getElementById("s-duracao").textContent = svc ? `${svc.duracao} min` : "—";
  document.getElementById("s-data").textContent = state.data ? dtBR(state.data) : "—";
  document.getElementById("s-horario").textContent = state.horario || "—";
  document.getElementById("s-total").textContent = svc ? brl(svc.preco) : brl(0);
}

function onSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const svc = SERVICOS.find((s) => s.id === state.servicoId);

  if (!svc) return toast("Selecione um serviço.", "err");
  if (!state.data) return toast("Escolha uma data.", "err");
  if (!state.horario) return toast("Escolha um horário disponível.", "err");

  const ag = {
    cliente: form.nome.value.trim(),
    telefone: form.telefone.value.trim(),
    carro: form.carro.value.trim(),
    placa: form.placa.value.trim(),
    servicoId: svc.id,
    servico: svc.nome,
    preco: svc.preco,
    duracao: svc.duracao,
    data: state.data,
    horario: state.horario,
    observacoes: form.obs.value.trim(),
    status: "confirmed",
  };

  addAgendamento(ag);
  toast(`✓ Agendado para ${dtBR(ag.data)} às ${ag.horario}. Enviamos confirmação por WhatsApp.`);

  setTimeout(() => {
    form.reset();
    state.servicoId = null;
    state.data = null;
    state.horario = null;
    renderSlots();
    updateSummary();
    document.getElementById("slots-hint").textContent = "Selecione uma data";
  }, 800);
}

function toast(msg, kind = "success") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("toast--success");
  if (kind === "success") el.classList.add("toast--success");
  el.classList.add("is-visible");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("is-visible"), 3800);
}
