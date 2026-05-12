import { useState } from 'react';
import { useApp } from '../data/store';
import { Calendar as CalendarIcon, Link2, Plus, Clock, Video, Users } from 'lucide-react';
import Modal from '../components/Modal';

export default function CalendarPage() {
  const { addToast } = useApp();
  const [googleConnected, setGoogleConnected] = useState(() => localStorage.getItem('gcal_connected') === 'true');
  const [connecting, setConnecting] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setGoogleConnected(true);
      localStorage.setItem('gcal_connected', 'true');
      addToast('Google Calendar conectado com sucesso!');
    }, 2000);
  };

  const handleDisconnect = () => {
    setGoogleConnected(false);
    localStorage.removeItem('gcal_connected');
    addToast('Google Calendar desconectado.', 'warning');
  };

  // Mock schedule
  const todayEvents = [
    { id: 1, title: 'Reunião Kickoff - Cliente A', time: '10:00 - 11:00', type: 'meet', attendees: 3 },
    { id: 2, title: 'Apresentação de Proposta (Lead C)', time: '14:30 - 15:30', type: 'call', attendees: 2 },
    { id: 3, title: 'Revisão Semanal da Equipe', time: '17:00 - 18:00', type: 'internal', attendees: 5 }
  ];

  return (
    <>
      <div className="page-header">
        <div><h2>Agenda Integrada</h2><div className="breadcrumb">Gerencie seus compromissos e reuniões</div></div>
        {googleConnected && <button className="btn btn-primary" onClick={() => setShowEventModal(true)}><Plus size={14} /> Novo Evento</button>}
      </div>

      <div className="page-body" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
        {!googleConnected ? (
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ padding: 24, background: 'rgba(59,130,246,.1)', borderRadius: '50%', marginBottom: 24 }}>
              <CalendarIcon size={64} color="#3B82F6" />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sincronize sua Agenda</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, marginBottom: 32 }}>
              Conecte seu Google Calendar para visualizar todos os seus compromissos, agendar reuniões com clientes e enviar links do Google Meet automaticamente.
            </p>
            <button className="btn btn-primary" onClick={handleConnect} disabled={connecting} style={{ background: '#3B82F6', borderColor: '#3B82F6', color: '#fff', fontSize: 16, padding: '12px 32px' }}>
              {connecting ? 'Conectando...' : <><Link2 size={18} style={{ marginRight: 8 }} /> Conectar com Google</>}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, height: '100%' }}>
            {/* Sidebar Calendar Info */}
            <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Meu Calendário</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sincronizado via Google</div>
              </div>

              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}>Hoje</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {todayEvents.map(ev => (
                  <div key={ev.id} style={{ padding: 12, borderRadius: 8, borderLeft: '4px solid #3B82F6', background: 'var(--gray-bg)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{ev.title}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {ev.time}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> {ev.attendees}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 'auto' }} onClick={handleDisconnect}>Desconectar Google</button>
            </div>

            {/* Main Calendar View (Simulated) */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Maio 2026</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm">Mês</button>
                  <button className="btn btn-primary btn-sm">Semana</button>
                </div>
              </div>
              <div style={{ flex: 1, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <CalendarIcon size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                  <p>Grade do Calendário renderizada via iframe do Google Calendar ou lib FullCalendar.</p>
                  <p style={{ fontSize: 12, marginTop: 8 }}>Para integrar o GCal real, é necessário token OAuth2 do backend.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)} title="Novo Evento" size="md" footer={<><button className="btn btn-secondary" onClick={() => setShowEventModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={() => { addToast('Evento salvo no Google Calendar!'); setShowEventModal(false); }}>Salvar Evento</button></>}>
        <div className="form-group"><label className="form-label">Título</label><input className="form-input" placeholder="Ex: Call de Alinhamento" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Data</label><input className="form-input" type="date" /></div>
          <div className="form-group"><label className="form-label">Horário</label><input className="form-input" type="time" /></div>
        </div>
        <div className="form-group"><label className="form-label">Convidados (Emails)</label><input className="form-input" placeholder="cliente@empresa.com" /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(59,130,246,.1)', borderRadius: 8, color: '#3B82F6', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          <Video size={16} /> Adicionar link do Google Meet
        </div>
      </Modal>
    </>
  );
}
