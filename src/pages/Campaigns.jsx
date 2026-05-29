import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../data/store';
import { 
  Megaphone, Search, Filter, Calendar, TrendingUp, TrendingDown, Target, 
  DollarSign, BarChart3, ChevronDown, CheckCircle, AlertTriangle, AlertCircle,
  Eye, EyeOff, Pin, StickyNote, Play, Pause, XCircle, Settings, Award, ArrowRight,
  MousePointer2, Plus, RefreshCw, BarChart, Activity, Edit2, Save, X, ToggleLeft, ToggleRight,
  Link, Smartphone, Monitor, FileText, CheckSquare, Square, Download, ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart as RechartsBarChart, Bar, Cell, AreaChart, Area } from 'recharts';
import axios from 'axios';
import Modal from '../components/Modal';
import { useGoogleLogin } from '@react-oauth/google';

// ==========================================
// UTILS & HELPERS
// ==========================================
const fmtBRL = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtNum = v => new Intl.NumberFormat('pt-BR').format(v || 0);
const fmtPerc = v => `${(v || 0).toFixed(2)}%`;

const COLORS = {
  yellow: '#FFD600', green: '#22C55E', red: '#EF4444',
  bgDark: 'var(--bg-dark)', cardBg: '#141414', cardBorder: '#2a2a2a',
  text: 'var(--text-primary)', textMuted: 'var(--text-muted)'
};

