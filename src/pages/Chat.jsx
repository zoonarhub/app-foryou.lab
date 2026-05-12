import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../data/store';
import { Search, Send, Plus, Hash, Pin, Users, Smile, Paperclip, X, Edit2, Trash2, MessageSquare, User } from 'lucide-react';
import Modal from '../components/Modal';

const fmt = d => new Date(d).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
const fmtDate = d => {const t=new Date(d),n=new Date();if(t.toDateString()===n.toDateString())return'Hoje';const y=new Date(n);y.setDate(y.getDate()-1);if(t.toDateString()===y.toDateString())return'Ontem';return t.toLocaleDateString('pt-BR',{day:'numeric',month:'long'});};
const COLORS = ['#FFD600','#3B82F6','#22C55E','#EF4444','#8B5CF6','#F59E0B','#EC4899','#06B6D4'];
const getColor = (id) => COLORS[parseInt(id?.replace(/\D/g,'') || '0') % COLORS.length];

export default function Chat() {
  const { channels, chatMessages, teamMembers, addItem, updateItem, deleteItem, addToast, auth, theme } = useApp();
  const [activeChannel, setActiveChannel] = useState(() => (channels && channels.length > 0) ? channels[0].id : '');
  const [pendingChannelId, setPendingChannelId] = useState(null);
  const [activeDM, setActiveDM] = useState(null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newCh, setNewCh] = useState({ nome:'', descricao:'', tipo:'publico' });
  const [threadMsg, setThreadMsg] = useState(null);
  const [threadInput, setThreadInput] = useState('');
  const [panel, setPanel] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState('');
  const [userStatus, setUserStatus] = useState('online');
  const endRef = useRef(null);
  const threadEndRef = useRef(null);

  const currentUser = { id: 'tm1', nome: auth?.nome || 'Ricardo', avatar: (auth?.nome||'R')[0].toUpperCase() };

  // Determine active context
  const isDM = !!activeDM;
  const contextId = isDM ? `dm_${[currentUser.id, activeDM].sort().join('_')}` : activeChannel;
  const channel = isDM ? null : (channels||[]).find(c => c.id === activeChannel);
  const dmMember = isDM ? (teamMembers||[]).find(m => m.id === activeDM) : null;

  const msgs = (chatMessages||[]).filter(m => m.channelId === contextId && !m.respondendoA).sort((a,b) => (a.timestamp||0)-(b.timestamp||0));
  const threadMsgs = threadMsg ? (chatMessages||[]).filter(m => m.respondendoA === threadMsg.id).sort((a,b) => (a.timestamp||0)-(b.timestamp||0)) : [];
  const pinnedMsgs = (chatMessages||[]).filter(m => m.channelId === contextId && m.pinned);
  const filteredChannels = (channels||[]).filter(c => !search || c.nome.toLowerCase().includes(search.toLowerCase()));

  const unreadCounts = {};
  (channels||[]).forEach(ch => {
    const lastRead = parseInt(localStorage.getItem(`chat_read_${ch.id}`) || '0');
    unreadCounts[ch.id] = (chatMessages||[]).filter(m => m.channelId === ch.id && (m.timestamp||0) > lastRead && m.autorId !== currentUser.id).length;
  });

  // Auto-select pending channel after state updates
  useEffect(() => {
    if (pendingChannelId && (channels||[]).find(c => c.id === pendingChannelId)) {
      setActiveChannel(pendingChannelId);
      setActiveDM(null);
      setPendingChannelId(null);
    }
  }, [channels, pendingChannelId]);

  // Auto-select first channel if nothing selected
  useEffect(() => {
    if (!activeChannel && !activeDM && !pendingChannelId && channels && channels.length > 0) {
      setActiveChannel(channels[0].id);
    }
  }, [channels, activeChannel, activeDM, pendingChannelId]);

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [msgs.length, contextId]);
  useEffect(() => { threadEndRef.current?.scrollIntoView({behavior:'smooth'}); }, [threadMsgs.length]);
  useEffect(() => { if(contextId) localStorage.setItem(`chat_read_${contextId}`, Date.now().toString()); }, [contextId, msgs.length]);

  const sendMsg = useCallback(() => {
    if (!input.trim() || !contextId) return;
    addItem('chatMessages', { channelId: contextId, autorId: currentUser.id, autorNome: currentUser.nome, conteudo: input.trim(), tipo:'texto', reacoes:[], pinned:false, timestamp: Date.now() });
    setInput('');
  }, [input, contextId, addItem, currentUser]);

  const sendThreadReply = useCallback(() => {
    if (!threadInput.trim() || !threadMsg) return;
    addItem('chatMessages', { channelId: contextId, autorId: currentUser.id, autorNome: currentUser.nome, conteudo: threadInput.trim(), tipo:'texto', reacoes:[], pinned:false, respondendoA: threadMsg.id, timestamp: Date.now() });
    setThreadInput('');
  }, [threadInput, threadMsg, contextId, addItem, currentUser]);

  const togglePin = (msg) => { updateItem('chatMessages', msg.id, { pinned: !msg.pinned }); addToast(msg.pinned ? 'Desafixada' : 'Fixada!'); };
  const deleteMsg = (msg) => { deleteItem('chatMessages', msg.id); addToast('Excluída', 'warning'); };
  const saveEdit = () => { if(editingMsg && editText.trim()) { updateItem('chatMessages', editingMsg.id, { conteudo: editText, editado: true }); setEditingMsg(null); } };
  const addReaction = (msg, emoji) => {
    const r = [...(msg.reacoes||[])];
    const idx = r.findIndex(x => x.emoji === emoji);
    if (idx >= 0) { if(r[idx].users.includes(currentUser.id)) r[idx].users = r[idx].users.filter(u=>u!==currentUser.id); else r[idx].users.push(currentUser.id); if(!r[idx].users.length) r.splice(idx,1); }
    else r.push({ emoji, users:[currentUser.id] });
    updateItem('chatMessages', msg.id, { reacoes: r });
  };

  const createChannel = () => {
    if (!newCh.nome.trim()) { addToast('Nome obrigatório','error'); return; }
    const id = addItem('channels', { ...newCh, nome: newCh.nome.toLowerCase().replace(/\s+/g,'-'), criadoPor: currentUser.id, icone:'#' });
    addToast('Canal criado!');
    setShowNewChannel(false);
    setNewCh({ nome:'', descricao:'', tipo:'publico' });
    if (id) { setPendingChannelId(id); }
  };

  const openDM = (memberId) => {
    setActiveDM(memberId);
    setActiveChannel('');
    setThreadMsg(null);
    setPanel(null);
  };

  const openChannel = (chId) => {
    setActiveChannel(chId);
    setActiveDM(null);
    setThreadMsg(null);
    setPanel(null);
  };

  const renderContent = (text) => {
    if (!text) return text;
    let html = text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/`(.*?)`/g,'<code style="background:var(--gray-bg);padding:1px 5px;border-radius:3px;font-family:monospace;font-size:12px">$1</code>');
    html = html.replace(/@(\w+)/g,'<span style="background:rgba(255,214,0,.15);color:#FFD600;padding:1px 4px;border-radius:3px;font-weight:600">@$1</span>');
    return <span dangerouslySetInnerHTML={{__html:html}} />;
  };

  const MsgBubble = ({ msg, isThread }) => {
    const [hovered, setHovered] = useState(false);
    const color = getColor(msg.autorId);
    const replyCount = isThread ? 0 : (chatMessages||[]).filter(m => m.respondendoA === msg.id).length;
    return (
      <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{ display:'flex', gap:10, padding:'6px 20px', position:'relative', background: hovered ? 'var(--gray-bg)' : 'transparent', transition:'background .1s' }}>
        <div style={{ width:36, height:36, borderRadius:8, background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#0A0A0A', flexShrink:0 }}>{(msg.autorNome||'?')[0]}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>{msg.autorNome}</span>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>{msg.timestamp ? fmt(msg.timestamp) : ''}{msg.editado && ' (editado)'}</span>
          </div>
          {editingMsg?.id === msg.id ? (
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <input value={editText} onChange={e=>setEditText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveEdit();if(e.key==='Escape')setEditingMsg(null);}} className="form-input" style={{ flex:1, padding:'6px 10px' }} autoFocus />
              <button onClick={saveEdit} className="btn btn-sm btn-primary">OK</button>
              <button onClick={()=>setEditingMsg(null)} className="btn btn-sm btn-secondary">✕</button>
            </div>
          ) : <div style={{ fontSize:14, lineHeight:1.6, color:'var(--text-primary)', marginTop:2 }}>{renderContent(msg.conteudo)}</div>}
          {(msg.reacoes||[]).length > 0 && (
            <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>
              {msg.reacoes.map((r,i) => <button key={i} onClick={()=>addReaction(msg,r.emoji)} style={{ background: r.users.includes(currentUser.id) ? 'rgba(255,214,0,.15)' : 'var(--gray-bg)', border: r.users.includes(currentUser.id) ? '1px solid rgba(255,214,0,.3)' : '1px solid var(--card-border)', borderRadius:12, padding:'2px 8px', fontSize:12, cursor:'pointer', color:'var(--text-primary)' }}>{r.emoji} {r.users.length}</button>)}
            </div>
          )}
          {replyCount > 0 && !isThread && <button onClick={()=>setThreadMsg(msg)} style={{ background:'none', border:'none', color:'#3B82F6', fontSize:12, cursor:'pointer', marginTop:4, fontWeight:600 }}>{replyCount} resposta{replyCount>1?'s':''} → Ver thread</button>}
        </div>
        {hovered && !editingMsg && (
          <div style={{ position:'absolute', top:-4, right:20, display:'flex', gap:2, background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:8, padding:2, boxShadow:'var(--shadow-md)' }}>
            {['😊','👍','🔥','❤️'].map(e => <button key={e} onClick={()=>addReaction(msg,e)} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', fontSize:14, borderRadius:4 }}>{e}</button>)}
            {!isThread && <button onClick={()=>{setThreadMsg(msg);setPanel(null);}} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', color:'var(--text-secondary)' }}><MessageSquare size={14}/></button>}
            <button onClick={()=>togglePin(msg)} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', color: msg.pinned ? '#FFD600' : 'var(--text-secondary)' }}><Pin size={14}/></button>
            {msg.autorId===currentUser.id && <button onClick={()=>{setEditingMsg(msg);setEditText(msg.conteudo);}} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', color:'var(--text-secondary)' }}><Edit2 size={14}/></button>}
            {msg.autorId===currentUser.id && <button onClick={()=>deleteMsg(msg)} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', color:'#EF4444' }}><Trash2 size={14}/></button>}
          </div>
        )}
      </div>
    );
  };

  // Group messages by date
  const groupedMsgs = [];
  let lastDate = '';
  msgs.forEach(m => { const d = m.timestamp ? fmtDate(m.timestamp) : ''; if(d!==lastDate){groupedMsgs.push({type:'date',label:d});lastDate=d;} groupedMsgs.push({type:'msg',data:m}); });

  const statusColors = { online:'#22C55E', ausente:'#F59E0B', naoPerturbe:'#EF4444' };
  const hasContext = isDM ? !!dmMember : !!channel;
  const headerTitle = isDM ? dmMember?.nome : channel?.nome;
  const headerDesc = isDM ? 'Mensagem direta' : channel?.descricao;
  const placeholderText = isDM ? `Mensagem para ${dmMember?.nome?.split(' ')[0]}` : `Mensagem para #${channel?.nome}`;

  return (
    <div className="chat-fullpage" style={{ display:'flex', overflow:'hidden' }}>
      {/* COL 1 — Sidebar */}
      <div style={{ width:240, background:'var(--sidebar-bg)', borderRight:'1px solid var(--card-border)', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--card-border)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontWeight:800, fontSize:15, color:'var(--yellow)' }}>💬 Chat</span>
            <button onClick={()=>{const s=['online','ausente','naoPerturbe'];setUserStatus(s[(s.indexOf(userStatus)+1)%3]);}} style={{ width:10, height:10, borderRadius:'50%', background:statusColors[userStatus], border:'none', cursor:'pointer' }} title={userStatus} />
          </div>
          <div className="search-input-wrapper">
            <Search size={13} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar canais..." style={{ fontSize:12 }} />
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 16px' }}>
            <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1 }}>Canais</span>
            <button onClick={()=>setShowNewChannel(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:0 }}><Plus size={14}/></button>
          </div>
          {filteredChannels.map(ch => (
            <button key={ch.id} onClick={()=>openChannel(ch.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 16px', background: !isDM && activeChannel===ch.id ? 'rgba(255,214,0,.08)' : 'transparent', border:'none', cursor:'pointer', color: !isDM && activeChannel===ch.id ? 'var(--yellow)' : 'var(--text-secondary)', fontSize:13, fontWeight: !isDM && activeChannel===ch.id ? 600 : 400, textAlign:'left', borderLeft: !isDM && activeChannel===ch.id ? '3px solid var(--yellow)' : '3px solid transparent', fontFamily:'inherit' }}>
              <Hash size={14} style={{ flexShrink:0 }} />
              <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ch.nome}</span>
              {unreadCounts[ch.id] > 0 && <span style={{ background:'var(--yellow)', color:'#0A0A0A', borderRadius:10, padding:'0 6px', fontSize:10, fontWeight:700 }}>{unreadCounts[ch.id]}</span>}
            </button>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px 6px' }}>
            <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1 }}>Mensagens Diretas</span>
          </div>
          {(teamMembers||[]).filter(m=>m.id!==currentUser.id).map(m => (
            <button key={m.id} onClick={()=>openDM(m.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'6px 16px', background: isDM && activeDM===m.id ? 'rgba(255,214,0,.08)' : 'transparent', border:'none', cursor:'pointer', color: isDM && activeDM===m.id ? 'var(--yellow)' : 'var(--text-secondary)', fontSize:13, fontWeight: isDM && activeDM===m.id ? 600 : 400, textAlign:'left', borderLeft: isDM && activeDM===m.id ? '3px solid var(--yellow)' : '3px solid transparent', fontFamily:'inherit' }}>
              <div style={{ position:'relative' }}>
                <div style={{ width:24, height:24, borderRadius:6, background:getColor(m.id), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#0A0A0A' }}>{m.nome[0]}</div>
                <div style={{ position:'absolute', bottom:-1, right:-1, width:8, height:8, borderRadius:'50%', background:'#22C55E', border:'2px solid var(--sidebar-bg)' }} />
              </div>
              <span>{m.nome.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* COL 2 — Messages */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:'var(--main-bg)', minWidth:0 }}>
        {hasContext ? (<>
          <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--card-border)', background:'var(--header-bg)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:16, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:6 }}>
                {isDM ? <User size={16} /> : <Hash size={16} />}
                {headerTitle}
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{headerDesc}</div>
            </div>
            {!isDM && <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setPanel(panel==='pinned'?null:'pinned')} style={{ background:'none', border:'none', cursor:'pointer', color: panel==='pinned' ? 'var(--yellow)' : 'var(--text-muted)' }}><Pin size={16}/></button>
              <button onClick={()=>setPanel(panel==='members'?null:'members')} style={{ background:'none', border:'none', cursor:'pointer', color: panel==='members' ? 'var(--yellow)' : 'var(--text-muted)' }}><Users size={16}/></button>
            </div>}
          </div>
          <div style={{ flex:1, overflowY:'auto', paddingTop:16, paddingBottom:8 }}>
            {groupedMsgs.length === 0 && (
              <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
                {isDM ? <User size={48} style={{ opacity:.2, margin:'0 auto 12px' }} /> : <Hash size={48} style={{ opacity:.2, margin:'0 auto 12px' }} />}
                <div style={{ fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>{isDM ? `Conversa com ${dmMember?.nome}` : `Bem-vindo ao #${channel?.nome}!`}</div>
                <div style={{ fontSize:13, marginTop:4 }}>{isDM ? 'Envie a primeira mensagem direta.' : 'Este é o início do canal. Envie a primeira mensagem.'}</div>
              </div>
            )}
            {groupedMsgs.map((item,i) => item.type==='date' ? (
              <div key={'d'+i} style={{ textAlign:'center', padding:'8px 0', position:'relative' }}>
                <span style={{ background:'var(--gray-bg)', padding:'4px 12px', borderRadius:12, fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>{item.label}</span>
              </div>
            ) : <MsgBubble key={item.data.id} msg={item.data} />)}
            <div ref={endRef} />
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--card-border)', background:'var(--header-bg)', flexShrink:0 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center', background:'var(--gray-bg)', borderRadius:12, padding:'4px 12px', border:'1px solid var(--card-border)' }}>
              <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}><Smile size={18}/></button>
              <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}><Paperclip size={18}/></button>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey){e.preventDefault();sendMsg();}}} placeholder={placeholderText} style={{ flex:1, padding:'10px 4px', border:'none', background:'transparent', color:'var(--text-primary)', fontSize:14, outline:'none', fontFamily:'inherit' }} />
              <button onClick={sendMsg} disabled={!input.trim()} style={{ background: input.trim() ? 'var(--yellow)' : 'var(--gray-light)', border:'none', borderRadius:8, padding:'8px 12px', cursor: input.trim() ? 'pointer' : 'default', color:'#0A0A0A', transition:'all .2s' }}><Send size={16}/></button>
            </div>
          </div>
        </>) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>
            <div style={{ textAlign:'center' }}><MessageSquare size={48} style={{ opacity:.15, marginBottom:12 }} /><div style={{ fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>Selecione um canal</div></div>
          </div>
        )}
      </div>

      {/* COL 3 — Thread / Panel */}
      {(threadMsg || panel) && (
        <div style={{ width:320, borderLeft:'1px solid var(--card-border)', background:'var(--card-bg)', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--card-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)' }}>{threadMsg ? 'Thread' : panel==='pinned' ? '📌 Fixados' : '👥 Membros'}</span>
            <button onClick={()=>{setThreadMsg(null);setPanel(null);}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={16}/></button>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {threadMsg && (<>
              <div style={{ borderBottom:'1px solid var(--card-border)', paddingBottom:8 }}><MsgBubble msg={threadMsg} isThread /></div>
              <div style={{ padding:'8px 0', fontSize:11, textAlign:'center', color:'var(--text-muted)' }}>{threadMsgs.length} resposta{threadMsgs.length!==1?'s':''}</div>
              {threadMsgs.map(m => <MsgBubble key={m.id} msg={m} isThread />)}
              <div ref={threadEndRef} />
            </>)}
            {panel==='pinned' && (pinnedMsgs.length ? pinnedMsgs.map(m => <MsgBubble key={m.id} msg={m} isThread />) : <div style={{ padding:24, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Nenhuma mensagem fixada</div>)}
            {panel==='members' && (teamMembers||[]).map(m => (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid var(--card-border)' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:getColor(m.id), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#0A0A0A' }}>{m.nome[0]}</div>
                <div><div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{m.nome}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>{m.cargo}</div></div>
              </div>
            ))}
          </div>
          {threadMsg && (
            <div style={{ padding:'10px 12px', borderTop:'1px solid var(--card-border)' }}>
              <div style={{ display:'flex', gap:8, background:'var(--gray-bg)', borderRadius:10, padding:'4px 10px', border:'1px solid var(--card-border)' }}>
                <input value={threadInput} onChange={e=>setThreadInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();sendThreadReply();}}} placeholder="Responder..." style={{ flex:1, padding:'8px 4px', border:'none', background:'transparent', color:'var(--text-primary)', fontSize:13, outline:'none', fontFamily:'inherit' }} />
                <button onClick={sendThreadReply} disabled={!threadInput.trim()} style={{ background: threadInput.trim() ? 'var(--yellow)' : 'var(--gray-light)', border:'none', borderRadius:6, padding:'6px 10px', cursor: threadInput.trim() ? 'pointer' : 'default', color:'#0A0A0A' }}><Send size={14}/></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Channel Modal */}
      <Modal isOpen={showNewChannel} onClose={()=>setShowNewChannel(false)} title="Criar Canal" size="sm" footer={<><button className="btn btn-secondary" onClick={()=>setShowNewChannel(false)}>Cancelar</button><button className="btn btn-primary" onClick={createChannel}>Criar</button></>}>
        <div className="form-group"><label className="form-label">Nome do canal</label><input className="form-input" value={newCh.nome} onChange={e=>setNewCh({...newCh,nome:e.target.value})} placeholder="ex: marketing-digital" /></div>
        <div className="form-group"><label className="form-label">Descrição</label><input className="form-input" value={newCh.descricao} onChange={e=>setNewCh({...newCh,descricao:e.target.value})} placeholder="Para que serve este canal" /></div>
        <div className="form-group"><label className="form-label">Tipo</label>
          <select className="form-select" value={newCh.tipo} onChange={e=>setNewCh({...newCh,tipo:e.target.value})}>
            <option value="publico">Público</option><option value="privado">Privado</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}
