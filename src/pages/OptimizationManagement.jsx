import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Activity, Clock, CheckCircle, AlertCircle, Plus, Search, 
  History, Calendar, StickyNote, ChevronRight, LayoutDashboard,
  Filter, ArrowRight, Check, X
} from 'lucide-react';
import Modal from '../components/Modal';

const COLORS = {
  yellow: '#FFD600', green: '#22C55E', red: '#EF4444',
  bgDark: 'var(--bg-dark)', cardBg: '#141414', cardBorder: '#2a2a2a',
  text: 'var(--text-primary)', textMuted: 'var(--text-muted)'
};

export default function OptimizationManagement() {
  const { addToast } = useApp();
  const [optimizations, setOptimizations] = useState(() => {
    const saved = localStorage.getItem('foryou_optimization_data');
    return saved ? JSON.parse(saved) : {};
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [comment, setComment] = useState('');
  const [search, setSearch] = useState('');

  // Mock de campanhas para demonstração (em produção, viria da API/Store)
  const [campaigns] = useState([
    { id: '1', name: 'Performance Max - E-commerce Junho', created: '2024-05-10', status: 'active' },
    { id: '2', name: 'Meta Ads - LAL Leads 1%', created: '2024-04-15', status: 'active' },
    { id: '3', name: 'Youtube Ads - Branding Institucional', created: '2024-05-01', status: 'active' },
    { id: '4', name: 'Search - Palavras Chave Fundo de Funil', created: '2024-05-05', status: 'active' }
  ]);

  useEffect(() => {
    localStorage.setItem('foryou_optimization_data', JSON.stringify(optimizations));
  }, [optimizations]);

  const handleRegisterOptimization = () => {
    if (!comment.trim()) return addToast('Descreva o que foi feito!', 'warning');
    
    const now = new Date().toISOString();
    setOptimizations(prev => ({
      ...prev,
      [selectedCampaign.id]: {
        lastOpt: now,
        history: [{ date: now, comment }, ...(prev[selectedCampaign.id]?.history || [])]
      }
    }));

    addToast('Otimização registrada!');
    setIsModalOpen(false);
    setComment('');
  };

  const getStatus = (id) => {
    const data = optimizations[id];
    if (!data) return { label: 'Pendente', color: COLORS.yellow, overdue: true, days: '∞' };
    const diff = Math.floor((new Date() - new Date(data.lastOpt)) / (1000 * 60 * 60 * 24));
    if (diff >= 7) return { label: 'Atrasado', color: COLORS.red, overdue: true, days: diff };
    return { label: 'Em dia', color: COLORS.green, overdue: false, days: diff };
  };

  const filteredCampaigns = campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 32, background: COLORS.bgDark, minHeight: '100%', color: COLORS.text, fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Activity color={COLORS.yellow} size={32} /> Gestão de Otimizações
          </h1>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>Controle de ciclos e histórico de melhorias em campanhas.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: '8px 16px', width: 300 }}>
          <Search size={18} color={COLORS.textMuted} style={{ marginRight: 12 }} />
          <input 
            type="text" placeholder="Filtrar campanhas..." 
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#FFF', outline: 'none', width: '100%' }} 
          />
        </div>
      </div>

      {/* DASHBOARD MINI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total de Campanhas" value={campaigns.length} icon={LayoutDashboard} />
        <StatCard label="Em Dia" value={campaigns.filter(c => !getStatus(c.id).overdue).length} icon={CheckCircle} color={COLORS.green} />
        <StatCard label="Atrasadas" value={campaigns.filter(c => getStatus(c.id).overdue).length} icon={AlertCircle} color={COLORS.red} />
        <StatCard label="Otimizações (30d)" value={Object.values(optimizations).reduce((acc, curr) => acc + curr.history.length, 0)} icon={History} />
      </div>

      {/* CAMPAIGN LIST */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#1a1a1a', borderBottom: `1px solid ${COLORS.cardBorder}` }}>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>CAMPANHA</th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>DATA CRIAÇÃO</th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>ÚLTIMA OTIMIZAÇÃO</th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>PRÓXIMA (PREVISTA)</th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>STATUS</th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>AÇÃO</th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map(c => {
              const status = getStatus(c.id);
              const opt = optimizations[c.id];
              const nextDate = opt ? new Date(new Date(opt.lastOpt).getTime() + 7 * 24 * 60 * 60 * 1000) : new Date();
              
              return (
                <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, transition: '0.2s' }}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>ID: {c.id}</div>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: 13 }}>{new Date(c.created).toLocaleDateString()}</td>
                  <td style={{ padding: '20px 24px', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={14} color={COLORS.textMuted} />
                      {opt ? new Date(opt.lastOpt).toLocaleDateString() : 'Pendente'}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: 13, color: status.overdue ? COLORS.red : COLORS.text }}>
                    {nextDate.toLocaleDateString()}
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', 
                      borderRadius: 20, fontSize: 11, fontWeight: 800,
                      background: `${status.color}15`, color: status.color, border: `1px solid ${status.color}30`
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: status.color }} />
                      {status.label.toUpperCase()}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <button 
                      onClick={() => { setSelectedCampaign(c); setIsModalOpen(true); }}
                      style={{ 
                        background: COLORS.yellow, color: '#000', border: 'none', borderRadius: 8, 
                        padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      Otimizar <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* OPTIMIZATION MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Nova Otimização: ${selectedCampaign?.name}`}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 24, border: `1px solid ${COLORS.cardBorder}` }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,214,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StickyNote color={COLORS.yellow} size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>O que foi alterado?</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>Registre o histórico para consulta futura.</div>
            </div>
          </div>

          <textarea 
            rows={6} value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Ex: Pausamos criativos saturados, ajustamos lance manual no conjunto X e testamos novo público de interesse..."
            style={{ 
              width: '100%', background: '#0a0a0a', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12,
              padding: 16, color: '#FFF', fontSize: 14, outline: 'none', marginBottom: 24, resize: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: '#222', color: '#FFF', border: 'none', borderRadius: 8, padding: 14, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleRegisterOptimization} style={{ flex: 2, background: COLORS.yellow, color: '#000', border: 'none', borderRadius: 8, padding: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Check size={18} /> Salvar Otimização
            </button>
          </div>
        </div>
      </Modal>

      {/* HISTORY (OPCIONAL) */}
      <div style={{ marginTop: 40 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Histórico Recente</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Object.entries(optimizations).slice(0, 3).map(([id, data]) => {
            const camp = campaigns.find(c => c.id === id);
            return (
              <div key={id} style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.yellow, marginBottom: 8 }}>{camp?.name}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: COLORS.textMuted }}>"{data.history[0].comment}"</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 12 }}>{new Date(data.history[0].date).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = COLORS.text }) {
  return (
    <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted }}>{label}</div>
        <Icon size={18} color={color} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
