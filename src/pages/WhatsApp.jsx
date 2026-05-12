import { useState, useEffect, useRef } from 'react';
import { useApp } from '../data/store';
import { 
  Smartphone, AlertTriangle, QrCode, RefreshCw, Settings, CheckCircle, LogOut,
  Send, Search, User, Phone, Smile, Paperclip, MoreVertical, MessageSquare,
  Circle, ShieldCheck
} from 'lucide-react';
import Modal from '../components/Modal';
import axios from 'axios';

export default function WhatsAppPage() {
  const { addToast, evolutionApiUrl, evolutionApiKey, setEvoConfig } = useApp();
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSettings, setShowSettings] = useState(!evolutionApiUrl);
  const [qrCode, setQrCode] = useState(null);
  const [instanceName, setInstanceName] = useState('formou.lab');
  const [instanceToken, setInstanceToken] = useState('8A62A48F71E4-4543-A40A-F0C86F4A1F0F');
  
  // Chat States
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (evolutionApiUrl && evolutionApiKey) {
      checkStatus();
    }
  }, []);

  useEffect(() => {
    if (connected) {
      fetchChats();
    }
  }, [connected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkStatus = async () => {
    try {
      const response = await axios.get(`${evolutionApiUrl}/instance/connectionStatus/${instanceName}`, {
        headers: { 'apikey': evolutionApiKey }
      });
      const state = response.data.instance?.state || response.data.state;
      if (state === 'open') setConnected(true);
    } catch (e) {
      setConnected(false);
    }
  };

  const fetchChats = async () => {
    setLoadingChats(true);
    // Tentando endpoints diferentes da v2
    const endpoints = [`/chat/findChats/${instanceName}`, `/chat/fetchChats/${instanceName}`];
    let found = false;

    for (const ep of endpoints) {
      if (found) break;
      try {
        const response = await axios.get(`${evolutionApiUrl}${ep}`, {
          headers: { 'apikey': evolutionApiKey }
        });
        const data = response.data || [];
        setChats(Array.isArray(data) ? data : []);
        found = true;
      } catch (e) {
        console.error(`Falha no endpoint ${ep}`);
      }
    }

    if (!found) addToast('Erro ao carregar conversas. Verifique a API.', 'error');
    setLoadingChats(false);
  };

  const fetchMessages = async (chat) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    const jid = chat.id || chat.remoteJid;
    try {
      const response = await axios.post(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
        key: { remoteJid: jid },
        count: 40
      }, {
        headers: { 'apikey': evolutionApiKey }
      });
      const msgs = response.data.messages || response.data || [];
      setMessages(Array.isArray(msgs) ? msgs.reverse() : []);
    } catch (e) {
      addToast('Erro ao carregar histórico', 'error');
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    const jid = selectedChat.id || selectedChat.remoteJid;
    try {
      await axios.post(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
        number: jid,
        textMessage: { text: newMessage }
      }, {
        headers: { 'apikey': evolutionApiKey }
      });
      const localMsg = { key: { fromMe: true }, message: { conversation: newMessage }, messageTimestamp: Math.floor(Date.now() / 1000) };
      setMessages([...messages, localMsg]);
      setNewMessage('');
    } catch (e) {
      addToast('Erro ao enviar', 'error');
    }
  };

  const generateQrCode = async () => {
    setSyncing(true);
    setQrCode(null);
    try {
      const response = await axios.get(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
        headers: { 'apikey': instanceToken || evolutionApiKey }
      });
      if (response.data.base64) setQrCode(response.data.base64);
      else if (response.data.instance?.state === 'open') {
        setConnected(true);
        setShowConnectModal(false);
      }
    } catch (err) {
      addToast('Falha na Evolution API', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const logoutInstance = async () => {
    if (!window.confirm('Desconectar WhatsApp?')) return;
    try {
      await axios.delete(`${evolutionApiUrl}/instance/logout/${instanceName}`, { headers: { 'apikey': evolutionApiKey } });
      setConnected(false);
      setSelectedChat(null);
    } catch (e) { addToast('Erro ao deslogar', 'error'); }
  };

  const filteredChats = chats.filter(c => 
    (c.pushName || c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showSettings) {
    return (
      <div className="page-body" style={{ background: 'var(--bg-main)', height: '100vh' }}>
        <div className="card" style={{ padding: 40, maxWidth: 500, margin: '60px auto', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(23,23,23,0.8)', backdropFilter: 'blur(20px)' }}>
          <h3 style={{ marginBottom: 24, fontSize: 24, fontWeight: 800 }}>Configurações Evolution</h3>
          <div className="form-group">
            <label className="form-label" style={{ opacity: 0.6 }}>URL da API</label>
            <input className="form-input" value={configUrl} onChange={e => setConfigUrl(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ opacity: 0.6 }}>Global API Key</label>
            <input className="form-input" type="password" value={configKey} onChange={e => setConfigKey(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 12, height: 50 }} onClick={() => { setEvoConfig(configUrl, configKey); setShowSettings(false); }}>Salvar Alterações</button>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 100px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 100, height: 100, background: 'rgba(255,214,0,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
            <Smartphone size={48} color="var(--yellow)" style={{ opacity: 0.5 }} />
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Conecte seu WhatsApp</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.6 }}>Vincule sua instância <b>{instanceName}</b> para gerenciar conversas e automações.</p>
          <button className="btn btn-primary" style={{ padding: '16px 48px', fontSize: 16 }} onClick={() => { setShowConnectModal(true); generateQrCode(); }}>Gerar QR Code Agora</button>
        </div>

        <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Sincronização" size="md">
           <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ width: 280, height: 280, background: '#fff', margin: '0 auto 32px', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                {syncing ? <RefreshCw className="spin" size={40} color="var(--yellow)" /> : qrCode ? <img src={qrCode} style={{ width: '85%' }} /> : <AlertTriangle size={40} color="red" />}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Abra o WhatsApp no seu celular e escaneie o código acima.</p>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={generateQrCode}><RefreshCw size={14} /> Atualizar Código</button>
           </div>
        </Modal>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', margin: -20, background: 'var(--bg-dark)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Sidebar - Chat List */}
      <div style={{ width: 380, borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', background: 'rgba(18,18,18,0.4)', backdropFilter: 'blur(10px)' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, background: 'var(--green)', borderRadius: '50%', boxShadow: '0 0 10px var(--green)' }} />
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Mensagens</h3>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icon" onClick={fetchChats} style={{ background: 'rgba(255,255,255,0.05)' }}><RefreshCw size={16} /></button>
              <button className="btn-icon" onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.05)' }}><Settings size={16} /></button>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Search size={16} style={{ opacity: 0.3 }} />
            <input 
              placeholder="Buscar contatos..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', color: '#fff', width: '100%', fontSize: 14 }} 
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingChats ? (
            <div style={{ textAlign: 'center', padding: 60 }}><RefreshCw className="spin" color="var(--yellow)" /></div>
          ) : filteredChats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, opacity: 0.3 }}>Nenhuma conversa</div>
          ) : (
            filteredChats.map((chat, i) => (
              <div 
                key={i} 
                onClick={() => fetchMessages(chat)}
                style={{ 
                  padding: '16px 20px', display: 'flex', gap: 16, cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.02)',
                  transition: 'all 0.2s',
                  background: (selectedChat?.id === chat.id || selectedChat?.remoteJid === chat.remoteJid) ? 'rgba(255,214,0,0.05)' : 'transparent'
                }}
                className="chat-item-hover"
              >
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <User size={28} style={{ opacity: 0.3 }} />
                  </div>
                  <Circle size={10} fill="var(--green)" color="transparent" style={{ position: 'absolute', bottom: -2, right: -2, border: '2px solid var(--bg-dark)', borderRadius: '50%' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.pushName || chat.name || chat.id?.split('@')[0] || 'Contato'}
                    </span>
                    <span style={{ fontSize: 11, opacity: 0.4 }}>Agência</span>
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.message?.conversation || 'Iniciar conversa...'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(10,10,10,0.4)' }}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div style={{ padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(18,18,18,0.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedChat.pushName || selectedChat.name || 'Chat'}</div>
                  <div style={{ fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ShieldCheck size={12} /> Criptografado via {instanceName}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, opacity: 0.4 }}>
                <Phone size={20} style={{ cursor: 'pointer' }} />
                <MoreVertical size={20} style={{ cursor: 'pointer' }} />
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', background: 'radial-gradient(circle at center, rgba(255,214,0,0.02) 0%, transparent 70%)' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', paddingTop: 100 }}><RefreshCw className="spin" color="var(--yellow)" /></div>
              ) : (
                messages.map((msg, i) => {
                  const fromMe = msg.key?.fromMe;
                  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                  if (!text) return null;
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: fromMe ? 'flex-end' : 'flex-start', marginBottom: 20 }}>
                      <div style={{ 
                        maxWidth: '65%', padding: '14px 20px', borderRadius: fromMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px', fontSize: 14, lineHeight: 1.6,
                        background: fromMe ? 'var(--yellow)' : 'rgba(255,255,255,0.05)',
                        color: fromMe ? '#000' : '#fff',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        border: fromMe ? 'none' : '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {text}
                        <div style={{ fontSize: 10, textAlign: 'right', marginTop: 8, opacity: 0.5, fontWeight: 600 }}>
                          {new Date(msg.messageTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div style={{ padding: '24px 40px', background: 'rgba(18,18,18,0.8)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 24px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Smile size={22} style={{ opacity: 0.3, cursor: 'pointer' }} />
                <Paperclip size={22} style={{ opacity: 0.3, cursor: 'pointer' }} />
                <input 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Escreva sua mensagem aqui..." 
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: '#fff', padding: '8px 0', fontSize: 15 }} 
                />
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{ 
                    background: newMessage.trim() ? 'var(--yellow)' : 'rgba(255,255,255,0.05)', 
                    color: '#000', border: 'none', borderRadius: 12, padding: '10px 20px', 
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 800,
                    transition: 'all 0.3s'
                  }}
                >
                  Enviar <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
            <div style={{ width: 120, height: 120, border: '2px dashed #fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
               <MessageSquare size={60} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Central de Atendimento</h2>
            <p>Selecione um cliente para iniciar o chat</p>
          </div>
        )}
      </div>
    </div>
  );
}
