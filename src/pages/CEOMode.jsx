import { useMemo } from 'react';
import { useApp } from '../data/store';
import { Crown, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Users, Target, Star, UserX, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v);

export default function CEOMode() {
  const { clients, leads, financials } = useApp();
  const activeClients = clients.filter(c => c.status === 'ativo');
  const mrr = activeClients.reduce((s, c) => s + (Number(c.mrr) || 0), 0);
  const churn = clients.filter(c => c.status === 'cancelado').length;
  const avgNps = activeClients.filter(c => c.nps).reduce((s, c, _, a) => s + Number(c.nps) / a.length, 0);
  const ltv = mrr * 12;
  const cac = 850;
  const totalLeadsAndClients = clients.length + leads.length;
  const convRate = totalLeadsAndClients > 0 ? Math.round((clients.length / totalLeadsAndClients) * 100) : 0;

  // Real financial calculations
  const totalReceitasReal = (financials || []).filter(f => f.tipo === 'receita').reduce((s, f) => s + (Number(f.valor) || 0), 0);
  const totalDespesasReal = (financials || []).filter(f => f.tipo === 'despesa').reduce((s, f) => s + (Number(f.valor) || 0), 0);
  const lucroReal = totalReceitasReal - totalDespesasReal;

  const kpis = [
    { label: 'MRR Total', value: fmt(mrr), icon: DollarSign, color: '#FFD600', bg: 'rgba(255,214,0,.12)', change: '+12%', up: true },
    { label: 'Churn (mês)', value: churn, icon: UserX, color: '#EF4444', bg: 'rgba(239,68,68,.12)', change: '1 cliente', up: false },
    { label: 'LTV Médio', value: fmt(ltv), icon: TrendingUp, color: '#22C55E', bg: 'rgba(34,197,94,.12)', change: '+8%', up: true },
    { label: 'CAC', value: fmt(cac), icon: Target, color: '#3B82F6', bg: 'rgba(59,130,246,.12)', change: '-5%', up: true },
    { label: 'Conversão Funil', value: `${convRate}%`, icon: BarChart3, color: '#8B5CF6', bg: 'rgba(139,92,246,.12)', change: '+3%', up: true },
    { label: 'NPS Geral', value: avgNps > 0 ? avgNps.toFixed(1) : 'N/A', icon: Star, color: '#F59E0B', bg: 'rgba(245,158,11,.12)', change: 'Bom', up: true },
  ];

  const clientRank = [...activeClients].sort((a, b) => (Number(b.mrr) || 0) - (Number(a.mrr) || 0));
  
  const growthData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString('pt-BR', { month: 'short' });
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const mrrAtMonth = activeClients.reduce((sum, c) => {
        const joined = c.dataEntrada ? new Date(c.dataEntrada) : new Date(); // If no date, assume today
        if (joined <= endOfMonth) return sum + (Number(c.mrr) || 0);
        return sum;
      }, 0);
      months.push({ mes: monthStr.charAt(0).toUpperCase() + monthStr.slice(1), mrr: mrrAtMonth });
    }
    return months;
  }, [activeClients]);

  const projection = useMemo(() => {
    const currentMRR = mrr;
    const pipelineValue = leads.filter(l => l.status !== 'fechado' && l.status !== 'perdido').reduce((s, l) => s + (l.valor || 0), 0);
    const expectedCloseRate = 0.2; // 20% estimated close rate
    const expectedNewMRR = pipelineValue * expectedCloseRate;
    
    const now = new Date();
    const nextMonths = [1, 2, 3].map(i => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return d.toLocaleDateString('pt-BR', { month: 'short' });
    });

    return [
      { mes: nextMonths[0], valor: Math.round(currentMRR + expectedNewMRR * 0.3) },
      { mes: nextMonths[1], valor: Math.round(currentMRR + expectedNewMRR * 0.6) },
      { mes: nextMonths[2], valor: Math.round(currentMRR + expectedNewMRR) },
    ];
  }, [mrr, leads]);

  return (
    <>
      <div className="page-header" style={{ background: 'transparent', borderBottom: 'none' }}>
        <div>
          <h2 style={{ color: '#FFD600', display: 'flex', alignItems: 'center', gap: 8 }}><Crown size={22} /> Modo CEO</h2>
          <div className="breadcrumb">Visão executiva da agência</div>
        </div>
      </div>
      <div className="page-body">
        <div className="kpi-grid">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
               <div key={i} className="card kpi-card" style={{ animation: `slideUp .4s ease ${i * 60}ms both` }}>
                 <div className="kpi-icon" style={{ background: kpi.bg }}><Icon size={20} color={kpi.color} /></div>
                 <div className="kpi-value">{kpi.value}</div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span className="kpi-label">{kpi.label}</span>
                   <span className={`kpi-change ${kpi.up ? 'up' : 'down'}`}>
                     {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{kpi.change}
                   </span>
                 </div>
               </div>
            );
          })}
        </div>

        <div className="charts-grid">
          <div className="card chart-card">
            <h4>📈 Crescimento da Agência (12 meses)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="mes" fontSize={12} stroke="var(--text-secondary)" />
                <YAxis fontSize={12} tickFormatter={v => `${(v/1000).toFixed(1)}k`} stroke="var(--text-secondary)" />
                <Tooltip 
                  formatter={v => fmt(v)} 
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  itemStyle={{ color: '#FFD600', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="mrr" stroke="#FFD600" strokeWidth={3} dot={{ fill: '#FFD600', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card chart-card">
            <h4>📊 Projeção Próximos 3 Meses</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projection}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="mes" fontSize={12} stroke="var(--text-secondary)" />
                <YAxis fontSize={12} tickFormatter={v => `${(v/1000).toFixed(1)}k`} stroke="var(--text-secondary)" />
                <Tooltip 
                  formatter={v => fmt(v)} 
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  itemStyle={{ color: '#22C55E', fontWeight: 'bold' }}
                  cursor={{ fill: 'var(--gray-bg)' }}
                />
                <Bar dataKey="valor" fill="#22C55E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid-2">
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🏆 Ranking de Clientes por Valor</h4>
            {clientRank.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Nenhum cliente ativo no momento.</div>
            ) : clientRank.slice(0, 5).map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: i < 3 ? '#FFD600' : 'var(--gray-bg)', color: i < 3 ? '#0A0A0A' : 'var(--text-secondary)' }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.empresa}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.plano || 'Assinatura Padrão'}</div>
                </div>
                <span style={{ fontWeight: 700, color: '#22C55E' }}>{fmt(Number(c.mrr) || 0)}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📋 Métricas Chave</h4>
            {[
              ['Faturamento Real (Entradas)', fmt(totalReceitasReal)],
              ['Despesas Reais (Saídas)', fmt(totalDespesasReal)],
              ['Lucro Operacional Real', fmt(lucroReal)],
              ['Total Clientes', clients.length],
              ['Clientes Ativos', activeClients.length],
              ['Receita Anual Projetada', fmt(mrr * 12)],
              ['Ticket Médio', fmt(mrr / Math.max(activeClients.length, 1))],
              ['Leads no Pipeline', leads.filter(l => l.status !== 'fechado' && l.status !== 'perdido').length],
              ['Taxa de Churn', `${clients.length > 0 ? Math.round((churn / clients.length) * 100) : 0}%`],
              ['Payback CAC', `${mrr > 0 ? Math.round(cac / (mrr / Math.max(activeClients.length, 1))) : 0} meses`],
            ].map(([label, value], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--card-border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
