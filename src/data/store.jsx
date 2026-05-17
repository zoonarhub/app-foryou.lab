import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);
const THEME_KEY = 'foryoulab_theme';

const emptyData = {
  clients: [], leads: [], proposals: [], modularProposals: [], resultProjections: [],
  projects: [], tasks: [], financials: [], alerts: [], teamMembers: [], 
  services: [], channels: [], chatMessages: [], whatsappConversations: [], 
  integrations: [], campaignTrackings: [], optimizationLogs: [], diagnosticos: []
};

const toSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

export function AppProvider({ children }) {
  const [data, setData] = useState(emptyData);
  const [toasts, setToasts] = useState([]);
  const [auth, setAuth] = useState(null);
  const [agencyId, setAgencyId] = useState(null);
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [loadingData, setLoadingData] = useState(true);

  const [evolutionApiUrl, setEvolutionApiUrl] = useState(localStorage.getItem('evo_url') || 'https://evo.zoonar.com.br');
  const [evolutionApiKey, setEvolutionApiKey] = useState(localStorage.getItem('evo_key') || '54A0DAA1396B-4570-A1CF-665D425E8171');
  const [googleAccessToken, setGoogleAccessToken] = useState(localStorage.getItem('google_token') || null);

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
        setLoadingData(false); // Libera o carregamento para mostrar o Login
        return;
      }
      setAuth(user);
      
      const { data: profile } = await supabase.from('user_profiles').select('agency_id').eq('id', user.id).single();
      if (profile?.agency_id) {
        setAgencyId(profile.agency_id);
      } else {
        setAgencyId(user.id);
      }
      // Se já temos o agencyId mas por algum motivo o fetchData não rodar, garantimos o fim do loading
      if (!profile?.agency_id && user.id) {
         setLoadingData(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Fetch Data from Supabase
  const fetchData = useCallback(async () => {
    if (!agencyId) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    
    const keys = Object.keys(emptyData);
    const results = await Promise.all(keys.map(async (key) => {
      const table = toSnakeCase(key);
      
      // Tabelas Estruturadas (sem coluna 'data')
      if (['campaignTrackings', 'optimizationLogs'].includes(key)) {
        const { data: rows, error } = await supabase.from(table).select('*').eq('user_id', agencyId);
        return { key, val: !error ? rows : [] };
      }
      
      // Tabelas baseadas em JSONB
      const { data: rows, error } = await supabase.from(table).select('data').eq('user_id', agencyId);
      if (!error && rows) {
        return { key, val: rows.map(r => r.data) };
      }
      return { key, val: [] };
    }));

    const newData = { ...emptyData };
    results.forEach(({ key, val }) => {
      newData[key] = val;
    });
    
    setData(newData);
    setLoadingData(false);
  }, [agencyId]);

  useEffect(() => {
    if (agencyId) fetchData();
  }, [agencyId, fetchData]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  };
  
  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data?.user) {
      const { data: invite } = await supabase.from('invites').select('*').eq('email', email).single();
      if (invite) {
        await supabase.from('user_profiles').insert({
          id: data.user.id, agency_id: invite.agency_id, role: invite.role, email: email
        });
        await supabase.from('invites').delete().eq('email', email);
      }
    }
    return !error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addItem = useCallback(async (key, item) => {
    const id = Date.now().toString();
    const table = toSnakeCase(key);
    const newItem = { ...item, id };
    
    setData(prev => ({ ...prev, [key]: [...prev[key], newItem] }));
    
    if (agencyId) {
      if (['campaignTrackings', 'optimizationLogs'].includes(key)) {
         await supabase.from(table).insert({ ...newItem, user_id: agencyId });
      } else {
         await supabase.from(table).insert({ id, user_id: agencyId, data: newItem });
      }
    }
    return id;
  }, [agencyId]);

  const updateItem = useCallback(async (key, id, updates) => {
    const table = toSnakeCase(key);
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
      if (['campaignTrackings', 'optimizationLogs'].includes(key)) {
         await supabase.from(table).update(updates).eq('id', id).eq('user_id', agencyId);
      } else {
         await supabase.from(table).update({ data: updatedItem }).eq('id', id).eq('user_id', agencyId);
      }
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

  const setEvoConfig = useCallback((url, key) => {
    localStorage.setItem('evo_url', url);
    localStorage.setItem('evo_key', key);
    setEvolutionApiUrl(url);
    setEvolutionApiKey(key);
    addToast('Configurações da Evolution salvas!');
  }, [addToast]);

  const saveGoogleToken = useCallback((token) => {
    if (token) {
      localStorage.setItem('google_token', token);
      setGoogleAccessToken(token);
    } else {
      localStorage.removeItem('google_token');
      setGoogleAccessToken(null);
    }
  }, []);

  const getTeamMember = useCallback((id) => data.teamMembers.find(m => m.id === id), [data.teamMembers]);
  const getClient = useCallback((id) => data.clients.find(c => c.id === id), [data.clients]);

  return (
    <AppContext.Provider value={{
      ...data, toasts, auth, theme, loadingData, user: auth,
      addItem, updateItem, deleteItem, fetchData,
      addToast, getTeamMember, getClient,
      login, signup, logout, toggleTheme,
      evolutionApiUrl, evolutionApiKey, setEvoConfig,
      googleAccessToken, saveGoogleToken, supabase
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
