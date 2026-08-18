// Mocked inventory data for Stoqly
const CATEGORIES = ['Eletrônicos', 'Ferramentas', 'EPIs', 'Escritório', 'Limpeza', 'Embalagens'];
const SUPPLIERS = ['TechDist Ltda', 'FerrasulSP', 'SegurMax', 'PapelPlus', 'CleanCorp', 'EmbalaFast'];
const LOCATIONS = ['A-01', 'A-02', 'A-03', 'B-01', 'B-02', 'C-01', 'C-02', 'D-01'];

const ITEMS = [
  { id: 'SKU-1001', name: 'Notebook Dell Latitude 5540', category: 'Eletrônicos', stock: 24, min: 10, max: 60, price: 5890.00, supplier: 'TechDist Ltda', location: 'A-01', updated: '2026-08-09' },
  { id: 'SKU-1002', name: 'Monitor LG 27" UltraWide', category: 'Eletrônicos', stock: 8, min: 12, max: 40, price: 2199.90, supplier: 'TechDist Ltda', location: 'A-01', updated: '2026-08-08' },
  { id: 'SKU-1003', name: 'Mouse Logitech MX Master 3S', category: 'Eletrônicos', stock: 47, min: 20, max: 80, price: 649.00, supplier: 'TechDist Ltda', location: 'A-02', updated: '2026-08-10' },
  { id: 'SKU-1004', name: 'Teclado Mecânico Keychron K8', category: 'Eletrônicos', stock: 32, min: 15, max: 50, price: 899.00, supplier: 'TechDist Ltda', location: 'A-02', updated: '2026-08-09' },
  { id: 'SKU-1005', name: 'Headset JBL Quantum 400', category: 'Eletrônicos', stock: 15, min: 10, max: 40, price: 499.90, supplier: 'TechDist Ltda', location: 'A-03', updated: '2026-08-07' },
  { id: 'SKU-1006', name: 'Webcam Logitech C920', category: 'Eletrônicos', stock: 3, min: 8, max: 30, price: 429.00, supplier: 'TechDist Ltda', location: 'A-03', updated: '2026-08-05' },
  { id: 'SKU-2001', name: 'Furadeira Bosch GSB 550W', category: 'Ferramentas', stock: 18, min: 8, max: 30, price: 389.90, supplier: 'FerrasulSP', location: 'B-01', updated: '2026-08-08' },
  { id: 'SKU-2002', name: 'Kit Chaves de Fenda 12pçs', category: 'Ferramentas', stock: 42, min: 20, max: 80, price: 89.90, supplier: 'FerrasulSP', location: 'B-01', updated: '2026-08-06' },
  { id: 'SKU-2003', name: 'Alicate Universal 8"', category: 'Ferramentas', stock: 28, min: 15, max: 50, price: 45.50, supplier: 'FerrasulSP', location: 'B-01', updated: '2026-08-09' },
  { id: 'SKU-2004', name: 'Martelo Unha 25mm', category: 'Ferramentas', stock: 22, min: 10, max: 40, price: 32.90, supplier: 'FerrasulSP', location: 'B-02', updated: '2026-08-07' },
  { id: 'SKU-2005', name: 'Trena 5m Vonder', category: 'Ferramentas', stock: 5, min: 15, max: 40, price: 24.90, supplier: 'FerrasulSP', location: 'B-02', updated: '2026-08-04' },
  { id: 'SKU-3001', name: 'Capacete Segurança CA 31469', category: 'EPIs', stock: 67, min: 30, max: 120, price: 22.90, supplier: 'SegurMax', location: 'C-01', updated: '2026-08-10' },
  { id: 'SKU-3002', name: 'Luva Nitrílica Descartável (cx 100)', category: 'EPIs', stock: 145, min: 50, max: 200, price: 39.90, supplier: 'SegurMax', location: 'C-01', updated: '2026-08-09' },
  { id: 'SKU-3003', name: 'Óculos Proteção Incolor', category: 'EPIs', stock: 89, min: 40, max: 150, price: 14.50, supplier: 'SegurMax', location: 'C-01', updated: '2026-08-08' },
  { id: 'SKU-3004', name: 'Bota Segurança Bico Composite 42', category: 'EPIs', stock: 12, min: 20, max: 60, price: 189.00, supplier: 'SegurMax', location: 'C-02', updated: '2026-08-06' },
  { id: 'SKU-3005', name: 'Máscara PFF2 (cx 50)', category: 'EPIs', stock: 78, min: 30, max: 100, price: 89.00, supplier: 'SegurMax', location: 'C-02', updated: '2026-08-10' },
  { id: 'SKU-3006', name: 'Protetor Auricular Plug', category: 'EPIs', stock: 4, min: 25, max: 80, price: 6.90, supplier: 'SegurMax', location: 'C-02', updated: '2026-08-03' },
  { id: 'SKU-4001', name: 'Papel A4 Chamex (500fls)', category: 'Escritório', stock: 156, min: 60, max: 200, price: 32.90, supplier: 'PapelPlus', location: 'D-01', updated: '2026-08-09' },
  { id: 'SKU-4002', name: 'Caneta Esferográfica BIC Azul (cx 50)', category: 'Escritório', stock: 34, min: 20, max: 80, price: 42.90, supplier: 'PapelPlus', location: 'D-01', updated: '2026-08-08' },
  { id: 'SKU-4003', name: 'Pasta Suspensa Kraft', category: 'Escritório', stock: 89, min: 40, max: 120, price: 3.20, supplier: 'PapelPlus', location: 'D-01', updated: '2026-08-07' },
  { id: 'SKU-4004', name: 'Toner HP CF283A', category: 'Escritório', stock: 7, min: 10, max: 30, price: 289.00, supplier: 'PapelPlus', location: 'D-01', updated: '2026-08-05' },
  { id: 'SKU-4005', name: 'Grampeador Metal 26/6', category: 'Escritório', stock: 26, min: 15, max: 40, price: 34.90, supplier: 'PapelPlus', location: 'D-01', updated: '2026-08-08' },
  { id: 'SKU-5001', name: 'Álcool 70% 1L', category: 'Limpeza', stock: 92, min: 40, max: 120, price: 12.90, supplier: 'CleanCorp', location: 'D-01', updated: '2026-08-10' },
  { id: 'SKU-5002', name: 'Detergente Neutro 5L', category: 'Limpeza', stock: 34, min: 20, max: 60, price: 28.90, supplier: 'CleanCorp', location: 'D-01', updated: '2026-08-09' },
  { id: 'SKU-5003', name: 'Papel Toalha Bobina 200m', category: 'Limpeza', stock: 58, min: 30, max: 80, price: 34.50, supplier: 'CleanCorp', location: 'D-01', updated: '2026-08-08' },
  { id: 'SKU-5004', name: 'Desinfetante Pinho 5L', category: 'Limpeza', stock: 2, min: 15, max: 40, price: 26.90, supplier: 'CleanCorp', location: 'D-01', updated: '2026-08-02' },
  { id: 'SKU-6001', name: 'Caixa Papelão 40x30x30', category: 'Embalagens', stock: 245, min: 100, max: 400, price: 3.80, supplier: 'EmbalaFast', location: 'D-01', updated: '2026-08-09' },
  { id: 'SKU-6002', name: 'Fita Adesiva Transparente 45mm', category: 'Embalagens', stock: 89, min: 40, max: 120, price: 7.90, supplier: 'EmbalaFast', location: 'D-01', updated: '2026-08-08' },
  { id: 'SKU-6003', name: 'Plástico Bolha 1,3m x 100m', category: 'Embalagens', stock: 18, min: 10, max: 40, price: 189.00, supplier: 'EmbalaFast', location: 'D-01', updated: '2026-08-06' },
  { id: 'SKU-6004', name: 'Envelope Kraft A4 (100un)', category: 'Embalagens', stock: 42, min: 20, max: 80, price: 45.00, supplier: 'EmbalaFast', location: 'D-01', updated: '2026-08-07' },
];

