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
  const [instanceName, setInstanceName] = useState('foryou_lab');
  
  // Local config state for the settings modal
  const [configUrl, setConfigUrl] = useState(evolutionApiUrl);
  const [configKey, setConfigKey] = useState(evolutionApiKey);

  const generateQrCode = async () => {
    if (!evolutionApiUrl || !evolutionApiKey) {
      return addToast('Configure a URL e a API Key primeiro!', 'error');
    }

    setSyncing(true);
    setQrCode(null);
    
    try {
      // 1. Create/Check Instance
      await axios.post(`${evolutionApiUrl}/instance/create`, {
        instanceName: instanceName,
        token: evolutionApiKey,
        qrcode: true
      }, { headers: { 'apikey': evolutionApiKey } });
      
      // 2. Get Connect (QR Code)
      const response = await axios.get(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
        headers: { 'apikey': evolutionApiKey }
      });
      
      if (response.data.base64) {
        setQrCode(response.data.base64);
      } else if (response.data.instance?.status === 'open') {
        setConnected(true);
        setShowConnectModal(false);
        addToast('WhatsApp já está conectado!');
      }
    } catch (err) {
      console.error('Evolution API Error:', err);
      addToast('Erro ao conectar com a Evolution API. Verifique a URL e a Key.', 'error');
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
          <div className="breadcrumb">Conexão direta via Instância</div>
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
              Sua Evolution API está configurada. Clique em conectar para gerar o QR Code real da sua instância.
            </p>
            <button className="btn btn-primary" onClick={() => { setShowConnectModal(true); generateQrCode(); }} style={{ padding: '14px 40px' }}>Escanear QR Code</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 100 }}>
             <CheckCircle size={60} color="var(--green)" style={{ margin: '0 auto 24px' }} />
             <h3 style={{ fontSize: 24, fontWeight: 800 }}>Tudo Pronto!</h3>
             <p style={{ color: 'var(--text-secondary)' }}>Sua instância <b>{instanceName}</b> está conectada e operando via Evolution API.</p>
          </div>
        )}
      </div>

      <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Escanear QR Code" size="md">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ 
            width: 280, height: 280, background: '#fff', margin: '0 auto 24px', borderRadius: 16, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--card-border)',
            position: 'relative'
          }}>
            {syncing ? (
              <div style={{ textAlign: 'center' }}>
                <RefreshCw size={40} className="spin" color="var(--yellow)" />
                <div style={{ fontSize: 12, marginTop: 12, color: '#666' }}>Consultando API...</div>
              </div>
            ) : qrCode ? (
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '90%', height: '90%' }} />
            ) : (
              <div style={{ color: '#666', fontSize: 12 }}>Aguardando resposta da Evolution...</div>
            )}
          </div>
          
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Nome da Instância</label>
            <input className="form-input" value={instanceName} onChange={e => setInstanceName(e.target.value)} />
          </div>

          <button className="btn btn-secondary" style={{ width: '100%', marginTop: 24 }} onClick={() => setShowConnectModal(false)}>Fechar Janela</button>
        </div>
      </Modal>
    </>
  );
}
