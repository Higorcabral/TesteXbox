/* ============================================================
   search.js — busca global (Cmd+K)
   ============================================================ */

import { state, allTransactions, getAccount, getCategory } from './state.js';
import { shortDate, money } from './helpers.js';

let selectedIndex = 0;
let currentResults = [];

export function initSearch() {
  const input = document.getElementById('searchInput');
  const backdrop = document.getElementById('searchBackdrop');
  if (!input || !backdrop) return;

  input.addEventListener('input', performSearch);
  input.addEventListener('keydown', handleSearchKey);

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeSearch();
  });
}

export function openSearch() {
  const backdrop = document.getElementById('searchBackdrop');
  const input = document.getElementById('searchInput');
  if (!backdrop || !input) return;
  backdrop.classList.add('active');
  input.value = '';
  selectedIndex = 0;
  currentResults = [];
  renderResults('');
  setTimeout(() => input.focus(), 50);
}

export function closeSearch() {
  const backdrop = document.getElementById('searchBackdrop');
  if (backdrop) backdrop.classList.remove('active');
}

function performSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  renderResults(query);
}

function renderResults(query) {
  const container = document.getElementById('searchResults');
  if (!container) return;

  if (!query) {
    container.innerHTML = '<div class="search-empty">Digite pra buscar lançamentos</div>';
    currentResults = [];
    return;
  }

  const all = allTransactions();
  const q = query;
  const results = all.filter(t => {
    const cat = getCategory(t.categoryId);
    const acc = getAccount(t.accountId);
    return (
      t.desc.toLowerCase().includes(q) ||
      (cat && cat.name.toLowerCase().includes(q)) ||
      (acc && acc.name.toLowerCase().includes(q)) ||
      t.amount.toFixed(2).includes(q)
    );
  })
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 20);

  currentResults = results;
  selectedIndex = 0;

  if (results.length === 0) {
    container.innerHTML = '<div class="search-empty">Nada encontrado</div>';
    return;
  }

  container.innerHTML = results.map((t, i) => {
    const cat = getCategory(t.categoryId);
    const acc = getAccount(t.accountId);
    return `
      <div class="search-result ${i === 0 ? 'selected' : ''}" data-idx="${i}">
        <div class="search-result-main">
          <div>${t.desc}</div>
          <div class="search-meta">${shortDate(t.date)} · ${cat?.name || '—'} · ${acc?.name || '—'}</div>
        </div>
        <div style="font-weight: 600; font-variant-numeric: tabular-nums;">R$ ${money(t.amount)}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.search-result').forEach(el => {
    el.addEventListener('click', () => {
      // Não há ação adicional por enquanto — apenas fecha o modal
      closeSearch();
    });
  });
}

function handleSearchKey(e) {
  if (e.key === 'Escape') { closeSearch(); return; }
  if (currentResults.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
    updateSelection();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex = Math.max(selectedIndex - 1, 0);
    updateSelection();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    closeSearch();
  }
}

function updateSelection() {
  document.querySelectorAll('.search-result').forEach((el, i) => {
    el.classList.toggle('selected', i === selectedIndex);
  });
  const selected = document.querySelector('.search-result.selected');
  if (selected) selected.scrollIntoView({ block: 'nearest' });
}
