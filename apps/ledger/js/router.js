/* ============================================================
   router.js — navegação entre páginas
   ============================================================ */

import { renderDashboard, bindDashboard } from './pages/dashboard.js';
import { renderInvoices, bindInvoices } from './pages/invoices.js';
import { renderInstallments, bindInstallments } from './pages/installments.js';
import { renderSubscriptions, bindSubscriptions } from './pages/subscriptions.js';
import { renderCategoriesPage, bindCategoriesPage } from './pages/categories.js';
import { renderAccounts, bindAccounts } from './pages/accounts.js';
import { renderGoals, bindGoals } from './pages/goals.js';
import { renderForecast, bindForecast } from './pages/forecast.js';
import { renderSettings, bindSettings } from './pages/settings.js';
import { state, expandInstallments } from './state.js';

export let currentPage = 'dashboard';

const PAGES = {
  dashboard:     { render: renderDashboard,      bind: bindDashboard      },
  invoices:      { render: renderInvoices,       bind: bindInvoices       },
  installments:  { render: renderInstallments,   bind: bindInstallments   },
  subscriptions: { render: renderSubscriptions,  bind: bindSubscriptions  },
  categories:    { render: renderCategoriesPage, bind: bindCategoriesPage },
  accounts:      { render: renderAccounts,       bind: bindAccounts       },
  goals:         { render: renderGoals,          bind: bindGoals          },
  forecast:      { render: renderForecast,       bind: bindForecast       },
  settings:      { render: renderSettings,       bind: bindSettings       }
};

export function navigate(page) {
  if (!PAGES[page]) { console.warn('Página desconhecida:', page); return; }
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });
  renderPage();
  // fechar sidebar no mobile
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');
}

export function renderPage() {
  const container = document.getElementById('pageContainer');
  container.className = 'page-content';
  const pageModule = PAGES[currentPage];
  if (!pageModule) return;

  try {
    container.innerHTML = pageModule.render();
    pageModule.bind();
  } catch (err) {
    console.error('Erro ao renderizar página:', err);
    container.innerHTML = `
      <div class="placeholder" style="border-color: var(--sys-red);">
        <div class="placeholder-icon">⚠</div>
        <div class="placeholder-title">Erro ao renderizar esta página</div>
        <div class="placeholder-desc">${err.message}<br><br>Abra o console (F12) para mais detalhes.</div>
      </div>`;
  }

  updateNavBadges();
}

export function updateNavBadges() {
  const el = (id, value) => {
    const b = document.getElementById(id);
    if (b) b.textContent = value;
  };
  el('instBadge', state.installmentGroups.length);
  el('subBadge', state.subscriptions.filter(s => s.active).length);
  el('goalBadge', state.goals.length);
  el('accountBadge', state.accounts.length);
}
