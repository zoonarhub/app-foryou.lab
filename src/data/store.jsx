import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { saveCollection, loadCollection, addToSyncQueue, getSyncStats, getLastSyncTime } from '../lib/localDB';
import { startSync, stopSync, forceSync } from '../lib/syncEngine';

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

  // ── Sync Status (para indicador visual) ───────────────────
  const [syncStatus, setSyncStatus] = useState({ pending: 0, lastSync: null, isSyncing: false });

  const [evolutionApiUrl, setEvolutionApiUrl] = useState(localStorage.getItem('evo_url') || 'https://evo.zoonar.com.br');
  const [evolutionApiKey, setEvolutionApiKey] = useState(localStorage.getItem('evo_key') || '54A0DAA1396B-4570-A1CF-665D425E8171');
  const [googleAccessToken, setGoogleAccessToken] = useState(localStorage.getItem('google_token') || null);
  const [fbToken, setFbToken] = useState(localStorage.getItem('fb_ads_token') || null);

  useEffect(() => {
    if (data.integrations && data.integrations.length > 0) {
      const fb = data.integrations.find(i => i.id === 'facebook_ads');
      const gg = data.integrations.find(i => i.id === 'google_ads');
      
      if (fb?.token && fb.token !== fbToken) {
        localStorage.setItem('fb_ads_token', fb.token);
        setFbToken(fb.token);
      }
      if (gg?.token && gg.token !== googleAccessToken) {
        localStorage.setItem('google_token', gg.token);
        setGoogleAccessToken(gg.token);
      }
      if (gg?.devToken) {
        const storedDev = localStorage.getItem('google_ads_dev_token');
        if (storedDev !== gg.devToken) {
          localStorage.setItem('google_ads_dev_token', gg.devToken);
        }
      }
    }
  }, [data.integrations]);

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

  // ── Atualizar status de sync via eventos customizados ─────
  useEffect(() => {
    const handleSyncStart = () => setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    const handleSyncComplete = (e) => {
      const stats = getSyncStats();
      setSyncStatus({
        pending: stats.pending,
        lastSync: getLastSyncTime(),
        isSyncing: false
      });
    };

    window.addEventListener('sync-start', handleSyncStart);
    window.addEventListener('sync-complete', handleSyncComplete);
    return () => {
      window.removeEventListener('sync-start', handleSyncStart);
      window.removeEventListener('sync-complete', handleSyncComplete);
    };
  }, []);

  // ═══════════════════════════════════════════════════════════
  // fetchData — LOCAL-FIRST: carrega do localStorage primeiro,
  // depois sincroniza com Supabase em background
  // ═══════════════════════════════════════════════════════════
  const fetchData = useCallback(async (forcedAgencyId) => {
    const activeAgencyId = forcedAgencyId || agencyIdRef.current;
    if (!activeAgencyId) {
      setLoadingData(false);
      return;
    }

    // ── PASSO 1: Carregar do localStorage (instantâneo) ─────
    const keys = Object.keys(emptyData);
    const localData = { ...emptyData };
    let hasLocalData = false;

    keys.forEach(key => {
      const items = loadCollection(key);
      if (items.length > 0) {
        localData[key] = items;
        hasLocalData = true;
      }
    });

    if (hasLocalData) {
      setData(localData);
      setLoadingData(false);
      console.log('[Store] ⚡ Dados carregados do localStorage (instantâneo)');
    } else {
      setLoadingData(true);
    }

    // ── PASSO 2: Fetch do Supabase em background ────────────
    try {
      const results = await Promise.all(keys.map(async (key) => {
        const table = toSnakeCase(key);
        try {
          if (STRUCTURED_TABLES.includes(key)) {
            const { data: rows, error } = await supabase.from(table).select('*').eq('user_id', activeAgencyId);
            if (error) {
              console.warn(`[fetchData] Erro em ${table}:`, error.message);
              return { key, val: null }; // null = manter dados locais
            }
            return { key, val: rows || [] };
          }
          
          const { data: rows, error } = await supabase.from(table).select('id, data').eq('user_id', activeAgencyId);
          if (error) {
            console.warn(`[fetchData] Erro em ${table}:`, error.message);
            return { key, val: null };
          }
          if (rows) {
            return { key, val: rows.map(r => ({ ...(r.data || {}), _dbId: r.id })) };
          }
          return { key, val: [] };
        } catch (e) {
          console.warn(`[fetchData] Exceção em ${table}:`, e);
          return { key, val: null };
        }
      }));

      // ── PASSO 3: Merge — Supabase ganha quando disponível ──
      const mergedData = { ...localData };
      let supabaseHadData = false;

      results.forEach(({ key, val }) => {
        if (val !== null) {
          // Supabase respondeu: usar dados dele (mais confiáveis)
          // Mas fazer merge com items locais que ainda não foram sincronizados
          const syncQueue = getSyncStats();
          if (val.length > 0 || syncQueue.pending === 0) {
            mergedData[key] = mergeWithLocalPending(key, val, localData[key]);
            supabaseHadData = true;
          } else {
            // Supabase vazio mas temos items pendentes locais
            mergedData[key] = localData[key];
          }
        }
        // Se val === null (erro Supabase), manter dados locais
      });

      setData(mergedData);

      // Persistir os dados do Supabase no localStorage
      if (supabaseHadData) {
        keys.forEach(key => {
          saveCollection(key, mergedData[key]);
        });
        console.log('[Store] 🔄 Dados sincronizados do Supabase → localStorage');
      }
    } catch (error) {
      console.error("[fetchData] Erro geral (usando dados locais):", error);
      // Em caso de erro total, os dados locais já estão carregados
    } finally {
      setLoadingData(false);
    }

    // ── PASSO 4: Iniciar sync engine ────────────────────────
    startSync(supabase, () => agencyIdRef.current);
    
    // Atualizar status inicial
    const stats = getSyncStats();
    setSyncStatus({
      pending: stats.pending,
      lastSync: getLastSyncTime(),
      isSyncing: false
    });
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
        stopSync();
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
    return () => {
      subscription.unsubscribe();
      stopSync();
    };
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
    stopSync();
    await supabase.auth.signOut();
  };

  // ═══════════════════════════════════════════════════════════
  // addItem — LOCAL-FIRST: salva no localStorage, enfileira sync
  // NUNCA bloqueia, NUNCA lança erro para o usuário
  // ═══════════════════════════════════════════════════════════
  const addItem = useCallback(async (key, item) => {
    const currentAgencyId = agencyIdRef.current;
    const table = toSnakeCase(key);
    
    const generateId = () => {
      if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };
    const id = item.id || generateId();
    const newItem = { ...item, id };
    
    // 1) Atualizar state React (instantâneo)
    setData(prev => {
      const updated = { ...prev, [key]: [...(prev[key] || []), newItem] };
      // 2) Salvar no localStorage (instantâneo)
      saveCollection(key, updated[key]);
      return updated;
    });
    
    // 3) Enfileirar sync com Supabase (background)
    if (currentAgencyId) {
      const payload = STRUCTURED_TABLES.includes(key)
        ? { ...newItem, user_id: currentAgencyId }
        : newItem;

      addToSyncQueue({
        action: 'insert',
        table,
        key,
        payload,
        itemId: id,
        agencyId: currentAgencyId
      });

      // Atualizar status
      const stats = getSyncStats();
      setSyncStatus(prev => ({ ...prev, pending: stats.pending }));

      console.log(`[addItem] ✅ Salvo localmente + enfileirado: ${table}, id: ${id}`);
    } else {
      console.warn(`[addItem] Sem agencyId — salvo apenas localmente: ${table}`);
    }
    
    return id;
  }, []);

  // ═══════════════════════════════════════════════════════════
  // updateItem — LOCAL-FIRST
  // ═══════════════════════════════════════════════════════════
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
    
    // 1) Atualizar state React (instantâneo)
    setData(prev => {
      const updated = {
        ...prev,
        [key]: (prev[key] || []).map(item => item.id === id ? updatedItem : item)
      };
      // 2) Salvar no localStorage (instantâneo)
      saveCollection(key, updated[key]);
      return updated;
    });

    // 3) Enfileirar sync com Supabase (background)
    if (currentAgencyId) {
      const payload = STRUCTURED_TABLES.includes(key)
        ? { ...updatedItem, user_id: currentAgencyId }
        : updatedItem;

      addToSyncQueue({
        action: 'update',
        table,
        key,
        payload,
        itemId: id,
        agencyId: currentAgencyId
      });

      const stats = getSyncStats();
      setSyncStatus(prev => ({ ...prev, pending: stats.pending }));

      console.log(`[updateItem] ✅ Atualizado localmente + enfileirado: ${table}, id: ${id}`);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // deleteItem — LOCAL-FIRST
  // ═══════════════════════════════════════════════════════════
  const deleteItem = useCallback(async (key, id) => {
    const currentAgencyId = agencyIdRef.current;
    const table = toSnakeCase(key);
    
    // 1) Remover do state React (instantâneo)
    setData(prev => {
      const updated = { ...prev, [key]: (prev[key] || []).filter(item => item.id !== id) };
      // 2) Salvar no localStorage (instantâneo)
      saveCollection(key, updated[key]);
      return updated;
    });
    
    // 3) Enfileirar sync com Supabase (background)
    if (currentAgencyId) {
      addToSyncQueue({
        action: 'delete',
        table,
        key,
        payload: null,
        itemId: id,
        agencyId: currentAgencyId
      });

      const stats = getSyncStats();
      setSyncStatus(prev => ({ ...prev, pending: stats.pending }));

      console.log(`[deleteItem] ✅ Removido localmente + enfileirado: ${table}, id: ${id}`);
    }
  }, []);

  // ── Forçar sync manual ────────────────────────────────────
  const triggerSync = useCallback(async () => {
    await forceSync(supabase, () => agencyIdRef.current);
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
      const existing = dataRef.current.integrations.find(i => i.id === 'google_ads' || i.key === 'google_ads');
      if (existing) {
        updateItem('integrations', existing.id, { token });
      } else {
        addItem('integrations', { id: 'google_ads', key: 'google_ads', token });
      }
    } else {
      localStorage.removeItem('google_token');
      setGoogleAccessToken(null);
      const existing = dataRef.current.integrations.find(i => i.id === 'google_ads' || i.key === 'google_ads');
      if (existing) {
        deleteItem('integrations', existing.id);
      }
    }
  }, [updateItem, addItem, deleteItem]);

  const saveFacebookToken = useCallback((token) => {
    if (token) {
      localStorage.setItem('fb_ads_token', token);
      setFbToken(token);
      const existing = dataRef.current.integrations.find(i => i.id === 'facebook_ads' || i.key === 'facebook_ads');
      if (existing) {
        updateItem('integrations', existing.id, { token });
      } else {
        addItem('integrations', { id: 'facebook_ads', key: 'facebook_ads', token });
      }
    } else {
      localStorage.removeItem('fb_ads_token');
      setFbToken(null);
      const existing = dataRef.current.integrations.find(i => i.id === 'facebook_ads' || i.key === 'facebook_ads');
      if (existing) {
        deleteItem('integrations', existing.id);
      }
    }
  }, [updateItem, addItem, deleteItem]);

  const saveGoogleDevToken = useCallback((devToken) => {
    if (devToken) {
      localStorage.setItem('google_ads_dev_token', devToken);
      const existing = dataRef.current.integrations.find(i => i.id === 'google_ads' || i.key === 'google_ads');
      if (existing) {
        updateItem('integrations', existing.id, { devToken });
      } else {
        addItem('integrations', { id: 'google_ads', key: 'google_ads', devToken });
      }
    } else {
      localStorage.removeItem('google_ads_dev_token');
      const existing = dataRef.current.integrations.find(i => i.id === 'google_ads' || i.key === 'google_ads');
      if (existing) {
        updateItem('integrations', existing.id, { devToken: null });
      }
    }
  }, [updateItem, addItem]);

  const getTeamMember = useCallback((id) => data.teamMembers.find(m => m.id === id), [data.teamMembers]);
  const getClient = useCallback((id) => data.clients.find(c => c.id === id), [data.clients]);

  return (
    <AppContext.Provider value={{
      ...data, toasts, auth, theme, loadingData, user: auth,
      addItem, updateItem, deleteItem, fetchData,
      addToast, getTeamMember, getClient,
      login, signup, logout, toggleTheme,
      evolutionApiUrl, evolutionApiKey, setEvoConfig,
      googleAccessToken, saveGoogleToken, 
      fbToken, saveFacebookToken, saveGoogleDevToken,
      supabase, syncStatus, triggerSync
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Helper: Merge dados do Supabase com items pendentes locais ──
function mergeWithLocalPending(key, supabaseItems, localItems) {
  if (!localItems || localItems.length === 0) return supabaseItems;
  if (!supabaseItems || supabaseItems.length === 0) return localItems;

  // Criar mapa de IDs do Supabase
  const supabaseIds = new Set(supabaseItems.map(item => item.id || item._dbId));
  
  // Encontrar items locais que NÃO existem no Supabase (pendentes de sync)
  const pendingLocal = localItems.filter(item => !supabaseIds.has(item.id));
  
  // Merge: dados do Supabase + items pendentes locais
  return [...supabaseItems, ...pendingLocal];
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
