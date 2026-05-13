import { useState } from 'react';
import { useApp } from '../data/store';
import { Eye, EyeOff, LogIn, UserPlus, Sun, Moon } from 'lucide-react';

export default function Login() {
  const { login, signup, addToast, theme, toggleTheme } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { addToast('Preencha todos os campos', 'error'); return; }
    setLoading(true);
    
    if (isSignUp) {
      const ok = await signup(email, password);
      if (ok) addToast('Conta criada com sucesso! Você já pode entrar.');
      else addToast('Erro ao criar conta. Verifique os dados.', 'error');
      if (ok) setIsSignUp(false); // back to login
    } else {
      const ok = await login(email, password);
      if (ok) addToast('Bem-vindo ao foryou.lab! 🎉');
      else addToast('Credenciais inválidas.', 'error');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      <button onClick={toggleTheme} style={{ position: 'fixed', top: 20, right: 20, background: 'none', border: '1px solid var(--card-border)', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="login-card">
        {/* Logo */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <img src="/logo.png" alt="foryou.lab" style={{ 
            height: 64, 
            filter: theme === 'dark' ? 'brightness(0) invert(1) contrast(200%)' : 'none', 
            objectFit: 'contain',
            marginLeft: '-12px'
          }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ textAlign: 'left' }}>Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" style={{ textAlign: 'left' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: 14, marginTop: 8, justifyContent: 'center' }}>
            {loading ? (
              <div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,.3)', borderTopColor: '#0A0A0A', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
            ) : isSignUp ? (
              <><UserPlus size={16} /> Criar Conta</>
            ) : (
              <><LogIn size={16} /> Entrar</>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button type="button" onClick={() => setIsSignUp(!isSignUp)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
            {isSignUp ? 'Já tenho uma conta. Fazer login.' : 'Não tem uma conta? Crie agora.'}
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 20 }}>
          Crescimento feito para você.
        </p>
      </div>
    </div>
  );
}
