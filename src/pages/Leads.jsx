import { useState, useMemo } from 'react';
import { useApp } from '../data/store';
import { Search, Plus, Edit2, Trash2, Mail, Phone, MessageSquare, Download, Filter } from 'lucide-react';
import Modal from '../components/Modal';

const tempIcons = { quente: '🔥', morno: '⚡', frio: '❄️' };
const statusLabels = { novo: 'Novo', contato_feito: 'Contato', reuniao: 'Reunião', proposta: 'Proposta', fechado: 'Fechado', perdido: 'Perdido' };
const statusBadge = { novo: 'badge-gray', contato_feito: 'badge-blue', reuniao: 'badge-yellow', proposta: 'badge-yellow', fechado: 'badge-green', perdido: 'badge-red' };

const calcScore = (l) => {
  let s = 0;
  if (l.nome) s += 10; if (l.empresa) s += 10; if (l.email) s += 10; if (l.whatsapp) s += 15;
  if (l.faturamento) s += 10; if (l.segmento) s += 5; if (l.origem) s += 5;
  if (l.temInstagram) s += 5; if (l.temSite) s += 5; if (l.investeTrafego) s += 10;
  if (l.temperatura === 'quente') s += 15; else if (l.temperatura === 'morno') s += 5;
  return Math.min(s, 100);
};

const emptyLead = { nome: '', empresa: '', email: '', whatsapp: '', segmento: '', temperatura: 'morno', origem: '', faturamento: '', status: 'novo', temInstagram: false, temSite: false, investeTrafego: false, observacoes: '' };

