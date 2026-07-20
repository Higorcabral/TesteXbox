/* ============================================================
   config.js — constantes, paletas, defaults
   ============================================================ */

// Paleta de cores disponível pra categorias e contas (sistema Apple dark)
export const COLOR_PALETTE = [
  '#0a84ff', '#30d158', '#bf5af2', '#ff453a',
  '#ff9f0a', '#ff375f', '#64d2ff', '#98989d',
  '#63e6e2', '#5e5ce6', '#ffd60a', '#32d74b',
  '#ff6482', '#0ab8ff', '#ac8e68', '#6c6c70'
];

// Tipos de conta suportados
export const ACCOUNT_TYPES = {
  credit:  { label: 'Crédito',         badge: 'CRÉDITO'  },
  debit:   { label: 'Débito',          badge: 'DÉBITO'   },
  pix:     { label: 'Pix',             badge: 'PIX'      },
  cash:    { label: 'Dinheiro',        badge: 'DINHEIRO' },
  benefit: { label: 'Vale-refeição',   badge: 'VR'       }
};

// Contas de exemplo (usadas no demo state)
export const DEFAULT_ACCOUNTS = [
  {
    id: 'nubank',
    name: 'Nubank Ultravioleta',
    type: 'credit',
    limit: 8000,
    color: '#bf5af2',
    closingDay: 25,  // dia de fechamento da fatura
    dueDay: 5        // dia de vencimento
  },
  {
    id: 'itau',
    name: 'Itaú Visa Platinum',
    type: 'credit',
    limit: 6000,
    color: '#ff9f0a',
    closingDay: 20,
    dueDay: 27
  },
  {
    id: 'nubank-debito',
    name: 'Nubank Débito',
    type: 'debit',
    color: '#bf5af2'
  },
  {
    id: 'pix',
    name: 'Pix / Transferência',
    type: 'pix',
    color: '#30d158'
  },
  {
    id: 'cash',
    name: 'Dinheiro',
    type: 'cash',
    color: '#98989d'
  }
];

// Categorias padrão (usadas na primeira visita ou em reset)
export const DEFAULT_CATEGORIES = [
  { id: 'food',      name: 'Alimentação',  color: '#0a84ff', system: true  },
  { id: 'transport', name: 'Transporte',   color: '#30d158', system: true  },
  { id: 'leisure',   name: 'Lazer',        color: '#bf5af2', system: false },
  { id: 'health',    name: 'Saúde',        color: '#ff453a', system: false },
  { id: 'home',      name: 'Casa',         color: '#ff9f0a', system: false },
  { id: 'shopping',  name: 'Compras',      color: '#ff375f', system: false },
  { id: 'subscr',    name: 'Assinaturas',  color: '#64d2ff', system: true  },
  { id: 'income',    name: 'Receita',      color: '#30d158', system: true  },
  { id: 'other',     name: 'Outros',       color: '#98989d', system: true  }
];
