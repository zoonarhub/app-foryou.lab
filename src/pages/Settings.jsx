import { useState } from 'react';
import { useApp } from '../data/store';
import { Sun, Moon, LogOut, Trash2, Database, Palette, User, Shield, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

export default function Settings() {
  const { theme, toggleTheme, auth, logout, resetData, addToast, teamMembers, addItem } = useApp();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'membro', nome: '' });

  // Current user role
  const currentUser = teamMembers.find(tm => tm.email === auth?.email);
  const isAdmin = currentUser?.perfil === 'admin' || currentUser?.cargo === 'CEO';

  const handleInvite = async () => {
    if (!inviteData.email || !inviteData.nome) {
      addToast('Preencha nome e e-mail', 'error');
      return;
    }

    try {
      // 1. Add to local teamMembers array so they can be assigned to tasks/alerts
      await addItem('teamMembers', {
        nome: inviteData.nome,
        email: inviteData.email,
        perfil: inviteData.role,
        cargo: inviteData.role === 'admin' ? 'Co-Admin' : 'Especialista',
        ativo: true
      });

      // 2. Add to Supabase invites table
      const { data: profile } = await supabase.from('user_profiles').select('agency_id').eq('id', auth.id).single();
      const agencyId = profile?.agency_id || auth.id;

      await supabase.from('invites').insert({
        email: inviteData.email,
        role: inviteData.role,
        agency_id: agencyId,
        invited_by: auth.id
      });

      addToast(`Acesso liberado! Peça para ${inviteData.nome} criar uma conta com o email ${inviteData.email}.`);
      setShowInviteModal(false);
      setInviteData({ email: '', role: 'membro', nome: '' });
    } catch (err) {
      console.error(err);
      addToast('Erro ao liberar acesso.', 'error');
    }
  };

  return (
    <>
      <div className="page-header"><div><h2>Configurações</h2><div className="breadcrumb">Preferências do sistema</div></div></div>
      <div className="page-body" style={{ maxWidth: 640 }}>
        {/* Profile */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><User size={16} /> Conta</h4>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="avatar avatar-lg">{auth?.email?.charAt(0).toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{currentUser?.nome || 'CEO / Admin'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{auth?.email}</div>
              <span className="badge badge-yellow" style={{ marginTop: 4 }}>{currentUser?.perfil || 'admin'}</span>
            </div>
          </div>
        </div>

        {/* Gerenciar Acesso */}
        {isAdmin && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={16} /> Gerenciar Acessos</h4>
              <button className="btn btn-sm btn-primary" onClick={() => setShowInviteModal(true)}><UserPlus size={14} /> Dar Acesso</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teamMembers.map(tm => (
                <div key={tm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--gray-bg)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{tm.nome}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{tm.email}</div>
                  </div>
                  <span className="badge">{tm.perfil}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Theme */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Palette size={16} /> Aparência</h4>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => theme !== 'dark' && toggleTheme()}
              style={{
                flex: 1, padding: 16, borderRadius: 12, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                background: theme === 'dark' ? 'rgba(255,214,0,.1)' : 'var(--gray-bg)',
                border: theme === 'dark' ? '2px solid var(--yellow)' : '2px solid var(--card-border)',
                color: 'var(--text-primary)'
              }}>
              <Moon size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontWeight: 600, fontSize: 13 }}>Modo Escuro</div>
            </button>
            <button onClick={() => theme !== 'light' && toggleTheme()}
              style={{
                flex: 1, padding: 16, borderRadius: 12, cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                background: theme === 'light' ? 'rgba(255,214,0,.1)' : 'var(--gray-bg)',
                border: theme === 'light' ? '2px solid var(--yellow)' : '2px solid var(--card-border)',
                color: 'var(--text-primary)'
              }}>
              <Sun size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontWeight: 600, fontSize: 13 }}>Modo Claro</div>
            </button>
          </div>
        </div>

        {/* Danger zone */}
        {isAdmin && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Database size={16} /> Dados</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { if (window.confirm('Tem certeza? Todos os dados serão apagados!')) { resetData(); addToast('Dados resetados!', 'warning'); } }}
                className="btn btn-secondary" style={{ color: 'var(--red)' }}><Trash2 size={14} /> Resetar Dados</button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Isso irá apagar todos os clientes, leads, projetos e configurações.</p>
          </div>
        )}

        {/* Logout */}
        <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--red)', padding: 14 }}>
          <LogOut size={16} /> Sair da Conta
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>foryou.lab — v2.0 • Crescimento feito para você.</p>
      </div>

      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Dar Acesso à Equipe"
        footer={<><button className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleInvite}>Confirmar Acesso</button></>}
      >
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Adicione o e-mail do colaborador. Para entrar, ele deve acessar a tela de Login, clicar em "Criar Conta" e usar o mesmo e-mail preenchido aqui.
        </p>
        <div className="form-group">
          <label className="form-label">Nome do Colaborador</label>
          <input className="form-input" value={inviteData.nome} onChange={e => setInviteData({...inviteData, nome: e.target.value})} placeholder="João Silva" />
        </div>
        <div className="form-group">
          <label className="form-label">E-mail</label>
          <input className="form-input" type="email" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} placeholder="joao@foryou.lab" />
        </div>
        <div className="form-group">
          <label className="form-label">Nível de Acesso</label>
          <select className="form-select" value={inviteData.role} onChange={e => setInviteData({...inviteData, role: e.target.value})}>
            <option value="membro">Membro (Visualização e edição básica)</option>
            <option value="admin">Admin (Acesso total)</option>
          </select>
        </div>
      </Modal>
    </>
  );
}
