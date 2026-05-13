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
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', startTime: '', endTime: '', description: '' });

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
            <div style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              Semana <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
            </div>
            <button onClick={() => setSelectedDate(new Date())} style={{ background: '#141414', border: '1px solid #1F1F1F', color: '#FFF', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Hoje</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => changeDate(-1)} style={{ background: '#141414', border: '1px solid #1F1F1F', color: '#FFF', borderRadius: 8, padding: '6px', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
              <button onClick={() => changeDate(1)} style={{ background: '#141414', border: '1px solid #1F1F1F', color: '#FFF', borderRadius: 8, padding: '6px', cursor: 'pointer' }}><ChevronRight size={16} /></button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><Search size={18} /></button>
            <button style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', position: 'relative' }}>
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
                return (
                  <div key={day} style={{ 
                    fontSize: 12, padding: '6px 0', borderRadius: '50%', cursor: 'pointer',
                    background: isToday ? 'var(--yellow)' : 'transparent',
                    color: isToday ? '#000' : '#CCC',
                    fontWeight: isToday ? 700 : 400
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
              {[
                { name: 'Trabalho', color: '#F59E0B' },
                { name: 'Time de Marketing', color: '#8B5CF6' },
                { name: 'Desenvolvimento', color: '#3B82F6' },
                { name: 'Reuniões', color: '#10B981' },
                { name: 'Pessoal', color: '#EF4444' }
              ].map(cal => (
                <div key={cal.name} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#CCC' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: cal.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckSquare size={10} color="#000" />
                  </div>
                  {cal.name}
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#888' }}>
                <Square size={14} color="#555" />
                Feriados
              </div>
            </div>
          </div>

          {/* Shared Calendars */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 16 }}>
              Calendários compartilhados <Plus size={14} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#CCC' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckSquare size={10} color="#000" /></div>
                Foryou Lab
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#CCC' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckSquare size={10} color="#000" /></div>
                Clientes
              </div>
            </div>
          </div>

        </div>

        {/* CENTER GRID (WEEK VIEW) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Days Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1F1F1F', paddingLeft: 60 }}>
            {weekDays.map((date, i) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={i} style={{ flex: 1, borderRight: '1px solid #1F1F1F', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{DAYS_OF_WEEK[date.getDay()]}</div>
                  <div style={{ 
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    borderRadius: 8, fontSize: 15, fontWeight: 700,
                    background: isToday ? 'var(--yellow)' : 'transparent',
                    color: isToday ? '#000' : '#FFF'
                  }}>
                    {date.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Time Grid */}
          <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
            <div style={{ display: 'flex', position: 'relative', minHeight: 1200 }}>
              
              {/* Y Axis (Hours) */}
              <div style={{ width: 60, flexShrink: 0, borderRight: '1px solid #1F1F1F', display: 'flex', flexDirection: 'column' }}>
                {Array.from({ length: 11 }).map((_, i) => {
                  const hour = i + 8; // 08:00 to 18:00
                  return (
                    <div key={i} style={{ height: 100, borderBottom: '1px solid transparent', position: 'relative' }}>
                      <span style={{ position: 'absolute', top: -8, right: 12, fontSize: 11, color: '#666' }}>
                        {hour.toString().padStart(2, '0')}:00
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Grid Lines & Events */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', position: 'relative' }}>
                {/* Horizontal lines */}
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={`h-${i}`} style={{ position: 'absolute', top: i * 100, left: 0, right: 0, height: 1, background: '#1F1F1F', zIndex: 0 }} />
                ))}

                {/* Vertical columns and Events */}
                {weekDays.map((date, dayIndex) => {
                  const dayEvents = events.filter(e => new Date(e.start.dateTime || e.start.date).toDateString() === date.toDateString());
                  
                  return (
                    <div key={dayIndex} style={{ borderRight: '1px solid #1F1F1F', position: 'relative', height: 1100 }}>
                      {dayEvents.map((ev, evIndex) => {
                        if (!ev.start.dateTime) return null; // Skip full day events for now
                        const startDate = new Date(ev.start.dateTime);
                        const endDate = new Date(ev.end.dateTime);
                        
                        const startHour = startDate.getHours();
                        const startMin = startDate.getMinutes();
                        const endHour = endDate.getHours();
                        const endMin = endDate.getMinutes();

                        // Map 08:00 to top: 0. Each hour is 100px.
                        const topPx = ((startHour - 8) * 100) + ((startMin / 60) * 100);
                        const durationMins = ((endDate.getTime() - startDate.getTime()) / 1000) / 60;
                        const heightPx = (durationMins / 60) * 100;

                        // Only render if within our 08:00 - 18:00 bounds (roughly)
                        if (startHour < 7 || startHour > 19) return null;

                        const color = CALENDAR_COLORS[evIndex % CALENDAR_COLORS.length];

                        return (
                          <div key={ev.id} style={{ 
                            position: 'absolute', top: topPx, left: 2, right: 2, height: Math.max(heightPx - 2, 24),
                            background: `${color}20`, border: `1px solid ${color}40`, borderLeft: `3px solid ${color}`,
                            borderRadius: 4, padding: '4px 6px', overflow: 'hidden', zIndex: 1,
                            cursor: 'pointer'
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#FFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{ev.summary}</div>
                            {heightPx > 40 && (
                              <div style={{ fontSize: 10, color: '#AAA', marginTop: 2 }}>
                                {startHour}:{startMin.toString().padStart(2, '0')} - {endHour}:{endMin.toString().padStart(2, '0')}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: 280, borderLeft: '1px solid #1F1F1F', padding: 24, display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Upcoming */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Próximos</div>
              <div style={{ fontSize: 11, color: '#888' }}>em 45 min</div>
            </div>
            
            {events.slice(0,1).map(ev => (
              <div key="next" style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{ev.summary || "Reunião de alinhamento"}</div>
                </div>
                <div style={{ fontSize: 12, color: '#888', display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
                  <div>09:45 - 10:30 AM</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={12}/> Sala Foryou Lab</div>
                </div>
              </div>
            ))}
          </div>

          {/* Share Availability */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF', marginBottom: 12 }}>Compartilhar disponibilidade</div>
            <button style={{ width: '100%', background: '#141414', border: '1px solid #1F1F1F', color: '#CCC', padding: '10px', borderRadius: 8, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
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