const MOVEMENTS = [
  { id: 'MV-8801', type: 'entrada', sku: 'SKU-1003', name: 'Mouse Logitech MX Master 3S', qty: 20, user: 'Ana Ribeiro', date: '2026-08-10 09:14', reason: 'Compra NF 45892' },
  { id: 'MV-8802', type: 'saida', sku: 'SKU-3002', name: 'Luva Nitrílica Descartável', qty: 15, user: 'Pedro Souza', date: '2026-08-10 08:47', reason: 'Requisição Op-1204' },
  { id: 'MV-8803', type: 'entrada', sku: 'SKU-5001', name: 'Álcool 70% 1L', qty: 50, user: 'Ana Ribeiro', date: '2026-08-10 08:22', reason: 'Compra NF 45891' },
  { id: 'MV-8804', type: 'saida', sku: 'SKU-1001', name: 'Notebook Dell Latitude 5540', qty: 2, user: 'Carla Menezes', date: '2026-08-09 17:33', reason: 'Envio Pedido #4521' },
  { id: 'MV-8805', type: 'saida', sku: 'SKU-4001', name: 'Papel A4 Chamex', qty: 8, user: 'Pedro Souza', date: '2026-08-09 15:12', reason: 'Requisição Adm-089' },
  { id: 'MV-8806', type: 'entrada', sku: 'SKU-3001', name: 'Capacete Segurança CA 31469', qty: 30, user: 'Ana Ribeiro', date: '2026-08-09 14:05', reason: 'Compra NF 45888' },
  { id: 'MV-8807', type: 'saida', sku: 'SKU-6001', name: 'Caixa Papelão 40x30x30', qty: 25, user: 'Rafael Lima', date: '2026-08-09 11:48', reason: 'Envio Pedido #4519' },
  { id: 'MV-8808', type: 'ajuste', sku: 'SKU-2005', name: 'Trena 5m Vonder', qty: -1, user: 'Pedro Souza', date: '2026-08-09 10:20', reason: 'Ajuste inventário' },
  { id: 'MV-8809', type: 'entrada', sku: 'SKU-1004', name: 'Teclado Mecânico Keychron K8', qty: 10, user: 'Ana Ribeiro', date: '2026-08-08 16:44', reason: 'Compra NF 45880' },
  { id: 'MV-8810', type: 'saida', sku: 'SKU-3005', name: 'Máscara PFF2 (cx 50)', qty: 6, user: 'Carla Menezes', date: '2026-08-08 13:11', reason: 'Requisição Op-1198' },
];

