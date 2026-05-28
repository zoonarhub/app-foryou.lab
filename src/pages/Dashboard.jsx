import { useApp } from '../data/store';
import { Users, DollarSign, UserPlus, FileText, TrendingUp, CheckCircle, AlertTriangle, Sun, Moon } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v);
const COLORS = ['#FFD600', '#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function Dashboard() {
  const { clients, leads, proposals, tasks, financials, whatsappConversations, theme, toggleTheme } = useApp();

  const activeClients = (clients || []).filter(c => c && c.status === 'ativo');
  const mrr = activeClients.reduce((s, c) => s + (Number(c.mrr) || 0), 0);
  const recentLeads = (leads || []).filter(l => {
    if (!l || !l.dataEntrada) return false;
    const d = new Date(l.dataEntrada);
    return Date.now() - d.getTime() < 30 * 86400000;
  });
  const pendingTasks = (tasks || []).filter(t => t && t.status !== 'concluido');
  
  // Calculate Overdue WhatsApp Interactions
  const overdueChats = (whatsappConversations || []).filter(c => 
    c && c.status === 'aberta' && c.lastInteraction && (new Date() - new Date(c.lastInteraction)) > 1800000
  );

  // Chart data
  const statusData = [
    { name: 'Ativo', value: (clients || []).filter(c => c && c.status === 'ativo').length },
    { name: 'Onboarding', value: (clients || []).filter(c => c && c.status === 'onboarding').length },
    { name: 'Pausado', value: (clients || []).filter(c => c && c.status === 'pausado').length },
  ].filter(d => d.value > 0);

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const revenueData = months.map((m, i) => ({
    mes: m,
    receita: (financials || []).filter(f => f && f.tipo === 'receita').reduce((s, f) => s + (Number(f.valor) || 0), 0) / (months.length - i) * (i + 1) * (0.8 + Math.random() * 0.4),
  }));

  return (
    <>
      <div className="page-header">
        <div><h2>Dashboard</h2><div className="breadcrumb">Visão geral da agência</div></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={toggleTheme} className="btn btn-secondary btn-sm" title="Alternar tema">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>
      <div className="page-body">
        
        {/* CRITICAL ALERTS BANNER */}
        {overdueChats.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 12, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#EF4444', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#EF4444', fontSize: 16 }}>Atenção: {overdueChats.length} atendimentos atrasados!</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Existem clientes aguardando resposta há mais de 30 minutos no WhatsApp.</div>
            </div>
            <button className="btn btn-primary" style={{ background: '#EF4444', borderColor: '#EF4444' }} onClick={() => window.location.hash = '#/whatsapp'}>Ver Conversas</button>
          </div>
        )}

        <div className="kpi-grid">
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(255,214,0,.12)' }}><Users size={18} color="#FFD600" /></div>
            <div className="kpi-value">{activeClients.length}</div>
            <div className="flex justify-between items-center"><span className="kpi-label">Clientes Ativos</span></div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(34,197,94,.12)' }}><DollarSign size={18} color="#22C55E" /></div>
            <div className="kpi-value">{fmt(mrr)}</div>
            <div className="kpi-label">MRR</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(59,130,246,.12)' }}><UserPlus size={18} color="#3B82F6" /></div>
            <div className="kpi-value">{recentLeads.length}</div>
            <div className="kpi-label">Leads (30d)</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(239,68,68,.12)' }}><AlertTriangle size={18} color="#EF4444" /></div>
            <div className="kpi-value" style={{ color: overdueChats.length > 0 ? '#EF4444' : 'inherit' }}>{overdueChats.length}</div>
            <div className="kpi-label">Atendimentos Atrasados</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(245,158,11,.12)' }}><TrendingUp size={18} color="#F59E0B" /></div>
            <div className="kpi-value">{leads.length > 0 ? Math.round(activeClients.length / leads.length * 100) : 0}%</div>
            <div className="kpi-label">Conversão</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(139,92,246,.12)' }}><CheckCircle size={18} color="#8B5CF6" /></div>
            <div className="kpi-value">{pendingTasks.length}</div>
            <div className="kpi-label">Tarefas Pendentes</div>
          </div>
        </div>

        {clients.length === 0 && leads.length === 0 ? (
          <div className="card empty-state">
            <AlertTriangle size={48} />
            <h4>Comece a usar o foryou.lab</h4>
            <p>Adicione seus primeiros clientes e leads para ver os dados aqui.</p>
          </div>
        ) : (
          <div className="charts-grid">
            <div className="card chart-card">
              <h4>📈 Faturamento</h4>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="mes" fontSize={11} stroke="var(--text-muted)" />
                  <YAxis fontSize={11} tickFormatter={v => `${Math.round(v/1000)}k`} stroke="var(--text-muted)" />
                  <Tooltip formatter={v => fmt(v)} />
                  <Line type="monotone" dataKey="receita" stroke="#FFD600" strokeWidth={3} dot={{ r: 3, fill: '#FFD600' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card chart-card">
              <h4>🥧 Clientes por Status</h4>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state" style={{ padding: 40 }}><p>Adicione clientes para ver dados.</p></div>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
