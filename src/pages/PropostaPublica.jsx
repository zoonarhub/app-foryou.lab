import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check, Clock, AlertTriangle, ArrowRight, Activity, BarChart2, Target, Zap, ChevronRight, ShieldCheck, Mail, MessageSquare } from 'lucide-react';

const fmt = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(v);

// ==========================================
// CONFIGURAÇÕES DE CONTATO DA AGÊNCIA
// ==========================================
const AGENCY_WHATSAPP = "5511999999999";
const AGENCY_EMAIL = "contato@foryou.lab";
const AGENCY_NAME = "foryou.lab";
// ==========================================

export default function PropostaPublica() {
  const { id } = useParams();
  const [proposta, setProposta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    async function fetchProposta() {
      try {
        const { data, error } = await supabase.from('proposals').select('data').eq('id', id).single();
        if (data?.data) {
          setProposta(data.data);
          if (data.data.status === 'enviada') {
            const updated = { ...data.data, status: 'visualizada', visualizadaEm: new Date().toISOString() };
            await supabase.from('proposals').update({ data: updated }).eq('id', id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProposta();
  }, [id]);

  const timeLeft = useMemo(() => {
    if (!proposta?.validade) return null;
    const end = new Date(proposta.validade + 'T23:59:59');
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return { expired: true, text: 'Expirada' };
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return { expired: false, text: `${days}d ${hours}h ${mins}m`, days, hours, mins };
  }, [proposta]);

  const [countdown, setCountdown] = useState(timeLeft);
  useEffect(() => {
    if (!proposta?.validade) return;
    const timer = setInterval(() => {
      const end = new Date(proposta.validade + 'T23:59:59');
      const diff = end - new Date();
      if (diff <= 0) { setCountdown({ expired: true, text: 'Expirada' }); clearInterval(timer); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown({ expired: false, text: `${d}d ${h}h ${m}m ${s}s`, days: d, hours: h, mins: m, secs: s });
    }, 1000);
    return () => clearInterval(timer);
  }, [proposta]);

  const handleAccept = async () => {
    try {
      const updated = { ...proposta, status: 'aprovada', aprovadaEm: new Date().toISOString() };
      await supabase.from('proposals').update({ data: updated }).eq('id', id);
      setAccepted(true);
      setProposta(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #333', borderTopColor: '#FFD600', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (!proposta) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <AlertTriangle size={48} color="#FFD600" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Proposta não encontrada</h2>
        <p style={{ color: '#999', marginTop: 8 }}>O link pode estar incorreto ou a proposta expirou.</p>
      </div>
    </div>
  );

  const isExpired = countdown?.expired;
  const isApproved = proposta.status === 'aprovada' || accepted;
  const clienteNome = proposta.nomeCliente || 'você';
  const subtotal = (proposta.servicosItems || []).reduce((a, s) => a + (s.valor || 0), 0);
  const descontoVal = proposta.descontoTipo === 'pct' ? subtotal * (proposta.desconto / 100) : proposta.desconto;
  
  return (
    <div style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden', fontFamily: 'Inter, sans-serif', background: '#FFFFFF', color: '#0A0A0A' }}>
      
      {/* HEADER: Minimalista Black */}
      <header style={{ background: '#0A0A0A', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/logo.png" alt="foryou.lab" style={{ height: 28, filter: 'invert(1) brightness(2)' }} />
        <div style={{ fontSize: 13, fontWeight: 500, color: '#999', letterSpacing: 1, textTransform: 'uppercase' }}>
          PROPOSTA PARA <span style={{ color: '#fff', fontWeight: 700 }}>{clienteNome}</span>
        </div>
      </header>

      {/* HERO: The Yellow Impact */}
      <section style={{ background: '#FFD600', color: '#0A0A0A', padding: '100px 20px', position: 'relative' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 2, background: '#0A0A0A' }} />
            CRESCIMENTO FEITO PARA VOCÊ
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, marginBottom: 24, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Estratégia que gera <br/>crescimento real.
          </h1>
          <p style={{ fontSize: 20, fontWeight: 500, maxWidth: 600, lineHeight: 1.5, opacity: 0.9 }}>
            Apresentamos a solução estratégica desenvolvida exclusivamente para alavancar a <strong>{clienteNome}</strong> no mercado.
          </p>
        </div>
        
        {/* Decorative Grid Lines */}
        <div style={{ position: 'absolute', right: 40, bottom: 40, opacity: 0.1, display: 'grid', gridTemplateColumns: 'repeat(5, 10px)', gap: 10 }}>
          {Array.from({length: 25}).map((_, i) => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#0A0A0A' }} />)}
        </div>
      </section>

      {/* COUNTDOWN: Black Bar */}
      {proposta.validade && (
        <section style={{ background: '#0A0A0A', color: '#fff', padding: '32px 20px', borderBottom: '1px solid #222' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isApproved ? <Check size={24} color="#22C55E" /> : <Clock size={24} color="#FFD600" />}
              <div>
                <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#999', fontWeight: 600 }}>Status da Proposta</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: isApproved ? '#22C55E' : isExpired ? '#EF4444' : '#fff' }}>
                  {isApproved ? 'Aprovada com sucesso' : isExpired ? 'Proposta expirada' : 'Aguardando aprovação'}
                </div>
              </div>
            </div>

            {!isApproved && !isExpired && countdown && (
              <div style={{ display: 'flex', gap: 20 }}>
                {[['Dias', countdown.days], ['Horas', countdown.hours], ['Minutos', countdown.mins], ['Segundos', countdown.secs]].map(([label, val]) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#FFD600', lineHeight: 1 }}>{String(val || 0).padStart(2, '0')}</div>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#666', marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* METODOLOGIA: Não é sorte. É método. */}
      <section style={{ padding: '100px 20px', background: '#0A0A0A', color: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 64 }}>
            <h2 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1 }}>Não é sorte.<br/>É <span style={{ color: '#FFD600' }}>método.</span></h2>
            <div style={{ flex: 1, height: 1, background: '#222', marginLeft: 24 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
            {[
              { icon: <Activity size={32}/>, title: 'Estratégia', desc: 'Análise profunda e planejamento focado no seu objetivo.' },
              { icon: <BarChart2 size={32}/>, title: 'Dados', desc: 'Decisões baseadas em números e métricas reais de performance.' },
              { icon: <Target size={32}/>, title: 'Foco', desc: 'Ações direcionadas para atrair o cliente ideal.' },
              { icon: <Zap size={32}/>, title: 'Resultados', desc: 'Crescimento escalável e previsível para o negócio.' }
            ].map((item, i) => (
              <div key={i}>
                <div style={{ color: '#FFD600', marginBottom: 20 }}>{item.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#999', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O QUE INCLUI: Dados não mentem. Resultados aparecem. */}
      <section style={{ padding: '100px 20px', background: '#F5F5F5' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, color: '#0A0A0A' }}>Performance que escala.</h2>
          <p style={{ fontSize: 16, color: '#666', marginBottom: 48, maxWidth: 600 }}>O que preparamos para transformar a realidade da {clienteNome}:</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(proposta.servicosItems || []).map((s, i) => (
              <div key={i} style={{ background: '#fff', padding: '32px', display: 'flex', gap: 24, alignItems: 'flex-start', border: '1px solid #E5E5E5', transition: 'transform 0.2s' }}>
                <div style={{ width: 48, height: 48, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={24} color="#0A0A0A" strokeWidth={3} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#0A0A0A' }}>{s.nome}</h3>
                  {s.descricao && <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6 }}>{s.descricao}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING: Marcas fortes. Resultados maiores. */}
      <section style={{ padding: '100px 20px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ background: '#0A0A0A', color: '#fff', padding: '64px', position: 'relative', overflow: 'hidden' }}>
            {/* Decoração interna */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: '#FFD600', opacity: 0.05, borderRadius: '50%', transform: 'translate(30%, -30%)' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 40, position: 'relative', zIndex: 10 }}>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFD600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Investimento</div>
                <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16, lineHeight: 1.1 }}>{proposta.titulo || 'Proposta Estratégica'}</h2>
                <p style={{ color: '#999', fontSize: 15, lineHeight: 1.6 }}>Um investimento focado em gerar o retorno que a {clienteNome} merece.</p>
              </div>

              <div style={{ background: '#111', padding: '32px', border: '1px solid #222', minWidth: 300 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 15, color: '#999' }}>
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {proposta.desconto > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 15, color: '#FFD600' }}>
                    <span>Desconto Aplicado</span>
                    <span>- {fmt(descontoVal)}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid #333', margin: '24px 0' }} />
                <div style={{ fontSize: 14, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total do Investimento</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{fmt(proposta.valorTotal || 0)}</div>
                {proposta.periodo && <div style={{ color: '#666', fontSize: 14, marginTop: 8 }}>por período: {proposta.periodo}</div>}
              </div>
            </div>

            {proposta.observacoes && (
              <div style={{ marginTop: 40, paddingTop: 40, borderTop: '1px solid #222', position: 'relative', zIndex: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFD600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Observações Importantes</div>
                <p style={{ color: '#999', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{proposta.observacoes}</p>
              </div>
            )}
          </div>

          {/* CTA ACTION */}
          <div style={{ marginTop: 64, textAlign: 'center' }}>
            {!isExpired && !isApproved && (
              <>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, color: '#0A0A0A' }}>Tudo pronto para iniciarmos?</h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <a 
                    href={`https://wa.me/${AGENCY_WHATSAPP}?text=Ol%C3%A1%2C%20gostaria%20de%20aceitar%20a%20proposta%20comercial!`}
                    target="_blank" rel="noreferrer" onClick={handleAccept}
                    style={{ background: '#FFD600', color: '#0A0A0A', padding: '20px 40px', fontSize: 16, fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}
                  >
                    Aceitar Proposta <ChevronRight size={20} strokeWidth={3} />
                  </a>
                  <a 
                    href={`mailto:${AGENCY_EMAIL}?subject=Aceite%20de%20Proposta%20Comercial`}
                    onClick={handleAccept}
                    style={{ background: '#F5F5F5', color: '#0A0A0A', padding: '20px 40px', fontSize: 16, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <Mail size={20} /> Falar por E-mail
                  </a>
                </div>
              </>
            )}
            {isApproved && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: '#0A0A0A', color: '#FFD600', padding: '24px 48px', fontSize: 20, fontWeight: 800 }}>
                <ShieldCheck size={32} /> Proposta Aprovada com Sucesso!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0A0A0A', padding: '64px 20px', textAlign: 'center', color: '#666' }}>
        <img src="/logo.png" alt="foryou.lab" style={{ height: 24, filter: 'invert(1)', opacity: 0.3, margin: '0 auto 24px' }} />
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>ESTRATÉGIA • CRIATIVIDADE • DADOS • RESULTADOS</div>
        <p style={{ fontSize: 12 }}>© {new Date().getFullYear()} {AGENCY_NAME}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
