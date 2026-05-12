import { useState, useRef, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Search, Send, Phone, Smile, Paperclip, X, Check, CheckCheck, 
  UserPlus, Tag, Zap, MoreVertical, Filter, Users, Layout, 
  Smartphone, Bell, PlusCircle, AlertTriangle
} from 'lucide-react';

// API Configuration (Based on User's Meta Token)
const META_API_TOKEN = 'EAAeGAJGtsKIBRctEq8Ryq3VU5HXGGl25NUDhDcmUmLugeiqIBCZC6kfoSjiKwm1LmQZBvfTYrm1aZAdF1i1KUnZC2S0tznmzjXnzk3dYLCTftssyxyoKme50LBCJKnZC7nMAqodqCnpQUDZBpWJzegrX3X2TeEahDefaueVsitkGzPGefNWUbnevOHLyKWLQZDZD';

export default function WhatsAppPage() {
  const { leads, clients, addItem, addToast, teamMembers } = useApp();
  const [activeChannel, setActiveChannel] = useState('Principal');
  const [selectedConv, setSelectedConv] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('abertas');
  const [input, setInput] = useState('');
  const [showPanel, setShowPanel] = useState(true);
  const [agentFilter, setAgentFilter] = useState('todos');
  
  // States for real data
  const [conversations, setConversations] = useState([
    { id: 'w1', nome: 'Maria Silva', numero: '5511999887766', lastMsg: 'Preciso de um orçamento', time: '10:15', unread: 2, agentId: 'tm1', status: 'aberta' },
    { id: 'w2', nome: 'João Pedro', numero: '5511988776655', lastMsg: 'Pode falar agora?', time: '09:30', unread: 0, agentId: 'none', status: 'aberta' },
    { id: 'w3', nome: 'Empresa X', numero: '5511977665544', lastMsg: 'Obrigado!', time: 'Ontem', unread: 0, agentId: 'tm1', status: 'resolvida' },
  ]);

  const [messages, setMessages] = useState({
    w1: [
      { id: 1, from: 'contact', text: 'Olá, vi o anúncio no Instagram', time: '10:10' },
      { id: 2, from: 'me', text: 'Olá Maria! Como posso te ajudar?', time: '10:12' },
      { id: 3, from: 'contact', text: 'Preciso de um orçamento para tráfego pago', time: '10:15' },
    ]
  });

  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, selectedConv]);

  // Handle CRM Sync
  const syncToCRM = () => {
    if (!selectedConv) return;
    const exists = leads.find(l => l.whatsapp === selectedConv.numero);
    if (exists) {
      addToast('Este contato já existe no CRM!', 'info');
      return;
    }
    addItem('leads', {
      nome: selectedConv.nome,
      whatsapp: selectedConv.numero,
      status: 'novo',
      origem: `WhatsApp - ${activeChannel}`,
      dataEntrada: new Date().toISOString()
    });
    addToast(`${selectedConv.nome} enviado para o CRM! 🚀`);
  };

  const handleSend = () => {
    if (!input.trim() || !selectedConv) return;
    const newMsg = { 
      id: Date.now(), 
      from: 'me', 
      text: input, 
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
    };
    setMessages(prev => ({ ...prev, [selectedConv.id]: [...(prev[selectedConv.id] || []), newMsg] }));
    setInput('');
  };

  const filteredConvs = conversations.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || c.numero.includes(searchTerm);
    const matchesTab = filterTab === 'todas' || c.status === (filterTab === 'abertas' ? 'aberta' : 'resolvida');
    const matchesAgent = agentFilter === 'todos' || c.agentId === agentFilter;
    return matchesSearch && matchesTab && matchesAgent;
  });

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--header-h))', background: 'var(--main-bg)' }}>
      
      {/* CHANNEL SELECTOR (SIDE BAR) */}
      <div style={{ width: 64, borderRight: '1px solid var(--card-border)', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 16 }}>
        <div className="avatar" style={{ cursor: 'pointer', border: activeChannel === 'Principal' ? '2px solid var(--yellow)' : 'none' }} onClick={() => setActiveChannel('Principal')}>P</div>
        <div className="avatar" style={{ background: 'var(--gray-bg)', cursor: 'pointer' }} onClick={() => addToast('Adicionar novo canal')}> <PlusCircle size={20} /> </div>
        <div style={{ marginTop: 'auto', marginBottom: 20 }}>
          <Bell size={20} color="var(--text-secondary)" />
        </div>
      </div>

      {/* CONVERSATION LIST */}
      <div style={{ width: 340, borderRight: '1px solid var(--card-border)', background: 'var(--card-bg)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Mensagens</h3>
            <div style={{ display: 'flex', gap: 8 }}>
               <Filter size={16} color="var(--text-secondary)" />
               <Users size={16} color="var(--text-secondary)" />
            </div>
          </div>
          <div className="search-input-wrapper">
            <Search size={14} />
            <input placeholder="Buscar contatos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)' }}>
          {['abertas', 'resolvidas', 'todas'].map(tab => (
            <button key={tab} onClick={() => setFilterTab(tab)} 
              style={{ flex: 1, padding: '12px 0', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', background: 'none', border: 'none', color: filterTab === tab ? 'var(--yellow)' : 'var(--text-secondary)', borderBottom: filterTab === tab ? '2px solid var(--yellow)' : 'none', cursor: 'pointer' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Agent Filter */}
        <div style={{ padding: '8px 16px', background: 'var(--gray-bg)', borderBottom: '1px solid var(--card-border)' }}>
          <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} 
            style={{ width: '100%', background: 'none', border: 'none', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
            <option value="todos">Todos os Atendentes</option>
            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            <option value="none">Sem Atendente</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConvs.map(conv => {
            const isOverdue = conv.status === 'aberta' && conv.lastInteraction && (new Date() - new Date(conv.lastInteraction)) > 1800000; // 30 min
            
            return (
              <div key={conv.id} onClick={() => setSelectedConv(conv)}
                style={{ 
                  padding: '16px', 
                  borderBottom: '1px solid var(--card-border)', 
                  cursor: 'pointer', 
                  background: selectedConv?.id === conv.id ? 'rgba(255,214,0,.05)' : 'none',
                  borderLeft: isOverdue ? '4px solid #EF4444' : 'none',
                  position: 'relative' 
                }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="avatar" style={{ background: isOverdue ? 'rgba(239,68,68,.1)' : 'var(--gray-bg)', border: isOverdue ? '1px solid #EF4444' : 'none' }}>
                    {isOverdue ? <AlertTriangle size={14} color="#EF4444" /> : conv.nome.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: isOverdue ? '#EF4444' : 'inherit' }}>{conv.nome}</span>
                      <span style={{ fontSize: 10, color: isOverdue ? '#EF4444' : 'var(--text-secondary)' }}>{conv.time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                      {isOverdue ? <span style={{ fontWeight: 600 }}>⚠️ Aguardando há mais de 30 min</span> : conv.lastMsg}
                    </div>
                  </div>
                </div>
                {conv.unread > 0 && <div style={{ position: 'absolute', right: 16, bottom: 16, background: 'var(--yellow)', color: '#000', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>{conv.unread}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--main-bg)' }}>
        {selectedConv ? (
          <>
            <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--card-border)', background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar">{selectedConv.nome.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedConv.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--green)' }}>Online</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={syncToCRM}><UserPlus size={14} /> CRM</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPanel(!showPanel)}><Layout size={14} /></button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(messages[selectedConv.id] || []).map(msg => (
                <div key={msg.id} style={{ alignSelf: msg.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{ padding: '12px 16px', borderRadius: 16, fontSize: 14, background: msg.from === 'me' ? 'var(--yellow)' : 'var(--card-bg)', color: msg.from === 'me' ? '#000' : 'var(--text-primary)', border: msg.from === 'me' ? 'none' : '1px solid var(--card-border)' }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, textAlign: msg.from === 'me' ? 'right' : 'left' }}>
                    {msg.time}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: '20px', background: 'var(--card-bg)', borderTop: '1px solid var(--card-border)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="sidebar-toggle"><Paperclip size={20} /></button>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} 
                placeholder="Digite sua resposta..." 
                style={{ flex: 1, background: 'var(--gray-bg)', border: '1px solid var(--card-border)', borderRadius: 24, padding: '12px 20px', color: 'var(--text-primary)', fontSize: 14 }} />
              <button onClick={handleSend} className="btn btn-primary" style={{ borderRadius: '50%', width: 44, height: 44, padding: 0, justifyContent: 'center' }}>
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: 16 }}>
            <Smartphone size={64} style={{ opacity: 0.2 }} />
            <p>Selecione um atendimento para começar</p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: INFO & AGENT ASSIGNMENT */}
      {selectedConv && showPanel && (
        <div style={{ width: 300, borderLeft: '1px solid var(--card-border)', background: 'var(--card-bg)', padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="avatar avatar-lg" style={{ margin: '0 auto 12px' }}>{selectedConv.nome.charAt(0)}</div>
            <h4 style={{ fontWeight: 700 }}>{selectedConv.nome}</h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedConv.numero}</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Atendente Responsável</label>
            <select value={selectedConv.agentId} onChange={(e) => {
              const newId = e.target.value;
              setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, agentId: newId } : c));
              addToast('Atendente alterado!');
            }} style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'var(--gray-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: 13 }}>
              <option value="none">Aguardando Fila...</option>
              {teamMembers.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.cargo})</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
             <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Ações de Atendimento</label>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => addToast('Tag adicionada')}><Tag size={14} /> Adicionar Tag</button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => {
                  setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, status: 'resolvida' } : c));
                  addToast('Conversa marcada como resolvida');
                }}><CheckCheck size={14} /> Marcar como Resolvida</button>
             </div>
          </div>

          <div>
             <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Resumo/Notas</label>
             <textarea className="form-textarea" placeholder="Adicione notas sobre o atendimento..." style={{ height: 100, fontSize: 12 }} />
          </div>
        </div>
      )}
    </div>
  );
}
