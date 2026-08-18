/* ==========================================================================
   Admin dashboard controller — Motor 47
   ========================================================================== */

// Auth guard
(function () {
  const auth = sessionStorage.getItem("motor47.auth");
  if (!auth) {
    window.location.href = "login.html";
  }
})();

const STATUS_LABEL = {
  pending: "Pendente",
  confirmed: "Confirmado",
  done: "Concluído",
  canceled: "Cancelado",
};

const CATEGORY_COLORS = {
  Manutenção: "#ff6b1a",
  Suspensão: "#ffa552",
  Segurança: "#ef4444",
  Eletrônica: "#3b82f6",
  Conforto: "#22c55e",
  Transmissão: "#a855f7",
  Estética: "#eab308",
};

document.addEventListener("DOMContentLoaded", () => {
  renderDashDate();
  renderKPIs();
  renderChart(7);
  renderMix();
  renderProximos();
  renderAgendamentos();
  renderServicosTable();
  bindNav();
  bindFilters();
  bindLogout();

  document.getElementById("chart-range").addEventListener("change", (e) => {
    renderChart(Number(e.target.value));
  });
});

/* ---------- View switching ---------- */
function bindNav() {
  const links = document.querySelectorAll("[data-view]");
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const view = link.dataset.view;
      if (!view) return;
      e.preventDefault();
      switchView(view);
    });
  });

  // Hash-based navigation
  if (window.location.hash) {
    const v = window.location.hash.replace("#", "");
    if (["dashboard", "agendamentos", "servicos"].includes(v)) switchView(v);
  }
}

function switchView(view) {
  ["dashboard", "agendamentos", "servicos"].forEach((v) => {
    document.getElementById(`view-${v}`).classList.toggle("hide", v !== view);
  });
  document.querySelectorAll(".sidebar__nav a[data-view]").forEach((a) => {
    a.classList.toggle("is-active", a.dataset.view === view);
  });
  window.history.replaceState(null, "", `#${view}`);
}

function bindLogout() {
  document.getElementById("logout-btn").addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.removeItem("motor47.auth");
    window.location.href = "login.html";
  });
}

/* ---------- Dashboard header ---------- */
function renderDashDate() {
  const today = new Date();
  const fmt = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  document.getElementById("dash-date").textContent =
    fmt.charAt(0).toUpperCase() + fmt.slice(1);
}

/* ---------- KPIs ---------- */
function renderKPIs() {
  const list = getAgendamentos();
  const todayISO = todayIso();

  const doneOnly = (a) => a.status === "done";
  const inRange = (a, from) => a.data >= from && a.data <= todayISO;

  const receitaHoje = list
    .filter((a) => a.data === todayISO && doneOnly(a))
    .reduce((s, a) => s + a.preco, 0);

  const from7 = daysAgo(6);
  const receitaSemana = list
    .filter((a) => inRange(a, from7) && doneOnly(a))
    .reduce((s, a) => s + a.preco, 0);

  const from30 = daysAgo(29);
  const receitaMes = list
    .filter((a) => inRange(a, from30) && doneOnly(a))
    .reduce((s, a) => s + a.preco, 0);

  const agendaHoje = list.filter(
    (a) => a.data === todayISO && a.status !== "canceled"
  ).length;

  const doneMes = list.filter((a) => inRange(a, from30) && doneOnly(a)).length;

  const ticketMedio = doneMes > 0 ? receitaMes / doneMes : 0;

  const pendentes = list.filter((a) => a.status === "pending").length;

  const kpis = [
    {
      label: "Faturamento hoje",
      icon: "$",
      value: brl(receitaHoje),
      delta: `${agendaHoje} agenda hoje`,
      pos: true,
    },
    {
      label: "Faturamento na semana",
      icon: "◷",
      value: brl(receitaSemana),
      delta: "+12,4% vs. sem. anterior",
      pos: true,
    },
    {
      label: "Faturamento no mês",
      icon: "▤",
      value: brl(receitaMes),
      delta: `Ticket médio ${brl(ticketMedio)}`,
      pos: true,
    },
    {
      label: "Aprovações pendentes",
      icon: "!",
      value: pendentes,
      delta: pendentes > 0 ? "Requer ação" : "Tudo em dia",
      pos: pendentes === 0,
    },
  ];

  document.getElementById("kpis").innerHTML = kpis
    .map(
      (k) => `
    <div class="kpi">
      <div class="kpi__label">
        <span class="kpi__icon">${k.icon}</span> ${k.label}
      </div>
      <div class="kpi__value">${k.value}</div>
      <div class="kpi__delta${k.pos ? "" : " is-neg"}">
        ${k.pos ? "▲" : "●"} ${k.delta}
      </div>
    </div>
  `
    )
    .join("");
}

