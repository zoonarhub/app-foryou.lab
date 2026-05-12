import { useState } from 'react';
import { useApp } from '../data/store';
import { Search, Plus, Edit2, Trash2, Shield, Mail, Phone } from 'lucide-react';
import Modal from '../components/Modal';

const perfilBadge = { admin: 'badge-red', gestor: 'badge-blue', sdr: 'badge-yellow', operacional: 'badge-gray' };
const perfilLabel = { admin: 'Admin', gestor: 'Gestor', sdr: 'SDR', operacional: 'Operacional' };
const emptyMember = { nome: '', cargo: '', email: '', whatsapp: '', perfil: 'operacional', ativo: true, metaMensal: 0, metaAtingida: 0 };

export default function Team() {
  const { teamMembers, clients, tasks, leads, addItem, updateItem, deleteItem, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState(emptyMember);

  const filtered = teamMembers.filter(m => !search || m.nome.toLowerCase().includes(search.toLowerCase()));

  const getStats = (id) => ({
    clients: clients.filter(c => c.responsavel === id && c.status === 'ativo').length,
    tasks: tasks.filter(t => t.responsavel === id && t.status !== 'concluido').length,
    leads: leads.filter(l => l.responsavel === id).length,
  });

  const openCreate = () => { setEditingMember(null); setFormData(emptyMember); setShowModal(true); };
  const openEdit = (member) => { setEditingMember(member); setFormData({ ...emptyMember, ...member }); setShowModal(true); };

  const handleSave = () => {
    if (!formData.nome || !formData.cargo) { addToast('Nome e cargo obrigatórios', 'error'); return; }
    if (editingMember) { updateItem('teamMembers', editingMember.id, formData); addToast('Membro atualizado!'); }
    else { addItem('teamMembers', formData); addToast('Membro adicionado!'); }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Excluir este membro da equipe?')) {
      deleteItem('teamMembers', id);
      addToast('Membro removido', 'warning');
    }
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Equipe</h2><div className="breadcrumb">{teamMembers.length} membros</div></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Adicionar</button>
      </div>
      <div className="page-body">
        <div className="search-bar">
          <div className="search-input-wrapper"><Search size={16} /><input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(member => {
            const stats = getStats(member.id);
            const meta = member.metaMensal || 10;
            const atingido = member.metaAtingida || stats.clients;
            const pct = Math.min(Math.round((atingido / meta) * 100), 100);
            return (
              <div key={member.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                  <div className="avatar avatar-lg" style={{ background: member.perfil === 'admin' ? '#FFD600' : 'var(--gray-bg)', color: member.perfil === 'admin' ? '#0A0A0A' : 'var(--text-primary)' }}>
                    {member.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{member.nome}</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(member)} className="btn btn-sm btn-secondary" style={{ padding: '3px 6px' }}><Edit2 size={12} /></button>
                        <button onClick={() => handleDelete(member.id)} className="btn btn-sm btn-secondary" style={{ padding: '3px 6px', color: 'var(--red)', borderColor: 'var(--card-border)' }}><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{member.cargo}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center' }}>
                      <span className={`badge ${perfilBadge[member.perfil]}`} style={{ fontSize: 10 }}><Shield size={10} /> {perfilLabel[member.perfil]}</span>
                      <span className={`badge ${member.ativo !== false ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>{member.ativo !== false ? 'Ativo' : 'Inativo'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ padding: 8, background: 'var(--gray-bg)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{stats.clients}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Clientes</div>
                  </div>
                  <div style={{ padding: 8, background: 'var(--gray-bg)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{stats.tasks}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Tarefas</div>
                  </div>
                  <div style={{ padding: 8, background: 'var(--gray-bg)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{stats.leads}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Leads</div>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Meta do mês</span>
                    <span style={{ fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                </div>
                <div style={{ display: 'flex', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                  {member.email && <a href={`mailto:${member.email}`} style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 2 }}><Mail size={11} /> {member.email}</a>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingMember ? '✏️ Editar Membro' : '➕ Novo Membro'} size="md"
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Salvar</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Cargo *</label><input className="form-input" value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">WhatsApp</label><input className="form-input" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Perfil de Acesso</label>
            <select className="form-select" value={formData.perfil} onChange={e => setFormData({...formData, perfil: e.target.value})}>
              <option value="admin">Admin — acesso total</option>
              <option value="gestor">Gestor — clientes, projetos, relatórios</option>
              <option value="sdr">SDR — leads e CRM</option>
              <option value="operacional">Operacional — tarefas e relatórios</option>
            </select></div>
          <div className="form-group"><label className="form-label">Meta Mensal</label><input className="form-input" type="number" value={formData.metaMensal || ''} onChange={e => setFormData({...formData, metaMensal: Number(e.target.value)})} /></div>
        </div>
        <div style={{ marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={formData.ativo !== false} onChange={e => setFormData({...formData, ativo: e.target.checked})} style={{ accentColor: '#FFD600' }} /> Membro ativo
          </label>
        </div>
      </Modal>
    </>
  );
}
