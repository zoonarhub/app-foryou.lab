import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Clock, MapPin, LogOut, RefreshCw, Bell, BellRing, Video, AlignLeft,
  Search, Mail, Command, CheckSquare, Square
} from 'lucide-react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const CALENDAR_COLORS = ['#8B5CF6', '#F59E0B', '#3B82F6', '#10B981', '#EF4444'];

export default function CalendarPage() {
  const { addToast, googleAccessToken, saveGoogleToken, user } = useApp();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [view, setView] = useState('week'); // day, week, month, year
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', startTime: '', endTime: '', description: '' });

  const [calendars, setCalendars] = useState([]);
  const [activeCalendars, setActiveCalendars] = useState([]);
  
  const toggleCalendar = (id) => {
    setActiveCalendars(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const upcomingEvents = events
    .filter(ev => ev.start.dateTime && new Date(ev.start.dateTime) >= new Date())
    .sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime))
    .slice(0, 3);

  let nextEventText = '';
  if (upcomingEvents.length > 0) {
    const diffMs = new Date(upcomingEvents[0].start.dateTime) - new Date();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) nextEventText = `em ${diffMins} min`;
    else if (diffMins < 1440) nextEventText = `em ${Math.floor(diffMins/60)}h ${diffMins%60}m`;
    else nextEventText = `em ${Math.floor(diffMins/1440)} dias`;
  }

  const loginWithGoogle = useGoogleLogin({
    onSuccess: tokenResponse => {
      saveGoogleToken(tokenResponse.access_token);
      addToast('Agenda sincronizada com sucesso!');
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'
  });

  useEffect(() => {
    if (googleAccessToken) {
      fetchCalendars(googleAccessToken);
    }
  }, [googleAccessToken]);

  useEffect(() => {
    if (googleAccessToken && activeCalendars.length > 0) {
      fetchCalendarEvents(googleAccessToken, activeCalendars);
    } else {
      setEvents([]);
    }
  }, [googleAccessToken, selectedDate, view, activeCalendars]);

  const fetchCalendars = async (token) => {
    try {
      const res = await axios.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const cals = res.data.items || [];
      setCalendars(cals);
      setActiveCalendars(cals.map(c => c.id));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCalendarEvents = async (token, activeIds) => {
    setLoading(true);
    try {
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const promises = activeIds.map(calId => 
        axios.get(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { timeMin: start.toISOString(), timeMax: end.toISOString(), maxResults: 100, singleEvents: true, orderBy: 'startTime' }
        }).then(res => {
          const cal = calendars.find(c => c.id === calId);
          return (res.data.items || []).map(ev => ({ ...ev, hasAlert: true, _calendarColor: cal?.backgroundColor || '#3B82F6' }));
        }).catch(() => [])
      );

      const results = await Promise.all(promises);
      const fetched = results.flat();
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

  const toggleAlert = (eventId) => {
    setEvents(events.map(ev => ev.id === eventId ? { ...ev, hasAlert: !ev.hasAlert } : ev));
    const isAlerting = !events.find(e => e.id === eventId).hasAlert;
    addToast(isAlerting ? 'Alerta ativado para este evento!' : 'Alerta desativado.');
  };

  const handleLogout = () => {
    saveGoogleToken(null);
    setEvents([]);
    addToast('Google Agenda desconectado.');
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      return addToast('Preencha os campos obrigatórios', 'warning');
    }
    setLoading(true);
    try {
      const startDateTime = `${newEvent.date}T${newEvent.startTime}:00`;
      const endDateTime = `${newEvent.date}T${newEvent.endTime}:00`;

      await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          summary: newEvent.title,
          description: newEvent.description,
          start: { dateTime: new Date(startDateTime).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          end: { dateTime: new Date(endDateTime).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
        },
        { headers: { Authorization: `Bearer ${googleAccessToken}` } }
      );

      addToast('Evento criado com sucesso no Google Agenda!');
      setIsModalOpen(false);
      setNewEvent({ title: '', date: '', startTime: '', endTime: '', description: '' });
      fetchCalendarEvents(googleAccessToken);
    } catch (err) {
      console.error(err);
      addToast('Erro ao criar evento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (amount) => {
    const newDate = new Date(selectedDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + amount);
    if (view === 'day') newDate.setDate(newDate.getDate() + amount);
    if (view === 'week') newDate.setDate(newDate.getDate() + (amount * 7));
    if (view === 'year') newDate.setFullYear(newDate.getFullYear() + amount);
    setSelectedDate(newDate);
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  // Helper for week days
  const getWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0A0A0A', color: '#FFF', fontFamily: 'Inter, sans-serif' }}>
      
      {/* TOP HEADER */}
      <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1F1F1F' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#FFF' }}>Agenda</h2>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Planeje seu dia, semana ou mês.</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <div onClick={() => setIsViewMenuOpen(!isViewMenuOpen)} style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                {view === 'day' ? 'Dia' : view === 'week' ? 'Semana' : view === 'month' ? 'Mês' : 'Ano'} <ChevronRight size={14} style={{ transform: isViewMenuOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: '0.2s' }} />
              </div>
              {isViewMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, background: '#141414', border: '1px solid #1F1F1F', borderRadius: 8, overflow: 'hidden', zIndex: 100, width: 120 }}>
                  {['day', 'week', 'month', 'year'].map(v => (
                    <div key={v} onClick={() => { setView(v); setIsViewMenuOpen(false); }} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', background: view === v ? '#222' : 'transparent', color: view === v ? 'var(--yellow)' : '#FFF' }}>
                      {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : v === 'month' ? 'Mês' : 'Ano'}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setSelectedDate(new Date())} style={{ background: '#141414', border: '1px solid #1F1F1F', color: '#FFF', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Hoje</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => changeDate(-1)} style={{ background: '#141414', border: '1px solid #1F1F1F', color: '#FFF', borderRadius: 8, padding: '6px', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
              <button onClick={() => changeDate(1)} style={{ background: '#141414', border: '1px solid #1F1F1F', color: '#FFF', borderRadius: 8, padding: '6px', cursor: 'pointer' }}><ChevronRight size={16} /></button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => addToast('Busca global em desenvolvimento...', 'warning')} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><Search size={18} /></button>
            <button onClick={() => addToast('Painel de Alertas em desenvolvimento...', 'warning')} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', position: 'relative' }}>
              <Bell size={18} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: 6, height: 6, background: 'var(--yellow)', borderRadius: '50%' }} />
            </button>
            {googleAccessToken ? (
              <button onClick={() => setIsModalOpen(true)} style={{ background: 'var(--yellow)', color: '#000', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Plus size={16} /> Novo evento
              </button>
            ) : (
              <button onClick={() => loginWithGoogle()} style={{ background: '#4285F4', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Conectar Google
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT SIDEBAR */}
        <div style={{ width: 280, borderRight: '1px solid #1F1F1F', padding: 24, display: 'flex', flexDirection: 'column', gap: 32, overflowY: 'auto' }}>
          
          {/* Mini Calendar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <ChevronLeft size={14} color="#888" style={{ cursor: 'pointer' }} onClick={() => changeDate(-1)} />
                <ChevronRight size={14} color="#888" style={{ cursor: 'pointer' }} onClick={() => changeDate(1)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
              {DAYS_OF_WEEK.map(d => (
                <div key={d} style={{ fontSize: 10, color: '#666', fontWeight: 600, marginBottom: 8 }}>{d.substring(0,3)}</div>
              ))}
              {Array.from({ length: getFirstDayOfMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }).map((_, i) => {
                const day = i + 1;
                const isToday = day === new Date().getDate() && selectedDate.getMonth() === new Date().getMonth();
                const isSelected = day === selectedDate.getDate();
                return (
                  <div key={day} onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(day);
                    setSelectedDate(newDate);
                    setView('day'); // Desce para a visão do dia ao clicar no mini calendário
                  }} style={{ 
                    fontSize: 12, padding: '6px 0', borderRadius: '50%', cursor: 'pointer',
                    background: isSelected ? 'var(--yellow)' : 'transparent',
                    color: isSelected ? '#000' : isToday ? '#FFF' : '#CCC',
                    fontWeight: isSelected || isToday ? 700 : 400
                  }}>
                    {day}
                  </div>
                )
              })}
            </div>
          </div>

          {/* My Calendars */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 16 }}>
              Meus calendários <Plus size={14} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {calendars.filter(c => c.accessRole === 'owner').map(cal => (
                <div key={cal.id} onClick={() => toggleCalendar(cal.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#CCC', cursor: 'pointer' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: activeCalendars.includes(cal.id) ? cal.backgroundColor : 'transparent', border: `1px solid ${cal.backgroundColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activeCalendars.includes(cal.id) && <CheckSquare size={10} color="#000" />}
                  </div>
                  {cal.summary}
                </div>
              ))}
            </div>
          </div>

          {/* Shared Calendars */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 16 }}>
              Calendários compartilhados <Plus size={14} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {calendars.filter(c => c.accessRole !== 'owner').map(cal => (
                <div key={cal.id} onClick={() => toggleCalendar(cal.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#CCC', cursor: 'pointer' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: activeCalendars.includes(cal.id) ? cal.backgroundColor : 'transparent', border: `1px solid ${cal.backgroundColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activeCalendars.includes(cal.id) && <CheckSquare size={10} color="#000" />}
                  </div>
                  {cal.summary}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CENTER GRID */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* WEEK VIEW */}
          {view === 'week' && (
            <>
              <div style={{ display: 'flex', borderBottom: '1px solid #1F1F1F', paddingLeft: 60 }}>
                {weekDays.map((date, i) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} style={{ flex: 1, borderRight: '1px solid #1F1F1F', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{DAYS_OF_WEEK[date.getDay()]}</div>
                      <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontSize: 15, fontWeight: 700, background: isToday ? 'var(--yellow)' : 'transparent', color: isToday ? '#000' : '#FFF' }}>{date.getDate()}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                <div style={{ display: 'flex', position: 'relative', minHeight: 1440 }}>
                  <div style={{ width: 60, flexShrink: 0, borderRight: '1px solid #1F1F1F', display: 'flex', flexDirection: 'column' }}>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} style={{ height: 60, borderBottom: '1px solid transparent', position: 'relative' }}><span style={{ position: 'absolute', top: -8, right: 12, fontSize: 11, color: '#666' }}>{i.toString().padStart(2, '0')}:00</span></div>
                    ))}
                  </div>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', position: 'relative' }}>
                    {Array.from({ length: 24 }).map((_, i) => (<div key={`h-${i}`} style={{ position: 'absolute', top: i * 60, left: 0, right: 0, height: 1, background: '#1F1F1F', zIndex: 0 }} />))}
                    {weekDays.map((date, dayIndex) => {
                      const dayEvents = events.filter(e => new Date(e.start.dateTime || e.start.date).toDateString() === date.toDateString());
                      return (
                        <div key={dayIndex} style={{ borderRight: '1px solid #1F1F1F', position: 'relative', height: 1440 }}>
                          {dayEvents.map((ev, evIndex) => {
                            let startHour = 0, startMin = 0, heightPx = 40, topPx = 0;
                            if (ev.start.dateTime) {
                              const sd = new Date(ev.start.dateTime); const ed = new Date(ev.end.dateTime);
                              startHour = sd.getHours(); startMin = sd.getMinutes();
                              heightPx = (((ed.getTime() - sd.getTime()) / 1000) / 60 / 60) * 60;
                              topPx = (startHour * 60) + ((startMin / 60) * 60);
                            } else { topPx = 0; heightPx = 30; }
                            const color = ev._calendarColor || CALENDAR_COLORS[evIndex % CALENDAR_COLORS.length];
                            return (
                              <div key={ev.id} onClick={() => toggleAlert(ev.id)} style={{ position: 'absolute', top: topPx, left: 2, right: 2, height: Math.max(heightPx - 2, 24), background: ev.hasAlert ? `${color}40` : `${color}20`, border: `1px solid ${color}40`, borderLeft: `3px solid ${color}`, borderRadius: 4, padding: '4px 6px', overflow: 'hidden', zIndex: 1, cursor: 'pointer', transition: 'all 0.2s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div style={{ fontSize: 11, fontWeight: 600, color: '#FFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{ev.summary}</div>{ev.hasAlert && <BellRing size={12} color="#FFF" style={{ flexShrink: 0 }} />}</div>
                                {ev.start.dateTime && heightPx > 30 && (<div style={{ fontSize: 10, color: '#AAA', marginTop: 2 }}>{startHour.toString().padStart(2, '0')}:{startMin.toString().padStart(2, '0')}</div>)}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* DAY VIEW */}
          {view === 'day' && (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid #1F1F1F', textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#FFF' }}>
                {DAYS_OF_WEEK[selectedDate.getDay()]}, {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                <div style={{ display: 'flex', position: 'relative', minHeight: 1440 }}>
                  <div style={{ width: 60, flexShrink: 0, borderRight: '1px solid #1F1F1F', display: 'flex', flexDirection: 'column' }}>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} style={{ height: 60, borderBottom: '1px solid transparent', position: 'relative' }}><span style={{ position: 'absolute', top: -8, right: 12, fontSize: 11, color: '#666' }}>{i.toString().padStart(2, '0')}:00</span></div>
                    ))}
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    {Array.from({ length: 24 }).map((_, i) => (<div key={`dh-${i}`} style={{ position: 'absolute', top: i * 60, left: 0, right: 0, height: 1, background: '#1F1F1F', zIndex: 0 }} />))}
                    {(() => {
                      const dayEvents = events.filter(e => new Date(e.start.dateTime || e.start.date).toDateString() === selectedDate.toDateString());
                      return dayEvents.map((ev, evIndex) => {
                        let startHour = 0, startMin = 0, heightPx = 40, topPx = 0;
                        if (ev.start.dateTime) {
                          const sd = new Date(ev.start.dateTime); const ed = new Date(ev.end.dateTime);
                          startHour = sd.getHours(); startMin = sd.getMinutes();
                          heightPx = (((ed.getTime() - sd.getTime()) / 1000) / 60 / 60) * 60;
                          topPx = (startHour * 60) + ((startMin / 60) * 60);
                        } else { topPx = 0; heightPx = 30; }
                        const color = ev._calendarColor || CALENDAR_COLORS[evIndex % CALENDAR_COLORS.length];
                        return (
                          <div key={ev.id} onClick={() => toggleAlert(ev.id)} style={{ position: 'absolute', top: topPx, left: 10, right: 10, height: Math.max(heightPx - 2, 24), background: ev.hasAlert ? `${color}40` : `${color}20`, border: `1px solid ${color}40`, borderLeft: `4px solid ${color}`, borderRadius: 6, padding: '8px 12px', overflow: 'hidden', zIndex: 1, cursor: 'pointer', transition: 'all 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{ev.summary}</div>{ev.hasAlert && <BellRing size={14} color="#FFF" style={{ flexShrink: 0 }} />}</div>
                            {ev.start.dateTime && (<div style={{ fontSize: 12, color: '#AAA', marginTop: 4 }}>{startHour.toString().padStart(2, '0')}:{startMin.toString().padStart(2, '0')}</div>)}
                          </div>
                        )
                      });
                    })()}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MONTH VIEW */}
          {view === 'month' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, background: '#1F1F1F', gap: 1 }}>
              {DAYS_OF_WEEK.map(d => <div key={d} style={{ background: '#0A0A0A', padding: '12px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#888' }}>{d}</div>)}
              {Array.from({ length: getFirstDayOfMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} style={{ background: '#0A0A0A' }} />)}
              {Array.from({ length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }).map((_, i) => {
                const day = i + 1;
                const dString = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toDateString();
                const dayEvents = events.filter(e => new Date(e.start.dateTime || e.start.date).toDateString() === dString);
                const isToday = day === new Date().getDate() && selectedDate.getMonth() === new Date().getMonth();
                return (
                  <div key={day} onClick={() => { const nd = new Date(selectedDate); nd.setDate(day); setSelectedDate(nd); setView('day'); }} style={{ background: '#0A0A0A', padding: 8, display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#141414'} onMouseLeave={e => e.currentTarget.style.background = '#0A0A0A'}>
                    <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: isToday ? 'var(--yellow)' : 'transparent', color: isToday ? '#000' : '#888', fontSize: 13, fontWeight: isToday ? 700 : 500, alignSelf: 'flex-end' }}>{day}</div>
                    {dayEvents.slice(0,3).map((ev, idx) => (
                      <div key={idx} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${CALENDAR_COLORS[idx % CALENDAR_COLORS.length]}30`, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.summary}</div>
                    ))}
                    {dayEvents.length > 3 && <div style={{ fontSize: 10, color: '#888', textAlign: 'right' }}>+{dayEvents.length - 3}</div>}
                  </div>
                )
              })}
            </div>
          )}

          {/* YEAR VIEW */}
          {view === 'year' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, padding: 32, overflowY: 'auto' }}>
              {MONTHS.map((m, mIdx) => (
                <div key={m} onClick={() => { const nd = new Date(selectedDate); nd.setMonth(mIdx); setSelectedDate(nd); setView('month'); }} style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 12, padding: 16, cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#333'} onMouseLeave={e => e.currentTarget.style.borderColor = '#1F1F1F'}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#FFF', marginBottom: 12, textAlign: 'center' }}>{m}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
                    {DAYS_OF_WEEK.map(d => <div key={d} style={{ fontSize: 9, color: '#666', fontWeight: 600, marginBottom: 4 }}>{d.substring(0,1)}</div>)}
                    {Array.from({ length: getFirstDayOfMonth(selectedDate.getFullYear(), mIdx) }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: getDaysInMonth(selectedDate.getFullYear(), mIdx) }).map((_, i) => {
                      const day = i + 1;
                      const isToday = day === new Date().getDate() && mIdx === new Date().getMonth();
                      return <div key={day} style={{ fontSize: 10, padding: '4px 0', color: isToday ? 'var(--yellow)' : '#888', fontWeight: isToday ? 800 : 400 }}>{day}</div>
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: 280, borderLeft: '1px solid #1F1F1F', padding: 24, display: 'flex', flexDirection: 'column', gap: 32, overflowY: 'auto' }}>
          
          {/* Upcoming */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Próximos</div>
              <div style={{ fontSize: 11, color: '#888' }}>{nextEventText}</div>
            </div>
            
            {upcomingEvents.length === 0 ? (
              <div style={{ fontSize: 12, color: '#666', textAlign: 'center', padding: '20px 0' }}>Sem próximos eventos</div>
            ) : upcomingEvents.map((ev, index) => {
              const start = new Date(ev.start.dateTime);
              const end = new Date(ev.end.dateTime);
              return (
                <div key={ev.id} style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CALENDAR_COLORS[index % CALENDAR_COLORS.length] }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.summary}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
                    <div>
                      {start.toDateString() === new Date().toDateString() ? '' : (
                        start.toDateString() === new Date(new Date().setDate(new Date().getDate()+1)).toDateString() ? 'Amanhã • ' : `${start.getDate().toString().padStart(2, '0')}/${(start.getMonth()+1).toString().padStart(2, '0')} • `
                      )}
                      {start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </div>
                    {(ev.location || ev.hangoutLink) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <MapPin size={12}/> {ev.location || 'Reunião Remota'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Share Availability */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF', marginBottom: 12 }}>Compartilhar disponibilidade</div>
            <button onClick={() => addToast('Link de agendamento copiado!', 'success')} style={{ width: '100%', background: '#141414', border: '1px solid #1F1F1F', color: '#CCC', padding: '10px', borderRadius: 8, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              Compartilhar agenda <span style={{ background: '#222', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>S</span>
            </button>
          </div>

          {/* Quick Meeting */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF', marginBottom: 12 }}>Reunião rápida</div>
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="Agendar com..." style={{ width: '100%', background: '#141414', border: '1px solid #1F1F1F', color: '#FFF', padding: '10px 10px 10px 32px', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              <Search size={14} color="#888" style={{ position: 'absolute', left: 10, top: 11 }} />
              <span style={{ position: 'absolute', right: 10, top: 11, background: '#222', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#888' }}>F</span>
            </div>
          </div>

          {/* Shortcuts */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF', marginBottom: 16 }}>Atalhos úteis</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                Menu de comandos <span style={{ background: '#222', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#666' }}>⌘ K</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                Ir para data <span style={{ background: '#222', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#666' }}>.</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                Todos os atalhos <span style={{ background: '#222', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#666' }}>?</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL NOVO EVENTO */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ width: 450, padding: 32, borderRadius: 16, background: '#141414', border: '1px solid #222' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: '#FFF' }}>Criar Novo Evento</h3>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8 }}>Título do Evento</label>
                <input required type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #222', background: '#0A0A0A', color: '#FFF', outline: 'none' }} placeholder="Ex: Reunião de Alinhamento" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8 }}>Data</label>
                <input required type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #222', background: '#0A0A0A', color: '#FFF', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8 }}>Início</label>
                  <input required type="time" value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #222', background: '#0A0A0A', color: '#FFF', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8 }}>Fim</label>
                  <input required type="time" value={newEvent.endTime} onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #222', background: '#0A0A0A', color: '#FFF', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #333', color: '#FFF', padding: '12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, background: 'var(--yellow)', border: 'none', color: '#000', padding: '12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }} disabled={loading}>
                  {loading ? 'Salvando...' : 'Criar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
