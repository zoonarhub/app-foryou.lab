import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Clock, MapPin, LogOut, RefreshCw, Bell, BellRing, Video, AlignLeft
} from 'lucide-react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function CalendarPage() {
  const { addToast, googleAccessToken, saveGoogleToken } = useApp();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [view, setView] = useState('month'); // day, week, month, year
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loginWithGoogle = useGoogleLogin({
    onSuccess: tokenResponse => {
      saveGoogleToken(tokenResponse.access_token);
      addToast('Agenda sincronizada com sucesso!');
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'
  });

  useEffect(() => {
    if (googleAccessToken) fetchCalendarEvents(googleAccessToken);
  }, [googleAccessToken, selectedDate, view]);

  const fetchCalendarEvents = async (token) => {
    setLoading(true);
    try {
      // Fetch window: start of current month to end of current month
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const response = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',
          },
        }
      );
      // Map and add a mock 'alert' state for the UI requirement
      const fetched = (response.data.items || []).map(ev => ({ ...ev, hasAlert: false }));
      setEvents(fetched);
    } catch (err) {
      if (err.response?.status === 401) {
        saveGoogleToken(null);
        addToast('Sessão do Google expirada. Conecte novamente.', 'error');
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

  const toggleAlert = (eventId) => {
    setEvents(events.map(ev => ev.id === eventId ? { ...ev, hasAlert: !ev.hasAlert } : ev));
    const isAlerting = !events.find(e => e.id === eventId).hasAlert;
    addToast(isAlerting ? 'Alerta ativado para este evento!' : 'Alerta desativado.');
  };

  // Calendar Logic
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const changeDate = (amount) => {
    const newDate = new Date(selectedDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + amount);
    if (view === 'day') newDate.setDate(newDate.getDate() + amount);
    if (view === 'week') newDate.setDate(newDate.getDate() + (amount * 7));
    if (view === 'year') newDate.setFullYear(newDate.getFullYear() + amount);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    setView('month');
  };

  // Helper to filter events for a specific day
  const getEventsForDay = (day) => {
    const target = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toDateString();
    return events.filter(e => {
      const eDate = new Date(e.start.dateTime || e.start.date).toDateString();
      return eDate === target;
    });
  };

  return (
    <>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Agenda</h2>
          <div className="breadcrumb">Gestão Inteligente de Tempo</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {googleAccessToken && (
            <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ color: 'var(--red)', background: 'transparent', border: 'none' }}>
              <LogOut size={16} />
            </button>
          )}
          <button className="btn btn-primary"><Plus size={16} /> Novo Evento</button>
        </div>
      </div>

      <div className="page-body">
        {!googleAccessToken ? (
          <div className="card" style={{ padding: 80, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(66, 133, 244, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CalendarIcon size={40} color="#4285F4" />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Sincronize sua Rotina</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
              Conecte o Google Agenda para ter a visão executiva completa dos seus dias, semanas e meses, com alertas inteligentes integrados.
            </p>
            <button onClick={() => loginWithGoogle()} className="btn btn-primary" style={{ background: '#4285F4', borderColor: '#4285F4', padding: '14px 40px', fontSize: 16 }}>
              Conectar Google Agenda
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 700 }}>
            
            {/* TOP TOOLBAR */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="btn btn-secondary btn-sm" onClick={goToToday}>Hoje</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn-icon" onClick={() => changeDate(-1)}><ChevronLeft size={20} /></button>
                  <button className="btn-icon" onClick={() => changeDate(1)}><ChevronRight size={20} /></button>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, minWidth: 200 }}>
                  {view === 'day' && `${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`}
                  {view === 'month' && `${MONTHS[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`}
                  {view === 'week' && `Semana do dia ${selectedDate.getDate()}`}
                  {view === 'year' && `${selectedDate.getFullYear()}`}
                </h2>
              </div>

              {/* VIEW SWITCHER */}
              <div style={{ display: 'flex', background: 'var(--bg-color)', borderRadius: 8, padding: 4 }}>
                {['dia', 'semana', 'mês', 'ano'].map(v => {
                  const key = v === 'mês' ? 'month' : v === 'dia' ? 'day' : v === 'ano' ? 'year' : 'week';
                  return (
                    <button 
                      key={v}
                      onClick={() => setView(key)}
                      style={{
                        background: view === key ? 'var(--card-bg)' : 'transparent',
                        color: view === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: view === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        border: 'none', padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s'
                      }}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* CALENDAR BODY */}
            <div style={{ flex: 1, position: 'relative', background: 'var(--bg-color)' }}>
              {loading && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
                  <RefreshCw size={32} className="spin" color="var(--yellow)" />
                </div>
              )}

              {/* MONTH VIEW */}
              {view === 'month' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)' }}>
                    {DAYS_OF_WEEK.map(d => (
                      <div key={d} style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {d}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(100px, 1fr)', flex: 1 }}>
                    {Array.from({ length: getFirstDayOfMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }).map((_, i) => (
                      <div key={`empty-${i}`} style={{ borderRight: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)', background: 'var(--bg-color)', opacity: 0.3 }} />
                    ))}
                    {Array.from({ length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }).map((_, i) => {
                      const day = i + 1;
                      const dayEvents = getEventsForDay(day);
                      const isToday = new Date().toDateString() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toDateString();
                      
                      return (
                        <div 
                          key={day} 
                          onClick={() => {
                            setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day));
                            setView('day');
                          }}
                          style={{ 
                            borderRight: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)', 
                            padding: 8, cursor: 'pointer', transition: 'background .2s', background: 'var(--card-bg)', position: 'relative'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-color)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--card-bg)'}
                        >
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: isToday ? 'var(--yellow)' : 'transparent', color: isToday ? '#000' : 'var(--text-primary)', fontWeight: isToday ? 800 : 500, fontSize: 14, marginBottom: 8 }}>
                            {day}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {dayEvents.slice(0, 3).map(ev => (
                              <div key={ev.id} style={{ fontSize: 11, background: 'rgba(255,214,0,0.1)', color: 'var(--yellow)', padding: '4px 8px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {new Date(ev.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {ev.summary}
                              </div>
                            ))}
                            {dayEvents.length > 3 && <div style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 4 }}>+ {dayEvents.length - 3} mais</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DAY VIEW TIMELINE */}
              {view === 'day' && (
                <div style={{ display: 'flex', height: '100%' }}>
                  {/* Timeline (Left) */}
                  <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: 'var(--card-bg)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {getEventsForDay(selectedDate.getDate()).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 100, color: 'var(--text-muted)' }}>
                        Nenhum compromisso marcado para este dia.
                      </div>
                    ) : (
                      getEventsForDay(selectedDate.getDate()).map(ev => (
                        <div key={ev.id} style={{ display: 'flex', gap: 16, background: 'var(--bg-color)', padding: 16, borderRadius: 12, borderLeft: '4px solid var(--yellow)', position: 'relative' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 60 }}>
                            <span style={{ fontSize: 16, fontWeight: 800 }}>{new Date(ev.start.dateTime || ev.start.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(ev.end.dateTime || ev.end.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 16, marginBottom: 8 }}>{ev.summary}</h4>
                            <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', fontSize: 12 }}>
                              {ev.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14}/> {ev.location}</span>}
                              {ev.hangoutLink && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4285F4' }}><Video size={14}/> Google Meet</span>}
                            </div>
                            {ev.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}><AlignLeft size={14}/> {ev.description}</p>}
                          </div>

                          <button 
                            onClick={() => toggleAlert(ev.id)}
                            style={{ position: 'absolute', top: 16, right: 16, background: ev.hasAlert ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: ev.hasAlert ? '#EF4444' : 'var(--text-muted)', border: 'none', padding: 8, borderRadius: '50%', cursor: 'pointer', transition: 'all .2s' }}
                            title="Integrar ao Alerta"
                          >
                            {ev.hasAlert ? <BellRing size={16} /> : <Bell size={16} />}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Side Panel (Right) */}
                  <div style={{ width: 320, borderLeft: '1px solid var(--card-border)', background: 'var(--card-bg)', padding: 24 }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--yellow)', lineHeight: 1 }}>{selectedDate.getDate()}</div>
                    <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 32 }}>{DAYS_OF_WEEK[selectedDate.getDay()]}, {MONTHS[selectedDate.getMonth()]}</div>
                    
                    <h5 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 16 }}>Resumo do Dia</h5>
                    <div style={{ background: 'var(--bg-color)', padding: 16, borderRadius: 8, border: '1px dashed var(--card-border)' }}>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>{getEventsForDay(selectedDate.getDate()).length}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Eventos agendados</div>
                    </div>
                  </div>
                </div>
              )}

              {/* WEEK & YEAR PLACEHOLDERS */}
              {(view === 'week' || view === 'year') && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, opacity: 0.5 }}>
                  <CalendarIcon size={64} style={{ marginBottom: 16 }} />
                  <h3>Visão {view === 'week' ? 'Semanal' : 'Anual'} em Sincronização</h3>
                  <p>Módulo de visualização expandida sendo carregado com a Graph API.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
}
