function renderSidebar(active) {
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">S</div>
        <div>
          <div class="brand-name">Stoqly</div>
          <div class="brand-tag">SMART · INVENTORY</div>
        </div>
      </div>

      <div class="nav-section">
        <div class="nav-label">Operação</div>
        <a href="index.html" class="nav-item ${active==='dashboard'?'active':''}">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
          Dashboard
        </a>
        <a href="cadastro.html" class="nav-item ${active==='cadastro'?'active':''}">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>
          Cadastro
        </a>
        <a href="estoque.html" class="nav-item ${active==='estoque'?'active':''}">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          Estoque
        </a>
        <a href="movimentacoes.html" class="nav-item ${active==='movimentacoes'?'active':''}">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 17l-4-4 4-4M3 13h18M17 7l4 4-4 4"/></svg>
          Movimentações
        </a>
        <a href="envios.html" class="nav-item ${active==='envios'?'active':''}">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>
          Envios
        </a>
      </div>

      <div class="nav-section">
        <div class="nav-label">Sistema</div>
        <a class="nav-item"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.01a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.01a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>Configurações</a>
        <a class="nav-item"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>Suporte</a>
      </div>
    </aside>
  `;
}
