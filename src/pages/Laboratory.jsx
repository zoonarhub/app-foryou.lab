import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../data/store';
import {
  FlaskConical, ChevronRight, Search, Edit2, Save, X, Plus, Trash2,
  CheckCircle, Clock, Circle, TrendingUp, TrendingDown, DollarSign,
  Users, Target, Heart, Repeat, Award, MessageCircle, BarChart3, 
  Activity, ArrowUpRight, ArrowDownRight, Sparkles, Calendar, Eye, ArrowLeft
} from 'lucide-react';

const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v || 0);
const fmtNum = v => new Intl.NumberFormat('pt-BR').format(v || 0);

const ETAPAS = [
  { id: 'diagnostico', num: '01', nome: 'Diagnóstico', desc: 'Análise de ticket médio, gargalos e posicionamento', color: '#3B82F6', icon: Search },
  { id: 'estrutura', num: '02', nome: 'Estrutura', desc: 'Cardápio digital, fotografia e presença digital', color: '#8B5CF6', icon: Eye },
  { id: 'performance', num: '03', nome: 'Performance', desc: 'Mídia paga, reservas e Google Maps', color: '#F59E0B', icon: Target },
  { id: 'escala', num: '04', nome: 'Escala', desc: 'Fidelidade, recuperação e ticket médio', color: '#22C55E', icon: TrendingUp },
];

const MAPA_ESTRATEGICO = [
  { id: 'atrair', titulo: 'ATRAIR', icon: MegaphoneIcon, color: '#FFD600', items: ['Conteúdo', 'Campanhas', 'Presença'] },
  { id: 'converter', titulo: 'CONVERTER', icon: ShoppingBagIcon, color: '#FFFFFF', items: ['Cardápio', 'Oferta', 'Experiência'] },
  { id: 'encantar', titulo: 'ENCANTAR', icon: Heart, color: '#22C55E', items: ['Atendimento', 'Ambiente', 'Pós-venda'] },
  { id: 'reter', titulo: 'RETER', icon: Repeat, color: '#FFD600', items: ['Fidelização', 'Indicação', 'Recorrência'] },
];

// Fallbacks for custom icons in MAPA_ESTRATEGICO to avoid import errors
function MegaphoneIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 11 18-5v12L3 13v-2Z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function ShoppingBagIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

const DEFAULT_LAB_DATA = {
  faturamento: 0, faturamentoAnterior: 0,
  ticketMedio: 0, ticketMedioAnterior: 0,
  clientesNovos: 0, clientesNovosAnterior: 0,
  taxaRetencao: 0, taxaRetencaoAnterior: 0,
  funilAlcance: 0, funilEngajamento: 0, funilVisitas: 0, funilReservas: 0, funilClientes: 0,
  acoes: [],
};

const calcVariation = (atual, anterior) => {
  if (!anterior || anterior === 0) return { value: 0, positive: true };
  const pct = ((atual - anterior) / anterior) * 100;
  return { value: Math.abs(pct).toFixed(1), positive: pct >= 0 };
};

const getClientProgress = (client) => {
  const idx = ETAPAS.findIndex(e => e.id === client.etapaLaboratorio);
  return idx >= 0 ? ((idx + 1) / 4) * 100 : 0;
};