const DATE_PRESETS = [
  { value: 'today', label: 'Hoje' }, { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7d', label: 'Últimos 7 dias' }, { value: 'last_30d', label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este Mês' }
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function CampaignsPage() {
  const { addToast, googleAccessToken, saveGoogleToken } = useApp();
  const [activeMainTab, setActiveMainTab] = useState('dashboard'); 
  const [activeMetaTab, setActiveMetaTab] = useState('campanhas'); 
  
  // API State
  const [fbConnected, setFbConnected] = useState(() => !!localStorage.getItem('fb_ads_token'));
  const [syncing, setSyncing] = useState(false);
  const [adAccounts, setAdAccounts] = useState([]);
  const [activePortfolio, setActivePortfolio] = useState(null);
  const [activeAccount, setActiveAccount] = useState(null);
  const [datePreset, setDatePreset] = useState('last_30d');
  
  // Real Data
  const [realKPIs, setRealKPIs] = useState(null);
  const [realCampaigns, setRealCampaigns] = useState([]);
  const [realChartData, setRealChartData] = useState([]);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  // Init & Fetch
  useEffect(() => {
    if (fbConnected) {
      const token = localStorage.getItem('fb_ads_token');
      fetchAdAccounts(token);
    }
  }, [fbConnected]);

  useEffect(() => {
    if (activeAccount) fetchAccountData();
  }, [activeAccount, datePreset]);

  const fetchAdAccounts = async (token) => {
    setSyncing(true);
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/me/adaccounts`, {
        params: { access_token: token, fields: 'name,account_id,account_status,business{name,id}' }
      });
      const accounts = response.data.data.map(acc => {
        const portfolioName = acc.business?.name || 'Portfólio Pessoal (Sem BM)';
        const portfolioId = acc.business?.id || 'personal';
        return {
          id: acc.id, 
          name: acc.name, 
          status: acc.account_status === 1 ? 'active' : 'paused',
          portfolioId,
          portfolioName
        };
      });
      setAdAccounts(accounts);
      if (accounts.length > 0) {
        const uniquePortfolios = [...new Map(accounts.map(item => [item.portfolioId, { id: item.portfolioId, name: item.portfolioName }])).values()];
        setActivePortfolio(uniquePortfolios[0].id);
        const firstAccount = accounts.find(a => a.portfolioId === uniquePortfolios[0].id);
        if (firstAccount) setActiveAccount(firstAccount);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('fb_ads_token');
        setFbConnected(false);
        addToast('Sessão expirada. Faça login novamente.', 'warning');
      }
    } finally {
      setSyncing(false);
    }
  };

  const fetchAccountData = async () => {
    if (!activeAccount) return;
    setSyncing(true);
    const token = localStorage.getItem('fb_ads_token');

    try {
      const kpiRes = await axios.get(`https://graph.facebook.com/v18.0/${activeAccount.id}/insights`, {
        params: { access_token: token, date_preset: datePreset, fields: 'spend,clicks,cpm,cpc,ctr,frequency,impressions,actions' }
      });
      const accountData = kpiRes.data.data[0] || {};
      
      let results = 0, revenue = 0;
      if (accountData.actions) {
        const targetActions = accountData.actions.filter(a => ['lead', 'purchase', 'messages'].includes(a.action_type));
        results = targetActions.reduce((sum, a) => sum + parseInt(a.value), 0);
        revenue = results * 150; 
      }
      
      const spend = parseFloat(accountData.spend || 0);
      setRealKPIs({
        spend, revenue, roas: spend > 0 ? (revenue / spend) : 0, clicks: parseInt(accountData.clicks || 0),
        cpm: parseFloat(accountData.cpm || 0), cpc: parseFloat(accountData.cpc || 0), ctr: parseFloat(accountData.ctr || 0),
        frequency: parseFloat(accountData.frequency || 0), impressions: parseInt(accountData.impressions || 0),
        results, cpl: results > 0 ? spend / results : 0
      });

      const campRes = await axios.get(`https://graph.facebook.com/v18.0/${activeAccount.id}/campaigns`, {
        params: { access_token: token, fields: `id,name,status,objective,daily_budget,lifetime_budget,insights.date_preset(${datePreset}){spend,actions,impressions,clicks,cpc,ctr}`, limit: 50 }
      });
      
      const campaigns = campRes.data.data.map(c => {
        const ins = c.insights?.data?.[0] || {};
        const cSpend = parseFloat(ins.spend || 0);
        let cResults = 0;
        if (ins.actions) {
           const cTarget = ins.actions.filter(a => ['lead', 'purchase', 'messages'].includes(a.action_type));
           cResults = cTarget.reduce((sum, a) => sum + parseInt(a.value), 0);
        }
        return {
          id: c.id, name: c.name, status: c.status === 'ACTIVE' ? 'ativo' : 'inativo', objective: c.objective || 'CONVERSIONS',
          budget: parseFloat(c.daily_budget || c.lifetime_budget || 0) / 100,
          spend: cSpend, revenue: cResults * 150, roas: cSpend > 0 ? (cResults * 150) / cSpend : 0,
          cpl: cResults > 0 ? cSpend / cResults : 0, ctr: parseFloat(ins.ctr || 0), cpc: parseFloat(ins.cpc || 0),
          impressions: parseInt(ins.impressions || 0), clicks: parseInt(ins.clicks || 0), results: cResults
        };
      });
      setRealCampaigns(campaigns);

      const chartRes = await axios.get(`https://graph.facebook.com/v18.0/${activeAccount.id}/insights`, {
        params: { access_token: token, date_preset: datePreset, time_increment: 1, fields: 'date_start,spend,actions' }
      });
      const chart = chartRes.data.data.map(d => {
        let dRes = 0;
        if (d.actions) {
           const dTarget = d.actions.filter(a => ['lead', 'purchase', 'messages'].includes(a.action_type));
           dRes = dTarget.reduce((sum, a) => sum + parseInt(a.value), 0);
        }
        const dt = new Date(d.date_start);
        return { date: `${dt.getDate()}/${dt.getMonth()+1}`, gasto: parseFloat(d.spend || 0), receita: dRes * 150 };
      });
      setRealChartData(chart);
      setLastSync(new Date().toLocaleTimeString());

    } catch(e) {
      console.error(e);
      addToast('Erro ao extrair insights do Facebook.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleFBLogin = () => {
    if (!window.FB) return addToast('SDK do Facebook não carregado. Desative o AdBlock.', 'error');
    window.FB.login((response) => {
      if (response.authResponse) {
        const token = response.authResponse.accessToken;
        localStorage.setItem('fb_ads_token', token);
        setFbConnected(true);
        fetchAdAccounts(token);
        addToast('Conectado ao Meta Ads!');
      }
    }, { 
      scope: 'ads_management,ads_read,business_management,pages_read_engagement,pages_show_list', 
      auth_type: 'rerequest' 
    });
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: tokenResponse => {
      saveGoogleToken(tokenResponse.access_token);
      addToast('Google Ads conectado!');
    },
    scope: 'https://www.googleapis.com/auth/adwords'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: COLORS.bgDark, color: COLORS.text, fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. HEADER FIXO */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLORS.cardBg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, background: COLORS.yellow, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Megaphone size={20} color="#000" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Campanhas</h1>
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>Gestão de tráfego avançada</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {fbConnected && adAccounts.length > 0 ? (
            <>
              <select
                value={activePortfolio || ''}
                onChange={e => {
                  setActivePortfolio(e.target.value);
                  const firstOfPortfolio = adAccounts.find(acc => acc.portfolioId === e.target.value);
                  if (firstOfPortfolio) setActiveAccount(firstOfPortfolio);
                }}
                style={{
                  background: COLORS.bgDark,
                  border: `1px solid ${COLORS.cardBorder}`,
                  color: COLORS.text,
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: 220,
                  textOverflow: 'ellipsis'
                }}
              >
                {[...new Map(adAccounts.map(item => [item.portfolioId, item])).values()].map(acc => (
                  <option key={acc.portfolioId} value={acc.portfolioId} style={{ background: '#000', color: '#FFF' }}>
                    {acc.portfolioName}
                  </option>
                ))}
              </select>

              <select
                value={activeAccount?.id || ''}
                onChange={e => {
                  const selected = adAccounts.find(acc => acc.id === e.target.value);
                  if (selected) setActiveAccount(selected);
                }}
                style={{
                  background: COLORS.bgDark,
                  border: `1px solid ${COLORS.cardBorder}`,
                  color: COLORS.text,
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: 220,
                  textOverflow: 'ellipsis'
                }}
              >
                {adAccounts.filter(a => a.portfolioId === activePortfolio).map(acc => (
                  <option key={acc.id} value={acc.id} style={{ background: '#000', color: '#FFF' }}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <div style={{ background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMuted }}>
                {fbConnected ? 'Nenhum portfólio' : 'Meta Ads Desconectado'}
              </span>
            </div>
          )}

          <select value={datePreset} onChange={e => setDatePreset(e.target.value)} style={{ background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.text, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
            {DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          {fbConnected ? (
            <button onClick={fetchAccountData} disabled={syncing} style={{ background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.text, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''} />
              {syncing ? 'Sincronizando...' : `Sync: ${lastSync}`}
            </button>
          ) : (
            <button onClick={handleFBLogin} style={{ background: COLORS.yellow, border: 'none', color: '#000', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Plus size={16} /> Conectar Portfólio
            </button>
          )}
        </div>
      </div>

      {/* 2. ABAS PRINCIPAIS */}
      <div style={{ display: 'flex', gap: 8, padding: '0 24px', borderBottom: `1px solid ${COLORS.cardBorder}`, background: COLORS.cardBg, overflowX: 'auto' }}>
        {[
          { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
          { id: 'meta', icon: Target, label: 'Meta Ads' },
          { id: 'google', icon: Search, label: 'Google Ads' },
          { id: 'relatorios', icon: FileText, label: 'Relatórios' },
          { id: 'utm', icon: MousePointer2, label: 'UTM & Vendas' },
        ].map(tab => (
          <div 
            key={tab.id} onClick={() => setActiveMainTab(tab.id)}
            style={{ 
              padding: '16px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, 
              borderBottom: activeMainTab === tab.id ? `2px solid ${COLORS.yellow}` : '2px solid transparent',
              color: activeMainTab === tab.id ? COLORS.yellow : COLORS.textMuted,
              fontWeight: activeMainTab === tab.id ? 700 : 600, fontSize: 13, transition: '0.2s'
            }}
          >
            <tab.icon size={16} /> {tab.label}
          </div>
        ))}
      </div>

      {/* 3. CONTEÚDO */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, paddingBottom: 60 }}>
        {activeMainTab === 'dashboard' && (
          fbConnected ? (
            <DashboardTab kpis={realKPIs} chartData={realChartData} campaigns={realCampaigns} syncing={syncing} />
          ) : (
            <ConnectMetaState onConnect={handleFBLogin} />
          )
        )}
        {activeMainTab === 'meta' && (
          fbConnected ? (
            <MetaAdsTab activeMetaTab={activeMetaTab} setActiveMetaTab={setActiveMetaTab} campaigns={realCampaigns} />
          ) : (
            <ConnectMetaState onConnect={handleFBLogin} />
          )
        )}
        {activeMainTab === 'google' && <GoogleAdsTab googleConnected={!!googleAccessToken} onConnect={loginWithGoogle} />}
        {activeMainTab === 'relatorios' && (
          fbConnected ? (
            <ReportsTab campaigns={realCampaigns} kpis={realKPIs} />
          ) : (
            <ConnectMetaState onConnect={handleFBLogin} />
          )
        )}
        {activeMainTab === 'utm' && <UtmSalesTab />}
      </div>
    </div>
  );
}

// ==========================================
// REMAINING COMPONENTS
// =============================
function DashboardTab({ kpis, chartData, campaigns, syncing }) {
  if (!kpis) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: 16 }}>
        <RefreshCw size={32} className="spin" color={COLORS.yellow} style={{ animation: 'spin 1.2s linear infinite' }} />
        <div style={{ fontSize: 14, color: COLORS.textMuted }}>Carregando dados do Meta Ads...</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <KpiCard label="GASTO TOTAL" value={fmtBRL(kpis.spend)} variation="↑ 12%" isPositive={false} />
        <KpiCard label="ROAS MÉDIO" value={`${kpis.roas.toFixed(2)}x`} variation="↑ 0.5x" isPositive={true} highlight={kpis.roas >= 2} />
        <KpiCard label="CPL MÉDIO" value={fmtBRL(kpis.cpl)} variation="↓ R$ 2,10" isPositive={true} />
        <KpiCard label="CTR MÉDIO" value={fmtPerc(kpis.ctr)} variation="↑ 0.2%" isPositive={true} highlight={kpis.ctr >= 1.5} />
        <KpiCard label="CONVERSÕES" value={fmtNum(kpis.results)} variation="↑ 18%" isPositive={true} />
        <KpiCard label="RECEITA ATRIBUÍDA" value={fmtBRL(kpis.revenue)} variation="↑ 24%" isPositive={true} />
      </div>
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 24 }}>
        <div style={{ height: 280, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.yellow} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.yellow} stopOpacity={0}/></linearGradient>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.green} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.cardBorder} vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COLORS.textMuted }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COLORS.textMuted }} tickFormatter={v => `R$ ${v}`} />
              <Tooltip contentStyle={{ background: '#000', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, fontSize: 12, color: '#FFF' }} />
              <Area yAxisId="left" type="monotone" dataKey="gasto" stroke={COLORS.yellow} fillOpacity={1} fill="url(#colorGasto)" strokeWidth={3} />
              <Area yAxisId="left" type="monotone" dataKey="receita" stroke={COLORS.green} fillOpacity={1} fill="url(#colorReceita)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, variation, isPositive, highlight }) {
  return (
    <div style={{ background: COLORS.cardBg, border: `1px solid ${highlight ? COLORS.yellow : COLORS.cardBorder}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>{label}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: isPositive ? COLORS.green : COLORS.red }}>{variation}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: highlight ? COLORS.yellow : COLORS.text }}>{value}</div>
    </div>
  );
}

function MetaAdsTab({ activeMetaTab, setActiveMetaTab, campaigns }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {['Campanhas', 'Conjuntos', 'Anúncios', 'Demográficos'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveMetaTab(tab.toLowerCase())} 
            style={{ 
              background: activeMetaTab === tab.toLowerCase() ? 'rgba(255,214,0,0.15)' : 'transparent', 
              border: `1px solid ${activeMetaTab === tab.toLowerCase() ? COLORS.yellow : COLORS.cardBorder}`, 
              color: activeMetaTab === tab.toLowerCase() ? COLORS.yellow : '#FFF', 
              padding: '8px 18px', 
              borderRadius: 8, 
              fontSize: 13, 
              fontWeight: 700, 
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeMetaTab === 'campanhas' && <MetaCampaignsTable campaigns={campaigns} />}
      {activeMetaTab === 'conjuntos' && <MetaAdSetsTable />}
      {activeMetaTab === 'anúncios' && <MetaAdsGrid />}
      {activeMetaTab === 'demográficos' && <MetaDemographics />}
    </div>
  );
}

function MetaCampaignsTable({ campaigns }) {
  return (
    <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, background: COLORS.bgDark }}>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>CAMPANHA</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>STATUS</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>OBJETIVO</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>IMPRESSÕES</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>CLIQUES</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>CTR</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>GASTO</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>CPL</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>CONVERSÕES</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.length === 0 ? (
            <tr>
              <td colSpan="10" style={{ padding: '30px 16px', textAlignment: 'center', color: COLORS.textMuted, fontSize: 13, textAlign: 'center' }}>
                Nenhuma campanha encontrada neste período.
              </td>
            </tr>
          ) : campaigns.map(c => (
            <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
              <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600 }}>{c.name}</td>
              <td style={{ padding: '14px 16px' }}>
                <span className={`badge ${c.status === 'ativo' ? 'badge-green' : 'badge-gray'}`}>{c.status.toUpperCase()}</span>
              </td>
              <td style={{ padding: '14px 16px', fontSize: 11, color: COLORS.textMuted }}>{(c.objective || '').replace(/_/g, ' ')}</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>{fmtNum(c.impressions)}</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>{fmtNum(c.clicks)}</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>{fmtPerc(c.ctr)}</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>{fmtBRL(c.spend)}</td>
              <td style={{ padding: '14px 16px', fontSize: 13, color: COLORS.yellow }}>{fmtBRL(c.cpl)}</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>{fmtNum(c.results)}</td>
              <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: c.roas >= 2.0 ? COLORS.green : '#FFF' }}>{c.roas.toFixed(2)}x</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetaAdSetsTable() {
  const adSets = [
    { name: '01. Lookalike 1% - Clientes Compradores', status: 'ativo', budget: 50, spend: 1250, cpl: 12.50, conversions: 100, roas: 3.2 },
    { name: '02. Interesses - Marketing Digital & CRM', status: 'ativo', budget: 40, spend: 980, cpl: 15.80, conversions: 62, roas: 2.8 },
    { name: '03. Remarketing - Visitantes do Site 30d', status: 'ativo', budget: 30, spend: 620, cpl: 8.40, conversions: 74, roas: 4.5 },
    { name: '04. Público Aberto - Geolocalizado 10km', status: 'inativo', budget: 0, spend: 450, cpl: 22.10, conversions: 20, roas: 1.5 }
  ];

  return (
    <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, background: COLORS.bgDark }}>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>CONJUNTO DE ANÚNCIOS</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>STATUS</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>ORÇAMENTO DIÁRIO</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>GASTO TOTAL</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>CPL</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>CONVERSÕES</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {adSets.map((s, idx) => (
            <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
              <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600 }}>{s.name}</td>
              <td style={{ padding: '14px 16px' }}>
                <span className={`badge ${s.status === 'ativo' ? 'badge-green' : 'badge-gray'}`}>{s.status.toUpperCase()}</span>
              </td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>{s.budget > 0 ? fmtBRL(s.budget) : 'Pausado'}</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>{fmtBRL(s.spend)}</td>
              <td style={{ padding: '14px 16px', fontSize: 13, color: COLORS.yellow }}>{fmtBRL(s.cpl)}</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>{fmtNum(s.conversions)}</td>
              <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: s.roas >= 3 ? COLORS.green : '#FFF' }}>{s.roas.toFixed(2)}x</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetaAdsGrid() {
  const ads = [
    { name: 'Banner Promoção de Outono - Carrossel', ctr: 2.45, spend: 450, cpl: 10.20, conversions: 44, status: 'ativo', image: '🍁 Promoção 20% OFF' },
    { name: 'Vídeo Depoimento Cliente Case de Sucesso', ctr: 3.12, spend: 680, cpl: 9.15, conversions: 74, status: 'ativo', image: '🎥 Case Estética' },
    { name: 'Criativo Estático Oferta Direta - Vagas Limitadas', ctr: 1.88, spend: 320, cpl: 14.50, conversions: 22, status: 'ativo', image: '⚡ Vagas Limitadas' },
    { name: 'Story Dinâmico - Bastidores da Agência', ctr: 1.25, spend: 180, cpl: 18.00, conversions: 10, status: 'inativo', image: '📱 Stories Bastidores' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
      {ads.map((ad, idx) => (
        <div key={idx} style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#1c1c22', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: COLORS.yellow, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
            {ad.image}
          </div>
          <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', flex: 1, marginRight: 8 }}>{ad.name}</div>
              <span className={`badge ${ad.status === 'ativo' ? 'badge-green' : 'badge-gray'}`}>{ad.status.toUpperCase()}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
              <div>
                <div style={{ color: COLORS.textMuted }}>CTR</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{fmtPerc(ad.ctr)}</div>
              </div>
              <div>
                <div style={{ color: COLORS.textMuted }}>Gasto</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{fmtBRL(ad.spend)}</div>
              </div>
              <div>
                <div style={{ color: COLORS.textMuted }}>CPL</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.yellow }}>{fmtBRL(ad.cpl)}</div>
              </div>
              <div>
                <div style={{ color: COLORS.textMuted }}>Conversões</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.green }}>{fmtNum(ad.conversions)}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MetaDemographics() {
  const data = [
    { range: '18-24', Homens: 120, Mulheres: 210 },
    { range: '25-34', Homens: 340, Mulheres: 480 },
    { range: '35-44', Homens: 280, Mulheres: 390 },
    { range: '45-54', Homens: 150, Mulheres: 220 },
    { range: '55-64', Homens: 60, Mulheres: 90 },
    { range: '65+', Homens: 20, Mulheres: 40 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 24 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Distritos e Conversões por Faixa Etária e Gênero</h4>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.cardBorder} vertical={false} />
              <XAxis dataKey="range" tick={{ fill: COLORS.textMuted, fontSize: 12 }} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#000', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, color: '#FFF' }} />
              <Bar dataKey="Homens" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Mulheres" fill="#EC4899" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function GoogleAdsTab({ googleConnected, onConnect }) {
  return <div style={{ padding: 60, textAlign: 'center' }}><button onClick={onConnect} className="btn btn-primary">{googleConnected ? 'Google Conectado' : 'Conectar Google Ads'}</button></div>;
}

function ReportsTab({ campaigns }) {
  return <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>Módulo de Relatórios.</div>;
}

function UtmSalesTab() {
  return <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>Módulo de UTMs.</div>;
}

function ConnectMetaState({ onConnect }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <div className="card" style={{ maxWidth: 500, padding: 40, textAlign: 'center', background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(20px)', border: `1px solid rgba(255,214,0,0.15)`, borderRadius: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,214,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Megaphone size={32} color={COLORS.yellow} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#FFF' }}>Conecte seu Meta Ads</h3>
        <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 28 }}>
          Visualize métricas de performance, gerencie suas campanhas de Facebook & Instagram Ads e tenha insights em tempo real diretamente no seu dashboard.
        </p>
        <button onClick={onConnect} style={{ width: '100%', padding: '12px 24px', background: COLORS.yellow, border: 'none', color: '#000', borderRadius: 8, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(255, 214, 0, 0.3)' }}>
          <Plus size={18} /> Conectar Portfólio Empresarial
        </button>
      </div>
    </div>
  );
}
