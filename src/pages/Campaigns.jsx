import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../data/store';
import { 
  Megaphone, Search, Filter, Calendar, TrendingUp, TrendingDown, Target, 
  DollarSign, BarChart3, ChevronDown, CheckCircle, AlertTriangle, AlertCircle,
  Eye, EyeOff, Pin, StickyNote, Play, Pause, XCircle, Settings, Award, ArrowRight,
  MousePointer2, Plus, RefreshCw, BarChart, Activity
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart as RechartsBarChart, Bar, Cell } from 'recharts';
import axios from 'axios';

// ==========================================
// UTILS & HELPERS
// ==========================================
const fmtBRL = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtNum = v => new Intl.NumberFormat('pt-BR').format(v || 0);
const fmtPerc = v => `${(v || 0).toFixed(2)}%`;

const COLORS = {
  yellow: '#FFD600',
  green: '#22C55E',
  red: '#EF4444',
  bgDark: 'var(--bg-dark)',
  cardBg: '#141414',
  cardBorder: '#2a2a2a',
  text: 'var(--text-primary)',
  textMuted: 'var(--text-muted)'
};

const DATE_PRESETS = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7d', label: 'Últimos 7 dias' },
  { value: 'last_30d', label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este Mês' }
];

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function CampaignsPage() {
  const { addToast } = useApp();
  const [activeMainTab, setActiveMainTab] = useState('dashboard'); 
  const [activeMetaTab, setActiveMetaTab] = useState('campanhas'); 
  
  // API State
  const [fbConnected, setFbConnected] = useState(() => !!localStorage.getItem('fb_ads_token'));
  const [syncing, setSyncing] = useState(false);
  const [adAccounts, setAdAccounts] = useState([]);
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
    if (activeAccount) {
      fetchAccountData();
    }
  }, [activeAccount, datePreset]);

  const fetchAdAccounts = async (token) => {
    setSyncing(true);
    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/me/adaccounts`, {
        params: { access_token: token, fields: 'name,account_id,account_status' }
      });
      const accounts = response.data.data.map(acc => ({
        id: acc.id, name: acc.name, status: acc.account_status === 1 ? 'active' : 'paused'
      }));
      setAdAccounts(accounts);
      if (accounts.length > 0) setActiveAccount(accounts[0]);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('fb_ads_token');
        setFbConnected(false);
        addToast('Sessão expirada. Faça login novamente.', 'warning');
      } else {
        addToast('Erro ao carregar contas do Facebook', 'error');
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
      // 1. Account KPIs
      const kpiRes = await axios.get(`https://graph.facebook.com/v18.0/${activeAccount.id}/insights`, {
        params: { access_token: token, date_preset: datePreset, fields: 'spend,clicks,inline_link_clicks,cpm,cpc,ctr,frequency,impressions,actions' }
      });
      const accountData = kpiRes.data.data[0] || {};
      
      let results = 0, revenue = 0;
      if (accountData.actions) {
        const targetActions = accountData.actions.filter(a => ['lead', 'purchase', 'messages'].includes(a.action_type));
        results = targetActions.reduce((sum, a) => sum + parseInt(a.value), 0);
        // Mocking revenue for demo purposes based on results
        revenue = results * 150; 
      }
      
      const spend = parseFloat(accountData.spend || 0);
      setRealKPIs({
        spend, revenue,
        roas: spend > 0 ? (revenue / spend) : 0,
        clicks: parseInt(accountData.clicks || 0),
        cpm: parseFloat(accountData.cpm || 0),
        cpc: parseFloat(accountData.cpc || 0),
        ctr: parseFloat(accountData.ctr || 0),
        frequency: parseFloat(accountData.frequency || 0),
        impressions: parseInt(accountData.impressions || 0),
        results, cpl: results > 0 ? spend / results : 0
      });

      // 2. Campaigns
      const campRes = await axios.get(`https://graph.facebook.com/v18.0/${activeAccount.id}/campaigns`, {
        params: { access_token: token, fields: `id,name,status,objective,insights.date_preset(${datePreset}){spend,actions,impressions,clicks,cpc,ctr}`, limit: 50 }
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
          spend: cSpend, revenue: cResults * 150, roas: cSpend > 0 ? (cResults * 150) / cSpend : 0,
          cpl: cResults > 0 ? cSpend / cResults : 0, ctr: parseFloat(ins.ctr || 0), cpc: parseFloat(ins.cpc || 0),
          impressions: parseInt(ins.impressions || 0), clicks: parseInt(ins.clicks || 0), results: cResults,
          isPinned: false, isHidden: false
        };
      });
      setRealCampaigns(campaigns);

      // 3. Time Chart
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
        return {
          date: `${dt.getDate()}/${dt.getMonth()+1}`,
          gasto: parseFloat(d.spend || 0),
          receita: dRes * 150
        };
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
    if (!window.FB) return addToast('SDK do Facebook não carregado', 'error');
    window.FB.login((response) => {
      if (response.authResponse) {
        const token = response.authResponse.accessToken;
        localStorage.setItem('fb_ads_token', token);
        setFbConnected(true);
        fetchAdAccounts(token);
        addToast('Conectado ao Meta Ads!');
      }
    }, { scope: 'ads_management,ads_read,business_management', auth_type: 'rerequest' });
  };

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
          {/* Account Selector */}
          <div style={{ background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{activeAccount ? activeAccount.name : 'Nenhuma conta'}</span>
            <ChevronDown size={16} color={COLORS.textMuted} />
          </div>

          {/* Date Picker */}
          <select 
            value={datePreset} 
            onChange={e => setDatePreset(e.target.value)}
            style={{ background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.text, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            {DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          {fbConnected ? (
            <button onClick={fetchAccountData} disabled={syncing} style={{ background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.text, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''} />
              {syncing ? 'Sincronizando...' : `Sync: ${lastSync}`}
            </button>
          ) : (
            <button onClick={handleFBLogin} style={{ background: COLORS.yellow, border: 'none', color: '#000', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Plus size={16} /> Conectar Conta
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
          { id: 'utm', icon: MousePointer2, label: 'UTM & Vendas' },
          { id: 'alertas', icon: AlertTriangle, label: 'Alertas' },
          { id: 'relatorios', icon: Activity, label: 'Relatórios' },
          { id: 'contas', icon: Settings, label: 'Contas' },
        ].map(tab => (
          <div 
            key={tab.id} 
            onClick={() => setActiveMainTab(tab.id)}
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

      {/* 3. CONTEÚDO DA ABA */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, paddingBottom: 60 }}>
        {!fbConnected && activeMainTab !== 'contas' ? (
          <EmptyState handleFBLogin={handleFBLogin} />
        ) : (
          <>
            {activeMainTab === 'dashboard' && <DashboardTab kpis={realKPIs} chartData={realChartData} campaigns={realCampaigns} />}
            {activeMainTab === 'meta' && <MetaAdsTab activeMetaTab={activeMetaTab} setActiveMetaTab={setActiveMetaTab} campaigns={realCampaigns} />}
            {/* Outras abas ficariam aqui */}
          </>
        )}
      </div>

    </div>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================
function EmptyState({ handleFBLogin }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, background: 'rgba(255, 214, 0, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Target size={40} color={COLORS.yellow} />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Conecte sua primeira conta de anúncios</h2>
      <p style={{ color: COLORS.textMuted, maxWidth: 400, marginBottom: 32, lineHeight: 1.6 }}>
        Para visualizar o Dashboard e gerenciar suas campanhas, conecte uma plataforma de tráfego.
      </p>
      <div style={{ display: 'flex', gap: 16 }}>
        <button onClick={handleFBLogin} style={{ background: '#1877F2', color: '#FFF', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          Conectar Meta Ads
        </button>
        <button style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, color: '#FFF', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          Conectar Google Ads
        </button>
      </div>
    </div>
  );
}

// ==========================================
// DASHBOARD TAB
// ==========================================
function DashboardTab({ kpis, chartData, campaigns }) {
  if (!kpis) return <div style={{ color: COLORS.textMuted }}>Carregando dados...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* KPI GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <KpiCard label="GASTO TOTAL" value={fmtBRL(kpis.spend)} variation="↑ 12%" isPositive={false} />
        <KpiCard label="ROAS MÉDIO" value={`${kpis.roas.toFixed(2)}x`} variation="↑ 0.5x" isPositive={true} highlight={kpis.roas >= 2} />
        <KpiCard label="CPL MÉDIO" value={fmtBRL(kpis.cpl)} variation="↓ R$ 2,10" isPositive={true} />
        <KpiCard label="CTR MÉDIO" value={fmtPerc(kpis.ctr)} variation="↑ 0.2%" isPositive={true} highlight={kpis.ctr >= 1.5} />
        <KpiCard label="CONVERSÕES" value={fmtNum(kpis.results)} variation="↑ 18%" isPositive={true} />
        <KpiCard label="RECEITA ATRIBUÍDA" value={fmtBRL(kpis.revenue)} variation="↑ 24%" isPositive={true} />
      </div>

      {/* MAIN CHART */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Performance Financeira</h3>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 4, background: COLORS.yellow, borderRadius: 2 }}/> Gasto</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 4, background: COLORS.green, borderRadius: 2 }}/> Receita</div>
          </div>
        </div>
        <div style={{ height: 280, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.cardBorder} vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COLORS.textMuted }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COLORS.textMuted }} tickFormatter={v => `R$ ${v}`} />
              <Tooltip contentStyle={{ background: '#000', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, fontSize: 12, color: '#FFF' }} />
              <Line yAxisId="left" type="monotone" dataKey="gasto" stroke={COLORS.yellow} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line yAxisId="left" type="monotone" dataKey="receita" stroke={COLORS.green} strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECONDARY ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* FUNNEL */}
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Funil — Todas as contas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FunnelBar label="Alcance" value={kpis.impressions} max={kpis.impressions} color="#4B5563" suffix="100%" />
            <div style={{ paddingLeft: 120, fontSize: 11, color: COLORS.textMuted, fontWeight: 600, marginTop: -8 }}>↓ {fmtPerc(kpis.ctr)} CTR</div>
            <FunnelBar label="Cliques" value={kpis.clicks} max={kpis.impressions} color={COLORS.yellow} suffix={`${((kpis.clicks/kpis.impressions)*100).toFixed(1)}%`} />
            <div style={{ paddingLeft: 120, fontSize: 11, color: COLORS.textMuted, fontWeight: 600, marginTop: -8 }}>↓ {fmtPerc((kpis.results/kpis.clicks)*100)} Conversão</div>
            <FunnelBar label="Leads" value={kpis.results} max={kpis.impressions} color={COLORS.green} suffix={`${((kpis.results/kpis.impressions)*100).toFixed(2)}%`} warning={kpis.results < 10} />
          </div>
        </div>

        {/* DONUT / DISTRIBUTION */}
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, alignSelf: 'flex-start' }}>Distribuição</h3>
          <div style={{ position: 'relative', width: 140, height: 140, borderRadius: '50%', background: `conic-gradient(${COLORS.yellow} 0% 75%, #333 75% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 110, height: 110, borderRadius: '50%', background: COLORS.cardBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 800 }}>{kpis.roas.toFixed(2)}x</span>
              <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700 }}>ROAS TOTAL</span>
            </div>
          </div>
          <div style={{ width: '100%', marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, background: COLORS.yellow, borderRadius: '50%' }}/> Meta Ads</span>
              <span style={{ fontWeight: 700 }}>75%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, background: '#333', borderRadius: '50%' }}/> Google Ads</span>
              <span style={{ fontWeight: 700 }}>25%</span>
            </div>
          </div>
        </div>
      </div>

      {/* RANKING TABLE */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Top Campanhas do Período</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, background: COLORS.bgDark }}>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>CAMPANHA</th>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>STATUS</th>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>GASTO</th>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>RECEITA</th>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>ROAS</th>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>CPL</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.sort((a,b) => b.roas - a.roas).slice(0, 5).map((c, i) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, background: c.roas < 1 ? '#1a0505' : 'transparent' }}>
                <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {i === 0 && <Award size={16} color={COLORS.yellow} />} {c.name}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c.status === 'ativo' ? COLORS.green : COLORS.textMuted, background: c.status === 'ativo' ? 'rgba(34, 197, 94, 0.1)' : '#222', padding: '4px 8px', borderRadius: 12 }}>
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', fontSize: 13 }}>{fmtBRL(c.spend)}</td>
                <td style={{ padding: '16px 20px', fontSize: 13 }}>{fmtBRL(c.revenue)}</td>
                <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700, color: c.roas >= 2 ? COLORS.green : c.roas < 1 ? COLORS.red : COLORS.text }}>{c.roas.toFixed(2)}x</td>
                <td style={{ padding: '16px 20px', fontSize: 13 }}>{fmtBRL(c.cpl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

function KpiCard({ label, value, variation, isPositive, highlight }) {
  return (
    <div style={{ background: COLORS.cardBg, border: `1px solid ${highlight ? COLORS.yellow : COLORS.cardBorder}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: isPositive ? COLORS.green : COLORS.red, background: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
          {variation}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: highlight ? COLORS.yellow : COLORS.text }}>{value}</div>
    </div>
  );
}

function FunnelBar({ label, value, max, color, suffix, warning }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 100, fontSize: 13, fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, height: 24, background: COLORS.bgDark, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: color, transition: '1s' }} />
        <div style={{ position: 'absolute', top: 0, left: 12, height: '100%', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          {fmtNum(value)}
        </div>
      </div>
      <div style={{ width: 60, textAlign: 'right', fontSize: 13, fontWeight: 700, color: COLORS.textMuted }}>{suffix}</div>
      {warning && <div style={{ fontSize: 10, background: 'rgba(239, 68, 68, 0.1)', color: COLORS.red, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>GARGALO</div>}
    </div>
  );
}

// ==========================================
// META ADS TAB
// ==========================================
function MetaAdsTab({ activeMetaTab, setActiveMetaTab, campaigns }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* SUB-TABS */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {['Campanhas', 'Conjuntos', 'Anúncios', 'Demográficos', 'Criativos'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveMetaTab(tab.toLowerCase())}
            style={{ 
              background: activeMetaTab === tab.toLowerCase() ? '#222' : 'transparent',
              border: `1px solid ${activeMetaTab === tab.toLowerCase() ? '#444' : COLORS.cardBorder}`,
              color: activeMetaTab === tab.toLowerCase() ? '#FFF' : COLORS.textMuted,
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeMetaTab === 'campanhas' && <MetaCampaignsTable campaigns={campaigns} />}
      {activeMetaTab === 'anúncios' && <MetaAdsGallery />}
      {/* Implement other sub-tabs as placeholders or similar tables */}
      {(activeMetaTab !== 'campanhas' && activeMetaTab !== 'anúncios') && (
        <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted, background: COLORS.cardBg, borderRadius: 12, border: `1px solid ${COLORS.cardBorder}` }}>
          Módulo "{activeMetaTab}" em desenvolvimento estrutural.
        </div>
      )}
    </div>
  );
}

function MetaCampaignsTable({ campaigns }) {
  // Goal parameters for color coding
  const goals = { roas: 2, cpl: 15, ctr: 1.5 };

  const getGoalColor = (metric, value) => {
    if (metric === 'roas') return value >= goals.roas ? '#0d2e0d' : value >= goals.roas*0.8 ? '#2e2500' : '#2e0000';
    if (metric === 'cpl') return value <= goals.cpl ? '#0d2e0d' : value <= goals.cpl*1.2 ? '#2e2500' : '#2e0000';
    if (metric === 'ctr') return value >= goals.ctr ? '#0d2e0d' : value >= goals.ctr*0.8 ? '#2e2500' : '#2e0000';
    return 'transparent';
  };

  return (
    <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, overflowX: 'auto' }}>
      
      {/* Table Actions Header */}
      <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.cardBorder}`, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button style={{ background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, color: '#FFF', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Fixar</button>
        <button style={{ background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, color: '#FFF', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Pausar</button>
        <div style={{ width: 1, height: 20, background: COLORS.cardBorder, margin: '0 8px' }} />
        <div style={{ display: 'flex', alignItems: 'center', background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 6, padding: '6px 12px', width: 240 }}>
          <Search size={14} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <input type="text" placeholder="Buscar campanha..." style={{ background: 'transparent', border: 'none', color: '#FFF', outline: 'none', fontSize: 12, width: '100%' }} />
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1200 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, background: COLORS.bgDark }}>
            <th style={{ padding: '12px 16px', width: 40 }}><input type="checkbox" /></th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>CAMPANHA</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>STATUS</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>GASTO</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>ROAS</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>CPL</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>CTR</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>CLIQUES</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>AÇÕES</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map(c => (
            <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '12px 16px' }}><input type="checkbox" /></td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: 0 }}><Play size={14} /></button>
                  {c.name}
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                {c.status === 'ativo' ? <div style={{ width: 32, height: 16, background: COLORS.green, borderRadius: 8, position: 'relative' }}><div style={{ position: 'absolute', right: 2, top: 2, width: 12, height: 12, background: '#FFF', borderRadius: '50%' }} /></div> : <div style={{ width: 32, height: 16, background: '#444', borderRadius: 8, position: 'relative' }}><div style={{ position: 'absolute', left: 2, top: 2, width: 12, height: 12, background: '#888', borderRadius: '50%' }} /></div>}
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13 }}>{fmtBRL(c.spend)}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, background: getGoalColor('roas', c.roas) }}>
                {c.roas.toFixed(2)}x
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, background: getGoalColor('cpl', c.cpl) }}>
                {fmtBRL(c.cpl)}
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, background: getGoalColor('ctr', c.ctr) }}>
                {fmtPerc(c.ctr)}
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13 }}>{fmtNum(c.clicks)}</td>
              <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                <button title="Fixar" style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer' }}><Pin size={14} /></button>
                <button title="Notas" style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer' }}><StickyNote size={14} /></button>
                <button title="Ocultar" style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer' }}><EyeOff size={14} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetaAdsGallery() {
  // Mock ads for the gallery visual demo
  const ads = [
    { id: 1, name: 'Video VSL Principal - Conversão Alta', status: 'ativo', roas: 3.2, cpl: 8.50, ctr: 2.1, cpc: 0.80, isFatigued: false },
    { id: 2, name: 'Imagem Estática Offer Especial', status: 'ativo', roas: 1.8, cpl: 18.20, ctr: 0.9, cpc: 1.50, isFatigued: true },
    { id: 3, name: 'Carrossel Depoimentos', status: 'pausado', roas: 0.5, cpl: 45.00, ctr: 0.5, cpc: 2.50, isFatigued: false },
    { id: 4, name: 'Retargeting 7d - Desconto', status: 'ativo', roas: 5.4, cpl: 4.20, ctr: 3.5, cpc: 0.40, isFatigued: false }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
      {ads.map(ad => (
        <div key={ad.id} style={{ background: COLORS.cardBg, border: `1px solid ${ad.isFatigued ? COLORS.red : COLORS.cardBorder}`, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
          
          {/* Thumbnail area */}
          <div style={{ height: 120, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Play size={32} color="rgba(255,255,255,0.2)" />
            {ad.status === 'ativo' ? (
              <div style={{ position: 'absolute', top: 8, right: 8, width: 10, height: 10, background: COLORS.green, borderRadius: '50%', boxShadow: '0 0 8px #22C55E' }} />
            ) : (
              <div style={{ position: 'absolute', top: 8, right: 8, width: 10, height: 10, background: '#666', borderRadius: '50%' }} />
            )}
            {ad.isFatigued && (
              <div style={{ position: 'absolute', bottom: 8, left: 8, background: COLORS.red, color: '#FFF', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                🔥 FADIGA
              </div>
            )}
          </div>

          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.name}</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div style={{ background: ad.roas >= 2 ? '#0d2e0d' : ad.roas < 1 ? '#2e0000' : '#2e2500', padding: 8, borderRadius: 6 }}>
                <div style={{ fontSize: 9, color: COLORS.textMuted, fontWeight: 700, marginBottom: 2 }}>ROAS</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{ad.roas}x</div>
              </div>
              <div style={{ background: ad.cpl <= 10 ? '#0d2e0d' : ad.cpl > 20 ? '#2e0000' : '#2e2500', padding: 8, borderRadius: 6 }}>
                <div style={{ fontSize: 9, color: COLORS.textMuted, fontWeight: 700, marginBottom: 2 }}>CPL</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{fmtBRL(ad.cpl)}</div>
              </div>
              <div style={{ background: ad.ctr >= 1.5 ? '#0d2e0d' : ad.ctr < 1 ? '#2e0000' : '#2e2500', padding: 8, borderRadius: 6 }}>
                <div style={{ fontSize: 9, color: COLORS.textMuted, fontWeight: 700, marginBottom: 2 }}>CTR</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{ad.ctr}%</div>
              </div>
              <div style={{ background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, padding: 8, borderRadius: 6 }}>
                <div style={{ fontSize: 9, color: COLORS.textMuted, fontWeight: 700, marginBottom: 2 }}>CPC</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{fmtBRL(ad.cpc)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
               <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                 {ad.status === 'ativo' ? <><Pause size={12} /> Pausar anúncio</> : <><Play size={12} /> Ativar anúncio</>}
               </div>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}
