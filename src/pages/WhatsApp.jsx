import { useState, useEffect, useRef } from 'react';
import { useApp } from '../data/store';
import { 
  Smartphone, AlertTriangle, QrCode, RefreshCw, Settings, CheckCircle, LogOut,
  Send, Search, User, Phone, Smile, Paperclip, MoreVertical, MessageSquare,
  Circle, ShieldCheck, Home, Users, Hash, ArrowLeft, Plus, Filter, LayoutGrid, CheckSquare, SearchCode, MoreHorizontal
} from 'lucide-react';
import Modal from '../components/Modal';
import axios from 'axios';

export default function WhatsAppPage() {
  const { addToast, evolutionApiUrl, evolutionApiKey } = useApp();
  const [activeTab, setActiveTab] = useState('workspaces'); 
  
  // Real Data State
  const [instances, setInstances] = useState([]);
  const [activeInstance, setActiveInstance] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (evolutionApiUrl && evolutionApiKey) {
      fetchInstances();
    }
  }, [evolutionApiUrl, evolutionApiKey]);

  useEffect(() => {
    if (activeInstance) {
      fetchChats();
    }
  }, [activeInstance]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${evolutionApiUrl}/instance/fetchInstances`, {
        headers: { 'apikey': evolutionApiKey }
      });
      const data = res.data?.data || res.data || [];
      const formatted = Array.isArray(data) ? data : Object.values(data);
      setInstances(formatted);
    } catch (e) {
      console.error('Erro ao buscar workspaces', e);
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async () => {
    if (!newInstanceName.trim()) return addToast('Nome obrigatório', 'error');
    setLoading(true);
    try {
      // Evolution API breaks if instance names have spaces or special characters
      const formattedName = newInstanceName.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
      
      await axios.post(`${evolutionApiUrl}/instance/create`, {
        instanceName: formattedName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      }, { headers: { 'apikey': evolutionApiKey } });
      
      addToast('Workspace criado com sucesso!');
      setShowCreateModal(false);
      setNewInstanceName('');
      fetchInstances();
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.response?.data?.error || e.message;
      addToast(`Erro ao criar: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const connectInstance = async (instance) => {
    setLoading(true);
    setQrCode(null);
    try {
      const res = await axios.get(`${evolutionApiUrl}/instance/connect/${instance.name || instance.instanceName}`, {
        headers: { 'apikey': evolutionApiKey }
      });
      if (res.data?.base64) {
        setQrCode(res.data.base64);
        setShowCreateModal(true); // Reusing modal for QR Code
      } else {
        addToast('Instância já conectada!');
        fetchInstances();
      }
    } catch (e) {
      addToast('Erro ao conectar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    setLoading(true);
    const instanceName = activeInstance.name || activeInstance.instanceName;
    try {
      const response = await axios.get(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
        headers: { 'apikey': evolutionApiKey }
      });
      const data = response.data?.records || response.data?.data || response.data || [];
      setChats(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Erro ao buscar chats', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    const instanceName = activeInstance.name || activeInstance.instanceName;
    const jid = chat.id || chat.remoteJid;
    try {
      const response = await axios.post(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
        key: { remoteJid: jid }, count: 50
      }, { headers: { 'apikey': evolutionApiKey } });
      
      let msgs = response.data?.messages || response.data?.records || response.data?.data || response.data || [];
      if (!Array.isArray(msgs) && typeof msgs === 'object') msgs = [msgs];
      setMessages(msgs.reverse());
    } catch (e) {
      console.error('Erro ao buscar mensagens:', e);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    const instanceName = activeInstance.name || activeInstance.instanceName;
    const jid = selectedChat.id || selectedChat.remoteJid;
    try {
      await axios.post(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
        number: jid,
        textMessage: { text: newMessage }
      }, { headers: { 'apikey': evolutionApiKey } });
      
      setMessages([...messages, { key: { fromMe: true }, message: { conversation: newMessage }, messageTimestamp: Math.floor(Date.now() / 1000) }]);
      setNewMessage('');
    } catch (e) {
      addToast('Erro ao enviar', 'error');
    }
  };

  const handleSelectWorkspace = (inst) => {
    setActiveInstance(inst);
    setActiveTab('conversas');
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', margin: -20, background: 'var(--bg-dark)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', borderRadius: 16, overflow: 'hidden' }}>
      
      {activeTab !== 'workspaces' && (
        <div style={{ width: 240, borderRight: '1px solid var(--card-border)', background: 'var(--card-bg)', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 16, paddingLeft: 12 }}>PRINCIPAL</div>
          
          <SidebarItem icon={<Home size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={<MessageSquare size={18} />} label="Conversas" active={activeTab === 'conversas'} onClick={() => setActiveTab('conversas')} />
          <SidebarItem icon={<Users size={18} />} label="Contatos" active={activeTab === 'contatos'} onClick={() => setActiveTab('contatos')} />
          <SidebarItem icon={<Hash size={18} />} label="Canais" active={activeTab === 'canais'} onClick={() => setActiveTab('canais')} />
          <SidebarItem icon={<Settings size={18} />} label="Configurações" active={activeTab === 'configuracoes'} onClick={() => setActiveTab('configuracoes')} />
          
          <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--card-border)' }}>
            <SidebarItem icon={<ArrowLeft size={18} />} label="Voltar aos Workspaces" onClick={() => { setActiveInstance(null); setActiveTab('workspaces'); }} />
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'workspaces' && (
          <WorkspacesView 
            instances={instances} 
            onSelect={handleSelectWorkspace} 
            onCreate={() => setShowCreateModal(true)} 
            loading={loading}
          />
        )}
        {activeTab === 'canais' && <CanaisView instances={instances} connectInstance={connectInstance} />}
        {activeTab === 'conversas' && (
          <ConversasView 
            chats={chats} 
            selectedChat={selectedChat} 
            messages={messages} 
            newMessage={newMessage} 
            setNewMessage={setNewMessage} 
            fetchMessages={fetchMessages} 
            sendMessage={sendMessage} 
            messagesEndRef={messagesEndRef}
            activeInstance={activeInstance}
          />
        )}
        {activeTab === 'contatos' && <ContatosView chats={chats} />}
        {activeTab === 'dashboard' && <FunnelView chats={chats} />}
      </div>

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setQrCode(null); }} title={qrCode ? "Conectar WhatsApp" : "Novo Workspace"}>
        {qrCode ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <img src={qrCode} alt="QR Code" style={{ width: 250, height: 250, borderRadius: 12, border: '1px solid var(--card-border)' }} />
            <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Escaneie no seu WhatsApp para conectar.</p>
          </div>
        ) : (
          <div style={{ padding: 20 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Nome do Workspace/Instância</label>
            <input 
              type="text" 
              value={newInstanceName} 
              onChange={e => setNewInstanceName(e.target.value)} 
              placeholder="Ex: Comercial Foryou" 
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--text-primary)', marginBottom: 24 }} 
            />
            <button onClick={createInstance} disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
              {loading ? 'Criando...' : 'Criar e Gerar QR Code'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <div 
      onClick={onClick} 
      style={{ 
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', 
        background: active ? 'var(--bg-color)' : 'transparent', color: active ? 'var(--yellow)' : 'var(--text-secondary)', 
        fontWeight: active ? 600 : 500, transition: '0.2s', marginBottom: 4 
      }}
      onMouseEnter={e => { if(!active) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-color)'; } }}
      onMouseLeave={e => { if(!active) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; } }}
    >
      {icon}
      <span style={{ fontSize: 13 }}>{label}</span>
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-VIEWS
// ----------------------------------------------------------------------

function WorkspacesView({ instances, onSelect, onCreate, loading }) {
  return (
    <div style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--card-border)', background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 600 }}>
          <div style={{ width: 32, height: 32, background: 'var(--yellow)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutGrid size={16} color="#000" />
          </div>
          Multi Atendimento
        </div>
      </div>

      <div style={{ padding: 48, maxWidth: 1000, margin: '0 auto', width: '100%', overflowY: 'auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px 0' }}>Meus Workspaces</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 40 }}>Gerencie seus projetos e instâncias de WhatsApp conectadas.</p>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div onClick={onCreate} style={{ width: 300, height: 200, border: '1px dashed var(--card-border)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--card-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: 48, height: 48, background: 'var(--card-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Plus size={24} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Criar Workspace</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Adicione uma nova instância da Evolution API</div>
          </div>

          {loading && instances.length === 0 && <div style={{ padding: 40, color: 'var(--text-muted)' }}>Carregando workspaces...</div>}

          {instances.map((inst, i) => (
            <div key={i} onClick={() => onSelect(inst)} style={{ width: 360, height: 200, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, background: 'var(--yellow)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Home size={24} color="#000" />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{inst.name || inst.instanceName}</div>
                  <div style={{ fontSize: 13, color: inst.connectionStatus === 'open' ? 'var(--yellow)' : 'var(--text-muted)' }}>
                    {inst.connectionStatus === 'open' ? 'Conectado' : 'Desconectado'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', flex: 1 }}>ID da Instância: {inst.instanceId || 'N/A'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CanaisView({ instances, connectInstance }) {
  return (
    <div style={{ padding: 40, overflowY: 'auto', height: '100%', background: 'var(--bg-dark)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Canais</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Integrações com a Evolution API.</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {instances.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Nenhum canal encontrado.</div>}
        {instances.map((ch, i) => (
          <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={24} color="#000" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{ch.name || ch.instanceName}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: ch.connectionStatus === 'open' ? '#22C55E' : '#EF4444', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: 12 }}>
                    {ch.connectionStatus === 'open' ? 'ATIVO' : 'OFFLINE'}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>ID: {ch.instanceId}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {ch.connectionStatus !== 'open' && (
                <button onClick={() => connectInstance(ch)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Conectar QR</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConversasView({ chats, selectedChat, messages, newMessage, setNewMessage, fetchMessages, sendMessage, messagesEndRef, activeInstance }) {
  const isConnected = activeInstance?.connectionStatus === 'open';

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-dark)' }}>
      <div style={{ width: 320, background: 'var(--card-bg)', borderRight: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--card-border)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between' }}>
            Atendimento <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>{activeInstance?.name}</span>
          </h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chats.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center', fontSize: 13 }}>Nenhuma conversa carregada.</div>
          ) : (
            chats.map(chat => (
              <div 
                key={chat.id || chat.remoteJid} 
                onClick={() => fetchMessages(chat)}
                style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', cursor: 'pointer', background: selectedChat?.id === chat.id ? 'var(--bg-color)' : 'transparent' }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>{chat.pushName || chat.name || chat.remoteJid?.split('@')[0]}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Acesse para ver o histórico...
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card-bg)', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            <div style={{ width: 8, height: 8, background: isConnected ? '#22C55E' : '#EF4444', borderRadius: '50%' }} /> {isConnected ? 'Conectado' : 'Desconectado'}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!selectedChat ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} color="var(--yellow)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, color: 'var(--text-primary)' }}>Nenhuma conversa selecionada</h3>
            </div>
          ) : (
            <>
              {messages.map((m, i) => {
                const isMe = m.key?.fromMe;
                return (
                  <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', background: isMe ? 'var(--yellow)' : 'var(--card-bg)', color: isMe ? '#000' : 'var(--text-primary)', padding: '10px 14px', borderRadius: 12, borderBottomRightRadius: isMe ? 0 : 12, borderBottomLeftRadius: !isMe ? 0 : 12 }}>
                    <div style={{ fontSize: 14 }}>{m.message?.conversation || m.message?.extendedTextMessage?.text || 'Mensagem de mídia'}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div style={{ padding: 24, borderTop: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '12px 16px' }}>
            <input 
              type="text" 
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Digite sua mensagem..." 
              disabled={!selectedChat} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: 14 }} 
            />
            <button onClick={sendMessage} disabled={!selectedChat} style={{ width: 36, height: 36, background: 'var(--yellow)', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 16, cursor: 'pointer' }}>
              <Send size={16} color="#000" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContatosView({ chats }) {
  return (
    <div style={{ padding: 40, overflowY: 'auto', height: '100%', background: 'var(--bg-dark)' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Contatos Captados ({chats.length})</h2>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'var(--bg-color)' }}>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>NÚMERO</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>NOME NO WHATSAPP</th>
            </tr>
          </thead>
          <tbody>
            {chats.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--card-border)' }}>
                <td style={{ padding: '16px 24px', fontSize: 14 }}>{c.remoteJid?.split('@')[0]}</td>
                <td style={{ padding: '16px 24px', fontSize: 14 }}>{c.pushName || c.name || 'Desconhecido'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FunnelView({ chats }) {
  return (
    <div style={{ padding: 40, overflowY: 'auto', height: '100%', background: 'var(--bg-dark)' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Funil padrão</h2>
      <div style={{ display: 'flex', gap: 24, overflowX: 'auto' }}>
        <div style={{ width: 320, flexShrink: 0, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Atendimentos Ativos ({chats.length})</div>
          {chats.slice(0,10).map((c, i) => (
            <div key={i} style={{ background: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 16, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.pushName || 'Lead Sem Nome'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.remoteJid?.split('@')[0]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