const SHIPMENTS = [
  {
    id: '#4521', customer: 'Construtora Horizonte SA', destination: 'São Paulo, SP',
    status: 'em_transito', carrier: 'JadLog', tracking: 'JD9078451BR',
    items: 3, total: 12780.00, created: '2026-08-09', eta: '2026-08-12',
    steps: [
      { title: 'Pedido recebido', time: '09/08 08:22', status: 'done' },
      { title: 'Separado no CD', time: '09/08 14:05', status: 'done' },
      { title: 'Enviado', time: '09/08 17:33', status: 'done' },
      { title: 'Em trânsito', time: '10/08 06:14', status: 'active' },
      { title: 'Entregue', time: 'Previsto 12/08', status: 'pending' },
    ]
  },
  {
    id: '#4522', customer: 'MetalTech Indústria', destination: 'Campinas, SP',
    status: 'preparacao', carrier: 'Correios', tracking: '—',
    items: 8, total: 3450.90, created: '2026-08-10', eta: '2026-08-13',
    steps: [
      { title: 'Pedido recebido', time: '10/08 09:41', status: 'done' },
      { title: 'Separado no CD', time: 'Em andamento', status: 'active' },
      { title: 'Enviado', time: '—', status: 'pending' },
      { title: 'Em trânsito', time: '—', status: 'pending' },
      { title: 'Entregue', time: 'Previsto 13/08', status: 'pending' },
    ]
  },
  {
    id: '#4519', customer: 'Escritório Amaral & Reis', destination: 'Rio de Janeiro, RJ',
    status: 'entregue', carrier: 'Braspress', tracking: 'BP4451209',
    items: 5, total: 890.00, created: '2026-08-07', eta: '2026-08-09',
    steps: [
      { title: 'Pedido recebido', time: '07/08 10:12', status: 'done' },
      { title: 'Separado no CD', time: '07/08 15:44', status: 'done' },
      { title: 'Enviado', time: '08/08 09:00', status: 'done' },
      { title: 'Em trânsito', time: '08/08 14:22', status: 'done' },
      { title: 'Entregue', time: '09/08 11:48', status: 'done' },
    ]
  },
  {
    id: '#4520', customer: 'Farmácia Vida & Saúde', destination: 'Belo Horizonte, MG',
    status: 'em_transito', carrier: 'Total Express', tracking: 'TE7789012',
    items: 12, total: 2145.60, created: '2026-08-08', eta: '2026-08-11',
    steps: [
      { title: 'Pedido recebido', time: '08/08 11:04', status: 'done' },
      { title: 'Separado no CD', time: '08/08 16:20', status: 'done' },
      { title: 'Enviado', time: '09/08 08:15', status: 'done' },
      { title: 'Em trânsito', time: '10/08 05:30', status: 'active' },
      { title: 'Entregue', time: 'Previsto 11/08', status: 'pending' },
    ]
  },
  {
    id: '#4523', customer: 'Autopeças Silveira', destination: 'Curitiba, PR',
    status: 'preparacao', carrier: 'JadLog', tracking: '—',
    items: 4, total: 5680.00, created: '2026-08-10', eta: '2026-08-14',
    steps: [
      { title: 'Pedido recebido', time: '10/08 10:32', status: 'done' },
      { title: 'Separado no CD', time: '—', status: 'pending' },
      { title: 'Enviado', time: '—', status: 'pending' },
      { title: 'Em trânsito', time: '—', status: 'pending' },
      { title: 'Entregue', time: 'Previsto 14/08', status: 'pending' },
    ]
  },
  {
    id: '#4518', customer: 'Padaria Real Pães', destination: 'São Paulo, SP',
    status: 'entregue', carrier: 'Motoboy Local', tracking: 'ML8801',
    items: 2, total: 289.00, created: '2026-08-06', eta: '2026-08-07',
    steps: [
      { title: 'Pedido recebido', time: '06/08 13:22', status: 'done' },
      { title: 'Separado no CD', time: '06/08 15:10', status: 'done' },
      { title: 'Enviado', time: '07/08 08:00', status: 'done' },
      { title: 'Em trânsito', time: '07/08 09:14', status: 'done' },
      { title: 'Entregue', time: '07/08 11:22', status: 'done' },
    ]
  },
];

// Helpers
function fmtBRL(n) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtNum(n) {
  return n.toLocaleString('pt-BR');
}

function stockStatus(item) {
  if (item.stock === 0) return { label: 'Sem estoque', badge: 'badge-danger' };
  if (item.stock < item.min) return { label: 'Baixo', badge: 'badge-danger' };
  if (item.stock < item.min * 1.5) return { label: 'Atenção', badge: 'badge-warning' };
  return { label: 'OK', badge: 'badge-success' };
}

function stockPercent(item) {
  return Math.min(100, Math.round((item.stock / item.max) * 100));
}

function progressClass(item) {
  if (item.stock < item.min) return 'low';
  if (item.stock < item.min * 1.5) return 'mid';
  return '';
}

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function shipmentBadge(status) {
  const map = {
    'preparacao': { label: 'Preparação', cls: 'badge-warning' },
    'em_transito': { label: 'Em trânsito', cls: 'badge-info' },
    'entregue': { label: 'Entregue', cls: 'badge-success' },
    'cancelado': { label: 'Cancelado', cls: 'badge-danger' },
  };
  return map[status] || { label: status, cls: 'badge-neutral' };
}
