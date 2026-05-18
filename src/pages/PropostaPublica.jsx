import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check, Clock, AlertTriangle, ChevronRight, ShieldCheck, Target, Zap, BarChart2, Activity, Timer } from 'lucide-react';

const fmt = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(v);
const WA = "5511999999999";

export default function PropostaPublica() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [cd, setCd] = useState(null);
  const [err, setErr] = useState(null);
  const refs = useRef([]);

  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        setErr('Tempo limite de conexão excedido. Verifique sua internet.');
        setLoading(false);
      }
    }, 8000);

    (async () => {
      try {
        const { data, error } = await supabase.from('proposals').select('data').eq('id', id).single();
        if (!isMounted) return;
        if (error) { setErr(error.message); return; }
        if (data?.data) {
          setP(data.data);
          if (data.data.status === 'enviada') {
            const u = { ...data.data, status: 'visualizada', visualizadaEm: new Date().toISOString() };
            await supabase.from('proposals').update({ data: u }).eq('id', id);
          }
        }
      } catch (e) { 
        if (isMounted) setErr(e.message); 
      } finally { 
        clearTimeout(timeout);
        if (isMounted) setLoading(false); 
      }
    })();

    return () => { isMounted = false; clearTimeout(timeout); };
  }, [id]);

  useEffect(() => {
    if (!p?.validade) return;
    const tick = () => {
      const diff = new Date(p.validade + 'T23:59:59') - new Date();
      if (diff <= 0) { setCd({ expired: true }); return; }
      setCd({ expired:false, d:Math.floor(diff/86400000), h:Math.floor((diff%86400000)/3600000), m:Math.floor((diff%3600000)/60000), s:Math.floor((diff%60000)/1000) });
    };
    tick(); const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [p]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('pp-visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.15 });
    refs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, [p]);

  const addRef = (el) => { if (el && !refs.current.includes(el)) refs.current.push(el); };

  const handleAccept = async () => {
    const u = { ...p, status: 'aprovada', aprovadaEm: new Date().toISOString() };
    const { error } = await supabase.from('proposals').update({ data: u }).eq('id', id);
    if (error) { alert('Erro: ' + error.message); return; }
    setAccepted(true); setP(u);
    if (p.linkPagamento) setTimeout(() => window.open(p.linkPagamento, '_blank'), 800);
  };

  if (loading) return <div style={L.wrap}><div style={L.spin}/><p style={{color:'#666',marginTop:16,fontSize:13}}>Carregando proposta...</p></div>;
  if (!p) return <div style={L.wrap}><AlertTriangle size={44} color="#FFD600"/><h2 style={{color:'#fff',fontSize:20,fontWeight:700,marginTop:16}}>Proposta não encontrada</h2><p style={{color:'#666',marginTop:8,fontSize:13}}>{err||'Link incorreto ou proposta expirada.'}</p></div>;

  const expired = cd?.expired;
  const approved = p.status === 'aprovada' || accepted;
  const nome = p.nomeCliente || 'você';
  const sub = (p.servicosItems||[]).reduce((a,s) => a+(s.valor||0), 0);
  const dsc = p.descontoTipo === 'pct' ? sub*(p.desconto/100) : (p.desconto||0);
  const diag = p.diagnosticoData;
  const gc = s => s >= 70 ? '#22C55E' : s >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{fontFamily:"'Inter',system-ui,-apple-system,sans-serif",background:'#050508',color:'#fff',minHeight:'100vh',overflowX:'hidden',overflowY:'auto'}}>
      <style>{CSS}</style>

      {/* HEADER */}
      <header style={{background:'rgba(5,5,8,.9)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',padding:'14px 28px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100,borderBottom:'1px solid rgba(255,214,0,.08)'}}>
        <img src="/logo.png" alt="foryou.lab" style={{height:32,filter:'invert(1)'}}/>
        <div style={{fontSize:10,fontWeight:700,color:'rgba(255,214,0,.7)',letterSpacing:2,textTransform:'uppercase'}}>Proposta Comercial</div>
      </header>

      {/* HERO */}
      <section style={{position:'relative',padding:'100px 24px 60px',overflow:'hidden'}}>
        <div className="pp-glow" style={{position:'absolute',top:'-20%',left:'50%',transform:'translateX(-50%)',width:800,height:800,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,214,0,.06) 0%,transparent 60%)',pointerEvents:'none'}}/>
        <div style={{maxWidth:860,margin:'0 auto',position:'relative',zIndex:2}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,214,0,.06)',border:'1px solid rgba(255,214,0,.12)',borderRadius:100,padding:'6px 16px',marginBottom:24}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#FFD600',animation:'blink 2s infinite'}}/>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:2,color:'rgba(255,214,0,.8)',textTransform:'uppercase'}}>Proposta exclusiva para {nome}</span>
          </div>
          <h1 style={{fontSize:'clamp(32px,6vw,56px)',fontWeight:900,lineHeight:1.05,letterSpacing:'-.03em',marginBottom:20}}>
            Estratégia que gera<br/><span style={{background:'linear-gradient(135deg,#FFD600,#FFB300)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>crescimento real.</span>
          </h1>
          <p style={{fontSize:17,color:'#777',lineHeight:1.7,maxWidth:520}}>Solução estratégica desenvolvida exclusivamente para escalar o faturamento da <strong style={{color:'#ccc'}}>{nome}</strong>.</p>
        </div>
      </section>

      {/* COUNTDOWN */}
      {p.validade && (
        <section style={{padding:'0 24px 60px'}}>
          <div ref={addRef} className="pp-anim" style={{maxWidth:860,margin:'0 auto',background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,214,0,.1)',borderRadius:20,padding:'32px',backdropFilter:'blur(12px)',textAlign:'center'}}>
            {approved ? (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14}}><ShieldCheck size={28} color="#22C55E"/><span style={{fontSize:20,fontWeight:800,color:'#22C55E'}}>Proposta Aprovada ✅</span></div>
            ) : expired ? (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14}}><AlertTriangle size={28} color="#EF4444"/><span style={{fontSize:20,fontWeight:800,color:'#EF4444'}}>Proposta Expirada</span></div>
            ) : cd && (<>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:20}}>
                <Timer size={14} color="#FFD600"/><span style={{fontSize:10,fontWeight:800,letterSpacing:3,color:'#888',textTransform:'uppercase'}}>Esta proposta expira em</span>
              </div>
              <div style={{display:'flex',justifyContent:'center',gap:12,flexWrap:'wrap'}}>
                {[['DIAS',cd.d],['HRS',cd.h],['MIN',cd.m],['SEG',cd.s]].map(([l,v],i) => (
                  <div key={l} style={{display:'flex',alignItems:'center',gap:0}}>
                    <div style={{background:'rgba(255,214,0,.05)',border:'1px solid rgba(255,214,0,.15)',borderRadius:14,padding:'14px 22px',minWidth:78,textAlign:'center'}}>
                      <div className="pp-tick" style={{fontSize:40,fontWeight:900,color:'#FFD600',lineHeight:1,fontVariantNumeric:'tabular-nums'}}>{String(v||0).padStart(2,'0')}</div>
                      <div style={{fontSize:8,fontWeight:700,letterSpacing:2,color:'#555',marginTop:6}}>{l}</div>
                    </div>
                    {i < 3 && <span style={{fontSize:24,fontWeight:800,color:'#333',margin:'0 2px',marginTop:-10}}>:</span>}
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:'#444',marginTop:14}}>Válida até {p.validade.split('-').reverse().join('/')}</div>
            </>)}
          </div>
        </section>
      )}

      {/* DIAGNÓSTICO - só aparece se tiver dados */}
      {diag && (
        <section ref={addRef} className="pp-anim" style={{padding:'80px 24px',borderTop:'1px solid #111'}}>
          <div style={{maxWidth:860,margin:'0 auto'}}>
            <div style={{marginBottom:40}}>
              <div style={{fontSize:10,fontWeight:800,color:'#FFD600',letterSpacing:3,textTransform:'uppercase',marginBottom:8}}>Diagnóstico</div>
              <h2 style={{fontSize:32,fontWeight:800}}>Saúde Digital <span style={{color:'#FFD600'}}>da {nome}</span></h2>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'180px 1fr',gap:36,alignItems:'start'}}>
              <div style={{textAlign:'center'}}>
                <div style={{position:'relative',width:140,height:140,margin:'0 auto'}}>
                  <svg width="140" height="140" viewBox="0 0 140 140" style={{transform:'rotate(-90deg)'}}>
                    <circle cx="70" cy="70" r="60" fill="none" stroke="#151518" strokeWidth="10"/>
                    <circle className="pp-ring" cx="70" cy="70" r="60" fill="none" stroke={gc(diag.scoreGeral)} strokeWidth="10" strokeDasharray={`${(diag.scoreGeral/100)*377} 377`} strokeLinecap="round"/>
                  </svg>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}>
                    <div style={{fontSize:38,fontWeight:900,color:gc(diag.scoreGeral)}}>{diag.scoreGeral}</div>
                    <div style={{fontSize:9,color:'#555'}}>/ 100</div>
                  </div>
                </div>
                <div style={{marginTop:10,fontSize:12,fontWeight:700,color:gc(diag.scoreGeral)}}>{diag.scoreGeral >= 70 ? 'Saudável' : diag.scoreGeral >= 40 ? 'Requer Atenção' : 'Crítico'}</div>
              </div>
              <div>{(diag.blocos||[]).map((b,i) => (
                <div key={i} style={{marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}><span style={{fontWeight:600,color:'#ccc'}}>{b.title}</span><span style={{fontWeight:700,color:gc(b.score)}}>{b.score}/100</span></div>
                  <div style={{height:6,borderRadius:3,background:'#151518',overflow:'hidden'}}><div className="pp-bar" style={{height:'100%',borderRadius:3,width:`${b.score}%`,background:gc(b.score)}}/></div>
                </div>
              ))}</div>
            </div>
            {diag.quickWins?.length > 0 && (
              <div style={{marginTop:48}}>
                <h3 style={{fontSize:16,fontWeight:700,marginBottom:16,color:'#FFD600'}}>⚡ Oportunidades Identificadas</h3>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10}}>
                  {diag.quickWins.slice(0,6).map((w,i) => (
                    <div key={i} className="pp-card-hover" style={{padding:16,background:'rgba(255,255,255,.02)',border:'1px solid #1a1a1a',borderRadius:10}}>
                      <div style={{fontSize:9,fontWeight:700,color:'#FFD600',marginBottom:5,letterSpacing:1,textTransform:'uppercase'}}>{w.area}</div>
                      <div style={{fontSize:12,color:'#999',lineHeight:1.5}}>{w.pergunta}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* METODOLOGIA */}
      <section ref={addRef} className="pp-anim" style={{padding:'80px 24px',background:'#0a0a0d',borderTop:'1px solid #111'}}>
        <div style={{maxWidth:860,margin:'0 auto'}}>
          <h2 style={{fontSize:32,fontWeight:800,marginBottom:40}}>Não é sorte. É <span style={{color:'#FFD600'}}>método.</span></h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16}}>
            {[{icon:<Activity size={24}/>,t:'Estratégia',d:'Análise profunda e planejamento focado.'},{icon:<BarChart2 size={24}/>,t:'Dados',d:'Decisões baseadas em métricas reais.'},{icon:<Target size={24}/>,t:'Foco',d:'Ações direcionadas para clientes ideais.'},{icon:<Zap size={24}/>,t:'Resultado',d:'Crescimento escalável e previsível.'}].map((x,i) => (
              <div key={i} className="pp-card-hover" style={{background:'rgba(255,255,255,.02)',border:'1px solid #1a1a1a',borderRadius:14,padding:24,transition:'all .3s'}}>
                <div style={{color:'#FFD600',marginBottom:14}}>{x.icon}</div>
                <h3 style={{fontSize:15,fontWeight:700,marginBottom:6}}>{x.t}</h3>
                <p style={{fontSize:12,color:'#666',lineHeight:1.6}}>{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section ref={addRef} className="pp-anim" style={{padding:'80px 24px',borderTop:'1px solid #111'}}>
        <div style={{maxWidth:860,margin:'0 auto'}}>
          <div style={{fontSize:10,fontWeight:800,color:'#FFD600',letterSpacing:3,textTransform:'uppercase',marginBottom:6}}>O que está incluso</div>
          <h2 style={{fontSize:28,fontWeight:800,marginBottom:8}}>Serviços para <span style={{color:'#FFD600'}}>{nome}</span></h2>
          <p style={{fontSize:13,color:'#555',marginBottom:32,maxWidth:500}}>Cada serviço foi selecionado para maximizar seu retorno.</p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {(p.servicosItems||[]).map((s,i) => (
              <div key={i} className="pp-card-hover" style={{background:'rgba(255,255,255,.02)',padding:'20px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',border:'1px solid #1a1a1a',borderRadius:12,gap:16}}>
                <div style={{display:'flex',gap:14,alignItems:'center',flex:1}}>
                  <div style={{width:38,height:38,background:'linear-gradient(135deg,#FFD600,#FFB300)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Check size={18} color="#0A0A0A" strokeWidth={3}/></div>
                  <div><h3 style={{fontSize:15,fontWeight:700}}>{s.nome}</h3>{s.descricao && <p style={{fontSize:12,color:'#666',marginTop:2}}>{s.descricao}</p>}</div>
                </div>
                <div style={{fontSize:17,fontWeight:800,color:'#FFD600',whiteSpace:'nowrap'}}>{fmt(s.valor||0)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INVESTIMENTO */}
      <section ref={addRef} className="pp-anim" style={{padding:'80px 24px',background:'#0a0a0d',borderTop:'1px solid #111'}}>
        <div style={{maxWidth:860,margin:'0 auto'}}>
          <div style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,214,0,.08)',padding:44,borderRadius:20,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:-60,right:-60,width:300,height:300,background:'radial-gradient(circle,rgba(255,214,0,.06) 0%,transparent 60%)',pointerEvents:'none'}}/>
            <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:28,position:'relative',zIndex:2}}>
              <div style={{flex:1,minWidth:220}}>
                <div style={{fontSize:10,fontWeight:700,color:'#FFD600',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>Investimento</div>
                <h2 style={{fontSize:26,fontWeight:800,marginBottom:10,lineHeight:1.15}}>{p.titulo || 'Proposta Estratégica'}</h2>
                <p style={{color:'#666',fontSize:13,lineHeight:1.6}}>Investimento focado em retorno real para a {nome}.</p>
              </div>
              <div style={{background:'#0a0a0d',padding:24,border:'1px solid #1a1a1a',borderRadius:14,minWidth:250}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:13,color:'#666'}}><span>Subtotal</span><span>{fmt(sub)}</span></div>
                {(p.desconto||0) > 0 && <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:13,color:'#FFD600'}}><span>Desconto</span><span>- {fmt(dsc)}</span></div>}
                <div style={{borderTop:'1px solid #222',margin:'14px 0'}}/>
                <div style={{fontSize:9,color:'#555',letterSpacing:1,textTransform:'uppercase',marginBottom:4}}>Total</div>
                <div style={{fontSize:36,fontWeight:900,lineHeight:1}}>{fmt(p.valorTotal||0)}</div>
                {p.periodo && <div style={{color:'#444',fontSize:11,marginTop:4}}>por período: {p.periodo}</div>}
              </div>
            </div>
            {p.observacoes && (
              <div style={{marginTop:28,paddingTop:20,borderTop:'1px solid #151518',position:'relative',zIndex:2}}>
                <div style={{fontSize:10,fontWeight:700,color:'#FFD600',letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>Observações</div>
                <p style={{color:'#666',fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{p.observacoes}</p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{marginTop:48,textAlign:'center'}}>
            {!expired && !approved && (<>
              <h3 style={{fontSize:22,fontWeight:800,marginBottom:6}}>Tudo pronto para iniciarmos?</h3>
              <p style={{color:'#555',fontSize:13,marginBottom:24}}>{p.linkPagamento ? 'Ao aceitar, você será direcionado para o pagamento.' : 'Clique abaixo para aprovar e iniciar.'}</p>
              <div style={{display:'flex',justifyContent:'center',gap:12,flexWrap:'wrap'}}>
                <button onClick={handleAccept} className="pp-cta" style={{background:'linear-gradient(135deg,#FFD600,#FFB300)',color:'#0A0A0A',padding:'16px 36px',fontSize:15,fontWeight:800,border:'none',borderRadius:12,display:'inline-flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  {p.linkPagamento ? '✅ Aceitar e Pagar' : '✅ Aceitar Proposta'} <ChevronRight size={18} strokeWidth={3}/>
                </button>
                <a href={`https://wa.me/${WA}?text=${encodeURIComponent('Olá, tenho dúvidas sobre a proposta comercial!')}`} target="_blank" rel="noreferrer" className="pp-cta" style={{background:'rgba(255,255,255,.04)',color:'#fff',padding:'16px 28px',fontSize:14,fontWeight:700,textDecoration:'none',borderRadius:12,display:'inline-flex',alignItems:'center',gap:8,border:'1px solid #333'}}>
                  💬 Tirar Dúvidas
                </a>
              </div>
            </>)}
            {approved && <div style={{display:'inline-flex',alignItems:'center',gap:12,background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.2)',color:'#22C55E',padding:'20px 40px',fontSize:18,fontWeight:800,borderRadius:14}}><ShieldCheck size={28}/> Proposta Aprovada!</div>}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid #111',padding:'40px 24px',textAlign:'center'}}>
        <img src="/logo.png" alt="foryou.lab" style={{height:28,filter:'invert(1)',marginBottom:8}}/>
        <div style={{fontSize:9,letterSpacing:2,color:'#333',textTransform:'uppercase',marginBottom:8}}>Estratégia • Branding • Performance • Recorrência</div>
        <p style={{fontSize:10,color:'#222'}}>© {new Date().getFullYear()} foryou.lab — Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

const L = {
  wrap:{height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#050508'},
  spin:{width:40,height:40,border:'3px solid #1a1a1a',borderTopColor:'#FFD600',borderRadius:'50%',animation:'spin 1s linear infinite'},
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0}
html,body,#root{overflow-x:hidden;overflow-y:auto!important;height:auto!important;min-height:100vh}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes ringDraw{from{stroke-dasharray:0 377}to{}}
@keyframes barGrow{from{width:0}to{}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 30px rgba(255,214,0,.04)}50%{box-shadow:0 0 60px rgba(255,214,0,.1)}}
.pp-glow{animation:pulseGlow 4s ease-in-out infinite}
.pp-anim{opacity:0;transform:translateY(40px);transition:all .8s cubic-bezier(.22,1,.36,1)}
.pp-visible{opacity:1!important;transform:translateY(0)!important}
.pp-ring{animation:ringDraw 1.5s ease-out forwards}
.pp-bar{animation:barGrow 1.2s ease-out forwards}
.pp-tick{transition:all .3s}
.pp-card-hover{transition:all .3s ease!important}
.pp-card-hover:hover{border-color:rgba(255,214,0,.2)!important;transform:translateY(-3px);box-shadow:0 8px 32px rgba(0,0,0,.3)}
.pp-cta{transition:all .25s ease!important;cursor:pointer}
.pp-cta:hover{transform:translateY(-2px)!important;box-shadow:0 8px 32px rgba(255,214,0,.2)!important}
@media(max-width:768px){
  header{padding:12px 16px!important}
  section{padding-left:16px!important;padding-right:16px!important}
}
`;
