import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Configurações Globais Persistentes
  const [evolutionApiUrl, setEvolutionApiUrl] = useState(localStorage.getItem('evo_url') || 'https://evo.zoonar.com.br');
  const [evolutionApiKey, setEvolutionApiKey] = useState(localStorage.getItem('evo_key') || '54A0DAA1396B-4570-A1CF-665D425E8171');
  const [googleAccessToken, setGoogleAccessToken] = useState(localStorage.getItem('google_token') || null);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Escutar mudanças de autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const setEvoConfig = (url, key) => {
    localStorage.setItem('evo_url', url);
    localStorage.setItem('evo_key', key);
    setEvolutionApiUrl(url);
    setEvolutionApiKey(key);
    addToast('Configurações da Evolution salvas!');
  };

  const saveGoogleToken = (token) => {
    if (token) {
      localStorage.setItem('google_token', token);
      setGoogleAccessToken(token);
    } else {
      localStorage.removeItem('google_token');
      setGoogleAccessToken(null);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      loading, 
      toasts, 
      addToast,
      evolutionApiUrl,
      evolutionApiKey,
      setEvoConfig,
      googleAccessToken,
      saveGoogleToken
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
