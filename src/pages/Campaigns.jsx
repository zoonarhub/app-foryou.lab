import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../data/store';
import { 
  RefreshCw, DollarSign, Target, Users, MousePointer2, 
  TrendingUp, Activity, Heart, Globe, Calendar, SlidersHorizontal, Download, Filter, BarChart3, ChevronDown
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import axios from 'axios';

const DATE_PRESETS = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7d', label: 'Últimos 7 dias' },
  { value: 'last_30d', label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este Mês' },
  { value: 'last_month', label: 'Mês Passado' },
  { value: 'maximum', label: 'Máximo' },
];

const fmtBRL = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtNum = v => new Intl.NumberFormat('pt-BR').format(v);

export default function Campaigns() {
  const { addToast } = useApp();
  const [activeMetrics, setActiveMetrics] = useState(['investimento', 'alcance', 'leads']);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [view, setView] = useState('performance');
  
  const [fbConnected, setFbConnected] = useState(() => !!localStorage.getItem('fb_ads_token'));
  const [syncing, setSyncing] = useState(false);
  const [adAccounts, setAdAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [datePreset, setDatePreset] = useState('last_30d');

  // Real Data State
  const [realKPIs, setRealKPIs] = useState(null);
  const [realCampaigns, setRealCampaigns] = useState([]);
  const [realChartData, setRealChartData] = useState([]);

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
      addToast('Erro ao carregar contas do Facebook', 'error');
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
        params: {
          access_token: token,
          date_preset: datePreset,
          fields: 'spend,clicks,inline_link_clicks,cpm,cpc,ctr,frequency,impressions,actions'
        }
      });
      const accountData = kpiRes.data.data[0] || {};
      
      let results = 0;
      if (accountData.actions) {
        const targetActions = accountData.actions.filter(a => ['lead', 'purchase', 'onsite_conversion.messaging_conversation_started_7d', 'offsite_conversion.fb_pixel_lead', 'messages'].includes(a.action_type));
        results = targetActions.reduce((sum, a) => sum + parseInt(a.value), 0);
      }
      
      const spend = parseFloat(accountData.spend || 0);
      setRealKPIs({
        spend: spend,
        clicks: parseInt(accountData.clicks || 0),
        linkClicks: parseInt(accountData.inline_link_clicks || 0),
        cpm: parseFloat(accountData.cpm || 0),
        cpc: parseFloat(accountData.cpc || 0),
        ctrAll: parseFloat(accountData.ctr || 0),
        frequency: parseFloat(accountData.frequency || 0),
        impressions: parseInt(accountData.impressions || 0),
        results: results,
        cpa: results > 0 ? spend / results : 0
      });

      // 2. Campaigns List
      const campRes = await axios.get(`https://graph.facebook.com/v18.0/${activeAccount.id}/campaigns`, {
        params: {
          access_token: token,
          fields: `id,name,status,insights.date_preset(${datePreset}){spend,actions}`,
          limit: 100
        }
      });
      
      const campaigns = campRes.data.data.map(c => {
        const ins = c.insights?.data?.[0] || {};
        const cSpend = parseFloat(ins.spend || 0);
        let cResults = 0;
        if (ins.actions) {
           const cTarget = ins.actions.filter(a => ['lead', 'purchase', 'onsite_conversion.messaging_conversation_started_7d', 'messages'].includes(a.action_type));
           cResults = cTarget.reduce((sum, a) => sum + parseInt(a.value), 0);
        }
        return {
          id: c.id,
          name: c.name,
          status: c.status === 'ACTIVE' ? 'ativo' : 'inativo',
          spend: cSpend,
          results: cResults
        };
      });
      setRealCampaigns(campaigns);
      setSelectedCampaigns(campaigns.map(c => c.id));

      // 3. Time Chart Data
      const chartRes = await axios.get(`https://graph.facebook.com/v18.0/${activeAccount.id}/insights`, {
        params: {
          access_token: token,
          date_preset: datePreset,
          time_increment: 1,
          fields: 'date_start,spend,clicks,impressions,actions'
        }
      });
      
      const chart = chartRes.data.data.map(d => {
        let dResults = 0;
        if (d.actions) {
           const dTarget = d.actions.filter(a => ['lead', 'purchase', 'onsite_conversion.messaging_conversation_started_7d', 'messages'].includes(a.action_type));
           dResults = dTarget.reduce((sum, a) => sum + parseInt(a.value), 0);
        }
        const dt = new Date(d.date_start);
        return {
          date: `${dt.getDate()}/${dt.getMonth()+1}`,
          investimento: parseFloat(d.spend || 0),
          alcance: parseInt(d.impressions || 0),
          leads: dResults,
          cliques: parseInt(d.clicks || 0)
        }
      });
      setRealChartData(chart);
      addToast('Dados sincronizados com sucesso!');

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
      } else {
        addToast('Login cancelado ou não autorizado', 'warning');
      }
    }, { scope: 'ads_management,ads_read,business_management' });
  };

  useEffect(() => {
    const token = localStorage.getItem('fb_ads_token');
    if (token) fetchAdAccounts(token);
  }, []);

  useEffect(() => {
    if (fbConnected && activeAccount) {
      fetchAccountData();
    }
  }, [activeAccount, datePreset]);

  const toggleMetric = (metric) => {
    setActiveMetrics(prev => 
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  };

  const MetricToggle = ({ label, id, color }) => (
    <button 
      onClick={() => toggleMetric(id)}
      style={{ 
        background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
        color: activeMetrics.includes(id) ? color : 'var(--text-muted)',
        borderBottom: activeMetrics.includes(id) ? `2px solid ${color}` : '2px solid transparent',
        padding: '4px 8px', transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: 'rgba(24, 119, 242, 0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={20} color="#1877F2" />
          </div>
          <div>
            <h2 style={{ fontSize: 20 }}>Meta Ads</h2>
            {fbConnected && activeAccount ? (
              <select 
                value={activeAccount.id} 
                onChange={e => setActiveAccount(adAccounts.find(a => a.id === e.target.value))}
                style={{ fontSize: 12, background: 'transparent', border: 'none', color: 'var(--text-secondary)', outline: 'none', cursor: 'pointer', padding: 0 }}
              >
                {adAccounts.map(act => <option key={act.id} value={act.id}>{act.name} ({act.id})</option>)}
              </select>
            ) : (
              <div className="breadcrumb" style={{ fontSize: 12 }}>Painel de Gestão</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {fbConnected && (
            <button className="btn btn-secondary btn-sm" onClick={fetchAccountData} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''} /> {syncing ? 'Sincronizando...' : 'Atualizar Dados'}
            </button>
          )}
          
          <div style={{ position: 'relative' }}>
            <select 
              value={datePreset}
              onChange={e => setDatePreset(e.target.value)}
              className="btn btn-secondary btn-sm"
              style={{ appearance: 'none', paddingRight: 32, outline: 'none' }}
              disabled={syncing}
            >
              {DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: 10, pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {!fbConnected ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', maxWidth: 500, margin: '40px auto' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(24, 119, 242, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Globe size={40} color="#1877F2" />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Conecte seu Meta Ads</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14, lineHeight: 1.6 }}>
              Faça login com sua conta Business para acessar o painel de performance com todas as métricas reais puxadas direto do Facebook.
            </p>
            <button className="btn btn-primary" onClick={handleFBLogin} style={{ background: '#1877F2', borderColor: '#1877F2', padding: '14px 40px', fontSize: 16 }}>
              <Globe size={18} /> Login com Facebook Business
            </button>
          </div>
        ) : (
          <>
            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              {[
                { title: 'Investimento', value: fmtBRL(realKPIs?.spend || 0), icon: DollarSign, color: '#3B82F6' },
                { title: 'Resultados (Ações)', value: fmtNum(realKPIs?.results || 0), icon: Target, color: '#22C55E' },
                { title: 'Custo por Resultado', value: fmtBRL(realKPIs?.cpa || 0), icon: Activity, color: '#3B82F6' },
                { title: 'Cliques', value: fmtNum(realKPIs?.clicks || 0), icon: Users, color: '#6366F1' },
                { title: 'Cliques no link', value: fmtNum(realKPIs?.linkClicks || 0), icon: MousePointer2, color: '#8B5CF6' },
                { title: 'CTR (Todos)', value: `${realKPIs?.ctrAll || 0}%`, icon: TrendingUp, color: '#3B82F6' },
                { title: 'CPM Médio', value: fmtBRL(realKPIs?.cpm || 0), icon: Target, color: '#3B82F6' },
                { title: 'CPC Médio', value: fmtBRL(realKPIs?.cpc || 0), icon: Target, color: '#3B82F6' },
                { title: 'Frequência', value: (realKPIs?.frequency || 0).toFixed(2), icon: BarChart3, color: '#6366F1' },
                { title: 'Impressões Totais', value: fmtNum(realKPIs?.impressions || 0), icon: Heart, color: '#3B82F6' },
              ].map((kpi, i) => (
                <div key={i} className="card" style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid var(--card-border)', background: 'var(--card-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{kpi.title}</span>
                    <div style={{ background: `${kpi.color}15`, padding: 4, borderRadius: 6 }}>
                      <kpi.icon size={12} color={kpi.color} />
                    </div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* CONTROLS & CAMPAIGN LIST */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              
              <div className="card" style={{ flex: 1, padding: 24, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <button onClick={() => setView('performance')} style={{ background: 'none', border: 'none', fontSize: 16, fontWeight: 800, color: view === 'performance' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all .2s' }}>Performance</button>
                    <button onClick={() => setView('funnel')} style={{ background: 'none', border: 'none', fontSize: 16, fontWeight: 800, color: view === 'funnel' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all .2s' }}>Funil de Conversão</button>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '6px 12px', borderRadius: 6 }}>{selectedCampaigns.length} campanhas filtradas</div>
                </div>

                {view === 'performance' ? (
                  <>
                    <div style={{ height: 300, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={realChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} dy={10} />
                          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `R$ ${v}`} />
                          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                          <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, fontSize: 12 }} />
                          
                          {activeMetrics.includes('investimento') && <Line yAxisId="left" type="monotone" dataKey="investimento" stroke="#6366F1" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />}
                          {activeMetrics.includes('alcance') && <Line yAxisId="right" type="monotone" dataKey="alcance" stroke="#8B5CF6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />}
                          {activeMetrics.includes('leads') && <Line yAxisId="right" type="monotone" dataKey="leads" stroke="#22C55E" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />}
                          {activeMetrics.includes('cliques') && <Line yAxisId="right" type="monotone" dataKey="cliques" stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 24, padding: '16px 0', borderTop: '1px solid var(--card-border)' }}>
                      <MetricToggle label="Investimento" id="investimento" color="#6366F1" />
                      <MetricToggle label="Cliques" id="cliques" color="#F59E0B" />
                      <MetricToggle label="Impressões" id="alcance" color="#8B5CF6" />
                      <MetricToggle label="Conversões" id="leads" color="#22C55E" />
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Clique nas métricas acima para alterar a visualização do gráfico ({datePreset})</div>
                  </>
                ) : (
                  <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 24, background: 'var(--bg-color)', padding: '6px 16px', borderRadius: 20 }}>
                      Valor Investido no Período: {fmtBRL(realKPIs?.spend || 0)}
                    </div>
                    
                    {/* Visual Funnel Blocks Real Data */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
                      <div style={{ width: '80%', background: '#3B82F6', borderRadius: 8, padding: '16px 0', textAlign: 'center', color: '#fff' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>Impressões</div>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>{fmtNum(realKPIs?.impressions || 0)}</div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>CPM: {fmtBRL(realKPIs?.cpm || 0)}</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '4px 0' }}>↓ {realKPIs?.ctrAll || 0}% Conversão</div>
                      
                      <div style={{ width: '65%', background: '#2563EB', borderRadius: 8, padding: '16px 0', textAlign: 'center', color: '#fff' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>Cliques (Todos)</div>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>{fmtNum(realKPIs?.clicks || 0)}</div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>CPC: {fmtBRL(realKPIs?.cpc || 0)}</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '4px 0' }}>↓ Retenção do Clique</div>

                      <div style={{ width: '50%', background: '#1D4ED8', borderRadius: 8, padding: '16px 0', textAlign: 'center', color: '#fff' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>Cliques no Link</div>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>{fmtNum(realKPIs?.linkClicks || 0)}</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '4px 0' }}>↓ Custo por Ação Final</div>

                      <div style={{ width: '35%', background: '#1E3A8A', borderRadius: 8, padding: '16px 0', textAlign: 'center', color: '#fff' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>Resultados (Leads/Mensagens)</div>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>{fmtNum(realKPIs?.results || 0)}</div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>CPA: {fmtBRL(realKPIs?.cpa || 0)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR: REAL CAMPAIGN LIST */}
              <div className="card" style={{ width: 320, padding: 20, borderRadius: 12, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800 }}>Todas as Campanhas</h3>
                  <Filter size={14} color="var(--text-secondary)" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 500, overflowY: 'auto', paddingRight: 4 }}>
                  {realCampaigns.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                      Nenhuma campanha encontrada no período ({datePreset}).
                    </div>
                  ) : (
                    realCampaigns.map(camp => (
                      <div key={camp.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, background: 'var(--bg-color)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedCampaigns.includes(camp.id)}
                          onChange={() => {
                            setSelectedCampaigns(prev => prev.includes(camp.id) ? prev.filter(id => id !== camp.id) : [...prev, camp.id])
                          }}
                          style={{ marginTop: 4, cursor: 'pointer' }} 
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>{camp.name}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                            <span>Gasto: {fmtBRL(camp.spend)}</span>
                            <span style={{ color: camp.status === 'ativo' ? '#22C55E' : 'var(--text-muted)' }}>● {camp.status}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </>
  );
}
