import { useState } from 'react';
import { useApp } from '../data/store';
import { Target, Link as LinkIcon, RefreshCw, BarChart3, AlertTriangle, Layers } from 'lucide-react';
import Modal from '../components/Modal';

export default function Campaigns() {
  const { addToast } = useApp();
  const [fbConnected, setFbConnected] = useState(() => localStorage.getItem('fb_connected') === 'true');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeAccount, setActiveAccount] = useState(null);

  // Mocking Facebook Graph API Data
  const businessAccounts = [
    { id: 'b1', name: 'ForYou.Lab Agency', adAccounts: [
      { id: 'act_101', name: 'ForYou.Lab - Institucional', status: 'active', spend: 4500, roas: 3.2, leads: 145 },
      { id: 'act_102', name: 'Cliente A - Lançamento', status: 'active', spend: 12000, roas: 4.5, leads: 850 },
      { id: 'act_103', name: 'Cliente B - Perpétuo', status: 'paused', spend: 200, roas: 1.1, leads: 5 }
    ]}
  ];

  const handleConnectFB = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setFbConnected(true);
      localStorage.setItem('fb_connected', 'true');
      addToast('Meta Ads conectado com sucesso!');
    }, 2000);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      addToast('Dados sincronizados com o Facebook!');
    }, 1500);
  };

  const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <>
      <div className="page-header">
        <div><h2>Campanhas & Ads</h2><div className="breadcrumb">Gestão de Tráfego Pago (Meta Ads)</div></div>
        {fbConnected && <button className="btn btn-secondary" onClick={handleSync} disabled={syncing}><RefreshCw size={14} className={syncing ? 'spin' : ''} /> Sincronizar Dados</button>}
      </div>

      <div className="page-body">
        {!fbConnected ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 440, margin: '0 auto' }}>
            <Target size={48} color="#1877F2" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Conectar Meta Ads</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Integre suas contas empresariais (BM) para visualizar campanhas e vincular ao módulo de Laboratório e Relatórios.</p>
            <button className="btn btn-primary" onClick={handleConnectFB} disabled={connecting} style={{ background: '#1877F2', borderColor: '#1877F2', color: '#fff', fontSize: 15, padding: '12px 32px' }}>
              {connecting ? 'Conectando...' : 'Fazer Login com o Facebook'}
            </button>
            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-secondary)' }}><AlertTriangle size={10} /> Requer permissões de Ads Management</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'flex-start' }}>
            {/* Business Managers */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)' }}>
                <Layers size={14} /> Contas Empresariais (BMs)
              </div>
              {businessAccounts.map(bm => (
                <div key={bm.id} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--text-primary)' }}>{bm.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {bm.adAccounts.map(act => (
                      <button key={act.id} onClick={() => setActiveAccount(act)}
                        style={{ background: activeAccount?.id === act.id ? 'rgba(255,214,0,.1)' : 'transparent', border: activeAccount?.id === act.id ? '1px solid var(--yellow)' : '1px solid var(--card-border)', padding: '8px 12px', borderRadius: 8, textAlign: 'left', cursor: 'pointer', transition: 'all .2s' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{act.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{act.id}</span>
                          <span className={`badge ${act.status === 'active' ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 9 }}>{act.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => { localStorage.removeItem('fb_connected'); setFbConnected(false); setActiveAccount(null); }}><LinkIcon size={12} /> Desconectar Meta</button>
            </div>

            {/* Ad Account Data */}
            <div className="card" style={{ padding: 24, minHeight: 400 }}>
              {activeAccount ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{activeAccount.name}</h3>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>ID da Conta: {activeAccount.id}</div>
                    </div>
                    <button className="btn btn-secondary btn-sm"><BarChart3 size={14} /> Exportar Relatório</button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                    <div style={{ padding: 16, background: 'var(--gray-bg)', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Gasto nos últimos 30 dias</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#EF4444' }}>{fmt(activeAccount.spend)}</div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--gray-bg)', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Leads Gerados</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{activeAccount.leads}</div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--gray-bg)', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>ROAS Médio</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#22C55E' }}>{activeAccount.roas}x</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Campanhas Ativas (Sincronizadas)</div>
                    <table className="data-table">
                      <thead>
                        <tr><th>Nome da Campanha</th><th>Status</th><th>Investimento</th><th>Custo por Lead</th></tr>
                      </thead>
                      <tbody>
                        <tr><td>[Captação] Método Órbita</td><td><span className="badge badge-green">Ativo</span></td><td>{fmt(2000)}</td><td>R$ 14,50</td></tr>
                        <tr><td>[Engajamento] IG Abril</td><td><span className="badge badge-green">Ativo</span></td><td>{fmt(500)}</td><td>R$ 0,80 (CPE)</td></tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                  <BarChart3 size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Selecione uma Conta de Anúncios</div>
                  <div style={{ fontSize: 13 }}>Clique em uma das contas ao lado para ver os dados puxados da API.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
