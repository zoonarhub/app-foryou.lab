import { useState, useMemo } from 'react';
import { useApp } from '../data/store';
import { Search, Plus, Filter, Edit2, Trash2, Eye, DollarSign, X, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';

const columns = [
  { id: 'novo', title: 'Novo Lead', color: '#9CA3AF' },
  { id: 'contato_feito', title: 'Contato', color: '#3B82F6' },
  { id: 'reuniao', title: 'Reunião', color: '#8B5CF6' },
  { id: 'proposta', title: 'Proposta', color: '#F59E0B' },
  { id: 'fechado', title: 'Fechado ✅', color: '#22C55E' },
  { id: 'perdido', title: 'Perdido', color: '#EF4444' },
];

const tempIcons = { quente: '🔥', morno: '⚡', frio: '❄️' };
const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v);

const calcScore = (l) => {
  let s = 0;
  if (l.nome) s += 5; if (l.empresa) s += 5; if (l.email) s += 5; if (l.whatsapp) s += 10;
  if (l.segmento) s += 5;
  
  // Pontuação por Faturamento
  const f = String(l.faturamento || '').toLowerCase();
  if (f.includes('200k') || f.includes('mais')) s += 30;
  else if (f.includes('80k')) s += 20;
  else if (f.includes('30k')) s += 10;

  // Pontuação por Estrutura
  if (l.temInstagram) s += 5; 
  if (l.temSite) s += 5; 
  if (l.investeTrafego) s += 10;
  if (l.temEquipeVendas) s += 10;
  if (l.usaCRM) s += 5;

  if (l.temperatura === 'quente') s += 10;
  return Math.min(s, 100);
};

const emptyLead = { 
  nome: '', empresa: '', email: '', whatsapp: '', segmento: '', 
  cidade: '', estado: '', faturamento: '', tamanhoNegocio: '',
  responsavel: '', status: 'novo', temperatura: 'morno', origem: '', 
  valorEstimado: 0, servicos: '', observacoes: '', desafio: '',
  temInstagram: false, temSite: false, investeTrafego: false, 
  temEquipeVendas: false, usaCRM: false, infoComplementar: false
};

