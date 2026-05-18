import { useState, useEffect, useRef } from 'react';
import { useApp } from '../data/store';
import { Search, ArrowRight, ChevronRight, Save, Share2, RotateCcw, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import restaurantDatabase from '../data/restaurantDatabase';
import { analisarRestaurante, PILARES } from '../data/analysisEngine';

const SCAN_STEPS = [
  'Buscando perfil no Google Meu Negócio...',
  'Analisando visibilidade local e reviews...',
  'Verificando presença no iFood e delivery...',
  'Escaneando reputação e reclamações...',
  'Avaliando site e cardápio digital...',
  'Analisando Instagram e redes sociais...',
  'Calculando score de saúde digital...',
  'Gerando Quick Wins priorizados...',
];

export default function AvaliadorRestaurante() {
  const { addItem, addToast } = useApp();
  const [step, setStep] = useState('search'); // search | scanning | result
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [scanStep, setScanStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef(null);

  // Autocomplete search
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    const matches = restaurantDatabase.filter(r =>
      r.nome.toLowerCase().includes(q) ||
      r.categoria.toLowerCase().includes(q) ||
      r.cidade.toLowerCase().includes(q) ||
      r.bairro.toLowerCase().includes(q)
    ).slice(0, 6);
    setSuggestions(matches);
  }, [query]);

  // Scanning animation
  useEffect(() => {
    if (step !== 'scanning' || !selected) return;
    let currentStep = 0;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setScanProgress(Math.min(progress, 100));
      if (progress >= ((currentStep + 1) / SCAN_STEPS.length) * 100) {
        currentStep++;
        setScanStep(currentStep);
      }
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const analysis = analisarRestaurante(selected);
          setResult(analysis);
          setStep('result');
        }, 400);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [step, selected]);

  const handleSelect = (restaurant) => {
    setSelected(restaurant);
    setQuery(restaurant.nome);
    setSuggestions([]);
    setScanStep(0);
    setScanProgress(0);
    setStep('scanning');
  };

  const handleSave = async () => {
    if (!result) return;
    const diagData = {
      nomeNegocio: result.restaurante.nome,
      categoria: result.restaurante.categoria,
      cidade: `${result.restaurante.cidade}/${result.restaurante.uf}`,
      scoreGeral: result.scoreGeral,
      scores: result.scores,
      quickWins: result.quickWins.map(w => ({ area: w.pilar, pergunta: w.acao, prioridade: w.impacto })),
      blocos: PILARES.map(p => ({ id: p.id, title: `${p.icon} ${p.label}`, score: result.scores[p.id], status: result.scores[p.id] >= 70 ? 'Saudável' : result.scores[p.id] >= 40 ? 'Requer Atenção' : 'Crítico' })),
      radarData: PILARES.map(p => ({ area: p.label.split(' ')[0], score: result.scores[p.id], fullMark: 100 })),
      fonte: 'avaliador-automatico',
      criadoEm: new Date().toISOString()
    };
    await addItem('diagnosticos', diagData);
    setSaved(true);
    addToast('Análise salva no módulo Diagnósticos! ✅');
  };

  const handleReset = () => {
    setStep('search'); setQuery(''); setSelected(null); setResult(null);
    setScanStep(0); setScanProgress(0); setSaved(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const getColor = s => s >= 70 ? '#22C55E' : s >= 40 ? '#F59E0B' : '#EF4444';
  const getLabel = s => s >= 70 ? 'Saudável' : s >= 40 ? 'Requer Atenção' : 'Crítico';
  const getIcon = s => s >= 70 ? <CheckCircle size={16}/> : s >= 40 ? <AlertTriangle size={16}/> : <XCircle size={16}/>;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🔬 Avaliador de Restaurante</h2>
          <div className="breadcrumb">Análise automática de presença digital — estilo Yooga</div>
        </div>
        {step === 'result' && (
          <button className="btn btn-secondary" onClick={handleReset}><RotateCcw size={16}/> Nova Análise</button>
        )}
      </div>

      <div className="page-body">

        {/* ─── STEP: SEARCH ─── */}
        {step === 'search' && (
          <div style={{ maxWidth: 700, margin: '60px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Avalie qualquer restaurante</h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>
              Digite o nome do estabelecimento e receba um diagnóstico completo de presença digital em segundos.
            </p>

            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}/>
                  <input ref={inputRef} className="form-input" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Ex: Burger Lab, Pizzaria Forneria, Sushi Kyo..."
                    style={{ paddingLeft: 42, height: 52, fontSize: 16, borderRadius: 12 }}
                    onKeyDown={e => { if (e.key === 'Enter' && suggestions.length > 0) handleSelect(suggestions[0]); }}
                  />
                </div>
              </div>

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="card" style={{ position: 'absolute', top: 58, left: 0, right: 0, zIndex: 20, padding: 4, boxShadow: '0 12px 40px rgba(0,0,0,.15)' }}>
                  {suggestions.map(r => (
                    <button key={r.id} onClick={() => handleSelect(r)}
                      style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{r.nome}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.categoria} • {r.bairro}, {r.cidade}/{r.uf}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FFD600', fontSize: 12, fontWeight: 600 }}>
                        Analisar <ChevronRight size={14}/>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {['Hamburgueria', 'Pizzaria', 'Cafeteria', 'Japonês', 'Bar'].map(cat => (
                <button key={cat} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}
                  onClick={() => setQuery(cat)}>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { n: '25+', t: 'Restaurantes na base' },
                { n: '6', t: 'Pilares avaliados' },
                { n: '0-100', t: 'Score de saúde digital' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#FFD600' }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{s.t}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP: SCANNING ─── */}
        {step === 'scanning' && selected && (
          <div style={{ maxWidth: 550, margin: '80px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 20, animation: 'pulse 1.5s ease-in-out infinite' }}>🔬</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Analisando {selected.nome}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>{selected.categoria} • {selected.bairro}, {selected.cidade}/{selected.uf}</p>

            <div style={{ background: 'var(--gray-bg)', borderRadius: 12, height: 8, overflow: 'hidden', marginBottom: 24 }}>
              <div style={{ height: '100%', borderRadius: 12, background: 'linear-gradient(90deg, #FFD600, #FF9500)', width: `${scanProgress}%`, transition: 'width 0.15s linear' }}/>
            </div>

            <div style={{ minHeight: 60 }}>
              {SCAN_STEPS.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13,
                  color: scanStep > i ? '#22C55E' : scanStep === i ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: scanStep === i ? 600 : 400, opacity: scanStep >= i ? 1 : 0.3, transition: 'all 0.3s' }}>
                  {scanStep > i ? <CheckCircle size={14} color="#22C55E"/> : scanStep === i ?
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #FFD600', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}/> :
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--text-secondary)', opacity: 0.3 }}/>}
                  {s}
                </div>
              ))}
            </div>
            <style>{`@keyframes pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.1) } } @keyframes spin { to { transform:rotate(360deg) } }`}</style>
          </div>
        )}

        {/* ─── STEP: RESULT ─── */}
        {step === 'result' && result && (
          <div>
            {/* Score Header */}
            <div className="card" style={{ padding: 32, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--gray-bg)" strokeWidth="8"/>
                  <circle cx="60" cy="60" r="52" fill="none" stroke={getColor(result.scoreGeral)} strokeWidth="8"
                    strokeDasharray={`${(result.scoreGeral/100)*327} 327`} strokeLinecap="round"/>
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: getColor(result.scoreGeral) }}>{result.scoreGeral}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>/ 100</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Resultado da Análise</div>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{result.restaurante.nome}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  {result.restaurante.categoria} • {result.restaurante.bairro}, {result.restaurante.cidade}/{result.restaurante.uf}
                </p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: `${getColor(result.scoreGeral)}18`, color: getColor(result.scoreGeral), border: `1px solid ${getColor(result.scoreGeral)}40` }}>
                  {getIcon(result.scoreGeral)} {getLabel(result.scoreGeral)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saved}>
                  <Save size={14}/> {saved ? 'Salvo ✅' : 'Salvar Análise'}
                </button>
              </div>
            </div>

            {/* Pillar Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
              {PILARES.map(p => {
                const s = result.scores[p.id];
                return (
                  <div key={p.id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{p.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</span>
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: getColor(s) }}>{s}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--gray-bg)', overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ height: '100%', borderRadius: 4, background: getColor(s), width: `${s}%`, transition: 'width 1s ease-out' }}/>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Quick Wins */}
            {result.quickWins.length > 0 && (
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>⚡ Quick Wins — Ações Prioritárias</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>Implemente essas melhorias para aumentar seu score rapidamente.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                  {result.quickWins.map((w, i) => (
                    <div key={i} style={{ padding: 16, borderRadius: 8, border: '1px solid var(--card-border)', background: 'var(--gray-bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: 1 }}>{w.pilar}</span>
                        <span className={`badge ${w.impacto === 'alto' ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: 10 }}>
                          {w.impacto === 'alto' ? '🔴 Alto Impacto' : '🟡 Médio Impacto'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{w.acao}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
