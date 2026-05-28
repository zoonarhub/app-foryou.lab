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

// Tabelas com colunas individuais (sem coluna 'data' JSONB)
const STRUCTURED_TABLES = ['campaignTrackings', 'optimizationLogs'];

export function AppProvider({ children }) {
  const [data, setData] = useState(emptyData);
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const [toasts, setToasts] = useState([]);
  const [auth, setAuth] = useState(null);
  const [agencyId, setAgencyId] = useState(null);
  const agencyIdRef = useRef(null);
  useEffect(() => { agencyIdRef.current = agencyId; }, [agencyId]);

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
    const activeAgencyId = forcedAgencyId || agencyIdRef.current;
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
          if (STRUCTURED_TABLES.includes(key)) {
            const { data: rows, error } = await supabase.from(table).select('*').eq('user_id', activeAgencyId);
            if (error) console.warn(`[fetchData] Erro em ${table}:`, error.message);
            return { key, val: !error && rows ? rows : [] };
          }
          
          const { data: rows, error } = await supabase.from(table).select('id, data').eq('user_id', activeAgencyId);
          if (error) console.warn(`[fetchData] Erro em ${table}:`, error.message);
          if (!error && rows) {
            return { key, val: rows.map(r => ({ ...r.data, _dbId: r.id })) };
          }
          return { key, val: [] };
        } catch (e) {
          console.warn(`[fetchData] Exceção em ${table}:`, e);
          return { key, val: [] };
        }
      }));

      const newData = { ...emptyData };
      results.forEach(({ key, val }) => {
        newData[key] = val;
      });
      
      setData(newData);
    } catch (error) {
      console.error("[fetchData] Erro geral:", error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // Initialize Supabase Auth and load data
  useEffect(() => {
    const handleSession = async (session) => {
      const user = session?.user;
      if (!user) {
        setAuth(null);
        setAgencyId(null);
        agencyIdRef.current = null;
        setLoadingData(false);
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
      agencyIdRef.current = currentAgencyId;
      console.log('[Auth] agencyId definido:', currentAgencyId);
      await fetchDataRef.current(currentAgencyId);
    };

    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session));
    return () => subscription.unsubscribe();
  }, []);

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

  // ═══════════════════════════════════════════════════════════════
  // addItem — Usa agencyIdRef para evitar stale closure
  // ═══════════════════════════════════════════════════════════════
  const addItem = useCallback(async (key, item) => {
    const currentAgencyId = agencyIdRef.current;
    
    const generateId = () => {
      if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };
    const id = item.id || generateId();
    const table = toSnakeCase(key);
    const newItem = { ...item, id };
    
    // 1) Atualização otimista local
    setData(prev => ({ ...prev, [key]: [...(prev[key] || []), newItem] }));
    
    // 2) Persistir no Supabase
    if (!currentAgencyId) {
      console.warn(`[addItem] agencyId não disponível para ${table}. Dados salvos apenas localmente.`);
      addToast('Sessão não encontrada. Faça login novamente.', 'warning');
      return id;
    }

    console.log(`[addItem] Inserindo em ${table}:`, { id, user_id: currentAgencyId });
    
    try {
      let payload;
      if (STRUCTURED_TABLES.includes(key)) {
        payload = { ...newItem, user_id: currentAgencyId };
      } else {
        payload = { id, user_id: currentAgencyId, data: newItem };
      }
      
      const { error } = await supabase.from(table).insert(payload);
      
      if (error) {
        console.error(`[addItem] ERRO Supabase em ${table}:`, error);
        // Reverter atualização otimista
        setData(prev => ({ ...prev, [key]: (prev[key] || []).filter(i => i.id !== id) }));
        addToast(`Erro ao salvar: ${error.message}`, 'error');
        throw new Error(error.message);
      }
      
      console.log(`[addItem] ✅ Sucesso em ${table}, id: ${id}`);
    } catch (err) {
      if (err.message && !err.message.startsWith('Erro ao salvar')) {
        // Erro de rede (não Supabase)
        console.error(`[addItem] Erro de rede em ${table}:`, err);
        setData(prev => ({ ...prev, [key]: (prev[key] || []).filter(i => i.id !== id) }));
        addToast(`Erro de conexão: ${err.message}`, 'error');
      }
      throw err;
    }
    
    return id;
  }, [addToast]);

  // ═══════════════════════════════════════════════════════════════
  // updateItem — Usa agencyIdRef para evitar stale closure
  // ═══════════════════════════════════════════════════════════════
  const updateItem = useCallback(async (key, id, updates) => {
    const currentAgencyId = agencyIdRef.current;
    const table = toSnakeCase(key);
    
    const currentList = dataRef.current[key] || [];
    const currentItem = currentList.find(item => item.id === id);
    if (!currentItem) {
      console.warn(`[updateItem] Item ${id} não encontrado em ${key}`);
      return;
    }
    
    const updatedItem = { ...currentItem, ...updates };
    
    // 1) Atualização otimista
    setData(prev => ({
      ...prev,
      [key]: (prev[key] || []).map(item => item.id === id ? updatedItem : item)
    }));

    // 2) Persistir no Supabase
    if (!currentAgencyId) {
      console.warn(`[updateItem] agencyId não disponível para ${table}.`);
      addToast('Sessão não encontrada. Faça login novamente.', 'warning');
      return;
    }

    console.log(`[updateItem] Atualizando ${table}, id: ${id}`);

    try {
      let result;
      if (STRUCTURED_TABLES.includes(key)) {
        result = await supabase.from(table).update({ ...updates }).eq('id', id).eq('user_id', currentAgencyId);
      } else {
        result = await supabase.from(table).update({ data: updatedItem }).eq('id', id).eq('user_id', currentAgencyId);
      }
      
      if (result.error) {
        console.error(`[updateItem] ERRO Supabase em ${table}:`, result.error);
        setData(prev => ({
          ...prev,
          [key]: (prev[key] || []).map(item => item.id === id ? currentItem : item)
        }));
        addToast(`Erro ao atualizar: ${result.error.message}`, 'error');
        throw new Error(result.error.message);
      }
      
      console.log(`[updateItem] ✅ Sucesso em ${table}, id: ${id}`);
    } catch (err) {
      if (err.message && !err.message.startsWith('Erro ao atualizar')) {
        console.error(`[updateItem] Erro de rede em ${table}:`, err);
        setData(prev => ({
          ...prev,
          [key]: (prev[key] || []).map(item => item.id === id ? currentItem : item)
        }));
        addToast(`Erro de conexão: ${err.message}`, 'error');
      }
      throw err;
    }
  }, [addToast]);

  // ═══════════════════════════════════════════════════════════════
  // deleteItem — Usa agencyIdRef
  // ═══════════════════════════════════════════════════════════════
  const deleteItem = useCallback(async (key, id) => {
    const currentAgencyId = agencyIdRef.current;
    const table = toSnakeCase(key);
    
    // 1) Atualização otimista
    const previousList = dataRef.current[key] || [];
    setData(prev => ({ ...prev, [key]: (prev[key] || []).filter(item => item.id !== id) }));
    
    // 2) Persistir no Supabase
    if (!currentAgencyId) {
      console.warn(`[deleteItem] agencyId não disponível para ${table}.`);
      return;
    }

    try {
      const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', currentAgencyId);
      if (error) {
        console.error(`[deleteItem] ERRO Supabase em ${table}:`, error);
        setData(prev => ({ ...prev, [key]: previousList }));
        addToast(`Erro ao excluir: ${error.message}`, 'error');
      } else {
        console.log(`[deleteItem] ✅ Sucesso em ${table}, id: ${id}`);
      }
    } catch (err) {
      console.error(`[deleteItem] Erro de rede em ${table}:`, err);
      setData(prev => ({ ...prev, [key]: previousList }));
    }
  }, [addToast]);

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
