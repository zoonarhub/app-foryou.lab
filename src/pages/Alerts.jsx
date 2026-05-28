import { useState, useMemo } from 'react';
import { useApp } from '../data/store';
import { AlertTriangle, Plus, CheckCircle, Filter, User } from 'lucide-react';
import Modal from '../components/Modal';

export default function Alerts() {
  const { alerts, teamMembers, auth, addItem, updateItem, addToast } = useApp();
  const [filterStatus, setFilterStatus] = useState('aberto');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New alert form state
  const [newAlert, setNewAlert] = useState({ title: '', desc: '', priority: 'media', type: 'manual', assignedTo: '' });

  // Current user role
  const currentUser = teamMembers.find(tm => tm.email === auth?.email);
  const isAdmin = currentUser?.perfil === 'admin' || currentUser?.cargo === 'CEO';

  const visibleAlerts = useMemo(() => {
    return alerts.filter(a => {
      // 1. Status filter
      if (a.status !== filterStatus) return false;
      // 2. Type filter
      if (filterType && a.type !== filterType) return false;
      // 3. Assignment filter: if not admin, only see assigned to me or unassigned
      if (!isAdmin && a.assignedTo !== currentUser?.id) return false;
      return true;
    }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [alerts, filterStatus, filterType, isAdmin, currentUser]);

  const prioColor = { alta: '#EF4444', media: '#F59E0B', baixa: '#3B82F6' };
  const prioBg = { alta: 'rgba(239,68,68,.1)', media: 'rgba(245,158,11,.1)', baixa: 'rgba(59,130,246,.1)' };

  const handleResolve = (id) => {
    updateItem('alerts', id, { status: 'resolvido', resolved_at: new Date().toISOString() });
    addToast('Alerta resolvido com sucesso!');
  };

  const handleReopen = (id) => {
    updateItem('alerts', id, { status: 'aberto', resolved_at: null });
    addToast('Alerta reaberto!');
  };

  const handleCreate = async () => {
    if (!newAlert.title) { addToast('Preencha o título', 'error'); return; }
    try {
      await addItem('alerts', {
        ...newAlert,
        status: 'aberto',
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || auth?.email
      });
      addToast('Alerta criado com sucesso!');
      setShowModal(false);
      setNewAlert({ title: '', desc: '', priority: 'media', type: 'manual', assignedTo: '' });
    } catch (error) {
      console.error("Erro ao criar alerta:", error);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Alertas Inteligentes</h2>
          <div className="breadcrumb">{visibleAlerts.length} alertas encontrados</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--gray-bg)', padding: 4, borderRadius: 8 }}>
            <button className={`btn btn-sm ${filterStatus === 'aberto' ? 'btn-primary' : ''}`} onClick={() => setFilterStatus('aberto')} style={{ background: filterStatus === 'aberto' ? 'var(--card-bg)' : 'transparent', border: 'none' }}>Abertos</button>
            <button className={`btn btn-sm ${filterStatus === 'resolvido' ? 'btn-primary' : ''}`} onClick={() => setFilterStatus('resolvido')} style={{ background: filterStatus === 'resolvido' ? 'var(--card-bg)' : 'transparent', border: 'none' }}>Resolvidos</button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Novo Alerta
          </button>
        </div>
      </div>

      <div className="page-body">
        {visibleAlerts.length === 0 ? (
          <div className="card empty-state">
            <CheckCircle size={48} />
            <h4>Tudo tranquilo!</h4>
            <p>Nenhum alerta {filterStatus} encontrado para você.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleAlerts.map(alert => (
              <div key={alert.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, borderLeft: `4px solid ${prioColor[alert.priority]}` }}>
                <div style={{ fontSize: 24 }}>{alert.type === 'manual' ? '📝' : '⚠️'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, color: 'var(--text-primary)' }}>{alert.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{alert.desc}</div>
                </div>
                
                {/* Assignee Badge */}
                {alert.assignedTo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, background: 'var(--gray-bg)', padding: '4px 8px', borderRadius: 12, color: 'var(--text-secondary)' }}>
                    <User size={12} /> {teamMembers.find(t => t.id === alert.assignedTo)?.nome || 'Usuário'}
                  </div>
                )}

                <span className="badge" style={{ background: prioBg[alert.priority], color: prioColor[alert.priority], fontSize: 10 }}>{alert.priority}</span>
                
                {alert.status === 'aberto' ? (
                  <button onClick={() => handleResolve(alert.id)} className="btn btn-sm btn-secondary" style={{ color: '#22C55E', borderColor: '#22C55E' }}>✓ Resolver</button>
                ) : (
                  <button onClick={() => handleReopen(alert.id)} className="btn btn-sm btn-secondary">Reabrir</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Criar Novo Alerta"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleCreate}>Criar Alerta</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Título do Alerta</label>
          <input className="form-input" value={newAlert.title} onChange={e => setNewAlert({...newAlert, title: e.target.value})} placeholder="Ex: Cliente X solicitou cancelamento" />
        </div>
        <div className="form-group">
          <label className="form-label">Descrição</label>
          <textarea className="form-input" value={newAlert.desc} onChange={e => setNewAlert({...newAlert, desc: e.target.value})} placeholder="Detalhes do alerta..." rows={3} />
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Prioridade</label>
            <select className="form-select" value={newAlert.priority} onChange={e => setNewAlert({...newAlert, priority: e.target.value})}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Atribuir para</label>
            <select className="form-select" value={newAlert.assignedTo} onChange={e => setNewAlert({...newAlert, assignedTo: e.target.value})}>
              <option value="">(Ninguém)</option>
              {teamMembers.map(tm => (
                <option key={tm.id} value={tm.id}>{tm.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </>
  );
}
