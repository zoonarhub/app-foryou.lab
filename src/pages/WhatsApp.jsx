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
      const state = response.data.instance?.state || response.data.state || response.data.status;
      if (state === 'open' || response.data.instance?.status === 'open') setConnected(true);
    } catch (e) {
      setConnected(false);
    }
  };

  const fetchChats = async () => {
    setLoadingChats(true);
    const endpoints = [`/chat/findChats/${instanceName}`, `/chat/fetchChats/${instanceName}`];
    let found = false;

    for (const ep of endpoints) {
      if (found) break;
      try {
        const response = await axios.get(`${evolutionApiUrl}${ep}`, {
          headers: { 'apikey': evolutionApiKey }
        });
        // Extração resiliente de dados
        const data = response.data?.records || response.data?.data || response.data || [];
        setChats(Array.isArray(data) ? data : []);
        found = true;
      } catch (e) {
        console.error(`Falha no endpoint ${ep}`);
      }
    }

    if (!found) addToast('Erro ao carregar conversas', 'error');
    setLoadingChats(false);
  };

  const fetchMessages = async (chat) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    setMessages([]); // Limpa antes de carregar
    
    const jid = chat.id || chat.remoteJid;
    try {
      // Tenta buscar mensagens - Algumas versões usam POST /chat/findMessages, outras GET
      const response = await axios.post(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
        key: { remoteJid: jid },
        count: 50
      }, {
        headers: { 'apikey': evolutionApiKey }
      });
      
      // Extração resiliente de mensagens
      let msgs = response.data?.messages || response.data?.records || response.data?.data || response.data || [];
      
      // Se vier um objeto único em vez de array, envolvemos em array
      if (!Array.isArray(msgs) && typeof msgs === 'object') msgs = [msgs];
      
      setMessages(msgs.reverse());
    } catch (e) {
      console.error('Erro ao buscar mensagens:', e);
      addToast('Não foi possível carregar o histórico', 'error');
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
      
      const localMsg = { 
        key: { fromMe: true }, 
        message: { conversation: newMessage }, 
        messageTimestamp: Math.floor(Date.now() / 1000) 
      };
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
      else if (response.data.instance?.state === 'open' || response.data.status === 'open') {
        setConnected(true);
        setShowConnectModal(false);
      }
    } catch (err) {
      addToast('Falha na API', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const filteredChats = chats.filter(c => 
    (c.pushName || c.name || c.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!connected) {
    return (
      <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 100px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 100, height: 100, background: 'rgba(255,214,0,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
            <Smartphone size={48} color="var(--yellow)" style={{ opacity: 0.5 }} />
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Central WhatsApp</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 40 }}>Conecte-se para começar a atender.</p>
          <button className="btn btn-primary" onClick={() => { setShowConnectModal(true); generateQrCode(); }}>Conectar Instância</button>
        </div>

        <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Escanear QR Code">
           <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ width: 280, height: 280, background: '#fff', margin: '0 auto 20px', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' }}>
                {syncing ? <RefreshCw className="spin" size={40} color="var(--yellow)" /> : qrCode ? <img src={qrCode} style={{ width: '85%' }} /> : <AlertTriangle size={40} color="red" />}
              </div>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={generateQrCode}>Atualizar</button>
           </div>
        </Modal>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', margin: -20, background: 'var(--bg-dark)', borderRadius: 16, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 380, borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', background: 'rgba(18,18,18,0.4)', backdropFilter: 'blur(10px)' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800 }}>Mensagens</h3>
            <button className="btn-icon" onClick={fetchChats}><RefreshCw size={16} /></button>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Search size={16} style={{ opacity: 0.3 }} />
            <input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: '#fff', width: '100%' }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingChats ? <div style={{ textAlign: 'center', padding: 40 }}><RefreshCw className="spin" color="var(--yellow)" /></div> : 
           filteredChats.map((chat, i) => (
            <div key={i} onClick={() => fetchMessages(chat)} style={{ padding: '16px 20px', display: 'flex', gap: 16, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)', background: (selectedChat?.id === chat.id || selectedChat?.remoteJid === chat.remoteJid) ? 'rgba(255,214,0,0.05)' : 'transparent' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} style={{ opacity: 0.3 }} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{chat.pushName || chat.name || chat.id?.split('@')[0]}</div>
                <div style={{ fontSize: 12, opacity: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.message?.conversation || 'Sem mensagens'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedChat ? (
          <>
            <div style={{ padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} /></div>
              <div style={{ fontWeight: 800 }}>{selectedChat.pushName || selectedChat.name}</div>
            </div>
            <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
              {loadingMessages ? <div style={{ textAlign: 'center' }}><RefreshCw className="spin" /></div> : 
               messages.map((msg, i) => {
                const fromMe = msg.key?.fromMe;
                const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                if (!text) return null;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: fromMe ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
                    <div style={{ maxWidth: '70%', padding: '12px 18px', borderRadius: 16, background: fromMe ? 'var(--yellow)' : 'rgba(255,255,255,0.05)', color: fromMe ? '#000' : '#fff' }}>{text}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: '24px 40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: 12 }}>
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Mensagem..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: '#fff' }} />
                <button onClick={sendMessage} style={{ background: 'var(--yellow)', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 800 }}><Send size={16} /></button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}><MessageSquare size={80} /></div>
        )}
      </div>
    </div>
  );
}
