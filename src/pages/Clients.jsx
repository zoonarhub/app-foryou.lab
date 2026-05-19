import { useState, useMemo } from 'react';
import { useApp } from '../data/store';
import { Search, Plus, Edit2, Trash2, Star, Filter } from 'lucide-react';
import Modal from '../components/Modal';

const statusBadge = { ativo: 'badge-green', onboarding: 'badge-blue', pausado: 'badge-yellow', cancelado: 'badge-red' };
const statusLabel = { ativo: 'Ativo', onboarding: 'Onboarding', pausado: 'Pausado', cancelado: 'Cancelado' };
const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v);
const etapas = ['diagnostico', 'estrutura', 'performance', 'escala'];
const etapaLabel = { diagnostico: '01 — Diagnóstico', estrutura: '02 — Estrutura', performance: '03 — Performance', escala: '04 — Escala' };

const PRICES = { 'Starter': 1500, 'Growth': 3000, 'Scale': 5000, 'Custom': 0 };
const PLANOS_DISPONIVEIS = Object.keys(PRICES);

const emptyClient = { nome: '', empresa: '', cnpj: '', email: '', whatsapp: '', segmento: '', cidade: '', plano: ['Growth'], mrr: 3000, status: 'onboarding', responsavel: '', dataInicio: '', mesesContrato: 12, etapaLaboratorio: 'diagnostico', nps: '', observacoes: '', motivoCancelamento: '' };

