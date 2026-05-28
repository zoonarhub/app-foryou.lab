import { useState, useMemo } from 'react';
import { useApp } from '../data/store';
import { TrendingUp, DollarSign, Users, Target, Save } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../components/Modal';

const fmt = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}).format(v);

const servicosImpacto = [
  { id:'trafego', label:'Tráfego Local (Google & Meta)', impact:'+30% pedidos/delivery', mult:1.30 },
  { id:'social', label:'Reels & Fotos Gastronômicas', impact:'+20% desejo da marca', mult:1.20 },
  { id:'seo', label:'Google Maps / Reservas', impact:'+25% fluxo presencial', mult:1.25 },
  { id:'crm', label:'Fidelidade & WhatsApp CRM', impact:'+35% taxa de recorrência', mult:1.35 },
  { id:'site', label:'Cardápio Digital Premium', impact:'+15% ticket médio', mult:1.15 },
  { id:'branding', label:'Posicionamento Premium', impact:'+25% percepção de valor', mult:1.25 },
];

export default function ProjecaoFaturamento() {
  const { clients, addItem, addToast, theme } = useApp();
  const [fat, setFat] = useState(50000);
  const [investAtual, setInvestAtual] = useState(5000);
  const [ticket, setTicket] = useState(2000);
  const [clientesAtivos, setClientesAtivos] = useState(25);
  const [investAdicional, setInvestAdicional] = useState(10000);
  const [servicos, setServicos] = useState([]);
  const [horizonte, setHorizonte] = useState(6);
  const [taxaCrescimento, setTaxaCrescimento] = useState(40);
  const [showSave, setShowSave] = useState(false);
  const [saveClient, setSaveClient] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const totalMultiplier = useMemo(() => {
    let m = 1;
    servicos.forEach(s => { const sv = servicosImpacto.find(x=>x.id===s); if(sv) m *= sv.mult; });
    return m;
  }, [servicos]);

  const monthlyGrowthRate = (taxaCrescimento / 100) / horizonte;

  const projData = useMemo(() => {
    const months = [];
    for (let i = 0; i <= horizonte; i++) {
      const withInvest = fat * totalMultiplier * (1 + monthlyGrowthRate * i);
      const withoutInvest = fat * (1 + 0.02 * i); // 2% crescimento orgânico
      const novosClientes = Math.round((withInvest - fat) / Math.max(ticket, 1));
      months.push({
        mes: `Mês ${i}`,
        comInvestimento: Math.round(withInvest),
        semInvestimento: Math.round(withoutInvest),
        novosClientes: Math.max(0, novosClientes),
        investimento: i === 0 ? investAtual : investAtual + investAdicional,
      });
    }
    return months;
  }, [fat, investAtual, investAdicional, ticket, horizonte, taxaCrescimento, totalMultiplier, monthlyGrowthRate]);

  const fatProjetado = projData[projData.length-1]?.comInvestimento || 0;
  const crescimentoTotal = fat > 0 ? ((fatProjetado - fat) / fat * 100) : 0;
  const roiCalc = (investAtual + investAdicional) * horizonte > 0 ? (fatProjetado - fat) / ((investAtual + investAdicional) * horizonte) : 0;
  const novosClientesTotal = projData.reduce((a,d) => a + d.novosClientes, 0);

  const handleSave = async () => {
    if (!saveClient) { addToast('Selecione um cliente','error'); return; }
    if (isSaving) return;
    setIsSaving(true);
    try {
      await addItem('resultProjections', {
        clienteId: saveClient, faturamentoAtual: fat, investimento: investAtual + investAdicional,
        metaFaturamento: fatProjetado, dataInicio: new Date().toISOString().split('T')[0],
        dataFim: new Date(Date.now() + horizonte * 30 * 86400000).toISOString().split('T')[0],
        taxaCrescimento, servicos: servicos.map(s => servicosImpacto.find(x=>x.id===s)?.label || s),
        status: 'ativa', atualizacoes: [],
      });
      addToast('Projeção salva com sucesso!'); setShowSave(false);
    } catch (error) {
      console.error("Erro ao salvar projeção:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleServ = (id) => setServicos(prev => prev.includes(id) ? prev.filter(s=>s!==id) : [...prev, id]);

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#6b7280' : '#9CA3AF';

  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'380px 1fr', gap:0, margin:'-24px', height:'calc(100vh - 64px)', overflow:'hidden' }}>
        {/* LEFT PANEL */}
        <div style={{ background:'var(--card-bg)', padding:32, overflowY:'auto', borderRight:'1px solid var(--card-border)' }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:24, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>🧪 Simulador de Crescimento Gastronômico</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Simule o faturamento do seu restaurante com estratégias do laboratório</div>
          </div>

          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#FFD600', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Situação da Operação</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div><label style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4, display:'block' }}>Faturamento mensal (R$)</label><input type="number" value={fat} onChange={e=>setFat(Number(e.target.value))} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--card-border)', background:'var(--main-bg)', color:'var(--text-primary)', fontSize:14 }}/></div>
              <div><label style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4, display:'block' }}>Investimento atual em mídia/tráfego (R$)</label><input type="number" value={investAtual} onChange={e=>setInvestAtual(Number(e.target.value))} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--card-border)', background:'var(--main-bg)', color:'var(--text-primary)', fontSize:14 }}/></div>
              <div className="form-row" style={{ gap:8 }}>
                <div style={{ flex:1 }}><label style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4, display:'block' }}>Ticket médio (R$)</label><input type="number" value={ticket} onChange={e=>setTicket(Number(e.target.value))} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--card-border)', background:'var(--main-bg)', color:'var(--text-primary)', fontSize:14 }}/></div>
                <div style={{ flex:1 }}><label style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4, display:'block' }}>Pedidos / Reservas/dia</label><input type="number" value={clientesAtivos} onChange={e=>setClientesAtivos(Number(e.target.value))} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--card-border)', background:'var(--main-bg)', color:'var(--text-primary)', fontSize:14 }}/></div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#FFD600', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Estratégia Gastronômica foryou.lab</div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Investimento adicional em marketing</label>
              <div style={{ fontSize:24, fontWeight:800, color:'#FFD600', marginBottom:8 }}>{fmt(investAdicional)}</div>
              <input type="range" min={500} max={50000} step={500} value={investAdicional} onChange={e=>setInvestAdicional(Number(e.target.value))} style={{ width:'100%', accentColor:'#FFD600' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-secondary)' }}><span>R$ 500</span><span>R$ 50.000</span></div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:'var(--text-secondary)', display:'block', marginBottom:8 }}>Serviços a contratar</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {servicosImpacto.map(s => (
                  <label key={s.id} onClick={()=>toggleServ(s.id)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:8, cursor:'pointer', background: servicos.includes(s.id) ? 'rgba(255,214,0,.1)' : 'var(--main-bg)', border: servicos.includes(s.id) ? '1px solid #FFD600' : '1px solid var(--card-border)', transition:'all .2s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <input type="checkbox" checked={servicos.includes(s.id)} readOnly style={{ accentColor:'#FFD600' }}/>
                      <span style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize:11, color:'#22C55E', fontWeight:600 }}>{s.impact}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:'var(--text-secondary)', display:'block', marginBottom:8 }}>Horizonte de tempo</label>
              <div style={{ display:'flex', gap:4 }}>
                {[3,6,12].map(h => <button key={h} onClick={()=>setHorizonte(h)} style={{ flex:1, padding:'10px 0', borderRadius:8, border: horizonte===h ? '2px solid #FFD600' : '1px solid var(--card-border)', background: horizonte===h ? 'rgba(255,214,0,.1)' : 'var(--main-bg)', color: horizonte===h ? '#FFD600' : 'var(--text-secondary)', fontWeight:700, fontSize:14, cursor:'pointer' }}>{h} meses</button>)}
              </div>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:12, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Taxa de crescimento esperada: <span style={{ color:'#FFD600', fontWeight:700 }}>{taxaCrescimento}%</span></label>
              <input type="range" min={5} max={150} value={taxaCrescimento} onChange={e=>setTaxaCrescimento(Number(e.target.value))} style={{ width:'100%', accentColor:'#FFD600' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-secondary)' }}><span>5%</span><span>150%</span></div>
            </div>

            <button className="btn btn-primary" onClick={()=>setShowSave(true)} style={{ width:'100%', fontSize:15, padding:'14px 0' }}><Save size={16}/> SALVAR ESTA PROJEÇÃO</button>
          </div>
        </div>

        {/* RIGHT PANEL — Results */}
        <div style={{ background:'var(--main-bg)', padding:32, overflowY:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:32 }}>
            <div style={{ padding:16, background:'var(--card-bg)', borderRadius:12, border:'1px solid var(--card-border)' }}>
              <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4 }}>💰 Faturamento em {horizonte}m</div>
              <div style={{ fontSize:24, fontWeight:800, color:'#FFD600' }}>{fmt(fatProjetado)}</div>
            </div>
            <div style={{ padding:16, background:'var(--card-bg)', borderRadius:12, border:'1px solid var(--card-border)' }}>
              <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4 }}>📈 Crescimento total</div>
              <div style={{ fontSize:24, fontWeight:800, color:'#22C55E' }}>{crescimentoTotal.toFixed(0)}% ↑</div>
            </div>
            <div style={{ padding:16, background:'var(--card-bg)', borderRadius:12, border:'1px solid var(--card-border)' }}>
              <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4 }}>🎯 ROI do investimento</div>
              <div style={{ fontSize:24, fontWeight:800, color:'#3B82F6' }}>{roiCalc.toFixed(1)}x</div>
            </div>
            <div style={{ padding:16, background:'var(--card-bg)', borderRadius:12, border:'1px solid var(--card-border)' }}>
              <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4 }}>👥 Novos Clientes Est.</div>
              <div style={{ fontSize:24, fontWeight:800, color:'var(--text-primary)' }}>{novosClientesTotal}</div>
            </div>
          </div>

          <div style={{ background:'var(--card-bg)', borderRadius:12, padding:20, border:'1px solid var(--card-border)', marginBottom:24 }}>
            <h4 style={{ fontSize:14, fontWeight:700, marginBottom:16, color:'var(--text-primary)' }}>Projeção de Crescimento</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={projData}>
                <defs><linearGradient id="gradYellow" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FFD600" stopOpacity={0.3}/><stop offset="95%" stopColor="#FFD600" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)"/>
                <XAxis dataKey="mes" fontSize={11} stroke="var(--text-muted)" />
                <YAxis fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} stroke="var(--text-muted)" />
                <Tooltip 
                   formatter={v => fmt(v)}
                   contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="comInvestimento" stroke="var(--yellow)" strokeWidth={3} fill="url(#gradYellow)" name="Com investimento" dot={{ r: 4, fill: 'var(--yellow)' }} />
                <Line type="monotone" dataKey="semInvestimento" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="6 3" name="Sem investimento" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:'var(--card-bg)', borderRadius:12, padding:20, border:'1px solid var(--card-border)', marginBottom:24 }}>
            <h4 style={{ fontSize:14, fontWeight:700, marginBottom:12, color:'var(--text-primary)' }}>Projeção Mês a Mês</h4>
            <table className="data-table"><thead><tr><th>Mês</th><th>Faturamento</th><th>Crescimento</th><th>Novos Clientes/Pedidos</th><th>Investimento</th></tr></thead>
              <tbody>{projData.map((d,i)=>{
                const prev=i>0?projData[i-1].comInvestimento:fat;
                const growth=prev>0?((d.comInvestimento-prev)/prev*100):0;
                return <tr key={i}><td style={{fontWeight:600}}>{d.mes}</td><td style={{color:d.comInvestimento>fat*1.5?'#FFD600':'var(--text-primary)',fontWeight:700}}>{fmt(d.comInvestimento)}</td><td style={{color:'#22C55E'}}>{i>0?`+${growth.toFixed(1)}%`:'—'}</td><td>{d.novosClientes}</td><td>{fmt(d.investimento)}</td></tr>;
              })}</tbody>
            </table>
          </div>

          <div style={{ fontSize:11, color:'var(--text-secondary)', textAlign:'center', fontStyle:'italic' }}>* Projeções baseadas em dados históricos de marcas gastronômicas atendidas pelo foryou.lab. Resultados reais dependem de execução operacional e capacidade física.</div>
        </div>
      </div>

      <Modal isOpen={showSave} onClose={()=>setShowSave(false)} title="Salvar Projeção" size="sm" footer={<><button className="btn btn-secondary" onClick={()=>setShowSave(false)} disabled={isSaving}>Cancelar</button><button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</button></>}>
        <div className="form-group"><label className="form-label">Vincular a um cliente</label><select className="form-select" value={saveClient} onChange={e=>setSaveClient(e.target.value)}><option value="">Selecione...</option>{(clients||[]).map(c=><option key={c.id} value={c.id}>{c.empresa}</option>)}</select></div>
        <div style={{ padding:12, background:'var(--gray-bg)', borderRadius:8, fontSize:13 }}>
          <div>Fat. projetado: <strong style={{color:'#FFD600'}}>{fmt(fatProjetado)}</strong></div>
          <div>Crescimento: <strong style={{color:'#22C55E'}}>{crescimentoTotal.toFixed(0)}%</strong></div>
          <div>ROI: <strong>{roiCalc.toFixed(1)}x</strong></div>
        </div>
      </Modal>
    </>
  );
}
