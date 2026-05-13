import { useState, useEffect, useRef } from 'react';
import { useApp } from '../data/store';
import { 
  Smartphone, AlertTriangle, QrCode, RefreshCw, Settings, CheckCircle, LogOut,
  Send, Search, User, Phone, Smile, Paperclip, MoreVertical, MessageSquare,
  Circle, ShieldCheck, Home, Users, Hash, ArrowLeft, Plus, Filter, LayoutGrid, CheckSquare, SearchCode
} from 'lucide-react';
import Modal from '../components/Modal';
import axios from 'axios';

export default function WhatsAppPage() {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState('canais'); // workspaces, dashboard, conversas, contatos, canais, configuracoes

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', margin: -24, background: '#0A0A0A', color: '#FFF', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SECONDARY SIDEBAR */}
      {activeTab !== 'workspaces' && (
        <div style={{ width: 240, borderRight: '1px solid #1F1F1F', background: '#0C0C0C', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: 1, marginBottom: 16, paddingLeft: 12 }}>PRINCIPAL</div>
          
          <SidebarItem icon={<Home size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={<MessageSquare size={18} />} label="Conversas" active={activeTab === 'conversas'} onClick={() => setActiveTab('conversas')} />
          <SidebarItem icon={<Users size={18} />} label="Contatos" active={activeTab === 'contatos'} onClick={() => setActiveTab('contatos')} />
          <SidebarItem icon={<Hash size={18} />} label="Canais" active={activeTab === 'canais'} onClick={() => setActiveTab('canais')} />
          <SidebarItem icon={<Settings size={18} />} label="Configurações" active={activeTab === 'configuracoes'} onClick={() => setActiveTab('configuracoes')} />
          
          <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid #1F1F1F' }}>
            <SidebarItem icon={<ArrowLeft size={18} />} label="Voltar aos Workspaces" onClick={() => setActiveTab('workspaces')} />
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'workspaces' && <WorkspacesView setActiveTab={setActiveTab} />}
        {activeTab === 'canais' && <CanaisView />}
        {activeTab === 'conversas' && <ConversasView />}
        {activeTab === 'contatos' && <ContatosView />}
        {activeTab === 'dashboard' && <FunnelView />}
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <div 
      onClick={onClick} 
      style={{ 
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', 
        background: active ? '#1A1A1A' : 'transparent', color: active ? '#22C55E' : '#888', 
        fontWeight: active ? 600 : 500, transition: '0.2s', marginBottom: 4 
      }}
      onMouseEnter={e => { if(!active) { e.currentTarget.style.color = '#FFF'; e.currentTarget.style.background = '#141414'; } }}
      onMouseLeave={e => { if(!active) { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'transparent'; } }}
    >
      {icon}
      <span style={{ fontSize: 13 }}>{label}</span>
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-VIEWS
// ----------------------------------------------------------------------

function CanaisView() {
  const channels = [
    { id: '#11', name: 'Israel Henrique', desc: 'Nenhuma descrição informada', date: '27/03/2026', status: 'ATIVO' },
    { id: '#6', name: 'Canal escola', desc: 'sdsdf', date: '10/03/2026', status: 'ATIVO' },
    { id: '#1', name: 'Clínica Vida', desc: 'sdsd', date: '04/03/2026', status: 'ATIVO' },
    { id: '#9', name: 'Comercial Foryou Lab', desc: 'Atendimento comercial', date: '02/03/2026', status: 'ATIVO' },
    { id: '#4', name: 'Suporte Foryou Lab', desc: 'Atendimento ao cliente', date: '01/03/2026', status: 'ATIVO' },
    { id: '#3', name: 'Pré-vendas', desc: 'Qualificação de leads', date: '25/02/2026', status: 'ATIVO' },
  ];

  return (
    <div style={{ padding: 40, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Canais</h2>
          <div style={{ color: '#888', fontSize: 14 }}>Gerencie as integrações e pontos de atendimento deste workspace.</div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button style={{ background: '#1A1A1A', border: '1px solid #333', color: '#FFF', borderRadius: 8, padding: '10px', cursor: 'pointer' }}><Search size={18} /></button>
          <button style={{ background: '#1A1A1A', border: '1px solid #333', color: '#FFF', borderRadius: 8, padding: '10px', cursor: 'pointer', position: 'relative' }}>
            <AlertTriangle size={18} />
            <div style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: '#EAB308', borderRadius: '50%' }} />
          </button>
          <button style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Plus size={18} /> Adicionar canal
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#141414', border: '1px solid #222', borderRadius: 8, padding: '10px 16px' }}>
          <Search size={18} color="#666" style={{ marginRight: 12 }} />
          <input type="text" placeholder="Pesquisar por nome ou número..." style={{ background: 'transparent', border: 'none', color: '#FFF', outline: 'none', width: '100%', fontSize: 14 }} />
        </div>
        <button style={{ background: '#141414', border: '1px solid #222', color: '#FFF', borderRadius: 8, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Filter size={16} color="#888" /> Todos os status
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {channels.map((ch, i) => (
          <div key={i} style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={24} color="#000" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{ch.name}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, background: '#22C55E', borderRadius: '50%' }} /> {ch.status}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#888' }}>{ch.desc}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>ID: {ch.id}</div>
                <div style={{ fontSize: 12, color: '#666' }}>Criado em {ch.date}</div>
              </div>
              <button style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}><MoreHorizontal size={20} /></button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#666' }}>
        <div>Mostrando 1 a 6 de 6 canais</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ width: 32, height: 32, background: '#1A1A1A', border: '1px solid #333', color: '#666', borderRadius: 8, cursor: 'pointer' }}>&lt;</button>
          <button style={{ width: 32, height: 32, background: '#EAB308', border: 'none', color: '#000', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>1</button>
          <button style={{ width: 32, height: 32, background: '#1A1A1A', border: '1px solid #333', color: '#666', borderRadius: 8, cursor: 'pointer' }}>&gt;</button>
        </div>
      </div>
    </div>
  );
}

function ConversasView() {
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Inbox Sidebar */}
      <div style={{ width: 320, background: '#141414', borderRight: '1px solid #1F1F1F', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #1F1F1F' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between' }}>
            Atendimento <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>#14</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', background: '#0A0A0A', border: '1px solid #222', borderRadius: 8, padding: '8px 12px' }}>
            <Search size={16} color="#666" style={{ marginRight: 8 }} />
            <input type="text" placeholder="Pesquisar conversa..." style={{ background: 'transparent', border: 'none', color: '#FFF', outline: 'none', width: '100%', fontSize: 13 }} />
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888', padding: 20, textAlign: 'center' }}>
          <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#CCC', marginBottom: 8 }}>Nenhuma conversa ainda</div>
          <div style={{ fontSize: 13 }}>Inicie uma nova conversa ou aguarde o contato do cliente.</div>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0A0A0A' }}>
        {/* Top Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1F1F1F', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1A1A1A', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            <div style={{ width: 8, height: 8, background: '#22C55E', borderRadius: '50%' }} /> Conectado
          </div>
          <button style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><Filter size={18} /></button>
          <button style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}><MoreVertical size={18} /></button>
        </div>

        {/* Empty State */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, background: 'rgba(34, 197, 94, 0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <MessageSquare size={32} color="#22C55E" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#FFF', marginBottom: 12 }}>Nenhuma conversa selecionada</h3>
          <p style={{ fontSize: 14, maxWidth: 300, lineHeight: 1.5 }}>Selecione uma conversa na lista ao lado para visualizar e enviar mensagens.</p>
        </div>

        {/* Input Area (Disabled) */}
        <div style={{ padding: 24, borderTop: '1px solid #1F1F1F' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#141414', border: '1px solid #222', borderRadius: 12, padding: '12px 16px' }}>
            <Paperclip size={20} color="#666" style={{ marginRight: 16, cursor: 'pointer' }} />
            <input type="text" placeholder="Digite sua mensagem..." disabled style={{ background: 'transparent', border: 'none', color: '#FFF', outline: 'none', width: '100%', fontSize: 14 }} />
            <div style={{ width: 36, height: 36, background: '#1A1A1A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 16 }}>
              <Send size={16} color="#666" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContatosView() {
  const contacts = [
    { name: 'Data7 Apps', phone: '554191338855', id: '1400717852569970', channel: 'Israel Henrique', lastActivity: '17:55' }
  ];

  return (
    <div style={{ padding: 40, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Contatos</h2>
          <div style={{ color: '#888', fontSize: 14 }}>1 contato</div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#141414', border: '1px solid #222', borderRadius: 8, padding: '10px 16px', width: 280 }}>
            <Search size={16} color="#666" style={{ marginRight: 8 }} />
            <input type="text" placeholder="Buscar por nome ou telefone..." style={{ background: 'transparent', border: 'none', color: '#FFF', outline: 'none', width: '100%', fontSize: 13 }} />
          </div>
          <button style={{ background: '#22C55E', border: 'none', color: '#FFF', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <User size={18} /> Adicionar contato
          </button>
        </div>
      </div>

      <div style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F1F1F' }}>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: 1 }}>CONTATO</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: 1 }}>TELEFONE</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: 1 }}>CANAL</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: 1 }}>ÚLTIMA ATIVIDADE</th>
              <th style={{ padding: '16px 24px' }}></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1F1F1F' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="#666" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{c.id} <span style={{ background: '#1A1A1A', padding: '2px 4px', borderRadius: 4 }}>ID</span></div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', fontSize: 14, color: '#CCC' }}>{c.phone}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', padding: '4px 8px', borderRadius: 16, fontSize: 12, fontWeight: 600 }}>
                    <Phone size={12} /> {c.channel}
                  </div>
                </td>
                <td style={{ padding: '16px 24px', fontSize: 14, color: '#CCC' }}>{c.lastActivity}</td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <button style={{ background: '#1A1A1A', border: 'none', color: '#888', borderRadius: 8, padding: '8px', cursor: 'pointer' }}><MoreVertical size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FunnelView() {
  return (
    <div style={{ padding: 40, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Funil padrão</h2>
          <div style={{ color: '#888', fontSize: 14 }}>Gerencie os atendimentos arrastando entre as etapas.</div>
        </div>
        <button style={{ background: '#22C55E', border: 'none', color: '#FFF', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Plus size={18} /> Nova Etapa
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 24 }}>
        {/* Board Column */}
        <div style={{ width: 320, flexShrink: 0, background: '#141414', border: '1px solid #1F1F1F', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, background: '#22C55E', borderRadius: '50%' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>Novo Contato</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#22C55E', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 8px', borderRadius: 12 }}>1</div>
              <MoreVertical size={16} color="#666" style={{ cursor: 'pointer' }} />
            </div>
          </div>
          
          {/* Card */}
          <div style={{ background: '#0A0A0A', border: '1px solid #222', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="#666" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Data7 Apps</div>
                <div style={{ fontSize: 11, color: '#888' }}>554191338855</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>Sem mensagens</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', padding: '4px 8px', borderRadius: 16, fontSize: 11, fontWeight: 600 }}>
                <Phone size={10} /> Israel Henrique
              </div>
              <div style={{ fontSize: 11, color: '#666' }}>1 min</div>
            </div>
          </div>
        </div>

        {/* Empty Column */}
        <div style={{ width: 320, flexShrink: 0, border: '1px dashed #1F1F1F', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>+ Adicionar coluna</div>
        </div>
      </div>
    </div>
  );
}

function WorkspacesView({ setActiveTab }) {
  return (
    <div style={{ background: '#FFF', color: '#000', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 32px', borderBottom: '1px solid #E5E5E5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 600 }}>
          <div style={{ width: 32, height: 32, background: '#22C55E', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutGrid size={16} color="#FFF" />
          </div>
          Multi Atendimento
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#F5F5F5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color="#666" />
          </div>
        </div>
      </div>

      <div style={{ padding: 48, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px 0' }}>Meus Workspaces</h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 40 }}>Gerencie seus projetos e espaços de trabalho.</p>

        <div style={{ display: 'flex', gap: 24 }}>
          {/* Create New */}
          <div style={{ width: 300, height: 200, border: '1px dashed #CCC', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F9F9F9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: 48, height: 48, background: '#F5F5F5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Plus size={24} color="#666" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Criar Workspace</div>
            <div style={{ fontSize: 13, color: '#888' }}>Adicione um novo espaço de trabalho</div>
          </div>

          {/* Existing Workspace */}
          <div onClick={() => setActiveTab('canais')} style={{ width: 360, height: 200, background: '#FFF', border: '1px solid #E5E5E5', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, background: '#22C55E', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Home size={24} color="#FFF" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Loja Y</div>
                <div style={{ fontSize: 13, color: '#666' }}>Workspace ativo</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#666', flex: 1 }}>Descricao Loja X</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#888', borderTop: '1px solid #F0F0F0', paddingTop: 16 }}>
              <div style={{ width: 24, height: 24, background: '#F0F0FF', color: '#6366F1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10 }}>FS</div>
              • 28 de janeiro de 2024
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
