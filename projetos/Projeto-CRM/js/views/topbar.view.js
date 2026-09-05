/* =========================================================
   Rubra CRM, View: Topbar (busca, ações, toggle de tema)
   ========================================================= */

(function (global) {
  'use strict';

  const { Icons } = global.CRM;

  const TopbarView = {
    render(root) {
      root.innerHTML = `
        <div class="search">
          ${Icons.search}
          <input type="text" placeholder="Buscar contatos, empresas, negócios..." aria-label="Buscar" />
          <kbd>⌘ K</kbd>
        </div>
        <div class="topbar-actions">
          <button class="icon-btn" id="themeToggle" title="Alternar tema" aria-label="Alternar tema">
            <span id="iconMoon">${Icons.moon}</span>
            <span id="iconSun" style="display:none">${Icons.sun}</span>
          </button>
          <button class="icon-btn" title="Notificações" aria-label="Notificações">
            ${Icons.bell}
            <span class="dot"></span>
          </button>
          <button class="icon-btn" title="Configurações" aria-label="Configurações">
            ${Icons.gear}
          </button>
          <button class="btn btn-primary" style="margin-left:8px">
            ${Icons.plusBold}
            Novo negócio
          </button>
        </div>
      `;
    }
  };

  global.CRM.TopbarView = TopbarView;
})(window);
