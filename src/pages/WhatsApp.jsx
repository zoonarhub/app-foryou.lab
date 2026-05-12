import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Search, Send, Phone, Smile, Paperclip, X, Check, CheckCheck, 
  UserPlus, Tag, Zap, MoreVertical, Filter, Users, Layout, 
  Smartphone, Bell, PlusCircle, AlertTriangle, QrCode, Link2, RefreshCw, Settings, CheckCircle
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
  const [instanceName, setInstanceName] = useState('foryou.lab');
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
    
    try {
      console.log('Tentando conectar com:', evolutionApiUrl, 'Instância:', instanceName);
      
      // 1. Check or Create Instance
      // Usando catch interno para ignorar erro se a instância já existir
      try {
        await axios.post(`${evolutionApiUrl}/instance/create`, {
          instanceName: instanceName,
          token: evolutionApiKey,
          qrcode: true
        }, { headers: { 'apikey': evolutionApiKey } });
      } catch (e) {
        console.log('Instância já existe ou erro na criação, prosseguindo...');
      }
      
      // 2. Get Connect (QR Code)
      const response = await axios.get(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
        headers: { 'apikey': evolutionApiKey }
      });
      
      if (response.data.base64) {
        setQrCode(response.data.base64);
        addToast('QR Code gerado com sucesso!');
      } else if (response.data.instance?.status === 'open') {
        setConnected(true);
        setShowConnectModal(false);
        addToast('WhatsApp já está conectado!');
      } else {
        setErrorMessage('A API não retornou um QR Code. Verifique o status da instância.');
      }
    } catch (err) {
      console.error('Erro detalhado da Evolution API:', err);
      
      if (err.message === 'Network Error') {
        setErrorMessage('Erro de Rede/CORS: O servidor da Evolution negou o acesso. Verifique se o HTTPS está ativo e se o domínio do Vercel está autorizado na API.');
      } else {
        setErrorMessage(`Erro ${err.response?.status || ''}: ${err.response?.data?.message || 'Falha na comunicação com a API'}`);
      }
      addToast('Erro na conexão com a Evolution API', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveConfig = () => {
    setEvoConfig(configUrl, configKey);
    setShowSettings(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>WhatsApp Evolution</h2>
          <div className="breadcrumb">Conexão via Instância Real</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowSettings(true)}><Settings size={14} /> Configurações</button>
          {!connected ? (
            <button className="btn btn-primary" onClick={() => { setShowConnectModal(true); generateQrCode(); }}><QrCode size={14} /> Conectar</button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%' }} /> Instância Ativa
            </div>
          )}
        </div>
      </div>

      <div className="page-body">
        {showSettings ? (
          <div className="card" style={{ padding: 40, maxWidth: 500, margin: '20px auto' }}>
            <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 800 }}>Configurar Evolution API</h3>
            <div className="form-group">
              <label className="form-label">URL da API</label>
              <input className="form-input" value={configUrl} onChange={e => setConfigUrl(e.target.value)} placeholder="https://sua-api.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Global API Key</label>
              <input className="form-input" type="password" value={configKey} onChange={e => setConfigKey(e.target.value)} placeholder="Sua Chave Mestra" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleSaveConfig}>Salvar Configurações</button>
          </div>
        ) : !connected ? (
          <div className="card" style={{ padding: 80, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
            <Smartphone size={60} style={{ margin: '0 auto 24px', opacity: 0.2 }} />
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>WhatsApp Desconectado</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
              Utilize sua instância da Evolution API para gerenciar mensagens em tempo real.
            </p>
            <button className="btn btn-primary" onClick={() => { setShowConnectModal(true); generateQrCode(); }} style={{ padding: '14px 40px' }}>Escanear QR Code</button>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
             <CheckCircle size={60} color="var(--green)" style={{ margin: '0 auto 24px' }} />
             <h3 style={{ fontSize: 24, fontWeight: 800 }}>Instância Conectada!</h3>
             <p style={{ color: 'var(--text-secondary)' }}>O sistema está pronto para enviar e receber mensagens.</p>
             <button className="btn btn-secondary" style={{ marginTop: 24 }} onClick={() => setConnected(false)}>Desconectar</button>
          </div>
        )}
      </div>

      <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Conexão de Instância" size="md">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ 
            width: 280, height: 280, background: '#fff', margin: '0 auto 24px', borderRadius: 16, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--card-border)',
            position: 'relative', flexDirection: 'column', padding: 10
          }}>
            {syncing ? (
              <div style={{ textAlign: 'center' }}>
                <RefreshCw size={40} className="spin" color="var(--yellow)" />
                <div style={{ fontSize: 12, marginTop: 12, color: '#666' }}>Consultando API...</div>
              </div>
            ) : qrCode ? (
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : errorMessage ? (
              <div style={{ padding: 20 }}>
                <AlertTriangle size={32} color="var(--red)" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{errorMessage}</div>
              </div>
            ) : (
              <div style={{ color: '#666', fontSize: 12 }}>Inicie a conexão para gerar o QR Code</div>
            )}
          </div>
          
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Nome da Instância</label>
            <input className="form-input" value={instanceName} onChange={e => setInstanceName(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowConnectModal(false)}>Fechar</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={generateQrCode} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''} /> Tentar Novamente
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
