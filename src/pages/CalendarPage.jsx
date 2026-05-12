import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Calendar as CalendarIcon, Link2, Plus, Clock, 
  Video, Users, RefreshCw, ChevronLeft, ChevronRight, AlertCircle 
} from 'lucide-react';
import Modal from '../components/Modal';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export default function CalendarPage() {
  const { addToast } = useApp();
  const [googleConnected, setGoogleConnected] = useState(() => !!localStorage.getItem('gcal_token'));
  const [syncing, setSyncing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  // Fetch real events from Google Calendar API
  const fetchEvents = async (token) => {
    setSyncing(true);
    try {
      const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          timeMin: new Date().toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime',
        }
      });
      
      const gEvents = response.data.items.map(item => ({
        id: item.id,
        title: item.summary,
        start: item.start.dateTime || item.start.date,
        end: item.end.dateTime || item.end.date,
        type: item.hangoutLink ? 'meet' : 'call',
        link: item.hangoutLink || item.htmlLink
      }));
      
      setEvents(gEvents);
      addToast('Agenda sincronizada com o Google!');
    } catch (err) {
      console.error('Error fetching calendar:', err);
      setError('Erro ao carregar eventos. Tente reconectar.');
      setGoogleConnected(false);
      localStorage.removeItem('gcal_token');
    } finally {
      setSyncing(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      localStorage.setItem('gcal_token', tokenResponse.access_token);
      setGoogleConnected(true);
      fetchEvents(tokenResponse.access_token);
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    onError: () => addToast('Falha na autenticação com o Google', 'error')
  });

  useEffect(() => {
    const token = localStorage.getItem('gcal_token');
    if (token) fetchEvents(token);
  }, []);

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Google Agenda</h2>
          <div className="breadcrumb">Integração oficial via OAuth2</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {googleConnected && (
            <>
              <button className="btn btn-secondary" onClick={() => fetchEvents(localStorage.getItem('gcal_token'))} disabled={syncing}>
                <RefreshCw size={14} className={syncing ? 'spin' : ''} /> {syncing ? 'Sincronizando...' : 'Atualizar'}
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
              Acesse seus compromissos reais, crie reuniões e veja sua disponibilidade diretamente no foryou.lab.
            </p>
            {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 16 }}>{error}</div>}
            <button className="btn btn-primary" onClick={() => login()} style={{ background: '#3B82F6', borderColor: '#3B82F6', padding: '14px 40px', fontSize: 16 }}>
              <Link2 size={18} /> Conectar com Google
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, height: 'calc(100vh - 200px)' }}>
            
            {/* LEFT PANEL: AGENDA VIEW */}
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Próximos Compromissos</h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sincronizado agora</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
                {events.length === 0 && !syncing && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhum evento encontrado para hoje.</div>
                )}
                {events.map(ev => (
                  <div key={ev.id} onClick={() => ev.link && window.open(ev.link, '_blank')} 
                    style={{ padding: 16, borderRadius: 12, borderLeft: '4px solid #3B82F6', background: 'var(--gray-bg)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{ev.title}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {formatTime(ev.start)}</span>
                    </div>
                    {ev.type === 'meet' && (
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: '#3B82F6', fontWeight: 600, fontSize: 11 }}>
                        <Video size={12} /> Entrar no Google Meet
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 20 }} onClick={() => { localStorage.removeItem('gcal_token'); setGoogleConnected(false); }}>
                Desconectar Conta
              </button>
            </div>

            {/* MAIN CALENDAR GRID */}
            <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <h3 style={{ fontWeight: 800, fontSize: 18 }}>Agenda Mensal</h3>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="sidebar-toggle" style={{ padding: 4 }}><ChevronLeft size={16} /></button>
                    <button className="sidebar-toggle" style={{ padding: 4 }}><ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, padding: 0, background: 'var(--black)', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', position: 'relative' }}>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} style={{ padding: '12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--card-border)' }}>{day}</div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} style={{ borderRight: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)', padding: 12, minHeight: 120, position: 'relative' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)} title="Agendar Novo Evento" size="md">
        <div style={{ textAlign: 'center', padding: 20 }}>
          <AlertCircle size={40} color="var(--yellow)" style={{ marginBottom: 16 }} />
          <p>A criação de eventos via API requer permissões de escrita (calendar.events). Ativamos apenas leitura por segurança, mas posso adicionar escrita se desejar!</p>
          <button className="btn btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={() => setShowEventModal(false)}>Entendi</button>
        </div>
      </Modal>
    </>
  );
}
