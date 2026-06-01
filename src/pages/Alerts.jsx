import { useState, useMemo } from 'react';
import { useApp } from '../data/store';
import { 
  AlertTriangle, Plus, CheckCircle, Filter, User, 
  Calendar, DollarSign, Briefcase, CheckSquare, Bell, 
  Play, Trash2, Clock, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import Modal from '../components/Modal';
import axios from 'axios';

export default function Alerts() {
  const { 
    alerts, teamMembers, auth, addItem, updateItem, deleteItem, addToast,
    projects, tasks, financials, clients, googleAccessToken, googleEvents, playBellSound 
  } = useApp();

  const [activeTab, setActiveTab] = useState('all'); // all, manual, system, google
  const [filterPriority, setFilterPriority] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New alert form state
  const [newAlert, setNewAlert] = useState({ 
    title: '', desc: '', priority: 'media', assignedTo: '', 
    prazo: '', moduloRelacionado: 'manual', itemRelacionadoId: '', 
    sincronizarGCal: false 
  });

  const [isSaving, setIsSaving] = useState(false);

  // Current user
  const currentUser = teamMembers.find(tm => tm.email === auth?.email);
  const isAdmin = currentUser?.perfil === 'admin' || currentUser?.cargo === 'CEO';

  // 1. Compile derived system alerts & Google Calendar alerts
  const derivedAlerts = useMemo(() => {
    const list = [];

    // Projects
    (projects || []).forEach(p => {
      if (p.status !== 'concluido' && p.prazo) {
        list.push({
          id: `project-${p.id}`,
          title: `Prazo do Projeto: ${p.titulo}`,
          desc: p.descricao || 'Sem descrição.',
          priority: p.prioridade || 'media',
          prazo: p.prazo,
          source: 'projeto',
          status: 'aberto',
          assignedTo: p.responsavel || '',
          original: p
        });
      }
    });

    // Tasks
    (tasks || []).forEach(t => {
      if (t.status !== 'concluido' && t.prazo) {
        list.push({
          id: `task-${t.id}`,
          title: `Prazo da Tarefa: ${t.titulo}`,
          desc: 'Tarefa de projeto pendente.',
          priority: t.prioridade || 'media',
          prazo: t.prazo,
          source: 'tarefa',
          status: 'aberto',
          assignedTo: t.responsavel || '',
          original: t
        });
      }
    });

    // Financials
    (financials || []).forEach(f => {
      if ((f.status === 'pendente' || f.status === 'atrasado') && f.dataVencimento) {
        list.push({
          id: `financial-${f.id}`,
          title: `Vencimento: ${f.descricao}`,
          desc: `Valor: R$ ${f.valor} • Categoria: ${f.categoria || 'Sem categoria'}`,
          priority: f.status === 'atrasado' ? 'alta' : 'media',
          prazo: f.dataVencimento.includes('T') ? f.dataVencimento : `${f.dataVencimento}T09:00:00`,
          source: 'financeiro',
          status: 'aberto',
          assignedTo: '',
          original: f
        });
      }
    });

    // Google Calendar Events
    (googleEvents || []).forEach(e => {
      if (e.start && (e.start.dateTime || e.start.date)) {
        list.push({
          id: `gcal-${e.id}`,
          title: `Google Agenda: ${e.summary}`,
          desc: e.description || e.location || 'Sem descrição adicional.',
          priority: 'media',
          prazo: e.start.dateTime || `${e.start.date}T09:00:00`,
          source: 'gcal',
          status: 'aberto',
          assignedTo: '',
          original: e
        });
      }
    });

    return list;
  }, [projects, tasks, financials, googleEvents]);

  // Combine manual & derived alerts
  const allUnifiedAlerts = useMemo(() => {
    const manuals = (alerts || []).map(a => ({
      id: a.id,
      title: a.title,
      desc: a.desc,
      priority: a.priority || 'media',
      prazo: a.prazo || '',
      source: 'manual',
      status: a.status || 'aberto',
      assignedTo: a.assignedTo || '',
      googleEventId: a.googleEventId || '',
      original: a
    }));

    return [...manuals, ...derivedAlerts];
  }, [alerts, derivedAlerts]);

  // Filter alerts by active tab, priority, and permissions
  const filteredAlerts = useMemo(() => {
    return allUnifiedAlerts.filter(a => {
      // Tab filter
      if (activeTab === 'manual' && a.source !== 'manual') return false;
      if (activeTab === 'system' && !['projeto', 'tarefa', 'financeiro'].includes(a.source)) return false;
      if (activeTab === 'google' && a.source !== 'gcal') return false;

      // Priority filter
      if (filterPriority && a.priority !== filterPriority) return false;

      // Assignment permission filter
      if (!isAdmin && a.assignedTo && a.assignedTo !== currentUser?.id) return false;

      return true;
    }).sort((a, b) => {
      // Status aberto first, then sort by deadline prazo
      if (a.status !== b.status) return a.status === 'aberto' ? -1 : 1;
      return new Date(a.prazo || 0) - new Date(b.prazo || 0);
    });
  }, [allUnifiedAlerts, activeTab, filterPriority, isAdmin, currentUser]);

  const prioColor = { alta: '#EF4444', media: '#F59E0B', baixa: '#3B82F6' };
  const prioBg = { alta: 'rgba(239,68,68,.1)', media: 'rgba(245,158,11,.1)', baixa: 'rgba(59,130,246,.1)' };
  
  const sourceBadge = {
    manual: { icon: '📝', label: 'Manual', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
    projeto: { icon: '📁', label: 'Projeto', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    tarefa: { icon: '⚙️', label: 'Tarefa', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    financeiro: { icon: '💳', label: 'Financeiro', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    gcal: { icon: '📅', label: 'Google Agenda', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' }
  };

  const handleResolve = async (alert) => {
    if (alert.source !== 'manual') {
      addToast('Este alerta provém de outro módulo. Vá ao módulo de origem para concluir.', 'info');
      return;
    }
    await updateItem('alerts', alert.id, { status: 'resolvido', resolved_at: new Date().toISOString() });
    addToast('Alerta resolvido com sucesso!');
  };

  const handleReopen = async (alert) => {
    if (alert.source !== 'manual') return;
    await updateItem('alerts', alert.id, { status: 'aberto', resolved_at: null });
    addToast('Alerta reaberto!');
  };

  const handleDelete = async (alert) => {
    if (alert.source !== 'manual') return;
    
    // If synced with Google Calendar, attempt to delete there first
    if (alert.googleEventId && googleAccessToken) {
      try {
        await axios.delete(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${alert.googleEventId}`,
          { headers: { Authorization: `Bearer ${googleAccessToken}` } }
        );
        console.log('[GCal] Event deleted successfully.');
      } catch (err) {
        console.warn('[GCal] Error deleting associated event:', err);
      }
    }
    
    await deleteItem('alerts', alert.id);
    addToast('Alerta manual excluído!', 'warning');
  };

  const handleCreate = async () => {
    if (!newAlert.title) { addToast('Preencha o título do alerta', 'error'); return; }
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      const payload = {
        title: newAlert.title,
        desc: newAlert.desc,
        priority: newAlert.priority,
        type: 'manual',
        assignedTo: newAlert.assignedTo,
        status: 'aberto',
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || auth?.email,
        prazo: newAlert.prazo || '',
        moduloRelacionado: newAlert.moduloRelacionado,
        itemRelacionadoId: newAlert.itemRelacionadoId,
        googleEventId: ''
      };

      // Sync with Google Calendar if requested and connected
      if (newAlert.sincronizarGCal && newAlert.prazo && googleAccessToken) {
        try {
          const startDateTime = new Date(newAlert.prazo);
          const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour default duration
          
          const response = await axios.post(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              summary: `🔔 Alerta: ${newAlert.title}`,
              description: `${newAlert.desc}\n\nMódulo: ${newAlert.moduloRelacionado}\n[Criado via foryou.lab]`,
              start: { dateTime: startDateTime.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
              end: { dateTime: endDateTime.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
            },
            { headers: { Authorization: `Bearer ${googleAccessToken}` } }
          );
          
          payload.googleEventId = response.data.id;
          addToast('Alerta e evento no Google Agenda criados!');
        } catch (gcalError) {
          console.error('[GCal Sync Fail]', gcalError);
          addToast('Alerta criado localmente, mas erro ao enviar ao Google Agenda.', 'warning');
        }
      } else {
        addToast('Alerta manual criado com sucesso!');
      }

      await addItem('alerts', payload);
      setShowModal(false);
      
      // Reset form
      setNewAlert({ 
        title: '', desc: '', priority: 'media', assignedTo: '', 
        prazo: '', moduloRelacionado: 'manual', itemRelacionadoId: '', 
        sincronizarGCal: false 
      });
    } catch (error) {
      console.error("Erro ao criar alerta:", error);
      addToast('Erro ao salvar alerta.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Get options for items relating to selected module
  const relatedItemOptions = useMemo(() => {
    switch (newAlert.moduloRelacionado) {
      case 'clientes':
        return (clients || []).map(c => ({ id: c.id, name: c.empresa }));
      case 'projetos':
        return (projects || []).map(p => ({ id: p.id, name: p.titulo }));
      case 'tarefas':
        return (tasks || []).map(t => ({ id: t.id, name: t.titulo }));
      case 'financeiro':
        return (financials || []).map(f => ({ id: f.id, name: f.descricao }));
      default:
        return [];
    }
  }, [newAlert.moduloRelacionado, clients, projects, tasks, financials]);

  return (
    <>
      <div className="page-header" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0 }}>Central de Alertas Global</h2>
            <span style={{ fontSize: 11, background: 'rgba(255,214,0,0.15)', color: 'var(--yellow)', padding: '3px 8px', borderRadius: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={11} /> Inteligência Ativa
            </span>
          </div>
          <div className="breadcrumb" style={{ marginTop: 4 }}>
            Próximos prazos de projetos, tarefas, finanças e compromissos unificados.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Quick synthesizer chime tester */}
          <button 
            onClick={() => { playBellSound(); addToast('🔔 Sino testado com sucesso!', 'info'); }}
            className="btn btn-secondary btn-sm" 
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Verifica se o barulho de sino de prazos está tocando perfeitamente."
          >
            <Play size={12} fill="currentColor" /> Testar Sino
          </button>
          
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Novo Alerta
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Statistics bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 24, background: 'rgba(255,214,0,0.1)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>🔔</div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Abertos</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#FFF' }}>{allUnifiedAlerts.filter(a => a.status === 'aberto').length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 24, background: 'rgba(239,68,68,0.1)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>🔥</div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Urgência Alta</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#EF4444' }}>{allUnifiedAlerts.filter(a => a.status === 'aberto' && a.priority === 'alta').length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 24, background: 'rgba(16,185,129,0.1)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>📅</div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Google Agenda</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}>{googleEvents.length}</div>
            </div>
          </div>
        </div>

        {/* Tab & Filter bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--gray-bg)', padding: 4, borderRadius: 8 }}>
            <button className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('all')} style={{ background: activeTab === 'all' ? 'var(--card-bg)' : 'transparent', border: 'none' }}>Todos</button>
            <button className={`btn btn-sm ${activeTab === 'manual' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('manual')} style={{ background: activeTab === 'manual' ? 'var(--card-bg)' : 'transparent', border: 'none' }}>Manuais</button>
            <button className={`btn btn-sm ${activeTab === 'system' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('system')} style={{ background: activeTab === 'system' ? 'var(--card-bg)' : 'transparent', border: 'none' }}>Sistema</button>
            {googleAccessToken && (
              <button className={`btn btn-sm ${activeTab === 'google' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('google')} style={{ background: activeTab === 'google' ? 'var(--card-bg)' : 'transparent', border: 'none' }}>Google Agenda</button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <Filter size={14} /> Prioridade:
            </div>
            <select className="form-select select-sm" style={{ width: 130 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">Todas</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
        </div>

        {/* Grid List */}
        {filteredAlerts.length === 0 ? (
          <div className="card empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <CheckCircle size={48} color="var(--yellow)" style={{ marginBottom: 16 }} />
            <h4>Nenhum alerta pendente</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Todos os seus prazos estão em dia e não há alertas abertos.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredAlerts.map(alert => {
              const spec = sourceBadge[alert.source];
              const prazoDate = alert.prazo ? new Date(alert.prazo) : null;
              
              // Highlight overdue
              const isOverdue = alert.status === 'aberto' && prazoDate && prazoDate < new Date();
              
              return (
                <div 
                  key={alert.id} 
                  className="card" 
                  style={{ 
                    padding: '16px 20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 16, 
                    borderLeft: `4px solid ${isOverdue ? '#EF4444' : prioColor[alert.priority]}`,
                    background: alert.status === 'resolvido' ? 'rgba(20,20,25,0.4)' : 'rgba(20,20,25,0.85)',
                    opacity: alert.status === 'resolvido' ? 0.6 : 1,
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ fontSize: 22, flexShrink: 0 }}>
                    {isOverdue ? '🔥' : spec.icon}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: isOverdue ? '#EF4444' : '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {alert.title}
                      </span>
                      {isOverdue && (
                        <span style={{ fontSize: 9, background: 'rgba(239,68,68,0.15)', color: '#EF4444', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                          ATRASADO
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {alert.desc}
                    </div>
                    
                    {/* Related Module / Item Description */}
                    {alert.moduloRelacionado && alert.moduloRelacionado !== 'manual' && (
                      <div style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 4, fontWeight: 500 }}>
                        Vínculo: {alert.moduloRelacionado.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Deadline date */}
                  {prazoDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: isOverdue ? '#EF4444' : 'var(--text-secondary)', fontWeight: 500, flexShrink: 0 }}>
                      <Clock size={12} />
                      {prazoDate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).replace(', ', ' às ')}
                    </div>
                  )}

                  {/* Assignee */}
                  {alert.assignedTo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, background: 'var(--gray-bg)', padding: '4px 10px', borderRadius: 20, color: 'var(--text-secondary)', flexShrink: 0 }}>
                      <User size={12} /> {teamMembers.find(t => t.id === alert.assignedTo)?.nome || 'Membro'}
                    </div>
                  )}

                  {/* Source Badge */}
                  <span className="badge" style={{ background: spec.bg, color: spec.color, fontSize: 10, border: `1px solid ${spec.color}22`, flexShrink: 0 }}>
                    {spec.label}
                  </span>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {alert.source === 'manual' ? (
                      <>
                        {alert.status === 'aberto' ? (
                          <button 
                            onClick={() => handleResolve(alert)} 
                            className="btn btn-sm btn-secondary" 
                            style={{ color: '#22C55E', borderColor: '#22C55E' }}
                          >
                            ✓ Concluir
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleReopen(alert)} 
                            className="btn btn-sm btn-secondary"
                          >
                            Reabrir
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(alert)} 
                          className="btn btn-sm btn-secondary" 
                          style={{ color: '#EF4444', borderColor: 'transparent' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 8px' }}>
                        Integrado
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CRIAR ALERTA MANUAL */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Criar Novo Alerta Global"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Criar Alerta'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Título do Alerta</label>
          <input 
            className="form-input" 
            value={newAlert.title} 
            onChange={e => setNewAlert({...newAlert, title: e.target.value})} 
            placeholder="Ex: Reunião urgente com cliente X" 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Descrição</label>
          <textarea 
            className="form-input" 
            value={newAlert.desc} 
            onChange={e => setNewAlert({...newAlert, desc: e.target.value})} 
            placeholder="Forneça detalhes adicionais..." 
            rows={2} 
          />
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Prioridade</label>
            <select 
              className="form-select" 
              value={newAlert.priority} 
              onChange={e => setNewAlert({...newAlert, priority: e.target.value})}
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Atribuir para</label>
            <select 
              className="form-select" 
              value={newAlert.assignedTo} 
              onChange={e => setNewAlert({...newAlert, assignedTo: e.target.value})}
            >
              <option value="">(Ninguém)</option>
              {teamMembers.map(tm => (
                <option key={tm.id} value={tm.id}>{tm.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Prazo (Data e Hora)</label>
            <input 
              className="form-input" 
              type="datetime-local" 
              value={newAlert.prazo} 
              onChange={e => setNewAlert({...newAlert, prazo: e.target.value})} 
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Vincular a Módulo</label>
            <select 
              className="form-select" 
              value={newAlert.moduloRelacionado} 
              onChange={e => setNewAlert({...newAlert, moduloRelacionado: e.target.value, itemRelacionadoId: ''})}
            >
              <option value="manual">Nenhum (Lembrete Manual)</option>
              <option value="clientes">Clientes</option>
              <option value="projetos">Projetos</option>
              <option value="tarefas">Tarefas</option>
              <option value="financeiro">Financeiro</option>
            </select>
          </div>

          {newAlert.moduloRelacionado !== 'manual' && (
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Item Relacionado</label>
              <select 
                className="form-select" 
                value={newAlert.itemRelacionadoId} 
                onChange={e => setNewAlert({...newAlert, itemRelacionadoId: e.target.value})}
              >
                <option value="">Selecione o item...</option>
                {relatedItemOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {googleAccessToken && newAlert.prazo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, background: 'rgba(255,214,0,0.05)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,214,0,0.1)' }}>
            <input 
              type="checkbox" 
              id="sincronizarGCal" 
              checked={newAlert.sincronizarGCal} 
              onChange={e => setNewAlert({...newAlert, sincronizarGCal: e.target.checked})}
              style={{ accentColor: 'var(--yellow)', cursor: 'pointer' }}
            />
            <label htmlFor="sincronizarGCal" style={{ fontSize: 12, fontWeight: 600, color: 'var(--yellow)', cursor: 'pointer', margin: 0 }}>
              Sincronizar com o Google Agenda
            </label>
          </div>
        )}
      </Modal>
    </>
  );
}
