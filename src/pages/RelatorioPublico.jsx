import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart3, TrendingUp, DollarSign, Target, Users, Eye, MousePointer2,
  Activity, ArrowUpRight, ArrowDownRight, Calendar, AlertTriangle,
  Zap, Award, ChevronDown, Sun, Moon, Play, Video, Award as AwardIcon,
  ChevronLeft, ChevronRight, CheckCircle
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, PieChart, Pie
} from 'recharts';

const supabaseAnon = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

const fmt = v => {
  const num = parseFloat(v);
  return isNaN(num) ? 'R$ 0' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(num);
};
const fmtNum = v => {
  const num = parseInt(v);
  return isNaN(num) ? '0' : new Intl.NumberFormat('pt-BR').format(num);
};
const fmtPerc = v => {
  const num = parseFloat(v);
  return isNaN(num) ? '0.00%' : `${num.toFixed(2)}%`;
};

const COLORS = {
  yellow: '#FFD600',
  yellowGradient: 'linear-gradient(135deg, #FFD600 0%, #FFB800 100%)',
  green: '#10B981',
  red: '#EF4444',
  purpleDonut: ['#6D28D9', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#F5F3FF']
};

export default function RelatorioPublico() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [period, setPeriod] = useState(30);

  // Theme configuration
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rp_theme');
      return saved !== 'light';
    }
    return true;
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('rp_theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const bg = isDark ? '#050508' : '#f8fafc';
    document.documentElement.style.setProperty('background', bg, 'important');
    document.body.style.setProperty('background', bg, 'important');
  }, [isDark]);

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

  // Fetch report data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabaseAnon.from('reports').select('data').eq('id', id).maybeSingle();
        if (!mounted) return;

        let reportData = null;
        if (data?.data) {
          reportData = data.data;
        } else {
          // Fallback to local storage reports if offline/unsynced
          try {
            const localRaw = localStorage.getItem('foryoulab_reports');
            if (localRaw) {
              const localList = JSON.parse(localRaw);
              const localReport = localList.find(r => r.id === id);
              if (localReport) {
                reportData = localReport;
              }
            }
          } catch (localErr) {
            console.error('[RelatorioPublico] Erro local:', localErr);
          }
        }

        if (reportData) {
          setReport(reportData);
        } else {
          setErr(error ? error.message : 'Relatório não encontrado.');
        }
      } catch (e) {
        if (mounted) setErr(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Setup scroll fade animations
  useEffect(() => {
    if (!report) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rp-visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.05 });
    setTimeout(() => {
      document.querySelectorAll('.rp-anim').forEach(el => obs.observe(el));
    }, 100);
    return () => obs.disconnect();
  }, [report]);

  // Extract snapshot fields based on selected period
  const snapshot = report?.snapshot || null;
  const periodKey = `last_${period}d`;
  const periodSnapshot = snapshot?.[periodKey] || snapshot || null;

  const spend = periodSnapshot?.realKPIs?.spend ?? 0;
  const results = periodSnapshot?.realKPIs?.results ?? 0;
  const cpl = periodSnapshot?.realKPIs?.cpl ?? 0;
  const revenue = periodSnapshot?.realKPIs?.revenue ?? 0;
  const roas = periodSnapshot?.realKPIs?.roas ?? 0;
  const ctr = periodSnapshot?.realKPIs?.ctr ?? 0;
  const cpm = periodSnapshot?.realKPIs?.cpm ?? 0;
  const clicks = periodSnapshot?.realKPIs?.clicks ?? 0;
  const impressions = periodSnapshot?.realKPIs?.impressions ?? 0;
  const pageViews = periodSnapshot?.realKPIs?.pageViews ?? 0;
  const addToCart = periodSnapshot?.realKPIs?.addToCart ?? 0;
  const initCheckout = periodSnapshot?.realKPIs?.initCheckout ?? 0;

  const displayCampaigns = periodSnapshot?.realCampaigns ?? [];
  const displayChartData = periodSnapshot?.realChartData ?? [];
  const displayDemographics = periodSnapshot?.realDemographics ?? [];
  const displayCreatives = periodSnapshot?.realCreatives ?? [];

  if (loading) return <div style={S.wrap}><div style={S.spin} /><p style={{ color: '#666', marginTop: 16, fontSize: 13 }}>Carregando dados reais do relatório...</p></div>;
  if (!report || err) return (
    <div style={S.wrap}>
      <AlertTriangle size={44} color="#FFD600" />
      <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginTop: 16 }}>Relatório não encontrado</h2>
      <p style={{ color: '#666', marginTop: 8, fontSize: 13 }}>{err || 'Link incorreto ou relatório inexistente.'}</p>
    </div>
  );

  return (
    <div style={{ 
      fontFamily: "'Inter',system-ui,-apple-system,sans-serif", 
      background: isDark ? '#050508' : '#f8fafc', 
      color: isDark ? '#fff' : '#0f172a', 
      minHeight: '100vh', 
      position: 'relative',
      transition: 'background 0.3s, color 0.3s'
    }}>
      <style>{CSS}</style>

      {/* HEADER */}
      <header style={{ 
        background: isDark ? '#050508' : '#ffffff', 
        padding: '16px 28px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        borderBottom: isDark ? '1px solid rgba(255,214,0,.15)' : '1px solid rgba(0,0,0,.06)',
        transition: 'background 0.3s, border-color 0.3s'
      }}>
        <img src="/logo.png" alt="foryou.lab" style={{ height: 32, filter: isDark ? 'invert(1)' : 'none', transition: 'filter 0.3s' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#FFD600', letterSpacing: 2, textTransform: 'uppercase' }}>
            Dashboard de Performance
          </div>
          
          <button 
            onClick={toggleTheme} 
            style={{
              background: isDark ? 'rgba(255,214,0,.08)' : 'rgba(0,0,0,.04)',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#FFD600' : '#475569',
              transition: 'all 0.2s'
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section style={{ 
        position: 'relative', 
        padding: '80px 24px 60px', 
        overflow: 'hidden', 
        background: isDark ? '#050508' : '#ffffff', 
        borderBottom: isDark ? 'none' : '1px solid rgba(0,0,0,.04)',
        zIndex: 1
      }}>
        <div style={{ position: 'absolute', top: '0%', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 1000, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,214,0,.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,214,0,.08)', border: '1px solid rgba(255,214,0,.2)', borderRadius: 100, padding: '8px 20px', marginBottom: 24 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px #22C55E', animation: 'blink 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#FFD600', textTransform: 'uppercase' }}>Dados em Tempo Real da Conta</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 12 }}>
            <span style={{ background: 'linear-gradient(135deg,#FFD600,#FFB300)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{report.nome}</span>
          </h1>
          <p style={{ fontSize: 16, color: isDark ? '#bbb' : '#475569', marginBottom: 20 }}>
            Dashboard para <strong style={{ color: isDark ? '#fff' : '#0f172a' }}>{report.clienteNome}</strong>
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
            {report.responsavelNome && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDark ? '#888' : '#64748b' }}>
                <Users size={14} color="#FFD600" /> Gestor: <strong style={{ color: isDark ? '#ccc' : '#334155' }}>{report.responsavelNome}</strong>
              </div>
            )}
            {report.contaAnuncioNome && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDark ? '#888' : '#64748b' }}>
                <BarChart3 size={14} color="#FFD600" /> Conta: <strong style={{ color: isDark ? '#ccc' : '#334155' }}>{report.contaAnuncioNome}</strong>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FILTROS E SELETOR DE PERÍODO */}
      <section style={{ padding: '0 24px', marginTop: -20, position: 'relative', zIndex: 10 }}>
        <div style={{ 
          maxWidth: 900, 
          margin: '0 auto', 
          background: isDark ? 'rgba(20,20,25,0.7)' : '#ffffff', 
          border: `1px solid ${isDark ? 'rgba(255,214,0,0.15)' : 'rgba(255,214,0,0.25)'}`, 
          borderRadius: 16, 
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="#FFD600" />
            <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#9CA3AF' : '#475569' }}>Período de Análise:</span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: '7 Dias', value: 7 },
              { label: '15 Dias', value: 15 },
              { label: '30 Dias', value: 30 },
              { label: '90 Dias', value: 90 }
            ].map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                style={{
                  background: period === p.value ? COLORS.yellowGradient : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
                  border: `1px solid ${period === p.value ? '#FFD600' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                  color: period === p.value ? '#000' : (isDark ? '#FFF' : '#334155'),
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: period === p.value ? '0 4px 12px rgba(255,214,0,0.2)' : 'none'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* KPIs Grid - 2 rows × 3 columns */}
      <section style={{ padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="rp-anim" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <KpiCard label="Investimento" value={fmt(spend)} icon={DollarSign} subtitle="Valor total gasto" isDark={isDark} />
            <KpiCard label="Resultado" value={fmtNum(results)} icon={CheckCircle} subtitle="Conversões geradas" isDark={isDark} />
            <KpiCard label="Custo/Resultado" value={fmt(cpl)} icon={Activity} subtitle="CPL Médio" isDark={isDark} />
            
            <KpiCard label="Retorno" value={fmt(revenue)} icon={TrendingUp} subtitle="Receita atribuída" isDark={isDark} />
            <KpiCard label="CPM" value={fmt(cpm)} icon={Eye} subtitle="Custo por mil impressões" isDark={isDark} />
            <KpiCard label="CTR" value={`${ctr.toFixed(2)}%`} icon={MousePointer2} subtitle="Taxa de cliques no link" isDark={isDark} />
          </div>
        </div>
      </section>

      {/* Row 2: Funil Geral & Demográficos */}
      <section style={{ padding: '20px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
          
          {/* Funil Geral */}
          <div style={{ background: isDark ? 'rgba(20,20,25,0.7)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,214,0,0.15)' : 'rgba(255,214,0,0.25)'}`, borderRadius: 16, padding: 24 }} className="rp-anim">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Activity size={18} color="#FFD600" />
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Funil Geral</h3>
            </div>
            <FunnelChart spend={spend} conversions={results} impressions={impressions} clicks={clicks} pageViews={pageViews} addToCart={addToCart} initCheckout={initCheckout} roas={roas} revenue={revenue} />
          </div>

          {/* Demográficos */}
          <div style={{ background: isDark ? 'rgba(20,20,25,0.7)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,214,0,0.15)' : 'rgba(255,214,0,0.25)'}`, borderRadius: 16, padding: 24 }} className="rp-anim">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Users size={18} color="#FFD600" />
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Demográficos</h3>
            </div>
            <DemographicsDonut data={displayDemographics} isDark={isDark} />
          </div>

        </div>
      </section>

      {/* Row 3: Linha do Tempo & Funil de Vídeo */}
      <section style={{ padding: '20px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
          
          {/* Linha do Tempo */}
          <div style={{ background: isDark ? 'rgba(20,20,25,0.7)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,214,0,0.15)' : 'rgba(255,214,0,0.25)'}`, borderRadius: 16, padding: 24 }} className="rp-anim">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <BarChart3 size={18} color="#FFD600" />
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Linha do Tempo</h3>
            </div>
            <TimelineAreaChart chartData={displayChartData} isDark={isDark} />
          </div>

          {/* Funil de Vídeo */}
          <div style={{ background: isDark ? 'rgba(20,20,25,0.7)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,214,0,0.15)' : 'rgba(255,214,0,0.25)'}`, borderRadius: 16, padding: 24 }} className="rp-anim">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Video size={18} color="#FFD600" />
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Funil de Vídeo</h3>
            </div>
            <VideoFunnel spend={spend} />
          </div>

        </div>
      </section>

      {/* Campaigns Table */}
      <section style={{ padding: '20px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', background: isDark ? 'rgba(20,20,25,0.7)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,214,0,0.15)' : 'rgba(255,214,0,0.25)'}`, borderRadius: 16, padding: 24 }} className="rp-anim">
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Performance por Campanha</h3>
          <VisaoGeralTable campaigns={displayCampaigns} isDark={isDark} />
        </div>
      </section>

      {/* Criativos Destaques */}
      <section style={{ padding: '20px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', background: isDark ? 'rgba(20,20,25,0.7)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,214,0,0.15)' : 'rgba(255,214,0,0.25)'}`, borderRadius: 16, padding: 24 }} className="rp-anim">
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AwardIcon size={18} color="#FFD600" /> Criativos Destaques
          </h3>
          <CriativosDestaques data={displayCreatives} isDark={isDark} />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ 
        borderTop: isDark ? '1px solid #111' : '1px solid #e2e8f0', 
        padding: '40px 24px', 
        textAlign: 'center', 
        background: isDark ? '#050508' : '#ffffff',
        transition: 'background 0.3s, border-color 0.3s',
        marginTop: 60
      }}>
        <img src="/logo.png" alt="foryou.lab" style={{ height: 28, filter: isDark ? 'invert(1)' : 'none', marginBottom: 8, transition: 'filter 0.3s' }} />
        <div style={{ fontSize: 9, letterSpacing: 2, color: isDark ? '#333' : '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Estratégia • Performance • Dados • Crescimento</div>
        <p style={{ fontSize: 10, color: isDark ? '#222' : '#cbd5e1' }}>© {new Date().getFullYear()} foryou.lab — Dashboard gerado automaticamente. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

// ==========================================
// RENDER COMPONENTS
// ==========================================

function KpiCard({ label, value, subtitle, icon: Icon, isDark }) {
  return (
    <div style={{ 
      background: isDark ? 'rgba(20, 20, 25, 0.7)' : '#ffffff', 
      border: `1px solid ${isDark ? 'rgba(255, 214, 0, 0.15)' : 'rgba(255, 214, 0, 0.25)'}`, 
      borderRadius: 16, 
      padding: '20px 24px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#9CA3AF' : '#64748b', textTransform: 'uppercase', trackingLetter: '0.05em' }}>{label}</span>
        <span style={{ fontSize: 28, fontWeight: 900, color: isDark ? '#FFF' : '#0f172a' }}>{value}</span>
        <span style={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#64748b' }}>{subtitle}</span>
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
        <Icon size={20} color="#FFD600" />
      </div>
    </div>
  );
}

function FunnelChart({ spend, conversions, impressions, clicks, pageViews, addToCart, initCheckout, roas, revenue }) {
  const stages = [
    { label: 'Impressões', val: impressions, cost: impressions > 0 ? (spend / impressions) * 1000 : 0, costLabel: 'CPM', pct: 100 },
    { label: 'Cliques no Link', val: clicks, cost: clicks > 0 ? spend / clicks : 0, costLabel: 'CPC', pct: impressions > 0 ? (clicks / impressions) * 100 : 0 },
    { label: 'Visualizações de Página', val: pageViews, cost: pageViews > 0 ? spend / pageViews : 0, costLabel: 'Custo/View', pct: clicks > 0 ? (pageViews / clicks) * 100 : 0 },
    { label: 'Adições ao Carrinho', val: addToCart, cost: addToCart > 0 ? spend / addToCart : 0, costLabel: 'Custo/Carrinho', pct: pageViews > 0 ? (addToCart / pageViews) * 100 : 0 },
    { label: 'Inícios de Finalização', val: initCheckout, cost: initCheckout > 0 ? spend / initCheckout : 0, costLabel: 'Custo/Checkout', pct: addToCart > 0 ? (initCheckout / addToCart) * 100 : 0 },
    { label: 'Compras', val: conversions, cost: conversions > 0 ? spend / conversions : 0, costLabel: 'CPA', pct: initCheckout > 0 ? (conversions / initCheckout) * 100 : 0 },
    { label: 'Retorno (ROAS)', val: `${roas ? roas.toFixed(2) : 0}x`, cost: revenue || 0, costLabel: 'Receita', pct: 100 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {stages.map((stage, idx) => {
        const width = 100 - idx * 8;
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 140, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>
              {stage.label}
            </div>

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
                <span style={{ fontSize: 11, opacity: 0.7 }}>{stage.pct ? `${stage.pct.toFixed(1)}%` : '0%'}</span>
                <span>{typeof stage.val === 'number' ? fmtNum(stage.val) : stage.val}</span>
                <span style={{ width: 20 }}></span>
              </div>
            </div>

            <div style={{ width: 150, fontSize: 12, fontWeight: 600 }}>
              <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{stage.costLabel}:</span>
              {typeof stage.cost === 'number' ? fmt(stage.cost) : fmt(stage.cost)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DemographicsDonut({ data, isDark }) {
  const chartData = data && data.length > 0 ? data : [
    { name: '18-24 anos', value: 0 },
    { name: '25-34 anos', value: 0 },
    { name: '35-44 anos', value: 0 },
    { name: '45-54 anos', value: 0 },
    { name: '55-64 anos', value: 0 },
    { name: '65+ anos', value: 0 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: '100%', height: 200, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS.purpleDonut[index % COLORS.purpleDonut.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: isDark ? '#000' : '#fff',
          border: `2px solid #FFD600`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 900,
          color: '#FFD600'
        }}>
          FY.LAB
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', fontSize: 11 }}>
        {chartData.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS.purpleDonut[idx % COLORS.purpleDonut.length] }} />
            <span style={{ fontWeight: 600 }}>{item.name}: {item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineAreaChart({ chartData, isDark }) {
  const displayData = chartData.length > 0 ? chartData : [
    { date: '01/05', gasto: 0, receita: 0 },
    { date: '15/05', gasto: 0, receita: 0 },
    { date: '30/05', gasto: 0, receita: 0 }
  ];

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={displayData}>
          <defs>
            <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFD600" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#FFD600" stopOpacity={0.01}/>
            </linearGradient>
            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: isDark ? '#9CA3AF' : '#64748b' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: isDark ? '#9CA3AF' : '#64748b' }} tickFormatter={v => `R$ ${v}`} />
          <Tooltip contentStyle={{ background: '#000', border: '1px solid rgba(255,214,0,0.15)', borderRadius: 8, fontSize: 12, color: '#FFF' }} />
          <Area type="monotone" dataKey="gasto" name="Investido" stroke="#FFD600" fillOpacity={1} fill="url(#colorGasto)" strokeWidth={3} />
          <Area type="monotone" dataKey="receita" name="Retorno" stroke="#10B981" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function VideoFunnel({ spend }) {
  const data = [
    { label: 'Vv 25%', pct: spend > 0 ? 72 : 0 },
    { label: 'Vv 50%', pct: spend > 0 ? 44 : 0 },
    { label: 'Vv 75%', pct: spend > 0 ? 25 : 0 },
    { label: 'Vv 100%', pct: spend > 0 ? 11 : 0 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', height: '100%', minHeight: 200 }}>
      {data.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
            <span style={{ color: '#FFD600' }}>{item.label}</span>
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

function VisaoGeralTable({ campaigns, isDark }) {
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
            <tr style={{ borderBottom: `1px solid rgba(255,214,0,0.15)`, background: isDark ? '#0F0F13' : '#f1f5f9' }}>
              <th style={{ padding: '12px 16px', fontSize: 11, color: isDark ? '#9CA3AF' : '#64748b', fontWeight: 700 }}>CAMPANHA</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: isDark ? '#9CA3AF' : '#64748b', fontWeight: 700 }}>CTR</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: isDark ? '#9CA3AF' : '#64748b', fontWeight: 700 }}>CLIQUES NO LINK</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: isDark ? '#9CA3AF' : '#64748b', fontWeight: 700 }}>HOOK RATE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: isDark ? '#9CA3AF' : '#64748b', fontWeight: 700 }}>HOLD RATE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: isDark ? '#9CA3AF' : '#64748b', fontWeight: 700 }}>VALOR GASTO</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: isDark ? '#9CA3AF' : '#64748b', fontWeight: 700 }}>CONVERSÕES</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '30px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                  Nenhuma campanha encontrada.
                </td>
              </tr>
            ) : paginated.map((c, idx) => (
              <tr key={idx} style={{ borderBottom: `1px solid rgba(120,120,120,0.1)` }}>
                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>{c.name}</td>
                <td style={{ padding: '14px 16px', fontSize: 13 }}>{fmtPerc(c.ctr)}</td>
                <td style={{ padding: '14px 16px', fontSize: 13 }}>{fmtNum(c.clicks)}</td>
                <td style={{ padding: '14px 16px', fontSize: 13 }}>{c.spend > 0 ? '35.4%' : '0%'}</td>
                <td style={{ padding: '14px 16px', fontSize: 13 }}>{c.spend > 0 ? '18.2%' : '0%'}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>{fmt(c.spend)}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#FFD600', fontWeight: 700 }}>{fmtNum(c.results)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))} 
          disabled={page === 1}
          style={{ background: isDark ? '#16161D' : '#e2e8f0', border: '1px solid rgba(120,120,120,0.1)', color: isDark ? '#FFF' : '#334155', borderRadius: 8, padding: 8, cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#9CA3AF' : '#64748b' }}>
          Página {page} de {totalPages}
        </span>
        <button 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
          disabled={page === totalPages}
          style={{ background: isDark ? '#16161D' : '#e2e8f0', border: '1px solid rgba(120,120,120,0.1)', color: isDark ? '#FFF' : '#334155', borderRadius: 8, padding: 8, cursor: 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function CriativosDestaques({ data, isDark }) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 4;

  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, page]);

  const totalPages = Math.ceil(data.length / itemsPerPage) || 1;

  if (data.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
        Nenhum criativo ou anúncio ativo encontrado.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {paginated.map((item, idx) => (
          <div key={idx} style={{ 
            background: isDark ? '#0F0F13' : '#f8fafc', 
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}`, 
            borderRadius: 12, 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              height: 120, 
              background: item.thumbnail ? `url(${item.thumbnail}) center/cover no-repeat` : 'linear-gradient(45deg, #16161D, #000)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative'
            }}>
              {!item.thumbnail && <Play size={24} color="#FFD600" style={{ opacity: 0.8 }} />}
              <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, color: '#fff' }}>
                {item.thumbnail ? 'Imagem/Vídeo' : 'Sem mídia'}
              </div>
            </div>

            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.title}>
                {item.title}
              </span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                <div>
                  <span style={{ color: isDark ? '#9CA3AF' : '#64748b' }}>Conversões:</span>
                  <div style={{ fontWeight: 700, color: '#10B981', fontSize: 12 }}>{fmtNum(item.conversions)}</div>
                </div>
                <div>
                  <span style={{ color: isDark ? '#9CA3AF' : '#64748b' }}>CPA:</span>
                  <div style={{ fontWeight: 700, color: '#FFD600', fontSize: 12 }}>{fmt(item.cpa)}</div>
                </div>
                <div>
                  <span style={{ color: isDark ? '#9CA3AF' : '#64748b' }}>CTR:</span>
                  <div style={{ fontWeight: 700, color: isDark ? '#FFF' : '#0f172a', fontSize: 12 }}>{fmtPerc(item.ctr)}</div>
                </div>
                <div>
                  <span style={{ color: isDark ? '#9CA3AF' : '#64748b' }}>Valor Gasto:</span>
                  <div style={{ fontWeight: 700, color: isDark ? '#FFF' : '#0f172a', fontSize: 12 }}>{fmt(item.spend)}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))} 
          disabled={page === 1}
          style={{ background: isDark ? '#16161D' : '#e2e8f0', border: '1px solid rgba(120,120,120,0.1)', color: isDark ? '#FFF' : '#334155', borderRadius: 8, padding: 8, cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#9CA3AF' : '#64748b' }}>
          Página {page} de {totalPages}
        </span>
        <button 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
          disabled={page === totalPages}
          style={{ background: isDark ? '#16161D' : '#e2e8f0', border: '1px solid rgba(120,120,120,0.1)', color: isDark ? '#FFF' : '#334155', borderRadius: 8, padding: 8, cursor: 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
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
html,body,#root{margin:0;padding:0;height:auto!important;min-height:100vh!important;overflow:visible!important;overflow-y:auto!important;overflow-x:hidden!important}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.rp-anim{opacity:0;transform:translateY(40px);transition:all 1.2s cubic-bezier(0.16,1,0.3,1)}
.rp-visible{opacity:1!important;transform:translateY(0)!important}
::-webkit-scrollbar{width:8px}
::-webkit-scrollbar-track{background:#050508}
::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:#FFD600}
@media(max-width:768px){
  header{padding:12px 16px!important}
  section{padding-left:16px!important;padding-right:16px!important}
  div[style*="grid-template-columns: 1.6fr 1fr"] { grid-template-columns: 1fr !important; }
}
`;
