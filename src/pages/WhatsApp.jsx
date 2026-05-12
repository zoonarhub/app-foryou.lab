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
    
    try {
      console.log('Consultando instância:', instanceName);
      
      // Tentando buscar o QR Code - Na v2 pode ser /instance/connect ou /instance/qrcode
      let response;
      try {
        response = await axios.get(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
          headers: { 'apikey': evolutionApiKey }
        });
      } catch (err) {
        console.log('Tentando endpoint alternativo /qrcode...');
        response = await axios.get(`${evolutionApiUrl}/instance/qrcode/${instanceName}`, {
          headers: { 'apikey': evolutionApiKey }
        });
      }
      
      if (response.data.base64) {
        setQrCode(response.data.base64);
        addToast('QR Code carregado!');
      } else if (response.data.instance?.status === 'open' || response.data.status === 'open') {
        setConnected(true);
        setShowConnectModal(false);
        addToast('WhatsApp já está conectado!');
      } else {
        setErrorMessage('A instância foi encontrada, mas não retornou um QR Code. Verifique se ela já está conectada no Manager.');
      }
    } catch (err) {
      console.error('Erro detalhado:', err);
      const status = err.response?.status;
      
      if (status === 404) {
        setErrorMessage(`Instância "${instanceName}" não encontrada. Verifique se o nome no Manager está exatamente igual (letras maiúsculas/minúsculas importam).`);
      } else if (status === 401 || status === 403) {
        setErrorMessage('Chave API Inválida. Verifique sua Global API Key.');
      } else {
        setErrorMessage(`Erro ${status || 'de Conexão'}: Verifique se a URL da API está correta e se o servidor permite conexões externas (CORS).`);
      }
      addToast('Falha na comunicação com a Evolution', 'error');
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
          <div className="breadcrumb">Gerenciamento de Instâncias v2.3.0</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowSettings(true)}><Settings size={14} /> Configurações</button>
          {!connected ? (
            <button className="btn btn-primary" onClick={() => { setShowConnectModal(true); generateQrCode(); }}><QrCode size={14} /> Conectar</button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%' }} /> Conectado: {instanceName}
            </div>
          )}
        </div>
      </div>

      <div className="page-body">
        {showSettings ? (
          <div className="card" style={{ padding: 40, maxWidth: 500, margin: '20px auto' }}>
            <h3 style={{ marginBottom: 24, fontSize: 18, fontWeight: 800 }}>Configurações de API</h3>
            <div className="form-group">
              <label className="form-label">URL do Servidor Evolution</label>
              <input className="form-input" value={configUrl} onChange={e => setConfigUrl(e.target.value)} placeholder="https://evo.dominio.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Global API Key</label>
              <input className="form-input" type="password" value={configKey} onChange={e => setConfigKey(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleSaveConfig}>Salvar e Voltar</button>
          </div>
        ) : !connected ? (
          <div className="card" style={{ padding: 80, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
            <Smartphone size={60} style={{ margin: '0 auto 24px', opacity: 0.2 }} />
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>WhatsApp Offline</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
              Acesse sua instância <b>{instanceName}</b> para iniciar o atendimento multi-agente.
            </p>
            <button className="btn btn-primary" onClick={() => { setShowConnectModal(true); generateQrCode(); }} style={{ padding: '14px 40px' }}>Gerar QR Code</button>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 100 }}>
             <CheckCircle size={60} color="var(--green)" style={{ margin: '0 auto 24px' }} />
             <h3 style={{ fontSize: 24, fontWeight: 800 }}>Instância Conectada!</h3>
             <p style={{ color: 'var(--text-secondary)' }}>O sistema está pronto para operar via {instanceName}.</p>
             <button className="btn btn-secondary" style={{ marginTop: 24 }} onClick={() => setConnected(false)}>Desconectar Sistema</button>
          </div>
        )}
      </div>

      <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Sincronizar Celular" size="md">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ 
            width: 280, height: 280, background: '#fff', margin: '0 auto 24px', borderRadius: 16, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--card-border)',
            position: 'relative', flexDirection: 'column', padding: 10
          }}>
            {syncing ? (
              <div style={{ textAlign: 'center' }}>
                <RefreshCw size={40} className="spin" color="var(--yellow)" />
                <div style={{ fontSize: 12, marginTop: 12, color: '#666' }}>Buscando QR Code...</div>
              </div>
            ) : qrCode ? (
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : errorMessage ? (
              <div style={{ padding: 20 }}>
                <AlertTriangle size={32} color="var(--red)" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4, fontWeight: 600 }}>{errorMessage}</div>
              </div>
            ) : (
              <div style={{ color: '#666', fontSize: 12 }}>Clique em tentar novamente</div>
            )}
          </div>
          
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Nome da Instância (igual ao Manager)</label>
            <input className="form-input" value={instanceName} onChange={e => setInstanceName(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowConnectModal(false)}>Cancelar</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={generateQrCode} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''} /> Tentar Novamente
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
