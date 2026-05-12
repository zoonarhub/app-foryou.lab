import { useState, useRef, useEffect } from 'react';
import { useApp } from '../data/store';
import { Search, Send, Phone, Smile, Paperclip, X, Check, CheckCheck, UserPlus, Tag, Zap, MoreVertical } from 'lucide-react';

const mockConversations = [
  { id: 'w1', nome: 'Maria Silva', numero: '5511999887766', avatar: 'MS', lastMsg: 'Oi! Quero saber mais sobre os planos', time: '14:32', unread: 2, status: 'atendimento' },
  { id: 'w2', nome: 'João Santos', numero: '5511988776655', avatar: 'JS', lastMsg: 'Pode enviar a proposta?', time: '13:15', unread: 0, status: 'atendimento' },
  { id: 'w3', nome: 'Ana Oliveira', numero: '5511977665544', avatar: 'AO', lastMsg: 'Obrigada pelo retorno!', time: '12:40', unread: 0, status: 'resolvida' },
  { id: 'w4', nome: '5511966554433', numero: '5511966554433', avatar: '55', lastMsg: 'Olá, vi o anúncio no Instagram', time: '11:20', unread: 3, status: 'nao_lida' },
  { id: 'w5', nome: 'Pedro Costa', numero: '5511955443322', avatar: 'PC', lastMsg: 'Quando podemos agendar?', time: '10:05', unread: 1, status: 'atendimento' },
];

const mockMessages = {
  w1: [
    { id: 1, from: 'contact', text: 'Oi! Vi vocês no Instagram', time: '14:20', status: 'read' },
    { id: 2, from: 'me', text: 'Olá Maria! Que bom ter você aqui 😊 Sobre o que gostaria de saber?', time: '14:22', status: 'read' },
    { id: 3, from: 'contact', text: 'Quero saber mais sobre os planos de marketing digital', time: '14:30', status: 'read' },
    { id: 4, from: 'contact', text: 'Vocês fazem gestão de tráfego pago?', time: '14:32', status: 'delivered' },
  ],
  w2: [
    { id: 1, from: 'me', text: 'Olá João! Tudo bem?', time: '13:00', status: 'read' },
    { id: 2, from: 'contact', text: 'Tudo sim! Pode enviar a proposta?', time: '13:15', status: 'read' },
  ]
};

const quickReplies = [
  'Olá! Obrigado pelo contato. Como posso ajudar?',
  'Vou preparar uma proposta personalizada para você!',
  'Posso agendar uma reunião para conversarmos melhor?',
  'Nosso plano mais popular inclui: gestão de redes, tráfego pago e relatórios mensais.',
  'Segue o link para agendar: https://calendly.com/foryoulab',
];