/* ---------- Chart (7/14/30 days) ---------- */
function renderChart(days) {
  const list = getAgendamentos().filter((a) => a.status === "done");
  const buckets = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = fmtDate(d);
    const total = list
      .filter((a) => a.data === iso)
      .reduce((s, a) => s + a.preco, 0);
    buckets.push({
      iso,
      total,
      label:
        days <= 7
          ? d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")
          : String(d.getDate()).padStart(2, "0"),
    });
  }

  const max = Math.max(...buckets.map((b) => b.total), 1);
  const chart = document.getElementById("chart");
  chart.innerHTML = buckets
    .map(
      (b) => `
    <div class="bar"
         style="height:${(b.total / max) * 100}%;"
         data-label="${b.label}"
         data-value="${brl(b.total)}"
         title="${dtBR(b.iso)}: ${brl(b.total)}"></div>
  `
    )
    .join("");
}

/* ---------- Service mix ---------- */
function renderMix() {
  const list = getAgendamentos();
  const from = daysAgo(29);
  const filtered = list.filter(
    (a) => a.data >= from && a.status === "done"
  );

  const byCat = {};
  filtered.forEach((a) => {
    const svc = SERVICOS.find((s) => s.id === a.servicoId);
    if (!svc) return;
    byCat[svc.categoria] = (byCat[svc.categoria] || 0) + a.preco;
  });

  const total = Object.values(byCat).reduce((s, v) => s + v, 0) || 1;
  const items = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  document.getElementById("mix").innerHTML = items
    .map(([cat, val]) => {
      const pct = (val / total) * 100;
      const color = CATEGORY_COLORS[cat] || "#71717a";
      return `
      <div>
        <div class="mix-item">
          <span class="mix-dot" style="background:${color}"></span>
          <span class="mix-item__label">${cat}</span>
          <span class="mix-item__value">${brl(val)}</span>
        </div>
        <div class="mix-bar"><div class="mix-bar__fill" style="width:${pct}%;background:${color}"></div></div>
      </div>
    `;
    })
    .join("");
}

/* ---------- Próximos agendamentos ---------- */
function renderProximos() {
  const list = getAgendamentos();
  const today = todayIso();
  const upcoming = list
    .filter((a) => a.data >= today && a.status !== "canceled" && a.status !== "done")
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario))
    .slice(0, 6);

  const tbody = document.getElementById("proximos");
  if (upcoming.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-mute);padding:32px;">Nenhum agendamento próximo</td></tr>`;
    return;
  }

  tbody.innerHTML = upcoming.map(rowHTML).join("");
}

/* ---------- Full agendamentos list ---------- */
let currentFilters = { status: "", search: "" };

function bindFilters() {
  document.getElementById("filter-status").addEventListener("change", (e) => {
    currentFilters.status = e.target.value;
    renderAgendamentos();
  });
  document.getElementById("filter-search").addEventListener("input", (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    renderAgendamentos();
  });
}

function renderAgendamentos() {
  let list = getAgendamentos();

  if (currentFilters.status) {
    list = list.filter((a) => a.status === currentFilters.status);
  }
  if (currentFilters.search) {
    const q = currentFilters.search;
    list = list.filter(
      (a) =>
        a.cliente.toLowerCase().includes(q) ||
        a.placa.toLowerCase().includes(q) ||
        a.carro.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => (b.data + b.horario).localeCompare(a.data + a.horario));

  const tbody = document.getElementById("ag-tbody");
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-mute);padding:32px;">Nenhum agendamento encontrado</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(rowHTMLFull).join("");
  bindRowActions();
}

