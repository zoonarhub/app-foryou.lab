import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check, Clock, AlertTriangle, ChevronRight, ShieldCheck, Mail, Star, TrendingUp, Target, Zap, BarChart2, Activity } from 'lucide-react';

const fmt = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(v);
const AGENCY_WHATSAPP = "5511999999999";
const AGENCY_EMAIL = "contato@foryou.lab";

export default function PropostaPublica() {
  const { id } = useParams();
  const [proposta, setProposta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('proposals').select('data').eq('id', id).single();
        if (data?.data) {
          setProposta(data.data);
          if (data.data.status === 'enviada') {
            const updated = { ...data.data, status: 'visualizada', visualizadaEm: new Date().toISOString() };
            await supabase.from('proposals').update({ data: updated }).eq('id', id);
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  const [countdown, setCountdown] = useState(null);
  useEffect(() => {
    if (!proposta?.validade) return;
    const tick = () => {
      const diff = new Date(proposta.validade + 'T23:59:59') - new Date();
      if (diff <= 0) { setCountdown({ expired: true }); return; }
      setCountdown({ expired: false, d: Math.floor(diff/86400000), h: Math.floor((diff%86400000)/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [proposta]);

  const handleAccept = async () => {
    try {
      const updated = { ...proposta, status: 'aprovada', aprovadaEm: new Date().toISOString() };
      await supabase.from('proposals').update({ data: updated }).eq('id', id);
      setAccepted(true);
      setProposta(updated);
      if (proposta.linkPagamento) {
        setTimeout(() => { window.open(proposta.linkPagamento, '_blank'); }, 800);
      }
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0A0A0A' }}>
      <div style={{ width:40, height:40, border:'3px solid #333', borderTopColor:'#FFD600', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
    </div>
  );

  if (!proposta) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0A0A0A', color:'#fff' }}>
      <div style={{ textAlign:'center' }}>
        <AlertTriangle size={48} color="#FFD600" style={{ margin:'0 auto 16px' }} />
        <h2 style={{ fontSize:24, fontWeight:700 }}>Proposta não encontrada</h2>
        <p style={{ color:'#999', marginTop:8 }}>O link pode estar incorreto ou a proposta expirou.</p>
      </div>
    </div>
  );

  const isExpired = countdown?.expired;
  const isApproved = proposta.status === 'aprovada' || accepted;
  const nome = proposta.nomeCliente || 'você';
  const subtotal = (proposta.servicosItems || []).reduce((a, s) => a + (s.valor || 0), 0);
  const descVal = proposta.descontoTipo === 'pct' ? subtotal * (proposta.desconto / 100) : (proposta.desconto || 0);
  const diag = proposta.diagnosticoData;
  const hasPaymentLink = !!proposta.linkPagamento;

  const getScoreColor = s => s >= 70 ? '#22C55E' : s >= 40 ? '#F59E0B' : '#EF4444';
  const getScoreLabel = s => s >= 70 ? 'Saudável' : s >= 40 ? 'Requer Atenção' : 'Crítico';

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    @keyframes spin { to { transform: rotate(360deg) } }
    @keyframes fadeUp { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
    @keyframes pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.05) } }
    @keyframes countPulse { 0%,100% { opacity:1 } 50% { opacity:.7 } }
    .pp-fade { animation: fadeUp .6s ease-out both }
    .pp-fade-d1 { animation-delay:.1s } .pp-fade-d2 { animation-delay:.2s } .pp-fade-d3 { animation-delay:.3s }
    .pp-fade-d4 { animation-delay:.4s } .pp-fade-d5 { animation-delay:.5s }
    .pp-cta-btn { transition: all .2s; cursor:pointer; text-decoration:none }
    .pp-cta-btn:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(255,214,0,.3) }
    .pp-service-card { transition: all .25s }
    .pp-service-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,.08) }
    .pp-score-ring { position:relative; width:140px; height:140px }
    .pp-score-ring svg { transform:rotate(-90deg) }
    .pp-count { animation: countPulse 2s ease-in-out infinite }
    .pp-diag-bar { height:8px; border-radius:4px; background:#1a1a1a; overflow:hidden }
    .pp-diag-fill { height:100%; border-radius:4px; transition:width 1s ease-out }
  `;

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:'#fff', color:'#0A0A0A', minHeight:'100vh' }}>
      <style>{css}</style>

      {/* HEADER */}
      <header style={{ background:'#0A0A0A', padding:'20px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ fontFamily:"'Inter'", fontWeight:800, fontSize:20, color:'#fff' }}>foryou<span style={{ color:'#FFD600' }}>.lab</span></div>
        <div style={{ fontSize:12, fontWeight:600, color:'#666', letterSpacing:1.5, textTransform:'uppercase' }}>
          Proposta exclusiva para <span style={{ color:'#fff', fontWeight:700 }}>{nome}</span>
        </div>
      </header>

      {/* HERO */}
      <section className="pp-fade" style={{ background:'linear-gradient(135deg,#FFD600 0%,#FFC107 50%,#FFB300 100%)', color:'#0A0A0A', padding:'80px 20px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:-50, top:-50, width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,.15)' }} />
        <div style={{ position:'absolute', left:'10%', bottom:-30, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.08)' }} />
        <div style={{ maxWidth:900, margin:'0 auto', position:'relative', zIndex:2 }}>
          <div style={{ fontSize:12, fontWeight:800, textTransform:'uppercase', letterSpacing:3, marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ width:40, height:2, background:'#0A0A0A' }} />
            LABORATÓRIO DE CRESCIMENTO GASTRONÔMICO
          </div>
          <h1 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:900, marginBottom:20, lineHeight:1.05, letterSpacing:'-0.02em' }}>
            Estratégia que gera<br/>crescimento real.
          </h1>
          <p style={{ fontSize:18, fontWeight:500, maxWidth:600, lineHeight:1.6, opacity:.85 }}>
            Apresentamos a solução estratégica desenvolvida exclusivamente para escalar o faturamento da <strong>{nome}</strong>.
          </p>
        </div>
      </section>

      {/* COUNTDOWN */}
      {proposta.validade && (
        <section style={{ background:'#0A0A0A', color:'#fff', padding:'28px 20px', borderBottom:'1px solid #222' }}>
          <div style={{ maxWidth:900, margin:'0 auto', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {isApproved ? <Check size={24} color="#22C55E"/> : <Clock size={24} color="#FFD600"/>}
              <div>
                <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'#666', fontWeight:600 }}>Status</div>
                <div style={{ fontSize:16, fontWeight:700, color: isApproved ? '#22C55E' : isExpired ? '#EF4444' : '#fff' }}>
                  {isApproved ? 'Proposta Aprovada ✅' : isExpired ? 'Proposta Expirada' : 'Aguardando Aprovação'}
                </div>
              </div>
            </div>
            {!isApproved && !isExpired && countdown && (
              <div className="pp-count" style={{ display:'flex', gap:16 }}>
                {[['Dias',countdown.d],['Horas',countdown.h],['Min',countdown.m],['Seg',countdown.s]].map(([l,v])=>(
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:28, fontWeight:800, color:'#FFD600', lineHeight:1 }}>{String(v||0).padStart(2,'0')}</div>
                    <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, color:'#555', marginTop:4 }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* DIAGNÓSTICO DO NEGÓCIO */}
      {diag && (
        <section className="pp-fade pp-fade-d1" style={{ padding:'80px 20px', background:'#0A0A0A', color:'#fff' }}>
          <div style={{ maxWidth:900, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:48 }}>
              <h2 style={{ fontSize:32, fontWeight:800, lineHeight:1.1 }}>Diagnóstico de<br/><span style={{ color:'#FFD600' }}>Saúde Digital</span></h2>
              <div style={{ flex:1, height:1, background:'#222', marginLeft:24 }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:40, alignItems:'start' }}>
              {/* Score Ring */}
              <div style={{ textAlign:'center' }}>
                <div className="pp-score-ring" style={{ margin:'0 auto' }}>
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="60" fill="none" stroke="#1a1a1a" strokeWidth="10"/>
                    <circle cx="70" cy="70" r="60" fill="none" stroke={getScoreColor(diag.scoreGeral)} strokeWidth="10"
                      strokeDasharray={`${(diag.scoreGeral/100)*377} 377`} strokeLinecap="round"/>
                  </svg>
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
                    <div style={{ fontSize:36, fontWeight:900, color:getScoreColor(diag.scoreGeral) }}>{diag.scoreGeral}</div>
                    <div style={{ fontSize:11, color:'#666' }}>/ 100</div>
                  </div>
                </div>
                <div style={{ marginTop:12, fontSize:14, fontWeight:700, color:getScoreColor(diag.scoreGeral) }}>
                  {getScoreLabel(diag.scoreGeral)}
                </div>
                <div style={{ fontSize:11, color:'#555', marginTop:4 }}>Índice de Saúde Digital</div>
              </div>
              {/* Category Scores */}
              <div>
                {(diag.blocos||[]).map((b, i) => (
                  <div key={i} style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                      <span style={{ fontWeight:600 }}>{b.title}</span>
                      <span style={{ fontWeight:700, color:getScoreColor(b.score) }}>{b.score}/100 — {b.status}</span>
                    </div>
                    <div className="pp-diag-bar">
                      <div className="pp-diag-fill" style={{ width:`${b.score}%`, background:getScoreColor(b.score) }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Wins */}
            {diag.quickWins && diag.quickWins.length > 0 && (
              <div style={{ marginTop:48 }}>
                <h3 style={{ fontSize:18, fontWeight:700, marginBottom:20, color:'#FFD600' }}>⚡ Oportunidades Identificadas</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
                  {diag.quickWins.slice(0,6).map((w, i) => (
                    <div key={i} style={{ padding:16, background:'#111', border:'1px solid #222', borderRadius:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:'#FFD600', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>{w.area}</div>
                      <div style={{ fontSize:13, color:'#ccc', lineHeight:1.5 }}>{w.pergunta}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* METODOLOGIA */}
      <section className="pp-fade pp-fade-d2" style={{ padding:'80px 20px', background: diag ? '#111' : '#0A0A0A', color:'#fff' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:48 }}>
            <h2 style={{ fontSize:32, fontWeight:800, lineHeight:1.1 }}>Não é sorte.<br/>É <span style={{ color:'#FFD600' }}>método.</span></h2>
            <div style={{ flex:1, height:1, background:'#222', marginLeft:24 }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:32 }}>
            {[
              { icon:<Activity size={28}/>, title:'Estratégia', desc:'Análise profunda e planejamento focado no seu crescimento gastronômico.' },
              { icon:<BarChart2 size={28}/>, title:'Dados', desc:'Decisões baseadas em métricas reais de performance e ROI.' },
              { icon:<Target size={28}/>, title:'Foco', desc:'Ações direcionadas para atrair clientes ideais para seu restaurante.' },
              { icon:<Zap size={28}/>, title:'Resultado', desc:'Crescimento escalável, previsível e sustentável.' }
            ].map((item,i)=>(
              <div key={i}>
                <div style={{ color:'#FFD600', marginBottom:16 }}>{item.icon}</div>
                <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{item.title}</h3>
                <p style={{ fontSize:13, color:'#888', lineHeight:1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIÇOS DETALHADOS */}
      <section className="pp-fade pp-fade-d3" style={{ padding:'80px 20px', background:'#F8F8F8' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ fontSize:12, fontWeight:800, color:'#FFD600', textTransform:'uppercase', letterSpacing:2, marginBottom:8 }}>O que está incluso</div>
          <h2 style={{ fontSize:32, fontWeight:800, marginBottom:12, color:'#0A0A0A' }}>Serviços estratégicos para {nome}</h2>
          <p style={{ fontSize:15, color:'#666', marginBottom:40, maxWidth:600 }}>Cada serviço abaixo foi selecionado para endereçar os gargalos identificados e maximizar o retorno.</p>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {(proposta.servicosItems||[]).map((s,i)=>(
              <div key={i} className="pp-service-card" style={{ background:'#fff', padding:'28px 32px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #E8E8E8', borderRadius:8, gap:24 }}>
                <div style={{ display:'flex', gap:20, alignItems:'flex-start', flex:1 }}>
                  <div style={{ width:44, height:44, background:'#FFD600', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Check size={22} color="#0A0A0A" strokeWidth={3}/>
                  </div>
                  <div>
                    <h3 style={{ fontSize:17, fontWeight:700, marginBottom:4, color:'#0A0A0A' }}>{s.nome}</h3>
                    {s.descricao && <p style={{ fontSize:14, color:'#777', lineHeight:1.5 }}>{s.descricao}</p>}
                  </div>
                </div>
                <div style={{ fontSize:18, fontWeight:800, color:'#0A0A0A', whiteSpace:'nowrap' }}>{fmt(s.valor||0)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INVESTIMENTO */}
      <section className="pp-fade pp-fade-d4" style={{ padding:'80px 20px', background:'#fff' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ background:'#0A0A0A', color:'#fff', padding:'56px', borderRadius:12, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, right:0, width:250, height:250, background:'#FFD600', opacity:.05, borderRadius:'50%', transform:'translate(30%,-30%)' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:32, position:'relative', zIndex:10 }}>
              <div style={{ flex:1, minWidth:280 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#FFD600', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Investimento</div>
                <h2 style={{ fontSize:36, fontWeight:800, marginBottom:12, lineHeight:1.1 }}>{proposta.titulo || 'Proposta Estratégica'}</h2>
                <p style={{ color:'#888', fontSize:14, lineHeight:1.6 }}>Um investimento focado em gerar retorno real e previsível para a {nome}.</p>
              </div>
              <div style={{ background:'#111', padding:'28px', border:'1px solid #222', borderRadius:8, minWidth:280 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, fontSize:14, color:'#888' }}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                {(proposta.desconto||0) > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, fontSize:14, color:'#FFD600' }}><span>Desconto</span><span>- {fmt(descVal)}</span></div>
                )}
                <div style={{ borderTop:'1px solid #333', margin:'16px 0' }} />
                <div style={{ fontSize:12, color:'#666', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Total do Investimento</div>
                <div style={{ fontSize:42, fontWeight:900, color:'#fff', lineHeight:1 }}>{fmt(proposta.valorTotal||0)}</div>
                {proposta.periodo && <div style={{ color:'#555', fontSize:13, marginTop:6 }}>por período: {proposta.periodo}</div>}
              </div>
            </div>
            {proposta.observacoes && (
              <div style={{ marginTop:36, paddingTop:28, borderTop:'1px solid #222', position:'relative', zIndex:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#FFD600', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Observações</div>
                <p style={{ color:'#888', fontSize:14, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{proposta.observacoes}</p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{ marginTop:56, textAlign:'center' }}>
            {!isExpired && !isApproved && (
              <>
                <h3 style={{ fontSize:24, fontWeight:800, marginBottom:8, color:'#0A0A0A' }}>Tudo pronto para iniciarmos?</h3>
                <p style={{ color:'#888', fontSize:14, marginBottom:28 }}>
                  {hasPaymentLink ? 'Ao aceitar, você será direcionado para a página de pagamento seguro.' : 'Clique abaixo para aprovar esta proposta e iniciar o projeto.'}
                </p>
                <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
                  <button onClick={handleAccept} className="pp-cta-btn"
                    style={{ background:'#FFD600', color:'#0A0A0A', padding:'18px 40px', fontSize:16, fontWeight:800, border:'none', borderRadius:8, display:'flex', alignItems:'center', gap:10 }}>
                    {hasPaymentLink ? '✅ Aceitar e Pagar' : '✅ Aceitar Proposta'} <ChevronRight size={20} strokeWidth={3}/>
                  </button>
                  <a href={`https://wa.me/${AGENCY_WHATSAPP}?text=${encodeURIComponent('Olá, tenho dúvidas sobre a proposta comercial!')}`}
                    target="_blank" rel="noreferrer" className="pp-cta-btn"
                    style={{ background:'#F0F0F0', color:'#0A0A0A', padding:'18px 32px', fontSize:15, fontWeight:700, textDecoration:'none', borderRadius:8, display:'flex', alignItems:'center', gap:10 }}>
                    💬 Tirar Dúvidas
                  </a>
                </div>
              </>
            )}
            {isApproved && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:16, background:'#0A0A0A', color:'#FFD600', padding:'24px 48px', fontSize:20, fontWeight:800, borderRadius:12 }}>
                <ShieldCheck size={32}/> Proposta Aprovada com Sucesso!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#0A0A0A', padding:'48px 20px', textAlign:'center', color:'#444' }}>
        <div style={{ fontWeight:800, fontSize:18, color:'#fff', marginBottom:8 }}>foryou<span style={{ color:'#FFD600' }}>.lab</span></div>
        <div style={{ fontSize:10, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>ESTRATÉGIA • BRANDING • PERFORMANCE • RECORRÊNCIA</div>
        <p style={{ fontSize:11 }}>© {new Date().getFullYear()} foryou.lab — Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
