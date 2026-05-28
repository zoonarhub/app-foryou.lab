import { useState } from 'react';
import { useApp } from '../data/store';
import { BarChart3, FileText, Plus, Check, Save, Trash2, Eye, Calendar, Search, ArrowLeft, TrendingUp, AlertTriangle } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const blocos = [
  { id: 'posicionamento', title: '🎯 Posicionamento Gastronômico', perguntas: ['A marca do restaurante transmite valor premium?', 'O cardápio físico/digital tem engenharia de menu aplicada?', 'O ambiente/embalagem de entrega reforça o posicionamento?', 'O tom de voz e diferencial culinário são claros?'] },
  { id: 'experiencia', title: '🍽️ Experiência & Operação', perguntas: ['O tempo de entrega ou preparo dos pratos é padronizado?', 'A equipe de salão/cozinha recebe treinamento frequente?', 'O cardápio digital tem fotos profissionais dos pratos?', 'Os insumos e processos de cozinha são documentados?'] },
  { id: 'marketing', title: '📱 Atração & Marketing Local', perguntas: ['Investe em tráfego pago focado em reservas e delivery?', 'Posta Reels/Fotos profissionais com apetite appeal frequente?', 'Tem SEO ativo e otimizado no Google Maps?', 'O custo por clique e ROI de delivery são medidos?'] },
  { id: 'financeiro', title: '💰 Saúde Financeira', perguntas: ['Controla rigorosamente o CMV (Custo de Mercadoria Vendida)?', 'Sabe o ticket médio exato de salão vs. delivery?', 'A margem líquida da operação está acima de 20%?', 'A operação fatura com consistência acima de R$ 100k/mês?'] },
  { id: 'retencao', title: '🔄 Recorrência & Fidelidade', perguntas: ['Utiliza programa de fidelidade para incentivar recompra?', 'Possui automação de WhatsApp para recuperar clientes inativos?', 'Tem funil para eventos especiais ou datas comemorativas?', 'Consegue mensurar a taxa de recorrência mensal dos clientes?'] },
];

