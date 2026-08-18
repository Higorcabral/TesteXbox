/* =========================================================
   Rubra CRM — View: Sidebar (marca + navegação + usuário)
   ========================================================= */

(function (global) {
  'use strict';

  const { Icons } = global.CRM;

  function renderLink(item) {
    return `
      <a href="${item.href}" class="${item.active ? 'active' : ''}">
        ${Icons[item.icon] || ''}
        ${item.label}
        ${item.badge ? `<span class="badge">${item.badge}</span>` : ''}
      </a>`;
  }

  function renderGroup(label, items) {
    return `
      <div class="nav-group">
        <div class="nav-label">${label}</div>
        <nav class="nav">
          ${items.map(renderLink).join('')}
        </nav>
      </div>`;
  }

  const SidebarView = {
    render(root, data) {
      const { company, user, nav } = data;
      root.innerHTML = `
        <div class="brand">
          <div class="brand-mark">${company.name.charAt(0)}</div>
          <div class="brand-name">
            ${company.name}
            <small>${company.plan}</small>
          </div>
        </div>

        ${renderGroup('Principal',  nav.main)}
        ${renderGroup('Marketing',  nav.marketing)}
        ${renderGroup('Sistema',    nav.system)}

        <div class="sidebar-footer">
          <div class="user-card">
            <div class="avatar">${user.initials}</div>
            <div class="user-info">
              <div class="user-name">${user.name}</div>
              <div class="user-role">${user.role}</div>
            </div>
          </div>
        </div>
      `;
    }
  };

  global.CRM.SidebarView = SidebarView;
})(window);
