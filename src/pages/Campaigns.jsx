import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../data/store';
import { 
  Megaphone, Search, Filter, Calendar, TrendingUp, TrendingDown, Target, 
  DollarSign, BarChart3, ChevronDown, CheckCircle, AlertTriangle, AlertCircle,
  Eye, EyeOff, Pin, StickyNote, Play, Pause, XCircle, Settings, Award, ArrowRight,
  MousePointer2, Plus, RefreshCw, BarChart, Activity, Edit2, Save, X, ToggleLeft, ToggleRight,
  Link, Smartphone, Monitor, FileText, CheckSquare, Square, Download, ExternalLink,
  History, Clock, Check
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
  const [activeAccount, setActiveAccount] = useState(null);
  const [datePreset, setDatePreset] = useState('last_30d');
  
  // Real Data
  const [realKPIs, setRealKPIs] = useState(null);
  const [realCampaigns, setRealCampaigns] = useState([]);
  const [realChartData, setRealChartData] = useState([]);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  // Optimizations Log (Shared State)
  const [optimizations, setOptimizations] = useState(() => {
    const saved = localStorage.getItem('foryou_campaign_opts');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('foryou_campaign_opts', JSON.stringify(optimizations));
  }, [optimizations]);

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

  const loginWithGoogle = useGoogleLogin({
    onSuccess: tokenResponse => {
      saveGoogleToken(tokenResponse.access_token);
      addToast('Google Ads conectado!');
    },
    scope: 'https://www.googleapis.com/auth/adwords'
  });

  const handleOptimize = (campaignId, comment) => {
    const now = new Date().toISOString();
    setOptimizations(prev => ({
      ...prev,
      [campaignId]: {
        lastOpt: now,
        history: [{ date: now, comment }, ...(prev[campaignId]?.history || [])]
      }
    }));
    addToast('Otimização registrada com sucesso!');
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
          { id: 'gestao', icon: History, label: 'Gestão de Otimizações' },
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
        {activeMainTab === 'dashboard' && <DashboardTab kpis={realKPIs} chartData={realChartData} campaigns={realCampaigns} />}
        {activeMainTab === 'meta' && <MetaAdsTab activeMetaTab={activeMetaTab} setActiveMetaTab={setActiveMetaTab} campaigns={realCampaigns} />}
        {activeMainTab === 'google' && <GoogleAdsTab googleConnected={!!googleAccessToken} onConnect={loginWithGoogle} />}
        {activeMainTab === 'gestao' && <OptimizationsTab campaigns={realCampaigns} optimizations={optimizations} onOptimize={handleOptimize} />}
        {activeMainTab === 'relatorios' && <ReportsTab campaigns={realCampaigns} kpis={realKPIs} />}
        {activeMainTab === 'utm' && <UtmSalesTab />}
      </div>
    </div>
  );
}

// ==========================================
// OPTIMIZATIONS TAB (NEW)
// ==========================================
function OptimizationsTab({ campaigns, optimizations, onOptimize }) {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [optModalOpen, setOptModalOpen] = useState(false);
  const [optComment, setOptComment] = useState('');

  const activeCampaigns = campaigns.filter(c => c.status === 'ativo');

  const getStatus = (campaignId) => {
    const opt = optimizations[campaignId];
    if (!opt) return { label: 'Pendente', color: COLORS.yellow, overdue: true };
    const lastDate = new Date(opt.lastOpt);
    const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= 7) return { label: `Atrasado (${diffDays}d)`, color: COLORS.red, overdue: true };
    return { label: `Em dia (${diffDays}d)`, color: COLORS.green, overdue: false };
  };

  const handleOpenOpt = (c) => {
    setSelectedCampaign(c);
    setOptComment('');
    setOptModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Gestão de Otimizações</h2>
          <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Ciclo de otimização recomendado: 7 dias.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
        {activeCampaigns.map(c => {
          const status = getStatus(c.id);
          const opt = optimizations[c.id];
          return (
            <div key={c.id} style={{ background: COLORS.cardBg, border: `1px solid ${status.overdue ? COLORS.red : COLORS.cardBorder}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Última mexida: {opt ? new Date(opt.lastOpt).toLocaleDateString() : 'Nunca'}</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: status.color, background: `${status.color}15`, padding: '4px 8px', borderRadius: 12, border: `1px solid ${status.color}30` }}>
                  {status.label.toUpperCase()}
                </div>
              </div>

              <div style={{ flex: 1, marginBottom: 20 }}>
                {opt?.history?.[0] ? (
                  <div style={{ background: COLORS.bgDark, padding: 12, borderRadius: 8, fontSize: 12, color: COLORS.textMuted, border: `1px solid ${COLORS.cardBorder}` }}>
                    <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={12}/> Último Comentário:</div>
                    "{opt.history[0].comment}"
                  </div>
                ) : (
                  <div style={{ color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic' }}>Nenhum histórico de otimização registrado.</div>
                )}
              </div>

              <button 
                onClick={() => handleOpenOpt(c)}
                style={{ width: '100%', background: status.overdue ? COLORS.yellow : COLORS.bgDark, color: status.overdue ? '#000' : '#FFF', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Activity size={14} /> Registrar Otimização
              </button>
            </div>
          );
        })}
      </div>

      <Modal isOpen={optModalOpen} onClose={() => setOptModalOpen(false)} title={`Otimizar: ${selectedCampaign?.name}`}>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>O que foi alterado nesta campanha? Registre para manter o histórico de performance.</div>
          <textarea 
            rows={5} 
            value={optComment} 
            onChange={e => setOptComment(e.target.value)}
            placeholder="Ex: Pausamos o criativo B, aumentamos o orçamento em 15% e trocamos o público de interesse para Lookalike 1%."
            style={{ width: '100%', padding: 12, background: COLORS.bgDark, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, color: '#FFF', fontSize: 13, outline: 'none', marginBottom: 20 }}
          />
          <button 
            className="btn btn-primary" 
            onClick={() => { onOptimize(selectedCampaign.id, optComment); setOptModalOpen(false); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Check size={18} /> Confirmar Otimização
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ==========================================
// OTHER TABS (Dashboard, Meta, Google, Reports, UTM)
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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {['Campanhas', 'Conjuntos', 'Anúncios', 'Demográficos'].map(tab => (
          <button key={tab} onClick={() => setActiveMetaTab(tab.toLowerCase())} style={{ background: activeMetaTab === tab.toLowerCase() ? '#222' : 'transparent', border: `1px solid ${COLORS.cardBorder}`, color: '#FFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{tab}</button>
        ))}
      </div>
      {activeMetaTab === 'campanhas' && <MetaCampaignsTable campaigns={campaigns} />}
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
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>GASTO</th>
            <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map(c => (
            <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{c.name}</td>
              <td style={{ padding: '12px 16px', fontSize: 11 }}>{c.status.toUpperCase()}</td>
              <td style={{ padding: '12px 16px', fontSize: 13 }}>{fmtBRL(c.spend)}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700 }}>{c.roas.toFixed(2)}x</td>
            </tr>
          ))}
        </tbody>
      </table>
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
