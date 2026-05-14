import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserPlus, Handshake, FlaskConical,
  ClipboardList, FileText, DollarSign, BarChart3, MessageCircle,
  Megaphone, Calendar, UserCog, Bot, Plug, Settings, Crown,
  ChevronLeft, ChevronRight, TrendingUp, ClipboardCheck, AlertTriangle, Stethoscope, Box, MessageSquare, Target
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../data/store';

const navItems = [
  { section: 'Principal' },
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/alertas', icon: AlertTriangle, label: 'Alertas' },
  { path: '/crm', icon: Users, label: 'CRM — Pipeline' },
  { path: '/leads', icon: UserPlus, label: 'Leads' },
  { path: '/clientes', icon: Handshake, label: 'Clientes' },
  { path: '/servicos', icon: Box, label: 'Serviços' },
  { path: '/onboarding', icon: ClipboardCheck, label: 'Onboarding' },
  { path: '/laboratorio', icon: FlaskConical, label: 'Laboratório' },
  { section: 'Operações' },
  { path: '/projetos', icon: ClipboardList, label: 'Projetos' },
  { path: '/propostas', icon: FileText, label: 'Propostas' },
  { path: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { path: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { path: '/projecao', icon: TrendingUp, label: 'Projeção' },
  { path: '/resultado-projecoes', icon: Target, label: 'Projeções Resultado' },
  { section: 'Comunicação' },
  { path: '/whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  { path: '/campanhas', icon: Megaphone, label: 'Campanhas' },
  { path: '/otimizacoes', icon: Activity, label: 'Otimizações' },
  { path: '/agenda', icon: Calendar, label: 'Agenda' },
  { path: '/chat', icon: MessageSquare, label: 'Chat Interno' },
  { section: 'Gestão' },
  { path: '/equipe', icon: UserCog, label: 'Equipe' },
  { path: '/ia', icon: Bot, label: 'IA — Agentes' },
  { path: '/diagnostico', icon: Stethoscope, label: 'Diagnóstico' },
  { path: '/integracoes', icon: Plug, label: 'Integrações' },
  { path: '/configuracoes', icon: Settings, label: 'Configurações' },
  { section: 'Executivo' },
  { path: '/ceo', icon: Crown, label: 'Modo CEO' },
];

export default function Sidebar() {
  const { theme } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const logoStyle = {
    height: 44,
    filter: theme === 'dark' ? 'invert(1)' : 'none',
    mixBlendMode: theme === 'dark' ? 'screen' : 'multiply',
    objectFit: 'contain'
  };

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && <div className="sidebar-overlay-bg" onClick={toggleMobile} />}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {collapsed
              ? <img src="/favicon.png" alt="fy." style={{ height: 32, width: 32, borderRadius: 6, objectFit: 'cover' }} />
              : <img src="/logo.png" alt="foryou.lab" style={logoStyle} />
            }
            <button onClick={() => setCollapsed(!collapsed)} className="sidebar-toggle desktop-only">
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button onClick={toggleMobile} className="sidebar-toggle mobile-only">
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => {
            if (item.section) {
              return !collapsed && <div key={i} className="nav-section-title">{item.section}</div>;
            }
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink key={item.path} to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}>
                <Icon size={17} />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {(!collapsed || mobileOpen) && (
          <div className="sidebar-user-info" style={{ padding: '12px 16px', borderTop: '1px solid var(--sidebar-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/favicon.png" alt="Admin" className="avatar" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Ricardo</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Admin</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile bottom nav */}
      <div className="mobile-nav">
        {[
          { path: '/', icon: LayoutDashboard, label: 'Home' },
          { path: '/crm', icon: Users, label: 'CRM' },
          { path: '/whatsapp', icon: MessageCircle, label: 'Chat' },
          { path: '/projetos', icon: ClipboardList, label: 'Projetos' },
          { onClick: toggleMobile, icon: Box, label: 'Módulos', isButton: true },
        ].map((item, idx) => {
          const Icon = item.icon;
          if (item.isButton) {
            return (
              <button key={idx} onClick={item.onClick} className={mobileOpen ? 'active' : ''} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 9, gap: 2, padding: '4px 8px' }}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          }
          return (
            <NavLink key={item.path} to={item.path}
              className={location.pathname === item.path ? 'active' : ''}>
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </>
  );
}