export default function WhatsAppPage() {
  const { leads, clients, addItem, addToast } = useApp();
  const [connected, setConnected] = useState(() => localStorage.getItem('wa_connected') === 'true');
  const [connecting, setConnecting] = useState(false);
  const [selectedConv, setSelectedConv] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('todas');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const [conversations, setConversations] = useState(mockConversations);
  const [showQuick, setShowQuick] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, selectedConv]);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => { setConnecting(false); setConnected(true); localStorage.setItem('wa_connected', 'true'); addToast('WhatsApp conectado!'); }, 4000);
  };

  const handleDisconnect = () => { setConnected(false); localStorage.removeItem('wa_connected'); addToast('WhatsApp desconectado', 'warning'); };

  const filteredConvs = conversations.filter(c => {
    if (searchTerm && !c.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterTab === 'nao_lidas' && c.unread === 0) return false;
    if (filterTab === 'atendimento' && c.status !== 'atendimento') return false;
    if (filterTab === 'resolvidas' && c.status !== 'resolvida') return false;
    return true;
  });

  const handleSend = () => {
    if (!input.trim() || !selectedConv) return;
    const newMsg = { id: Date.now(), from: 'me', text: input, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), status: 'sent' };
    setMessages(prev => ({ ...prev, [selectedConv.id]: [...(prev[selectedConv.id] || []), newMsg] }));
    setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, lastMsg: input, time: newMsg.time } : c));
    setInput('');
  };

  const handleQuickReply = (text) => { setInput(text); setShowQuick(false); };

  const convertToLead = () => {
    if (!selectedConv) return;
    addItem('leads', { nome: selectedConv.nome, empresa: '', whatsapp: selectedConv.numero, email: '', status: 'novo', temperatura: 'quente', origem: 'WhatsApp', dataEntrada: new Date().toISOString() });
    addToast(`${selectedConv.nome} convertido em Lead!`);
  };

  // QR CODE / INSTANCE screen
  if (!connected) return (
    <>
      <div className="page-header"><div><h2>WhatsApp Multi-Agente</h2><div className="breadcrumb">Gerencie instâncias e vendedores</div></div></div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Lado Esquerdo: Conectar Instância */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Instância Principal</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Conecte seu WhatsApp para distribuir os atendimentos entre sua equipe.</p>
            {connecting ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 180, height: 180, margin: '0 auto 16px', background: 'var(--gray-bg)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--card-border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 2, width: 140 }}>
                    {Array.from({ length: 64 }).map((_, i) => <div key={i} style={{ width: '100%', paddingBottom: '100%', background: Math.random() > .5 ? '#fff' : '#0A0A0A', borderRadius: 1 }} />)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#F59E0B', fontSize: 13, fontWeight: 600 }}>
                  <div style={{ width: 12, height: 12, border: '2px solid #FFD600', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                  Aguardando leitura do QR Code...
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>Abra o WhatsApp no celular {'>'} Aparelhos Conectados {'>'} Conectar</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', border: '2px dashed var(--card-border)', borderRadius: 12 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
                <button onClick={handleConnect} className="btn btn-primary" style={{ fontSize: 14 }}>Gerar QR Code de Conexão</button>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 12 }}><Zap size={10} /> Integrado via Baileys API / Evolution</div>
              </div>
            )}
          </div>
          
          {/* Lado Direito: Vendedores/Agentes */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Atendentes / SDRs</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Distribua conversas para múltiplos vendedores usando um único número.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--card-border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src="/favicon.png" className="avatar avatar-sm" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>Ricardo Fernandes</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Admin</div></div>
                </div>
                <span className="badge badge-green">Ativo</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--card-border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar avatar-sm" style={{ background: 'var(--gray-bg)' }}>VD</div>
                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>Vendedor 1</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>SDR</div></div>
                </div>
                <span className="badge badge-yellow">Aguardando Conexão</span>
              </div>
            </div>
            
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 16 }} onClick={() => addToast('O WhatsApp precisa estar conectado primeiro.', 'warning')}><UserPlus size={14} /> Adicionar Vendedor à Fila</button>
          </div>
        </div>
      </div>
    </>
  );

  // CHAT INTERFACE
  const convMsgs = selectedConv ? (messages[selectedConv.id] || []) : [];

  return (
    <>
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* COLUMN 1: Conversations */}
        <div style={{ width: 320, borderRight: '1px solid var(--card-border)', background: 'var(--card-bg)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>💬 WhatsApp</h3>
            <button onClick={handleDisconnect} className="btn btn-sm btn-secondary" style={{ fontSize: 10 }}>Desconectar</button>
          </div>
          <div style={{ padding: '8px 12px' }}>
            <div className="search-input-wrapper"><Search size={14} /><input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ fontSize: 12 }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--card-border)', padding: '0 8px' }}>
            {[['todas', 'Todas'], ['nao_lidas', 'Não lidas'], ['atendimento', 'Atendendo'], ['resolvidas', 'Resolvidas']].map(([k, v]) => (
              <button key={k} onClick={() => setFilterTab(k)} style={{ flex: 1, padding: '8px 4px', fontSize: 10, fontWeight: 600, color: filterTab === k ? '#FFD600' : 'var(--text-secondary)', borderBottom: filterTab === k ? '2px solid #FFD600' : '2px solid transparent', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{v}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConvs.map(conv => (
              <div key={conv.id} onClick={() => { setSelectedConv(conv); setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c)); }}
                style={{ display: 'flex', gap: 10, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--card-border)', background: selectedConv?.id === conv.id ? 'rgba(255,214,0,.06)' : 'transparent', transition: 'background .15s' }}>
                <div className="avatar">{conv.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{conv.nome}</span>
                    <span style={{ fontSize: 10, color: conv.unread > 0 ? '#FFD600' : 'var(--text-secondary)' }}>{conv.time}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="truncate" style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 160 }}>{conv.lastMsg}</span>
                    {conv.unread > 0 && <span style={{ background: '#FFD600', color: '#0A0A0A', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{conv.unread}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2: Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
          {selectedConv ? (<>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--card-border)', background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div className="avatar">{selectedConv.avatar}</div>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{selectedConv.nome}</div><div style={{ fontSize: 11, color: '#22C55E' }}>online</div></div>
              </div>
              <button onClick={() => setShowPanel(!showPanel)} className="btn btn-sm btn-secondary" style={{ padding: '4px 8px' }}><MoreVertical size={14} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {convMsgs.map(msg => (
                <div key={msg.id} style={{ alignSelf: msg.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
                  <div style={{ padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, background: msg.from === 'me' ? '#FFD600' : 'var(--gray-bg)', color: msg.from === 'me' ? '#0A0A0A' : 'var(--text-primary)', border: msg.from !== 'me' ? '1px solid var(--card-border)' : 'none' }}>{msg.text}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, textAlign: msg.from === 'me' ? 'right' : 'left', display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start', gap: 4, alignItems: 'center' }}>
                    {msg.time}
                    {msg.from === 'me' && (msg.status === 'read' ? <CheckCheck size={12} color="#3B82F6" /> : msg.status === 'delivered' ? <CheckCheck size={12} /> : <Check size={12} />)}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--card-border)', background: 'var(--card-bg)', display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
              <button onClick={() => setShowQuick(!showQuick)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Zap size={18} /></button>
              {showQuick && <div style={{ position: 'absolute', bottom: '100%', left: 0, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 8, width: 340, maxHeight: 200, overflowY: 'auto' }}>
                {quickReplies.map((t, i) => <div key={i} onClick={() => handleQuickReply(t)} style={{ padding: '8px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 6, color: 'var(--text-primary)' }} onMouseOver={e => e.target.style.background = 'var(--gray-bg)'} onMouseOut={e => e.target.style.background = 'transparent'}>{t}</div>)}
              </div>}
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Smile size={18} /></button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Paperclip size={18} /></button>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Digite uma mensagem..." style={{ flex: 1, padding: '10px 16px', border: '1.5px solid var(--card-border)', borderRadius: 24, fontSize: 13, fontFamily: 'inherit', background: 'var(--gray-bg)', color: 'var(--text-primary)' }} />
              <button onClick={handleSend} className="btn btn-primary" style={{ borderRadius: 24, padding: '8px 14px' }}><Send size={16} /></button>
            </div>
          </>) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}><div style={{ fontSize: 48, marginBottom: 12 }}>💬</div><div style={{ fontSize: 16, fontWeight: 600 }}>Selecione uma conversa</div></div>
            </div>
          )}
        </div>

        {/* COLUMN 3: Contact Info */}
        {selectedConv && showPanel && (
          <div style={{ width: 280, borderLeft: '1px solid var(--card-border)', background: 'var(--card-bg)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div className="avatar avatar-lg" style={{ margin: '0 auto 8px', width: 56, height: 56, fontSize: 18 }}>{selectedConv.avatar}</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedConv.nome}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedConv.numero}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <a href={`tel:${selectedConv.numero}`} className="btn btn-sm btn-secondary" style={{ flex: 1, justifyContent: 'center' }}><Phone size={12} /></a>
              <button className="btn btn-sm btn-secondary" style={{ flex: 1 }}><Tag size={12} /> Tag</button>
            </div>
            <div style={{ padding: 12, background: 'var(--gray-bg)', borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Status</div>
              <span className={`badge ${selectedConv.status === 'resolvida' ? 'badge-green' : 'badge-yellow'}`}>{selectedConv.status === 'resolvida' ? 'Resolvida' : 'Em atendimento'}</span>
            </div>
            <button onClick={convertToLead} className="btn btn-primary btn-sm" style={{ width: '100%', marginBottom: 8 }}><UserPlus size={12} /> Converter em Lead</button>
            <button onClick={() => { setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, status: 'resolvida' } : c)); addToast('Conversa resolvida!'); }} className="btn btn-secondary btn-sm" style={{ width: '100%' }}><Check size={12} /> Marcar Resolvida</button>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Notas</div>
              <textarea className="form-textarea" placeholder="Anotações..." style={{ fontSize: 12, minHeight: 60 }} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
