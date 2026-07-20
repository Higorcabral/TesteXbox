/* ============================================================
   excel.js — export/import via Excel (XLSX)
   ============================================================ */

import { state, addTransaction, addInstallmentGroup, addSubscription, addCategory } from './state.js';
import { generateId } from './helpers.js';

// ============ DOWNLOAD MODELO VAZIO ============

/**
 * Baixa um modelo Excel vazio com instruções e abas pré-formatadas.
 * Inclui uma aba "Categorias" e "Contas" com os IDs disponíveis pra referência.
 */
export function downloadTemplate() {
  if (typeof XLSX === 'undefined') {
    alert('Biblioteca Excel não carregou. Verifique sua conexão e recarregue a página.');
    return;
  }

  const wb = XLSX.utils.book_new();

  // ====== ABA INSTRUÇÕES ======
  const instructions = [
    ['LEDGER — MODELO DE IMPORTAÇÃO'],
    [''],
    ['Como usar este modelo:'],
    [''],
    ['1. Preencha as abas "Gastos", "Parcelamentos" e/ou "Assinaturas" com seus dados.'],
    ['2. Você não precisa preencher todas — pode importar só uma aba se quiser.'],
    ['3. Salve o arquivo e importe em Configurações → Importar Excel.'],
    [''],
    ['Regras importantes:'],
    [''],
    ['• Datas no formato DD/MM/AAAA (ex.: 15/04/2026) ou AAAA-MM-DD.'],
    ['• Valores podem usar vírgula (45,90) ou ponto (45.90).'],
    ['• Categoria: digite o NOME da categoria (ex.: "Alimentação").'],
    ['  Se a categoria não existir, será criada automaticamente.'],
    ['• Conta: digite o NOME da conta (ex.: "Nubank Ultravioleta").'],
    ['  A conta DEVE existir antes da importação. Linhas com conta inexistente serão ignoradas.'],
    ['• Comentário é opcional — preencha se quiser anotar detalhes.'],
    [''],
    ['Veja a aba "Referência" pra lista de contas e categorias disponíveis.'],
    [''],
    ['Após importar, os lançamentos somam-se aos existentes (não substituem nada).'],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instructions);
  wsInstr['!cols'] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instruções');

  // ====== ABA GASTOS ======
  const gastosHeaders = ['Data', 'Descrição', 'Valor', 'Categoria', 'Conta', 'Comentário'];
  const gastosExample = [
    gastosHeaders,
    ['15/04/2026', 'Mercado Pão de Açúcar', 342.18, 'Alimentação', 'Nubank Ultravioleta', 'Compras da semana'],
    ['16/04/2026', 'Uber', 22.50, 'Transporte', 'Itaú Visa Platinum', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
  ];
  const wsGastos = XLSX.utils.aoa_to_sheet(gastosExample);
  wsGastos['!cols'] = [
    { wch: 12 }, { wch: 35 }, { wch: 10 }, { wch: 18 }, { wch: 25 }, { wch: 35 }
  ];
  XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos');

  // ====== ABA PARCELAMENTOS ======
  const parcHeaders = ['Descrição', 'Valor Total', 'Parcelas', 'Data 1ª Parcela', 'Categoria', 'Conta', 'Comentário'];
  const parcExample = [
    parcHeaders,
    ['Notebook Dell', 4200.00, 12, '01/03/2026', 'Compras', 'Nubank Ultravioleta', 'Trabalho'],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
  ];
  const wsParc = XLSX.utils.aoa_to_sheet(parcExample);
  wsParc['!cols'] = [
    { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 15 }, { wch: 25 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsParc, 'Parcelamentos');

  // ====== ABA ASSINATURAS ======
  const assHeaders = ['Nome', 'Valor Mensal', 'Dia da Cobrança', 'Categoria', 'Conta', 'Comentário'];
  const assExample = [
    assHeaders,
    ['Netflix', 55.90, 5, 'Assinaturas', 'Itaú Visa Platinum', '4 telas'],
    ['Spotify', 21.90, 12, 'Assinaturas', 'Itaú Visa Platinum', ''],
    ['', '', '', '', '', ''],
  ];
  const wsAss = XLSX.utils.aoa_to_sheet(assExample);
  wsAss['!cols'] = [
    { wch: 25 }, { wch: 12 }, { wch: 14 }, { wch: 15 }, { wch: 25 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAss, 'Assinaturas');

  // ====== ABA REFERÊNCIA ======
  const refRows = [
    ['CONTAS DISPONÍVEIS'],
    ['Nome', 'Tipo'],
    ...state.accounts.map(a => [a.name, a.type]),
    [''],
    ['CATEGORIAS DISPONÍVEIS'],
    ['Nome'],
    ...state.categories.map(c => [c.name]),
    [''],
    ['Categorias inexistentes serão criadas automaticamente.'],
    ['Contas devem existir antes da importação.'],
  ];
  const wsRef = XLSX.utils.aoa_to_sheet(refRows);
  wsRef['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referência');

  // Download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `ledger-modelo-${dateStr}.xlsx`);
}

// ============ EXPORT — DADOS ATUAIS DO APP ============

/**
 * Exporta todos os dados atuais do app pra um arquivo Excel.
 * Útil pra ver os lançamentos numa planilha completa.
 */
export function exportToExcel() {
  if (typeof XLSX === 'undefined') {
    alert('Biblioteca Excel não carregou. Verifique sua conexão e recarregue a página.');
    return;
  }

  const wb = XLSX.utils.book_new();
  const accountById = (id) => state.accounts.find(a => a.id === id);
  const catById = (id) => state.categories.find(c => c.id === id);

  // Gastos
  const gastosData = [
    ['Data', 'Descrição', 'Valor', 'Categoria', 'Conta', 'Comentário'],
    ...state.singleTransactions
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(t => [
        formatDateBR(t.date),
        t.desc,
        t.amount,
        catById(t.categoryId)?.name || '',
        accountById(t.accountId)?.name || '',
        t.note || ''
      ])
  ];
  const wsGastos = XLSX.utils.aoa_to_sheet(gastosData);
  wsGastos['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 10 }, { wch: 18 }, { wch: 25 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos');

  // Parcelamentos
  const parcData = [
    ['Descrição', 'Valor Total', 'Parcelas', 'Data 1ª Parcela', 'Categoria', 'Conta', 'Comentário'],
    ...state.installmentGroups.map(g => [
      g.desc,
      g.totalAmount,
      g.count,
      formatDateBR(g.startDate),
      catById(g.categoryId)?.name || '',
      accountById(g.accountId)?.name || '',
      g.note || ''
    ])
  ];
  const wsParc = XLSX.utils.aoa_to_sheet(parcData);
  wsParc['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 15 }, { wch: 25 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsParc, 'Parcelamentos');

  // Assinaturas
  const assData = [
    ['Nome', 'Valor Mensal', 'Dia da Cobrança', 'Categoria', 'Conta', 'Ativa', 'Comentário'],
    ...state.subscriptions.map(s => [
      s.name,
      s.amount,
      s.billingDay,
      catById(s.categoryId)?.name || '',
      accountById(s.accountId)?.name || '',
      s.active ? 'Sim' : 'Não',
      s.note || ''
    ])
  ];
  const wsAss = XLSX.utils.aoa_to_sheet(assData);
  wsAss['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 14 }, { wch: 15 }, { wch: 25 }, { wch: 8 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsAss, 'Assinaturas');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `ledger-export-${dateStr}.xlsx`);
}

// ============ IMPORT ============

/**
 * Lê um arquivo Excel e importa as linhas válidas.
 * Retorna { success, errors, summary }.
 */
export function importFromExcel(file) {
  return new Promise((resolve, reject) => {
    if (typeof XLSX === 'undefined') {
      reject(new Error('Biblioteca Excel não disponível'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });

        const result = {
          gastos: { ok: 0, errors: [] },
          parcelamentos: { ok: 0, errors: [] },
          assinaturas: { ok: 0, errors: [] },
          createdCategories: []
        };

        if (wb.SheetNames.includes('Gastos')) {
          importGastos(wb.Sheets['Gastos'], result);
        }
        if (wb.SheetNames.includes('Parcelamentos')) {
          importParcelamentos(wb.Sheets['Parcelamentos'], result);
        }
        if (wb.SheetNames.includes('Assinaturas')) {
          importAssinaturas(wb.Sheets['Assinaturas'], result);
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

function importGastos(sheet, result) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rows.length < 2) return;
  // Pula header (linha 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const [dateRaw, desc, amountRaw, catName, accName, note] = row;

    if (!desc || !desc.toString().trim()) continue; // pula linhas vazias

    const date = parseDate(dateRaw);
    const amount = parseAmount(amountRaw);

    if (!date) {
      result.gastos.errors.push(`Linha ${i + 1}: data inválida "${dateRaw}"`);
      continue;
    }
    if (!amount || amount <= 0) {
      result.gastos.errors.push(`Linha ${i + 1}: valor inválido "${amountRaw}"`);
      continue;
    }

    const account = findAccountByName(accName);
    if (!account) {
      result.gastos.errors.push(`Linha ${i + 1}: conta "${accName}" não encontrada`);
      continue;
    }

    const category = findOrCreateCategory(catName, result);

    addTransaction({
      id: Date.now() + Math.random(),
      date,
      desc: desc.toString().trim(),
      amount,
      categoryId: category.id,
      accountId: account.id,
      note: (note || '').toString().trim()
    });
    result.gastos.ok++;
  }
}

function importParcelamentos(sheet, result) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rows.length < 2) return;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const [desc, totalRaw, countRaw, dateRaw, catName, accName, note] = row;

    if (!desc || !desc.toString().trim()) continue;

    const totalAmount = parseAmount(totalRaw);
    const count = parseInt(countRaw);
    const startDate = parseDate(dateRaw);

    if (!totalAmount || totalAmount <= 0) {
      result.parcelamentos.errors.push(`Linha ${i + 1}: valor total inválido`);
      continue;
    }
    if (!count || count < 1) {
      result.parcelamentos.errors.push(`Linha ${i + 1}: número de parcelas inválido`);
      continue;
    }
    if (!startDate) {
      result.parcelamentos.errors.push(`Linha ${i + 1}: data inválida`);
      continue;
    }

    const account = findAccountByName(accName);
    if (!account) {
      result.parcelamentos.errors.push(`Linha ${i + 1}: conta "${accName}" não encontrada`);
      continue;
    }
    if (account.type !== 'credit') {
      result.parcelamentos.errors.push(`Linha ${i + 1}: parcelamentos só em cartão de crédito`);
      continue;
    }

    const category = findOrCreateCategory(catName, result);

    addInstallmentGroup({
      id: Date.now() + Math.random(),
      desc: desc.toString().trim(),
      totalAmount,
      count,
      startDate,
      categoryId: category.id,
      accountId: account.id,
      note: (note || '').toString().trim()
    });
    result.parcelamentos.ok++;
  }
}

function importAssinaturas(sheet, result) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rows.length < 2) return;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const [name, amountRaw, dayRaw, catName, accName, note] = row;

    if (!name || !name.toString().trim()) continue;

    const amount = parseAmount(amountRaw);
    const billingDay = parseInt(dayRaw);

    if (!amount || amount <= 0) {
      result.assinaturas.errors.push(`Linha ${i + 1}: valor inválido`);
      continue;
    }
    if (!billingDay || billingDay < 1 || billingDay > 31) {
      result.assinaturas.errors.push(`Linha ${i + 1}: dia inválido (1-31)`);
      continue;
    }

    const account = findAccountByName(accName);
    if (!account) {
      result.assinaturas.errors.push(`Linha ${i + 1}: conta "${accName}" não encontrada`);
      continue;
    }

    const category = findOrCreateCategory(catName, result);

    addSubscription({
      id: Date.now() + Math.random(),
      name: name.toString().trim(),
      amount,
      billingDay,
      categoryId: category.id,
      accountId: account.id,
      note: (note || '').toString().trim(),
      active: true
    });
    result.assinaturas.ok++;
  }
}

// ============ HELPERS ============

/** Normaliza string pra comparação (lowercase, sem acento) */
const normalize = (str) => (str || '').toString().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

function findAccountByName(name) {
  if (!name) return null;
  const target = normalize(name);
  return state.accounts.find(a => normalize(a.name) === target);
}

function findCategoryByName(name) {
  if (!name) return null;
  const target = normalize(name);
  return state.categories.find(c => normalize(c.name) === target);
}

function findOrCreateCategory(name, result) {
  if (!name || !name.toString().trim()) {
    return state.categories.find(c => c.id === 'other');
  }
  const existing = findCategoryByName(name);
  if (existing) return existing;

  // Cria categoria nova
  const palette = ['#0a84ff', '#30d158', '#bf5af2', '#ff453a', '#ff9f0a', '#ff375f', '#64d2ff'];
  const randomColor = palette[Math.floor(Math.random() * palette.length)];
  const cleanName = name.toString().trim();
  const existingIds = state.categories.map(c => c.id);

  const newCat = {
    id: generateId(cleanName, existingIds),
    name: cleanName,
    color: randomColor,
    system: false
  };
  addCategory(newCat);
  result.createdCategories.push(cleanName);
  return newCat;
}

/** Aceita "15/04/2026", "2026-04-15", ou serial number do Excel */
function parseDate(input) {
  if (!input && input !== 0) return null;

  // Excel serial date number
  if (typeof input === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = excelEpoch.getTime() + input * 86400000;
    const d = new Date(ms);
    return d.toISOString().split('T')[0];
  }

  const str = input.toString().trim();
  // ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  // BR dd/mm/yyyy
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

/** Aceita "45,90" ou "45.90" ou number */
function parseAmount(input) {
  if (typeof input === 'number') return input;
  if (!input) return 0;
  const str = input.toString().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function formatDateBR(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
