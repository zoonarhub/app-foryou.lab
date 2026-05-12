import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Target, Link as LinkIcon, RefreshCw, BarChart3, 
  AlertTriangle, Layers, TrendingUp, DollarSign, 
  MousePointer2, Eye, PieChart, Facebook
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import axios from 'axios';

export default function Campaigns() {
  const { addToast } = useApp();
  const [fbConnected, setFbConnected] = useState(() => !!localStorage.getItem('fb_ads_token'));
  const [syncing, setSyncing] = useState(false);
  const [adAccounts, setAdAccounts] = useState([
    { id: 'act_mock', name: 'Conta de Exemplo', status: 'active' }
  ]);
  const [activeAccount, setActiveAccount] = useState(null);

  // Fetch Real Ad Accounts from Meta Graph API
  const fetchAdAccounts = async (token) => {
    setSyncing(true);
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/me/adaccounts`, {
        params: {
          access_token: token,
          fields: 'name,account_id,account_status,amount_spent,currency'
        }
      });
      
      const accounts = response.data.data.map(acc => ({
        id: acc.id,
        name: acc.name,
        status: acc.account_status === 1 ? 'active' : 'paused',
        spend: parseFloat(acc.amount_spent || 0) / 100
      }));
      
      setAdAccounts(accounts);
      if (accounts.length > 0) setActiveAccount(accounts[0]);
      addToast('Contas de anúncios carregadas!');
    } catch (err) {
      console.error('Error fetching ads:', err);
      addToast('Erro ao carregar contas do Facebook', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleFBLogin = () => {
    if (!window.FB) return addToast('SDK do Facebook não carregado', 'error');
    
    window.FB.login((response) => {
      if (response.authResponse) {
        const token = response.authResponse.accessToken;
        localStorage.setItem('fb_ads_token', token);
        setFbConnected(true);
        fetchAdAccounts(token);
      } else {
        addToast('Login cancelado ou não autorizado', 'warning');
      }
    }, { scope: 'ads_management,ads_read,business_management' });
  };

  useEffect(() => {
    const token = localStorage.getItem('fb_ads_token');
    if (token) fetchAdAccounts(token);
  }, []);

  const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard de Anúncios</h2>
          <div className="breadcrumb">Meta Business Suite (Integração Real)</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {fbConnected && (
            <button className="btn btn-secondary" onClick={() => fetchAdAccounts(localStorage.getItem('fb_ads_token'))} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''} /> {syncing ? 'Sincronizando...' : 'Atualizar Dados'}
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {!fbConnected ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', maxWidth: 500, margin: '40px auto' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(24, 119, 242, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Facebook size={40} color="#1877F2" />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Conecte seu Meta Ads</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14, lineHeight: 1.6 }}>
              Faça login com sua conta Business para visualizar a performance de todas as suas contas de anúncios em tempo real.
            </p>
            <button className="btn btn-primary" onClick={handleFBLogin} style={{ background: '#1877F2', borderColor: '#1877F2', padding: '14px 40px', fontSize: 16 }}>
              <Facebook size={18} /> Login com Facebook Business
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'flex-start' }}>
            
            {/* SIDEBAR: REAL AD ACCOUNTS */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)' }}>
                <Layers size={14} /> Suas Contas ({adAccounts.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {adAccounts.map(act => (
                  <button key={act.id} onClick={() => setActiveAccount(act)}
                    style={{ 
                      background: activeAccount?.id === act.id ? 'rgba(255,214,0,.1)' : 'transparent', 
                      border: activeAccount?.id === act.id ? '1px solid var(--yellow)' : '1px solid var(--card-border)', 
                      padding: '12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', transition: 'all .2s' 
                    }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{act.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{act.id}</span>
                      <span className={`badge ${act.status === 'active' ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 9 }}>{act.status}</span>
                    </div>
                  </button>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 24 }} onClick={() => { localStorage.removeItem('fb_ads_token'); setFbConnected(false); }}>
                Sair do Facebook
              </button>
            </div>

            {/* MAIN PANEL */}
            {activeAccount && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Total Gasto</span>
                      <DollarSign size={16} color="#EF4444" />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(activeAccount.spend || 0)}</div>
                  </div>
                  {/* ... Mais KPIs Reais aqui ... */}
                </div>
                <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                   <BarChart3 size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                   <p style={{ color: 'var(--text-secondary)' }}>Selecione uma conta para carregar os gráficos de performance detalhados via Graph API.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