function rowHTML(a) {
  return `
    <tr>
      <td>${dtBR(a.data)}</td>
      <td><strong>${a.horario}</strong></td>
      <td>${a.cliente}</td>
      <td>${a.carro} <span class="text-mute">· ${a.placa}</span></td>
      <td>${a.servico}</td>
      <td><strong>${brl(a.preco)}</strong></td>
      <td><span class="badge badge--${a.status}">${STATUS_LABEL[a.status]}</span></td>
    </tr>
  `;
}

function rowHTMLFull(a) {
  return `
    <tr data-id="${a.id}">
      <td>${dtBR(a.data)}</td>
      <td><strong>${a.horario}</strong></td>
      <td>${a.cliente}</td>
      <td class="text-dim">${a.telefone}</td>
      <td>${a.carro} <span class="text-mute">· ${a.placa}</span></td>
      <td>${a.servico}</td>
      <td><strong>${brl(a.preco)}</strong></td>
      <td><span class="badge badge--${a.status}">${STATUS_LABEL[a.status]}</span></td>
      <td>${actionsHTML(a)}</td>
    </tr>
  `;
}

function actionsHTML(a) {
  if (a.status === "pending") {
    return `
      <button class="btn btn--ghost btn--sm" data-act="confirm">Confirmar</button>
      <button class="btn btn--ghost btn--sm" data-act="cancel">✕</button>
    `;
  }
  if (a.status === "confirmed") {
    return `
      <button class="btn btn--ghost btn--sm" data-act="done">Concluir</button>
      <button class="btn btn--ghost btn--sm" data-act="cancel">✕</button>
    `;
  }
  return `<span class="text-mute" style="font-size:12px;">—</span>`;
}

function bindRowActions() {
  document.querySelectorAll("#ag-tbody [data-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tr = btn.closest("tr");
      const id = Number(tr.dataset.id);
      const act = btn.dataset.act;
      const list = getAgendamentos();
      const item = list.find((x) => x.id === id);
      if (!item) return;

      if (act === "confirm") item.status = "confirmed";
      else if (act === "done") item.status = "done";
      else if (act === "cancel") item.status = "canceled";

      saveAgendamentos(list);
      renderAgendamentos();
      renderKPIs();
      renderChart(Number(document.getElementById("chart-range").value));
      renderMix();
      renderProximos();
      toast(`Status atualizado para "${STATUS_LABEL[item.status]}"`);
    });
  });
}

/* ---------- Services catalog ---------- */
function renderServicosTable() {
  const list = getAgendamentos();
  const from = daysAgo(29);
  const monthDone = list.filter((a) => a.data >= from && a.status === "done");

  const tbody = document.getElementById("svc-tbody");
  tbody.innerHTML = SERVICOS.map((s) => {
    const execs = monthDone.filter((a) => a.servicoId === s.id);
    const receita = execs.reduce((sum, a) => sum + a.preco, 0);
    const color = CATEGORY_COLORS[s.categoria] || "#71717a";
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${s.img}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:8px;">
            <div>
              <div style="font-weight:600;">${s.nome}</div>
              <div class="text-mute" style="font-size:12px;">${s.descricao}</div>
            </div>
          </div>
        </td>
        <td><span class="badge" style="background:${color}22;color:${color};">${s.categoria}</span></td>
        <td>${s.duracao} min</td>
        <td><strong>${brl(s.preco)}</strong></td>
        <td>${execs.length}</td>
        <td><strong>${brl(receita)}</strong></td>
      </tr>
    `;
  }).join("");
}

/* ---------- Helpers ---------- */
function todayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return fmtDate(d);
}

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return fmtDate(d);
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("toast--success", "is-visible");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("is-visible"), 2600);
}
