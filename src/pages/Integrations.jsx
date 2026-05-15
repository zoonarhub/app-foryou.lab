import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { Plug, Check, X, Copy, ExternalLink, Key, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import { useGoogleLogin } from '@react-oauth/google';

const integrationsList = [
  { id: 'whatsapp', name: 'WhatsApp', desc: 'Evolution API — mensagens e automação', icon: '💬', category: 'Comunicação', connectType: 'qrcode' },
  { id: 'google_calendar', name: 'Google Calendar', desc: 'Sincronize eventos e reuniões', icon: '📅', category: 'Produtividade', connectType: 'oauth' },
  { id: 'facebook_ads', name: 'Facebook Ads', desc: 'Meta Business — campanhas e métricas', icon: '📘', category: 'Marketing', connectType: 'oauth' },
  { id: 'google_ads', name: 'Google Ads', desc: 'Campanhas de pesquisa e display', icon: '🔍', category: 'Marketing', connectType: 'oauth' },
  { id: 'stripe', name: 'Stripe / Asaas', desc: 'Pagamentos e cobranças recorrentes', icon: '💳', category: 'Financeiro', connectType: 'apikey' },
  { id: 'zapier', name: 'Zapier / Make', desc: 'Automações via webhook externo', icon: '⚡', category: 'Automação', connectType: 'webhook' },
  { id: 'openai', name: 'OpenAI', desc: 'API de IA para geração de textos', icon: '🤖', category: 'IA', connectType: 'apikey' },
];

export default function Integrations() {
  const { addToast, googleAccessToken, saveGoogleToken } = useApp();
  const [connections, setConnections] = useState(() => {
    try { return JSON.parse(localStorage.getItem('foryoulab_integrations') || '{}'); } catch { return {}; }
  });
  const [showModal, setShowModal] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showLogs, setShowLogs] = useState(null);

  const [fbConnected, setFbConnected] = useState(() => !!localStorage.getItem('fb_ads_token'));

  // Sync real status for Google & FB
  useEffect(() => {
    const newConn = { ...connections };
    if (googleAccessToken) {
      newConn.google_calendar = { status: 'connected', connectedAt: new Date().toISOString(), lastSync: new Date().toISOString() };
    } else {
      delete newConn.google_calendar;
    }

    if (fbConnected) {
      newConn.facebook_ads = { status: 'connected', connectedAt: new Date().toISOString(), lastSync: new Date().toISOString() };
    } else {
      delete newConn.facebook_ads;
    }
    setConnections(newConn);
    // Don't save this mapped status to localStorage so we always depend on the real tokens.
  }, [googleAccessToken, fbConnected]);

  const save = (c) => { 
    setConnections(c); 
    localStorage.setItem('foryoulab_integrations', JSON.stringify(c)); 
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: tokenResponse => {
      saveGoogleToken(tokenResponse.access_token);
      addToast('Google Calendar conectado com sucesso!');
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'
  });

  const handleFBLogin = () => {
    if (!window.FB) return addToast('SDK do Facebook não carregado. Desative o AdBlock.', 'error');
    window.FB.login((response) => {
      if (response.authResponse) {
        const token = response.authResponse.accessToken;
        localStorage.setItem('fb_ads_token', token);
        setFbConnected(true);
        addToast('Meta Ads conectado com sucesso!');
      } else {
        addToast('Login do Facebook cancelado.', 'warning');
      }
    }, { 
      scope: 'ads_management,ads_read,business_management,pages_read_engagement,pages_show_list',
      auth_type: 'rerequest' 
    });
  };

  const connect = (id, type) => {
    if (id === 'google_calendar') {
      loginWithGoogle();
      return;
    }
    if (id === 'facebook_ads') {
      handleFBLogin();
      return;
    }

    if (type === 'oauth') {
      addToast(`Redirecionando para autenticação ${integrationsList.find(i => i.id === id)?.name}...`, 'info');
      setTimeout(() => {
        save({ ...connections, [id]: { status: 'connected', connectedAt: new Date().toISOString(), lastSync: new Date().toISOString() } });
        addToast(`${integrationsList.find(i => i.id === id)?.name} conectado!`);
      }, 2000);
    } else if (type === 'apikey') {
      setShowModal(id); setApiKeyInput('');
    } else if (type === 'webhook') {
      setShowModal(id);
    } else if (type === 'qrcode') {
      addToast('Acesse a página WhatsApp para conectar via QR Code', 'info');
    }
  };

  const saveApiKey = (id) => {
    if (!apiKeyInput.trim()) { addToast('Chave obrigatória', 'error'); return; }
    save({ ...connections, [id]: { status: 'connected', apiKey: apiKeyInput, connectedAt: new Date().toISOString(), lastSync: new Date().toISOString() } });
    addToast('Chave salva e conectado!');
    setShowModal(null);
  };

  const disconnect = (id) => {
    if (id === 'google_calendar') {
      saveGoogleToken(null);
      addToast('Google Calendar desconectado.', 'warning');
      return;
    }
    if (id === 'facebook_ads') {
      localStorage.removeItem('fb_ads_token');
      setFbConnected(false);
      addToast('Facebook Ads desconectado.', 'warning');
      return;
    }

    const c = { ...connections }; delete c[id]; save(c);
    addToast('Desconectado!', 'warning');
  };

  const agencyId = user?.id || '';
  const webhookUrl = `https://iamszevlwgiirziejppp.supabase.co/functions/v1/capture-lead`;

  const mockLogs = [
    { time: '14:32', action: 'Sincronização automática', status: 'ok' },
    { time: '14:00', action: 'Dados atualizados', status: 'ok' },
    { time: '12:15', action: 'Nova conexão estabelecida', status: 'ok' },
    { time: '10:00', action: 'Verificação de saúde', status: 'ok' },
  ];

  return (
    <>
      <div className="page-header">
        <div><h2>Integrações</h2><div className="breadcrumb">Conecte suas ferramentas</div></div>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {integrationsList.map(integ => {
            const conn = connections[integ.id];
            const isConnected = conn?.status === 'connected';
            return (
              <div key={integ.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--gray-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{integ.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{integ.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{integ.desc}</div>
                    </div>
                  </div>
                  <span className={`badge ${isConnected ? 'badge-green' : 'badge-gray'}`}>{isConnected ? '✅ Conectado' : '⬜ Não conectado'}</span>
                </div>
                {isConnected && conn.lastSync && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RefreshCw size={10} /> Sincronizado: {new Date(conn.lastSync).toLocaleString('pt-BR')}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  {isConnected ? (
                    <>
                      <button onClick={() => disconnect(integ.id)} className="btn btn-sm btn-secondary" style={{ flex: 1, color: '#EF4444' }}><X size={12} /> Desconectar</button>
                      <button onClick={() => setShowLogs(integ)} className="btn btn-sm btn-secondary"><ExternalLink size={12} /> Logs</button>
                    </>
                  ) : (
                    <button onClick={() => connect(integ.id, integ.connectType)} className="btn btn-sm btn-primary" style={{ flex: 1 }}><Plug size={12} /> Conectar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* API Key Modal */}
      <Modal isOpen={showModal && integrationsList.find(i => i.id === showModal)?.connectType === 'apikey'} onClose={() => setShowModal(null)} title={`🔑 ${integrationsList.find(i => i.id === showModal)?.name}`} size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={() => saveApiKey(showModal)}>Salvar</button></>}>
        <div className="form-group"><label className="form-label">API Key</label><input className="form-input" type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} placeholder="sk-..." /></div>
      </Modal>

      {/* Webhook Modal */}
      <Modal isOpen={showModal && integrationsList.find(i => i.id === showModal)?.connectType === 'webhook'} onClose={() => setShowModal(null)} title="⚡ Configurar Webhook de Leads" size="md">
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Use esta URL na sua Landing Page para enviar leads diretamente para o CRM. 
          Certifique-se de enviar o campo <strong>agency_id</strong> no corpo do JSON.
        </p>
        
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Webhook URL</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="form-input" readOnly value={webhookUrl} style={{ fontSize: 11 }} />
            <button onClick={() => { navigator.clipboard.writeText(webhookUrl); addToast('URL copiada!'); }} className="btn btn-sm btn-primary"><Copy size={14} /></button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="form-label">Seu Agency ID (Obrigatório no JSON)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="form-input" readOnly value={agencyId} style={{ fontSize: 11, background: 'var(--gray-bg)' }} />
            <button onClick={() => { navigator.clipboard.writeText(agencyId); addToast('ID copiado!'); }} className="btn btn-sm btn-secondary"><Copy size={14} /></button>
          </div>
        </div>

        <div style={{ background: 'var(--gray-bg)', padding: 12, borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
          <strong>Exemplo de Payload JSON:</strong>
          <pre style={{ marginTop: 8, overflowX: 'auto' }}>
{`{
  "agency_id": "${agencyId}",
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "whatsapp": "11999999999",
  "empresa": "Minha Empresa",
  "faturamento": "R$ 50k - 100k",
  "desafio": "Aumentar vendas",
  "origem": "Google Ads"
}`}
          </pre>
        </div>

        <button className="btn btn-primary mt-16" style={{ width: '100%' }} onClick={() => { save({ ...connections, [showModal]: { status: 'connected', connectedAt: new Date().toISOString(), lastSync: new Date().toISOString() } }); addToast('Webhook ativo!'); setShowModal(null); }}>Ativar Integração</button>
      </Modal>

      {/* Logs Modal */}
      <Modal isOpen={!!showLogs} onClose={() => setShowLogs(null)} title={`📋 Logs — ${showLogs?.name}`} size="md">
        {mockLogs.map((log, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--card-border)', fontSize: 13 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{log.time}</span>{log.action}</div>
            <span className="badge badge-green" style={{ fontSize: 10 }}>{log.status}</span>
          </div>
        ))}
      </Modal>
    </>
  );
}
