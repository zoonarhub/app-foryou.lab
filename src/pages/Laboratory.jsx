import { useApp } from '../data/store';
import { FlaskConical, CheckCircle, Clock, User, ChevronRight } from 'lucide-react';

const etapas = [
  { id: 'diagnostico', num: '01', nome: 'Diagnóstico', desc: 'Análise completa do negócio, mercado e concorrência', color: '#3B82F6' },
  { id: 'estrutura', num: '02', nome: 'Estrutura', desc: 'Criação de identidade, site, redes sociais e funil', color: '#8B5CF6' },
  { id: 'performance', num: '03', nome: 'Performance', desc: 'Tráfego pago, SEO, conteúdo e geração de leads', color: '#F59E0B' },
  { id: 'escala', num: '04', nome: 'Escala', desc: 'Automação, expansão, novas fontes de receita', color: '#22C55E' },
];

export default function Laboratory() {
  const { clients } = useApp();
  const activeClients = clients.filter(c => c.status !== 'cancelado');

  const countByEtapa = etapas.map(e => ({
    ...e,
    count: activeClients.filter(c => c.etapaLaboratorio === e.id).length
  }));

  return (
    <>
      <div className="page-header">
        <div><h2>Laboratório de Crescimento</h2><div className="breadcrumb">Método foryou.lab em 4 etapas</div></div>
      </div>
      <div className="page-body">
        {/* Method visual */}
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800 }}>Método <span style={{ color: '#FFD600' }}>foryou.lab</span></h3>
            <p style={{ color: 'var(--gray-med)', fontSize: 14, marginTop: 4 }}>Crescimento feito para você — em 4 etapas estratégicas</p>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {countByEtapa.map((e, i) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 180, padding: 20, borderRadius: 12, background: `${e.color}10`,
                  border: `2px solid ${e.color}`, textAlign: 'center', position: 'relative'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: e.color, letterSpacing: 1 }}>{e.num}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, margin: '6px 0' }}>{e.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-med)', lineHeight: 1.4 }}>{e.desc}</div>
                  <div style={{
                    marginTop: 12, background: e.color, color: 'white', borderRadius: 20,
                    display: 'inline-flex', padding: '4px 14px', fontSize: 12, fontWeight: 700
                  }}>{e.count} cliente{e.count !== 1 ? 's' : ''}</div>
                </div>
                {i < 3 && <ChevronRight size={24} color="var(--gray-med)" />}
              </div>
            ))}
          </div>
        </div>

        {/* Clients by stage */}
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Progresso dos Clientes</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {activeClients.map(client => {
            const etapaIdx = etapas.findIndex(e => e.id === client.etapaLaboratorio);
            const progress = ((etapaIdx + 1) / 4) * 100;
            const etapa = etapas[etapaIdx];
            return (
              <div key={client.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{client.empresa}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-med)' }}>{client.nome}</div>
                  </div>
                  <span className="badge" style={{ background: `${etapa?.color}20`, color: etapa?.color, fontSize: 11 }}>
                    {etapa?.num} — {etapa?.nome}
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 8, borderRadius: 4, marginBottom: 8 }}>
                  <div className="progress-fill" style={{ width: `${progress}%`, background: etapa?.color, borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray-med)' }}>
                  <span>{Math.round(progress)}% concluído</span>
                  <span>Desde {new Date(client.dataInicio).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
