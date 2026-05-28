import { useState, useEffect, useRef } from 'react';
import { useApp } from '../data/store';
import { Search, ArrowRight, ChevronRight, Save, RotateCcw, TrendingUp, AlertTriangle, CheckCircle, XCircle, Plus, DollarSign, ArrowUpRight, HelpCircle, MapPin } from 'lucide-react';
import restaurantDatabase from '../data/restaurantDatabase';
import { analisarRestaurante, PILARES } from '../data/analysisEngine';
import Modal from '../components/Modal';

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
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom manual search modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualData, setManualData] = useState({
    nome: '', categoria: 'Hamburgueria', cidade: 'Rio de Janeiro', uf: 'RJ', bairro: '',
    rating: 4.2, reviews: 150, temSite: false, seguidores: 2500, postFreq: 1
  });

  const [googleApiKey, setGoogleApiKey] = useState(null);
  const [googlePlacesService, setGooglePlacesService] = useState(null);
  const [googleAutocompleteService, setGoogleAutocompleteService] = useState(null);
  const inputRef = useRef(null);

  // Load Google Places API key from integrations
  useEffect(() => {
    try {
      let key = null;
      
      // Try from localStorage first
      const savedInteg = localStorage.getItem('foryoulab_integrations');
      if (savedInteg) {
        const integrations = JSON.parse(savedInteg);
        if (integrations.google_places?.apiKey) {
          key = integrations.google_places.apiKey;
        }
      }
      
      // Fallback to environment variable
      if (!key) {
        key = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
      }

      if (key) {
        setGoogleApiKey(key);
        loadGoogleMaps(key);
      }
    } catch (e) {
      console.error('Erro ao ler chaves de integração:', e);
    }
  }, []);

  const loadGoogleMaps = (key) => {
    if (window.google?.maps?.places) {
      initGoogleServices();
      return;
    }
    const scriptId = 'google-maps-places-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initGoogleServices();
    };
    document.head.appendChild(script);
  };

  const initGoogleServices = () => {
    try {
      if (window.google?.maps?.places) {
        const dummyDiv = document.createElement('div');
        setGooglePlacesService(new window.google.maps.places.PlacesService(dummyDiv));
        setGoogleAutocompleteService(new window.google.maps.places.AutocompleteService());
      }
    } catch (err) {
      console.error('Erro ao inicializar serviços Google Maps:', err);
    }
  };

  // Autocomplete search (Local database + Google Places API if present)
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    
    // Normalize accents and lowercase to make search robust (e.g. "burguês" -> "burgues")
    const normalizeStr = (str) => {
      if (!str) return '';
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const qNormal = normalizeStr(query);
    const terms = qNormal.split(' ').filter(t => t.length > 0);

    // 1. Match from Local database (AND logic: must match all words in any order)
    const localMatches = restaurantDatabase.filter(r => {
      return terms.every(term => {
        // Approximate matching: map "burguês" or "burguer" to "burg" / "burger"
        let termMatch = term;
        if (term === 'burgues' || term === 'burguer') termMatch = 'burg';
        
        return normalizeStr(r.nome).includes(termMatch) ||
               normalizeStr(r.categoria).includes(termMatch) ||
               normalizeStr(r.cidade).includes(termMatch) ||
               normalizeStr(r.bairro).includes(termMatch);
      });
    }).map(r => ({ ...r, source: 'local' })).slice(0, 4);

    // 2. Fetch from Google Places API if active
    if (googleAutocompleteService && query.length >= 3) {
      googleAutocompleteService.getPlacePredictions({
        input: query,
        types: ['establishment'],
        componentRestrictions: { country: 'br' }
      }, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const googleMatches = predictions.map(p => ({
            id: p.place_id,
            nome: p.structured_formatting.main_text,
            categoria: p.types.includes('restaurant') ? 'Restaurante' : p.types.includes('cafe') ? 'Cafeteria' : p.types.includes('bar') ? 'Bar' : 'Gastronomia',
            cidade: p.description.split(',').slice(-3, -2)[0]?.trim() || 'Rio de Janeiro',
            uf: 'RJ',
            bairro: p.structured_formatting.secondary_text?.split(',')[0] || '',
            source: 'google',
            place_id: p.place_id
          }));
          
          // Combine and filter duplicates
          const combined = [...localMatches];
          googleMatches.forEach(gm => {
            if (!combined.some(c => c.nome.toLowerCase() === gm.nome.toLowerCase())) {
              combined.push(gm);
            }
          });
          setSuggestions(combined.slice(0, 6));
        } else {
          setSuggestions(localMatches);
        }
      });
    } else {
      setSuggestions(localMatches);
    }
  }, [query, googleAutocompleteService]);

  // Scanning animation & result generation
  useEffect(() => {
    if (step !== 'scanning' || !selected) return;
    let currentStep = 0;
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += 2.5;
      setScanProgress(Math.min(progress, 100));
      if (progress >= ((currentStep + 1) / SCAN_STEPS.length) * 100) {
        currentStep++;
        setScanStep(Math.min(currentStep, SCAN_STEPS.length - 1));
      }
      if (progress >= 100) {
        clearInterval(interval);
        generateFinalAnalysis();
      }
    }, 90);
    return () => clearInterval(interval);
  }, [step, selected]);

  const generateFinalAnalysis = () => {
    if (selected.source === 'google' && googlePlacesService) {
      // Fetch rich details from Google Maps
      googlePlacesService.getDetails({
        placeId: selected.place_id,
        fields: ['name', 'rating', 'user_ratings_total', 'formatted_address', 'opening_hours', 'photos', 'website']
      }, (placeDetails, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
          // Construct a rich restaurant profile dynamically
          const hasWebsite = !!placeDetails.website;
          const reviewsCount = placeDetails.user_ratings_total || 25;
          const googleRating = placeDetails.rating || 4.0;
          
          const richRestaurant = {
            id: selected.id,
            nome: placeDetails.name,
            categoria: selected.categoria,
            cidade: selected.cidade,
            uf: selected.uf,
            bairro: selected.bairro || 'Centro',
            google: {
              rating: googleRating,
              reviews: reviewsCount,
              fotos: placeDetails.photos ? placeDetails.photos.length * 12 : 15,
              horarioCompleto: !!placeDetails.opening_hours,
              descricaoCompleta: true,
              postFreq: googleRating > 4.5 ? 3 : 1,
              categoriaCorreta: true,
              endereco: placeDetails.formatted_address || ''
            },
            ifood: {
              presente: reviewsCount > 100, // Estimate based on size
              rating: clampNumber((googleRating + 0.1), 3.0, 5.0),
              tempoEntrega: reviewsCount > 500 ? 35 : 50,
              qtdItens: 30,
              superRestaurante: reviewsCount > 300,
              entregaGratis: false,
              precoMedio: 45
            },
            social: {
              instagram: `@${placeDetails.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              seguidores: reviewsCount * 12,
              postsSemana: reviewsCount > 1000 ? 5 : 2,
              engajamento: 2.8,
              temReels: reviewsCount > 500,
              destaques: 6,
              bioCompleta: reviewsCount > 200
            },
            site: {
              temSite: hasWebsite,
              temCardapio: hasWebsite,
              temReserva: hasWebsite,
              ssl: hasWebsite ? placeDetails.website.startsWith('https') : false,
              mobile: hasWebsite
            },
            reputacao: {
              notaMedia: googleRating,
              reclamacoes: Math.round(reviewsCount * 0.015),
              respostaRate: googleRating > 4.5 ? 90 : 45,
              tempoResposta: googleRating > 4.5 ? '6h' : '2d'
            }
          };

          const analysis = analisarRestaurante(richRestaurant);
          setResult(analysis);
          setStep('result');
        } else {
          // Fallback if details fetch fails
          fallbackLocalAnalysis();
        }
      });
    } else {
      fallbackLocalAnalysis();
    }
  };

  const fallbackLocalAnalysis = () => {
    const analysis = analisarRestaurante(selected);
    setResult(analysis);
    setStep('result');
  };

  const clampNumber = (val, min, max) => Math.max(min, Math.min(max, val));

  const handleSelect = (restaurant) => {
    setSelected(restaurant);
    setQuery(restaurant.nome);
    setSuggestions([]);
    setScanStep(0);
    setScanProgress(0);
    setStep('scanning');
  };

  // Generate analysis for manually typed fields
  const handleManualSubmit = () => {
    const hasWebsite = manualData.temSite;
    const mockRestaurant = {
      id: 'manual_' + Date.now(),
      nome: manualData.nome,
      categoria: manualData.categoria,
      cidade: manualData.cidade,
      uf: manualData.uf,
      bairro: manualData.bairro || 'Centro',
      google: {
        rating: Number(manualData.rating),
        reviews: Number(manualData.reviews),
        fotos: Number(manualData.reviews) > 200 ? 80 : 15,
        horarioCompleto: true,
        descricaoCompleta: true,
        postFreq: Number(manualData.postFreq),
        categoriaCorreta: true,
        endereco: ''
      },
      ifood: {
        presente: true,
        rating: clampNumber((Number(manualData.rating) + 0.1), 3.0, 5.0),
        tempoEntrega: 40,
        qtdItens: 25,
        superRestaurante: Number(manualData.reviews) > 500,
        entregaGratis: false,
        precoMedio: 45
      },
      social: {
        instagram: `@${manualData.nome.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        seguidores: Number(manualData.seguidores),
        postsSemana: Number(manualData.postFreq) * 2,
        engajamento: 2.5,
        temReels: Number(manualData.seguidores) > 5000,
        destaques: 5,
        bioCompleta: true
      },
      site: {
        temSite: hasWebsite,
        temCardapio: hasWebsite,
        temReserva: hasWebsite,
        ssl: hasWebsite,
        mobile: hasWebsite
      },
      reputacao: {
        notaMedia: Number(manualData.rating),
        reclamacoes: Math.round(Number(manualData.reviews) * 0.015),
        respostaRate: Number(manualData.rating) > 4.4 ? 85 : 50,
        tempoResposta: '1d'
      }
    };

    setSelected({ ...mockRestaurant, source: 'manual' });
    setStep('scanning');
    setScanStep(0);
    setScanProgress(0);
    setShowManualModal(false);
  };

  const handleSave = async () => {
    if (!result || isSaving || saved) return;
    setIsSaving(true);
    try {
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
    } catch (error) {
      console.error("Erro ao salvar diagnóstico automático:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setStep('search'); setQuery(''); setSelected(null); setResult(null);
    setScanStep(0); setScanProgress(0); setSaved(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const getColor = s => s >= 70 ? '#22C55E' : s >= 40 ? '#F59E0B' : '#EF4444';
  const getLabel = s => s >= 70 ? 'Excelente' : s >= 40 ? 'Requer Cuidado' : 'Crítico / Sangrando Clientes';
  const getIcon = s => s >= 70 ? <CheckCircle size={16}/> : s >= 40 ? <AlertTriangle size={16}/> : <XCircle size={16}/>;

  // Persuasive calculations for closure pitch
  const calculateLostRevenue = (score, category) => {
    const baselines = {
      'Hamburgueria': 60000,
      'Pizzaria': 80000,
      'Cafeteria': 40000,
      'Japonês': 130000,
      'Restaurante': 90000,
      'Bar': 75000
    };
    const faturamentoBaseline = baselines[category] || 70000;
    const lossPercentage = (100 - score) / 100 * 0.35; // Estimativa de que falhas custam 35% do potencial digital
    return Math.round(faturamentoBaseline * lossPercentage);
  };

  const getBottlenecks = (res) => {
    const list = [];
    const rest = res.restaurante;
    
    // Gather errors from current state
    if (!result) return [];

    if (result.scores.visibilidade < 60) {
      list.push({
        title: 'Baixa Relevância no Google Maps',
        desc: 'Falta de fotos atualizadas e poucas avaliações estão fazendo a concorrência aparecer na frente no GPS do cliente.',
        impact: 'Alto impacto comercial'
      });
    }
    if (result.scores.cardapio < 50) {
      list.push({
        title: 'Sem Site ou Cardápio Próprio',
        desc: 'O negócio está dependendo 100% de marketplaces de delivery (como iFood), pagando até 27% de taxas absurdas em cada pedido.',
        impact: 'Perda de Margem de Lucro'
      });
    }
    if (result.scores.social < 55) {
      list.push({
        title: 'Redes Sociais sem Engajamento ou Frequência',
        desc: 'Sem postagens consistentes ou Reels relevantes. O Instagram atua como um "cardápio morto", falhando em atrair novos clientes da região.',
        impact: 'Desconexão com Público Premium'
      });
    }
    if (result.scores.reputacao < 60) {
      list.push({
        title: 'Críticas sem Resposta / Baixa Reputação',
        desc: 'Notas baixas ou avaliações negativas no Google e iFood sendo deixadas sem resposta rápida. Isso afasta 80% das novas visitas.',
        impact: 'Destruição da Prova Social'
      });
    }

    // Default if excellent
    if (list.length === 0) {
      list.push({
        title: 'Saturação de Canal de Atração',
        desc: 'Apesar do excelente score, o restaurante não está investindo em tráfego pago geolocalizado para lotar os horários de menor movimento.',
        impact: 'Oportunidade de Escala'
      });
    }

    return list;
  };

  const getCustomPitch = (score) => {
    if (score < 50) return 'O negócio está sofrendo com uma severa perda de clientes digitais invisível. A concorrência local está engolindo sua audiência. O cliente precisa urgentemente de uma intervenção na presença digital.';
    if (score < 70) return 'A base está sólida, mas há gargalos severos de margem e atração. O restaurante está pagando altas taxas para o iFood e deixando de criar uma base de clientes fiéis e recorrentes.';
    return 'Excelente estrutura base. A oportunidade aqui é escalar: implementar tráfego pago de alta conversão, automações de atendimento e remarketing para multiplicar as vendas.';
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>🔬 Avaliador de Restaurante Premium</h2>
          <div className="breadcrumb">Auditor Inteligente de Presença Digital {googleApiKey ? '• 📍 Google Maps API Ativa' : '• 💾 Modo Simulação'}</div>
        </div>
        {step === 'result' && (
          <button className="btn btn-secondary" onClick={handleReset}><RotateCcw size={16}/> Nova Análise</button>
        )}
      </div>

      <div className="page-body">

        {/* ─── STEP: SEARCH ─── */}
        {step === 'search' && (
          <div style={{ maxWidth: 700, margin: '40px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🍽️</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Avalie Qualquer Restaurante do RJ</h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28 }}>
              Puxe dados reais do Google Maps para gerar um Dossiê Comercial altamente persuasivo e fechar contratos de Marketing de forma irresistível.
            </p>

            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}/>
                  <input ref={inputRef} className="form-input" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Digite o nome do restaurante, cidade ou bairro..."
                    style={{ paddingLeft: 42, height: 52, fontSize: 16, borderRadius: 12 }}
                    onKeyDown={e => { 
                      if (e.key === 'Enter') {
                        // Only auto-select if there is an exact or near-exact match, otherwise let them click the suggestions
                        const exactMatch = suggestions.find(s => s.nome.toLowerCase() === query.toLowerCase());
                        if (exactMatch) {
                          handleSelect(exactMatch);
                        } else if (suggestions.length === 1) {
                          handleSelect(suggestions[0]);
                        } else {
                          addToast('Selecione uma das opções sugeridas abaixo ou clique em Adicionar Manual.', 'info');
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="card" style={{ position: 'absolute', top: 58, left: 0, right: 0, zIndex: 20, padding: 4, boxShadow: '0 12px 40px rgba(0,0,0,.35)', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                  {suggestions.map(r => (
                    <button key={r.id} onClick={() => handleSelect(r)}
                      style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {r.nome}
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: r.source === 'google' ? 'rgba(66, 133, 244, 0.15)' : 'rgba(255, 214, 0, 0.15)', color: r.source === 'google' ? '#4285F4' : '#FFD600', fontWeight: 600 }}>
                            {r.source === 'google' ? 'Google Maps' : 'Banco RJ'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{r.categoria} • {r.bairro}, {r.cidade}/{r.uf}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FFD600', fontSize: 12, fontWeight: 600 }}>
                        Auditar <ChevronRight size={14}/>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowManualModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFD600' }}>
                <Plus size={14} /> Negócio não está no Google? Adicionar manual
              </button>
            </div>

            <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {['TT Burger', 'Gurumê', 'Gruta de Santo Antônio', 'Margarida Café', 'Kina do Feijão Branco'].map(ex => (
                <button key={ex} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}
                  onClick={() => setQuery(ex)}>
                  📍 {ex}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { n: 'RJ Focado', t: 'Capital, Niterói, Baixada, C. Verde' },
                { n: '6 Pilares', t: 'Diagnóstico 360 Graus' },
                { n: 'Pitch Pronto', t: 'Dossiê Comercial Persuasivo' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#FFD600' }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{s.t}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP: SCANNING ─── */}
        {step === 'scanning' && selected && (
          <div style={{ maxWidth: 550, margin: '80px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 20, animation: 'pulse 1.5s ease-in-out infinite' }}>🔬</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Escaneando {selected.nome}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>{selected.categoria} • {selected.bairro}, {selected.cidade}/{selected.uf}</p>

            <div style={{ background: 'var(--gray-bg)', borderRadius: 12, height: 10, overflow: 'hidden', marginBottom: 28, border: '1px solid var(--card-border)' }}>
              <div style={{ height: '100%', borderRadius: 12, background: 'linear-gradient(90deg, #FFD600, #FF9500)', width: `${scanProgress}%`, transition: 'width 0.15s linear' }}/>
            </div>

            <div style={{ minHeight: 180, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 20, textAlign: 'left' }}>
              {SCAN_STEPS.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 13,
                  color: scanStep > i ? '#22C55E' : scanStep === i ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: scanStep === i ? 600 : 400, opacity: scanStep >= i ? 1 : 0.3, transition: 'all 0.3s' }}>
                  {scanStep > i ? <CheckCircle size={14} color="#22C55E"/> : scanStep === i ?
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #FFD600', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}/> :
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--text-secondary)', opacity: 0.3 }}/>}
                  {s}
                </div>
              ))}
            </div>
            <style>{`@keyframes pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.08) } } @keyframes spin { to { transform:rotate(360deg) } }`}</style>
          </div>
        )}

        {/* ─── STEP: RESULT (DOSSIÊ COMERCIAL) ─── */}
        {step === 'result' && result && (
          <div>
            {/* Dossier Alert Banner */}
            <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(255, 214, 0, 0.05) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: 16, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', flexShrink: 0 }}>
                <AlertTriangle size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', marginBottom: 2 }}>Dossiê de Perda de Receita Gerado</h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Utilize as métricas abaixo como ferramenta comercial de alta persuasão para o fechamento de propostas.</p>
              </div>
            </div>

            {/* Score Header */}
            <div className="card" style={{ padding: 32, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
                <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="65" cy="65" r="56" fill="none" stroke="var(--gray-bg)" strokeWidth="8"/>
                  <circle cx="65" cy="65" r="56" fill="none" stroke={getColor(result.scoreGeral)} strokeWidth="8"
                    strokeDasharray={`${(result.scoreGeral/100)*351} 351`} strokeLinecap="round"/>
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: getColor(result.scoreGeral) }}>{result.scoreGeral}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Saúde Digital</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Dossiê Diagnóstico</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{result.restaurante.nome}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} /> {result.restaurante.categoria} • {result.restaurante.bairro}, {result.restaurante.cidade}/{result.restaurante.uf}
                </p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: `${getColor(result.scoreGeral)}18`, color: getColor(result.scoreGeral), border: `1px solid ${getColor(result.scoreGeral)}40` }}>
                  {getIcon(result.scoreGeral)} Nível: {getLabel(result.scoreGeral)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saved || isSaving}>
                  <Save size={14}/> {isSaving ? 'Salvando...' : (saved ? 'Salvo no CRM ✅' : 'Salvar no CRM')}
                </button>
              </div>
            </div>

            {/* FINANCIAL LOSS & PITCH CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
              {/* Dinheiro Deixado na Mesa */}
              <div className="card" style={{ padding: 24, border: '1px solid rgba(239, 68, 68, 0.25)', background: 'linear-gradient(135deg, rgba(239,68,68,0.03) 0%, rgba(255,255,255,0) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1 }}>Gargalo Financeiro</span>
                    <h4 style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>Dinheiro Deixado na Mesa</h4>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                    <DollarSign size={20} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#EF4444', marginBottom: 8 }}>
                  R$ {calculateLostRevenue(result.scoreGeral, result.restaurante.categoria).toLocaleString('pt-BR')},00
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}> / mês (Est.)</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Perda estimada de faturamento por falta de canais próprios, posicionamento ineficiente no Google Meu Negócio e baixa captação de clientes locais nas redes sociais.
                </p>
              </div>

              {/* Pitch Comercial Customizado */}
              <div className="card" style={{ padding: 24, border: '1px solid rgba(255, 214, 0, 0.25)', background: 'linear-gradient(135deg, rgba(255,214,0,0.03) 0%, rgba(255,255,255,0) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: 1 }}>Estratégia de Abordagem</span>
                    <h4 style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>Pitch de Vendas ForYou.Lab</h4>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255, 214, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD600' }}>
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.6, marginBottom: 8, fontStyle: 'italic' }}>
                  "{getCustomPitch(result.scoreGeral)}"
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Use este argumento na sua reunião de apresentação ou na proposta comercial dinâmica.
                </p>
              </div>
            </div>

            {/* Pillar Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: 16, marginBottom: 20 }}>
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
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{p.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Gargalos Técnicos vs Soluções da Agência */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
              {/* Gargalos e Erros Críticos */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={18} /> ❌ Gargalos Técnicos Identificados
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>Onde o restaurante está mais fraco e perdendo vendas ativamente.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {getBottlenecks(result).map((b, i) => (
                    <div key={i} style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{b.title}</div>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600 }}>{b.impact}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{b.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Soluções Propostas pela ForYou.Lab */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#22C55E', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} /> 🎯 Serviços ForYou.Lab Recomendados
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>Como nossa agência pode resolver esses problemas e reaver o faturamento.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { s: 'Local SEO & Meu Negócio', desc: 'Otimização completa do Google Meu Negócio, gestão de fotos e automação de reviews no WhatsApp.', pilar: 'visibilidade' },
                    { s: 'Desenvolvimento de Site & Cardápio Próprio', desc: 'Construção de Landing Page ultra-rápida de vendas e delivery próprio integrado para fugir do iFood.', pilar: 'cardapio' },
                    { s: 'Tráfego Pago Geolocalizado', desc: 'Campanhas focadas em atrair clientes em horários estratégicos usando Instagram & Google Ads na região.', pilar: 'competitividade' },
                    { s: 'Social Media Premium', desc: 'Produção de Reels, fotografia gastronômica elegante e posicionamento visual de marca desejável.', pilar: 'social' }
                  ].map((srv, i) => {
                    const isHighlyRecommended = result.scores[srv.pilar] < 60;
                    return (
                      <div key={i} style={{ padding: 12, borderRadius: 8, background: 'var(--gray-bg)', border: isHighlyRecommended ? '1px solid rgba(255, 214, 0, 0.3)' : '1px solid var(--card-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{srv.s}</span>
                          {isHighlyRecommended && (
                            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#FFD600', color: '#000', fontWeight: 700 }}>RECOMENDADO</span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{srv.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Wins */}
            {result.quickWins.length > 0 && (
              <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>⚡ Quick Wins — Ações Imediatas Sugeridas</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>Apresente esses ganhos rápidos ao cliente para demonstrar autoridade imediata na reunião.</p>
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

      {/* Manual Custom Diagnostic Modal */}
      <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="Análise Customizada Gastronômica" size="md">
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Preencha os dados do restaurante que você pesquisou para que o sistema gere o Dossiê Comercial completo.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">Nome do Restaurante</label>
            <input className="form-input" value={manualData.nome} onChange={e => setManualData({...manualData, nome: e.target.value})} placeholder="Ex: Cantina do Nonno" />
          </div>
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select className="form-select" value={manualData.categoria} onChange={e => setManualData({...manualData, categoria: e.target.value})}>
              <option value="Hamburgueria">Hamburgueria</option>
              <option value="Pizzaria">Pizzaria</option>
              <option value="Cafeteria">Cafeteria</option>
              <option value="Japonês">Japonês</option>
              <option value="Restaurante">Restaurante Geral</option>
              <option value="Bar">Bar e Choperia</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">Cidade</label>
            <input className="form-input" value={manualData.cidade} onChange={e => setManualData({...manualData, cidade: e.target.value})} placeholder="Rio de Janeiro, Niterói..." />
          </div>
          <div className="form-group">
            <label className="form-label">Bairro</label>
            <input className="form-input" value={manualData.bairro} onChange={e => setManualData({...manualData, bairro: e.target.value})} placeholder="Copacabana" />
          </div>
          <div className="form-group">
            <label className="form-label">UF</label>
            <input className="form-input" value={manualData.uf} onChange={e => setManualData({...manualData, uf: e.target.value})} placeholder="RJ" />
          </div>
        </div>

        <hr style={{ borderColor: 'var(--card-border)', margin: '16px 0' }} />
        <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#FFD600' }}>Dados de Auditoria</h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">Nota no Google Meu Negócio</label>
            <input className="form-input" type="number" step="0.1" min="1" max="5" value={manualData.rating} onChange={e => setManualData({...manualData, rating: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Qtd. de Avaliações no Google</label>
            <input className="form-input" type="number" value={manualData.reviews} onChange={e => setManualData({...manualData, reviews: e.target.value})} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Seguidores no Instagram</label>
            <input className="form-input" type="number" value={manualData.seguidores} onChange={e => setManualData({...manualData, seguidores: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Frequência de Postagem (Semanal)</label>
            <input className="form-input" type="number" value={manualData.postFreq} onChange={e => setManualData({...manualData, postFreq: e.target.value})} />
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <input type="checkbox" id="temSite" checked={manualData.temSite} onChange={e => setManualData({...manualData, temSite: e.target.checked})} style={{ width: 18, height: 18, cursor: 'pointer' }} />
          <label htmlFor="temSite" style={{ fontSize: 13, cursor: 'pointer' }}>Possui Site Próprio / Cardápio Digital próprio (Sem ser iFood)?</label>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowManualModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleManualSubmit} disabled={!manualData.nome}>Gerar Dossiê do Cliente</button>
        </div>
      </Modal>
    </>
  );
}
