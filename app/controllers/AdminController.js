/* =================================================================
   AdminController — CRUD das soluções prontas no painel admin
   Requer Auth (gestor) e usa Api.solutions para persistência.
   ================================================================= */
(function () {
  'use strict';

  var ICONS = ['calendar','dollar','chart','truck','package','users','book','bolt','grid'];
  var STATUSES = [
    { value: 'available',   label: 'Disponível' },
    { value: 'soon',        label: 'Em breve' },
    { value: 'unavailable', label: 'Indisponível' }
  ];

  var state = {
    solutions: [],
    filter: 'all',
    search: '',
    editingId: null
  };

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /* -------- Guard de auth -------- */
  function requireManager() {
    if (!window.Auth || !Auth.isManager()) {
      window.location.replace('login.html');
      return false;
    }
    return true;
  }

  /* -------- Render -------- */
  function renderUser() {
    var s = Auth.currentUser();
    if (!s) return;
    el('user-name').textContent  = s.name || s.user;
    el('user-email').textContent = s.user;
    var initials = (s.name || s.user).split(/[\s@.]/).filter(Boolean)
      .map(function (p) { return p[0]; }).slice(0,2).join('').toUpperCase();
    el('user-avatar').textContent = initials || 'HC';
  }

  function statusLabel(v) {
    var found = STATUSES.find(function (s) { return s.value === v; });
    return found ? found.label : 'Disponível';
  }

  function renderStats() {
    var total       = state.solutions.length;
    var available   = state.solutions.filter(function (s) { return s.status === 'available'; }).length;
    var soon        = state.solutions.filter(function (s) { return s.status === 'soon'; }).length;
    var unavailable = state.solutions.filter(function (s) { return s.status === 'unavailable'; }).length;
    el('stat-total').textContent       = total;
    el('stat-available').textContent   = available;
    el('stat-soon').textContent        = soon;
    el('stat-unavailable').textContent = unavailable;
  }

  function getFilteredList() {
    var q = state.search.trim().toLowerCase();
    return state.solutions.filter(function (s) {
      if (state.filter !== 'all' && s.status !== state.filter) return false;
      if (!q) return true;
      return (s.title || '').toLowerCase().indexOf(q) !== -1
          || (s.shortDescription || '').toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderTable() {
    var tbody = el('tbody');
    var list  = getFilteredList();

    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="5">' +
          '<div class="empty-state">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg>' +
            '<h3>Nenhuma solução encontrada</h3>' +
            '<p>Ajuste o filtro ou cadastre uma nova solução.</p>' +
          '</div>' +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (s) {
      var status = s.status || 'available';
      return '' +
        '<tr class="row-clickable" data-id="' + esc(s.id) + '">' +
          '<td>' +
            '<div class="cell-title">' +
              '<div class="thumb">' +
                (s.image ? '<img src="' + esc(s.image) + '" alt="">' : '') +
              '</div>' +
              '<div class="info">' +
                '<strong>' + esc(s.title) + '</strong>' +
                '<small>' + esc((s.shortDescription || '').slice(0, 70)) + (s.shortDescription && s.shortDescription.length > 70 ? '…' : '') + '</small>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td><span class="status-pill ' + esc(status) + '">' + esc(statusLabel(status)) + '</span></td>' +
          '<td>' + esc(s.price || 'Sob consulta') + '</td>' +
          '<td><small style="color: var(--text-soft);">' + esc((s.id || '').slice(0, 16)) + '</small></td>' +
          '<td>' +
            '<div class="row-actions">' +
              '<button class="icon-btn" data-action="edit" data-id="' + esc(s.id) + '" title="Editar" aria-label="Editar">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
              '</button>' +
              '<button class="icon-btn danger" data-action="delete" data-id="' + esc(s.id) + '" title="Remover" aria-label="Remover">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
              '</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
    }).join('');
  }

  /* -------- Modal de solução (criar/editar) -------- */
  function openModal(sol) {
    state.editingId = sol ? sol.id : null;
    el('modal-title').textContent = sol ? 'Editar solução' : 'Nova solução pronta';
    el('form-id').value          = sol ? sol.id : '';
    el('form-title').value       = sol ? (sol.title || '') : '';
    el('form-short').value       = sol ? (sol.shortDescription || '') : '';
    el('form-long').value        = sol ? (sol.longDescription  || '') : '';
    el('form-image').value       = sol ? (sol.image || '') : '';
    el('form-icon').value        = sol ? (sol.icon  || 'grid') : 'grid';
    el('form-price').value       = sol ? (sol.price || 'Sob consulta') : 'Sob consulta';
    el('form-status').value      = sol ? (sol.status || 'available') : 'available';
    el('form-features').value    = sol && sol.features ? sol.features.join(', ') : '';
    el('delete-from-modal').style.display = sol ? '' : 'none';
    el('modal-backdrop').classList.add('is-open');
  }
  function closeModal() {
    el('modal-backdrop').classList.remove('is-open');
    state.editingId = null;
  }

  function collectForm() {
    var features = el('form-features').value
      .split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    return {
      title: el('form-title').value.trim(),
      shortDescription: el('form-short').value.trim(),
      longDescription:  el('form-long').value.trim(),
      image: el('form-image').value.trim(),
      icon:  el('form-icon').value,
      price: el('form-price').value.trim() || 'Sob consulta',
      status: el('form-status').value,
      features: features
    };
  }

  function saveSolution(e) {
    e.preventDefault();
    var data = collectForm();
    if (!data.title) return toast('error', 'O título é obrigatório.');

    var op = state.editingId
      ? Api.solutions.update(state.editingId, data)
      : Api.solutions.create(data);

    op.then(function () {
      toast('success', state.editingId ? 'Solução atualizada.' : 'Solução criada com sucesso.');
      closeModal();
      reload();
    }).catch(function () {
      toast('error', 'Não foi possível salvar.');
    });
  }

  function deleteSolution(id) {
    if (!id) return;
    if (!confirm('Remover esta solução do catálogo? A ação não pode ser desfeita.')) return;
    Api.solutions.remove(id).then(function () {
      toast('success', 'Solução removida.');
      closeModal();
      reload();
    }).catch(function () {
      toast('error', 'Não foi possível remover.');
    });
  }

  /* -------- Toast -------- */
  var toastTimer = null;
  function toast(kind, message) {
    var t = el('toast');
    t.className = 'toast is-shown ' + kind;
    el('toast-text').textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-shown'); }, 2800);
  }

  /* -------- Eventos -------- */
  function bind() {
    el('btn-new').addEventListener('click', function () { openModal(null); });
    el('btn-logout').addEventListener('click', function (e) {
      e.preventDefault();
      Auth.logout().then(function () { window.location.href = 'home.html'; });
    });
    el('search').addEventListener('input', function (ev) {
      state.search = ev.target.value;
      renderTable();
    });
    document.querySelectorAll('.filter-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        state.filter = pill.dataset.filter;
        document.querySelectorAll('.filter-pill').forEach(function (p) {
          p.classList.toggle('active', p === pill);
        });
        renderTable();
      });
    });

    el('tbody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      var row = e.target.closest('.row-clickable');
      if (btn) {
        e.stopPropagation();
        var id = btn.dataset.id;
        var sol = state.solutions.find(function (s) { return s.id === id; });
        if (btn.dataset.action === 'edit')   openModal(sol);
        if (btn.dataset.action === 'delete') deleteSolution(id);
        return;
      }
      if (row) {
        var sol2 = state.solutions.find(function (s) { return s.id === row.dataset.id; });
        if (sol2) openModal(sol2);
      }
    });

    el('modal-form').addEventListener('submit', saveSolution);
    el('modal-close').addEventListener('click', closeModal);
    el('modal-cancel').addEventListener('click', closeModal);
    el('modal-backdrop').addEventListener('click', function (e) {
      if (e.target.id === 'modal-backdrop') closeModal();
    });
    el('delete-from-modal').addEventListener('click', function () {
      if (state.editingId) deleteSolution(state.editingId);
    });

    /* Popular select de ícones */
    el('form-icon').innerHTML = ICONS
      .map(function (i) { return '<option value="' + i + '">' + i + '</option>'; })
      .join('');
    el('form-status').innerHTML = STATUSES
      .map(function (s) { return '<option value="' + s.value + '">' + s.label + '</option>'; })
      .join('');
  }

  /* -------- Load -------- */
  function reload() {
    Api.solutions.list().then(function (list) {
      state.solutions = list || [];
      renderStats();
      renderTable();
    });
  }

  function init() {
    if (!requireManager()) return;
    renderUser();
    bind();
    reload();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
