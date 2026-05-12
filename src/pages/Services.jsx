import { useState } from 'react';
import { useApp } from '../data/store';
import { Plus, Search, Edit2, Trash2, Box, Package } from 'lucide-react';
import Modal from '../components/Modal';

const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function Services() {
  const { services, addItem, updateItem, deleteItem, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [formData, setFormData] = useState({ nome: '', descricao: '', preco: 0 });

  const filtered = (services || []).filter(s => !search || s.nome.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditingService(null); setFormData({ nome: '', descricao: '', preco: 0 }); setShowModal(true); };
  const openEdit = (s) => { setEditingService(s); setFormData({ ...s }); setShowModal(true); };

  const handleSave = () => {
    if (!formData.nome || formData.preco <= 0) { addToast('Nome e preço são obrigatórios', 'error'); return; }
    
    if (editingService) {
      updateItem('services', editingService.id, formData);
      addToast('Serviço atualizado!');
    } else {
      addItem('services', formData);
      addToast('Serviço criado!');
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      deleteItem('services', id);
      addToast('Serviço excluído', 'warning');
    }
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Serviços e Planos</h2><div className="breadcrumb">Gerencie os serviços oferecidos pela agência</div></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Novo Serviço</button>
      </div>

      <div className="page-body">
        <div className="search-bar">
          <div className="search-input-wrapper"><Search size={16} /><input placeholder="Buscar serviço..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>

        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome do Serviço</th>
                <th>Descrição</th>
                <th>Preço Base</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td><div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Box size={14} className="text-yellow" /> {s.nome}</div></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.descricao || '—'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fmt(s.preco)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}><Edit2 size={12} /></button>
                      <button className="btn btn-sm btn-secondary" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => handleDelete(s.id)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Package size={48} />
              <h4>Nenhum serviço</h4>
              <p>Comece a cadastrar os serviços e planos da sua agência.</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingService ? 'Editar Serviço' : 'Novo Serviço'} footer={
        <><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Salvar</button></>
      }>
        <div className="form-group">
          <label className="form-label">Nome do Serviço *</label>
          <input className="form-input" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Gestão de Tráfego" />
        </div>
        <div className="form-group">
          <label className="form-label">Descrição</label>
          <textarea className="form-textarea" value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} placeholder="O que está incluso neste serviço..." />
        </div>
        <div className="form-group">
          <label className="form-label">Preço Base (R$) *</label>
          <input type="number" className="form-input" value={formData.preco} onChange={e => setFormData({ ...formData, preco: Number(e.target.value) })} min={0} />
        </div>
      </Modal>
    </>
  );
}
