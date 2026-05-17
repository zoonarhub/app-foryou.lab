import { useState } from 'react';
import { useApp } from '../data/store';
import { Plus, Eye, Download, Send, FileText } from 'lucide-react';
import Modal from '../components/Modal';

const emptyReport = { clienteId: '', periodo: '', resumo: '', impressoes: '', cliques: '', cpl: '', conversoes: '', alcance: '', engajamento: '', seguidores: '', destaques: '', proximosPassos: '' };

export default function Reports() {
  const { clients, addItem, addToast } = useApp();
  const [showCreator, setShowCreator] = useState(false);
  const [showPreview, setShowPreview] = useState(null);
  const [form, setForm] = useState(emptyReport);

  const [reports, setReports] = useState([
    { id: '1', clienteId: '1', periodo: 'Abril 2026', status: 'enviado', data: '2026-05-02', resumo: 'Mês espetacular! As campanhas focadas no jantar aumentaram o fluxo presencial em 45%, e o custo por clique para reservas caiu 12%.', impressoes: '245.000', cliques: '12.300', cpl: '1.20', conversoes: '1.450' },
    { id: '2', clienteId: '2', periodo: 'Abril 2026', status: 'rascunho', data: '2026-05-05', resumo: 'Estabilidade nas vendas do delivery via WhatsApp. Iniciamos testes com novos Reels de apetite appeal para o final de semana.', impressoes: '180.000', cliques: '9.100', cpl: '1.80', conversoes: '850' },
    { id: '3', clienteId: '3', periodo: 'Abril 2026', status: 'enviado', data: '2026-05-03', resumo: 'Presença no Google Maps reestruturada. O restaurante do café subiu para a primeira página na busca local da região.', impressoes: '120.000', cliques: '6.200', cpl: '0.90', conversoes: '340' },
  ]);

  const getClientName = (id) => clients.find(c => c.id === id)?.empresa || 'Cliente';

  const handleCreate = () => {
    if (!form.clienteId) { addToast('Selecione um cliente', 'error'); return; }
    const newReport = { ...form, id: Date.now().toString(), status: 'rascunho', data: new Date().toISOString().split('T')[0] };
    setReports(prev => [...prev, newReport]);
    addToast('Relatório salvo!');
    setShowCreator(false);
    setForm(emptyReport);
  };

  const exportCSV = (r) => {
    const data = `Cliente,Período,Impressões,Cliques,CPL,Conversões,Resumo\n"${getClientName(r.clienteId)}","${r.periodo}","${r.impressoes}","${r.cliques}","${r.cpl}","${r.conversoes}","${r.resumo}"`;
    const blob = new Blob([data], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `relatorio_${Date.now()}.csv`; a.click();
    addToast('CSV exportado!');
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Relatórios</h2><div className="breadcrumb">Relatórios mensais de performance</div></div>
        <button className="btn btn-primary" onClick={() => setShowCreator(true)}><Plus size={16} /> Novo Relatório</button>
      </div>
      <div className="page-body">
        <div className="card"><table className="data-table">
          <thead><tr><th>Cliente</th><th>Período</th><th>Status</th><th>Data</th><th>Ações</th></tr></thead>
          <tbody>{reports.map(r => (
            <tr key={r.id}>
              <td style={{ fontWeight: 600 }}>{getClientName(r.clienteId)}</td>
              <td>{r.periodo}</td>
              <td><span className={`badge ${r.status === 'enviado' ? 'badge-green' : 'badge-yellow'}`}>{r.status}</span></td>
              <td style={{ fontSize: 12 }}>{new Date(r.data).toLocaleDateString('pt-BR')}</td>
              <td><div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setShowPreview(r)} className="btn btn-sm btn-secondary" style={{ padding: '4px 8px' }}><Eye size={12} /> Ver</button>
                <button onClick={() => exportCSV(r)} className="btn btn-sm btn-secondary" style={{ padding: '4px 8px' }}><Download size={12} /></button>
                <button onClick={() => { setReports(prev => prev.map(x => x.id === r.id ? { ...x, status: 'enviado' } : x)); addToast('Relatório enviado!'); }} className="btn btn-sm btn-primary" style={{ padding: '4px 8px' }}><Send size={12} /></button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
        {reports.length === 0 && <div className="empty-state"><FileText size={48} /><h4>Sem relatórios</h4><p>Crie seu primeiro relatório mensal.</p></div>}
        </div>
      </div>

      {/* Creator Modal */}
      <Modal isOpen={showCreator} onClose={() => setShowCreator(false)} title="📊 Criar Relatório" size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCreator(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleCreate}>Salvar</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Cliente *</label>
            <select className="form-select" value={form.clienteId} onChange={e => setForm({...form, clienteId: e.target.value})}>
              <option value="">Selecione...</option>{clients.filter(c => c.status === 'ativo').map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Período</label><input className="form-input" value={form.periodo} onChange={e => setForm({...form, periodo: e.target.value})} placeholder="Ex: Abril 2026" /></div>
        </div>
        <div className="form-group"><label className="form-label">Resumo Executivo</label><textarea className="form-textarea" value={form.resumo} onChange={e => setForm({...form, resumo: e.target.value})} /></div>
        <h4 style={{ fontSize: 14, fontWeight: 700, margin: '16px 0 12px', color: 'var(--text-primary)' }}>📊 Tráfego Pago</h4>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Impressões</label><input className="form-input" value={form.impressoes} onChange={e => setForm({...form, impressoes: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Cliques</label><input className="form-input" value={form.cliques} onChange={e => setForm({...form, cliques: e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">CPL (R$)</label><input className="form-input" value={form.cpl} onChange={e => setForm({...form, cpl: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Conversões</label><input className="form-input" value={form.conversoes} onChange={e => setForm({...form, conversoes: e.target.value})} /></div>
        </div>
        <h4 style={{ fontSize: 14, fontWeight: 700, margin: '16px 0 12px', color: 'var(--text-primary)' }}>📱 Redes Sociais</h4>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Alcance</label><input className="form-input" value={form.alcance} onChange={e => setForm({...form, alcance: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Engajamento</label><input className="form-input" value={form.engajamento} onChange={e => setForm({...form, engajamento: e.target.value})} /></div>
        </div>
        <div className="form-group"><label className="form-label">Destaques</label><textarea className="form-textarea" value={form.destaques} onChange={e => setForm({...form, destaques: e.target.value})} /></div>
        <div className="form-group"><label className="form-label">Próximos Passos</label><textarea className="form-textarea" value={form.proximosPassos} onChange={e => setForm({...form, proximosPassos: e.target.value})} /></div>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={!!showPreview} onClose={() => setShowPreview(null)} title={`📋 Relatório — ${showPreview ? getClientName(showPreview.clienteId) : ''}`} size="lg">
        {showPreview && (
          <div>
            <div style={{ padding: 16, background: 'rgba(255,214,0,.08)', borderRadius: 8, marginBottom: 16, borderLeft: '4px solid #FFD600' }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>foryou.lab — Relatório de Performance</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{getClientName(showPreview.clienteId)} • {showPreview.periodo}</div>
            </div>
            {showPreview.resumo && <div style={{ marginBottom: 16 }}><h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Resumo</h4><p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{showPreview.resumo}</p></div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {[['Impressões', showPreview.impressoes], ['Cliques', showPreview.cliques], ['CPL', showPreview.cpl ? `R$ ${showPreview.cpl}` : '—'], ['Conversões', showPreview.conversoes]].map(([k, v]) => (
                <div key={k} style={{ padding: 12, background: 'var(--gray-bg)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#FFD600' }}>{v || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{k}</div>
                </div>
              ))}
            </div>
            {showPreview.destaques && <div style={{ marginBottom: 12 }}><h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Destaques</h4><p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{showPreview.destaques}</p></div>}
          </div>
        )}
      </Modal>
    </>
  );
}
