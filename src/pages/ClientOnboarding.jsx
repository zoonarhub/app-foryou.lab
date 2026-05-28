import { useState } from 'react';
import { useApp } from '../data/store';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

const steps = ['Dados da Empresa', 'Redes Sociais', 'Serviços', 'Briefing', 'Diagnóstico', 'Responsável'];

export default function ClientOnboarding() {
  const { teamMembers, addItem, addToast } = useApp();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    nome: '', empresa: '', cnpj: '', segmento: '', cidade: '', whatsapp: '', email: '',
    instagram: '', facebook: '', googleAds: '', site: '', loginInstagram: '', loginFacebook: '',
    plano: 'Growth', servicos: [], mrr: 0,
    objetivos: '', publico: '', concorrentes: '', diferenciais: '', tomVoz: '',
    posicionamento: 3, comercial: 3, marketing: 3, financeiro: 3, operacao: 3,
    responsavel: '', accountManager: '', dataInicio: new Date().toISOString().split('T')[0],
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleServico = (s) => setForm(p => ({ ...p, servicos: p.servicos.includes(s) ? p.servicos.filter(x => x !== s) : [...p.servicos, s] }));

  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async () => {
    if (!form.nome || !form.empresa) { addToast('Nome e empresa obrigatórios', 'error'); return; }
    if (isSaving) return;
    setIsSaving(true);
    try {
      await addItem('clients', { ...form, status: 'onboarding', etapaLaboratorio: 'diagnostico', nps: '' });
      addToast('Cliente criado com status Onboarding! 🎉');
      setDone(true);
    } catch (error) {
      console.error("Erro ao realizar onboarding do cliente:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (done) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 440 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Check size={32} color="#22C55E" /></div>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Onboarding Concluído!</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>O cliente <strong>{form.empresa}</strong> foi criado com sucesso.</p>
        <button className="btn btn-primary" onClick={() => { setDone(false); setStep(0); setForm({ ...form, nome: '', empresa: '' }); }}>Novo Onboarding</button>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-header"><div><h2>Onboarding de Cliente</h2><div className="breadcrumb">Passo {step + 1} de {steps.length}</div></div></div>
      <div className="page-body">
        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 4, borderRadius: 2, background: i <= step ? '#FFD600' : 'var(--gray-light)', marginBottom: 6, transition: 'background .3s' }} />
              <div style={{ fontSize: 10, fontWeight: 600, color: i <= step ? '#FFD600' : 'var(--text-secondary)' }}>{s}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
          {step === 0 && (<>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Dados da Empresa</h3>
            <div className="form-row"><div className="form-group"><label className="form-label">Nome do contato *</label><input className="form-input" value={form.nome} onChange={e => set('nome', e.target.value)} /></div><div className="form-group"><label className="form-label">Empresa *</label><input className="form-input" value={form.empresa} onChange={e => set('empresa', e.target.value)} /></div></div>
            <div className="form-row"><div className="form-group"><label className="form-label">CNPJ</label><input className="form-input" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} /></div><div className="form-group"><label className="form-label">Segmento</label><input className="form-input" value={form.segmento} onChange={e => set('segmento', e.target.value)} /></div></div>
            <div className="form-row"><div className="form-group"><label className="form-label">WhatsApp</label><input className="form-input" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></div><div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} /></div></div>
            <div className="form-group"><label className="form-label">Cidade</label><input className="form-input" value={form.cidade} onChange={e => set('cidade', e.target.value)} /></div>
          </>)}
          {step === 1 && (<>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📱 Redes Sociais e Acessos</h3>
            <div className="form-row"><div className="form-group"><label className="form-label">Instagram</label><input className="form-input" value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@empresa" /></div><div className="form-group"><label className="form-label">Login Instagram</label><input className="form-input" value={form.loginInstagram} onChange={e => set('loginInstagram', e.target.value)} /></div></div>
            <div className="form-row"><div className="form-group"><label className="form-label">Facebook</label><input className="form-input" value={form.facebook} onChange={e => set('facebook', e.target.value)} /></div><div className="form-group"><label className="form-label">Login Facebook</label><input className="form-input" value={form.loginFacebook} onChange={e => set('loginFacebook', e.target.value)} /></div></div>
            <div className="form-row"><div className="form-group"><label className="form-label">Google Ads ID</label><input className="form-input" value={form.googleAds} onChange={e => set('googleAds', e.target.value)} /></div><div className="form-group"><label className="form-label">Site</label><input className="form-input" value={form.site} onChange={e => set('site', e.target.value)} /></div></div>
          </>)}
          {step === 2 && (<>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🛒 Serviços e Plano</h3>
            <div className="form-group"><label className="form-label">Plano</label>
              <select className="form-select" value={form.plano} onChange={e => set('plano', e.target.value)}><option>Starter</option><option>Growth</option><option>Scale</option><option>Custom</option></select>
            </div>
            <div className="form-group"><label className="form-label">MRR (R$)</label><input className="form-input" type="number" value={form.mrr} onChange={e => set('mrr', Number(e.target.value))} /></div>
            <div className="form-group"><label className="form-label">Serviços</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Gestão de Redes', 'Tráfego Pago', 'Branding', 'Copywriting', 'SEO', 'Website', 'Email Marketing', 'Consultoria'].map(s => (
                  <button key={s} onClick={() => toggleServico(s)} className="btn btn-sm" style={{ background: form.servicos.includes(s) ? '#FFD600' : 'var(--gray-bg)', color: form.servicos.includes(s) ? '#0A0A0A' : 'var(--text-primary)', border: '1px solid var(--card-border)' }}>{s}</button>
                ))}
              </div>
            </div>
          </>)}
          {step === 3 && (<>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🎯 Briefing Estratégico</h3>
            <div className="form-group"><label className="form-label">Objetivos principais</label><textarea className="form-textarea" value={form.objetivos} onChange={e => set('objetivos', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Público-alvo</label><textarea className="form-textarea" value={form.publico} onChange={e => set('publico', e.target.value)} /></div>
            <div className="form-row"><div className="form-group"><label className="form-label">Principais concorrentes</label><input className="form-input" value={form.concorrentes} onChange={e => set('concorrentes', e.target.value)} /></div><div className="form-group"><label className="form-label">Diferenciais</label><input className="form-input" value={form.diferenciais} onChange={e => set('diferenciais', e.target.value)} /></div></div>
            <div className="form-group"><label className="form-label">Tom de voz</label><input className="form-input" value={form.tomVoz} onChange={e => set('tomVoz', e.target.value)} placeholder="Ex: profissional, descontraído, técnico..." /></div>
          </>)}
          {step === 4 && (<>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 Diagnóstico Rápido</h3>
            {[['posicionamento', 'Posicionamento de marca'], ['comercial', 'Processo comercial'], ['marketing', 'Marketing digital'], ['financeiro', 'Gestão financeira'], ['operacao', 'Operação']].map(([k, label]) => (
              <div key={k} className="form-group">
                <label className="form-label">{label}: {form[k]}/5</label>
                <input type="range" min={1} max={5} value={form[k]} onChange={e => set(k, Number(e.target.value))} style={{ width: '100%', accentColor: '#FFD600' }} />
              </div>
            ))}
          </>)}
          {step === 5 && (<>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>👤 Responsável</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Responsável</label><select className="form-select" value={form.responsavel} onChange={e => set('responsavel', e.target.value)}><option value="">Selecione...</option>{teamMembers.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Data de início</label><input className="form-input" type="date" value={form.dataInicio} onChange={e => set('dataInicio', e.target.value)} /></div>
            </div>
          </>)}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft size={14} /> Voltar</button>
            {step < steps.length - 1 ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Próximo <ChevronRight size={14} /></button>
              : <button className="btn btn-primary" onClick={handleFinish} disabled={isSaving}><Check size={14} /> {isSaving ? 'Salvando...' : 'Concluir Onboarding'}</button>}
          </div>
        </div>
      </div>
    </>
  );
}
