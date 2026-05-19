import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart3, TrendingUp, DollarSign, Target, Users, Eye, MousePointer2,
  Activity, ArrowUpRight, ArrowDownRight, Calendar, AlertTriangle,
  Zap, Award, ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell
} from 'recharts';

const supabaseAnon = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v || 0);
const fmtNum = v => new Intl.NumberFormat('pt-BR').format(v || 0);

// Generate demo data based on period
function generateMetrics(seed, days) {
  const s = (seed || '').split('').reduce((a, c) => a + c.charCodeAt(0), 1);
  const base = (s % 50 + 20) * 100;
  const multi = days / 30;
  return {
    spend: Math.round(base * 4.5 * multi),
    revenue: Math.round(base * 14 * multi),
    roas: 3.1 + (s % 20) / 10,
    cpl: 8.5 + (s % 15) / 3,
    ctr: 1.2 + (s % 30) / 20,
    cpc: 0.8 + (s % 10) / 10,
    impressions: Math.round(base * 85 * multi),
    clicks: Math.round(base * 4 * multi),
    conversions: Math.round(base * 0.5 * multi),
    frequency: 1.8 + (s % 10) / 15,
  };
}

function generateChartData(days) {
  return Array.from({ length: Math.min(days, 30) }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    const gasto = 200 + Math.random() * 400;
    return {
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      gasto: Math.round(gasto),
      receita: Math.round(gasto * (2.5 + Math.random() * 2)),
    };
  });
}

function generateCampaigns(seed) {
  const names = [
    'Delivery WhatsApp — Conversões', 'Reservas Google Maps', 'Engajamento Instagram',
    'Remarketing — Clientes Inativos', 'Campanha de Lançamento — Novo Cardápio',
  ];
  const s = (seed || '').split('').reduce((a, c) => a + c.charCodeAt(0), 1);
  return names.map((name, i) => ({
    name, status: i < 3 ? 'Ativo' : 'Pausado',
    spend: Math.round((800 + (s + i) * 123 % 3000)),
    roas: (2 + ((s + i) * 7 % 30) / 10).toFixed(2),
    cpl: (5 + ((s + i) * 3 % 20)).toFixed(2),
    ctr: (0.8 + ((s + i) * 11 % 25) / 10).toFixed(2),
    conversions: Math.round(20 + (s + i) * 17 % 200),
  }));
}

const funnelData = [
  { label: 'Impressões', value: 245000, width: 100 },
  { label: 'Cliques', value: 12300, width: 80 },
  { label: 'Leads', value: 1450, width: 60 },
  { label: 'Oportunidades', value: 412, width: 40 },
  { label: 'Clientes', value: 236, width: 24 },
];

