import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Smartphone, AlertTriangle, QrCode, RefreshCw, Settings, CheckCircle, Key
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
  const [instanceToken, setInstanceToken] = useState('8A62A48F71E4-4543-A40A-F0C86F4A1F0F'); // Token que você me mandou
  const [errorMessage, setErrorMessage] = useState(null);
  
  const [configUrl, setConfigUrl] = useState(evolutionApiUrl);
  const [configKey, setConfigKey] = useState(evolutionApiKey);

  const generateQrCode = async () => {
    if (!evolutionApiUrl || (!evolutionApiKey && !instanceToken)) {
      return addToast('Configure a URL e a Chave de API primeiro!', 'error');
    }

    setSyncing(true);
    setQrCode(null);
    setErrorMessage(null);
    
    const prefixes = ['', '/v1', '/v2'];
    const endpoints = ['/instance/connect', '/instance/qrcode'];
    
    // Tenta primeiro com o Instance Token, depois com a Global Key
    const keysToTry = [instanceToken, evolutionApiKey].filter(k => !!k);
    
    let success = false;
    let lastError = null;

    for (const key of keysToTry) {
      if (success) break;
      for (const prefix of prefixes) {
        if (success) break;
        for (const endpoint of endpoints) {
          if (success) break;
          
          const testUrl = `${evolutionApiUrl}${prefix}${endpoint}/${instanceName}`;
          console.log('Tentando com chave:', key.substring(0, 5) + '...', 'em:', testUrl);
          
          try {
            const response = await axios.get(testUrl, {
              headers: { 'apikey': key },
              timeout: 6000
            });
            
            if (response.data.base64) {
              setQrCode(response.data.base64);
              success = true;
              addToast('Conexão autorizada!');
            } else if (response.data.instance?.status === 'open' || response.data.status === 'open') {
              setConnected(true);
              setShowConnectModal(false);
              success = true;
              addToast('WhatsApp conectado!');
            }
          } catch (err) {
            lastError = err;
          }
        }
      }
    }

    if (!success) {
      const status = lastError?.response?.status;
      if (status === 404) {
        setErrorMessage(`Não encontrado. Verifique se o nome "${instanceName}" está correto.`);
      } else if (status === 401 || status === 403) {
        setErrorMessage('Erro de Autorização: O Token da Instância ou a Global Key parecem incorretos.');
      } else {
        setErrorMessage('Erro de Rede: O servidor da Evolution não respondeu ou bloqueou o acesso (CORS).');
      }
    }
    
    setSyncing(false);
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
          <div className="breadcrumb">Integração via Token de Instância</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowSettings(true)}><Settings size={14} /> Configurações</button>
          {!connected ? (
            <button className="btn btn-primary" onClick={() => { setShowConnectModal(true); generateQrCode(); }}><QrCode size={14} /> Gerar QR</button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%' }} /> {instanceName} Ativa
            </div>
          )}
        </div>
      </div>

      <div className="page-body">
        {showSettings ? (
          <div className="card" style={{ padding: 40, maxWidth: 500, margin: '20px auto' }}>
            <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 800 }}>Dados de Acesso</h3>
            <div className="form-group">
              <label className="form-label">URL da API</label>
              <input className="form-input" value={configUrl} onChange={e => setConfigUrl(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Global API Key</label>
              <input className="form-input" type="password" value={configKey} onChange={e => setConfigKey(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Token da Instância (Opcional)</label>
              <input className="form-input" value={instanceToken} onChange={e => setInstanceToken(e.target.value)} placeholder="Código que você me enviou" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleSaveConfig}>Salvar Configuração</button>
          </div>
        ) : !connected ? (
          <div className="card" style={{ padding: 80, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
            <Smartphone size={60} style={{ margin: '0 auto 24px', opacity: 0.2 }} />
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Conectar WhatsApp</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
              Aguardando sincronização com a instância <b>{instanceName}</b>.
            </p>
            <button className="btn btn-primary" onClick={() => { setShowConnectModal(true); generateQrCode(); }} style={{ padding: '14px 40px' }}>Escanear QR Code</button>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
             <CheckCircle size={60} color="var(--green)" style={{ margin: '0 auto 24px' }} />
             <h3 style={{ fontSize: 24, fontWeight: 800 }}>Dispositivo Conectado!</h3>
             <p style={{ color: 'var(--text-secondary)' }}>A instância {instanceName} está operando normalmente.</p>
             <button className="btn btn-secondary" style={{ marginTop: 24 }} onClick={() => setConnected(false)}>Desvincular</button>
          </div>
        )}
      </div>

      <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Conexão com Celular" size="md">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ 
            width: 280, height: 280, background: '#fff', margin: '0 auto 24px', borderRadius: 16, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--card-border)',
            position: 'relative', flexDirection: 'column', padding: 10
          }}>
            {syncing ? (
              <div style={{ textAlign: 'center' }}>
                <RefreshCw size={40} className="spin" color="var(--yellow)" />
                <div style={{ fontSize: 12, marginTop: 12, color: '#666' }}>Autenticando com Token...</div>
              </div>
            ) : qrCode ? (
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : errorMessage ? (
              <div style={{ padding: 20 }}>
                <AlertTriangle size={32} color="var(--red)" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4, fontWeight: 600 }}>{errorMessage}</div>
              </div>
            ) : (
              <div style={{ color: '#666', fontSize: 12 }}>Buscando QR Code...</div>
            )}
          </div>
          
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Nome da Instância</label>
            <input className="form-input" value={instanceName} onChange={e => setInstanceName(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowConnectModal(false)}>Fechar</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={generateQrCode} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''} /> Reconectar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
