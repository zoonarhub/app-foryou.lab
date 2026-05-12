import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Calendar as CalendarIcon, Link2, Plus, Clock, 
  Video, Users, RefreshCw, ExternalLink, ChevronLeft, ChevronRight 
} from 'lucide-react';
import Modal from '../components/Modal';

// Google API Config (Based on User's Credentials)
const CLIENT_ID = '302053902292-k5e9bpkbau4qog47ui8483psh09oop5m.apps.googleusercontent.com';
// Note: Client Secret is sensitive and usually handled on backend/n8n side

export default function CalendarPage() {
  const { addToast } = useApp();
  const [googleConnected, setGoogleConnected] = useState(() => localStorage.getItem('gcal_connected') === 'true');
  const [syncing, setSyncing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  
  const [events, setEvents] = useState([
    { id: 1, title: 'Reunião Kickoff - Cliente A', start: '2026-05-12T10:00:00', end: '2026-05-12T11:00:00', type: 'meet', attendees: 3 },
    { id: 2, title: 'Apresentação de Proposta (Lead C)', start: '2026-05-12T14:30:00', end: '2026-05-12T15:30:00', type: 'call', attendees: 2 },
    { id: 3, title: 'Revisão Semanal da Equipe', start: '2026-05-12T17:00:00', end: '2026-05-12T18:00:00', type: 'internal', attendees: 5 }
  ]);

  const handleConnect = () => {
    setSyncing(true);
    // Simulating Google OAuth Flow
    setTimeout(() => {
      setSyncing(false);
      setGoogleConnected(true);
      localStorage.setItem('gcal_connected', 'true');
      addToast('Google Calendar sincronizado!', 'success');
    }, 2500);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      addToast('Eventos atualizados do Google');
    }, 1500);
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Google Agenda</h2>
          <div className="breadcrumb">Sincronização em tempo real ({CLIENT_ID.substring(0, 10)}...)</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {googleConnected && (
            <>
              <button className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
                <RefreshCw size={14} className={syncing ? 'spin' : ''} /> Sincronizar
              </button>
              <button className="btn btn-primary" onClick={() => setShowEventModal(true)}><Plus size={14} /> Novo Evento</button>
            </>
          )}
        </div>
      </div>

      <div className="page-body">
        {!googleConnected ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', maxWidth: 500, margin: '40px auto' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(59,130,246,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CalendarIcon size={40} color="#3B82F6" />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Conecte sua Agenda</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14, lineHeight: 1.6 }}>
              Acesse seus compromissos diretamente do Google Agenda, crie salas no Meet automaticamente e gerencie sua disponibilidade.
            </p>
            <button className="btn btn-primary" onClick={handleConnect} style={{ background: '#3B82F6', borderColor: '#3B82F6', padding: '14px 40px', fontSize: 16 }}>
              {syncing ? 'Autenticando...' : <><Link2 size={18} /> Conectar com Google</>}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, height: 'calc(100vh - 200px)' }}>
            
            {/* LEFT PANEL: AGENDA VIEW */}
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Compromissos de Hoje</h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Terça-feira, 12 de Maio</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
                {events.map(ev => (
                  <div key={ev.id} style={{ padding: 16, borderRadius: 12, borderLeft: '4px solid #3B82F6', background: 'var(--gray-bg)', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{ev.title}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {formatTime(ev.start)} - {formatTime(ev.end)}</span>
                    </div>
                    {ev.type === 'meet' && (
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: '#3B82F6', fontWeight: 600, fontSize: 11 }}>
                        <Video size={12} /> Entrar no Google Meet
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 20 }} onClick={() => { localStorage.removeItem('gcal_connected'); setGoogleConnected(false); }}>
                Desconectar Conta
              </button>
            </div>

            {/* MAIN CALENDAR GRID (CLEAN UI) */}
            <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <h3 style={{ fontWeight: 800, fontSize: 18 }}>Maio 2026</h3>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="sidebar-toggle" style={{ padding: 4 }}><ChevronLeft size={16} /></button>
                    <button className="sidebar-toggle" style={{ padding: 4 }}><ChevronRight size={16} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', background: 'var(--gray-bg)', padding: 4, borderRadius: 8 }}>
                  <button className="btn btn-sm" style={{ background: 'var(--card-bg)', border: 'none', fontSize: 11, fontWeight: 700 }}>Semana</button>
                  <button className="btn btn-sm" style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--text-secondary)' }}>Mês</button>
                  <button className="btn btn-sm" style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--text-secondary)' }}>Dia</button>
                </div>
              </div>

              <div style={{ flex: 1, padding: 0, background: 'var(--black)', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', position: 'relative' }}>
                {/* Simplified Calendar Grid */}
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                  <div key={day} style={{ padding: '12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--card-border)' }}>{day}</div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} style={{ borderRight: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)', padding: 12, minHeight: 120, position: 'relative' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: i + 1 === 12 ? 'var(--yellow)' : 'var(--text-secondary)' }}>{i + 1}</span>
                    {i + 1 === 12 && (
                       <div style={{ marginTop: 8, background: '#3B82F6', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>Kickoff Cliente A</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)} title="Agendar Novo Evento" size="md">
        <div className="form-group"><label className="form-label">Título do Compromisso</label><input className="form-input" placeholder="Ex: Call de Alinhamento" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Data</label><input className="form-input" type="date" /></div>
          <div className="form-group"><label className="form-label">Horário</label><input className="form-input" type="time" /></div>
        </div>
        <div className="form-group"><label className="form-label">Link do Google Meet (Automático)</label><div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: 8, color: '#3B82F6', fontSize: 13, fontWeight: 600 }}><Video size={16} /> meet.google.com/abc-defg-hij</div></div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEventModal(false)}>Cancelar</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { addToast('Evento sincronizado com o Google!'); setShowEventModal(false); }}>Criar no Google Calendar</button>
        </div>
      </Modal>
    </>
  );
}