const PERIODS = [
  { value: 7, label: '7 dias' }, { value: 15, label: '15 dias' },
  { value: 30, label: '30 dias' }, { value: 60, label: '60 dias' },
  { value: 90, label: '90 dias' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(5,5,8,0.95)', border: '1px solid rgba(255,214,0,0.2)', padding: '12px', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <p style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color || '#FFD600', marginBottom: 2 }}>{p.name}: {fmt(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RelatorioPublico() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [period, setPeriod] = useState(30);
  const [comparison, setComparison] = useState('mes');

  // Override scroll
  useEffect(() => {
    const origHtml = document.documentElement.style.overflow;
    const origBody = document.body.style.overflow;
    const rootEl = document.getElementById('root');
    const origRoot = rootEl ? rootEl.style.overflow : '';

    document.documentElement.style.setProperty('overflow', 'visible', 'important');
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
    document.documentElement.style.setProperty('height', 'auto', 'important');
    document.body.style.setProperty('overflow', 'visible', 'important');
    document.body.style.setProperty('overflow-y', 'auto', 'important');
    document.body.style.setProperty('height', 'auto', 'important');
    if (rootEl) {
      rootEl.style.setProperty('overflow', 'visible', 'important');
      rootEl.style.setProperty('height', 'auto', 'important');
    }
    return () => {
      document.documentElement.style.overflow = origHtml;
      document.body.style.overflow = origBody;
      if (rootEl) rootEl.style.overflow = origRoot;
    };
  }, []);

  // Fetch report
  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => { if (mounted && loading) { setErr('Tempo limite excedido.'); setLoading(false); } }, 8000);
    (async () => {
      try {
        const { data, error } = await supabaseAnon.from('reports').select('data').eq('id', id).single();
        if (!mounted) return;
        if (error) { setErr(error.message); return; }
        if (data?.data) setReport(data.data);
        else setErr('Relatório não encontrado.');
      } catch (e) { if (mounted) setErr(e.message); }
      finally { clearTimeout(timeout); if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; clearTimeout(timeout); };
  }, [id]);

  // Scroll animations
  useEffect(() => {
    if (!report) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rp-visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.05 });
    setTimeout(() => {
      document.querySelectorAll('.rp-anim').forEach(el => obs.observe(el));
    }, 100);
    return () => obs.disconnect();
  }, [report, period]);

  if (loading) return <div style={S.wrap}><div style={S.spin} /><p style={{ color: '#666', marginTop: 16, fontSize: 13 }}>Carregando dashboard...</p></div>;
  if (!report || err) return (
    <div style={S.wrap}>
      <AlertTriangle size={44} color="#FFD600" />
      <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginTop: 16 }}>Relatório não encontrado</h2>
      <p style={{ color: '#666', marginTop: 8, fontSize: 13 }}>{err || 'Link incorreto ou relatório inexistente.'}</p>
    </div>
  );

  const metrics = generateMetrics(id, period);
  const prevMetrics = generateMetrics(id + 'prev', period);
  const chartData = generateChartData(period);
  const campaigns = generateCampaigns(id);

  const calcVar = (curr, prev) => {
    if (!prev) return { pct: 0, up: true };
    const pct = ((curr - prev) / prev * 100);
    return { pct: Math.abs(pct).toFixed(1), up: pct >= 0 };
  };

  const kpiCards = [
    { label: 'INVESTIMENTO TOTAL', value: fmt(metrics.spend), var: calcVar(metrics.spend, prevMetrics.spend), icon: DollarSign, color: '#EF4444', invertColor: true },
    { label: 'RECEITA ATRIBUÍDA', value: fmt(metrics.revenue), var: calcVar(metrics.revenue, prevMetrics.revenue), icon: TrendingUp, color: '#22C55E' },
    { label: 'ROAS', value: `${metrics.roas.toFixed(2)}x`, var: calcVar(metrics.roas, prevMetrics.roas), icon: Award, color: '#FFD600' },
    { label: 'CPL MÉDIO', value: fmt(metrics.cpl), var: calcVar(metrics.cpl, prevMetrics.cpl), icon: Target, color: '#3B82F6', invertColor: true },
    { label: 'CTR', value: `${metrics.ctr.toFixed(2)}%`, var: calcVar(metrics.ctr, prevMetrics.ctr), icon: MousePointer2, color: '#8B5CF6' },
    { label: 'CONVERSÕES', value: fmtNum(metrics.conversions), var: calcVar(metrics.conversions, prevMetrics.conversions), icon: Zap, color: '#22C55E' },
  ];

  return (
    <div style={{ fontFamily: "'Inter',system-ui,-apple-system,sans-serif", background: '#050508', color: '#fff', minHeight: '100vh', position: 'relative' }}>
      <style>{CSS}</style>

      {/* HEADER */}
      <header style={{ background: '#050508', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,214,0,.1)' }}>
        <img src="/logo.png" alt="foryou.lab" style={{ height: 32, filter: 'invert(1)' }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: '#FFD600', letterSpacing: 2, textTransform: 'uppercase' }}>Dashboard de Performance</div>
      </header>

      {/* HERO */}
      <section style={{ position: 'relative', padding: '80px 24px 60px', overflow: 'hidden', background: '#050508', zIndex: 1 }}>
        <div style={{ position: 'absolute', top: '0%', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 1000, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,214,0,.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,214,0,.08)', border: '1px solid rgba(255,214,0,.2)', borderRadius: 100, padding: '8px 20px', marginBottom: 24 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px #22C55E', animation: 'blink 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#FFD600', textTransform: 'uppercase' }}>Link permanente — dados sempre atualizados</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 12 }}>
            <span style={{ background: 'linear-gradient(135deg,#FFD600,#FFB300)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{report.nome}</span>
          </h1>
          <p style={{ fontSize: 16, color: '#bbb', marginBottom: 20 }}>
            Dashboard de performance para <strong style={{ color: '#fff' }}>{report.clienteNome}</strong>
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
            {report.responsavelNome && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888' }}>
                <Users size={14} color="#FFD600" /> Gestor: <strong style={{ color: '#ccc' }}>{report.responsavelNome}</strong>
              </div>
            )}
            {report.contaAnuncioNome && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888' }}>
                <BarChart3 size={14} color="#FFD600" /> Conta: <strong style={{ color: '#ccc' }}>{report.contaAnuncioNome}</strong>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section style={{ padding: '40px 24px', background: '#FFD600', color: '#0A0A0D', position: 'relative', zIndex: 1 }}>
        <div className="rp-anim" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8, color: '#0A0A0D' }}>Personalize sua visualização</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24, color: '#0A0A0D' }}>Filtros Interativos</h2>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: '#333' }}>📅 Período</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {PERIODS.map(p => (
                  <button key={p.value} onClick={() => setPeriod(p.value)} style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    background: period === p.value ? '#0A0A0D' : 'rgba(0,0,0,.08)',
                    color: period === p.value ? '#FFD600' : '#333',
                    transition: 'all .2s',
                  }}>{p.label}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: '#333' }}>📊 Comparação</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['semana', 'vs. Semana'], ['mes', 'vs. Mês']].map(([v, l]) => (
                  <button key={v} onClick={() => setComparison(v)} style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    background: comparison === v ? '#0A0A0D' : 'rgba(0,0,0,.08)',
                    color: comparison === v ? '#FFD600' : '#333',
                    transition: 'all .2s',
                  }}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section style={{ padding: '60px 24px', background: '#050508', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="rp-anim" style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#FFD600', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Performance</div>
            <h2 style={{ fontSize: 28, fontWeight: 800 }}>Métricas do Período</h2>
            <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Últimos {period} dias — {comparison === 'semana' ? 'comparado com semana anterior' : 'comparado com mês anterior'}</p>
          </div>

          <div className="rp-anim" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {kpiCards.map(kpi => {
              const Icon = kpi.icon;
              const isUp = kpi.invertColor ? !kpi.var.up : kpi.var.up;
              return (
                <div key={kpi.label} className="rp-glass" style={{
                  padding: 22, borderRadius: 16, position: 'relative', overflow: 'hidden',
                  background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,214,0,0.1)', transition: 'all .3s',
                }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, background: `${kpi.color}10`, borderRadius: '50%' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 1 }}>{kpi.label}</div>
                    <Icon size={16} color={kpi.color} />
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6 }}>{kpi.value}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: isUp ? '#22C55E' : '#EF4444' }}>
                    {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {kpi.var.pct}%
                    <span style={{ color: '#555', fontWeight: 400, marginLeft: 4 }}>vs. período anterior</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CHARTS */}
      <section style={{ padding: '60px 24px', background: '#0A0A0D', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="rp-anim" style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#FFD600', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Evolução</div>
            <h2 style={{ fontSize: 28, fontWeight: 800 }}>Investimento vs Receita</h2>
          </div>

          <div className="rp-anim rp-glass" style={{ padding: 28, borderRadius: 20, background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,214,0,0.1)' }}>
            <div style={{ height: 320, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cGasto" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FFD600" stopOpacity={0.4} /><stop offset="95%" stopColor="#FFD600" stopOpacity={0} /></linearGradient>
                    <linearGradient id="cReceita" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} /><stop offset="95%" stopColor="#22C55E" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="#666" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="gasto" name="Investimento" stroke="#FFD600" strokeWidth={3} fillOpacity={1} fill="url(#cGasto)" animationDuration={2000} />
                  <Area type="monotone" dataKey="receita" name="Receita" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#cReceita)" animationDuration={2500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFD600', boxShadow: '0 0 10px #FFD600' }} /><span style={{ fontSize: 11, color: '#eee', fontWeight: 600 }}>Investimento</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px #22C55E' }} /><span style={{ fontSize: 11, color: '#eee', fontWeight: 600 }}>Receita</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* FUNNEL */}
      <section style={{ padding: '60px 24px', background: '#FFD600', color: '#0A0A0D', position: 'relative', zIndex: 1 }}>
        <div className="rp-anim" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6, color: '#0A0A0D' }}>Jornada do Cliente</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 32, color: '#0A0A0D' }}>Funil de Conversão</h2>

          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              {funnelData.map((level, i) => (
                <div key={level.label} style={{
                  width: `${level.width}%`, minWidth: 80, padding: '12px 16px', textAlign: 'center',
                  background: `linear-gradient(135deg, ${['#0A0A0D', '#1a1a20', '#252530', '#333340', '#444455'][i]}, ${['#1a1a20', '#252530', '#333340', '#444455', '#555566'][i]})`,
                  borderRadius: 10, color: '#fff', transition: 'all .3s',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{fmtNum(level.value)}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#FFD600', letterSpacing: 1, marginTop: 2 }}>{level.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              {funnelData.map((level, i) => {
                if (i === 0) return null;
                const prev = funnelData[i - 1];
                const rate = ((level.value / prev.value) * 100).toFixed(1);
                return (
                  <div key={level.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,.08)', fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>{prev.label} → {level.label}</span>
                    <span style={{ fontWeight: 800, color: rate > 10 ? '#0A0A0D' : '#EF4444' }}>{rate}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CAMPAIGN TABLE */}
      <section style={{ padding: '60px 24px', background: '#050508', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="rp-anim" style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#FFD600', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Detalhamento</div>
            <h2 style={{ fontSize: 28, fontWeight: 800 }}>Performance por Campanha</h2>
          </div>

          <div className="rp-anim rp-glass" style={{ borderRadius: 16, overflow: 'hidden', background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,214,0,0.1)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.3)' }}>
                    {['CAMPANHA', 'STATUS', 'GASTO', 'ROAS', 'CPL', 'CTR', 'CONV.'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.05)', transition: 'all .2s' }}>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                          background: c.status === 'Ativo' ? 'rgba(34,197,94,.15)' : 'rgba(107,114,128,.15)',
                          color: c.status === 'Ativo' ? '#22C55E' : '#6B7280',
                        }}>{c.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600 }}>{fmt(c.spend)}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: parseFloat(c.roas) >= 3 ? '#22C55E' : parseFloat(c.roas) >= 2 ? '#FFD600' : '#EF4444' }}>{c.roas}x</td>
                      <td style={{ padding: '14px 16px', fontSize: 13 }}>R$ {c.cpl}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13 }}>{c.ctr}%</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>{c.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FATURAMENTO */}
      <section style={{ padding: '80px 24px', background: '#0A0A0D', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle,rgba(255,214,0,.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div className="rp-anim" style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#FFD600', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Resultado</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>Faturamento Atribuído</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="rp-glass" style={{ padding: 28, borderRadius: 16, textAlign: 'center', background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,214,0,0.15)' }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Faturamento do Período</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#FFD600', textShadow: '0 0 20px rgba(255,214,0,0.3)' }}>{fmt(metrics.revenue)}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#22C55E', marginTop: 8 }}>
                <ArrowUpRight size={16} /> +{calcVar(metrics.revenue, prevMetrics.revenue).pct}% vs. anterior
              </div>
            </div>
            <div className="rp-glass" style={{ padding: 28, borderRadius: 16, textAlign: 'center', background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,214,0,0.1)' }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Ticket Médio</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{fmt(Math.round(metrics.revenue / (metrics.conversions || 1)))}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>por conversão</div>
            </div>
            <div className="rp-glass" style={{ padding: 28, borderRadius: 16, textAlign: 'center', background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,214,0,0.1)' }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Retorno sobre Investimento</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: metrics.roas >= 3 ? '#22C55E' : '#FFD600' }}>{metrics.roas.toFixed(1)}x</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>ROAS geral</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #111', padding: '40px 24px', textAlign: 'center', background: '#050508' }}>
        <img src="/logo.png" alt="foryou.lab" style={{ height: 28, filter: 'invert(1)', marginBottom: 8 }} />
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#333', textTransform: 'uppercase', marginBottom: 8 }}>Estratégia • Performance • Dados • Crescimento</div>
        <p style={{ fontSize: 10, color: '#222' }}>© {new Date().getFullYear()} foryou.lab — Dashboard gerado automaticamente. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

const S = {
  wrap: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050508' },
  spin: { width: 40, height: 40, border: '3px solid #1a1a1a', borderTopColor: '#FFD600', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0}
html,body,#root{margin:0;padding:0;background:#050508;height:auto!important;min-height:100vh!important;overflow:visible!important;overflow-y:auto!important;overflow-x:hidden!important}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes float{0%{transform:translateY(0)}50%{transform:translateY(-10px)}100%{transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-1000px 0}100%{background-position:1000px 0}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 20px rgba(255,214,0,.04)}50%{box-shadow:0 0 40px rgba(255,214,0,.12)}}
.rp-anim{opacity:0;transform:translateY(40px);transition:all 1.2s cubic-bezier(0.16,1,0.3,1)}
.rp-visible{opacity:1!important;transform:translateY(0)!important}
.rp-glass{transition:all .3s ease}
.rp-glass:hover{border-color:rgba(255,214,0,.25)!important;transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
::-webkit-scrollbar{width:8px}
::-webkit-scrollbar-track{background:#050508}
::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:#FFD600}
@media(max-width:768px){
  header{padding:12px 16px!important}
  section{padding-left:16px!important;padding-right:16px!important}
  .rp-anim>div[style*="grid-template-columns: repeat(3"]{grid-template-columns:1fr!important}
}
`;