export default function Clients() {
  const { clients, teamMembers, projects, financials, updateItem, addItem, deleteItem, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlano, setFilterPlano] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState('dados');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(emptyClient);

  const filtered = useMemo(() => clients.filter(c => {
    if (search && !c.nome.toLowerCase().includes(search.toLowerCase()) && !c.empresa.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPlano && c.plano !== filterPlano) return false;
    return true;
  }), [clients, search, filterStatus, filterPlano]);

  const planos = [...new Set(clients.flatMap(c => Array.isArray(c.plano) ? c.plano : [c.plano]).filter(Boolean))];

  const openCreate = () => { setEditingClient(null); setFormData(emptyClient); setShowModal(true); };
  const openEdit = (client, e) => { e?.stopPropagation(); setEditingClient(client); setFormData({ ...emptyClient, ...client }); setShowModal(true); };

  const handleSave = async () => {
    if (!formData.nome || !formData.empresa) { addToast('Nome e Empresa obrigatórios', 'error'); return; }
    if (editingClient) { 
      updateItem('clients', editingClient.id, formData); 
      addToast('Cliente atualizado!'); 
    } else { 
      const dataInicio = formData.dataInicio || new Date().toISOString().split('T')[0];
      const newClientData = { ...formData, dataInicio };
      const clientId = await addItem('clients', newClientData); 
      addToast('Cliente criado!'); 

      if (formData.mesesContrato && formData.mrr > 0) {
        const [yy, mm, dd] = dataInicio.split('-').map(Number);
        for (let i = 0; i < formData.mesesContrato; i++) {
          const vDate = new Date(yy, mm - 1 + i, dd);
          await addItem('financials', {
            descricao: `Mensalidade ${i + 1}/${formData.mesesContrato} - ${formData.empresa}`,
            tipo: 'receita',
            valor: formData.mrr,
            status: 'pendente',
            dataVencimento: vDate.toISOString().split('T')[0],
            dataPagamento: '',
            categoria: 'Mensalidade',
            clienteId: clientId
          });
        }
        addToast(`${formData.mesesContrato} faturamentos gerados!`);
      }
    }
    setShowModal(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Excluir este cliente?')) {
      deleteItem('clients', id);
      addToast('Cliente excluído', 'warning');
    }
  };

  const tabs = [
    { id: 'dados', label: 'Dados Gerais' }, { id: 'servicos', label: 'Serviços' },
    { id: 'financeiro', label: 'Financeiro' }, { id: 'projetos', label: 'Projetos' },
    { id: 'laboratorio', label: 'Laboratório' }, { id: 'notas', label: 'Notas' },
  ];

  return (
    <>
      <div className="page-header">
        <div><h2>Clientes</h2><div className="breadcrumb">{filtered.length} clientes</div></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Novo Cliente</button>
      </div>
      <div className="page-body">
        <div className="search-bar">
          <div className="search-input-wrapper"><Search size={16} /><input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="form-select" style={{ width: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Status</option>{Object.entries(statusLabel).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="form-select" style={{ width: 130 }} value={filterPlano} onChange={e => setFilterPlano(e.target.value)}>
            <option value="">Plano</option>{planos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(client => {
            const member = teamMembers.find(m => m.id === client.responsavel);
            return (
              <div key={client.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setSelectedClient(client); setActiveTab('dados'); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="avatar avatar-lg" style={{ background: client.status === 'ativo' ? '#FFD600' : '#2a2a2a' }}>
                      {client.empresa.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{client.empresa}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{client.nome}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span className={`badge ${statusBadge[client.status]}`}>{statusLabel[client.status]}</span>
                    <button onClick={e => openEdit(client, e)} className="btn btn-sm btn-secondary" style={{ padding: '3px 6px' }}><Edit2 size={12} /></button>
                    <button onClick={e => handleDelete(client.id, e)} className="btn btn-sm btn-secondary" style={{ padding: '3px 6px', color: 'var(--red)', borderColor: 'var(--card-border)' }}><Trash2 size={12} /></button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Plano:</span> <strong>{Array.isArray(client.plano) ? client.plano.join(', ') : client.plano}</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>MRR:</span> <strong style={{ color: '#22C55E' }}>{fmt(client.mrr)}</strong></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Account:</span> {member?.nome.split(' ')[0] || '—'}</div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>NPS:</span> {client.nps ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>{client.nps} <Star size={12} fill="#FFD600" color="#FFD600" /></span> : '—'}</div>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && <div className="card empty-state"><h4>Nenhum cliente</h4><p>Adicione seu primeiro cliente.</p><button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Novo Cliente</button></div>}
      </div>

      {/* Profile Modal */}
      <Modal isOpen={!!selectedClient} onClose={() => setSelectedClient(null)} title={selectedClient?.empresa || ''} size="lg">
        {selectedClient && (<>
          <div className="tabs">
            {tabs.map(t => <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>)}
          </div>
          {activeTab === 'dados' && (
            <div>
              {[['Nome', selectedClient.nome], ['Empresa', selectedClient.empresa], ['CNPJ', selectedClient.cnpj], ['Email', selectedClient.email], ['WhatsApp', selectedClient.whatsapp], ['Segmento', selectedClient.segmento], ['Cidade', selectedClient.cidade], ['Plano', Array.isArray(selectedClient.plano) ? selectedClient.plano.join(', ') : selectedClient.plano], ['MRR', fmt(selectedClient.mrr)], ['Status', statusLabel[selectedClient.status]], ['Início', selectedClient.dataInicio ? new Date(selectedClient.dataInicio).toLocaleDateString('pt-BR') : '—'], ['Contrato (Meses)', selectedClient.mesesContrato || '—']].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--card-border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{k}</span><span style={{ fontWeight: 600 }}>{v || '—'}</span>
                </div>
              ))}
              {selectedClient.status === 'cancelado' && selectedClient.motivoCancelamento && (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(239,68,68,.1)', borderRadius: 8, fontSize: 13, color: '#f87171' }}>
                  <strong>Motivo:</strong> {selectedClient.motivoCancelamento}
                </div>
              )}
            </div>
          )}
          {activeTab === 'servicos' && (
            <div style={{ padding: 16, background: 'rgba(255,214,0,.08)', borderRadius: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Planos: {Array.isArray(selectedClient.plano) ? selectedClient.plano.join(', ') : selectedClient.plano}</div>
              <div style={{ fontSize: 13, color: '#22C55E', fontWeight: 600 }}>MRR: {fmt(selectedClient.mrr)}/mês</div>
            </div>
          )}
          {activeTab === 'financeiro' && (
            <div>{financials.filter(f => f.clienteId === selectedClient.id).length > 0 ? financials.filter(f => f.clienteId === selectedClient.id).map(f => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--card-border)', fontSize: 13 }}>
                <span>{f.descricao}</span><span style={{ color: f.tipo === 'receita' ? '#22C55E' : '#EF4444', fontWeight: 600 }}>{fmt(f.valor)}</span>
              </div>
            )) : <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Sem lançamentos vinculados.</div>}</div>
          )}
          {activeTab === 'projetos' && (
            <div>{projects.filter(p => p.clienteId === selectedClient.id).length > 0 ? projects.filter(p => p.clienteId === selectedClient.id).map(p => (
              <div key={p.id} style={{ padding: 12, border: '1px solid var(--card-border)', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.titulo}</div>
                <div className="progress-bar" style={{ marginTop: 6, height: 4 }}><div className="progress-fill" style={{ width: `${p.progresso || 0}%` }} /></div>
              </div>
            )) : <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Sem projetos vinculados.</div>}</div>
          )}
          {activeTab === 'laboratorio' && (
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Etapa: {etapaLabel[selectedClient.etapaLaboratorio]}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {etapas.map((e, i) => {
                  const active = selectedClient.etapaLaboratorio === e;
                  const passed = etapas.indexOf(selectedClient.etapaLaboratorio) > i;
                  return (
                    <div key={e} style={{
                      flex: 1, padding: 12, borderRadius: 8, textAlign: 'center', fontSize: 11, fontWeight: 600,
                      background: active ? '#FFD600' : passed ? 'rgba(34,197,94,.15)' : 'var(--gray-bg)',
                      color: active ? '#0A0A0A' : passed ? '#4ade80' : 'var(--text-secondary)',
                      border: active ? '2px solid #FFD600' : '1px solid var(--card-border)'
                    }}>0{i + 1}<br />{e.charAt(0).toUpperCase() + e.slice(1)}</div>
                  );
                })}
              </div>
            </div>
          )}
          {activeTab === 'notas' && (
            <div><textarea className="form-textarea" placeholder="Adicionar nota sobre o cliente..." rows={4} /><button className="btn btn-primary btn-sm mt-8" onClick={() => addToast('Nota salva!')}>Salvar</button></div>
          )}
        </>)}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingClient ? '✏️ Editar Cliente' : '➕ Novo Cliente'} size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>{editingClient ? 'Salvar' : 'Criar'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Empresa *</label><input className="form-input" value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">CNPJ</label><input className="form-input" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">WhatsApp</label><input className="form-input" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Segmento</label><input className="form-input" value={formData.segmento} onChange={e => setFormData({...formData, segmento: e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 1.5 }}><label className="form-label">Plano</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              {PLANOS_DISPONIVEIS.map(p => {
                const planosAtuais = Array.isArray(formData.plano) ? formData.plano : (formData.plano ? [formData.plano] : []);
                const isSelected = planosAtuais.includes(p);
                return (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', background: isSelected ? 'rgba(255,214,0,0.1)' : 'transparent', padding: '4px 8px', borderRadius: 6, border: isSelected ? '1px solid var(--yellow)' : '1px solid var(--card-border)' }}>
                    <input type="checkbox" checked={isSelected} onChange={(e) => {
                      let novos = isSelected ? planosAtuais.filter(x => x !== p) : [...planosAtuais, p];
                      let novoMrr = novos.reduce((sum, plan) => sum + (PRICES[plan] || 0), 0);
                      setFormData({...formData, plano: novos, mrr: novoMrr});
                    }} style={{ cursor: 'pointer' }} />
                    {p}
                  </label>
                )
              })}
            </div>
          </div>
          <div className="form-group" style={{ flex: 0.5 }}><label className="form-label">MRR (R$)</label><input className="form-input" type="number" value={formData.mrr} onChange={e => setFormData({...formData, mrr: Number(e.target.value)})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Data de Início</label><input className="form-input" type="date" value={formData.dataInicio || ''} onChange={e => setFormData({...formData, dataInicio: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Meses de Contrato</label><input className="form-input" type="number" min="1" value={formData.mesesContrato || ''} onChange={e => setFormData({...formData, mesesContrato: Number(e.target.value)})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              {Object.entries(statusLabel).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Responsável</label>
            <select className="form-select" value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})}>
              <option value="">Selecione...</option>{teamMembers.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select></div>
        </div>
        {formData.status === 'cancelado' && (
          <div className="form-group"><label className="form-label">Motivo do Cancelamento</label><textarea className="form-textarea" value={formData.motivoCancelamento || ''} onChange={e => setFormData({...formData, motivoCancelamento: e.target.value})} /></div>
        )}
        <div className="form-group"><label className="form-label">Observações</label><textarea className="form-textarea" value={formData.observacoes || ''} onChange={e => setFormData({...formData, observacoes: e.target.value})} /></div>
      </Modal>
    </>
  );
}
