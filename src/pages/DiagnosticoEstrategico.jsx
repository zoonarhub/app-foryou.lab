import { useState } from 'react';
import { useApp } from '../data/store';
import { BarChart3, FileText, Plus, Check } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const blocos = [
  { id: 'posicionamento', title: '🎯 Posicionamento', perguntas: ['Sua marca tem identidade visual definida?', 'Você tem tom de voz claro?', 'Seu diferencial é comunicado?', 'Você conhece seu público ideal?'] },
  { id: 'comercial', title: '💼 Comercial', perguntas: ['Tem processo de vendas estruturado?', 'Usa CRM para gerir leads?', 'Taxa de conversão é medida?', 'Follow-up é sistematizado?'] },
  { id: 'marketing', title: '📱 Marketing', perguntas: ['Investe em tráfego pago?', 'Posta com frequência nas redes?', 'Tem estratégia de conteúdo?', 'Mede ROI das campanhas?', 'Tem site otimizado?'] },
  { id: 'financeiro', title: '💰 Financeiro', perguntas: ['Controla fluxo de caixa?', 'Sabe seu CAC?', 'Margem de lucro é saudável?', 'Investe em crescimento?'] },
  { id: 'operacao', title: '⚙️ Operação', perguntas: ['Processos são documentados?', 'Usa ferramentas de gestão?', 'Equipe é treinada?', 'Entregas são padronizadas?'] },
];

export default function DiagnosticoEstrategico() {
  const { clients, addItem, addToast } = useApp();
  const [clienteId, setClienteId] = useState('');
  const [activeBloco, setActiveBloco] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [concluido, setConcluido] = useState(false);

  const setResposta = (blocoId, idx, val) => setRespostas(p => ({ ...p, [`${blocoId}_${idx}`]: val }));
  const getResposta = (blocoId, idx) => respostas[`${blocoId}_${idx}`] || 0;

  const calcScore = (blocoId) => {
    const bloco = blocos.find(b => b.id === blocoId);
    if (!bloco) return 0;
    const total = bloco.perguntas.reduce((s, _, i) => s + getResposta(blocoId, i), 0);
    return Math.round((total / (bloco.perguntas.length * 5)) * 100);
  };

  const radarData = blocos.map(b => ({ area: b.id.charAt(0).toUpperCase() + b.id.slice(0, 3), score: calcScore(b.id), fullMark: 100 }));
  const avgScore = Math.round(radarData.reduce((s, d) => s + d.score, 0) / radarData.length);

  const handleConcluir = () => {
    if (!clienteId) { addToast('Selecione um cliente', 'error'); return; }
    setConcluido(true);
    addToast('Diagnóstico concluído! 🎉');
  };

  const gerarPlano = () => {
    const gaps = blocos.filter(b => calcScore(b.id) < 60);
    gaps.forEach(b => {
      addItem('tasks', { titulo: `Melhorar ${b.title.replace(/[^a-zA-Zà-úÀ-Ú ]/g, '')}`, descricao: `Score atual: ${calcScore(b.id)}%`, responsavel: '', status: 'a_fazer', prioridade: calcScore(b.id) < 40 ? 'alta' : 'media', projetoId: '', clienteId });
    });
    addToast(`${gaps.length} tarefas criadas no módulo Projetos!`);
  };

  return (
    <>
      <div className="page-header"><div><h2>Diagnóstico Estratégico</h2><div className="breadcrumb">Avaliação por área</div></div></div>
      <div className="page-body">
        <div className="form-group" style={{ maxWidth: 400, marginBottom: 24 }}><label className="form-label">Selecionar Cliente *</label>
          <select className="form-select" value={clienteId} onChange={e => setClienteId(e.target.value)}>
            <option value="">Selecione...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
          </select>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📊 Score por Área</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}><PolarGrid stroke="#2a2a2a" /><PolarAngleAxis dataKey="area" stroke="#9CA3AF" fontSize={12} /><PolarRadiusAxis domain={[0, 100]} stroke="#2a2a2a" fontSize={10} /><Radar name="Score" dataKey="score" stroke="#FFD600" fill="#FFD600" fillOpacity={0.2} strokeWidth={2} /></RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: avgScore >= 60 ? '#22C55E' : '#F59E0B' }}>{avgScore}%</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Score Geral</div>
                </div>
                {blocos.map(b => {
                  const s = calcScore(b.id);
                  return (
                    <div key={b.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span>{b.title.replace(/[^\wà-ú ]/g, '')}</span><span style={{ fontWeight: 700, color: s >= 60 ? '#22C55E' : s >= 40 ? '#F59E0B' : '#EF4444' }}>{s}%</span></div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${s}%`, background: s >= 60 ? '#22C55E' : s >= 40 ? '#F59E0B' : '#EF4444' }} /></div>
                    </div>
                  );
                })}
                <button className="btn btn-primary mt-16" style={{ width: '100%' }} onClick={gerarPlano}><Plus size={14} /> Gerar Plano de Ação</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