export default function CRMPipeline() {
  const { leads, teamMembers, updateItem, addItem, deleteItem, addToast } = useApp();
  const [draggedItem, setDraggedItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTemp, setFilterTemp] = useState('');
  const [filterResp, setFilterResp] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState(emptyLead);
  const [showDetail, setShowDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = useMemo(() => leads.filter(l => {
    if (search && !l.nome?.toLowerCase().includes(search.toLowerCase()) && !l.empresa?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTemp && l.temperatura !== filterTemp) return false;
    if (filterResp && l.responsavel !== filterResp) return false;
    return true;
  }), [leads, search, filterTemp, filterResp]);

  const getDaysSince = (dateStr) => {
    if (!dateStr) return 0;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    if (draggedItem) {
      updateItem('leads', draggedItem.id, { status: colId });
      addToast(`${draggedItem.nome} → ${columns.find(c => c.id === colId)?.title}`);
      setDraggedItem(null);
    }
  };

  const openCreate = () => { setEditingLead(null); setFormData(emptyLead); setShowModal(true); };
  const openEdit = (lead) => { setEditingLead(lead); setFormData({ ...emptyLead, ...lead }); setShowModal(true); };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.nome || !formData.empresa) { addToast('Nome e Empresa são obrigatórios', 'error'); return; }
    if (isSaving) return;
    setIsSaving(true);
    try {
      const data = { ...formData, score: calcScore(formData) };
      if (editingLead) {
        await updateItem('leads', editingLead.id, data);
        addToast('Lead atualizado!');
      } else {
        await addItem('leads', { ...data, dataEntrada: new Date().toISOString() });
        addToast('Lead criado com sucesso!');
      }
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    deleteItem('leads', id);
    addToast('Lead excluído!', 'warning');
    setDeleteConfirm(null);
  };

  return (
    <>
      <div className="page-header">
        <div><h2>CRM — Pipeline</h2><div className="breadcrumb">Gestão de leads e oportunidades</div></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Novo Lead</button>
      </div>
      <div className="page-body">
        <div className="search-bar">
          <div className="search-input-wrapper"><Search size={16} /><input placeholder="Buscar por nome ou empresa..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="form-select" style={{ width: 150 }} value={filterTemp} onChange={e => setFilterTemp(e.target.value)}>
            <option value="">Temperatura</option>
            <option value="quente">🔥 Quente</option><option value="morno">⚡ Morno</option><option value="frio">❄️ Frio</option>
          </select>
          <select className="form-select" style={{ width: 160 }} value={filterResp} onChange={e => setFilterResp(e.target.value)}>
            <option value="">Responsável</option>
            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.nome.split(' ')[0]}</option>)}
          </select>
        </div>

        <div className="kanban-board">
          {columns.map(col => {
            const colItems = filtered.filter(l => l.status === col.id);
            const colTotal = colItems.reduce((s, l) => s + (Number(l.valorEstimado) || 0), 0);
            return (
              <div key={col.id} className="kanban-column" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, col.id)}>
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                    {col.title}<span className="kanban-column-count">{colItems.length}</span>
                  </div>
                  {colTotal > 0 && <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 700 }}>{fmt(colTotal)}</span>}
                </div>
                {colItems.map(lead => {
                  const days = getDaysSince(lead.dataEntrada);
                  const stale = days > 3 && col.id !== 'fechado' && col.id !== 'perdido';
                  const member = teamMembers.find(m => m.id === lead.responsavel);
                  return (
                    <div key={lead.id} className="kanban-card" draggable onDragStart={() => setDraggedItem(lead)}
                      style={{ borderColor: stale ? '#EF4444' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{lead.nome}</span>
                        <span style={{ fontSize: 14 }}>{tempIcons[lead.temperatura]}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{lead.empresa}</div>
                      {lead.valorEstimado > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', marginBottom: 6 }}>{fmt(lead.valorEstimado)}</div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: stale ? '#EF4444' : 'var(--text-secondary)' }}>
                          {stale ? '⚠️' : '📅'} {days}d atrás
                        </div>
                        {member && <div className="avatar avatar-sm">{member.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 8, borderTop: '1px solid var(--card-border)', paddingTop: 8 }}>
                        <button onClick={() => setShowDetail(lead)} className="btn btn-sm btn-secondary" style={{ padding: '3px 6px', flex: 1 }}><Eye size={12} /></button>
                        <button onClick={() => openEdit(lead)} className="btn btn-sm btn-secondary" style={{ padding: '3px 6px', flex: 1 }}><Edit2 size={12} /></button>
                        <button onClick={() => setDeleteConfirm(lead)} className="btn btn-sm btn-secondary" style={{ padding: '3px 6px', flex: 1, color: '#EF4444' }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })}
                {colItems.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', opacity: .5 }}>Sem leads</div>}
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingLead ? '✏️ Editar Lead' : '➕ Novo Lead'} size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Cancelar</button><button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvando...' : (editingLead ? 'Salvar' : 'Criar Lead')}</button></>}>
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
          <div className="form-group"><label className="form-label">Faturamento Mensal</label><input className="form-input" value={formData.faturamento || ''} onChange={e => setFormData({...formData, faturamento: e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Cidade</label><input className="form-input" value={formData.cidade || ''} onChange={e => setFormData({...formData, cidade: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Estado</label><input className="form-input" value={formData.estado || ''} onChange={e => setFormData({...formData, estado: e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Valor Estimado (R$)</label><input className="form-input" type="number" value={formData.valorEstimado} onChange={e => setFormData({...formData, valorEstimado: Number(e.target.value)})} /></div>
          <div className="form-group"><label className="form-label">Tamanho do Negócio</label>
            <select className="form-select" value={formData.tamanhoNegocio || ''} onChange={e => setFormData({...formData, tamanhoNegocio: e.target.value})}>
              <option value="">Selecione...</option>
              <option value="individual">Individual / Autônomo</option>
              <option value="pequeno">Pequena Empresa (1-10)</option>
              <option value="medio">Média Empresa (11-50)</option>
              <option value="grande">Grande Empresa (50+)</option>
            </select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Temperatura</label>
            <select className="form-select" value={formData.temperatura} onChange={e => setFormData({...formData, temperatura: e.target.value})}>
              <option value="quente">🔥 Quente</option><option value="morno">⚡ Morno</option><option value="frio">❄️ Frio</option>
            </select></div>
          <div className="form-group"><label className="form-label">Origem</label>
            <select className="form-select" value={formData.origem} onChange={e => setFormData({...formData, origem: e.target.value})}>
              <option value="">Selecione...</option><option>Instagram</option><option>Google Ads</option><option>Indicação</option><option>WhatsApp</option><option>Site</option><option>Outro</option>
            </select></div>
        </div>
        <div className="form-group"><label className="form-label">Responsável</label>
          <select className="form-select" value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})}>
            <option value="">Selecione...</option>{teamMembers.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select></div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 16, marginTop: 8 }}>
          {[['temInstagram', 'Instagram'], ['temSite', 'Site'], ['investeTrafego', 'Tráfego'], ['temEquipeVendas', 'Equipe Vendas'], ['usaCRM', 'Usa CRM'], ['infoComplementar', 'Info Comp.']].map(([k, label]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={formData[k] || false} onChange={e => setFormData({...formData, [k]: e.target.checked})} style={{ accentColor: '#FFD600' }} />{label}
            </label>
          ))}
        </div>

        <div className="form-group"><label className="form-label">Qual o maior desafio hoje?</label><textarea className="form-textarea" rows={2} value={formData.desafio || ''} onChange={e => setFormData({...formData, desafio: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">Observações Internas</label><textarea className="form-textarea" value={formData.observacoes || ''} onChange={e => setFormData({...formData, observacoes: e.target.value})} /></div>
      </Modal>

      {/* Detail Drawer */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', right: 0, top: 0, width: 420, height: '100vh', background: 'var(--card-bg)', borderLeft: '1px solid var(--card-border)', padding: 24, overflowY: 'auto', animation: 'slideInRight .3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>{showDetail.nome}</h3>
              <button onClick={() => setShowDetail(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span className="badge badge-yellow">{tempIcons[showDetail.temperatura]} {showDetail.temperatura}</span>
              <span className={`badge ${columns.find(c=>c.id===showDetail.status)?.color === '#22C55E' ? 'badge-green' : 'badge-blue'}`}>{columns.find(c=>c.id===showDetail.status)?.title}</span>
              {showDetail.score && <span className="badge badge-gray">Score: {showDetail.score}</span>}
            </div>
            
            {[
              ['Empresa', showDetail.empresa], 
              ['Email', showDetail.email], 
              ['WhatsApp', showDetail.whatsapp], 
              ['Segmento', showDetail.segmento], 
              ['Faturamento', showDetail.faturamento],
              ['Cidade/UF', `${showDetail.cidade || '—'}${showDetail.estado ? `/${showDetail.estado}` : ''}`],
              ['Tamanho', showDetail.tamanhoNegocio],
              ['Origem', showDetail.origem], 
              ['Valor Estimado', showDetail.valorEstimado ? fmt(showDetail.valorEstimado) : '—'], 
              ['Entrada', showDetail.dataEntrada ? new Date(showDetail.dataEntrada).toLocaleDateString('pt-BR') : '—']
            ].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--card-border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{k}</span><span style={{ fontWeight: 600 }}>{v || '—'}</span>
              </div>
            ))}

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Estrutura & Info:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {showDetail.temInstagram && <span className="badge badge-blue">Instagram</span>}
                {showDetail.temSite && <span className="badge badge-blue">Site</span>}
                {showDetail.investeTrafego && <span className="badge badge-blue">Tráfego</span>}
                {showDetail.temEquipeVendas && <span className="badge badge-blue">Equipe Vendas</span>}
                {showDetail.usaCRM && <span className="badge badge-blue">Usa CRM</span>}
              </div>
            </div>

            {showDetail.desafio && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Desafio:</div>
                <div style={{ padding: 12, background: 'var(--gray-bg)', borderRadius: 8, fontSize: 13 }}>{showDetail.desafio}</div>
              </div>
            )}

            {showDetail.observacoes && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Observações:</div>
                <div style={{ padding: 12, background: 'var(--gray-bg)', borderRadius: 8, fontSize: 13 }}>{showDetail.observacoes}</div>
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => { setShowDetail(null); openEdit(showDetail); }}>✏️ Editar</button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { const n = (showDetail.whatsapp||'').replace(/\D/g,''); window.open(`https://wa.me/55${n}?text=Olá ${showDetail.nome}, tudo bem?`); }}>💬 WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="⚠️ Confirmar Exclusão" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Excluir</button></>}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Tem certeza que deseja excluir <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm?.nome}</strong>? Esta ação não pode ser desfeita.</p>
      </Modal>
    </>
  );
}
