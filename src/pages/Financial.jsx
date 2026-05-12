import { useState, useMemo } from 'react';
import { useApp } from '../data/store';
import { DollarSign, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Plus, Edit2, Trash2, Check, Download } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Modal from '../components/Modal';

const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v);
const statusBadge = { pago: 'badge-green', pendente: 'badge-yellow', atrasado: 'badge-red', cancelado: 'badge-gray' };
const COLORS = ['#FFD600', '#3B82F6', '#22C55E', '#8B5CF6', '#F59E0B', '#EF4444'];
const emptyFin = { descricao: '', tipo: 'receita', valor: 0, status: 'pendente', dataVencimento: '', dataPagamento: '', categoria: '', clienteId: '' };

export default function Financial() {
  const { financials, clients, addItem, updateItem, deleteItem, addToast } = useApp();
  const [filterTipo, setFilterTipo] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('mes');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyFin);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const activeClients = clients.filter(c => c.status === 'ativo');
  const mrr = activeClients.reduce((s, c) => s + c.mrr, 0);
  const filtered = financials.filter(f => !filterTipo || f.tipo === filterTipo);
  const totalReceitas = filtered.filter(f => f.tipo === 'receita').reduce((s, f) => s + f.valor, 0);
  const totalDespesas = filtered.filter(f => f.tipo === 'despesa').reduce((s, f) => s + f.valor, 0);
  const inadimplentes = financials.filter(f => f.status === 'pendente' || f.status === 'atrasado');
  const receitaPorCliente = activeClients.map(c => ({ name: c.empresa.split(' ')[0], value: c.mrr }));

  const openCreate = (tipo) => { setEditingItem(null); setFormData({ ...emptyFin, tipo }); setShowModal(true); };
  const openEdit = (item) => { setEditingItem(item); setFormData({ ...item }); setShowModal(true); };

  const handleSave = () => {
    if (!formData.descricao || !formData.valor) { addToast('Descrição e valor obrigatórios', 'error'); return; }
    if (editingItem) { updateItem('financials', editingItem.id, formData); addToast('Atualizado!'); }
    else { addItem('financials', formData); addToast('Lançamento criado!'); }
    setShowModal(false);
  };

  const markPaid = (id) => { updateItem('financials', id, { status: 'pago', dataPagamento: new Date().toISOString().split('T')[0] }); addToast('Marcado como pago!'); };

  const exportCSV = () => {
    const h = 'Descrição,Tipo,Valor,Status,Vencimento,Pagamento,Categoria\n';
    const r = filtered.map(f => `"${f.descricao}","${f.tipo}","${f.valor}","${f.status}","${f.dataVencimento}","${f.dataPagamento || ''}","${f.categoria}"`).join('\n');
    const blob = new Blob([h + r], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `financeiro_${Date.now()}.csv`; a.click();
    addToast('CSV exportado!');
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Financeiro</h2><div className="breadcrumb">Receitas, despesas e MRR</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={14} /> CSV</button>
          <button className="btn btn-secondary" onClick={() => openCreate('despesa')}>+ Despesa</button>
          <button className="btn btn-primary" onClick={() => openCreate('receita')}><Plus size={16} /> Receita</button>
        </div>
      </div>
      <div className="page-body">
        <div className="kpi-grid">
          <div className="card kpi-card"><div className="kpi-icon" style={{ background: 'rgba(255,214,0,.12)' }}><DollarSign size={20} color="#FFD600" /></div><div className="kpi-value">{fmt(mrr)}</div><div className="flex justify-between items-center"><span className="kpi-label">MRR</span><span className="kpi-change up"><ArrowUpRight size={12} />+12%</span></div></div>
          <div className="card kpi-card"><div className="kpi-icon" style={{ background: 'rgba(34,197,94,.12)' }}><TrendingUp size={20} color="#22C55E" /></div><div className="kpi-value">{fmt(totalReceitas)}</div><div className="flex justify-between items-center"><span className="kpi-label">Receitas</span></div></div>
          <div className="card kpi-card"><div className="kpi-icon" style={{ background: 'rgba(239,68,68,.12)' }}><ArrowDownRight size={20} color="#EF4444" /></div><div className="kpi-value">{fmt(totalDespesas)}</div><div className="flex justify-between items-center"><span className="kpi-label">Despesas</span></div></div>
          <div className="card kpi-card"><div className="kpi-icon" style={{ background: 'rgba(245,158,11,.12)' }}><AlertTriangle size={20} color="#F59E0B" /></div><div className="kpi-value">{inadimplentes.length}</div><div className="flex justify-between items-center"><span className="kpi-label">Pendentes</span></div></div>
        </div>

        <div className="charts-grid">
          <div className="card chart-card">
            <h4>📈 Fluxo de Caixa</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={['Jan','Fev','Mar','Abr','Mai','Jun'].map(m => ({ mes: m, receita: totalReceitas / 6 * (1 + Math.random() * 0.3), despesa: totalDespesas / 6 * (1 + Math.random() * 0.3) }))}>

                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="mes" fontSize={12} stroke="#6b7280" /><YAxis fontSize={12} tickFormatter={v => `${v/1000}k`} stroke="#6b7280" />
                <Tooltip formatter={v => fmt(v)} /><Legend />
                <Line type="monotone" dataKey="receita" stroke="#22C55E" strokeWidth={3} dot={{ r: 4 }} name="Entradas" />
                <Line type="monotone" dataKey="despesa" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" name="Saídas" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card chart-card">
            <h4>🥧 Receita por Cliente</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={receitaPorCliente} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} label={({ name }) => name}>
                {receitaPorCliente.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip formatter={v => fmt(v)} /></PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['', 'Todos'], ['receita', 'Receitas'], ['despesa', 'Despesas']].map(([v, l]) => (
            <button key={v} className={`btn btn-sm ${filterTipo === v ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterTipo(v)}>{l}</button>
          ))}
        </div>

        <div className="card"><table className="data-table">
          <thead><tr><th>Descrição</th><th>Tipo</th><th>Valor</th><th>Status</th><th>Vencimento</th><th>Ações</th></tr></thead>
          <tbody>{filtered.map(f => (
            <tr key={f.id}>
              <td style={{ fontWeight: 600 }}>{f.descricao}</td>
              <td><span className={`badge ${f.tipo === 'receita' ? 'badge-green' : 'badge-red'}`}>{f.tipo}</span></td>
              <td style={{ fontWeight: 700, color: f.tipo === 'receita' ? '#22C55E' : '#EF4444' }}>{f.tipo === 'despesa' ? '-' : ''}{fmt(f.valor)}</td>
              <td><span className={`badge ${statusBadge[f.status]}`}>{f.status}</span></td>
              <td style={{ fontSize: 12 }}>{f.dataVencimento ? new Date(f.dataVencimento).toLocaleDateString('pt-BR') : '—'}</td>
              <td><div style={{ display: 'flex', gap: 4 }}>
                {f.status !== 'pago' && <button onClick={() => markPaid(f.id)} className="btn btn-sm btn-secondary" style={{ padding: '4px 6px' }} title="Pago"><Check size={12} /></button>}
                <button onClick={() => openEdit(f)} className="btn btn-sm btn-secondary" style={{ padding: '4px 6px' }}><Edit2 size={12} /></button>
                <button onClick={() => setDeleteConfirm(f)} className="btn btn-sm btn-secondary" style={{ padding: '4px 6px', color: '#EF4444' }}><Trash2 size={12} /></button>
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? '✏️ Editar Lançamento' : `➕ Nova ${formData.tipo === 'receita' ? 'Receita' : 'Despesa'}`} size="md"
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Salvar</button></>}>
        <div className="form-group"><label className="form-label">Descrição *</label><input className="form-input" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Valor (R$) *</label><input className="form-input" type="number" value={formData.valor} onChange={e => setFormData({...formData, valor: Number(e.target.value)})} /></div>
          <div className="form-group"><label className="form-label">Vencimento</label><input className="form-input" type="date" value={formData.dataVencimento} onChange={e => setFormData({...formData, dataVencimento: e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Categoria</label><input className="form-input" value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Cliente</label>
            <select className="form-select" value={formData.clienteId || ''} onChange={e => setFormData({...formData, clienteId: e.target.value})}>
              <option value="">Nenhum</option>{clients.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
            </select></div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="⚠️ Excluir" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => { deleteItem('financials', deleteConfirm.id); addToast('Excluído!', 'warning'); setDeleteConfirm(null); }}>Excluir</button></>}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Excluir "{deleteConfirm?.descricao}"?</p>
      </Modal>
    </>
  );
}
