import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Smartphone, AlertTriangle, QrCode, RefreshCw, Settings, CheckCircle
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
  const [errorMessage, setErrorMessage] = useState(null);
  
  const [configUrl, setConfigUrl] = useState(evolutionApiUrl);
  const [configKey, setConfigKey] = useState(evolutionApiKey);

  const generateQrCode = async () => {
    if (!evolutionApiUrl || !evolutionApiKey) {
      return addToast('Configure a URL e a API Key primeiro!', 'error');
    }

    setSyncing(true);
    setQrCode(null);
    setErrorMessage(null);
    
    // Lista de prefixos comuns da Evolution API para tentar encontrar o certo
    const prefixes = ['', '/v1', '/v2'];
    const endpoints = ['/instance/connect', '/instance/qrcode'];
    
    let success = false;
    let lastError = null;

    for (const prefix of prefixes) {
      for (const endpoint of endpoints) {
        if (success) break;
        
        const testUrl = `${evolutionApiUrl}${prefix}${endpoint}/${instanceName}`;
        console.log('Tentando conexão em:', testUrl);
        
        try {
          const response = await axios.get(testUrl, {
            headers: { 'apikey': evolutionApiKey },
            timeout: 5000 // 5 segundos para cada tentativa
          });
          
          if (response.data.base64) {
            setQrCode(response.data.base64);
            success = true;
            addToast('Conectado com sucesso!');
          } else if (response.data.instance?.status === 'open' || response.data.status === 'open') {
            setConnected(true);
            setShowConnectModal(false);
            success = true;
            addToast('WhatsApp já conectado!');
          }
        } catch (err) {
          lastError = err;
          console.log(`Falha no endpoint ${testUrl}:`, err.response?.status || err.message);
        }
      }
    }

    if (!success) {
      const status = lastError?.response?.status;
      if (status === 404) {
        setErrorMessage(`Instância "${instanceName}" não encontrada em nenhum endpoint. Verifique se o nome está correto no Manager.`);
      } else if (status === 401 || status === 403) {
        setErrorMessage('Erro de Autenticação: Verifique se sua Global API Key está correta.');
      } else {
        setErrorMessage('Erro de Conexão: O servidor não respondeu. Verifique se a URL da API está correta (ex: https://evo.dominio.com) e se o CORS está liberado.');
      }
      addToast('Erro ao buscar QR Code', 'error');
    }
    
    setSyncing(false);
  };

  const handleSaveConfig = () => {
    // Garantir que a URL não termine com / para não duplicar no código
    const cleanUrl = configUrl.endsWith('/') ? configUrl.slice(0, -1) : configUrl;
    setEvoConfig(cleanUrl, configKey);
    setShowSettings(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>WhatsApp Evolution</h2>
          <div className="breadcrumb">Status da Conexão em Tempo Real</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowSettings(true)}><Settings size={14} /> Configurações</button>
          {!connected ? (
            <button className="btn btn-primary" onClick={() => { setShowConnectModal(true); generateQrCode(); }}><QrCode size={14} /> Conectar</button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%' }} /> Instância Ativa: {instanceName}
            </div>
          )}
        </div>
      </div>

      <div className="page-body">
        {showSettings ? (
          <div className="card" style={{ padding: 40, maxWidth: 500, margin: '20px auto' }}>
            <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 800 }}>Configurações de API</h3>
            <div className="form-group">
              <label className="form-label">URL da Evolution (sem / no final)</label>
              <input className="form-input" value={configUrl} onChange={e => setConfigUrl(e.target.value)} placeholder="https://evo.dominio.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Global API Key</label>
              <input className="form-input" type="password" value={configKey} onChange={e => setConfigKey(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleSaveConfig}>Salvar Configuração</button>
          </div>
        ) : !connected ? (
          <div className="card" style={{ padding: 80, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
            <Smartphone size={60} style={{ margin: '0 auto 24px', opacity: 0.2 }} />
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Aguardando Conexão</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
              Sincronize o sistema com a sua instância <b>{instanceName}</b>.
            </p>
            <button className="btn btn-primary" onClick={() => { setShowConnectModal(true); generateQrCode(); }} style={{ padding: '14px 40px' }}>Escanear QR Code</button>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
             <CheckCircle size={60} color="var(--green)" style={{ margin: '0 auto 24px' }} />
             <h3 style={{ fontSize: 24, fontWeight: 800 }}>Conectado com Sucesso!</h3>
             <p style={{ color: 'var(--text-secondary)' }}>O sistema está operando através da instância {instanceName}.</p>
             <button className="btn btn-secondary" style={{ marginTop: 24 }} onClick={() => setConnected(false)}>Alternar Instância</button>
          </div>
        )}
      </div>

      <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Conectar WhatsApp" size="md">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ 
            width: 280, height: 280, background: '#fff', margin: '0 auto 24px', borderRadius: 16, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--card-border)',
            position: 'relative', flexDirection: 'column', padding: 10
          }}>
            {syncing ? (
              <div style={{ textAlign: 'center' }}>
                <RefreshCw size={40} className="spin" color="var(--yellow)" />
                <div style={{ fontSize: 12, marginTop: 12, color: '#666' }}>Varrendo endpoints...</div>
              </div>
            ) : qrCode ? (
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : errorMessage ? (
              <div style={{ padding: 20 }}>
                <AlertTriangle size={32} color="var(--red)" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4, fontWeight: 600 }}>{errorMessage}</div>
              </div>
            ) : (
              <div style={{ color: '#666', fontSize: 12 }}>Clique em conectar para buscar o QR Code</div>
            )}
          </div>
          
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Instância</label>
            <input className="form-input" value={instanceName} onChange={e => setInstanceName(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowConnectModal(false)}>Fechar</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={generateQrCode} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''} /> Tentar Agora
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
