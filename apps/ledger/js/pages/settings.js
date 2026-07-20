/* ============================================================
   pages/settings.js — configurações, export/import/reset
   ============================================================ */

import { state, resetToDemo, resetToEmpty, replaceState } from '../state.js';
import { exportToJSON, importFromJSON } from '../storage.js';
import { downloadTemplate, exportToExcel, importFromExcel } from '../excel.js';
import { renderPage } from '../router.js';

export function renderSettings() {
  const dataSize = new Blob([JSON.stringify(state)]).size;
  const dataSizeKb = (dataSize / 1024).toFixed(1);

  return `
    <div class="page-header">
      <div>
        <div class="page-title">Configurações</div>
        <div class="page-sub">Backup, importação e reset dos dados</div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Backup completo (JSON)</div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Exportar backup</div>
          <div class="settings-description">Baixa um JSON com TODOS os dados (gastos, contas, categorias, metas, recargas) — ${dataSizeKb} KB</div>
        </div>
        <div class="settings-action">
          <button class="btn-settings" id="exportBtn">Exportar JSON</button>
        </div>
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Importar backup</div>
          <div class="settings-description">Substitui TODOS os dados atuais pelo conteúdo do JSON</div>
        </div>
        <div class="settings-action">
          <button class="btn-settings" id="importBtn">Importar JSON</button>
          <input type="file" id="importFile" accept="application/json" style="display: none;">
        </div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Planilha Excel (.xlsx)</div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Baixar modelo em branco</div>
          <div class="settings-description">Modelo com 3 abas (Gastos, Parcelamentos, Assinaturas) e instruções pra preencher manualmente</div>
        </div>
        <div class="settings-action">
          <button class="btn-settings" id="excelTemplateBtn">Baixar modelo</button>
        </div>
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Exportar dados atuais</div>
          <div class="settings-description">Exporta seus lançamentos atuais em planilha — útil pra ver tudo no Excel</div>
        </div>
        <div class="settings-action">
          <button class="btn-settings" id="excelExportBtn">Exportar Excel</button>
        </div>
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Importar planilha</div>
          <div class="settings-description">Adiciona lançamentos da planilha aos seus dados atuais (não substitui)</div>
        </div>
        <div class="settings-action">
          <button class="btn-settings" id="excelImportBtn">Importar Excel</button>
          <input type="file" id="excelImportFile" accept=".xlsx,.xls" style="display: none;">
        </div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Reset</div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Carregar dados de exemplo</div>
          <div class="settings-description">Substitui tudo por um conjunto de dados de demonstração</div>
        </div>
        <div class="settings-action">
          <button class="btn-settings" id="resetDemoBtn">Carregar demo</button>
        </div>
      </div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Apagar todos os dados</div>
          <div class="settings-description">Remove tudo e começa do zero. Esta ação não pode ser desfeita.</div>
        </div>
        <div class="settings-action">
          <button class="btn-settings danger" id="resetEmptyBtn">Apagar tudo</button>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Estatísticas</div>

      <div class="settings-row">
        <div>
          <div class="settings-label">Seus números</div>
          <div class="settings-description">
            ${state.accounts.length} ${state.accounts.length === 1 ? 'conta' : 'contas'} ·
            ${state.singleTransactions.length} ${state.singleTransactions.length === 1 ? 'transação' : 'transações'} ·
            ${state.installmentGroups.length} ${state.installmentGroups.length === 1 ? 'parcelamento' : 'parcelamentos'} ·
            ${state.subscriptions.length} ${state.subscriptions.length === 1 ? 'assinatura' : 'assinaturas'} ·
            ${state.categories.length} categorias ·
            ${state.goals.length} ${state.goals.length === 1 ? 'meta' : 'metas'}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Atalhos de teclado</div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Cmd/Ctrl + K</div>
          <div class="settings-description">Busca global de lançamentos</div>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">N</div>
          <div class="settings-description">Novo lançamento</div>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">1 ... 9</div>
          <div class="settings-description">Navegar entre páginas</div>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Esc</div>
          <div class="settings-description">Fechar modais e menus</div>
        </div>
      </div>
    </div>

    <div style="margin-top: 16px; padding: 14px 18px; background: var(--bg-card); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 0.5px solid var(--hairline); border-radius: var(--r-md); font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
      <strong style="color: var(--text); font-weight: 600;">Onde seus dados ficam:</strong> tudo é salvo no <code style="background: var(--bg-input); padding: 1px 6px; border-radius: 4px;">localStorage</code> do seu navegador. Nada é enviado pra internet. Por isso, faça backups (exportar JSON) periodicamente — se você limpar o cache ou trocar de navegador, os dados são perdidos.
    </div>
  `;
}

