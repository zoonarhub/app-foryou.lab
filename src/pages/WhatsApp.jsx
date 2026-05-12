import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Smartphone, AlertTriangle, QrCode, RefreshCw, Settings, CheckCircle, LogOut
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
  
  const [configUrl, setConfigUrl] = useState(evolutionApiUrl);
  const [configKey, setConfigKey] = useState(evolutionApiKey);

  // Verificar status ao carregar a página
  useEffect(() => {
    if (evolutionApiUrl && evolutionApiKey) {
      checkStatus();
    }
  }, []);

  const checkStatus = async () => {
    try {
      const response = await axios.get(`${evolutionApiUrl}/instance/connectionStatus/${instanceName}`, {
        headers: { 'apikey': evolutionApiKey }
      });
      if (response.data.instance?.state === 'open' || response.data.state === 'open') {
        setConnected(true);
      }
    } catch (e) {
      console.log('Status: Desconectado ou instância não existe.');
    }
  };

  const generateQrCode = async () => {
    setSyncing(true);
    setQrCode(null);
    setErrorMessage(null);
    
    const prefixes = ['', '/v1', '/v2'];
    const endpoints = ['/instance/connect', '/instance/qrcode'];
    const keysToTry = [instanceToken, evolutionApiKey].filter(k => !!k);
    
    let success = false;

    for (const key of keysToTry) {
      if (success) break;
      for (const prefix of prefixes) {
        if (success) break;
        for (const endpoint of endpoints) {
          if (success) break;
          
          const testUrl = `${evolutionApiUrl}${prefix}${endpoint}/${instanceName}`;
          try {
            const response = await axios.get(testUrl, {
              headers: { 'apikey': key },
              timeout: 8000
            });
            
            console.log('Resposta da Evolution:', response.data);

            // Se retornar base64, mostra o QR Code
            if (response.data.base64) {
              setQrCode(response.data.base64);
              success = true;
            } 
            // Se disser que já está aberto ou conectado
            else if (
              response.data.instance?.state === 'open' || 
              response.data.state === 'open' ||
              response.data.instance?.status === 'open' ||
              response.data.status === 'open' ||
              response.data.message === 'Instance already connected'
            ) {
              setConnected(true);
              setShowConnectModal(false);
              success = true;
              addToast('WhatsApp já está conectado e pronto!');
            }
          } catch (err) {
            console.log(`Falha em ${testUrl}:`, err.response?.data || err.message);
          }
        }
      }
    }

    if (!success) {
      setErrorMessage(`Instância "${instanceName}" não retornou QR Code. Se ela já estiver conectada no Manager, feche esta janela.`);
      addToast('Erro ao sincronizar', 'error');
    }
    
    setSyncing(false);
  };

  const logoutInstance = async () => {
    if (!window.confirm('Deseja realmente desconectar esta instância?')) return;
    try {
      await axios.delete(`${evolutionApiUrl}/instance/logout/${instanceName}`, {
        headers: { 'apikey': evolutionApiKey }
      });
      setConnected(false);
      addToast('Instância desconectada com sucesso.');
    } catch (e) {
      addToast('Erro ao desconectar. Tente pelo Manager.', 'error');
    }
  };

  const handleSaveConfig = () => {
    const cleanUrl = configUrl.endsWith('/') ? configUrl.slice(0, -1) : configUrl;
    setEvoConfig(cleanUrl, configKey);
    setShowSettings(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>WhatsApp Evolution</h2>
          <div className="breadcrumb">Gerenciamento de Instância Oficial</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowSettings(true)}><Settings size={14} /> Configurar</button>
          {connected && (
            <button className="btn btn-secondary" style={{ color: 'var(--red)' }} onClick={logoutInstance}><LogOut size={14} /> Logout</button>
          )}
        </div>
      </div>

      <div className="page-body">
        {showSettings ? (
          <div className="card" style={{ padding: 40, maxWidth: 500, margin: '20px auto' }}>
            <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 800 }}>Ajustes de Conexão</h3>
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
        ) : connected ? (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
             <div style={{ width: 80, height: 80, background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle size={48} color="var(--green)" />
             </div>
             <h3 style={{ fontSize: 24, fontWeight: 800 }}>WhatsApp Conectado!</h3>
             <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Sua instância <b>{instanceName}</b> está ativa e sincronizada.</p>
             <button className="btn btn-primary" onClick={() => addToast('Sincronizando mensagens...')}>Abrir Gerenciador de Chats</button>
          </div>
        ) : (
          <div className="card" style={{ padding: 80, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
            <Smartphone size={60} style={{ margin: '0 auto 24px', opacity: 0.2 }} />
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Conexão Necessária</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
              A instância <b>{instanceName}</b> não está vinculada a este painel.
            </p>
            <button className="btn btn-primary" onClick={() => { setShowConnectModal(true); generateQrCode(); }} style={{ padding: '14px 40px' }}>Conectar Agora</button>
          </div>
        )}
      </div>

      <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Conectar Dispositivo" size="md">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ 
            width: 280, height: 280, background: '#fff', margin: '0 auto 24px', borderRadius: 16, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--card-border)',
            position: 'relative', flexDirection: 'column', padding: 10
          }}>
            {syncing ? (
              <div style={{ textAlign: 'center' }}>
                <RefreshCw size={40} className="spin" color="var(--yellow)" />
                <div style={{ fontSize: 12, marginTop: 12, color: '#666' }}>Validando Conexão...</div>
              </div>
            ) : qrCode ? (
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : errorMessage ? (
              <div style={{ padding: 20 }}>
                <AlertTriangle size={32} color="var(--red)" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4, fontWeight: 600 }}>{errorMessage}</div>
              </div>
            ) : (
              <div style={{ color: '#666', fontSize: 12 }}>Buscando...</div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowConnectModal(false)}>Cancelar</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={generateQrCode} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''} /> Atualizar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
