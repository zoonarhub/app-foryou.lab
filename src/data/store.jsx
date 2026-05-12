import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);
const THEME_KEY = 'foryoulab_theme';

const emptyData = {
  clients: [], leads: [], proposals: [], modularProposals: [], resultProjections: [],
  projects: [], tasks: [], financials: [], alerts: [], teamMembers: [
    { id: 'tm1', nome: 'Ricardo Fernandes', cargo: 'CEO', email: 'ricardo@foryou.lab', perfil: 'admin', ativo: true }
  ], services: [], channels: [
    { id: 'ch_geral', nome: 'geral', tipo: 'publico', descricao: 'Canal geral da equipe', criadoPor: 'tm1', icone: '#' },
    { id: 'ch_marketing', nome: 'marketing', tipo: 'publico', descricao: 'Equipe de marketing', criadoPor: 'tm1', icone: '#' },
    { id: 'ch_comercial', nome: 'comercial', tipo: 'publico', descricao: 'Equipe comercial', criadoPor: 'tm1', icone: '#' },
    { id: 'ch_resultados', nome: 'resultados', tipo: 'publico', descricao: 'Comemorar vitórias 🏆', criadoPor: 'tm1', icone: '#' },
  ], chatMessages: [], whatsappConversations: [], integrations: [],
};

const toSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

export function AppProvider({ children }) {
  const [data, setData] = useState(emptyData);
  const [toasts, setToasts] = useState([]);
  const [auth, setAuth] = useState(null);
  const [agencyId, setAgencyId] = useState(null);
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Initialize Supabase Auth
  useEffect(() => {
    const handleSession = async (session) => {
      const user = session?.user;
      if (!user) {
        setAuth(null);
        setAgencyId(null);
        return;
      }
      setAuth(user);
      
      // Determine Agency ID
      const { data: profile } = await supabase.from('user_profiles').select('agency_id').eq('id', user.id).single();
      if (profile?.agency_id) {
        setAgencyId(profile.agency_id);
      } else {
        // If no profile exists, they are the agency owner (CEO)
        setAgencyId(user.id);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Fetch Data from Supabase when user is authenticated
  useEffect(() => {
    if (!agencyId) {
      setData(emptyData);
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    const keys = Object.keys(emptyData);
    Promise.all(keys.map(async (key) => {
      const table = toSnakeCase(key);
      const { data: rows, error } = await supabase.from(table).select('data').eq('user_id', agencyId);
      if (!error && rows) {
        return { key, val: rows.map(r => r.data) };
      }
      return { key, val: [] };
    })).then(results => {
      const newData = { ...emptyData };
      results.forEach(({ key, val }) => {
        if (val.length > 0) newData[key] = val;
      });
      setData(newData);
      setLoadingData(false);
    });

    // ENABLE REALTIME for WhatsApp and Chat
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'whatsapp_conversations', filter: `user_id=eq.${agencyId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => ({ ...prev, whatsappConversations: [payload.new.data, ...prev.whatsappConversations] }));
            addToast('Nova mensagem de WhatsApp recebida!');
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => ({
              ...prev,
              whatsappConversations: prev.whatsappConversations.map(c => c.id === payload.new.data.id ? payload.new.data : c)
            }));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [agencyId]);

  // INACTIVITY ALERTS LOGIC
  useEffect(() => {
    const checkInactivity = () => {
      const now = new Date();
      data.whatsappConversations.forEach(conv => {
        if (conv.status === 'aberta' && conv.lastInteraction) {
          const lastTime = new Date(conv.lastInteraction);
          const diffMinutes = Math.floor((now - lastTime) / 60000);
          
          if (diffMinutes > 30) { // Alerta após 30 minutos sem resposta
            const alertExists = data.alerts.find(a => a.relId === conv.id && a.tipo === 'atendimento_atrasado');
            if (!alertExists) {
              addItem('alerts', {
                tipo: 'atendimento_atrasado',
                mensagem: `O contato ${conv.nome} está há ${diffMinutes} min sem resposta!`,
                prioridade: 'alta',
                relId: conv.id,
                data: now.toISOString()
              });
              addToast(`Alerta: Atendimento atrasado para ${conv.nome}`, 'warning');
            }
          }
        }
      });
    };

    const timer = setInterval(checkInactivity, 60000); // Checa a cada minuto
    return () => clearInterval(timer);
  }, [data.whatsappConversations, data.alerts, addItem, addToast]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  };
  
  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data?.user) {
      // Check for invites
      const { data: invite } = await supabase.from('invites').select('*').eq('email', email).single();
      if (invite) {
        // Create profile linked to agency
        await supabase.from('user_profiles').insert({
          id: data.user.id,
          agency_id: invite.agency_id,
          role: invite.role,
          email: email
        });
        // Delete invite
        await supabase.from('invites').delete().eq('email', email);
      }
    }
    return !error;
  };

  const logout = async () => {
    try {
      setAuth(null);
      setAgencyId(null);
      setData(emptyData);
      await supabase.auth.signOut();
      addToast('Sessão encerrada com sucesso.');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if Supabase fails, we want to clear local state to "force" logout in UI
      setAuth(null);
      setAgencyId(null);
    }
  };

  const addItem = useCallback(async (key, item) => {
    const id = Date.now().toString();
    const table = toSnakeCase(key);
    const newItem = { ...item, id };
    
    // Optimistic Update
    setData(prev => ({ ...prev, [key]: [...prev[key], newItem] }));
    
    if (agencyId) {
      await supabase.from(table).insert({ id, user_id: agencyId, data: newItem });
    }
    return id;
  }, [agencyId]);

  const updateItem = useCallback(async (key, id, updates) => {
    const table = toSnakeCase(key);
    
    // Optimistic Update
    let updatedItem = null;
    setData(prev => {
      const items = prev[key].map(item => {
        if (item.id === id) {
          updatedItem = { ...item, ...updates };
          return updatedItem;
        }
        return item;
      });
      return { ...prev, [key]: items };
    });

    if (agencyId && updatedItem) {
      await supabase.from(table).update({ data: updatedItem }).eq('id', id).eq('user_id', agencyId);
    }
  }, [agencyId]);

  const deleteItem = useCallback(async (key, id) => {
    const table = toSnakeCase(key);
    setData(prev => ({ ...prev, [key]: prev[key].filter(item => item.id !== id) }));
    if (agencyId) {
      await supabase.from(table).delete().eq('id', id).eq('user_id', agencyId);
    }
  }, [agencyId]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const getTeamMember = useCallback((id) => data.teamMembers.find(m => m.id === id), [data.teamMembers]);
  const getClient = useCallback((id) => data.clients.find(c => c.id === id), [data.clients]);

  return (
    <AppContext.Provider value={{
      ...data, toasts, auth, theme, loadingData,
      isAdmin: auth?.id === agencyId,
      addItem, updateItem, deleteItem,
      addToast, getTeamMember, getClient,
      login, signup, logout, toggleTheme,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
