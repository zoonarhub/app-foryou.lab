import { useState, useRef, useEffect } from 'react';
import { useApp } from '../data/store';
import { Plus, Send, Bot, Edit2, Trash2, ArrowLeft, Zap, Copy, RotateCcw } from 'lucide-react';
import Modal from '../components/Modal';

const emptyAgent = { nome: '', descricao: '', webhook_url: '', headers: '', boasVindas: 'Olá! Como posso ajudar?', status: 'ativo' };

export default function AIAssistant() {
  const { addToast } = useApp();
  const [agents, setAgents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('foryoulab_agents') || '[]'); } catch { return []; }
  });
  const [chatMessages, setChatMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('foryoulab_chats') || '{}'); } catch { return {}; }
  });
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState(emptyAgent);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => { localStorage.setItem('foryoulab_agents', JSON.stringify(agents)); }, [agents]);
  useEffect(() => { localStorage.setItem('foryoulab_chats', JSON.stringify(chatMessages)); }, [chatMessages]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, selectedAgent]);

  const sessionId = `user_${Date.now()}`;
  const messages = selectedAgent ? (chatMessages[selectedAgent.id] || []) : [];

  const openCreate = () => { setEditingAgent(null); setFormData(emptyAgent); setShowModal(true); };
  const openEdit = (agent, e) => { e.stopPropagation(); setEditingAgent(agent); setFormData({ ...agent }); setShowModal(true); };

  const handleSave = () => {
    if (!formData.nome) { addToast('Nome obrigatório', 'error'); return; }
    if (editingAgent) {
      setAgents(prev => prev.map(a => a.id === editingAgent.id ? { ...a, ...formData } : a));
      addToast('Agente atualizado!');
    } else {
      setAgents(prev => [...prev, { ...formData, id: Date.now().toString(), createdAt: new Date().toISOString() }]);
      addToast('Agente criado!');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    setAgents(prev => prev.filter(a => a.id !== deleteConfirm.id));
    const newChats = { ...chatMessages }; delete newChats[deleteConfirm.id];
    setChatMessages(newChats);
    if (selectedAgent?.id === deleteConfirm.id) setSelectedAgent(null);
    addToast('Agente excluído!', 'warning');
    setDeleteConfirm(null);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedAgent) return;
    const userMsg = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setChatMessages(prev => ({ ...prev, [selectedAgent.id]: [...(prev[selectedAgent.id] || []), userMsg] }));
    setInput('');
    setLoading(true);

    try {
      if (selectedAgent.webhook_url) {
        const headers = { 'Content-Type': 'application/json' };
        if (selectedAgent.headers) {
          try { Object.assign(headers, JSON.parse(selectedAgent.headers)); } catch {}
        }
        const res = await fetch(selectedAgent.webhook_url, {
          method: 'POST', headers,
          body: JSON.stringify({ message: input, sessionId, agent: selectedAgent.nome })
        });
        const data = await res.json();
        const reply = data.output || data.response || data.message || data.text || JSON.stringify(data);
        setChatMessages(prev => ({ ...prev, [selectedAgent.id]: [...(prev[selectedAgent.id] || []), { role: 'agent', content: reply, timestamp: new Date().toISOString() }] }));
      } else {
        setTimeout(() => {
          setChatMessages(prev => ({ ...prev, [selectedAgent.id]: [...(prev[selectedAgent.id] || []), { role: 'agent', content: 'Configure a URL do webhook para conectar este agente a um serviço de IA (n8n, Make, Flowise, etc).', timestamp: new Date().toISOString() }] }));
          setLoading(false);
        }, 1000);
        return;
      }
    } catch (err) {
      setChatMessages(prev => ({ ...prev, [selectedAgent.id]: [...(prev[selectedAgent.id] || []), { role: 'agent', content: `❌ Erro: ${err.message}. Verifique a URL do webhook.`, timestamp: new Date().toISOString() }] }));
    }
    setLoading(false);
  };

  const clearChat = () => {
    setChatMessages(prev => ({ ...prev, [selectedAgent.id]: [] }));
    addToast('Conversa limpa!');
  };

  // LIST VIEW
  if (!selectedAgent) return (
    <>
      <div className="page-header">
        <div><h2>IA — Agentes</h2><div className="breadcrumb">{agents.length} agentes configurados</div></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Criar Agente</button>
      </div>
      <div className="page-body">
        {agents.length === 0 ? (
          <div className="card empty-state"><Bot size={48} /><h4>Nenhum agente</h4><p>Crie seu primeiro agente de IA conectado via webhook.</p><button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Criar Agente</button></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {agents.map(agent => (
              <div key={agent.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => setSelectedAgent(agent)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,214,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={20} color="#FFD600" /></div>
                    <div><div style={{ fontWeight: 700, fontSize: 15 }}>{agent.nome}</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{agent.descricao || 'Sem descrição'}</div></div>
                  </div>
                  <span className={`badge ${agent.status === 'ativo' ? 'badge-green' : 'badge-gray'}`}>{agent.status}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  <Zap size={11} /> {agent.webhook_url ? agent.webhook_url.slice(0, 40) + '...' : 'Sem webhook'}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={e => openEdit(agent, e)} className="btn btn-sm btn-secondary" style={{ flex: 1 }}><Edit2 size={12} /> Editar</button>
                  <button onClick={e => { e.stopPropagation(); setDeleteConfirm(agent); }} className="btn btn-sm btn-secondary" style={{ color: '#EF4444' }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAgent ? '✏️ Editar Agente' : '🤖 Criar Agente'} size="md"
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Salvar</button></>}>
        <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Assistente de Vendas" /></div>
        <div className="form-group"><label className="form-label">Descrição</label><input className="form-input" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">URL do Webhook</label><input className="form-input" value={formData.webhook_url} onChange={e => setFormData({...formData, webhook_url: e.target.value})} placeholder="https://seu-n8n.com/webhook/..." /></div>
        <div className="form-group"><label className="form-label">Headers (JSON)</label><input className="form-input" value={formData.headers} onChange={e => setFormData({...formData, headers: e.target.value})} placeholder='{"Authorization": "Bearer ..."}' /></div>
        <div className="form-group"><label className="form-label">Mensagem de boas-vindas</label><textarea className="form-textarea" value={formData.boasVindas} onChange={e => setFormData({...formData, boasVindas: e.target.value})} /></div>
      </Modal>
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="⚠️ Excluir Agente" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button><button className="btn btn-danger" onClick={handleDelete}>Excluir</button></>}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Excluir <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm?.nome}</strong> e todo o histórico?</p>
      </Modal>
    </>
  );

  // CHAT VIEW
  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setSelectedAgent(null)} className="btn btn-sm btn-secondary" style={{ padding: '6px 8px' }}><ArrowLeft size={16} /></button>
          <div><h2>{selectedAgent.nome}</h2><div className="breadcrumb">{selectedAgent.webhook_url ? '🟢 Webhook conectado' : '⚪ Sem webhook'}</div></div>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={clearChat}><RotateCcw size={14} /> Limpar</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && <div style={{ alignSelf: 'flex-start', maxWidth: '70%', padding: '12px 16px', borderRadius: 12, background: 'var(--gray-bg)', border: '1px solid var(--card-border)', fontSize: 13 }}>{selectedAgent.boasVindas}</div>}
          {messages.map((msg, i) => (
            <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
              <div style={{ padding: '12px 16px', borderRadius: 12, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', background: msg.role === 'user' ? '#FFD600' : 'var(--gray-bg)', color: msg.role === 'user' ? '#0A0A0A' : 'var(--text-primary)', border: msg.role === 'agent' ? '1px solid var(--card-border)' : 'none' }}>
                {msg.content}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                {msg.role === 'agent' && <button onClick={() => { navigator.clipboard.writeText(msg.content); addToast('Copiado!'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginLeft: 8 }}><Copy size={10} /></button>}
              </div>
            </div>
          ))}
          {loading && <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: 'var(--gray-bg)', borderRadius: 12, border: '1px solid var(--card-border)' }}><div className="skeleton" style={{ width: 180, height: 16, marginBottom: 4 }} /><div className="skeleton" style={{ width: 120, height: 16 }} /></div>}
          <div ref={chatEndRef} />
        </div>
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--card-border)', background: 'var(--card-bg)', display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Digite uma mensagem..." style={{ flex: 1, padding: '10px 16px', border: '1.5px solid var(--card-border)', borderRadius: 24, fontSize: 13, fontFamily: 'inherit', background: 'var(--gray-bg)', color: 'var(--text-primary)' }} />
          <button onClick={handleSend} className="btn btn-primary" style={{ borderRadius: 24 }} disabled={loading}><Send size={16} /></button>
        </div>
      </div>
    </>
  );
}
