import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);
const THEME_KEY = 'foryoulab_theme';

const emptyData = {
  clients: [], leads: [], proposals: [], modularProposals: [], resultProjections: [],
  projects: [], tasks: [], financials: [], alerts: [], teamMembers: [], 
  services: [], channels: [], chatMessages: [], whatsappConversations: [], 
  integrations: [], campaignTrackings: [], optimizationLogs: [], diagnosticos: [],
  reports: []
};

const toSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

export function AppProvider({ children }) {
  const [data, setData] = useState(emptyData);
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const [toasts, setToasts] = useState([]);
  const [auth, setAuth] = useState(null);
  const [agencyId, setAgencyId] = useState(null);
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [loadingData, setLoadingData] = useState(true);

  const [evolutionApiUrl, setEvolutionApiUrl] = useState(localStorage.getItem('evo_url') || 'https://evo.zoonar.com.br');
  const [evolutionApiKey, setEvolutionApiKey] = useState(localStorage.getItem('evo_key') || '54A0DAA1396B-4570-A1CF-665D425E8171');
  const [googleAccessToken, setGoogleAccessToken] = useState(localStorage.getItem('google_token') || null);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Fetch Data from Supabase
  const fetchData = useCallback(async (forcedAgencyId) => {
    const activeAgencyId = forcedAgencyId || agencyId;
    if (!activeAgencyId) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    
    try {
      const keys = Object.keys(emptyData);
      const results = await Promise.all(keys.map(async (key) => {
        const table = toSnakeCase(key);
        try {
          // Tabelas Estruturadas (sem coluna 'data')
          if (['campaignTrackings', 'optimizationLogs'].includes(key)) {
            const { data: rows, error } = await supabase.from(table).select('*').eq('user_id', activeAgencyId);
            return { key, val: !error && rows ? rows : [] };
          }
          
          // Tabelas baseadas em JSONB
          const { data: rows, error } = await supabase.from(table).select('data').eq('user_id', activeAgencyId);
          if (!error && rows) {
            return { key, val: rows.map(r => r.data) };
          }
          return { key, val: [] };
        } catch (e) {
          console.warn(`Erro ao carregar tabela ${table}:`, e);
          return { key, val: [] };
        }
      }));

      const newData = { ...emptyData };
      results.forEach(({ key, val }) => {
        newData[key] = val;
      });
      
      setData(newData);
    } catch (error) {
      console.error("Erro geral no fetchData:", error);
    } finally {
      setLoadingData(false);
    }
  }, [agencyId]);

  // Initialize Supabase Auth and load data
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
      
      let currentAgencyId = user.id;
      try {
        const { data: profile } = await supabase.from('user_profiles').select('agency_id').eq('id', user.id).maybeSingle();
        if (profile?.agency_id) {
          currentAgencyId = profile.agency_id;
        }
      } catch (err) {
        console.error("[Auth] Erro ao carregar user_profile:", err);
      }
      
      setAgencyId(currentAgencyId);
      await fetchData(currentAgencyId);
    };

    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session));
    return () => subscription.unsubscribe();
  }, [fetchData]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  };
  
  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data?.user) {
      const { data: invite } = await supabase.from('invites').select('*').eq('email', email).single();
      if (invite) {
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: data.user.id, agency_id: invite.agency_id, role: invite.role, email: email
        });
        if (profileError) console.error("[Signup] Erro ao criar perfil por convite:", profileError);
        await supabase.from('invites').delete().eq('email', email);
      } else {
        // Cria perfil padrão de CEO para novos cadastros diretos (evita erros de RLS)
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: data.user.id, agency_id: data.user.id, role: 'CEO', email: email
        });
        if (profileError) console.error("[Signup] Erro ao criar perfil de CEO:", profileError);
      }
    }
    return !error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addItem = useCallback(async (key, item) => {
    const id = item.id || crypto.randomUUID();
    const table = toSnakeCase(key);
    const newItem = { ...item, id };
    
    setData(prev => ({ ...prev, [key]: [...prev[key], newItem] }));
    
    // DEBUG: Log every attempt
    try {
      await supabase.from('debug_logs').insert({ log: JSON.stringify({ action: 'addItem_start', key, agencyId, id, newItem }) });
    } catch(e) {}
    
    if (agencyId) {
      if (['campaignTrackings', 'optimizationLogs'].includes(key)) {
        const { error } = await supabase.from(table).insert({ ...newItem, user_id: agencyId });
        if (error) {
          console.error(`[Supabase] Erro ao inserir em ${table}:`, error);
          await supabase.from('debug_logs').insert({ log: JSON.stringify({table, error, payload: { ...newItem, user_id: agencyId }}) });
          addToast(`Erro ao salvar dados no servidor: ${error.message}`, 'error');
        }
      } else {
        const { error } = await supabase.from(table).insert({ id, user_id: agencyId, data: newItem });
        if (error) {
          console.error(`[Supabase] Erro ao inserir em ${table}:`, error);
          await supabase.from('debug_logs').insert({ log: JSON.stringify({table, error, payload: { id, user_id: agencyId, data: newItem }}) });
          addToast(`Erro ao salvar dados no servidor: ${error.message}`, 'error');
        }
      }
    } else {
      console.warn(`[Offline] Item adicionado a ${key} apenas na memória. Usuário não autenticado.`);
      addToast('Aviso: Você não está autenticado. Os dados foram salvos apenas temporariamente na memória local.', 'warning');
    }
    return id;
  }, [agencyId, addToast]);

  const updateItem = useCallback(async (key, id, updates) => {
    const table = toSnakeCase(key);
    
    const currentList = dataRef.current[key] || [];
    const currentItem = currentList.find(item => item.id === id);
    if (!currentItem) return;
    
    const updatedItem = { ...currentItem, ...updates };
    
    setData(prev => ({
      ...prev,
      [key]: (prev[key] || []).map(item => item.id === id ? updatedItem : item)
    }));

    if (agencyId && updatedItem) {
      if (['campaignTrackings', 'optimizationLogs'].includes(key)) {
        const { error } = await supabase.from(table).update({ ...updates }).eq('id', id).eq('user_id', agencyId);
        if (error) {
          console.error(`[Supabase] Erro ao atualizar em ${table}:`, error);
          await supabase.from('debug_logs').insert({ log: JSON.stringify({table, method: 'update', error}) });
          addToast(`Erro ao sincronizar atualização: ${error.message}`, 'error');
        }
      } else {
        const { error } = await supabase.from(table).update({ data: { ...currentItem, ...updates } }).eq('id', id).eq('user_id', agencyId);
        if (error) {
          console.error(`[Supabase] Erro ao atualizar em ${table}:`, error);
          await supabase.from('debug_logs').insert({ log: JSON.stringify({table, method: 'update', error}) });
          addToast(`Erro ao sincronizar atualização: ${error.message}`, 'error');
        }
      }
    }
  }, [agencyId, addToast]);

  const deleteItem = useCallback(async (key, id) => {
    const table = toSnakeCase(key);
    setData(prev => ({ ...prev, [key]: prev[key].filter(item => item.id !== id) }));
    if (agencyId) {
      const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', agencyId);
      if (error) {
        console.error(`[Supabase] Erro ao excluir em ${table}:`, error);
        addToast(`Erro ao sincronizar exclusão: ${error.message}`, 'error');
      }
    }
  }, [agencyId, addToast]);

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
