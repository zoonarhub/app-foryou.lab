import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter,
  Clock,
  MapPin,
  Users,
  ExternalLink,
  LogOut
} from 'lucide-react';
import axios from 'axios';

export default function CalendarPage() {
  const { addToast, googleAccessToken, saveGoogleToken } = useApp();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (googleAccessToken) {
      fetchCalendarEvents(googleAccessToken);
    }
  }, [googleAccessToken]);

  const fetchCalendarEvents = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
          },
        }
      );
      setEvents(response.data.items || []);
    } catch (err) {
      console.error('Erro ao buscar eventos do Google:', err);
      if (err.response?.status === 401) {
        saveGoogleToken(null); // Token expirou
        addToast('Sessão do Google expirada. Por favor, conecte novamente.', 'error');
      } else {
        addToast('Erro ao carregar Agenda do Google', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    saveGoogleToken(null);
    setEvents([]);
    addToast('Google Agenda desconectado.');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Google Agenda</h2>
          <div className="breadcrumb">Gerenciamento oficial via Google Cloud</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {googleAccessToken && (
            <button className="btn btn-secondary" onClick={handleLogout} style={{ color: 'var(--red)' }}>
              <LogOut size={14} /> Desconectar
            </button>
          )}
          <button className="btn btn-primary"><Plus size={14} /> Novo Evento</button>
        </div>
      </div>

      <div className="page-body">
        {!googleAccessToken ? (
          <div className="card" style={{ padding: 80, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(66, 133, 244, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CalendarIcon size={40} color="#4285F4" />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Sua Agenda em Tempo Real</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
              Conecte sua conta do Google para visualizar e gerenciar seus compromissos diretamente pelo Foryou.lab.
            </p>
            {/* O botão de login real é injetado pelo GoogleOAuthProvider no App.jsx */}
            <div id="google-login-button">
               {/* O componente de login real deve ser usado aqui se não estiver global */}
               <p style={{ fontSize: 13, opacity: 0.7 }}>Acesse a Central de Integrações para conectar sua conta.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-2">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Próximos Compromissos</h3>
                <button className="btn-icon" onClick={() => fetchCalendarEvents(googleAccessToken)}><RefreshCw size={14} /></button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><RefreshCw className="spin" /></div>
              ) : events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Nenhum evento encontrado para os próximos dias.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {events.map((event) => (
                    <div key={event.id} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: 'var(--yellow)' }}>{event.summary}</span>
                        <ExternalLink size={14} style={{ opacity: 0.3 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, opacity: 0.6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {new Date(event.start.dateTime || event.start.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {event.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={12} /> {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Visão Mensal</h3>
              <div style={{ textAlign: 'center', padding: 40, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                <CalendarIcon size={40} style={{ opacity: 0.1, marginBottom: 16 }} />
                <p style={{ fontSize: 14, opacity: 0.5 }}>Calendário interativo em fase de sincronização.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
