import { useState, useMemo } from 'react';
import { useApp } from '../data/store';
import { Plus, Search, Eye, Edit2, Send, Copy, Trash2, FileText, Target, TrendingUp, DollarSign } from 'lucide-react';
import Modal from '../components/Modal';

const fmt = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(v);
const statusConf = {rascunho:{badge:'badge-gray',label:'Rascunho'},enviada:{badge:'badge-blue',label:'Enviada'},visualizada:{badge:'badge-yellow',label:'Visualizada'},aprovada:{badge:'badge-green',label:'Aprovada'},recusada:{badge:'badge-red',label:'Recusada'}};

const modulosLib = [
  {cat:'📣 TRÁFEGO',items:[{nome:'Tráfego Google Ads',preco:997,tipo:'mensal'},{nome:'Tráfego Meta Ads',preco:997,tipo:'mensal'},{nome:'Tráfego TikTok',preco:797,tipo:'mensal'}]},
  {cat:'📱 REDES SOCIAIS',items:[{nome:'Gestão Instagram',preco:797,tipo:'mensal'},{nome:'Gestão LinkedIn',preco:697,tipo:'mensal'},{nome:'Produção de Conteúdo',preco:1497,tipo:'mensal'}]},
  {cat:'🌐 DIGITAL',items:[{nome:'Site Profissional',preco:2997,tipo:'unico'},{nome:'Landing Page',preco:1497,tipo:'unico'},{nome:'Email Marketing',preco:497,tipo:'mensal'}]},
  {cat:'🎨 BRANDING',items:[{nome:'Identidade Visual',preco:3997,tipo:'unico'},{nome:'Brandbook',preco:1997,tipo:'unico'}]},
  {cat:'⚙️ COMERCIAL',items:[{nome:'Estruturação Comercial',preco:1997,tipo:'mensal'},{nome:'CRM e Automações',preco:997,tipo:'mensal'},{nome:'Implementação de IA',preco:1997,tipo:'mensal'}]},
  {cat:'🔍 PRESENÇA',items:[{nome:'Google Meu Negócio',preco:297,tipo:'mensal'},{nome:'SEO On-Page',preco:797,tipo:'mensal'}]},
];

