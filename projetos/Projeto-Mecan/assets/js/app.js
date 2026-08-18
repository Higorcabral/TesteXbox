/* ==========================================================================
   Client-facing controller — Motor 47
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderServicos();
  renderContato();
});

function renderServicos() {
  const grid = document.getElementById("services-grid");
  if (!grid) return;

  grid.innerHTML = SERVICOS.map(
    (s) => `
    <article class="service">
      <div class="service__img">
        <img src="${s.img}" alt="${s.nome}" loading="lazy">
        <span class="service__cat">${s.categoria}</span>
      </div>
      <div class="service__body">
        <h3>${s.nome}</h3>
        <p>${s.descricao}</p>
        <div class="service__meta">
          <div>
            <div class="service__price">${brl(s.preco)}</div>
            <div class="service__duration">⏱ ${s.duracao} min</div>
          </div>
          <a href="agendamento.html?servico=${s.id}" class="btn btn--ghost btn--sm">Agendar</a>
        </div>
      </div>
    </article>
  `
  ).join("");
}

function renderContato() {
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  setText("footer-endereco", OFICINA.endereco);
  setText("footer-horario", OFICINA.horario);
  setText("footer-tel", OFICINA.telefone);
}
