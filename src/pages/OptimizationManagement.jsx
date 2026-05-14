import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Activity, Clock, CheckCircle, AlertCircle, Plus, Search, 
  History, Calendar, StickyNote, ChevronRight, LayoutDashboard,
  Filter, ArrowRight, Check, X, Megaphone, Smartphone
} from 'lucide-react';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';

const COLORS = {
  yellow: '#FFD600', green: '#22C55E', red: '#EF4444',
  bgDark: 'var(--bg-dark)', cardBg: '#141414', cardBorder: '#2a2a2a',
  text: 'var(--text-primary)', textMuted: 'var(--text-muted)'
};

export default function OptimizationManagement() {
  const { addToast, user } = useApp();
  const [trackings, setTrackings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isOptModalOpen, setIsOptModalOpen] = useState(false);
  
  // States de Formulário
  const [newTracking, setNewTracking] = useState({ name: '', platform: 'meta' });
  const [selectedTracking, setSelectedTracking] = useState(null);
  const [optComment, setOptComment] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Carregar campanhas monitoradas
      const { data: tData, error: tError } = await supabase
        .from('campaign_trackings')
        .select('*')
        .order('last_optimized_at', { ascending: false });

      if (tError) throw tError;
      setTrackings(tData || []);

      // Carregar últimos logs de otimização
      const { data: lData, error: lError } = await supabase
        .from('optimization_logs')
        .select('*, campaign_trackings(name)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (lError) throw lError;
      setLogs(lData || []);
    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar dados do banco.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTracking = async () => {
    if (!newTracking.name.trim()) return addToast('Nome é obrigatório!', 'warning');
    
    try {
      const { data, error } = await supabase
        .from('campaign_trackings')
        .insert([{
          name: newTracking.name,
          platform: newTracking.platform,
          user_id: user.id,
          status: 'active',
          last_optimized_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      addToast('Campanha cadastrada para monitoramento!');
      setIsRegisterModalOpen(false);
      setNewTracking({ name: '', platform: 'meta' });
      fetchData();
    } catch (err) {
      addToast('Erro ao cadastrar.', 'error');
    }
  };

  const handleSaveOptimization = async () => {
    if (!optComment.trim()) return addToast('Descreva a otimização!', 'warning');
    
    try {
      const now = new Date().toISOString();
      
      // 1. Inserir Log
      const { error: lError } = await supabase
        .from('optimization_logs')
        .insert([{
          tracking_id: selectedTracking.id,
          comment: optComment,
          user_id: user.id,
          created_at: now
        }]);

      if (lError) throw lError;

      // 2. Atualizar Data de Otimização na Campanha
      const { error: tError } = await supabase
        .from('campaign_trackings')
        .update({ last_optimized_at: now })
        .eq('id', selectedTracking.id);

      if (tError) throw tError;

      addToast('Otimização salva com sucesso!');
      setIsOptModalOpen(false);
      setOptComment('');
      fetchData();
    } catch (err) {
      addToast('Erro ao salvar log.', 'error');
    }
  };

  const getStatus = (item) => {
    const diff = Math.floor((new Date() - new Date(item.last_optimized_at)) / (1000 * 60 * 60 * 24));
    if (diff >= 7) return { label: 'Atrasado', color: COLORS.red, overdue: true, days: diff };
    if (diff >= 4) return { label: 'Atenção', color: COLORS.yellow, overdue: false, days: diff };
    return { label: 'Em dia', color: COLORS.green, overdue: false, days: diff };
  };

  const filteredTrackings = trackings.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: 32, background: COLORS.bgDark, minHeight: '100%', color: COLORS.text, fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Activity color={COLORS.yellow} size={32} /> Gestão de Otimizações
          </h1>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>Controle de ciclos e histórico de melhorias.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: '8px 16px', width: 260 }}>
            <Search size={18} color={COLORS.textMuted} style={{ marginRight: 12 }} />
            <input 
              type="text" placeholder="Buscar..." 
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#FFF', outline: 'none', width: '100%' }} 
            />
          </div>
          <button 
            onClick={() => setIsRegisterModalOpen(true)}
            style={{ background: COLORS.yellow, color: '#000', border: 'none', borderRadius: 12, padding: '0 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={18} /> Cadastrar Novo
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Monitorando" value={trackings.length} icon={LayoutDashboard} />
        <StatCard label="Em Dia" value={trackings.filter(t => !getStatus(t).overdue).length} icon={CheckCircle} color={COLORS.green} />
        <StatCard label="Atrasadas" value={trackings.filter(t => getStatus(t).overdue).length} icon={AlertCircle} color={COLORS.red} />
        <StatCard label="Total Logs" value={logs.length} icon={History} />
      </div>

      {/* TABLE */}
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#1a1a1a', borderBottom: `1px solid ${COLORS.cardBorder}` }}>
              <th style={{ padding: '16px 24px', fontSize: 12, color: COLORS.textMuted }}>CONTA / CAMPANHA</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: COLORS.textMuted }}>PLATAFORMA</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: COLORS.textMuted }}>ÚLTIMA OTIMIZAÇÃO</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: COLORS.textMuted }}>STATUS</th>
              <th style={{ padding: '16px 24px', fontSize: 12, color: COLORS.textMuted }}>AÇÃO</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>Carregando dados reais...</td></tr>
            ) : filteredTrackings.map(t => {
              const status = getStatus(t);
              return (
                <tr key={t.id} style={{ borderBottom: `1px solid ${COLORS.cardBorder}`, transition: '0.2s' }}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>Monitorado desde {new Date(t.created_at).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, textTransform: 'capitalize' }}>
                      {t.platform === 'meta' ? <Megaphone size={14} color="#1877F2"/> : <Search size={14} color="#4285F4"/>}
                      {t.platform}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: 13 }}>
                    {new Date(t.last_optimized_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', 
                      borderRadius: 20, fontSize: 11, fontWeight: 800,
                      background: `${status.color}15`, color: status.color, border: `1px solid ${status.color}30`
                    }}>
                      {status.label.toUpperCase()} ({status.days}d)
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <button 
                      onClick={() => { setSelectedTracking(t); setIsOptModalOpen(true); }}
                      style={{ background: COLORS.yellow, color: '#000', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Otimizar Agora
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* REGISTER MODAL */}
      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Monitorar Nova Campanha">
        <div style={{ padding: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Nome da Conta / Campanha</label>
          <input 
            type="text" value={newTracking.name} onChange={e => setNewTracking({...newTracking, name: e.target.value})}
            placeholder="Ex: Cliente X - Performance Max"
            style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 16, color: '#FFF', marginBottom: 20 }}
          />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Plataforma</label>
          <select 
            value={newTracking.platform} onChange={e => setNewTracking({...newTracking, platform: e.target.value})}
            style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 16, color: '#FFF', marginBottom: 24 }}
          >
            <option value="meta">Meta Ads</option>
            <option value="google">Google Ads</option>
            <option value="tiktok">TikTok Ads</option>
          </select>
          <button onClick={handleCreateTracking} style={{ width: '100%', background: COLORS.yellow, color: '#000', border: 'none', borderRadius: 8, padding: 14, fontWeight: 800, cursor: 'pointer' }}>Cadastrar para Ciclo de 7 Dias</button>
        </div>
      </Modal>

      {/* OPTIMIZATION MODAL */}
      <Modal isOpen={isOptModalOpen} onClose={() => setIsOptModalOpen(false)} title={`Registrar Otimização: ${selectedTracking?.name}`}>
        <div style={{ padding: 24 }}>
          <textarea 
            rows={6} value={optComment} onChange={e => setOptComment(e.target.value)}
            placeholder="Descreva as alterações feitas (públicos, lances, novos criativos...)"
            style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 16, color: '#FFF', fontSize: 14, outline: 'none', marginBottom: 24 }}
          />
          <button onClick={handleSaveOptimization} style={{ width: '100%', background: COLORS.yellow, color: '#000', border: 'none', borderRadius: 8, padding: 14, fontWeight: 800, cursor: 'pointer' }}>Salvar no Histórico</button>
        </div>
      </Modal>

      {/* RECENT LOGS */}
      <div style={{ marginTop: 40 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Últimas Atividades de Otimização</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {logs.map(log => (
            <div key={log.id} style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.yellow, marginBottom: 8 }}>{log.campaign_trackings?.name}</div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>"{log.comment}"</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12}/> {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}
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
