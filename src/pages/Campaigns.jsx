import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../data/store';
import { 
  RefreshCw, DollarSign, Target, Users, MousePointer2, 
  TrendingUp, Activity, Heart, Globe, Calendar, SlidersHorizontal, Download, Filter, BarChart3
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// --- MOCK DATA PARA DEMONSTRAÇÃO DO LAYOUT CRIATIVIVO ---
const mockKPIs = {
  spend: 1287.69, results: 56, cpa: 22.99, clicks: 665, linkClicks: 394,
  ctrAll: 2.13, ctrLink: 1.26, cpm: 41.18, cpc: 1.94, cpcLink: 3.27,
  frequency: 1.61, engagement: 4564
};

const mockChartData = [
  { date: '11/08', investimento: 300, alcance: 4000, leads: 1, cpl: 0 },
  { date: '12/08', investimento: 225, alcance: 3500, leads: 2, cpl: 0 },
  { date: '13/08', investimento: 200, alcance: 3000, leads: 3, cpl: 0 },
  { date: '14/08', investimento: 180, alcance: 2800, leads: 3, cpl: 0 },
  { date: '15/08', investimento: 150, alcance: 2000, leads: 2, cpl: 0 },
  { date: '16/08', investimento: 10, alcance: 500, leads: 0, cpl: 0 },
  { date: '17/08', investimento: 290, alcance: 5500, leads: 4, cpl: 0 },
];

const mockCampaigns = [
  { id: '1', name: '[PROMO] - Lançamento V2', status: 'ativo', spend: 450.00, results: 24, roas: 3.2 },
  { id: '2', name: '[REMARKETING] - Carrinho', status: 'ativo', spend: 120.50, results: 12, roas: 5.1 },
  { id: '3', name: '[TOPO] - Lookalike 1%', status: 'pausado', spend: 717.19, results: 20, roas: 1.8 },
];

const fmtBRL = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtNum = v => new Intl.NumberFormat('pt-BR').format(v);

export default function Campaigns() {
  const { addToast } = useApp();
  const [activeMetrics, setActiveMetrics] = useState(['investimento', 'alcance']);
  const [selectedCampaigns, setSelectedCampaigns] = useState(['1', '2']);
  const [view, setView] = useState('performance'); // performance | funnel

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
            <div className="breadcrumb" style={{ fontSize: 12 }}>Criativivo Testes (Principal)</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary btn-sm"><Download size={14} /> Baixar PDF da visão geral</button>
          <button className="btn btn-secondary btn-sm"><Calendar size={14} /> 11/08/2026 - 17/08/2026</button>
          <button className="btn btn-secondary btn-sm"><SlidersHorizontal size={14} /> Organizar</button>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* KPI GRID (Criativivo Style) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {[
            { title: 'Investimento', value: fmtBRL(mockKPIs.spend), icon: DollarSign, color: '#3B82F6' },
            { title: 'Resultados', value: fmtNum(mockKPIs.results), icon: Target, color: '#22C55E' },
            { title: 'Custo por Resultado', value: fmtBRL(mockKPIs.cpa), icon: Activity, color: '#3B82F6' },
            { title: 'Cliques', value: fmtNum(mockKPIs.clicks), icon: Users, color: '#6366F1' },
            { title: 'Total de cliques no link', value: fmtNum(mockKPIs.linkClicks), icon: MousePointer2, color: '#8B5CF6' },
            { title: 'CTR (Todos)', value: `${mockKPIs.ctrAll}%`, icon: TrendingUp, color: '#3B82F6' },
            { title: 'CTR (Cliques no link)', value: `${mockKPIs.ctrLink}%`, icon: TrendingUp, color: '#3B82F6' },
            { title: 'CPM Médio', value: fmtBRL(mockKPIs.cpm), icon: Target, color: '#3B82F6' },
            { title: 'CPC Médio', value: fmtBRL(mockKPIs.cpc), icon: Target, color: '#3B82F6' },
            { title: 'CPC Médio (No link)', value: fmtBRL(mockKPIs.cpcLink), icon: Target, color: '#3B82F6' },
            { title: 'Frequência', value: mockKPIs.frequency, icon: BarChart3, color: '#6366F1' },
            { title: 'Engajamento da página', value: fmtNum(mockKPIs.engagement), icon: Heart, color: '#3B82F6' },
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
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '6px 12px', borderRadius: 6 }}>{selectedCampaigns.length} campanhas selecionadas</div>
            </div>

            {view === 'performance' ? (
              <>
                <div style={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `R$ ${v}`} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                      <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, fontSize: 12 }} />
                      
                      {activeMetrics.includes('investimento') && <Line yAxisId="left" type="monotone" dataKey="investimento" stroke="#6366F1" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />}
                      {activeMetrics.includes('alcance') && <Line yAxisId="right" type="monotone" dataKey="alcance" stroke="#8B5CF6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />}
                      {activeMetrics.includes('leads') && <Line yAxisId="right" type="monotone" dataKey="leads" stroke="#22C55E" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 24, padding: '16px 0', borderTop: '1px solid var(--card-border)' }}>
                  <MetricToggle label="Investimento" id="investimento" color="#6366F1" />
                  <MetricToggle label="Vendas" id="vendas" color="#22C55E" />
                  <MetricToggle label="ROAS" id="roas" color="#F59E0B" />
                  <MetricToggle label="Conversões" id="conversoes" color="#3B82F6" />
                  <MetricToggle label="Alcance" id="alcance" color="#8B5CF6" />
                  <MetricToggle label="Leads" id="leads" color="#22C55E" />
                </div>
                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Clique nas métricas acima para alterar a visualização</div>
              </>
            ) : (
              <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 24, background: 'var(--bg-color)', padding: '6px 16px', borderRadius: 20 }}>
                  Valor Investido: R$ 1.727,91
                </div>
                
                {/* Visual Funnel Blocks */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
                  <div style={{ width: '80%', background: '#3B82F6', borderRadius: 8, padding: '16px 0', textAlign: 'center', color: '#fff' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>Impressões</div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>43.935</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>R$ 0,04</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '4px 0' }}>↓ 2.0% Conversão</div>
                  
                  <div style={{ width: '65%', background: '#2563EB', borderRadius: 8, padding: '16px 0', textAlign: 'center', color: '#fff' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>Cliques</div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>882</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>R$ 1,96</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '4px 0' }}>↓ 57.7% Conversão</div>

                  <div style={{ width: '50%', background: '#1D4ED8', borderRadius: 8, padding: '16px 0', textAlign: 'center', color: '#fff' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>Total de Cliques no Link</div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>509</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>R$ 3,39</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '4px 0' }}>↓ 16.9% Conversão</div>

                  <div style={{ width: '35%', background: '#1E3A8A', borderRadius: 8, padding: '16px 0', textAlign: 'center', color: '#fff' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>Resultados</div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>86</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>R$ 20,09</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: CAMPAIGN LIST */}
          <div className="card" style={{ width: 320, padding: 20, borderRadius: 12, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800 }}>Campanhas</h3>
              <Filter size={14} color="var(--text-secondary)" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mockCampaigns.map(camp => (
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
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
