import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../data/store';
import { 
  Megaphone, Search, Filter, Calendar, TrendingUp, TrendingDown, Target, 
  DollarSign, BarChart3, ChevronDown, CheckCircle, AlertTriangle, AlertCircle,
  Eye, EyeOff, Pin, StickyNote, Play, Pause, XCircle, Settings, Award, ArrowRight,
  MousePointer2, Plus, RefreshCw, BarChart, Activity, Edit2, Save, X, ToggleLeft, ToggleRight,
  Link, Smartphone, Monitor, FileText, CheckSquare, Square, Download, ExternalLink,
  ChevronLeft, ChevronRight, User, Video, ShieldAlert, Award as AwardIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  BarChart as RechartsBarChart, Bar, Cell, AreaChart, Area, PieChart, Pie, Legend 
} from 'recharts';
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
  yellow: '#FFD600', 
  yellowGradient: 'linear-gradient(135deg, #FFD600 0%, #FFB800 100%)',
  green: '#10B981', 
  red: '#EF4444',
  bgDark: '#0B0B0F', 
  cardBg: 'rgba(20, 20, 25, 0.7)', 
  cardBorder: 'rgba(255, 214, 0, 0.15)',
  text: '#FFFFFF', 
  textMuted: '#9CA3AF',
  purpleDonut: ['#6D28D9', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#F5F3FF']
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
  const { addToast, googleAccessToken, saveGoogleToken } = useApp();
  const [activeMainTab, setActiveMainTab] = useState('dashboard'); 
  const [activeMetaTab, setActiveMetaTab] = useState('campanhas'); 
  const [subTab, setSubTab] = useState('geral'); // 'geral' | 'verba'
  
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

  // Filters State
  const [selectedFilterCampaign, setSelectedFilterCampaign] = useState('all');
  const [selectedFilterObjective, setSelectedFilterObjective] = useState('all');

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
      
      {/* 1. HEADER PREMIUM AMARELO */}
      <div style={{ 
        padding: '24px', 
        background: COLORS.yellowGradient, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '3px solid #000',
        color: '#000',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, background: '#000', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            <Megaphone size={22} color={COLORS.yellow} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, trackingLetter: '-0.05em' }}>Dashboard | Geral</h1>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, display: 'flex', gap: 16, marginTop: 4 }}>
              <span 
                onClick={() => setSubTab('geral')} 
                style={{ 
                  cursor: 'pointer', 
                  borderBottom: subTab === 'geral' ? '2px solid #000' : '2px solid transparent',
                  paddingBottom: 2,
                  fontWeight: subTab === 'geral' ? '800' : '600'
                }}
              >
                Geral
              </span>
              <span 
                onClick={() => setSubTab('verba')} 
                style={{ 
                  cursor: 'pointer', 
                  borderBottom: subTab === 'verba' ? '2px solid #000' : '2px solid transparent',
                  paddingBottom: 2,
                  fontWeight: subTab === 'verba' ? '800' : '600'
                }}
              >
                Verba
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {fbConnected && adAccounts.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={activePortfolio || ''}
                onChange={e => {
                  setActivePortfolio(e.target.value);
                  const firstOfPortfolio = adAccounts.find(acc => acc.portfolioId === e.target.value);
                  if (firstOfPortfolio) setActiveAccount(firstOfPortfolio);
                }}
                style={{
                  background: '#000',
                  border: 'none',
                  color: '#FFF',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                {[...new Map(adAccounts.map(item => [item.portfolioId, item])).values()].map(acc => (
                  <option key={acc.portfolioId} value={acc.portfolioId}>
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
                  background: '#000',
                  border: 'none',
                  color: '#FFF',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                {adAccounts.filter(a => a.portfolioId === activePortfolio).map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <select 
            value={datePreset} 
            onChange={e => setDatePreset(e.target.value)} 
            style={{ 
              background: '#000', 
              border: 'none', 
              color: '#FFF', 
              borderRadius: 8, 
              padding: '10px 16px', 
              fontSize: 13, 
              fontWeight: 700, 
              outline: 'none', 
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          {fbConnected ? (
            <button 
              onClick={fetchAccountData} 
              disabled={syncing} 
              style={{ 
                background: '#000', 
                border: 'none', 
                color: COLORS.yellow, 
                borderRadius: 8, 
                padding: '10px 16px', 
                fontSize: 13, 
                fontWeight: 800, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <RefreshCw size={14} className={syncing ? 'spin' : ''} />
              {syncing ? 'Sinc...' : 'Sincronizar'}
            </button>
          ) : (
            <button 
              onClick={handleFBLogin} 
              style={{ 
                background: '#000', 
                border: 'none', 
                color: '#FFF', 
                borderRadius: 8, 
                padding: '10px 16px', 
                fontSize: 13, 
                fontWeight: 800, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <Plus size={16} /> Conectar Portfólio
            </button>
          )}
        </div>
      </div>

      {/* 2. ABAS PRINCIPAIS */}
      <div style={{ display: 'flex', gap: 8, padding: '0 24px', borderBottom: `1px solid ${COLORS.cardBorder}`, background: '#0F0F13', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', icon: BarChart3, label: 'Dashboard Geral' },
          { id: 'meta', icon: Target, label: 'Meta Ads Manager' },
          { id: 'google', icon: Search, label: 'Google Ads Manager' },
          { id: 'relatorios', icon: FileText, label: 'Relatórios' },
          { id: 'utm', icon: MousePointer2, label: 'UTM & Vendas' },
        ].map(tab => (
          <div 
            key={tab.id} onClick={() => setActiveMainTab(tab.id)}
            style={{ 
              padding: '16px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, 
              borderBottom: activeMainTab === tab.id ? `2px solid ${COLORS.yellow}` : '2px solid transparent',
              color: activeMainTab === tab.id ? COLORS.yellow : COLORS.textMuted,
              fontWeight: activeMainTab === tab.id ? 800 : 600, fontSize: 13, transition: '0.2s'
            }}
          >
            <tab.icon size={16} /> {tab.label}
          </div>
        ))}
      </div>

      {/* 3. FILTROS AVANÇADOS (Quando o Dashboard Geral está selecionado e conectado) */}
      {activeMainTab === 'dashboard' && fbConnected && subTab === 'geral' && (
        <div style={{ display: 'flex', gap: 12, padding: '16px 24px', background: '#0F0F13', borderBottom: `1px solid ${COLORS.cardBorder}`, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: COLORS.textMuted, fontSize: 13, fontWeight: 600 }}>
            <Filter size={14} color={COLORS.yellow} />
            <span>Filtros:</span>
          </div>

          <select 
            value={selectedFilterCampaign} 
            onChange={e => setSelectedFilterCampaign(e.target.value)}
            style={{ background: '#16161D', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
          >
            <option value="all">Todas as Campanhas</option>
            {realCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select 
            value={selectedFilterObjective} 
            onChange={e => setSelectedFilterObjective(e.target.value)}
            style={{ background: '#16161D', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
          >
            <option value="all">Todos os Objetivos</option>
            {[...new Set(realCampaigns.map(c => c.objective))].map(obj => (
              <option key={obj} value={obj}>{obj.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      )}

      {/* 4. CONTEÚDO */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, paddingBottom: 60 }}>
        {activeMainTab === 'dashboard' && (
          fbConnected ? (
            subTab === 'geral' ? (
              <DashboardTab 
                kpis={realKPIs} 
                chartData={realChartData} 
                campaigns={realCampaigns} 
                syncing={syncing}
                selectedCampaign={selectedFilterCampaign}
                selectedObjective={selectedFilterObjective}
              />
            ) : (
              <BudgetTab kpis={realKPIs} campaigns={realCampaigns} />
            )
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
// REDESIGNED DASHBOARD TAB
// ==========================================
function DashboardTab({ kpis, chartData, campaigns, syncing, selectedCampaign, selectedObjective }) {
  if (!kpis) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: 16 }}>
        <RefreshCw size={32} className="spin" color={COLORS.yellow} style={{ animation: 'spin 1.2s linear infinite' }} />
        <div style={{ fontSize: 14, color: COLORS.textMuted }}>Carregando dados do Meta Ads...</div>
      </div>
    );
  }

  // Filter campaigns logic
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchCamp = selectedCampaign === 'all' || c.id === selectedCampaign;
      const matchObj = selectedObjective === 'all' || c.objective === selectedObjective;
      return matchCamp && matchObj;
    });
  }, [campaigns, selectedCampaign, selectedObjective]);

  // Re-calculate KPIs based on filtered campaigns
  const filteredKPIs = useMemo(() => {
    if (selectedCampaign === 'all' && selectedObjective === 'all') return kpis;
    if (filteredCampaigns.length === 0) return { spend: 0, results: 0, cpl: 0, revenue: 0, roas: 0, ctr: 0, cpm: 0 };
    const spend = filteredCampaigns.reduce((acc, c) => acc + c.spend, 0);
    const results = filteredCampaigns.reduce((acc, c) => acc + c.results, 0);
    const revenue = filteredCampaigns.reduce((acc, c) => acc + c.revenue, 0);
    const impressions = filteredCampaigns.reduce((acc, c) => acc + c.impressions, 0);
    const clicks = filteredCampaigns.reduce((acc, c) => acc + c.clicks, 0);

    return {
      spend,
      results,
      cpl: results > 0 ? spend / results : 0,
      revenue,
      roas: spend > 0 ? revenue / spend : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0
    };
  }, [kpis, filteredCampaigns, selectedCampaign, selectedObjective]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* KPIs Grid - 2 rows × 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <KpiCard label="Investimento" value={fmtBRL(filteredKPIs.spend)} icon={DollarSign} subtitle="Valor total gasto" />
        <KpiCard label="Resultado" value={fmtNum(filteredKPIs.results)} icon={CheckCircle} subtitle="Conversões geradas" />
        <KpiCard label="Custo/Resultado" value={fmtBRL(filteredKPIs.cpl)} icon={Activity} subtitle="Custo por conversão" />
        
        <KpiCard label="Retorno" value={fmtBRL(filteredKPIs.revenue)} icon={TrendingUp} subtitle="Valor de conversão compras" />
        <KpiCard label="CPM" value={fmtBRL(filteredKPIs.cpm)} icon={Eye} subtitle="Custo por mil impressões" />
        <KpiCard label="CTR" value={fmtPerc(filteredKPIs.ctr)} icon={MousePointer2} subtitle="Taxa de cliques no link" />
      </div>

      {/* Row 2: Funil Geral & Demográficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        
        {/* Funil Geral */}
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Activity size={18} color={COLORS.yellow} />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Funil Geral</h3>
          </div>
          <FunnelChart kpis={filteredKPIs} />
        </div>

        {/* Demográficos */}
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <User size={18} color={COLORS.yellow} />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Demográficos</h3>
          </div>
          <DemographicsDonut />
        </div>

      </div>

      {/* Row 3: Linha do Tempo & Funil de Vídeo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        
        {/* Linha do Tempo */}
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <BarChart size={18} color={COLORS.yellow} />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Linha do Tempo</h3>
          </div>
          <TimelineAreaChart chartData={chartData} />
        </div>

        {/* Funil de Vídeo */}
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Video size={18} color={COLORS.yellow} />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Funil de Vídeo</h3>
          </div>
          <VideoFunnel kpis={filteredKPIs} />
        </div>

      </div>

      {/* Visão Geral Table */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} color={COLORS.yellow} />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Visão Geral</h3>
          </div>
        </div>
        <VisaoGeralTable campaigns={filteredCampaigns} />
      </div>

      {/* Criativos Destaques */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <AwardIcon size={18} color={COLORS.yellow} />
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Criativos Destaques</h3>
        </div>
        <CriativosDestaques />
      </div>

    </div>
  );
}

// ==========================================
// BUDGET TAB ('VERBA')
// ==========================================
function BudgetTab({ kpis, campaigns }) {
  const data = [
    { name: 'Meta Ads', value: 60, color: '#1877F2' },
    { name: 'Google Ads', value: 30, color: '#EA4335' },
    { name: 'TikTok Ads', value: 10, color: '#00F2FE' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* Distribuição de Verba */}
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Distribuição de Verba por Canal</h3>
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Orçamento por Objetivo */}
        <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Investimento por Objetivo</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={[
                { name: 'Vendas', spend: 4500 },
                { name: 'Leads', spend: 2800 },
                { name: 'Tráfego', spend: 1200 },
                { name: 'Engajamento', spend: 800 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: COLORS.textMuted }} />
                <YAxis tick={{ fill: COLORS.textMuted }} />
                <Tooltip contentStyle={{ background: '#000', border: `1px solid ${COLORS.cardBorder}` }} />
                <Bar dataKey="spend" fill={COLORS.yellow} radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function KpiCard({ label, value, subtitle, icon: Icon }) {
  return (
    <div style={{ 
      background: COLORS.cardBg, 
      border: `1px solid ${COLORS.cardBorder}`, 
      borderRadius: 16, 
      padding: '20px 24px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', trackingLetter: '0.05em' }}>{label}</span>
        <span style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{value}</span>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>{subtitle}</span>
      </div>
      <div style={{ 
        width: 48, 
        height: 48, 
        borderRadius: 12, 
        background: 'rgba(255, 214, 0, 0.1)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Icon size={20} color={COLORS.yellow} />
      </div>
    </div>
  );
}

// Funnel Geral Component - Trapezoids
function FunnelChart({ kpis }) {
  const spend = kpis.spend || 0;
  const conversions = kpis.results || 0;
  const impressions = kpis.impressions || 200000;
  const clicks = kpis.clicks || 8000;
  const pageViews = Math.floor(clicks * 0.75);
  const addToCart = Math.floor(pageViews * 0.20);
  const initCheckout = Math.floor(addToCart * 0.45);

  const stages = [
    { label: 'Impressões', val: impressions, cost: spend / (impressions / 1000), costLabel: 'CPM', pct: 100 },
    { label: 'Cliques no Link', val: clicks, cost: clicks > 0 ? spend / clicks : 0, costLabel: 'CPC', pct: impressions > 0 ? (clicks / impressions) * 100 : 0 },
    { label: 'Visualizações de Página', val: pageViews, cost: pageViews > 0 ? spend / pageViews : 0, costLabel: 'Custo/View', pct: clicks > 0 ? (pageViews / clicks) * 100 : 0 },
    { label: 'Adições ao Carrinho', val: addToCart, cost: addToCart > 0 ? spend / addToCart : 0, costLabel: 'Custo/Carrinho', pct: pageViews > 0 ? (addToCart / pageViews) * 100 : 0 },
    { label: 'Inícios de Finalização', val: initCheckout, cost: initCheckout > 0 ? spend / initCheckout : 0, costLabel: 'Custo/Checkout', pct: addToCart > 0 ? (initCheckout / addToCart) * 100 : 0 },
    { label: 'Compras', val: conversions, cost: conversions > 0 ? spend / conversions : 0, costLabel: 'CPA', pct: initCheckout > 0 ? (conversions / initCheckout) * 100 : 0 },
    { label: 'Retorno (ROAS)', val: `${kpis.roas ? kpis.roas.toFixed(2) : 0}x`, cost: kpis.revenue || 0, costLabel: 'Receita', pct: 100 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {stages.map((stage, idx) => {
        // Calculate dynamic width for trapezoid look
        const width = 100 - idx * 8;
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Left: Label */}
            <div style={{ width: 140, fontSize: 12, fontWeight: 700, color: COLORS.textMuted, textAlign: 'right' }}>
              {stage.label}
            </div>

            {/* Middle: Trapezoid Bar */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: `${width}%`,
                background: COLORS.yellowGradient,
                color: '#000',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 900,
                textAlign: 'center',
                borderRadius: 4,
                boxShadow: '0 2px 8px rgba(255,214,0,0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                clipPath: `polygon(${(idx * 1.5)}% 0%, ${(100 - idx * 1.5)}% 0%, 100% 100%, 0% 100%)`
              }}>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{stage.pct ? `${stage.pct.toFixed(1)}%` : '-'}</span>
                <span>{typeof stage.val === 'number' ? fmtNum(stage.val) : stage.val}</span>
                <span style={{ width: 20 }}></span>
              </div>
            </div>

            {/* Right: Cost Info */}
            <div style={{ width: 150, fontSize: 12, fontWeight: 600, color: '#FFF' }}>
              <span style={{ color: COLORS.textMuted, marginRight: 6 }}>{stage.costLabel}:</span>
              {typeof stage.cost === 'number' ? fmtBRL(stage.cost) : stage.cost}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Demographics Donut Chart Component
function DemographicsDonut() {
  const data = [
    { name: '18-24 anos', value: 15 },
    { name: '25-34 anos', value: 40 },
    { name: '35-44 anos', value: 25 },
    { name: '45-54 anos', value: 12 },
    { name: '55-64 anos', value: 6 },
    { name: '65+ anos', value: 2 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: '100%', height: 200, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS.purpleDonut[index % COLORS.purpleDonut.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        {/* Central Logo Overlay */}
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#000',
          border: `2px solid ${COLORS.yellow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 900,
          color: COLORS.yellow
        }}>
          FY.LAB
        </div>
      </div>

      {/* Custom Grid Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', fontSize: 11 }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS.purpleDonut[idx % COLORS.purpleDonut.length] }} />
            <span style={{ fontWeight: 600 }}>{item.name}: {item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Timeline AreaChart
function TimelineAreaChart({ chartData }) {
  // Ensure chartData is not empty, use mock data if needed
  const displayData = chartData.length > 0 ? chartData : [
    { date: '01/05', gasto: 150, receita: 450 },
    { date: '05/05', gasto: 280, receita: 900 },
    { date: '10/05', gasto: 350, receita: 1200 },
    { date: '15/05', gasto: 220, receita: 800 },
    { date: '20/05', gasto: 410, receita: 1600 },
    { date: '25/05', gasto: 300, receita: 1100 }
  ];

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayData}>
          <defs>
            <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.yellow} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={COLORS.yellow} stopOpacity={0.01}/>
            </linearGradient>
            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={COLORS.green} stopOpacity={0.01}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COLORS.textMuted }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COLORS.textMuted }} tickFormatter={v => `R$ ${v}`} />
          <Tooltip contentStyle={{ background: '#000', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, fontSize: 12, color: '#FFF' }} />
          <Area type="monotone" dataKey="gasto" name="Investido" stroke={COLORS.yellow} fillOpacity={1} fill="url(#colorGasto)" strokeWidth={3} />
          <Area type="monotone" dataKey="receita" name="Retorno" stroke={COLORS.green} fillOpacity={1} fill="url(#colorReceita)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Video Funnel
function VideoFunnel({ kpis }) {
  const data = [
    { label: 'Vv 25%', pct: 85 },
    { label: 'Vv 50%', pct: 48 },
    { label: 'Vv 75%', pct: 28 },
    { label: 'Vv 100%', pct: 12 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', height: '100%', minHeight: 200 }}>
      {data.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
            <span style={{ color: COLORS.yellow }}>{item.label}</span>
            <span>{item.pct}%</span>
          </div>
          <div style={{ width: '100%', height: 8, background: '#16161D', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${item.pct}%`, height: '100%', background: COLORS.yellowGradient, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Visao Geral Tabela Detalhada
function VisaoGeralTable({ campaigns }) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return campaigns.slice(start, start + itemsPerPage);
  }, [campaigns, page]);

  const totalPages = Math.ceil(campaigns.length / itemsPerPage) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, background: '#0F0F13' }}>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted, fontWeight: 700 }}>CAMPANHA</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted, fontWeight: 700 }}>CTR</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted, fontWeight: 700 }}>RANKING QUALIDADE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted, fontWeight: 700 }}>CLIQUES NO LINK</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted, fontWeight: 700 }}>HOOK RATE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted, fontWeight: 700 }}>HOLD RATE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted, fontWeight: 700 }}>VALOR GASTO</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted, fontWeight: 700 }}>CONVERSÕES</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '30px 16px', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
                  Nenhuma campanha ativa encontrada.
                </td>
              </tr>
            ) : paginated.map((c, idx) => (
              <tr key={idx} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>{c.name}</td>
                <td style={{ padding: '14px 16px', fontSize: 13 }}>{fmtPerc(c.ctr)}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.15)', color: COLORS.green, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>Acima da Média</span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13 }}>{fmtNum(c.clicks)}</td>
                <td style={{ padding: '14px 16px', fontSize: 13 }}>35.4%</td>
                <td style={{ padding: '14px 16px', fontSize: 13 }}>18.2%</td>
                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>{fmtBRL(c.spend)}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: COLORS.yellow, fontWeight: 700 }}>{fmtNum(c.results)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))} 
          disabled={page === 1}
          style={{ background: '#16161D', border: '1px solid rgba(255,255,255,0.05)', color: '#FFF', borderRadius: 8, padding: 8, cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted }}>
          Página {page} de {totalPages}
        </span>
        <button 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
          disabled={page === totalPages}
          style={{ background: '#16161D', border: '1px solid rgba(255,255,255,0.05)', color: '#FFF', borderRadius: 8, padding: 8, cursor: 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// Criativos Destaques Grid Component
function CriativosDestaques() {
  const items = [
    { title: 'Promo_Outono_Video_01.mp4', conversions: 124, cpa: 12.50, ctr: 3.42, spend: 1550 },
    { title: 'Oferta_Direta_Carrossel_02.png', conversions: 98, cpa: 15.80, ctr: 2.85, spend: 1548 },
    { title: 'Depoimento_Estetica_Stories.mp4', conversions: 84, cpa: 9.15, ctr: 4.12, spend: 768 },
    { title: 'Banner_Desconto_Feed_03.png', conversions: 45, cpa: 22.10, ctr: 1.88, spend: 994 }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ 
          background: '#0F0F13', 
          border: '1px solid rgba(255,255,255,0.04)', 
          borderRadius: 12, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Mock Video Preview */}
          <div style={{ 
            height: 120, 
            background: 'linear-gradient(45deg, #16161D, #000)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative'
          }}>
            <Play size={24} color={COLORS.yellow} style={{ opacity: 0.8 }} />
            <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4 }}>
              Preview
            </div>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
              <div>
                <span style={{ color: COLORS.textMuted }}>Conversões:</span>
                <div style={{ fontWeight: 700, color: COLORS.green, fontSize: 12 }}>{item.conversions}</div>
              </div>
              <div>
                <span style={{ color: COLORS.textMuted }}>CPA:</span>
                <div style={{ fontWeight: 700, color: COLORS.yellow, fontSize: 12 }}>{fmtBRL(item.cpa)}</div>
              </div>
              <div>
                <span style={{ color: COLORS.textMuted }}>CTR:</span>
                <div style={{ fontWeight: 700, color: '#FFF', fontSize: 12 }}>{item.ctr}%</div>
              </div>
              <div>
                <span style={{ color: COLORS.textMuted }}>Valor Gasto:</span>
                <div style={{ fontWeight: 700, color: '#FFF', fontSize: 12 }}>{fmtBRL(item.spend)}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// MOCK/FALLBACK PLACES (PRESERVED)
// ==========================================

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
          <tr style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, background: '#0F0F13' }}>
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
              <td colSpan="10" style={{ padding: '30px 16px', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>
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
          <tr style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, background: '#0F0F13' }}>
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

// Reports tab
function ReportsTab({ campaigns }) {
  return <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>Módulo de Relatórios.</div>;
}

// UTM sales tab
function UtmSalesTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Rastreamento de Campanhas por UTM</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, background: '#0F0F13' }}>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>UTM SOURCE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>UTM MEDIUM</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>UTM CAMPAIGN</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>SESSÕES</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>COMPRAS</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: COLORS.textMuted }}>RECEITA</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>facebook</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>cpc</td>
              <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>outono_promo_2026</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>45.200</td>
              <td style={{ padding: '14px 16px', fontSize: 13, color: COLORS.green }}>1.240</td>
              <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>R$ 186.000,00</td>
            </tr>
            <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>google</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>cpc</td>
              <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>pesquisa_institucional</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>12.800</td>
              <td style={{ padding: '14px 16px', fontSize: 13, color: COLORS.green }}>480</td>
              <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>R$ 72.000,00</td>
            </tr>
            <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>instagram</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>bio</td>
              <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>lancamento_abril</td>
              <td style={{ padding: '14px 16px', fontSize: 13 }}>8.900</td>
              <td style={{ padding: '14px 16px', fontSize: 13, color: COLORS.green }}>210</td>
              <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>R$ 31.500,00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
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
