import { useState, useMemo } from 'react';
import { useApp } from '../data/store';
import { Plus, Search, Eye, Edit2, Archive, TrendingUp, Target, Users, BarChart3, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Modal from '../components/Modal';

const fmt = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(v);
const pct = v => `${Math.round(v)}%`;
const emptyProj = { clienteId:'', faturamentoAtual:0, investimento:0, metaFaturamento:0, dataInicio:'', dataFim:'', taxaCrescimento:30, servicos:[], observacoes:'', status:'ativa', atualizacoes:[] };
const servicosOpts = ['Tráfego Pago','Social Mídia','SEO','Branding','CRM','Site'];
const statusConf = { ativa:{label:'Em andamento',badge:'badge-green',icon:'🟢'}, concluida:{label:'Concluída',badge:'badge-blue',icon:'✅'}, superada:{label:'Superada',badge:'badge-yellow',icon:'📊'}, abaixo:{label:'Abaixo do esperado',badge:'badge-red',icon:'⚠️'} };

export default function ResultProjections() {
  const { resultProjections, clients, addItem, updateItem, deleteItem, getClient, addToast } = useApp();
  const projs = resultProjections || [];
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProj);
  const [detail, setDetail] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [updForm, setUpdForm] = useState({ mes:'', faturamentoReal:0, investimentoReal:0, obs:'' });

  const filtered = useMemo(() => projs.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterClient && p.clienteId !== filterClient) return false;
    if (search) { const c = getClient(p.clienteId); if (c && !c.empresa.toLowerCase().includes(search.toLowerCase())) return false; }
    return true;
  }), [projs, filterStatus, filterClient, search, getClient]);

  const ativas = projs.filter(p => p.status === 'ativa').length;
  const avgGrowth = projs.length ? projs.reduce((a,p) => a + (p.taxaCrescimento||0), 0) / projs.length : 0;
  const avgROI = projs.length ? projs.reduce((a,p) => a + ((p.metaFaturamento||0) / Math.max(p.investimento||1, 1)), 0) / projs.length : 0;
  const clientsWithProj = new Set(projs.filter(p => p.status === 'ativa').map(p => p.clienteId)).size;

  const openCreate = () => { setEditing(null); setForm(emptyProj); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({...emptyProj,...p}); setShowModal(true); };
  const handleSave = () => {
    if (!form.clienteId) { addToast('Selecione um cliente','error'); return; }
    if (editing) { updateItem('resultProjections', editing.id, form); addToast('Projeção atualizada!'); }
    else { addItem('resultProjections', form); addToast('Projeção criada!'); }
    setShowModal(false);
  };

  const getProgress = (p) => {
    if (!p.dataInicio || !p.dataFim) return 0;
    const s=new Date(p.dataInicio).getTime(), e=new Date(p.dataFim).getTime(), n=Date.now();
    return Math.min(100, Math.max(0, Math.round(((n-s)/(e-s))*100)));
  };

  const getChartData = (p) => {
    if (!p.dataInicio || !p.dataFim) return [];
    const s=new Date(p.dataInicio), e=new Date(p.dataFim);
    const months=[]; let d=new Date(s);
    while(d<=e){ months.push(new Date(d)); d.setMonth(d.getMonth()+1); }
    const monthlyGrowth = (p.taxaCrescimento||30) / 100 / Math.max(months.length-1,1);
    return months.map((m,i) => {
      const proj = (p.faturamentoAtual||0) * (1 + monthlyGrowth * i);
      const upd = (p.atualizacoes||[]).find(u => u.mes === m.toISOString().slice(0,7));
      return { mes: m.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}), projetado: Math.round(proj), realizado: upd ? upd.faturamentoReal : null };
    });
  };

  const addUpdate = () => {
    if (!updForm.mes || !detail) return;
    const upds = [...(detail.atualizacoes||[]), { ...updForm, timestamp: Date.now() }];
    updateItem('resultProjections', detail.id, { atualizacoes: upds });
    setDetail({...detail, atualizacoes: upds});
    addToast('Atualização registrada!'); setShowUpdate(false);
    setUpdForm({ mes:'', faturamentoReal:0, investimentoReal:0, obs:'' });
  };

  const roi = (p) => ((p.metaFaturamento||0) / Math.max(p.investimento||1,1)).toFixed(1);

  return (
    <>
      <div className="page-header">
        <div><h2>Projeções de Resultado</h2><div className="breadcrumb">Simule e acompanhe o crescimento dos seus clientes</div></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16}/> Nova Projeção</button>
      </div>
      <div className="page-body">
        {/* KPIs */}
        <div className="kpi-grid">
          <div className="card kpi-card"><div className="kpi-icon" style={{background:'rgba(255,214,0,.12)'}}><Target size={20} color="#FFD600"/></div><div className="kpi-value">{ativas}</div><span className="kpi-label">Projeções ativas</span></div>
          <div className="card kpi-card"><div className="kpi-icon" style={{background:'rgba(34,197,94,.12)'}}><TrendingUp size={20} color="#22C55E"/></div><div className="kpi-value">{pct(avgGrowth)}</div><span className="kpi-label">Crescimento médio</span></div>
          <div className="card kpi-card"><div className="kpi-icon" style={{background:'rgba(59,130,246,.12)'}}><BarChart3 size={20} color="#3B82F6"/></div><div className="kpi-value">{avgROI.toFixed(1)}x</div><span className="kpi-label">ROI médio</span></div>
          <div className="card kpi-card"><div className="kpi-icon" style={{background:'rgba(139,92,246,.12)'}}><Users size={20} color="#8B5CF6"/></div><div className="kpi-value">{clientsWithProj}</div><span className="kpi-label">Clientes c/ projeção</span></div>
        </div>

        {/* Filters */}
        <div className="search-bar">
          <div className="search-input-wrapper"><Search size={16}/><input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <select className="form-select" style={{width:140}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="">Status</option>{Object.entries(statusConf).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select>
          <select className="form-select" style={{width:160}} value={filterClient} onChange={e=>setFilterClient(e.target.value)}><option value="">Todos clientes</option>{(clients||[]).map(c=><option key={c.id} value={c.id}>{c.empresa}</option>)}</select>
        </div>

        {/* Cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))',gap:16}}>
          {filtered.map(p => {
            const c = getClient(p.clienteId);
            const prog = getProgress(p);
            const sc = statusConf[p.status]||statusConf.ativa;
            return (
              <div key={p.id} className="card" style={{padding:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    <div className="avatar" style={{background:'#FFD600',color:'#0A0A0A'}}>{(c?.empresa||'?').slice(0,2).toUpperCase()}</div>
                    <div><div style={{fontWeight:700,fontSize:15}}>{c?.empresa||'Sem cliente'}</div><div style={{fontSize:12,color:'var(--text-secondary)'}}>{p.dataInicio && p.dataFim ? `${new Date(p.dataInicio).toLocaleDateString('pt-BR',{month:'short',year:'numeric'})} — ${new Date(p.dataFim).toLocaleDateString('pt-BR',{month:'short',year:'numeric'})}` : '—'}</div></div>
                  </div>
                  <span className={`badge ${sc.badge}`}>{sc.icon} {sc.label}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                  <div style={{padding:10,background:'var(--gray-bg)',borderRadius:8}}><div style={{fontSize:11,color:'var(--text-secondary)'}}>Fat. Inicial</div><div style={{fontWeight:700,fontSize:15}}>{fmt(p.faturamentoAtual)}</div></div>
                  <div style={{padding:10,background:'var(--gray-bg)',borderRadius:8}}><div style={{fontSize:11,color:'var(--text-secondary)'}}>Fat. Projetado</div><div style={{fontWeight:700,fontSize:15,color:'#22C55E'}}>{fmt(p.metaFaturamento)}</div></div>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}><span style={{color:'var(--text-secondary)'}}>Progresso do período</span><span style={{fontWeight:700}}>{prog}%</span></div>
                  <div className="progress-bar" style={{height:6}}><div className="progress-fill" style={{width:`${prog}%`}}/></div>
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{fontSize:28,fontWeight:800,color:'#FFD600'}}>{roi(p)}x <span style={{fontSize:12,fontWeight:400,color:'var(--text-secondary)'}}>ROI</span></div>
                  <div style={{display:'flex',gap:4}}>
                    <button className="btn btn-sm btn-secondary" onClick={()=>setDetail(p)} title="Detalhes"><Eye size={12}/></button>
                    <button className="btn btn-sm btn-secondary" onClick={()=>openEdit(p)} title="Editar"><Edit2 size={12}/></button>
                    <button className="btn btn-sm btn-secondary" onClick={()=>{updateItem('resultProjections',p.id,{status:'arquivada'});addToast('Arquivada','warning');}} title="Arquivar" style={{color:'var(--red)'}}><Archive size={12}/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length===0 && <div className="card empty-state"><Target size={48}/><h4>Nenhuma projeção</h4><p>Crie sua primeira projeção de resultado.</p></div>}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={editing ? '✏️ Editar Projeção' : '➕ Nova Projeção'} size="lg" footer={<><button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}>Salvar</button></>}>
        <div className="form-group"><label className="form-label">Cliente *</label><select className="form-select" value={form.clienteId} onChange={e=>setForm({...form,clienteId:e.target.value})}><option value="">Selecione...</option>{(clients||[]).map(c=><option key={c.id} value={c.id}>{c.empresa}</option>)}</select></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Faturamento Atual (R$)</label><input className="form-input" type="number" value={form.faturamentoAtual} onChange={e=>setForm({...form,faturamentoAtual:Number(e.target.value)})}/></div>
          <div className="form-group"><label className="form-label">Investimento Marketing (R$/mês)</label><input className="form-input" type="number" value={form.investimento} onChange={e=>setForm({...form,investimento:Number(e.target.value)})}/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Meta de Faturamento (R$)</label><input className="form-input" type="number" value={form.metaFaturamento} onChange={e=>setForm({...form,metaFaturamento:Number(e.target.value)})}/></div>
          <div className="form-group"><label className="form-label">Taxa de Crescimento (%): <span style={{color:'#FFD600',fontWeight:700}}>{form.taxaCrescimento}%</span></label><input type="range" min={5} max={200} value={form.taxaCrescimento} onChange={e=>setForm({...form,taxaCrescimento:Number(e.target.value)})} style={{width:'100%',accentColor:'#FFD600'}}/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Data Início</label><input className="form-input" type="date" value={form.dataInicio} onChange={e=>setForm({...form,dataInicio:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Data Fim</label><input className="form-input" type="date" value={form.dataFim} onChange={e=>setForm({...form,dataFim:e.target.value})}/></div>
        </div>
        <div className="form-group"><label className="form-label">Serviços Contratados</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{servicosOpts.map(s=><label key={s} style={{display:'flex',alignItems:'center',gap:4,fontSize:13,cursor:'pointer',padding:'6px 12px',borderRadius:6,background:(form.servicos||[]).includes(s)?'rgba(255,214,0,.15)':'var(--gray-bg)',border:(form.servicos||[]).includes(s)?'1px solid #FFD600':'1px solid var(--card-border)'}}><input type="checkbox" checked={(form.servicos||[]).includes(s)} onChange={e=>{const sv=[...(form.servicos||[])];if(e.target.checked)sv.push(s);else sv.splice(sv.indexOf(s),1);setForm({...form,servicos:sv});}} style={{accentColor:'#FFD600'}}/>{s}</label>)}</div>
        </div>
        <div className="form-group"><label className="form-label">Observações</label><textarea className="form-textarea" value={form.observacoes||''} onChange={e=>setForm({...form,observacoes:e.target.value})}/></div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detail} onClose={()=>setDetail(null)} title={`📊 ${getClient(detail?.clienteId)?.empresa || 'Projeção'}`} size="lg">
        {detail && (()=>{
          const c=getClient(detail.clienteId);const chartData=getChartData(detail);const sc=statusConf[detail.status]||statusConf.ativa;
          const totalReal=(detail.atualizacoes||[]).reduce((a,u)=>a+u.faturamentoReal,0);
          return (<>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
              <div>
                <div className="card" style={{padding:16,marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><span className={`badge ${sc.badge}`}>{sc.icon} {sc.label}</span><span style={{fontSize:12,color:'var(--text-secondary)'}}>ROI: <strong style={{color:'#FFD600'}}>{roi(detail)}x</strong></span></div>
                  {[['Cliente',c?.empresa],['Período',`${detail.dataInicio||'—'} a ${detail.dataFim||'—'}`],['Investimento',fmt(detail.investimento)],['Meta',fmt(detail.metaFaturamento)]].map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--card-border)',fontSize:13}}><span style={{color:'var(--text-secondary)'}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>)}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div style={{padding:12,background:'var(--gray-bg)',borderRadius:8,textAlign:'center'}}><div style={{fontSize:11,color:'var(--text-secondary)'}}>Fat. Projetado</div><div style={{fontWeight:700,fontSize:16}}>{fmt(detail.metaFaturamento)}</div></div>
                  <div style={{padding:12,background:'var(--gray-bg)',borderRadius:8,textAlign:'center'}}><div style={{fontSize:11,color:'var(--text-secondary)'}}>Fat. Realizado</div><div style={{fontWeight:700,fontSize:16,color:totalReal>=detail.metaFaturamento?'#22C55E':'#F59E0B'}}>{fmt(totalReal)}</div></div>
                </div>
              </div>
              <div>
                <div className="card" style={{padding:16}}>
                  <h4 style={{fontSize:14,fontWeight:700,marginBottom:12}}>📈 Projetado vs Realizado</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)"/><XAxis dataKey="mes" fontSize={11} stroke="#6b7280"/><YAxis fontSize={11} tickFormatter={v=>`${v/1000}k`} stroke="#6b7280"/><Tooltip formatter={v=>fmt(v)}/><Legend/>
                      <Line type="monotone" dataKey="projetado" stroke="#FFD600" strokeWidth={2} strokeDasharray="6 3" dot={{r:3}} name="Projetado"/>
                      <Line type="monotone" dataKey="realizado" stroke="#FFD600" strokeWidth={3} dot={{r:4,fill:'#FFD600'}} name="Realizado" connectNulls={false}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div style={{marginTop:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <h4 style={{fontSize:14,fontWeight:700}}>Atualizações Mensais</h4>
                <button className="btn btn-sm btn-primary" onClick={()=>setShowUpdate(true)}><Plus size={12}/> Atualizar mês</button>
              </div>
              {(detail.atualizacoes||[]).length?<div style={{borderLeft:'2px solid #FFD600',paddingLeft:16}}>{(detail.atualizacoes||[]).map((u,i)=><div key={i} style={{marginBottom:12,position:'relative'}}><div style={{position:'absolute',left:-22,top:4,width:10,height:10,borderRadius:'50%',background:'#FFD600'}}/><div style={{fontSize:13,fontWeight:600}}>{u.mes}</div><div style={{fontSize:12,color:'var(--text-secondary)'}}>Faturamento: <strong>{fmt(u.faturamentoReal)}</strong> | Investimento: <strong>{fmt(u.investimentoReal)}</strong></div>{u.obs&&<div style={{fontSize:12,color:'var(--text-secondary)',fontStyle:'italic'}}>{u.obs}</div>}</div>)}</div>:<div style={{padding:16,textAlign:'center',color:'var(--text-secondary)',fontSize:13}}>Nenhuma atualização registrada.</div>}
            </div>
          </>);
        })()}
      </Modal>

      {/* Update Modal */}
      <Modal isOpen={showUpdate} onClose={()=>setShowUpdate(false)} title="Atualizar Mês" size="sm" footer={<><button className="btn btn-secondary" onClick={()=>setShowUpdate(false)}>Cancelar</button><button className="btn btn-primary" onClick={addUpdate}>Salvar</button></>}>
        <div className="form-group"><label className="form-label">Mês (YYYY-MM)</label><input className="form-input" type="month" value={updForm.mes} onChange={e=>setUpdForm({...updForm,mes:e.target.value})}/></div>
        <div className="form-group"><label className="form-label">Faturamento Real (R$)</label><input className="form-input" type="number" value={updForm.faturamentoReal} onChange={e=>setUpdForm({...updForm,faturamentoReal:Number(e.target.value)})}/></div>
        <div className="form-group"><label className="form-label">Investimento Real (R$)</label><input className="form-input" type="number" value={updForm.investimentoReal} onChange={e=>setUpdForm({...updForm,investimentoReal:Number(e.target.value)})}/></div>
        <div className="form-group"><label className="form-label">Observações</label><textarea className="form-textarea" value={updForm.obs} onChange={e=>setUpdForm({...updForm,obs:e.target.value})}/></div>
      </Modal>
    </>
  );
}
