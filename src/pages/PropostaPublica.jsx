import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check, Clock, AlertTriangle, ChevronRight, ShieldCheck, Target, Zap, BarChart2, Activity, Timer, Sparkles } from 'lucide-react';

const fmt = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(v);
const AGENCY_WHATSAPP = "5511999999999";

export default function PropostaPublica() {
  const { id } = useParams();
  const [proposta, setProposta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('proposals').select('data').eq('id', id).single();
        if (error) { setLoadError(error.message); setLoading(false); return; }
        if (data?.data) {
          setProposta(data.data);
          if (data.data.status === 'enviada') {
            const updated = { ...data.data, status: 'visualizada', visualizadaEm: new Date().toISOString() };
            await supabase.from('proposals').update({ data: updated }).eq('id', id);
          }
        }
      } catch (err) { console.error(err); setLoadError(err.message); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

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
      const { error } = await supabase.from('proposals').update({ data: updated }).eq('id', id);
      if (error) { alert('Erro ao aprovar: ' + error.message); return; }
      setAccepted(true);
      setProposta(updated);
      if (proposta.linkPagamento) setTimeout(() => window.open(proposta.linkPagamento, '_blank'), 800);
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div style={S.loadingWrap}>
      <div style={S.spinner} />
      <p style={{color:'#888',marginTop:16,fontSize:14}}>Carregando proposta...</p>
    </div>
  );

  if (!proposta) return (
    <div style={S.loadingWrap}>
      <AlertTriangle size={48} color="#FFD600" />
      <h2 style={{color:'#fff',fontSize:22,fontWeight:700,marginTop:16}}>Proposta não encontrada</h2>
      <p style={{color:'#777',marginTop:8,fontSize:14}}>{loadError || 'O link pode estar incorreto ou a proposta expirou.'}</p>
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

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:'#050505',color:'#fff',minHeight:'100vh'}}>
      <style>{CSS_TEXT}</style>

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.logo}>foryou<span style={{color:'#FFD600'}}>.lab</span></div>
        <div style={S.headerBadge}>
          <Sparkles size={12} color="#FFD600"/>
          <span>Proposta exclusiva</span>
        </div>
      </header>

      {/* HERO WITH COUNTDOWN */}
      <section style={S.hero}>
        <div style={S.heroGlow}/>
        <div style={S.heroGlow2}/>
        <div style={S.heroContent}>
          <div style={S.heroTag}>
            <span style={{width:32,height:2,background:'#FFD600',display:'inline-block'}}/> PROPOSTA COMERCIAL
          </div>
          <h1 style={S.heroTitle}>
            Estratégia que gera<br/><span style={{color:'#FFD600'}}>crescimento real.</span>
          </h1>
          <p style={S.heroDesc}>
            Desenvolvida exclusivamente para escalar o faturamento da <strong style={{color:'#fff'}}>{nome}</strong>.
          </p>
        </div>

        {/* COUNTDOWN CLOCK - PROMINENT */}
        {proposta.validade && (
          <div className="pp-countdown-wrap" style={S.countdownWrap}>
            {isApproved ? (
              <div style={S.approvedBanner}>
                <ShieldCheck size={28} color="#22C55E"/>
                <div>
                  <div style={{fontSize:11,color:'#22C55E',fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>Confirmada</div>
                  <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>Proposta Aprovada ✅</div>
                </div>
              </div>
            ) : isExpired ? (
              <div style={S.expiredBanner}>
                <AlertTriangle size={28} color="#EF4444"/>
                <div>
                  <div style={{fontSize:11,color:'#EF4444',fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>Expirada</div>
                  <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>Esta proposta expirou</div>
                </div>
              </div>
            ) : countdown && (
              <div style={{textAlign:'center'}}>
                <div style={S.countdownLabel}>
                  <Timer size={14} color="#FFD600"/> ESTA PROPOSTA EXPIRA EM
                </div>
                <div className="pp-clock" style={S.clockRow}>
                  {[['DIAS',countdown.d],['HRS',countdown.h],['MIN',countdown.m],['SEG',countdown.s]].map(([label,val],i) => (
                    <div key={label} style={{display:'flex',alignItems:'center',gap:0}}>
                      <div style={S.clockBlock}>
                        <div className="pp-clock-num" style={S.clockNum}>{String(val||0).padStart(2,'0')}</div>
                        <div style={S.clockLabel}>{label}</div>
                      </div>
                      {i < 3 && <span style={S.clockSep}>:</span>}
                    </div>
                  ))}
                </div>
                <div style={{fontSize:12,color:'#555',marginTop:8}}>Válida até {proposta.validade.split('-').reverse().join('/')}</div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* DIAGNÓSTICO */}
      {diag && (
        <section className="pp-fade" style={S.section}>
          <div style={S.container}>
            <div style={S.sectionHeader}>
              <h2 style={S.sectionTitle}>Diagnóstico de <span style={{color:'#FFD600'}}>Saúde Digital</span></h2>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'180px 1fr',gap:32,alignItems:'start'}}>
              <div style={{textAlign:'center'}}>
                <div style={{position:'relative',width:140,height:140,margin:'0 auto'}}>
                  <svg width="140" height="140" viewBox="0 0 140 140" style={{transform:'rotate(-90deg)'}}>
                    <circle cx="70" cy="70" r="60" fill="none" stroke="#1a1a1a" strokeWidth="10"/>
                    <circle cx="70" cy="70" r="60" fill="none" stroke={getScoreColor(diag.scoreGeral)} strokeWidth="10"
                      strokeDasharray={`${(diag.scoreGeral/100)*377} 377`} strokeLinecap="round"/>
                  </svg>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center'}}>
                    <div style={{fontSize:36,fontWeight:900,color:getScoreColor(diag.scoreGeral)}}>{diag.scoreGeral}</div>
                    <div style={{fontSize:10,color:'#666'}}>/ 100</div>
                  </div>
                </div>
                <div style={{marginTop:10,fontSize:13,fontWeight:700,color:getScoreColor(diag.scoreGeral)}}>{getScoreLabel(diag.scoreGeral)}</div>
              </div>
              <div>
                {(diag.blocos||[]).map((b, i) => (
                  <div key={i} style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:5}}>
                      <span style={{fontWeight:600}}>{b.title}</span>
                      <span style={{fontWeight:700,color:getScoreColor(b.score)}}>{b.score}/100</span>
                    </div>
                    <div style={{height:6,borderRadius:3,background:'#1a1a1a',overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:3,width:`${b.score}%`,background:getScoreColor(b.score),transition:'width 1s ease-out'}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* METODOLOGIA */}
      <section className="pp-fade" style={{...S.section,background:'#0a0a0a'}}>
        <div style={S.container}>
          <div style={S.sectionHeader}>
            <h2 style={S.sectionTitle}>Não é sorte. É <span style={{color:'#FFD600'}}>método.</span></h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:24}}>
            {[
              {icon:<Activity size={26}/>,title:'Estratégia',desc:'Análise profunda e planejamento focado no seu crescimento.'},
              {icon:<BarChart2 size={26}/>,title:'Dados',desc:'Decisões baseadas em métricas reais de performance e ROI.'},
              {icon:<Target size={26}/>,title:'Foco',desc:'Ações direcionadas para atrair clientes ideais.'},
              {icon:<Zap size={26}/>,title:'Resultado',desc:'Crescimento escalável, previsível e sustentável.'}
            ].map((item,i) => (
              <div key={i} className="pp-method-card" style={S.methodCard}>
                <div style={{color:'#FFD600',marginBottom:14}}>{item.icon}</div>
                <h3 style={{fontSize:16,fontWeight:700,marginBottom:6}}>{item.title}</h3>
                <p style={{fontSize:13,color:'#777',lineHeight:1.6}}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="pp-fade" style={{...S.section,background:'#111'}}>
        <div style={S.container}>
          <div style={{fontSize:11,fontWeight:800,color:'#FFD600',textTransform:'uppercase',letterSpacing:2,marginBottom:6}}>O que está incluso</div>
          <h2 style={{...S.sectionTitle,marginBottom:8}}>Serviços para <span style={{color:'#FFD600'}}>{nome}</span></h2>
          <p style={{fontSize:14,color:'#666',marginBottom:32,maxWidth:550}}>Cada serviço foi selecionado para maximizar o retorno.</p>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {(proposta.servicosItems||[]).map((s,i) => (
              <div key={i} className="pp-svc-card" style={S.svcCard}>
                <div style={{display:'flex',gap:16,alignItems:'center',flex:1}}>
                  <div style={S.svcIcon}><Check size={20} color="#0A0A0A" strokeWidth={3}/></div>
                  <div>
                    <h3 style={{fontSize:16,fontWeight:700}}>{s.nome}</h3>
                    {s.descricao && <p style={{fontSize:13,color:'#777',marginTop:3}}>{s.descricao}</p>}
                  </div>
                </div>
                <div style={{fontSize:18,fontWeight:800,color:'#FFD600',whiteSpace:'nowrap'}}>{fmt(s.valor||0)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INVESTIMENTO */}
      <section className="pp-fade" style={{...S.section,background:'#050505'}}>
        <div style={S.container}>
          <div style={S.investCard}>
            <div style={S.investGlow}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:28,position:'relative',zIndex:2}}>
              <div style={{flex:1,minWidth:240}}>
                <div style={{fontSize:11,fontWeight:700,color:'#FFD600',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>Investimento</div>
                <h2 style={{fontSize:28,fontWeight:800,marginBottom:10,lineHeight:1.1}}>{proposta.titulo || 'Proposta Estratégica'}</h2>
                <p style={{color:'#777',fontSize:13,lineHeight:1.6}}>Investimento focado em gerar retorno real e previsível para a {nome}.</p>
              </div>
              <div style={S.priceBox}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:13,color:'#777'}}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                {(proposta.desconto||0) > 0 && (
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:13,color:'#FFD600'}}><span>Desconto</span><span>- {fmt(descVal)}</span></div>
                )}
                <div style={{borderTop:'1px solid #333',margin:'14px 0'}}/>
                <div style={{fontSize:10,color:'#555',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Total do Investimento</div>
                <div style={{fontSize:38,fontWeight:900,color:'#fff',lineHeight:1}}>{fmt(proposta.valorTotal||0)}</div>
                {proposta.periodo && <div style={{color:'#555',fontSize:12,marginTop:5}}>por período: {proposta.periodo}</div>}
              </div>
            </div>
            {proposta.observacoes && (
              <div style={{marginTop:28,paddingTop:20,borderTop:'1px solid #1a1a1a',position:'relative',zIndex:2}}>
                <div style={{fontSize:11,fontWeight:700,color:'#FFD600',letterSpacing:2,textTransform:'uppercase',marginBottom:8}}>Observações</div>
                <p style={{color:'#777',fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{proposta.observacoes}</p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{marginTop:48,textAlign:'center'}}>
            {!isExpired && !isApproved && (
              <>
                <h3 style={{fontSize:22,fontWeight:800,marginBottom:6}}>Tudo pronto para iniciarmos?</h3>
                <p style={{color:'#666',fontSize:13,marginBottom:24}}>
                  {hasPaymentLink ? 'Ao aceitar, você será direcionado para o pagamento seguro.' : 'Clique abaixo para aprovar e iniciar o projeto.'}
                </p>
                <div style={{display:'flex',justifyContent:'center',gap:12,flexWrap:'wrap'}}>
                  <button onClick={handleAccept} className="pp-cta-btn" style={S.ctaBtn}>
                    {hasPaymentLink ? '✅ Aceitar e Pagar' : '✅ Aceitar Proposta'} <ChevronRight size={18} strokeWidth={3}/>
                  </button>
                  <a href={`https://wa.me/${AGENCY_WHATSAPP}?text=${encodeURIComponent('Olá, tenho dúvidas sobre a proposta comercial!')}`}
                    target="_blank" rel="noreferrer" className="pp-cta-btn" style={S.ctaSecondary}>
                    💬 Tirar Dúvidas
                  </a>
                </div>
              </>
            )}
            {isApproved && (
              <div style={S.approvedFinal}>
                <ShieldCheck size={30}/> Proposta Aprovada com Sucesso!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div style={{fontWeight:800,fontSize:18,color:'#fff',marginBottom:6}}>foryou<span style={{color:'#FFD600'}}>.lab</span></div>
        <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',marginBottom:10,color:'#555'}}>ESTRATÉGIA • BRANDING • PERFORMANCE • RECORRÊNCIA</div>
        <p style={{fontSize:11,color:'#333'}}>© {new Date().getFullYear()} foryou.lab — Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

/* ─── STYLES ─── */
const S = {
  loadingWrap: {height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#050505'},
  spinner: {width:40,height:40,border:'3px solid #222',borderTopColor:'#FFD600',borderRadius:'50%',animation:'spin 1s linear infinite'},
  header: {background:'rgba(5,5,5,0.85)',backdropFilter:'blur(20px)',padding:'16px 32px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:50,borderBottom:'1px solid #1a1a1a'},
  logo: {fontWeight:800,fontSize:20,color:'#fff',letterSpacing:'-0.02em'},
  headerBadge: {display:'flex',alignItems:'center',gap:6,fontSize:11,fontWeight:600,color:'#888',letterSpacing:1,textTransform:'uppercase'},
  hero: {position:'relative',overflow:'hidden',padding:'80px 20px 40px',background:'linear-gradient(180deg,#0a0a0a 0%,#050505 100%)'},
  heroGlow: {position:'absolute',top:-120,right:-80,width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,214,0,0.08) 0%,transparent 70%)'},
  heroGlow2: {position:'absolute',bottom:-100,left:-60,width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,214,0,0.04) 0%,transparent 70%)'},
  heroContent: {maxWidth:900,margin:'0 auto',position:'relative',zIndex:2},
  heroTag: {fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:3,marginBottom:20,display:'flex',alignItems:'center',gap:12,color:'#888'},
  heroTitle: {fontSize:'clamp(28px,5vw,48px)',fontWeight:900,marginBottom:16,lineHeight:1.05,letterSpacing:'-0.02em'},
  heroDesc: {fontSize:16,fontWeight:400,maxWidth:550,lineHeight:1.7,color:'#888'},
  countdownWrap: {maxWidth:900,margin:'32px auto 0',position:'relative',zIndex:2,background:'rgba(255,255,255,0.03)',border:'1px solid #1a1a1a',borderRadius:16,padding:'28px 32px',backdropFilter:'blur(10px)'},
  countdownLabel: {display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontSize:11,fontWeight:800,letterSpacing:2,color:'#888',marginBottom:16,textTransform:'uppercase'},
  clockRow: {display:'flex',justifyContent:'center',gap:8,alignItems:'center'},
  clockBlock: {background:'rgba(255,214,0,0.06)',border:'1px solid rgba(255,214,0,0.15)',borderRadius:12,padding:'12px 20px',minWidth:72,textAlign:'center'},
  clockNum: {fontSize:36,fontWeight:900,color:'#FFD600',lineHeight:1,fontVariantNumeric:'tabular-nums'},
  clockLabel: {fontSize:9,fontWeight:700,letterSpacing:2,color:'#555',marginTop:4},
  clockSep: {fontSize:28,fontWeight:800,color:'#333',marginTop:-12},
  approvedBanner: {display:'flex',alignItems:'center',gap:16},
  expiredBanner: {display:'flex',alignItems:'center',gap:16},
  section: {padding:'64px 20px',background:'#050505'},
  container: {maxWidth:900,margin:'0 auto'},
  sectionHeader: {marginBottom:36},
  sectionTitle: {fontSize:28,fontWeight:800,lineHeight:1.15},
  methodCard: {background:'rgba(255,255,255,0.02)',border:'1px solid #1a1a1a',borderRadius:12,padding:24,transition:'all .3s'},
  svcCard: {background:'rgba(255,255,255,0.03)',padding:'22px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',border:'1px solid #1a1a1a',borderRadius:10,gap:20,transition:'all .25s'},
  svcIcon: {width:40,height:40,background:'#FFD600',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  investCard: {background:'rgba(255,255,255,0.02)',border:'1px solid #1a1a1a',padding:'44px',borderRadius:16,position:'relative',overflow:'hidden'},
  investGlow: {position:'absolute',top:0,right:0,width:200,height:200,background:'radial-gradient(circle,rgba(255,214,0,0.06) 0%,transparent 70%)'},
  priceBox: {background:'#0a0a0a',padding:24,border:'1px solid #1a1a1a',borderRadius:12,minWidth:260},
  ctaBtn: {background:'#FFD600',color:'#0A0A0A',padding:'16px 36px',fontSize:15,fontWeight:800,border:'none',borderRadius:10,display:'inline-flex',alignItems:'center',gap:8,cursor:'pointer',transition:'all .2s',textDecoration:'none'},
  ctaSecondary: {background:'#1a1a1a',color:'#fff',padding:'16px 28px',fontSize:14,fontWeight:700,textDecoration:'none',borderRadius:10,display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #333',transition:'all .2s'},
  approvedFinal: {display:'inline-flex',alignItems:'center',gap:14,background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',color:'#22C55E',padding:'20px 40px',fontSize:18,fontWeight:800,borderRadius:12},
  footer: {background:'#050505',padding:'40px 20px',textAlign:'center',borderTop:'1px solid #111'},
};

const CSS_TEXT = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; }
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
  @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 20px rgba(255,214,0,0.1) } 50% { box-shadow: 0 0 40px rgba(255,214,0,0.2) } }
  .pp-fade { animation: fadeUp .7s ease-out both }
  .pp-countdown-wrap { animation: fadeUp .6s ease-out both, pulseGlow 3s ease-in-out infinite }
  .pp-clock-num { font-variant-numeric: tabular-nums }
  .pp-cta-btn { transition: all .2s !important; cursor: pointer }
  .pp-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(255,214,0,.25) }
  .pp-svc-card:hover { transform: translateY(-2px); border-color: rgba(255,214,0,0.2) !important }
  .pp-method-card:hover { border-color: rgba(255,214,0,0.2) !important; transform: translateY(-3px) }
  @media(max-width:640px){
    .pp-clock { gap: 4px !important }
  }
`;