export default function Proposals() {
  const { proposals, modularProposals, leads, clients, services, addItem, updateItem, deleteItem, addToast } = useApp();
  const [tab, setTab] = useState('classica');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({clienteId:'',leadId:'',titulo:'',servicosItems:[],desconto:0,descontoTipo:'pct',validade:'',periodo:'mensal',observacoes:'',responsavel:'tm1'});
  const [showModular, setShowModular] = useState(false);
  const [modForm, setModForm] = useState({clienteId:'',titulo:'',modulos:[],desconto:0,fidelidade:'sem',observacoes:''});
  const [modSearch, setModSearch] = useState('');

  // Classic
  const classicFiltered = (proposals||[]).filter(p => !search || (p.nomeCliente||p.titulo||'').toLowerCase().includes(search.toLowerCase()));
  const totalAprovadas = (proposals||[]).filter(p=>p.status==='aprovada').length;
  const totalValor = (proposals||[]).reduce((a,p)=>a+(p.valorTotal||0),0);

  const openClassic = () => { setEditing(null); setForm({clienteId:'',leadId:'',titulo:'',servicosItems:[{nome:'',descricao:'',valor:0}],desconto:0,descontoTipo:'pct',validade:'',periodo:'mensal',observacoes:'',responsavel:'tm1'}); setShowModal(true); };
  const editClassic = (p) => { setEditing(p); setForm({...p,servicosItems:p.servicosItems||[{nome:'',descricao:'',valor:0}]}); setShowModal(true); };

  const saveClassic = () => {
    if(!form.titulo && !form.clienteId && !form.leadId){addToast('Preencha os campos','error');return;}
    const lead = (leads||[]).find(l=>l.id===form.leadId);
    const client = (clients||[]).find(c=>c.id===form.clienteId);
    const subtotal = (form.servicosItems||[]).reduce((a,s)=>a+(s.valor||0),0);
    const desc = form.descontoTipo==='pct' ? subtotal*(form.desconto/100) : form.desconto;
    const total = subtotal - desc;
    const data = {...form, nomeCliente: client?.empresa||lead?.nome||'', valorTotal: total, servicos: (form.servicosItems||[]).map(s=>s.nome), status: form.status||'rascunho'};
    if(editing){updateItem('proposals',editing.id,data);addToast('Proposta atualizada!');}
    else{addItem('proposals',data);addToast('Proposta criada!');}
    setShowModal(false);
  };

  const handleSend = (p) => {
    const lead = (leads||[]).find(l=>l.id===p.leadId);
    const phone = lead?.telefone?.replace(/\D/g,'')||'5511999999999';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Olá ${p.nomeCliente}, sua proposta: ${window.location.origin}/proposta/${p.id}`)}`,'_blank');
    updateItem('proposals',p.id,{status:'enviada',dataEnvio:new Date().toISOString()});
    addToast('Enviando via WhatsApp...');
  };

  const copyLink = (p) => { navigator.clipboard.writeText(`${window.location.origin}/proposta/${p.id}`); addToast('Link copiado!'); };
  const viewProposta = (p) => { window.open(`/proposta/${p.id}`, '_blank'); };
  const duplicar = (p) => { const{id,...rest}=p; addItem('proposals',{...rest,status:'rascunho',titulo:(rest.titulo||'')+' (cópia)'}); addToast('Proposta duplicada!'); };

  // Modular
  const addModulo = (item) => { setModForm(prev=>({...prev, modulos:[...prev.modulos, {...item, id:Date.now().toString(), descCustom:''}]})); };
  const removeModulo = (id) => { setModForm(prev=>({...prev, modulos:prev.modulos.filter(m=>m.id!==id)})); };
  const modRecorrente = modForm.modulos.filter(m=>m.tipo==='mensal').reduce((a,m)=>a+(m.preco||0),0);
  const modUnico = modForm.modulos.filter(m=>m.tipo==='unico').reduce((a,m)=>a+(m.preco||0),0);
  const fidDesc = {sem:0,'3m':0.05,'6m':0.05,'12m':0.10}[modForm.fidelidade]||0;
  const modTotal = modRecorrente*(1-fidDesc) - (modForm.desconto||0);

  const saveModular = () => {
    if(!modForm.clienteId||!modForm.modulos.length){addToast('Selecione cliente e módulos','error');return;}
    const client = (clients||[]).find(c=>c.id===modForm.clienteId);
    addItem('modularProposals',{...modForm, nomeCliente:client?.empresa||'', valorRecorrente:modRecorrente, valorUnico:modUnico, valorTotal:modTotal, status:'rascunho'});
    addToast('Proposta modular criada!'); setShowModular(false);
    setModForm({clienteId:'',titulo:'',modulos:[],desconto:0,fidelidade:'sem',observacoes:''});
  };

  return (
    <>
      <div className="page-header">
        <div><h2>Propostas Comerciais</h2><div className="breadcrumb">Crie e gerencie propostas</div></div>
        <div style={{display:'flex',gap:8}}>
          {tab==='classica' && <button className="btn btn-primary" onClick={openClassic}><Plus size={16}/> Nova Proposta</button>}
          {tab==='modular' && <button className="btn btn-primary" onClick={()=>setShowModular(true)}><Plus size={16}/> Nova Modular</button>}
        </div>
      </div>
      <div className="page-body">
        {/* Tabs */}
        <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:'2px solid var(--card-border)'}}>
          {[['classica','📄 Propostas Clássicas'],['modular','🧩 Propostas Modulares']].map(([k,v])=>(
            <button key={k} onClick={()=>setTab(k)} style={{padding:'10px 20px',fontSize:14,fontWeight:600,color:tab===k?'#FFD600':'var(--text-secondary)',borderBottom:tab===k?'2px solid #FFD600':'2px solid transparent',background:'none',border:'none',cursor:'pointer',marginBottom:-2}}>{v}</button>
          ))}
        </div>

        {tab==='classica' && (<>
          <div className="kpi-grid" style={{marginBottom:16}}>
            <div className="card kpi-card"><div className="kpi-value">{(proposals||[]).length}</div><span className="kpi-label">Total</span></div>
            <div className="card kpi-card"><div className="kpi-value" style={{color:'#22C55E'}}>{totalAprovadas}</div><span className="kpi-label">Aprovadas</span></div>
            <div className="card kpi-card"><div className="kpi-value">{(proposals||[]).filter(p=>p.status==='enviada'||p.status==='visualizada').length}</div><span className="kpi-label">Pendentes</span></div>
            <div className="card kpi-card"><div className="kpi-value" style={{color:'#FFD600'}}>{fmt(totalValor)}</div><span className="kpi-label">Valor total</span></div>
          </div>
          <div className="search-bar"><div className="search-input-wrapper"><Search size={16}/><input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:16}}>
            {classicFiltered.map(p=>{const sc=statusConf[p.status]||statusConf.rascunho;return(
              <div key={p.id} className="card" style={{padding:20}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                  <div><div style={{fontWeight:700,fontSize:15}}>{p.titulo||p.nomeCliente}</div><div style={{fontSize:12,color:'var(--text-secondary)'}}>{p.empresa||p.nomeCliente}</div></div>
                  <span className={`badge ${sc.badge}`}>{sc.label}</span>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:10}}>{(p.servicos||[]).map((s,i)=><span key={i} className="badge badge-yellow" style={{fontSize:10}}>{s}</span>)}</div>
                <div style={{fontSize:22,fontWeight:800,color:'#22C55E',marginBottom:8}}>{fmt(p.valorTotal||0)}</div>
                {p.periodo&&<div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:8}}>Período: {p.periodo}</div>}
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  <button className="btn btn-sm btn-secondary" onClick={()=>viewProposta(p)} title="Visualizar"><Eye size={12}/></button>
                  <button className="btn btn-sm btn-secondary" onClick={()=>editClassic(p)}><Edit2 size={12}/></button>
                  <button className="btn btn-sm btn-secondary" onClick={()=>duplicar(p)}><Copy size={12}/></button>
                  <button className="btn btn-sm btn-secondary" onClick={()=>copyLink(p)} title="Copiar link">🔗</button>
                  <button className="btn btn-sm btn-primary" onClick={()=>handleSend(p)}><Send size={12}/></button>
                  <button className="btn btn-sm btn-secondary" style={{color:'var(--red)'}} onClick={()=>{deleteItem('proposals',p.id);addToast('Excluída','warning');}}><Trash2 size={12}/></button>
                </div>
              </div>
            );})}
          </div>
          {classicFiltered.length===0&&<div className="card empty-state"><FileText size={48}/><h4>Nenhuma proposta</h4></div>}
        </>)}

        {tab==='modular' && (<>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:16}}>
            {(modularProposals||[]).map(p=>(
              <div key={p.id} className="card" style={{padding:20}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                  <div><div style={{fontWeight:700}}>{p.titulo||p.nomeCliente}</div><div style={{fontSize:12,color:'var(--text-secondary)'}}>{p.nomeCliente}</div></div>
                  <span className={`badge ${statusConf[p.status]?.badge||'badge-gray'}`}>{statusConf[p.status]?.label||p.status}</span>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:10}}>{(p.modulos||[]).map((m,i)=><span key={i} className="badge badge-blue" style={{fontSize:10}}>{m.nome}</span>)}</div>
                <div style={{display:'flex',gap:12}}><div><div style={{fontSize:11,color:'var(--text-secondary)'}}>Recorrente</div><div style={{fontWeight:700,color:'#FFD600'}}>{fmt(p.valorRecorrente||0)}/mês</div></div><div><div style={{fontSize:11,color:'var(--text-secondary)'}}>Setup</div><div style={{fontWeight:700}}>{fmt(p.valorUnico||0)}</div></div></div>
              </div>
            ))}
          </div>
          {(modularProposals||[]).length===0&&<div className="card empty-state"><Target size={48}/><h4>Nenhuma proposta modular</h4><p>Crie propostas com módulos personalizados.</p></div>}
        </>)}
      </div>

      {/* Classic Modal */}
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={editing?'Editar Proposta':'Nova Proposta'} size="lg" footer={<><button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveClassic}>Salvar</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Cliente</label><select className="form-select" value={form.clienteId} onChange={e=>setForm({...form,clienteId:e.target.value})}><option value="">Selecione...</option>{(clients||[]).map(c=><option key={c.id} value={c.id}>{c.empresa}</option>)}</select></div>
          <div className="form-group"><label className="form-label">ou Lead</label><select className="form-select" value={form.leadId||''} onChange={e=>setForm({...form,leadId:e.target.value})}><option value="">Selecione...</option>{(leads||[]).map(l=><option key={l.id} value={l.id}>{l.nome}</option>)}</select></div>
        </div>
        <div className="form-group"><label className="form-label">Título</label><input className="form-input" value={form.titulo||''} onChange={e=>setForm({...form,titulo:e.target.value})}/></div>
        <label className="form-label">Serviços</label>
        {(form.servicosItems||[]).map((s,i)=>(
          <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr 100px 30px',gap:8,marginBottom:8}}>
            <input className="form-input" placeholder="Nome" value={s.nome} onChange={e=>{const items=[...form.servicosItems];items[i]={...items[i],nome:e.target.value};setForm({...form,servicosItems:items});}}/>
            <input className="form-input" placeholder="Descrição" value={s.descricao||''} onChange={e=>{const items=[...form.servicosItems];items[i]={...items[i],descricao:e.target.value};setForm({...form,servicosItems:items});}}/>
            <input className="form-input" type="number" placeholder="Valor" value={s.valor} onChange={e=>{const items=[...form.servicosItems];items[i]={...items[i],valor:Number(e.target.value)};setForm({...form,servicosItems:items});}}/>
            <button onClick={()=>{const items=[...form.servicosItems];items.splice(i,1);setForm({...form,servicosItems:items});}} style={{background:'none',border:'none',color:'#EF4444',cursor:'pointer'}}>×</button>
          </div>
        ))}
        <button className="btn btn-sm btn-secondary" onClick={()=>setForm({...form,servicosItems:[...(form.servicosItems||[]),{nome:'',descricao:'',valor:0}]})} style={{marginBottom:12}}><Plus size={12}/> Adicionar serviço</button>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Desconto</label><div style={{display:'flex',gap:4}}><input className="form-input" type="number" value={form.desconto} onChange={e=>setForm({...form,desconto:Number(e.target.value)})}/><select className="form-select" style={{width:60}} value={form.descontoTipo} onChange={e=>setForm({...form,descontoTipo:e.target.value})}><option value="pct">%</option><option value="abs">R$</option></select></div></div>
          <div className="form-group"><label className="form-label">Validade</label><input className="form-input" type="date" value={form.validade||''} onChange={e=>setForm({...form,validade:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Período</label><select className="form-select" value={form.periodo} onChange={e=>setForm({...form,periodo:e.target.value})}><option value="mensal">Mensal</option><option value="trimestral">Trimestral</option><option value="semestral">Semestral</option><option value="anual">Anual</option></select></div>
        </div>
        <div className="form-group"><label className="form-label">Observações</label><textarea className="form-textarea" value={form.observacoes||''} onChange={e=>setForm({...form,observacoes:e.target.value})}/></div>
      </Modal>

      {/* Modular Creator */}
      <Modal isOpen={showModular} onClose={()=>setShowModular(false)} title="🧩 Nova Proposta Modular" size="lg" footer={<><button className="btn btn-secondary" onClick={()=>setShowModular(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveModular}>Finalizar</button></>}>
        <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:20,maxHeight:'60vh'}}>
          {/* Module Library */}
          <div style={{background:'var(--gray-bg)',borderRadius:8,padding:12,overflowY:'auto',maxHeight:'55vh'}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:8,color:'var(--text-secondary)'}}>Módulos disponíveis</div>
            <input placeholder="Buscar..." value={modSearch} onChange={e=>setModSearch(e.target.value)} style={{width:'100%',padding:'6px 8px',borderRadius:6,border:'1px solid var(--card-border)',background:'var(--card-bg)',color:'var(--text-primary)',fontSize:12,marginBottom:8}}/>
            {modulosLib.map(cat=>{
              const items = cat.items.filter(i=>!modSearch||i.nome.toLowerCase().includes(modSearch.toLowerCase()));
              if(!items.length) return null;
              return <div key={cat.cat}><div style={{fontSize:11,fontWeight:700,color:'#FFD600',marginBottom:4,marginTop:8}}>{cat.cat}</div>{items.map((item,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 8px',borderRadius:6,fontSize:12,marginBottom:2,background:'var(--card-bg)',border:'1px solid var(--card-border)'}}>
                  <div><div style={{fontWeight:600}}>{item.nome}</div><div style={{fontSize:10,color:'#22C55E'}}>{fmt(item.preco)}{item.tipo==='mensal'?'/mês':' único'}</div></div>
                  <button onClick={()=>addModulo(item)} style={{background:'#FFD600',border:'none',borderRadius:4,padding:'2px 6px',cursor:'pointer',fontSize:11,fontWeight:700,color:'#0A0A0A'}}>+</button>
                </div>
              ))}</div>;
            })}
          </div>
          {/* Building area */}
          <div>
            <div className="form-group"><label className="form-label">Cliente</label><select className="form-select" value={modForm.clienteId} onChange={e=>setModForm({...modForm,clienteId:e.target.value})}><option value="">Selecione...</option>{(clients||[]).map(c=><option key={c.id} value={c.id}>{c.empresa}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Título</label><input className="form-input" value={modForm.titulo} onChange={e=>setModForm({...modForm,titulo:e.target.value})}/></div>
            {modForm.modulos.length===0?<div style={{padding:24,textAlign:'center',color:'var(--text-secondary)',border:'2px dashed var(--card-border)',borderRadius:8,fontSize:13}}>Adicione módulos da biblioteca ←</div>:
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>{modForm.modulos.map(m=>(
              <div key={m.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',borderRadius:8,border:'1px solid var(--card-border)',background:'var(--gray-bg)'}}>
                <div><div style={{fontWeight:600,fontSize:13}}>{m.nome}</div><div style={{fontSize:11,color:m.tipo==='mensal'?'#22C55E':'#3B82F6'}}>{fmt(m.preco)} {m.tipo==='mensal'?'/mês':'único'}</div></div>
                <button onClick={()=>removeModulo(m.id)} style={{background:'none',border:'none',color:'#EF4444',cursor:'pointer',fontSize:16}}>×</button>
              </div>
            ))}</div>}
            <div style={{padding:12,background:'var(--gray-bg)',borderRadius:8,marginTop:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}><span>Recorrente</span><span style={{fontWeight:700}}>{fmt(modRecorrente)}/mês</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}><span>Setup/Único</span><span style={{fontWeight:700}}>{fmt(modUnico)}</span></div>
              <div className="form-row" style={{gap:8,marginTop:8}}>
                <div style={{flex:1}}><label style={{fontSize:11,color:'var(--text-secondary)'}}>Desconto (R$)</label><input className="form-input" type="number" value={modForm.desconto} onChange={e=>setModForm({...modForm,desconto:Number(e.target.value)})}/></div>
                <div style={{flex:1}}><label style={{fontSize:11,color:'var(--text-secondary)'}}>Fidelidade</label><select className="form-select" value={modForm.fidelidade} onChange={e=>setModForm({...modForm,fidelidade:e.target.value})}><option value="sem">Sem</option><option value="3m">3 meses</option><option value="6m">6 meses (+5%)</option><option value="12m">12 meses (+10%)</option></select></div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:18,borderTop:'2px solid var(--card-border)',paddingTop:8,marginTop:8}}><span>Total</span><span style={{color:'#FFD600'}}>{fmt(modTotal)}/mês</span></div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
