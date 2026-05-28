import { useState, useMemo } from 'react';
import { useApp } from '../data/store';
import { Search, Plus, Edit2, Trash2, Calendar, List, LayoutGrid, PlusCircle } from 'lucide-react';
import Modal from '../components/Modal';

const statusCols = [
  { id: 'a_fazer', title: 'A Fazer', color: '#9CA3AF' },
  { id: 'em_andamento', title: 'Em Andamento', color: '#3B82F6' },
  { id: 'em_revisao', title: 'Em Revisão', color: '#F59E0B' },
  { id: 'concluido', title: 'Concluído', color: '#22C55E' },
];
const prioColors = { alta: '#EF4444', media: '#F59E0B', baixa: '#22C55E' };
const prioLabels = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
const emptyProject = { titulo: '', clienteId: '', descricao: '', responsavel: '', prazo: '', prioridade: 'media', status: 'a_fazer', progresso: 0 };
const emptyTask = { titulo: '', responsavel: '', prazo: '', prioridade: 'media', status: 'a_fazer', projetoId: '' };

export default function Projects() {
  const { projects, tasks, clients, teamMembers, addItem, updateItem, deleteItem, getClient, getTeamMember, addToast } = useApp();
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyProject);
  const [formType, setFormType] = useState('projeto');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const allItems = useMemo(() => [
    ...projects.map(p => ({ ...p, tipo: 'projeto' })),
    ...tasks.map(t => ({ ...t, tipo: 'tarefa' }))
  ].filter(i => {
    if (search && !i.titulo.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterClient && i.clienteId !== filterClient) return false;
    return true;
  }), [projects, tasks, search, filterClient]);

  const handleDrop = (e, colId) => {
    e.preventDefault();
    if (!draggedItem) return;
    const key = draggedItem.tipo === 'projeto' ? 'projects' : 'tasks';
    updateItem(key, draggedItem.id, { status: colId });
    addToast(`${draggedItem.titulo} → ${statusCols.find(c => c.id === colId)?.title}`);
    setDraggedItem(null);
  };

  const openCreate = (type = 'projeto') => { setFormType(type); setEditingItem(null); setFormData(type === 'projeto' ? emptyProject : emptyTask); setShowModal(true); };
  const openEdit = (item) => { setFormType(item.tipo); setEditingItem(item); setFormData({ ...item }); setShowModal(true); };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.titulo) { addToast('Título obrigatório', 'error'); return; }
    if (isSaving) return;
    setIsSaving(true);
    try {
      const key = formType === 'projeto' ? 'projects' : 'tasks';
      if (editingItem) { await updateItem(key, editingItem.id, formData); addToast(`${formType === 'projeto' ? 'Projeto' : 'Tarefa'} atualizado!`); }
      else { await addItem(key, formData); addToast(`${formType === 'projeto' ? 'Projeto' : 'Tarefa'} criado!`); }
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao salvar projeto/tarefa:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    const key = deleteConfirm.tipo === 'projeto' ? 'projects' : 'tasks';
    deleteItem(key, deleteConfirm.id);
    addToast('Excluído!', 'warning');
    setDeleteConfirm(null);
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Projetos e Tarefas</h2><div className="breadcrumb">{allItems.length} itens</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${view === 'kanban' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('kanban')}><LayoutGrid size={14} /></button>
          <button className={`btn btn-sm ${view === 'lista' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('lista')}><List size={14} /></button>
          <button className="btn btn-secondary btn-sm" onClick={() => openCreate('tarefa')}><PlusCircle size={14} /> Tarefa</button>
          <button className="btn btn-primary" onClick={() => openCreate('projeto')}><Plus size={16} /> Projeto</button>
        </div>
      </div>
      <div className="page-body">
        <div className="search-bar">
          <div className="search-input-wrapper"><Search size={16} /><input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="form-select" style={{ width: 160 }} value={filterClient} onChange={e => setFilterClient(e.target.value)}>
            <option value="">Todos os clientes</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
          </select>
        </div>

        {view === 'kanban' ? (
          <div className="kanban-board">
            {statusCols.map(col => {
              const colItems = allItems.filter(i => i.status === col.id);
              return (
                <div key={col.id} className="kanban-column" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, col.id)}>
                  <div className="kanban-column-header">
                    <div className="kanban-column-title"><span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />{col.title}<span className="kanban-column-count">{colItems.length}</span></div>
                  </div>
                  {colItems.map(item => {
                    const client = getClient(item.clienteId);
                    const member = getTeamMember(item.responsavel);
                    return (
                      <div key={item.id + item.tipo} className="kanban-card" draggable onDragStart={() => setDraggedItem(item)} onClick={() => openEdit(item)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.titulo}</span>
                          <span className="badge" style={{ background: prioColors[item.prioridade] + '20', color: prioColors[item.prioridade], fontSize: 10 }}>{prioLabels[item.prioridade]}</span>
                        </div>
                        {client && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{client.empresa}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}><Calendar size={11} /> {item.prazo ? new Date(item.prazo).toLocaleDateString('pt-BR') : '—'}</span>
                          {member && <div className="avatar avatar-sm" title={member.nome}>{member.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>}
                        </div>
                        {item.progresso !== undefined && <div className="progress-bar" style={{ marginTop: 8, height: 4 }}><div className="progress-fill" style={{ width: `${item.progresso}%` }} /></div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card"><table className="data-table">
            <thead><tr><th>Título</th><th>Tipo</th><th>Cliente</th><th>Status</th><th>Prioridade</th><th>Prazo</th><th>Ações</th></tr></thead>
            <tbody>{allItems.map(item => {
              const client = getClient(item.clienteId);
              const col = statusCols.find(c => c.id === item.status);
              return (
                <tr key={item.id + item.tipo}>
                  <td style={{ fontWeight: 600 }}>{item.titulo}</td>
                  <td><span className={`badge ${item.tipo === 'projeto' ? 'badge-yellow' : 'badge-gray'}`}>{item.tipo}</span></td>
                  <td style={{ fontSize: 12 }}>{client?.empresa || '—'}</td>
                  <td><span className="badge" style={{ background: col?.color + '20', color: col?.color }}>{col?.title}</span></td>
                  <td><span style={{ color: prioColors[item.prioridade] }}>●</span> {prioLabels[item.prioridade]}</td>
                  <td style={{ fontSize: 12 }}>{item.prazo ? new Date(item.prazo).toLocaleDateString('pt-BR') : '—'}</td>
                  <td><div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(item)} className="btn btn-sm btn-secondary" style={{ padding: '4px 6px' }}><Edit2 size={12} /></button>
                    <button onClick={() => setDeleteConfirm(item)} className="btn btn-sm btn-secondary" style={{ padding: '4px 6px', color: '#EF4444' }}><Trash2 size={12} /></button>
                  </div></td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? `✏️ Editar ${formType}` : `➕ Novo ${formType}`} size="md"
        footer={<><div style={{ flex: 1 }}>{editingItem && <button className="btn btn-sm btn-secondary" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => setDeleteConfirm(editingItem)}><Trash2 size={12} /> Excluir</button>}</div><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Salvar</button></>}>
        <div className="form-group"><label className="form-label">Título *</label><input className="form-input" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Cliente</label>
            <select className="form-select" value={formData.clienteId} onChange={e => setFormData({...formData, clienteId: e.target.value})}>
              <option value="">Selecione...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Responsável</label>
            <select className="form-select" value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})}>
              <option value="">Selecione...</option>{teamMembers.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Prazo</label><input className="form-input" type="date" value={formData.prazo || ''} onChange={e => setFormData({...formData, prazo: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Prioridade</label>
            <select className="form-select" value={formData.prioridade} onChange={e => setFormData({...formData, prioridade: e.target.value})}>
              <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
            </select></div>
        </div>
        <div className="form-group"><label className="form-label">Descrição</label><textarea className="form-textarea" value={formData.descricao || ''} onChange={e => setFormData({...formData, descricao: e.target.value})} /></div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="⚠️ Confirmar Exclusão" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button><button className="btn btn-danger" onClick={handleDelete}>Excluir</button></>}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Excluir <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm?.titulo}</strong>? Ação irreversível.</p>
      </Modal>
    </>
  );
}