export default function Laboratory() {
  const { clients, teamMembers, financials, updateItem, addToast } = useApp();
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [search, setSearch] = useState('');
  const [editingKPIs, setEditingKPIs] = useState(false);
  const [editingFunil, setEditingFunil] = useState(false);
  const [kpiForm, setKpiForm] = useState({});
  const [funilForm, setFunilForm] = useState({});
  const [newAction, setNewAction] = useState('');

  const activeClients = useMemo(() =>
    clients.filter(c => c.status !== 'cancelado' && (!search ||
      c.empresa.toLowerCase().includes(search.toLowerCase()) ||
      c.nome.toLowerCase().includes(search.toLowerCase())
    )), [clients, search]);

  const selectedClient = useMemo(() =>
    clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

  const labData = useMemo(() => ({
    ...DEFAULT_LAB_DATA,
    ...(selectedClient?.labData || {}),
  }), [selectedClient]);

  const member = useMemo(() =>
    teamMembers.find(m => m.id === selectedClient?.responsavel), [teamMembers, selectedClient]);

  const clientFinancials = useMemo(() =>
    financials.filter(f => f.clienteId === selectedClientId), [financials, selectedClientId]);

  const handleSelectClient = useCallback((clientId) => {
    setSelectedClientId(clientId);
    setEditingKPIs(false);
    setEditingFunil(false);
    const client = clients.find(c => c.id === clientId);
    const data = { ...DEFAULT_LAB_DATA, ...(client?.labData || {}) };
    setKpiForm({ 
      faturamento: data.faturamento, 
      faturamentoAnterior: data.faturamentoAnterior, 
      ticketMedio: data.ticketMedio, 
      ticketMedioAnterior: data.ticketMedioAnterior, 
      clientesNovos: data.clientesNovos, 
      clientesNovosAnterior: data.clientesNovosAnterior, 
      taxaRetencao: data.taxaRetencao, 
      taxaRetencaoAnterior: data.taxaRetencaoAnterior 
    });
    setFunilForm({ 
      funilAlcance: data.funilAlcance, 
      funilEngajamento: data.funilEngajamento, 
      funilVisitas: data.funilVisitas, 
      funilReservas: data.funilReservas, 
      funilClientes: data.funilClientes 
    });
  }, [clients]);

  const handleBackToList = useCallback(() => {
    setSelectedClientId(null);
  }, []);

  const saveLabData = useCallback((updates) => {
    if (!selectedClientId) return;
    const newLabData = { ...labData, ...updates };
    updateItem('clients', selectedClientId, { labData: newLabData });
    addToast('Dados atualizados!');
  }, [selectedClientId, labData, updateItem, addToast]);

  const saveKPIs = () => { saveLabData(kpiForm); setEditingKPIs(false); };
  const saveFunil = () => { saveLabData(funilForm); setEditingFunil(false); };

  const addAction = () => {
    if (!newAction.trim()) return;
    const acoes = [...(labData.acoes || []), { id: Date.now().toString(), titulo: newAction.trim(), status: 'planejado' }];
    saveLabData({ acoes });
    setNewAction('');
  };

  const toggleActionStatus = (actionId) => {
    const acoes = (labData.acoes || []).map(a => {
      if (a.id !== actionId) return a;
      const next = { planejado: 'andamento', andamento: 'concluido', concluido: 'planejado' };
      return { ...a, status: next[a.status] || 'planejado' };
    });
    saveLabData({ acoes });
  };

  const removeAction = (actionId) => {
    const acoes = (labData.acoes || []).filter(a => a.id !== actionId);
    saveLabData({ acoes });
  };

  const etapaIdx = ETAPAS.findIndex(e => e.id === selectedClient?.etapaLaboratorio);
  const progress = ((etapaIdx + 1) / 4) * 100;

  const kpis = [
    { label: 'Faturamento', value: fmt(labData.faturamento), icon: DollarSign, color: '#22C55E', ...calcVariation(labData.faturamento, labData.faturamentoAnterior), field: 'faturamento', fieldAnt: 'faturamentoAnterior', isCurrency: true },
    { label: 'Ticket médio', value: fmt(labData.ticketMedio), icon: BarChart3, color: '#3B82F6', ...calcVariation(labData.ticketMedio, labData.ticketMedioAnterior), field: 'ticketMedio', fieldAnt: 'ticketMedioAnterior', isCurrency: true },
    { label: 'Clientes novos', value: fmtNum(labData.clientesNovos), icon: Users, color: '#8B5CF6', ...calcVariation(labData.clientesNovos, labData.clientesNovosAnterior), field: 'clientesNovos', fieldAnt: 'clientesNovosAnterior' },
    { label: 'Taxa de retenção', value: `${labData.taxaRetencao || 0}%`, icon: Repeat, color: '#F59E0B', ...calcVariation(labData.taxaRetencao, labData.taxaRetencaoAnterior), field: 'taxaRetencao', fieldAnt: 'taxaRetencaoAnterior', isPercent: true },
  ];

  const funilLevels = [
    { label: 'Alcance', value: labData.funilAlcance, field: 'funilAlcance', width: 100 },
    { label: 'Engajamento', value: labData.funilEngajamento, field: 'funilEngajamento', width: 82 },
    { label: 'Visitas ao perfil', value: labData.funilVisitas, field: 'funilVisitas', width: 64 },
    { label: 'Reservas / Pedidos', value: labData.funilReservas, field: 'funilReservas', width: 46 },
    { label: 'Clientes', value: labData.funilClientes, field: 'funilClientes', width: 28 },
  ];

  const actionStatusConf = {
    andamento: { label: 'em andamento', color: '#22C55E', bg: 'rgba(34,197,94,.15)', icon: Activity },
    planejado: { label: 'planejado', color: '#F59E0B', bg: 'rgba(245,158,11,.15)', icon: Clock },
    concluido: { label: 'concluído', color: '#6B7280', bg: 'rgba(107,114,128,.15)', icon: CheckCircle },
  };

  // Portfolio general metrics calculations
  const totalActiveClients = activeClients.length;
  const portfolioMRR = useMemo(() =>
    activeClients.reduce((acc, c) => acc + (Number(c.mrr) || 0), 0), [activeClients]);

  const portfolioNPS = useMemo(() => {
    const validNps = activeClients.filter(c => c.nps !== undefined && c.nps !== null && c.nps !== '');
    if (validNps.length === 0) return 0;
    return validNps.reduce((acc, c) => acc + Number(c.nps), 0) / validNps.length;
  }, [activeClients]);

  const portfolioProgress = useMemo(() => {
    if (activeClients.length === 0) return 0;
    return activeClients.reduce((acc, c) => acc + getClientProgress(c), 0) / activeClients.length;
  }, [activeClients]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>
            {selectedClient ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <FlaskConical size={20} color="#FFD600" />
                Laboratório / {selectedClient.empresa}
              </span>
            ) : 'Laboratório de Crescimento'}
          </h2>
          <div className="breadcrumb">
            {selectedClient 
              ? 'Painel estratégico individual por cliente' 
              : 'Dashboard consolidado e visão geral de crescimento dos clientes'}
          </div>
        </div>
        {selectedClient && (
          <button className="btn btn-secondary" onClick={handleBackToList} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Voltar para Lista
          </button>
        )}
      </div>

      <div className="page-body" style={{ minHeight: 'calc(100vh - 160px)' }}>
        {!selectedClient ? (
          /* ========================================================= */
          /* LIST VIEW: PORTFOLIO DASHBOARD (FULL WIDTH)               */
          /* ========================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Portfolio Overview KPIs */}
            <div className="kpi-grid">
              <div className="card kpi-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -10, right: -10, width: 50, height: 50, background: 'rgba(255,214,0,.04)', borderRadius: '50%' }} />
                <div className="kpi-icon" style={{ background: 'rgba(255,214,0,.1)' }}><FlaskConical size={18} color="#FFD600" /></div>
                <div className="kpi-value">{totalActiveClients}</div>
                <div className="kpi-label">Clientes no Laboratório</div>
              </div>
              <div className="card kpi-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -10, right: -10, width: 50, height: 50, background: 'rgba(34,197,94,.04)', borderRadius: '50%' }} />
                <div className="kpi-icon" style={{ background: 'rgba(34,197,94,.1)' }}><DollarSign size={18} color="#22C55E" /></div>
                <div className="kpi-value" style={{ color: '#22C55E' }}>{fmt(portfolioMRR)}</div>
                <div className="kpi-label">Faturamento Mensal (MRR)</div>
              </div>
              <div className="card kpi-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -10, right: -10, width: 50, height: 50, background: 'rgba(139,92,246,.04)', borderRadius: '50%' }} />
                <div className="kpi-icon" style={{ background: 'rgba(139,92,246,.1)' }}><Heart size={18} color="#8B5CF6" /></div>
                <div className="kpi-value" style={{ color: portfolioNPS >= 9 ? '#22C55E' : portfolioNPS >= 7 ? '#F59E0B' : '#EF4444' }}>
                  {portfolioNPS > 0 ? `${portfolioNPS.toFixed(1)}/10` : '—'}
                </div>
                <div className="kpi-label">Média NPS da Carteira</div>
              </div>
              <div className="card kpi-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -10, right: -10, width: 50, height: 50, background: 'rgba(59,130,246,.04)', borderRadius: '50%' }} />
                <div className="kpi-icon" style={{ background: 'rgba(59,130,246,.1)' }}><Activity size={18} color="#3B82F6" /></div>
                <div className="kpi-value" style={{ color: '#3B82F6' }}>{Math.round(portfolioProgress)}%</div>
                <div className="kpi-label">Progresso Médio no Método</div>
              </div>
            </div>

            {/* Filter and Search Section */}
            <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div className="search-input-wrapper" style={{ flex: 1, maxWidth: 400, background: 'var(--gray-bg)' }}>
                <Search size={16} />
                <input 
                  placeholder="Pesquisar por empresa ou responsável..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
                />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Exibindo <strong>{activeClients.length}</strong> de <strong>{clients.filter(c => c.status !== 'cancelado').length}</strong> clientes
              </div>
            </div>

            {/* Client List Tabela */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-bg)', borderBottom: '1px solid var(--card-border)' }}>
                      <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1 }}>CLIENTE</th>
                      <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1 }}>ETAPA LABORATÓRIO</th>
                      <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1 }}>FATURAMENTO ATUAL</th>
                      <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, textAlign: 'center' }}>NPS</th>
                      <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1 }}>PROGRESSO MÉTODO</th>
                      <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, textAlign: 'right' }}>AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeClients.map(client => {
                      const etapa = ETAPAS.find(e => e.id === client.etapaLaboratorio);
                      const faturamento = client.labData?.faturamento || client.mrr || 0;
                      const progressVal = getClientProgress(client);
                      const clientNps = client.nps;
                      const gestor = teamMembers.find(m => m.id === client.responsavel);

                      return (
                        <tr 
                          key={client.id} 
                          onClick={() => handleSelectClient(client.id)}
                          style={{ 
                            borderBottom: '1px solid var(--card-border)', 
                            cursor: 'pointer', 
                            transition: 'background 0.2s',
                          }}
                          className="table-row-hover"
                        >
                          {/* Cliente Info */}
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,214,0,.1)', color: '#FFD600',
                                fontWeight: 800, fontSize: 13, flexShrink: 0
                              }}>{client.empresa.slice(0, 2).toUpperCase()}</div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{client.empresa}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  Contato: {client.nome} {gestor && `• Gestor: ${gestor.nome}`}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Etapa Laboratório */}
                          <td style={{ padding: '16px 20px' }}>
                            {etapa ? (
                              <span style={{ 
                                background: `${etapa.color}15`, 
                                color: etapa.color, 
                                padding: '4px 10px', 
                                borderRadius: 6, 
                                fontSize: 11, 
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: etapa.color }} />
                                Etapa {etapa.num} — {etapa.nome}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Não definida</span>
                            )}
                          </td>

                          {/* Faturamento */}
                          <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {fmt(faturamento)}
                          </td>

                          {/* NPS */}
                          <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                            {clientNps !== undefined && clientNps !== null && clientNps !== '' ? (
                              <span style={{
                                width: 28, height: 28, borderRadius: '50%',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 800,
                                background: clientNps >= 9 ? 'rgba(34,197,94,.15)' : clientNps >= 7 ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.15)',
                                color: clientNps >= 9 ? '#22C55E' : clientNps >= 7 ? '#F59E0B' : '#EF4444',
                              }}>
                                {clientNps}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
                            )}
                          </td>

                          {/* Progresso */}
                          <td style={{ padding: '16px 20px', width: 180 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="progress-bar" style={{ height: 6, borderRadius: 3, flex: 1, background: 'var(--gray-bg)' }}>
                                <div className="progress-fill" style={{ width: `${progressVal}%`, borderRadius: 3, background: 'linear-gradient(90deg, #FFD600, #FFB300)' }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#FFD600', width: 34, textAlign: 'right' }}>
                                {Math.round(progressVal)}%
                              </span>
                            </div>
                          </td>

                          {/* Ações */}
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <button 
                              className="btn btn-sm btn-secondary" 
                              onClick={(e) => { e.stopPropagation(); handleSelectClient(client.id); }}
                              style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--card-border)' }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                <Eye size={12} color="#FFD600" /> Ver Mapa
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {activeClients.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                          Nenhum cliente encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* DETAILED VIEW: CLIENT STRATEGIC MAP (FULL WIDTH)           */
          /* ========================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Client Header Card */}
            <div className="card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: '#0A0A0A' }}>
                  {selectedClient.empresa.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{selectedClient.empresa}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 12, alignItems: 'center', marginTop: 2 }}>
                    <span>{selectedClient.nome}</span>
                    <span>•</span>
                    <span style={{ color: '#22C55E', fontWeight: 600 }}>{fmt(selectedClient.mrr)}/mês</span>
                    {member && <><span>•</span><span>Gestor: {member.nome}</span></>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge badge-${selectedClient.status === 'ativo' ? 'green' : 'yellow'}`}>{selectedClient.status}</span>
                <span className="badge" style={{ background: `${ETAPAS[etapaIdx]?.color}20`, color: ETAPAS[etapaIdx]?.color }}>Etapa {ETAPAS[etapaIdx]?.num}</span>
              </div>
            </div>

            {/* Mapa Estratégico */}
            <div className="card" style={{ padding: 28, background: 'var(--card-bg)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(255,214,0,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Sparkles size={16} color="#FFD600" />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#FFD600', letterSpacing: 2, textTransform: 'uppercase' }}>Plano de Crescimento</span>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4, color: 'var(--text-primary)' }}>Mapa Estratégico</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>Visão geral do crescimento — {selectedClient.empresa}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {MAPA_ESTRATEGICO.map((etapa, i) => {
                  const Icon = etapa.icon;
                  const isActive = i <= etapaIdx;
                  return (
                    <div key={etapa.id} style={{
                      padding: 20, borderRadius: 14, textAlign: 'center', position: 'relative', transition: 'all .3s',
                      background: isActive ? 'rgba(255,214,0,.08)' : 'var(--gray-bg)',
                      border: isActive ? '2px solid rgba(255,214,0,.3)' : '1px solid var(--card-border)',
                      boxShadow: isActive ? '0 0 20px rgba(255,214,0,.08)' : 'none',
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
                        background: isActive ? '#FFD600' : 'var(--card-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={22} color={isActive ? '#0A0A0A' : 'var(--text-secondary)'} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isActive ? etapa.color : 'var(--text-secondary)', letterSpacing: 1, marginBottom: 10 }}>{etapa.titulo}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {etapa.items.map(item => (
                          <div key={item} style={{ fontSize: 11, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', padding: '3px 0' }}>{item}</div>
                        ))}
                      </div>
                      {i < 3 && <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
                        <ChevronRight size={16} color="var(--text-muted)" />
                      </div>}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span>Progresso no Método</span>
                  <span style={{ fontWeight: 700, color: '#FFD600' }}>{Math.round(progress)}%</span>
                </div>
                <div className="progress-bar" style={{ height: 8, borderRadius: 4 }}>
                  <div className="progress-fill" style={{ width: `${progress}%`, borderRadius: 4, background: 'linear-gradient(90deg, #FFD600, #FFB300)' }} />
                </div>
              </div>
            </div>

            {/* Indicadores-Chave */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h4 style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                  <Activity size={18} color="#FFD600" /> Indicadores-Chave
                </h4>
                {editingKPIs ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-primary" onClick={saveKPIs}><Save size={12} /> Salvar</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditingKPIs(false)}><X size={12} /></button>
                  </div>
                ) : (
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditingKPIs(true)}><Edit2 size={12} /> Editar</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {kpis.map(kpi => {
                  const Icon = kpi.icon;
                  const variation = calcVariation(labData[kpi.field], labData[kpi.fieldAnt]);
                  return (
                    <div key={kpi.label} className="card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, background: `${kpi.color}08`, borderRadius: '50%' }} />
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon size={14} color={kpi.color} /> {kpi.label}
                      </div>
                      {editingKPIs ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <input className="form-input" type="number" placeholder="Atual" value={kpiForm[kpi.field] || ''} onChange={e => setKpiForm({ ...kpiForm, [kpi.field]: Number(e.target.value) })} style={{ fontSize: 14, padding: '6px 8px' }} />
                          <input className="form-input" type="number" placeholder="Mês anterior" value={kpiForm[kpi.fieldAnt] || ''} onChange={e => setKpiForm({ ...kpiForm, [kpi.fieldAnt]: Number(e.target.value) })} style={{ fontSize: 12, padding: '4px 8px' }} />
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>{kpi.value}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: variation.positive ? '#22C55E' : '#EF4444' }}>
                            {variation.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {variation.value}%
                            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>vs. mês anterior</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Funil + Ações side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Funil de Crescimento */}
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                    <Target size={18} color="#FFD600" /> Funil de Crescimento
                  </h4>
                  {editingFunil ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-primary" onClick={saveFunil}><Save size={12} /> Salvar</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditingFunil(false)}><X size={12} /></button>
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditingFunil(true)}><Edit2 size={12} /></button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                  {funilLevels.map((level, i) => (
                    <div key={level.label} style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
                      <div style={{
                        width: `${level.width}%`, margin: '0 auto', padding: '10px 16px',
                        background: `linear-gradient(135deg, ${i === 0 ? '#FFD600' : i === 1 ? '#FFC107' : i === 2 ? '#FFB300' : i === 3 ? '#FF9800' : '#FF8F00'}, ${i === 0 ? '#FFB300' : i === 1 ? '#FF9800' : i === 2 ? '#FF8F00' : i === 3 ? '#F57C00' : '#E65100'})`,
                        borderRadius: 8, textAlign: 'center', position: 'relative',
                        clipPath: i < 4 ? `polygon(0 0, 100% 0, ${100 - 3}% 100%, 3% 100%)` : 'polygon(15% 0, 85% 0, 80% 100%, 20% 100%)',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#0A0A0A', opacity: 0.7 }}>{level.label}</div>
                      </div>
                      <div style={{ width: 100, textAlign: 'right' }}>
                        {editingFunil ? (
                          <input className="form-input" type="number" value={funilForm[level.field] || ''} onChange={e => setFunilForm({ ...funilForm, [level.field]: Number(e.target.value) })} style={{ width: 90, fontSize: 13, padding: '4px 6px', textAlign: 'right', color: 'var(--text-primary)' }} />
                        ) : (
                          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{fmtNum(level.value)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Próximas Ações */}
              <div className="card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                  <CheckCircle size={18} color="#FFD600" /> Próximas ações
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 260, overflowY: 'auto' }}>
                  {(labData.acoes || []).length === 0 && (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, border: '2px dashed var(--card-border)', borderRadius: 10 }}>
                      Nenhuma ação cadastrada
                    </div>
                  )}
                  {(labData.acoes || []).map(acao => {
                    const conf = actionStatusConf[acao.status] || actionStatusConf.planejado;
                    const StatusIcon = conf.icon;
                    return (
                      <div key={acao.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        background: 'var(--gray-bg)', borderRadius: 10, transition: 'all .2s',
                      }}>
                        <button onClick={() => toggleActionStatus(acao.id)} style={{
                          width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: conf.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <StatusIcon size={14} color={conf.color} />
                        </button>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, textDecoration: acao.status === 'concluido' ? 'line-through' : 'none', color: acao.status === 'concluido' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                            {acao.titulo}
                          </div>
                          <div style={{ fontSize: 10, color: conf.color, fontWeight: 700 }}>{conf.label}</div>
                        </div>
                        <button onClick={() => removeAction(acao.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add action */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" placeholder="Nova ação..." value={newAction} onChange={e => setNewAction(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addAction()} style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }} />
                  <button className="btn btn-primary btn-sm" onClick={addAction}><Plus size={14} /></button>
                </div>
              </div>
            </div>

            {/* Timeline do Cliente */}
            <div className="card" style={{ padding: 24 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                <Calendar size={18} color="#FFD600" /> Linha do Tempo
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 20, borderLeft: '2px solid var(--card-border)', position: 'relative' }}>
                {[
                  { label: 'Cliente desde', value: selectedClient.dataInicio ? new Date(selectedClient.dataInicio).toLocaleDateString('pt-BR') : '—', icon: Calendar, color: '#FFD600' },
                  { label: 'Plano atual', value: `${selectedClient.plano} — ${fmt(selectedClient.mrr)}/mês`, icon: Award, color: '#22C55E' },
                  { label: 'Etapa do Laboratório', value: `${ETAPAS[etapaIdx]?.num || '—'} — ${ETAPAS[etapaIdx]?.nome || '—'}`, icon: FlaskConical, color: ETAPAS[etapaIdx]?.color || '#666' },
                  { label: 'Contrato', value: `${selectedClient.mesesContrato || '—'} meses`, icon: Calendar, color: '#3B82F6' },
                  ...(selectedClient.nps ? [{ label: 'NPS', value: `${selectedClient.nps}/10`, icon: Heart, color: selectedClient.nps >= 9 ? '#22C55E' : selectedClient.nps >= 7 ? '#F59E0B' : '#EF4444' }] : []),
                  ...(member ? [{ label: 'Gestor responsável', value: member.nome, icon: Users, color: '#8B5CF6' }] : []),
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: -28, width: 14, height: 14, borderRadius: '50%',
                        background: item.color, border: '3px solid var(--card-bg)',
                      }} />
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={15} color={item.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Observações */}
            {selectedClient.observacoes && (
              <div className="card" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                  <MessageCircle size={16} color="#FFD600" /> Observações
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedClient.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