export default function Leads() {
  const { leads, teamMembers, updateItem, addItem, deleteItem, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTemp, setFilterTemp] = useState('');
  const [filterOrigem, setFilterOrigem] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState(emptyLead);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = useMemo(() => leads.filter(l => {
    if (search && !l.nome.toLowerCase().includes(search.toLowerCase()) && !l.empresa.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterTemp && l.temperatura !== filterTemp) return false;
    if (filterOrigem && l.origem !== filterOrigem) return false;
    return true;
  }), [leads, search, filterStatus, filterTemp, filterOrigem]);

  const openCreate = () => { setEditingLead(null); setFormData(emptyLead); setShowModal(true); };
  const openEdit = (lead) => { setEditingLead(lead); setFormData({ ...emptyLead, ...lead }); setShowModal(true); };

  const handleSave = () => {
    if (!formData.nome || !formData.empresa) { addToast('Nome e Empresa obrigatórios', 'error'); return; }
    const data = { ...formData, score: calcScore(formData) };
    if (editingLead) { updateItem('leads', editingLead.id, data); addToast('Lead atualizado!'); }
    else { addItem('leads', { ...data, dataEntrada: new Date().toISOString() }); addToast('Lead criado!'); }
    setShowModal(false);
  };

  const fmtPhone = (n) => (n || '').replace(/[\s\-\(\)\.]/g, '');

  const exportCSV = () => {
    const headers = 'Nome,Empresa,Email,WhatsApp,Status,Temperatura,Origem,Score\n';
    const rows = filtered.map(l => `"${l.nome}","${l.empresa}","${l.email}","${l.whatsapp}","${l.status}","${l.temperatura}","${l.origem}","${calcScore(l)}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `leads_foryoulab_${Date.now()}.csv`; a.click();
    addToast('CSV exportado!');
  };

  const origens = [...new Set(leads.map(l => l.origem).filter(Boolean))];

  return (
    <>
      <div className="page-header">
        <div><h2>Leads</h2><div className="breadcrumb">{filtered.length} leads encontrados</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={exportCSV}><Download size={14} /> CSV</button>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Novo Lead</button>
        </div>
      </div>
      <div className="page-body">
        <div className="search-bar">
          <div className="search-input-wrapper"><Search size={16} /><input placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="form-select" style={{ width: 130 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Status</option>{Object.entries(statusLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="form-select" style={{ width: 130 }} value={filterTemp} onChange={e => setFilterTemp(e.target.value)}>
            <option value="">Temperatura</option><option value="quente">🔥 Quente</option><option value="morno">⚡ Morno</option><option value="frio">❄️ Frio</option>
          </select>
          <select className="form-select" style={{ width: 130 }} value={filterOrigem} onChange={e => setFilterOrigem(e.target.value)}>
            <option value="">Origem</option>{origens.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="card">
          <table className="data-table">
            <thead><tr><th>Lead</th><th>Temp</th><th>Status</th><th>Origem</th><th>Score</th><th>Entrada</th><th>Ações</th></tr></thead>
            <tbody>
              {filtered.map(lead => {
                const score = calcScore(lead);
                return (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lead.nome}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{lead.empresa}</div>
                    </td>
                    <td><span style={{ fontSize: 16 }}>{tempIcons[lead.temperatura]}</span></td>
                    <td><span className={`badge ${statusBadge[lead.status]}`}>{statusLabels[lead.status]}</span></td>
                    <td style={{ fontSize: 12 }}>{lead.origem || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="progress-bar" style={{ width: 60, height: 6 }}>
                          <div className="progress-fill" style={{ width: `${score}%`, background: score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{score}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{lead.dataEntrada ? new Date(lead.dataEntrada).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {lead.whatsapp && <a href={`https://wa.me/55${fmtPhone(lead.whatsapp)}?text=Olá ${lead.nome}, tudo bem?`} target="_blank" rel="noopener" className="btn btn-sm btn-secondary" style={{ padding: '4px 6px' }} title="WhatsApp"><MessageSquare size={12} /></a>}
                        {lead.email && <a href={`mailto:${lead.email}?subject=foryou.lab - Proposta Comercial`} className="btn btn-sm btn-secondary" style={{ padding: '4px 6px' }} title="Email"><Mail size={12} /></a>}
                        {lead.whatsapp && <a href={`tel:${fmtPhone(lead.whatsapp)}`} className="btn btn-sm btn-secondary" style={{ padding: '4px 6px' }} title="Ligar"><Phone size={12} /></a>}
                        <button onClick={() => openEdit(lead)} className="btn btn-sm btn-secondary" style={{ padding: '4px 6px' }} title="Editar"><Edit2 size={12} /></button>
                        <button onClick={() => setDeleteConfirm(lead)} className="btn btn-sm btn-secondary" style={{ padding: '4px 6px', color: '#EF4444' }} title="Excluir"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state"><h4>Nenhum lead encontrado</h4><p>Ajuste os filtros ou crie um novo lead.</p><button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Novo Lead</button></div>}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingLead ? '✏️ Editar Lead' : '➕ Novo Lead'} size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>{editingLead ? 'Salvar' : 'Criar'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Empresa *</label><input className="form-input" value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">WhatsApp</label><input className="form-input" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Segmento</label><input className="form-input" value={formData.segmento} onChange={e => setFormData({...formData, segmento: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Faturamento</label><input className="form-input" value={formData.faturamento || ''} onChange={e => setFormData({...formData, faturamento: e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Temperatura</label>
            <select className="form-select" value={formData.temperatura} onChange={e => setFormData({...formData, temperatura: e.target.value})}>
              <option value="quente">🔥 Quente</option><option value="morno">⚡ Morno</option><option value="frio">❄️ Frio</option>
            </select></div>
          <div className="form-group"><label className="form-label">Origem</label>
            <select className="form-select" value={formData.origem} onChange={e => setFormData({...formData, origem: e.target.value})}>
              <option value="">Selecione...</option><option>Instagram</option><option>Google Ads</option><option>Indicação</option><option>WhatsApp</option><option>Site</option>
            </select></div>
        </div>
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          {[['temInstagram', 'Tem Instagram'], ['temSite', 'Tem Site'], ['investeTrafego', 'Investe em Tráfego']].map(([k, label]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={formData[k] || false} onChange={e => setFormData({...formData, [k]: e.target.checked})} style={{ accentColor: '#FFD600' }} />{label}
            </label>
          ))}
        </div>
        <div className="form-group"><label className="form-label">Observações</label><textarea className="form-textarea" value={formData.observacoes || ''} onChange={e => setFormData({...formData, observacoes: e.target.value})} /></div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="⚠️ Confirmar Exclusão" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => { deleteItem('leads', deleteConfirm.id); addToast('Lead excluído!', 'warning'); setDeleteConfirm(null); }}>Excluir</button></>}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Excluir <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm?.nome}</strong>? Ação irreversível.</p>
      </Modal>
    </>
  );
}
