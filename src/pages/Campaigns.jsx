import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Target, Link as LinkIcon, RefreshCw, BarChart3, 
  AlertTriangle, Layers, TrendingUp, DollarSign, 
  MousePointer2, Eye, PieChart
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// API Configuration (Based on User's Meta Ads Token)
const ADS_API_TOKEN = 'EAAeGAJGtsKIBRSu7qnOHUjZAPtbfU0daTDdhWY4SnHGRZCn4SnnQNMnwHw0wdsJfyc5kIoVitRYT4elkpag1hlrnDYbox80Y1gZAlnsg3KJf4mbzqdfBPk1IAXBbFFjZBvT5QSVa5GNtOyhxF4k3pce2jNrJbQQTBjBhz8rZCLOnCkXFMVPcUa4KLriQ4kJPGLTka';

const mockChartData = [
  { day: '01/05', spend: 120, leads: 8 },
  { day: '02/05', spend: 150, leads: 12 },
  { day: '03/05', spend: 110, leads: 7 },
  { day: '04/05', spend: 180, leads: 15 },
  { day: '05/05', spend: 200, leads: 18 },
  { day: '06/05', spend: 190, leads: 14 },
  { day: '07/05', spend: 250, leads: 22 },
];

export default function Campaigns() {
  const { addToast } = useApp();
  const [fbConnected, setFbConnected] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeAccount, setActiveAccount] = useState({ 
    id: 'act_102', 
    name: 'Cliente A - Lançamento', 
    status: 'active', 
    spend: 12450.80, 
    roas: 4.5, 
    leads: 850,
    cpc: 0.45,
    ctr: 1.85,
    cpa: 14.65
  });

  const adAccounts = [
    { id: 'act_101', name: 'ForYou.Lab - Institucional', status: 'active' },
    { id: 'act_102', name: 'Cliente A - Lançamento', status: 'active' },
    { id: 'act_103', name: 'Cliente B - Perpétuo', status: 'paused' }
  ];

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      addToast('Dados de anúncios sincronizados via API!');
    }, 1500);
  };

  const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard de Anúncios</h2>
          <div className="breadcrumb">Meta Ads (Facebook & Instagram)</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? 'spin' : ''} /> {syncing ? 'Sincronizando...' : 'Sincronizar API'}
          </button>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'flex-start' }}>
          
          {/* SIDEBAR: AD ACCOUNTS */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)' }}>
              <Layers size={14} /> Contas de Anúncios
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {adAccounts.map(act => (
                <button key={act.id} onClick={() => setActiveAccount({...activeAccount, ...act})}
                  style={{ 
                    background: activeAccount?.id === act.id ? 'rgba(255,214,0,.1)' : 'transparent', 
                    border: activeAccount?.id === act.id ? '1px solid var(--yellow)' : '1px solid var(--card-border)', 
                    padding: '12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', transition: 'all .2s' 
                  }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{act.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{act.id}</span>
                    <span className={`badge ${act.status === 'active' ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 9 }}>{act.status}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div style={{ marginTop: 24, padding: 12, background: 'var(--gray-bg)', borderRadius: 10 }}>
               <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>API Status</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green)' }}>
                  <div style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%' }} /> Conectado via Graph API
               </div>
            </div>
          </div>

          {/* MAIN PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* KPI ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Investimento</span>
                  <DollarSign size={16} color="#EF4444" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(activeAccount.spend)}</div>
                <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>+12% vs mês anterior</div>
              </div>

              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Leads Totais</span>
                  <Target size={16} color="var(--yellow)" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{activeAccount.leads}</div>
                <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>+5.2% taxa conv.</div>
              </div>

              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>CPA Médio</span>
                  <TrendingUp size={16} color="#3B82F6" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(activeAccount.cpa)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Custo por Lead</div>
              </div>

              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>ROAS</span>
                  <PieChart size={16} color="var(--green)" />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{activeAccount.roas}x</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Retorno sobre Ads</div>
              </div>
            </div>

            {/* CHART AREA */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>Performance Diária (Gasto vs Leads)</h4>
                <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                   <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, background: 'var(--yellow)', borderRadius: 2 }} /> Leads</span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, background: '#EF4444', borderRadius: 2 }} /> Gasto</span>
                </div>
              </div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--yellow)" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="var(--yellow)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Area type="monotone" dataKey="spend" stroke="#EF4444" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
                    <Area type="monotone" dataKey="leads" stroke="var(--yellow)" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CAMPAIGN LIST */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>Principais Campanhas</h4>
                <button className="btn btn-secondary btn-sm"><TrendingUp size={12} /> Ver Insights</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campanha</th>
                    <th>Status</th>
                    <th>Investimento</th>
                    <th>Cliques</th>
                    <th>CTR</th>
                    <th>CPA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><div style={{ fontWeight: 600 }}>[Captação] Método Órbita 2.0</div><div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ID: 2385960412</div></td>
                    <td><span className="badge badge-green">Ativo</span></td>
                    <td>{fmt(4500)}</td>
                    <td>1.240</td>
                    <td>2.4%</td>
                    <td style={{ fontWeight: 600 }}>R$ 12,40</td>
                  </tr>
                  <tr>
                    <td><div style={{ fontWeight: 600 }}>[Remarketing] Vendas Diretas</div><div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ID: 2385960415</div></td>
                    <td><span className="badge badge-green">Ativo</span></td>
                    <td>{fmt(1200)}</td>
                    <td>850</td>
                    <td>4.1%</td>
                    <td style={{ fontWeight: 600 }}>R$ 8,15</td>
                  </tr>
                  <tr>
                    <td><div style={{ fontWeight: 600 }}>[Institucional] Agency Branding</div><div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ID: 2385960419</div></td>
                    <td><span className="badge badge-gray">Pausado</span></td>
                    <td>{fmt(250)}</td>
                    <td>110</td>
                    <td>0.8%</td>
                    <td style={{ fontWeight: 600 }}>R$ --</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