export default function DiagnosticoEstrategico() {
  const { clients, leads, diagnosticos, addItem, deleteItem, addToast } = useApp();
  const [tab, setTab] = useState(() => (diagnosticos && diagnosticos.length > 0 ? 'historico' : 'novo'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiag, setSelectedDiag] = useState(null);

  // Form states for NEW diagnostic
  const [clienteId, setClienteId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [nomeNegocio, setNomeNegocio] = useState('');
  const [activeBloco, setActiveBloco] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [concluido, setConcluido] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const setResposta = (blocoId, idx, val) => setRespostas(p => ({ ...p, [`${blocoId}_${idx}`]: val }));
  const getResposta = (blocoId, idx) => respostas[`${blocoId}_${idx}`] || 0;

  const calcScore = (blocoId) => {
    const bloco = blocos.find(b => b.id === blocoId);
    if (!bloco) return 0;
    const total = bloco.perguntas.reduce((s, _, i) => s + getResposta(blocoId, i), 0);
    return Math.round((total / (bloco.perguntas.length * 5)) * 100);
  };

  const getStatus = (score) => {
    if (score >= 70) return { label: 'Saudável', color: '#22C55E' };
    if (score >= 40) return { label: 'Requer Atenção', color: '#F59E0B' };
    return { label: 'Crítico', color: '#EF4444' };
  };

  const radarData = blocos.map(b => ({ area: b.title.replace(/[^\wà-úÀ-Ú ]/g, '').trim().split(' ').slice(0, 2).join(' '), score: calcScore(b.id), fullMark: 100 }));
  const avgScore = Math.round(radarData.reduce((s, d) => s + d.score, 0) / radarData.length);

  const getQuickWins = () => {
    const wins = [];
    blocos.forEach(b => {
      const score = calcScore(b.id);
      if (score < 60) {
        b.perguntas.forEach((p, i) => {
          if (getResposta(b.id, i) <= 2) {
            wins.push({ area: b.title.replace(/[^\wà-úÀ-Ú ]/g, '').trim(), pergunta: p, score: getResposta(b.id, i), prioridade: getResposta(b.id, i) <= 1 ? 'alta' : 'media' });
          }
        });
      }
    });
    return wins.sort((a, b) => a.score - b.score).slice(0, 6);
  };

  const getNomeCliente = () => {
    if (nomeNegocio) return nomeNegocio;
    if (clienteId) {
      const c = clients.find(c => c.id === clienteId);
      return c?.empresa || c?.nome || '';
    }
    if (leadId) {
      const l = (leads || []).find(l => l.id === leadId);
      return l?.empresa || l?.nome || '';
    }
    return '';
  };

  const handleConcluir = () => {
    if (!clienteId && !leadId && !nomeNegocio) { addToast('Selecione um cliente, lead ou digite o nome do negócio', 'error'); return; }
    setConcluido(true);
    addToast('Diagnóstico concluído! 🎉');
  };

  const handleSalvar = async () => {
    if (isSaving || salvo) return;
    setIsSaving(true);
    const scores = {};
    blocos.forEach(b => { scores[b.id] = calcScore(b.id); });

    const diagnosticoData = {
      clienteId,
      leadId,
      nomeNegocio: getNomeCliente(),
      scoreGeral: avgScore,
      scores,
      respostas,
      quickWins: getQuickWins(),
      radarData,
      blocos: blocos.map(b => ({ id: b.id, title: b.title, score: calcScore(b.id), status: getStatus(calcScore(b.id)).label })),
      criadoEm: new Date().toISOString()
    };

    try {
      await addItem('diagnosticos', diagnosticoData);
      setSalvo(true);
      addToast('Diagnóstico salvo no banco de dados! ✅');
      // Ir para a lista após salvar
      setTimeout(() => {
        resetForm();
        setTab('historico');
      }, 1500);
    } catch (error) {
      console.error("Erro ao salvar diagnóstico:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setClienteId('');
    setLeadId('');
    setNomeNegocio('');
    setActiveBloco(0);
    setRespostas({});
    setConcluido(false);
    setSalvo(false);
  };

  const gerarPlano = async (diagToUse) => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const gaps = diagToUse.blocos ? diagToUse.blocos.filter(b => b.score < 60) : blocos.filter(b => calcScore(b.id) < 60);
      await Promise.all(gaps.map(async (b) => {
        await addItem('tasks', { 
          titulo: `Melhorar ${b.title.replace(/[^a-zA-Zà-úÀ-Ú ]/g, '')}`, 
          descricao: `Score atual: ${b.score || calcScore(b.id)}% (Identificado no diagnóstico de ${diagToUse.nomeNegocio || getNomeCliente()})`, 
          responsavel: '', 
          status: 'a_fazer', 
          prioridade: (b.score || calcScore(b.id)) < 40 ? 'alta' : 'media', 
          projetoId: '', 
          clienteId: diagToUse.clienteId || clienteId 
        });
      }));
      addToast(`${gaps.length} tarefas criadas no módulo Projetos!`);
    } catch (error) {
      console.error("Erro ao gerar plano de ação:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Deseja realmente excluir este diagnóstico?')) {
      await deleteItem('diagnosticos', id);
      addToast('Diagnóstico excluído com sucesso!', 'warning');
      if (selectedDiag && selectedDiag.id === id) {
        setSelectedDiag(null);
      }
    }
  };

  // Filter diagnostics based on search term
  const filteredDiagnosticos = (diagnosticos || []).filter(d => 
    !searchTerm || (d.nomeNegocio || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Diagnóstico Estratégico Gastronômico</h2>
          <div className="breadcrumb">Avaliação de Performance de Restaurantes Premium</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${tab === 'historico' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab('historico'); setSelectedDiag(null); }}>
            📋 Histórico
          </button>
          <button className={`btn ${tab === 'novo' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTab('novo'); setSelectedDiag(null); resetForm(); }}>
            <Plus size={16} /> Novo Diagnóstico
          </button>
        </div>
      </div>

      <div className="page-body">
        
        {/* VIEW: HISTORICO */}
        {tab === 'historico' && !selectedDiag && (
          <>
            <div className="search-bar" style={{ marginBottom: 20 }}>
              <div className="search-input-wrapper" style={{ maxWidth: 400 }}>
                <Search size={16} />
                <input placeholder="Buscar diagnóstico por nome do restaurante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {filteredDiagnosticos.length === 0 ? (
              <div className="card empty-state" style={{ padding: 48, textAlign: 'center' }}>
                <BarChart3 size={48} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: 16 }} />
                <h4>Nenhum diagnóstico encontrado</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Crie um novo diagnóstico estratégico para avaliar restaurantes e marcas.</p>
                <button className="btn btn-primary" onClick={() => setTab('novo')}><Plus size={16} /> Novo Diagnóstico</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {filteredDiagnosticos.map(d => {
                  const status = getStatus(d.scoreGeral);
                  return (
                    <div key={d.id} className="card" onClick={() => setSelectedDiag(d)} style={{ padding: 20, cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          {d.criadoEm ? new Date(d.criadoEm).toLocaleDateString('pt-BR') : 'Sem data'}
                        </span>
                        <span className="badge" style={{ background: `${status.color}22`, color: status.color, border: `1px solid ${status.color}` }}>
                          {d.scoreGeral}% — {status.label}
                        </span>
                      </div>
                      
                      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{d.nomeNegocio}</h3>
                      
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        {d.clienteId ? '🏢 Cliente Ativo' : d.leadId ? '👤 Lead CRM' : '📝 Nome Manual'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#FFD600', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          Ver detalhes <Eye size={14} />
                        </span>
                        <button className="btn btn-sm btn-secondary" style={{ color: '#EF4444', padding: '4px 8px', minWidth: 'auto' }} onClick={(e) => handleDelete(d.id, e)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* VIEW: DETALHES DE UM DIAGNOSTICO EXISTENTE */}
        {tab === 'historico' && selectedDiag && (
          <div>
            <button className="btn btn-secondary" style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={() => setSelectedDiag(null)}>
              <ArrowLeft size={16} /> Voltar ao Histórico
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className="card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📊 Gráfico de Performance — {selectedDiag.nomeNegocio}</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={selectedDiag.radarData || []}>
                    <PolarGrid stroke="#2a2a2a" />
                    <PolarAngleAxis dataKey="area" stroke="#9CA3AF" fontSize={11} />
                    <PolarRadiusAxis domain={[0, 100]} stroke="#2a2a2a" fontSize={10} />
                    <Radar name="Score" dataKey="score" stroke="#FFD600" fill="#FFD600" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: 24 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: getStatus(selectedDiag.scoreGeral).color }}>{selectedDiag.scoreGeral}%</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Score Geral — {selectedDiag.nomeNegocio}</div>
                </div>
                
                {(selectedDiag.blocos || []).map((b, idx) => {
                  const st = getStatus(b.score);
                  return (
                    <div key={idx} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span>{b.title ? b.title.replace(/[^\wà-ú ]/g, '') : ''}</span>
                        <span style={{ fontWeight: 700, color: st.color }}>{b.score}% — {b.status}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${b.score}%`, background: st.color }} />
                      </div>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => gerarPlano(selectedDiag)} disabled={isGenerating}>
                    <Plus size={14} /> {isGenerating ? 'Gerando...' : 'Gerar Plano de Ação (Projetos)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Wins */}
            {selectedDiag.quickWins && selectedDiag.quickWins.length > 0 && (
              <div className="card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>⚡ Quick Wins — Oportunidades Prioritárias</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                  {selectedDiag.quickWins.map((w, i) => (
                    <div key={i} style={{ padding: 16, borderRadius: 8, border: '1px solid var(--card-border)', background: 'var(--gray-bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase' }}>{w.area}</span>
                        <span className={`badge ${w.prioridade === 'alta' ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: 10 }}>
                          {w.prioridade === 'alta' ? '🔴 Alta' : '🟡 Média'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{w.pergunta}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: NOVO DIAGNOSTICO */}
        {tab === 'novo' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div className="form-group"><label className="form-label">Cliente</label>
                <select className="form-select" value={clienteId} onChange={e => { setClienteId(e.target.value); setLeadId(''); }}>
                  <option value="">Selecione...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">ou Lead</label>
                <select className="form-select" value={leadId} onChange={e => { setLeadId(e.target.value); setClienteId(''); }}>
                  <option value="">Selecione...</option>{(leads || []).map(l => <option key={l.id} value={l.id}>{l.nome} — {l.empresa}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">ou Nome do Negócio</label>
                <input className="form-input" placeholder="Ex: Pizzaria Gourmet XYZ" value={nomeNegocio} onChange={e => setNomeNegocio(e.target.value)} />
              </div>
            </div>

            {!concluido ? (
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
                <div className="card" style={{ padding: 12 }}>
                  {blocos.map((b, i) => (
                    <button key={b.id} onClick={() => setActiveBloco(i)} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', background: activeBloco === i ? 'rgba(255,214,0,.1)' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit', color: 'var(--text-primary)', fontSize: 13, fontWeight: activeBloco === i ? 600 : 400, marginBottom: 2 }}>
                      <span>{b.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: calcScore(b.id) >= 60 ? '#22C55E' : calcScore(b.id) >= 40 ? '#F59E0B' : '#EF4444' }}>{calcScore(b.id)}%</span>
                    </button>
                  ))}
                </div>
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{blocos[activeBloco].title}</h3>
                  {blocos[activeBloco].perguntas.map((p, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <label className="form-label">{p}</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[1, 2, 3, 4, 5].map(v => (
                          <button key={v} onClick={() => setResposta(blocos[activeBloco].id, i, v)} style={{
                            width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
                            background: getResposta(blocos[activeBloco].id, i) === v ? '#FFD600' : 'var(--gray-bg)',
                            color: getResposta(blocos[activeBloco].id, i) === v ? '#0A0A0A' : 'var(--text-secondary)'
                          }}>{v}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                    <button className="btn btn-secondary" onClick={() => setActiveBloco(Math.max(0, activeBloco - 1))} disabled={activeBloco === 0}>Anterior</button>
                    {activeBloco < blocos.length - 1 ? <button className="btn btn-primary" onClick={() => setActiveBloco(activeBloco + 1)}>Próximo</button>
                      : <button className="btn btn-primary" onClick={handleConcluir}><Check size={14} /> Concluir</button>}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div className="card" style={{ padding: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📊 Score por Área</h4>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={radarData}><PolarGrid stroke="#2a2a2a" /><PolarAngleAxis dataKey="area" stroke="#9CA3AF" fontSize={11} /><PolarRadiusAxis domain={[0, 100]} stroke="#2a2a2a" fontSize={10} /><Radar name="Score" dataKey="score" stroke="#FFD600" fill="#FFD600" fillOpacity={0.2} strokeWidth={2} /></RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card" style={{ padding: 24 }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: 48, fontWeight: 800, color: avgScore >= 60 ? '#22C55E' : '#F59E0B' }}>{avgScore}%</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Score Geral — {getNomeCliente()}</div>
                    </div>
                    {blocos.map(b => {
                      const s = calcScore(b.id);
                      const st = getStatus(s);
                      return (
                        <div key={b.id} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span>{b.title.replace(/[^\wà-ú ]/g, '')}</span>
                            <span style={{ fontWeight: 700, color: st.color }}>{s}% — {st.label}</span>
                          </div>
                          <div className="progress-bar"><div className="progress-fill" style={{ width: `${s}%`, background: st.color }} /></div>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSalvar} disabled={salvo || isSaving}>
                        <Save size={14} /> {isSaving ? 'Salvando...' : (salvo ? 'Salvo ✅' : 'Salvar Diagnóstico')}
                      </button>
                      <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => gerarPlano(null)} disabled={isGenerating}><Plus size={14} /> {isGenerating ? 'Gerando...' : 'Gerar Plano de Ação'}</button>
                    </div>
                  </div>
                </div>

                {/* Quick Wins */}
                {getQuickWins().length > 0 && (
                  <div className="card" style={{ padding: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>⚡ Quick Wins — Oportunidades Prioritárias</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                      {getQuickWins().map((w, i) => (
                        <div key={i} style={{ padding: 16, borderRadius: 8, border: '1px solid var(--card-border)', background: 'var(--gray-bg)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase' }}>{w.area}</span>
                            <span className={`badge ${w.prioridade === 'alta' ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: 10 }}>
                              {w.prioridade === 'alta' ? '🔴 Alta' : '🟡 Média'}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{w.pergunta}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
