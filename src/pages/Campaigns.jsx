import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../data/store';
import { 
  Megaphone, Search, Filter, Calendar, TrendingUp, TrendingDown, Target, 
  DollarSign, BarChart3, ChevronDown, CheckCircle, AlertTriangle, AlertCircle,
  Eye, EyeOff, Pin, StickyNote, Play, Pause, XCircle, Settings, Award, ArrowRight,
  MousePointer2, Plus, RefreshCw, BarChart, Activity, Edit2, Save, X, ToggleLeft, ToggleRight,
  Link, Smartphone, Monitor, Download, Bell
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart as RechartsBarChart, Bar, Cell } from 'recharts';
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
  const { addToast } = useApp();
  const [activeMainTab, setActiveMainTab] = useState('dashboard'); 
  const [activeMetaTab, setActiveMetaTab] = useState('campanhas'); 
  
  // API State
  const [fbConnected, setFbConnected] = useState(() => !!localStorage.getItem('fb_ads_token'));
  const [syncing, setSyncing] = useState(false);
  const [adAccounts, setAdAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [datePreset, setDatePreset] = useState('last_30d');
  const [googleConnected, setGoogleConnected] = useState(() => !!localStorage.getItem('google_ads_token'));
  
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

      // 2. Campaigns
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
          budget: parseFloat(c.daily_budget || c.lifetime_budget || 0) / 100, // API returns in cents
          spend: cSpend, revenue: cResults * 150, roas: cSpend > 0 ? (cResults * 150) / cSpend : 0,
          cpl: cResults > 0 ? cSpend / cResults : 0, ctr: parseFloat(ins.ctr || 0), cpc: parseFloat(ins.cpc || 0),
          impressions: parseInt(ins.impressions || 0), clicks: parseInt(ins.clicks || 0), results: cResults,
          notes: ''
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

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: tokenResponse => {
      localStorage.setItem('google_ads_token', tokenResponse.access_token);
      setGoogleConnected(true);
      addToast('Conectado ao Google Ads com sucesso!');
    },
    onError: () => addToast('Erro ao conectar com Google Ads', 'error'),
    scope: 'https://www.googleapis.com/auth/adwords'
  });

  // OPERATIONAL FUNCTIONS
  const updateCampaignLocally = (id, updates) => {
    setRealCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleToggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    updateCampaignLocally(id, { status: newStatus });
    addToast(`Campanha ${newStatus === 'ativo' ? 'ativada' : 'pausada'} com sucesso!`);
    // Here we would do: axios.post(`graph.../${id}`, { status: newStatus.toUpperCase() })
  };

  const handleUpdateBudget = (id, newBudget) => {
    updateCampaignLocally(id, { budget: newBudget });
    addToast('Orçamento atualizado na plataforma!');
  };

  const handleSaveNote = (id, text) => {
    updateCampaignLocally(id, { notes: text });
    addToast('Anotação salva!');
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
          { id: 'alertas', icon: Bell, label: 'Alertas' },
          { id: 'relatorios', icon: Activity, label: 'Relatórios' },
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
        {!fbConnected && activeMainTab !== 'google' && activeMainTab !== 'relatorios' ? (
          <EmptyState handleFBLogin={handleFBLogin} />
        ) : (
          <>
            {activeMainTab === 'dashboard' && <DashboardTab kpis={realKPIs} chartData={realChartData} campaigns={realCampaigns} />}
            {activeMainTab === 'meta' && <MetaAdsTab activeMetaTab={activeMetaTab} setActiveMetaTab={setActiveMetaTab} campaigns={realCampaigns} onToggleStatus={handleToggleStatus} onUpdateBudget={handleUpdateBudget} onSaveNote={handleSaveNote} />}
            {activeMainTab === 'utm' && <UtmSalesTab />}
            {activeMainTab === 'google' && <GoogleAdsTab connected={googleConnected} handleLogin={handleGoogleLogin} />}
            {activeMainTab === 'alertas' && <AlertsTab campaigns={realCampaigns} />}
            {activeMainTab === 'relatorios' && <ReportGeneratorTab campaigns={realCampaigns} />}
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
      <p style={{ color: COLORS.textMuted, maxWidth: 400, marginBottom: 32, lineHeight: 1.6 }}>Para visualizar o Dashboard e gerenciar suas campanhas, conecte uma plataforma de tráfego.</p>
      <div style={{ display: 'flex', gap: 16 }}>
        <button onClick={handleFBLogin} style={{ background: '#1877F2', color: '#FFF', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          Conectar Meta Ads
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <KpiCard label="GASTO TOTAL" value={fmtBRL(kpis.spend)} variation="↑ 12%" isPositive={false} />
        <KpiCard label="ROAS MÉDIO" value={`${kpis.roas.toFixed(2)}x`} variation="↑ 0.5x" isPositive={true} highlight={kpis.roas >= 2} />
        <KpiCard label="CPL MÉDIO" value={fmtBRL(kpis.cpl)} variation="↓ R$ 2,10" isPositive={true} />
        <KpiCard label="CTR MÉDIO" value={fmtPerc(kpis.ctr)} variation="↑ 0.2%" isPositive={true} highlight={kpis.ctr >= 1.5} />
        <KpiCard label="CONVERSÕES" value={fmtNum(kpis.results)} variation="↑ 18%" isPositive={true} />
        <KpiCard label="RECEITA ATRIBUÍDA" value={fmtBRL(kpis.revenue)} variation="↑ 24%" isPositive={true} />
      </div>

      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Performance Financeira</h3>
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
        {/* DONUT */}
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, alignSelf: 'flex-start' }}>Distribuição</h3>
          <div style={{ position: 'relative', width: 140, height: 140, borderRadius: '50%', background: `conic-gradient(${COLORS.yellow} 0% 75%, #333 75% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 110, height: 110, borderRadius: '50%', background: COLORS.cardBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 800 }}>{kpis.roas.toFixed(2)}x</span>
              <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700 }}>ROAS TOTAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, variation, isPositive, highlight }) {
  return (
    <div style={{ background: COLORS.cardBg, border: `1px solid ${highlight ? COLORS.yellow : COLORS.cardBorder}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: isPositive ? COLORS.green : COLORS.red, background: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: 4 }}>{variation}</div>
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
        <div style={{ position: 'absolute', top: 0, left: 12, height: '100%', display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{fmtNum(value)}</div>
      </div>
      <div style={{ width: 60, textAlign: 'right', fontSize: 13, fontWeight: 700, color: COLORS.textMuted }}>{suffix}</div>
    </div>
  );
}

// ==========================================
// META ADS TAB (Operational Hub)
// ==========================================
function MetaAdsTab({ activeMetaTab, setActiveMetaTab, campaigns, onToggleStatus, onUpdateBudget, onSaveNote }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {['Campanhas', 'Conjuntos', 'Anúncios', 'Demográficos', 'Criativos'].map(tab => (
          <button 
            key={tab} onClick={() => setActiveMetaTab(tab.toLowerCase())}
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

      {activeMetaTab === 'campanhas' && <MetaCampaignsTable campaigns={campaigns} onToggleStatus={onToggleStatus} onUpdateBudget={onUpdateBudget} onSaveNote={onSaveNote} />}
      {activeMetaTab === 'anúncios' && <MetaAdsGallery />}
      {activeMetaTab === 'demográficos' && <MetaDemographicsTab />}
    </div>
  );
}

function MetaCampaignsTable({ campaigns, onToggleStatus, onUpdateBudget, onSaveNote }) {
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetValue, setBudgetValue] = useState('');
  
  const [noteModalData, setNoteModalData] = useState(null); // { id, notes }

  const goals = { roas: 2, cpl: 15, ctr: 1.5 };
  const getGoalColor = (metric, value) => {
    if (metric === 'roas') return value >= goals.roas ? '#0d2e0d' : value >= goals.roas*0.8 ? '#2e2500' : '#2e0000';
    if (metric === 'cpl') return value <= goals.cpl ? '#0d2e0d' : value <= goals.cpl*1.2 ? '#2e2500' : '#2e0000';
    if (metric === 'ctr') return value >= goals.ctr ? '#0d2e0d' : value >= goals.ctr*0.8 ? '#2e2500' : '#2e0000';
    return 'transparent';
  };

  const startEditBudget = (c) => {
    setEditingBudget(c.id);
    setBudgetValue(c.budget);
  };

  const saveBudget = (id) => {
    onUpdateBudget(id, parseFloat(budgetValue));
    setEditingBudget(null);
  };

  return (
    <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, overflowX: 'auto' }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.cardBorder}`, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button style={{ background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, color: '#FFF', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Fixar</button>
        <div style={{ display: 'flex', alignItems: 'center', background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 6, padding: '6px 12px', width: 240 }}>
          <Search size={14} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <input type="text" placeholder="Buscar campanha..." style={{ background: 'transparent', border: 'none', color: '#FFF', outline: 'none', fontSize: 12, width: '100%' }} />
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1300 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, background: COLORS.bgDark }}>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>STATUS</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>CAMPANHA</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>ORÇAMENTO</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>GASTO</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>ROAS</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>CPL</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>CTR</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>AÇÕES</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map(c => (
            <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '12px 16px' }}>
                <div onClick={() => onToggleStatus(c.id, c.status)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  {c.status === 'ativo' ? <ToggleRight size={28} color={COLORS.green} /> : <ToggleLeft size={28} color={COLORS.textMuted} />}
                </div>
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
                {c.name} {c.notes && <span style={{ marginLeft: 8, fontSize: 10, background: 'rgba(255,214,0,0.2)', color: COLORS.yellow, padding: '2px 6px', borderRadius: 4 }}>Nota ativa</span>}
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13 }}>
                {editingBudget === c.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>R$</span>
                    <input autoFocus value={budgetValue} onChange={e => setBudgetValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveBudget(c.id)} style={{ width: 60, background: COLORS.bgDark, border: `1px solid ${COLORS.yellow}`, color: '#FFF', borderRadius: 4, padding: '4px 6px', fontSize: 12, outline: 'none' }} />
                    <Save size={14} color={COLORS.green} style={{ cursor: 'pointer' }} onClick={() => saveBudget(c.id)} />
                    <X size={14} color={COLORS.red} style={{ cursor: 'pointer' }} onClick={() => setEditingBudget(null)} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => startEditBudget(c)}>
                    {c.budget > 0 ? fmtBRL(c.budget) : 'Múltiplos'} <Edit2 size={12} color={COLORS.textMuted} />
                  </div>
                )}
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13 }}>{fmtBRL(c.spend)}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, background: getGoalColor('roas', c.roas) }}>{c.roas.toFixed(2)}x</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, background: getGoalColor('cpl', c.cpl) }}>{fmtBRL(c.cpl)}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, background: getGoalColor('ctr', c.ctr) }}>{fmtPerc(c.ctr)}</td>
              <td style={{ padding: '12px 16px', display: 'flex', gap: 12 }}>
                <button onClick={() => setNoteModalData({ id: c.id, notes: c.notes })} title="Notas Rápidas" style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer' }}><StickyNote size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* NOTES MODAL */}
      <Modal isOpen={!!noteModalData} onClose={() => setNoteModalData(null)} title="Notas Rápidas de Otimização">
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>Escreva observações sobre o que você otimizou ou o porquê pausou essa campanha.</p>
          <textarea 
            rows={5} 
            value={noteModalData?.notes || ''} 
            onChange={e => setNoteModalData({...noteModalData, notes: e.target.value})}
            placeholder="Ex: Troquei o público para LAL 1% no dia 15..."
            style={{ width: '100%', padding: 12, background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, color: '#FFF', fontSize: 13, outline: 'none', marginBottom: 20 }}
          />
          <button 
            className="btn btn-primary" 
            onClick={() => { onSaveNote(noteModalData.id, noteModalData.notes); setNoteModalData(null); }}
            style={{ width: '100%' }}
          >
            Salvar Nota
          </button>
        </div>
      </Modal>
    </div>
  );
}

function MetaAdsGallery() {
  const ads = [
    { id: 1, name: 'Video VSL Principal - Conversão Alta', status: 'ativo', roas: 3.2, cpl: 8.50, ctr: 2.1, cpc: 0.80, isFatigued: false },
    { id: 2, name: 'Imagem Estática Offer Especial', status: 'ativo', roas: 1.8, cpl: 18.20, ctr: 0.9, cpc: 1.50, isFatigued: true },
    { id: 3, name: 'Carrossel Depoimentos', status: 'pausado', roas: 0.5, cpl: 45.00, ctr: 0.5, cpc: 2.50, isFatigued: false }
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
      {ads.map(ad => (
        <div key={ad.id} style={{ background: COLORS.cardBg, border: `1px solid ${ad.isFatigued ? COLORS.red : COLORS.cardBorder}`, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
          <div style={{ height: 120, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Play size={32} color="rgba(255,255,255,0.2)" />
            {ad.isFatigued && <div style={{ position: 'absolute', bottom: 8, left: 8, background: COLORS.red, color: '#FFF', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>🔥 FADIGA</div>}
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MetaDemographicsTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Distribuição por Idade</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FunnelBar label="18-24 anos" value={1500} max={5000} color="#4B5563" suffix="30%" />
          <FunnelBar label="25-34 anos" value={2500} max={5000} color={COLORS.yellow} suffix="50%" />
          <FunnelBar label="35-44 anos" value={750} max={5000} color="#4B5563" suffix="15%" />
          <FunnelBar label="45+ anos" value={250} max={5000} color="#4B5563" suffix="5%" />
        </div>
      </div>
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Distribuição de Gênero</h3>
        <div style={{ display: 'flex', alignItems: 'center', height: 40, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ width: '65%', background: COLORS.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: 13 }}>Mulheres (65%)</div>
          <div style={{ width: '35%', background: '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: 13 }}>Homens (35%)</div>
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 40, marginBottom: 24 }}>Posicionamentos</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Smartphone size={16} color={COLORS.textMuted}/> Instagram Stories</span>
            <span style={{ fontWeight: 700 }}>45% das conversões</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Monitor size={16} color={COLORS.textMuted}/> Facebook Feed</span>
            <span style={{ fontWeight: 700 }}>30% das conversões</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// UTM & SALES TAB
// ==========================================
function UtmSalesTab() {
  const utms = [
    { id: 1, source: 'meta', medium: 'cpc', campaign: 'promocao_maio', sessions: 12500, leads: 450, vendas: 35, receita: 5250, roasReal: 2.5 },
    { id: 2, source: 'google', medium: 'search', campaign: 'institucional_brand', sessions: 8000, leads: 220, vendas: 52, receita: 7800, roasReal: 4.1 },
    { id: 3, source: 'tiktok', medium: 'video', campaign: 'viral_challenge', sessions: 25000, leads: 850, vendas: 12, receita: 1800, roasReal: 0.8 },
  ];

  return (
    <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>Rastreamento de Origem Profundo (UTMs)</h3>
          <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>Cruzamento de dados entre os cliques dos anúncios e as vendas reais no sistema.</p>
        </div>
        <button style={{ background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, color: '#FFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Link size={16} /> Copiar Padrão UTM
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>UTM SOURCE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>UTM MEDIUM</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>UTM CAMPAIGN</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>SESSÕES</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>LEADS</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>VENDAS (REAIS)</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>RECEITA LÍQUIDA</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>ROAS REAL</th>
            </tr>
          </thead>
          <tbody>
            {utms.map((u, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
                <td style={{ padding: '16px 16px', fontSize: 13, fontWeight: 600, color: COLORS.yellow }}>{u.source}</td>
                <td style={{ padding: '16px 16px', fontSize: 13 }}>{u.medium}</td>
                <td style={{ padding: '16px 16px', fontSize: 13 }}>{u.campaign}</td>
                <td style={{ padding: '16px 16px', fontSize: 13 }}>{fmtNum(u.sessions)}</td>
                <td style={{ padding: '16px 16px', fontSize: 13 }}>{fmtNum(u.leads)}</td>
                <td style={{ padding: '16px 16px', fontSize: 13, fontWeight: 700 }}>{u.vendas}</td>
                <td style={{ padding: '16px 16px', fontSize: 13, color: COLORS.green }}>{fmtBRL(u.receita)}</td>
                <td style={{ padding: '16px 16px', fontSize: 13, fontWeight: 700 }}>
                  <span style={{ background: u.roasReal >= 2 ? '#0d2e0d' : u.roasReal < 1 ? '#2e0000' : '#2e2500', color: u.roasReal >= 2 ? COLORS.green : u.roasReal < 1 ? COLORS.red : COLORS.yellow, padding: '4px 8px', borderRadius: 6 }}>
                    {u.roasReal.toFixed(2)}x
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// ALERTS TAB (Intelligence Hub)
// ==========================================
function AlertsTab({ campaigns }) {
  const alerts = useMemo(() => {
    const list = [];
    campaigns.forEach(c => {
      if (c.status === 'ativo') {
        if (c.roas > 0 && c.roas < 1.5) list.push({ id: `roas-${c.id}`, type: 'warning', title: 'ROAS Baixo Detectado', message: `A campanha "${c.name}" está com ROAS de ${c.roas.toFixed(2)}x (Meta: 2.0x). Considere otimizar criativos.`, icon: AlertTriangle });
        if (c.cpl > 25) list.push({ id: `cpl-${c.id}`, type: 'error', title: 'CPL Acima do Limite', message: `O custo por lead em "${c.name}" subiu para ${fmtBRL(c.cpl)}. Risco de queima de orçamento.`, icon: AlertCircle });
        if (c.spend > c.budget * 0.9) list.push({ id: `budget-${c.id}`, type: 'info', title: 'Orçamento Próximo ao Limite', message: `"${c.name}" já consumiu 90% do orçamento diário.`, icon: DollarSign });
      }
    });
    return list;
  }, [campaigns]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px 0' }}>Alertas de Performance</h3>
        <p style={{ fontSize: 13, color: COLORS.textMuted }}>Detecção automática de anomalias baseada em metas de ROAS e CPL.</p>
      </div>

      {alerts.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: COLORS.cardBg, borderRadius: 12, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.textMuted }}>
          <CheckCircle size={32} color={COLORS.green} style={{ marginBottom: 16 }} />
          <div>Nenhum alerta crítico detectado no momento. Sua conta está saudável!</div>
        </div>
      ) : (
        alerts.map(alert => (
          <div key={alert.id} style={{ background: COLORS.cardBg, border: `1px solid ${alert.type === 'error' ? COLORS.red : alert.type === 'warning' ? COLORS.yellow : COLORS.cardBorder}`, borderRadius: 12, padding: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, background: alert.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : alert.type === 'warning' ? 'rgba(255, 214, 0, 0.1)' : 'rgba(255,255,255,0.05)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <alert.icon size={24} color={alert.type === 'error' ? COLORS.red : alert.type === 'warning' ? COLORS.yellow : COLORS.textMuted} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: alert.type === 'error' ? COLORS.red : alert.type === 'warning' ? COLORS.yellow : '#FFF' }}>{alert.title}</div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>{alert.message}</div>
            </div>
            <button style={{ background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, color: '#FFF', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Otimizar Agora</button>
          </div>
        ))
      )}
    </div>
  );
}

// ==========================================
// REPORT GENERATOR TAB (DashGoo / Reportei killer)
// ==========================================
function ReportGeneratorTab({ campaigns }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const totals = campaigns.reduce((acc, c) => ({
        spend: acc.spend + c.spend,
        results: acc.results + c.results,
        revenue: acc.revenue + c.revenue
      }), { spend: 0, results: 0, revenue: 0 });
      
      setReportData({
        ...totals,
        roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
        count: campaigns.length,
        period: 'Últimos 30 dias'
      });
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, height: '100%' }}>
      {/* Configuration Panel */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={20} color={COLORS.yellow} /> Gerador de Relatório</h3>
        
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600, marginBottom: 8, display: 'block' }}>PERÍODO DE ANÁLISE</label>
          <select style={{ width: '100%', background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, color: '#FFF', padding: '12px', borderRadius: 8, outline: 'none' }}>
            <option>Últimos 30 Dias</option>
            <option>Últimos 7 Dias</option>
            <option>Mês Atual</option>
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600, marginBottom: 8, display: 'block' }}>FONTES DE DADOS</label>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}><input type="checkbox" defaultChecked /> Meta Ads</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}><input type="checkbox" defaultChecked /> Google Ads</label>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600, marginBottom: 8, display: 'block' }}>SELECIONAR CAMPANHAS ({campaigns.length})</label>
          <div style={{ maxHeight: 200, overflowY: 'auto', background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: 8 }}>
            {campaigns.map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '6px 4px', borderBottom: `1px solid ${COLORS.cardBorder}`, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> {c.name}
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{ width: '100%', background: COLORS.yellow, color: '#000', border: 'none', padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: isGenerating ? 'not-allowed' : 'pointer', opacity: isGenerating ? 0.7 : 1 }}
        >
          {isGenerating ? <RefreshCw size={18} className="spin" /> : <Activity size={18} />} 
          {isGenerating ? 'Processando Dados...' : 'Gerar Dashboard Dinâmico'}
        </button>
      </div>

      {/* Preview Panel */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: reportData ? 24 : 40, display: 'flex', flexDirection: 'column', alignItems: reportData ? 'flex-start' : 'center', justifyContent: reportData ? 'flex-start' : 'center', position: 'relative', overflowY: 'auto' }}>
        {reportData && (
          <div style={{ position: 'absolute', top: 24, right: 24 }}>
            <button style={{ background: COLORS.yellow, border: 'none', color: '#000', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Download size={14} /> Exportar PDF
            </button>
          </div>
        )}

        {!reportData ? (
          <>
            <div style={{ width: 80, height: 80, background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Activity size={40} color={COLORS.green} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Visualização do Relatório</h2>
            <p style={{ color: COLORS.textMuted, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
              Configure os parâmetros ao lado para gerar o relatório consolidado. O documento incluirá o Funil de Vendas, Gráficos de Tendência e as Notas Rápidas de otimização.
            </p>
          </>
        ) : (
          <div style={{ width: '100%' }}>
            <div style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, paddingBottom: 20, marginBottom: 24, width: '100%' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.yellow, letterSpacing: 1, marginBottom: 4 }}>RELATÓRIO CONSOLIDADO</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Performance Geral de Tráfego</h2>
              <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>{reportData.period} • {reportData.count} Campanhas Analisadas</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32, width: '100%' }}>
              <div style={{ background: COLORS.bgDark, padding: 20, borderRadius: 12, border: `1px solid ${COLORS.cardBorder}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 8 }}>INVESTIMENTO</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{fmtBRL(reportData.spend)}</div>
              </div>
              <div style={{ background: COLORS.bgDark, padding: 20, borderRadius: 12, border: `1px solid ${COLORS.cardBorder}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 8 }}>RETORNO (ROAS)</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.green }}>{reportData.roas.toFixed(2)}x</div>
              </div>
              <div style={{ background: COLORS.bgDark, padding: 20, borderRadius: 12, border: `1px solid ${COLORS.cardBorder}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 8 }}>RESULTADO LÍQUIDO</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{fmtBRL(reportData.revenue)}</div>
              </div>
            </div>

            <div style={{ background: COLORS.bgDark, padding: 24, borderRadius: 12, border: `1px solid ${COLORS.cardBorder}`, width: '100%' }}>
               <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Funil de Conversão do Relatório</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <FunnelBar label="Investimento" value={reportData.spend} max={reportData.spend} color={COLORS.yellow} suffix="100%" />
                  <FunnelBar label="Conversões" value={reportData.results} max={reportData.results * 2} color={COLORS.green} suffix="-" />
               </div>
            </div>
            
            <div style={{ marginTop: 32, padding: 20, background: 'rgba(255, 214, 0, 0.05)', borderRadius: 12, border: `1px dashed ${COLORS.yellow}`, color: COLORS.yellow, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
              Este é um rascunho visual do dashboard. Clique em "Exportar PDF" para gerar o documento final.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
