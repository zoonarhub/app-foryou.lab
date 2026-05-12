import { useState, useEffect, useRef } from 'react';
import { useApp } from '../data/store';
import { 
  Smartphone, AlertTriangle, QrCode, RefreshCw, Settings, CheckCircle, LogOut,
  Send, Search, User, Phone, Smile, Paperclip, MoreVertical, MessageSquare
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
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Estados para o Chat
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
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
      if (response.data.instance?.state === 'open' || response.data.state === 'open') {
        setConnected(true);
      }
    } catch (e) {
      console.log('Status: Desconectado.');
    }
  };

  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      const response = await axios.get(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
        headers: { 'apikey': evolutionApiKey }
      });
      setChats(response.data || []);
    } catch (e) {
      console.error('Erro ao buscar chats:', e);
      addToast('Erro ao carregar conversas', 'error');
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchMessages = async (chat) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    try {
      const response = await axios.post(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
        key: { remoteJid: chat.id || chat.remoteJid },
        count: 50
      }, {
        headers: { 'apikey': evolutionApiKey }
      });
      // A Evolution pode retornar em formatos diferentes dependendo da versão
      const msgs = response.data.messages || response.data || [];
      setMessages(Array.isArray(msgs) ? msgs.reverse() : []);
    } catch (e) {
      console.error('Erro ao buscar mensagens:', e);
      addToast('Erro ao carregar mensagens', 'error');
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
        options: { delay: 1200, presence: "composing", linkPreview: false },
        textMessage: { text: newMessage }
      }, {
        headers: { 'apikey': evolutionApiKey }
      });
      
      // Adicionar mensagem localmente para feedback imediato
      const localMsg = {
        key: { fromMe: true },
        message: { conversation: newMessage },
        messageTimestamp: Math.floor(Date.now() / 1000)
      };
      setMessages([...messages, localMsg]);
      setNewMessage('');
    } catch (e) {
      addToast('Falha ao enviar mensagem', 'error');
    }
  };

  const generateQrCode = async () => {
    setSyncing(true);
    setQrCode(null);
    setErrorMessage(null);
    
    const endpoints = [
      `${evolutionApiUrl}/instance/connect/${instanceName}`,
      `${evolutionApiUrl}/v2/instance/connect/${instanceName}`,
      `${evolutionApiUrl}/instance/qrcode/${instanceName}`
    ];
    
    let success = false;
    for (const url of endpoints) {
      if (success) break;
      try {
        const response = await axios.get(url, { headers: { 'apikey': instanceToken || evolutionApiKey }, timeout: 8000 });
        if (response.data.base64) {
          setQrCode(response.data.base64);
          success = true;
        } else if (response.data.instance?.state === 'open' || response.data.state === 'open' || response.data.message?.includes('already')) {
          setConnected(true);
          setShowConnectModal(false);
          success = true;
        }
      } catch (err) {}
    }

    if (!success) setErrorMessage("Falha ao gerar QR Code. Tente novamente.");
    setSyncing(false);
  };

  const logoutInstance = async () => {
    if (!window.confirm('Desconectar WhatsApp?')) return;
    try {
      await axios.delete(`${evolutionApiUrl}/instance/logout/${instanceName}`, { headers: { 'apikey': evolutionApiKey } });
      setConnected(false);
      setSelectedChat(null);
    } catch (e) { addToast('Erro ao desconectar', 'error'); }
  };

  const handleSaveConfig = () => {
    const cleanUrl = configUrl.endsWith('/') ? configUrl.slice(0, -1) : configUrl;
    setEvoConfig(cleanUrl, configKey);
    setShowSettings(false);
  };

  if (showSettings) {
    return (
      <div className="page-body">
        <div className="card" style={{ padding: 40, maxWidth: 500, margin: '40px auto' }}>
          <h3 style={{ marginBottom: 24 }}>Configurar Evolution</h3>
          <div className="form-group">
            <label className="form-label">URL da API</label>
            <input className="form-input" value={configUrl} onChange={e => setConfigUrl(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Global API Key</label>
            <input className="form-input" type="password" value={configKey} onChange={e => setConfigKey(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleSaveConfig}>Salvar</button>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="page-body" style={{ textAlign: 'center', padding: 100 }}>
        <Smartphone size={80} style={{ opacity: 0.1, marginBottom: 24 }} />
        <h2>WhatsApp Desconectado</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Conecte sua instância para gerenciar conversas.</p>
        <button className="btn btn-primary" onClick={() => { setShowConnectModal(true); generateQrCode(); }}>Conectar Agora</button>
        
        <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Escanear QR Code">
           <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ width: 260, height: 260, background: '#eee', margin: '0 auto 20px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {syncing ? <RefreshCw className="spin" /> : qrCode ? <img src={qrCode} style={{ width: '100%' }} /> : <AlertTriangle color="red" />}
              </div>
              {errorMessage && <p style={{ color: 'red', fontSize: 12 }}>{errorMessage}</p>}
              <button className="btn btn-secondary" onClick={generateQrCode}>Tentar Novamente</button>
           </div>
        </Modal>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', margin: -20, background: 'var(--bg-main)' }}>
      {/* Sidebar de Chats */}
      <div style={{ width: 350, borderRight: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Mensagens</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icon" onClick={fetchChats}><RefreshCw size={16} /></button>
              <button className="btn-icon" onClick={logoutInstance}><LogOut size={16} color="red" /></button>
            </div>
          </div>
          <div className="search-bar">
            <Search size={14} />
            <input placeholder="Buscar conversa..." style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13 }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingChats ? (
            <div style={{ textAlign: 'center', padding: 40 }}><RefreshCw className="spin" /></div>
          ) : chats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Nenhuma conversa encontrada</div>
          ) : (
            chats.map((chat, i) => (
              <div 
                key={i} 
                onClick={() => fetchMessages(chat)}
                style={{ 
                  padding: '16px 20px', display: 'flex', gap: 12, cursor: 'pointer',
                  borderBottom: '1px solid #f5f5f5',
                  background: (selectedChat?.id === chat.id || selectedChat?.remoteJid === chat.remoteJid) ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent'
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} color="#999" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.pushName || chat.name || chat.id?.split('@')[0] || 'Contato'}
                    </span>
                    <span style={{ fontSize: 11, color: '#999' }}>12:30</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.message?.conversation || 'Sem mensagens...'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Janela de Mensagens */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedChat ? (
          <>
            <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{selectedChat.pushName || selectedChat.name || 'Conversa'}</div>
                  <div style={{ fontSize: 11, color: 'var(--green)' }}>Online via {instanceName}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, opacity: 0.5 }}>
                <Phone size={18} />
                <MoreVertical size={18} />
              </div>
            </div>

            <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: '#f8f9fa' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center' }}><RefreshCw className="spin" /></div>
              ) : (
                messages.map((msg, i) => {
                  const fromMe = msg.key?.fromMe;
                  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                  if (!text) return null;
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: fromMe ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                      <div style={{ 
                        maxWidth: '70%', padding: '10px 16px', borderRadius: 12, fontSize: 14, lineHeight: 1.5,
                        background: fromMe ? 'var(--primary)' : '#fff',
                        color: fromMe ? '#fff' : '#333',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        {text}
                        <div style={{ fontSize: 9, textAlign: 'right', marginTop: 4, opacity: 0.7 }}>
                          {new Date(msg.messageTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: 20, background: '#fff', borderTop: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f0f2f5', padding: '8px 16px', borderRadius: 24 }}>
                <Smile size={20} style={{ opacity: 0.5 }} />
                <Paperclip size={20} style={{ opacity: 0.5 }} />
                <input 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Digite sua mensagem..." 
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '8px 0' }} 
                />
                <button 
                  onClick={sendMessage}
                  style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
            <MessageSquare size={80} style={{ marginBottom: 24 }} />
            <p>Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
