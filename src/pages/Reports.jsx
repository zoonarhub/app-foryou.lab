import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../data/store';
import { Plus, Search, Eye, Copy, Trash2, Send, BarChart3, Link2, ExternalLink, Users, Calendar, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import axios from 'axios';

const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v || 0);

export default function Reports() {
  const { clients, teamMembers, reports, addItem, updateItem, deleteItem, addToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nome: '', clienteId: '', contaAnuncioId: '', contaAnuncioNome: '', responsavelId: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [syncingReportId, setSyncingReportId] = useState(null);

  // Ad accounts
  const [adAccounts, setAdAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const fbToken = typeof window !== 'undefined' ? localStorage.getItem('fb_ads_token') : null;

  useEffect(() => {
    if (fbToken) fetchAdAccounts();
  }, [fbToken]);

  const fetchAdAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await axios.get('https://graph.facebook.com/v18.0/me/adaccounts', {
        params: { access_token: fbToken, fields: 'name,account_id,account_status' }
      });
      setAdAccounts((res.data.data || []).map(a => ({ id: a.id, name: a.name, status: a.account_status })));
    } catch (e) {
      console.warn('Erro ao carregar contas:', e);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchPeriodData = async (contaAnuncioId, preset) => {
    try {
      // 1) Fetch main insights
      const kpiRes = await axios.get(`https://graph.facebook.com/v18.0/${contaAnuncioId}/insights`, {
        params: { access_token: fbToken, date_preset: preset, fields: 'spend,clicks,cpm,cpc,ctr,frequency,impressions,actions' }
      });
      const accountData = kpiRes.data.data[0] || {};
      
      let results = 0, revenue = 0;
      let pageViews = 0, addToCart = 0, initCheckout = 0;
      
      if (accountData.actions) {
        const targetActions = accountData.actions.filter(a => ['lead', 'purchase', 'messages'].includes(a.action_type));
        results = targetActions.reduce((sum, a) => sum + parseInt(a.value), 0);
        revenue = results * 150; 

        const pvAct = accountData.actions.find(a => ['page_view', 'landing_page_view'].includes(a.action_type));
        pageViews = pvAct ? parseInt(pvAct.value) : 0;
        
        const atcAct = accountData.actions.find(a => ['add_to_cart'].includes(a.action_type));
        addToCart = atcAct ? parseInt(atcAct.value) : 0;
        
        const icAct = accountData.actions.find(a => ['initiate_checkout'].includes(a.action_type));
        initCheckout = icAct ? parseInt(icAct.value) : 0;
      }
      
      const spend = parseFloat(accountData.spend || 0);
      const realKPIs = {
        spend, revenue, roas: spend > 0 ? (revenue / spend) : 0, clicks: parseInt(accountData.clicks || 0),
        cpm: parseFloat(accountData.cpm || 0), cpc: parseFloat(accountData.cpc || 0), ctr: parseFloat(accountData.ctr || 0),
        frequency: parseFloat(accountData.frequency || 0), impressions: parseInt(accountData.impressions || 0),
        results, cpl: results > 0 ? spend / results : 0,
        pageViews, addToCart, initCheckout
      };

      // 2) Fetch campaigns
      const campRes = await axios.get(`https://graph.facebook.com/v18.0/${contaAnuncioId}/campaigns`, {
        params: { access_token: fbToken, fields: `id,name,status,objective,daily_budget,lifetime_budget,insights.date_preset(${preset}){spend,actions,impressions,clicks,cpc,ctr}`, limit: 50 }
      });
      const realCampaigns = campRes.data.data.map(c => {
        const ins = c.insights?.data?.[0] || {};
        const cSpend = parseFloat(ins.spend || 0);
        let cResults = 0;
        if (ins.actions) {
           const cTarget = ins.actions.filter(a => ['lead', 'purchase', 'messages'].includes(a.action_type));
           cResults = cTarget.reduce((sum, a) => sum + parseInt(a.value), 0);
        }
        return {
          id: c.id, name: c.name, status: c.status === 'ACTIVE' ? 'ativo' : 'inativo', objective: c.objective || 'CONVERSIONS',
          budget: parseFloat(c.daily_budget || c.lifetime_budget || 0) / 100,
          spend: cSpend, revenue: cResults * 150, roas: cSpend > 0 ? (cResults * 150) / cSpend : 0,
          cpl: cResults > 0 ? cSpend / cResults : 0, ctr: parseFloat(ins.ctr || 0), cpc: parseFloat(ins.cpc || 0),
          impressions: parseInt(ins.impressions || 0), clicks: parseInt(ins.clicks || 0), results: cResults
        };
      });

      // 3) Fetch chart data
      const chartRes = await axios.get(`https://graph.facebook.com/v18.0/${contaAnuncioId}/insights`, {
        params: { access_token: fbToken, date_preset: preset, time_increment: 1, fields: 'date_start,spend,actions' }
      });
      const realChartData = chartRes.data.data.map(d => {
        let dRes = 0;
        if (d.actions) {
           const dTarget = d.actions.filter(a => ['lead', 'purchase', 'messages'].includes(a.action_type));
           dRes = dTarget.reduce((sum, a) => sum + parseInt(a.value), 0);
        }
        const dt = new Date(d.date_start);
        return { date: `${dt.getDate()}/${dt.getMonth()+1}`, gasto: parseFloat(d.spend || 0), receita: dRes * 150 };
      });

      // 4) Fetch Demographics
      const demoRes = await axios.get(`https://graph.facebook.com/v18.0/${contaAnuncioId}/insights`, {
        params: { access_token: fbToken, date_preset: preset, breakdowns: 'age,gender', fields: 'impressions,spend' }
      });
      const demoData = demoRes.data.data || [];
      const ageGroups = {};
      demoData.forEach(d => {
        const age = d.age || 'Desconhecido';
        const imp = parseInt(d.impressions || 0);
        ageGroups[age] = (ageGroups[age] || 0) + imp;
      });
      const totalDemoImpressions = Object.values(ageGroups).reduce((a, b) => a + b, 0);
      const realDemographics = Object.entries(ageGroups).map(([range, val]) => ({
        name: `${range} anos`,
        value: totalDemoImpressions > 0 ? Math.round((val / totalDemoImpressions) * 100) : 0
      })).sort((a, b) => a.name.localeCompare(b.name));

      // 5) Fetch Ads / Creatives
      const adsRes = await axios.get(`https://graph.facebook.com/v18.0/${contaAnuncioId}/ads`, {
        params: {
          access_token: fbToken,
          fields: `name,creative{id,name,thumbnail_url},insights.date_preset(${preset}){spend,actions,ctr,cpc}`,
          limit: 12
        }
      });
      const adsData = adsRes.data.data || [];
      const realCreatives = adsData.map(ad => {
        const ins = ad.insights?.data?.[0] || {};
        const spend = parseFloat(ins.spend || 0);
        let conversions = 0;
        if (ins.actions) {
          const target = ins.actions.filter(a => ['lead', 'purchase', 'messages'].includes(a.action_type));
          conversions = target.reduce((sum, a) => sum + parseInt(a.value), 0);
        }
        return {
          title: ad.name || ad.creative?.name || 'Anúncio sem nome',
          thumbnail: ad.creative?.thumbnail_url || null,
          conversions,
          cpa: conversions > 0 ? spend / conversions : 0,
          ctr: parseFloat(ins.ctr || 0),
          spend
        };
      });

      return { realKPIs, realCampaigns, realChartData, realDemographics, realCreatives };
    } catch (err) {
      console.error(`Erro ao carregar período ${preset}:`, err);
      return null;
    }
  };

  const fetchReportSnapshot = async (contaAnuncioId) => {
    if (!contaAnuncioId || !fbToken) return null;
    try {
      const presets = [
        { key: 'last_7d', val: 'last_7d' },
        { key: 'last_15d', val: 'last_15d' },
        { key: 'last_30d', val: 'last_30d' },
        { key: 'last_90d', val: 'last_90d' }
      ];
      const results = await Promise.all(presets.map(async (p) => {
        const data = await fetchPeriodData(contaAnuncioId, p.val);
        return { key: p.key, data };
      }));
      const snapshot = {};
      results.forEach(r => {
        if (r.data) snapshot[r.key] = r.data;
      });
      return snapshot;
    } catch (err) {
      console.error('Error getting snapshot for report:', err);
      return null;
    }
  };

  const filtered = useMemo(() =>
    (reports || []).filter(r => r && (!search ||
      (r.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.clienteNome || '').toLowerCase().includes(search.toLowerCase())
    )).sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0)),
    [reports, search]);

  const activeClients = (clients || []).filter(c => c && c.status !== 'cancelado');
  const totalReports = (reports || []).length;
  const activeReports = (reports || []).filter(r => r?.status === 'ativo').length;

  const handleCreate = async () => {
    if (!form.nome.trim()) { addToast('Digite o nome do relatório', 'error'); return; }
    if (!form.clienteId) { addToast('Selecione um cliente', 'error'); return; }
    if (isSaving) return;
    setIsSaving(true);

    try {
      const client = clients.find(c => c.id === form.clienteId);
      const member = teamMembers.find(m => m.id === form.responsavelId);
      const account = adAccounts.find(a => a.id === form.contaAnuncioId);

      // Get real data snapshot
      addToast('Buscando dados em tempo real do Meta Ads...', 'info');
      const snapshot = await fetchReportSnapshot(form.contaAnuncioId);

      await addItem('reports', {
        nome: form.nome.trim(),
        clienteId: form.clienteId,
        clienteNome: client?.empresa || '',
        contaAnuncioId: form.contaAnuncioId || '',
        contaAnuncioNome: account?.name || form.contaAnuncioNome || '',
        responsavelId: form.responsavelId || '',
        responsavelNome: member?.nome || '',
        status: 'ativo',
        criadoEm: new Date().toISOString(),
        snapshot: snapshot || null
      });
      addToast('Relatório criado com dados reais!');
      setShowModal(false);
      setForm({ nome: '', clienteId: '', contaAnuncioId: '', contaAnuncioNome: '', responsavelId: '' });
    } catch (error) {
      console.error("Erro ao salvar relatório:", error);
      addToast(`Erro ao salvar: ${error.message || error}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncReport = async (report) => {
    if (!report.contaAnuncioId) {
      addToast('Este relatório não tem conta de anúncios vinculada.', 'warning');
      return;
    }
    setSyncingReportId(report.id);
    addToast('Sincronizando dados reais do relatório...', 'info');
    try {
      const snapshot = await fetchReportSnapshot(report.contaAnuncioId);
      if (snapshot) {
        await updateItem('reports', report.id, {
          snapshot,
          atualizadoEm: new Date().toISOString()
        });
        addToast('Dados do relatório atualizados com sucesso!');
      } else {
        addToast('Não foi possível carregar os dados reais da API.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Erro ao sincronizar relatório.', 'error');
    } finally {
      setSyncingReportId(null);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Excluir este relatório?')) {
      deleteItem('reports', id);
      addToast('Relatório excluído', 'warning');
    }
  };

  const copyLink = (r) => {
    const url = `${window.location.origin}/relatorio/${r.id}`;
    navigator.clipboard.writeText(url);
    addToast('Link copiado para a área de transferência!');
  };

  const openPublic = (r) => {
    window.open(`/relatorio/${r.id}`, '_blank');
  };

  const sendWhatsApp = (r) => {
    const client = clients.find(c => c.id === r.clienteId);
    const phone = (client?.whatsapp || '').replace(/\D/g, '') || '5511999999999';
    const url = `${window.location.origin}/relatorio/${r.id}`;
    const msg = encodeURIComponent(`Olá ${client?.nome || ''}! 📊\n\nSeu dashboard de performance está disponível:\n${url}\n\nAcesse para ver todas as métricas, gráficos e resultados em tempo real.\n\n— foryou.lab`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    addToast('Abrindo WhatsApp...');
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Relatórios</h2><div className="breadcrumb">Dashboards de performance com link público</div></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Novo Relatório</button>
      </div>
      <div className="page-body">
        {/* KPIs */}
        <div className="kpi-grid" style={{ marginBottom: 20 }}>
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(255,214,0,.12)' }}><BarChart3 size={18} color="#FFD600" /></div>
            <div className="kpi-value">{totalReports}</div>
            <div className="kpi-label">Total de Relatórios</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(34,197,94,.12)' }}><Eye size={18} color="#22C55E" /></div>
            <div className="kpi-value" style={{ color: '#22C55E' }}>{activeReports}</div>
            <div className="kpi-label">Ativos</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(59,130,246,.12)' }}><Users size={18} color="#3B82F6" /></div>
            <div className="kpi-value">{new Set((reports || []).map(r => r?.clienteId).filter(Boolean)).size}</div>
            <div className="kpi-label">Clientes com Relatório</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(139,92,246,.12)' }}><Link2 size={18} color="#8B5CF6" /></div>
            <div className="kpi-value">{totalReports}</div>
            <div className="kpi-label">Links Públicos</div>
          </div>
        </div>

        {/* Search */}
        <div className="search-bar" style={{ marginBottom: 16 }}>
          <div className="search-input-wrapper"><Search size={16} /><input placeholder="Buscar relatório ou cliente..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
          {filtered.map(r => {
            const member = teamMembers.find(m => m.id === r.responsavelId);
            return (
              <div key={r.id} className="card" style={{ padding: 22, transition: 'all .2s', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, background: 'radial-gradient(circle, rgba(255,214,0,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{r.nome}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={12} /> {r.clienteNome || '—'}
                    </div>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: 10 }}>● Ativo</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14, fontSize: 12 }}>
                  <div style={{ padding: '8px 10px', background: 'var(--gray-bg)', borderRadius: 8 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>Conta de Anúncio</div>
                    <div style={{ fontWeight: 600 }}>{r.contaAnuncioNome || '—'}</div>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--gray-bg)', borderRadius: 8 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>Responsável</div>
                    <div style={{ fontWeight: 600 }}>{r.responsavelNome || '—'}</div>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={11} /> Criado em {r.criadoEm ? new Date(r.criadoEm).toLocaleDateString('pt-BR') : '—'}
                  </div>
                  {r.atualizadoEm && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Atualizado: {new Date(r.atualizadoEm).toLocaleTimeString('pt-BR')}
                    </div>
                  )}
                </div>

                {/* Link público */}
                <div style={{ padding: '8px 12px', background: 'rgba(255,214,0,.06)', border: '1px solid rgba(255,214,0,.15)', borderRadius: 8, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Link2 size={13} color="#FFD600" />
                  <span style={{ fontSize: 11, color: '#FFD600', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {window.location.origin}/relatorio/{r.id}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 1 }}>PERMANENTE</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => openPublic(r)} title="Visualizar dashboard">
                    <ExternalLink size={12} /> Abrir
                  </button>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    onClick={() => handleSyncReport(r)} 
                    disabled={syncingReportId === r.id}
                    title="Atualizar dados do Facebook Ads"
                  >
                    <RefreshCw size={12} className={syncingReportId === r.id ? 'spin' : ''} /> 
                    {syncingReportId === r.id ? 'Sinc...' : 'Sincronizar'}
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => copyLink(r)} title="Copiar link">
                    <Copy size={12} /> Copiar
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={() => sendWhatsApp(r)} title="Enviar via WhatsApp">
                    <Send size={12} /> WhatsApp
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleDelete(r.id)} style={{ color: 'var(--red)', marginLeft: 'auto' }} title="Excluir">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="card empty-state">
            <BarChart3 size={48} />
            <h4>Nenhum relatório</h4>
            <p>Crie seu primeiro relatório de performance com dashboard público.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> Novo Relatório</button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="📊 Novo Relatório" size="md"
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Cancelar</button><button className="btn btn-primary" onClick={handleCreate} disabled={isSaving}>{isSaving ? 'Criando...' : 'Criar Relatório'}</button></>}>

        <div className="form-group">
          <label className="form-label">Nome do Relatório *</label>
          <input className="form-input" placeholder="Ex: Dashboard Mensal - Restaurante XYZ" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Cliente *</label>
          <select className="form-select" value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })}>
            <option value="">Selecione o cliente...</option>
            {activeClients.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Conta de Anúncio *</label>
          <select 
            className="form-select" 
            value={form.contaAnuncioId} 
            onChange={e => {
              const acc = adAccounts.find(a => a.id === e.target.value);
              setForm({ ...form, contaAnuncioId: e.target.value, contaAnuncioNome: acc?.name || '' });
            }}
            disabled={adAccounts.length === 0}
          >
            {adAccounts.length > 0 ? (
              <>
                <option value="">Selecione a conta...</option>
                {adAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </>
            ) : (
              <option value="">
                {fbToken ? (loadingAccounts ? '⏳ Carregando contas...' : '⚠️ Nenhuma conta encontrada') : '💡 Conecte o Meta Ads em Campanhas'}
              </option>
            )}
          </select>
          {!fbToken && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              * É necessário conectar a integração do Meta Ads na aba <strong>Campanhas</strong> para carregar as contas de anúncios aqui.
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Responsável</label>
          <select className="form-select" value={form.responsavelId} onChange={e => setForm({ ...form, responsavelId: e.target.value })}>
            <option value="">Selecione o responsável...</option>
            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.nome} — {m.cargo}</option>)}
          </select>
        </div>

        <div style={{ marginTop: 16, padding: 14, background: 'rgba(255,214,0,.06)', border: '1px solid rgba(255,214,0,.15)', borderRadius: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFD600', marginBottom: 4 }}>🔗 Link Público Permanente</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Ao criar o relatório, um link público será gerado automaticamente. Esse link <strong>nunca expira</strong> e pode ser compartilhado com o cliente para acompanhamento em tempo real.
          </div>
        </div>
      </Modal>
    </>
  );
}
