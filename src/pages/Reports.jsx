import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../data/store';
import { Plus, Search, Eye, Copy, Trash2, Send, BarChart3, Link2, ExternalLink, Users, Calendar, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import axios from 'axios';

const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v || 0);

export default function Reports() {
  const { clients, teamMembers, reports, addItem, deleteItem, addToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nome: '', clienteId: '', contaAnuncioId: '', contaAnuncioNome: '', responsavelId: '' });

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

  const filtered = useMemo(() =>
    (reports || []).filter(r => r && (!search ||
      (r.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.clienteNome || '').toLowerCase().includes(search.toLowerCase())
    )).sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0)),
    [reports, search]);

  const activeClients = clients.filter(c => c.status === 'ativo');
  const totalReports = (reports || []).length;
  const activeReports = (reports || []).filter(r => r?.status === 'ativo').length;

  const handleCreate = async () => {
    if (!form.nome.trim()) { addToast('Digite o nome do relatório', 'error'); return; }
    if (!form.clienteId) { addToast('Selecione um cliente', 'error'); return; }

    try {
      const client = clients.find(c => c.id === form.clienteId);
      const member = teamMembers.find(m => m.id === form.responsavelId);
      const account = adAccounts.find(a => a.id === form.contaAnuncioId);

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
      });
      addToast('Relatório criado com sucesso!');
      setShowModal(false);
      setForm({ nome: '', clienteId: '', contaAnuncioId: '', contaAnuncioNome: '', responsavelId: '' });
    } catch (error) {
      console.error("Erro ao salvar relatório:", error);
      addToast(`Erro ao salvar: ${error.message || error}`, 'error');
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

                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={11} /> Criado em {r.criadoEm ? new Date(r.criadoEm).toLocaleDateString('pt-BR') : '—'}
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
                  <button className="btn btn-sm btn-secondary" onClick={() => copyLink(r)} title="Copiar link">
                    <Copy size={12} /> Copiar Link
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
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleCreate}>Criar Relatório</button></>}>

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