export function bindSettings() {
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    exportToJSON(state);
  });

  document.getElementById('importBtn')?.addEventListener('click', () => {
    document.getElementById('importFile').click();
  });

  document.getElementById('importFile')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm(`Importar "${file.name}"? Todos os dados atuais serão substituídos.`)) return;
    try {
      const data = await importFromJSON(file);
      replaceState(data);
      renderPage();
      alert('Dados importados com sucesso!');
    } catch (err) {
      alert('Erro ao importar: ' + err.message);
    }
    e.target.value = '';
  });

  document.getElementById('resetDemoBtn')?.addEventListener('click', () => {
    if (confirm('Substituir todos os dados atuais pelos dados de exemplo? Faça um backup antes se não quiser perder.')) {
      resetToDemo();
      renderPage();
    }
  });

  document.getElementById('resetEmptyBtn')?.addEventListener('click', () => {
    if (confirm('Apagar TODOS os dados? Esta ação não pode ser desfeita. Recomendo exportar um backup antes.')) {
      if (confirm('Tem certeza mesmo? Última confirmação.')) {
        resetToEmpty();
        renderPage();
      }
    }
  });

  // ====== EXCEL ======

  document.getElementById('excelTemplateBtn')?.addEventListener('click', () => {
    downloadTemplate();
  });

  document.getElementById('excelExportBtn')?.addEventListener('click', () => {
    exportToExcel();
  });

  document.getElementById('excelImportBtn')?.addEventListener('click', () => {
    document.getElementById('excelImportFile').click();
  });

  document.getElementById('excelImportFile')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm(`Importar "${file.name}"?\n\nOs lançamentos serão ADICIONADOS aos existentes (não substituem nada).`)) {
      e.target.value = '';
      return;
    }
    try {
      const result = await importFromExcel(file);
      const lines = [];
      lines.push(`✓ Importação concluída`);
      lines.push('');
      lines.push(`Gastos: ${result.gastos.ok} importados${result.gastos.errors.length ? `, ${result.gastos.errors.length} com erro` : ''}`);
      lines.push(`Parcelamentos: ${result.parcelamentos.ok} importados${result.parcelamentos.errors.length ? `, ${result.parcelamentos.errors.length} com erro` : ''}`);
      lines.push(`Assinaturas: ${result.assinaturas.ok} importadas${result.assinaturas.errors.length ? `, ${result.assinaturas.errors.length} com erro` : ''}`);
      if (result.createdCategories.length > 0) {
        lines.push('');
        lines.push(`Categorias criadas automaticamente: ${result.createdCategories.join(', ')}`);
      }
      const allErrors = [...result.gastos.errors, ...result.parcelamentos.errors, ...result.assinaturas.errors];
      if (allErrors.length > 0) {
        lines.push('');
        lines.push('Erros:');
        allErrors.slice(0, 10).forEach(err => lines.push('• ' + err));
        if (allErrors.length > 10) lines.push(`... e mais ${allErrors.length - 10}`);
      }
      alert(lines.join('\n'));
      renderPage();
    } catch (err) {
      alert('Erro ao importar: ' + err.message);
    }
    e.target.value = '';
  });
}
