// Mock data for foryou.lab app
export const teamMembers = [
  { id: '1', nome: 'Ricardo Fernandes', cargo: 'CEO', email: 'ricardo@foryou.lab', whatsapp: '11999990001', foto: null, perfil: 'admin', ativo: true },
  { id: '2', nome: 'Ana Silva', cargo: 'Account Manager', email: 'ana@foryou.lab', whatsapp: '11999990002', foto: null, perfil: 'gestor', ativo: true },
  { id: '3', nome: 'Lucas Oliveira', cargo: 'Gestor de Tráfego', email: 'lucas@foryou.lab', whatsapp: '11999990003', foto: null, perfil: 'operacional', ativo: true },
  { id: '4', nome: 'Mariana Costa', cargo: 'Designer', email: 'mariana@foryou.lab', whatsapp: '11999990004', foto: null, perfil: 'operacional', ativo: true },
  { id: '5', nome: 'Pedro Santos', cargo: 'SDR', email: 'pedro@foryou.lab', whatsapp: '11999990005', foto: null, perfil: 'sdr', ativo: true },
  { id: '6', nome: 'Julia Mendes', cargo: 'Copywriter', email: 'julia@foryou.lab', whatsapp: '11999990006', foto: null, perfil: 'operacional', ativo: true },
];

export const clients = [
  { id: '1', nome: 'Carlos Almeida', empresa: 'Tech Solutions', cnpj: '12.345.678/0001-01', segmento: 'Tecnologia', email: 'carlos@techsol.com.br', whatsapp: '11988881001', responsavel: '2', plano: 'Growth', mrr: 4500, status: 'ativo', dataInicio: '2025-08-15', etapaLaboratorio: 'performance', nps: 9, logo: null },
  { id: '2', nome: 'Fernanda Lima', empresa: 'Bella Estética', cnpj: '23.456.789/0001-02', segmento: 'Saúde e Beleza', email: 'fernanda@bella.com.br', whatsapp: '11988882002', responsavel: '2', plano: 'Scale', mrr: 7800, status: 'ativo', dataInicio: '2025-03-10', etapaLaboratorio: 'escala', nps: 10, logo: null },
  { id: '3', nome: 'Roberto Souza', empresa: 'Souza Advocacia', cnpj: '34.567.890/0001-03', segmento: 'Jurídico', email: 'roberto@souzaadv.com.br', whatsapp: '11988883003', responsavel: '3', plano: 'Starter', mrr: 2200, status: 'ativo', dataInicio: '2025-11-20', etapaLaboratorio: 'estrutura', nps: 7, logo: null },
  { id: '4', nome: 'Patrícia Gomes', empresa: 'PG Consultoria', cnpj: '45.678.901/0001-04', segmento: 'Consultoria', email: 'patricia@pgconsult.com.br', whatsapp: '11988884004', responsavel: '2', plano: 'Growth', mrr: 5000, status: 'ativo', dataInicio: '2025-06-01', etapaLaboratorio: 'performance', nps: 8, logo: null },
  { id: '5', nome: 'Diego Martins', empresa: 'DM Imóveis', cnpj: '56.789.012/0001-05', segmento: 'Imobiliário', email: 'diego@dmimoveis.com.br', whatsapp: '11988885005', responsavel: '3', plano: 'Growth', mrr: 4200, status: 'onboarding', dataInicio: '2026-04-15', etapaLaboratorio: 'diagnostico', nps: null, logo: null },
  { id: '6', nome: 'Amanda Rocha', empresa: 'Fit Power Academy', cnpj: '67.890.123/0001-06', segmento: 'Fitness', email: 'amanda@fitpower.com.br', whatsapp: '11988886006', responsavel: '2', plano: 'Starter', mrr: 1800, status: 'pausado', dataInicio: '2025-01-10', etapaLaboratorio: 'estrutura', nps: 5, logo: null },
  { id: '7', nome: 'Marcos Tavares', empresa: 'Sabor & Arte Gastronomia', cnpj: '78.901.234/0001-07', segmento: 'Gastronomia', email: 'marcos@saborarte.com.br', whatsapp: '11988887007', responsavel: '3', plano: 'Scale', mrr: 6500, status: 'ativo', dataInicio: '2025-05-20', etapaLaboratorio: 'performance', nps: 9, logo: null },
  { id: '8', nome: 'Vanessa Cruz', empresa: 'VC Arquitetura', cnpj: '89.012.345/0001-08', segmento: 'Arquitetura', email: 'vanessa@vcarq.com.br', whatsapp: '11988888008', responsavel: '2', plano: 'Growth', mrr: 3800, status: 'cancelado', dataInicio: '2024-10-05', etapaLaboratorio: 'performance', nps: 4, logo: null },
];

export const leads = [
  { id: '1', nome: 'Rafael Duarte', empresa: 'Duarte & Filhos', whatsapp: '11977771001', email: 'rafael@duarte.com.br', origem: 'Instagram', status: 'qualificado', temperatura: 'quente', faturamento: 'R$ 50k-100k', temInstagram: true, temSite: false, investeTrafego: false, score: 85, responsavel: '5', dataEntrada: '2026-05-01', ultimoContato: '2026-05-07', etapaCRM: 'proposta_enviada', valorEstimado: 4500 },
  { id: '2', nome: 'Camila Ferreira', empresa: 'CF Design Interior', whatsapp: '11977772002', email: 'camila@cfdesign.com.br', origem: 'Google', status: 'novo', temperatura: 'morno', faturamento: 'R$ 20k-50k', temInstagram: true, temSite: true, investeTrafego: false, score: 62, responsavel: '5', dataEntrada: '2026-05-03', ultimoContato: '2026-05-05', etapaCRM: 'contato_feito', valorEstimado: 2800 },
  { id: '3', nome: 'André Nascimento', empresa: 'AN Odontologia', whatsapp: '11977773003', email: 'andre@anodonto.com.br', origem: 'Indicação', status: 'qualificado', temperatura: 'quente', faturamento: 'R$ 100k-500k', temInstagram: true, temSite: true, investeTrafego: true, score: 92, responsavel: '5', dataEntrada: '2026-04-28', ultimoContato: '2026-05-08', etapaCRM: 'negociacao', valorEstimado: 7500 },
  { id: '4', nome: 'Beatriz Lopes', empresa: 'BL Moda Feminina', whatsapp: '11977774004', email: 'beatriz@blmoda.com.br', origem: 'Instagram', status: 'novo', temperatura: 'frio', faturamento: 'R$ 10k-20k', temInstagram: true, temSite: false, investeTrafego: false, score: 35, responsavel: '5', dataEntrada: '2026-05-06', ultimoContato: null, etapaCRM: 'novo_lead', valorEstimado: 1500 },
  { id: '5', nome: 'Gustavo Pinheiro', empresa: 'GP Auto Center', whatsapp: '11977775005', email: 'gustavo@gpauto.com.br', origem: 'Google', status: 'qualificado', temperatura: 'morno', faturamento: 'R$ 50k-100k', temInstagram: false, temSite: true, investeTrafego: true, score: 70, responsavel: '5', dataEntrada: '2026-04-20', ultimoContato: '2026-05-04', etapaCRM: 'reuniao_agendada', valorEstimado: 3500 },
  { id: '6', nome: 'Larissa Mendonça', empresa: 'Clínica Dermato+', whatsapp: '11977776006', email: 'larissa@dermatomais.com.br', origem: 'LinkedIn', status: 'qualificado', temperatura: 'quente', faturamento: 'R$ 100k-500k', temInstagram: true, temSite: true, investeTrafego: true, score: 88, responsavel: '5', dataEntrada: '2026-04-25', ultimoContato: '2026-05-07', etapaCRM: 'proposta_enviada', valorEstimado: 6000 },
  { id: '7', nome: 'Thiago Barbosa', empresa: 'TB Construções', whatsapp: '11977777007', email: 'thiago@tbconst.com.br', origem: 'Site', status: 'perdido', temperatura: 'frio', faturamento: 'R$ 500k+', temInstagram: false, temSite: true, investeTrafego: false, score: 45, responsavel: '5', dataEntrada: '2026-04-10', ultimoContato: '2026-04-20', etapaCRM: 'perdido', valorEstimado: 8000 },
  { id: '8', nome: 'Isabela Moreira', empresa: 'Pet Love Banho e Tosa', whatsapp: '11977778008', email: 'isabela@petlove.com.br', origem: 'WhatsApp', status: 'novo', temperatura: 'morno', faturamento: 'R$ 10k-20k', temInstagram: true, temSite: false, investeTrafego: false, score: 55, responsavel: '5', dataEntrada: '2026-05-07', ultimoContato: '2026-05-07', etapaCRM: 'contato_feito', valorEstimado: 2000 },
];

export const proposals = [
  { id: '1', leadId: '1', clienteId: null, nomeCliente: 'Rafael Duarte', empresa: 'Duarte & Filhos', servicos: ['Tráfego Pago Google', 'Gestão de Instagram', 'Google Meu Negócio'], valorTotal: 4500, plano: 'Growth', periodo: 'mensal', status: 'enviada', dataEnvio: '2026-05-05', dataValidade: '2026-05-20' },
  { id: '2', leadId: '6', clienteId: null, nomeCliente: 'Larissa Mendonça', empresa: 'Clínica Dermato+', servicos: ['Tráfego Pago Meta', 'Gestão de Instagram', 'Produção de Conteúdo', 'Criação de Site'], valorTotal: 6000, plano: 'Scale', periodo: 'mensal', status: 'visualizada', dataEnvio: '2026-05-06', dataValidade: '2026-05-21' },
  { id: '3', leadId: '3', clienteId: null, nomeCliente: 'André Nascimento', empresa: 'AN Odontologia', servicos: ['Tráfego Pago Google', 'Tráfego Pago Meta', 'Google Meu Negócio', 'Gestão de Instagram', 'Criação de Site'], valorTotal: 7500, plano: 'Scale', periodo: 'trimestral', status: 'enviada', dataEnvio: '2026-05-08', dataValidade: '2026-05-23' },
  { id: '4', leadId: null, clienteId: '1', nomeCliente: 'Carlos Almeida', empresa: 'Tech Solutions', servicos: ['Implementação de IA', 'Email Marketing'], valorTotal: 3000, plano: 'Custom', periodo: 'mensal', status: 'aprovada', dataEnvio: '2026-04-15', dataValidade: '2026-04-30' },
];

export const projects = [
  { id: '1', clienteId: '1', titulo: 'Campanha Google Ads Q2', status: 'em_andamento', responsavel: '3', prazo: '2026-05-30', prioridade: 'alta', progresso: 65 },
  { id: '2', clienteId: '2', titulo: 'Redesign Instagram', status: 'em_revisao', responsavel: '4', prazo: '2026-05-15', prioridade: 'alta', progresso: 90 },
  { id: '3', clienteId: '7', titulo: 'Landing Page Cardápio Digital', status: 'a_fazer', responsavel: '4', prazo: '2026-06-10', prioridade: 'media', progresso: 0 },
  { id: '4', clienteId: '3', titulo: 'Setup Google Meu Negócio', status: 'concluido', responsavel: '3', prazo: '2026-05-01', prioridade: 'media', progresso: 100 },
  { id: '5', clienteId: '4', titulo: 'Funil de Vendas Meta Ads', status: 'em_andamento', responsavel: '3', prazo: '2026-05-25', prioridade: 'alta', progresso: 40 },
  { id: '6', clienteId: '5', titulo: 'Onboarding Completo', status: 'a_fazer', responsavel: '2', prazo: '2026-05-20', prioridade: 'alta', progresso: 10 },
];

export const tasks = [
  { id: '1', projetoId: '1', clienteId: '1', titulo: 'Configurar campanhas de Search', responsavel: '3', prazo: '2026-05-12', prioridade: 'alta', status: 'em_andamento' },
  { id: '2', projetoId: '1', clienteId: '1', titulo: 'Criar Landing Page de conversão', responsavel: '4', prazo: '2026-05-15', prioridade: 'alta', status: 'a_fazer' },
  { id: '3', projetoId: '2', clienteId: '2', titulo: 'Criar 15 posts para o mês', responsavel: '4', prazo: '2026-05-10', prioridade: 'media', status: 'em_revisao' },
  { id: '4', projetoId: '2', clienteId: '2', titulo: 'Gravar Reels com cliente', responsavel: '6', prazo: '2026-05-12', prioridade: 'media', status: 'a_fazer' },
  { id: '5', projetoId: '5', clienteId: '4', titulo: 'Configurar pixel Meta', responsavel: '3', prazo: '2026-05-10', prioridade: 'alta', status: 'concluido' },
];

export const financials = [
  { id: '1', tipo: 'receita', clienteId: '1', descricao: 'Mensalidade Tech Solutions', valor: 4500, status: 'pago', dataVencimento: '2026-05-10', dataPagamento: '2026-05-08', categoria: 'mensalidade', recorrente: true },
  { id: '2', tipo: 'receita', clienteId: '2', descricao: 'Mensalidade Bella Estética', valor: 7800, status: 'pago', dataVencimento: '2026-05-10', dataPagamento: '2026-05-10', categoria: 'mensalidade', recorrente: true },
  { id: '3', tipo: 'receita', clienteId: '3', descricao: 'Mensalidade Souza Advocacia', valor: 2200, status: 'pendente', dataVencimento: '2026-05-15', dataPagamento: null, categoria: 'mensalidade', recorrente: true },
  { id: '4', tipo: 'receita', clienteId: '4', descricao: 'Mensalidade PG Consultoria', valor: 5000, status: 'pago', dataVencimento: '2026-05-05', dataPagamento: '2026-05-05', categoria: 'mensalidade', recorrente: true },
  { id: '5', tipo: 'receita', clienteId: '7', descricao: 'Mensalidade Sabor & Arte', valor: 6500, status: 'pendente', dataVencimento: '2026-05-20', dataPagamento: null, categoria: 'mensalidade', recorrente: true },
  { id: '6', tipo: 'despesa', clienteId: null, descricao: 'Assinatura Canva Pro', valor: 55, status: 'pago', dataVencimento: '2026-05-01', dataPagamento: '2026-05-01', categoria: 'ferramenta', recorrente: true },
  { id: '7', tipo: 'despesa', clienteId: null, descricao: 'Servidor e Hospedagem', valor: 320, status: 'pago', dataVencimento: '2026-05-05', dataPagamento: '2026-05-05', categoria: 'infraestrutura', recorrente: true },
  { id: '8', tipo: 'despesa', clienteId: null, descricao: 'Meta Ads - Mídia Paga', valor: 8500, status: 'pago', dataVencimento: '2026-05-01', dataPagamento: '2026-05-01', categoria: 'midia', recorrente: true },
];

export const revenueByMonth = [
  { mes: 'Dez', receita: 22000, despesa: 12000 },
  { mes: 'Jan', receita: 25500, despesa: 13000 },
  { mes: 'Fev', receita: 27800, despesa: 12500 },
  { mes: 'Mar', receita: 30200, despesa: 14000 },
  { mes: 'Abr', receita: 32500, despesa: 13800 },
  { mes: 'Mai', receita: 35800, despesa: 15200 },
];

export const leadsByChannel = [
  { canal: 'Instagram', leads: 32 },
  { canal: 'Google', leads: 24 },
  { canal: 'Indicação', leads: 18 },
  { canal: 'LinkedIn', leads: 12 },
  { canal: 'Site', leads: 8 },
  { canal: 'WhatsApp', leads: 15 },
];

export const clientsByStatus = [
  { status: 'Ativo', count: 5, color: '#22C55E' },
  { status: 'Onboarding', count: 1, color: '#3B82F6' },
  { status: 'Pausado', count: 1, color: '#F59E0B' },
  { status: 'Cancelado', count: 1, color: '#EF4444' },
];

export const funnelData = [
  { etapa: 'Leads', valor: 109, pct: 100 },
  { etapa: 'Qualificados', valor: 54, pct: 49 },
  { etapa: 'Proposta', valor: 22, pct: 20 },
  { etapa: 'Fechados', valor: 8, pct: 7 },
];

export const activities = [
  { id: '1', tipo: 'lead', msg: 'Novo lead: Rafael Duarte (Duarte & Filhos)', tempo: '2h atrás', user: 'Pedro Santos' },
  { id: '2', tipo: 'proposta', msg: 'Proposta enviada para Clínica Dermato+', tempo: '3h atrás', user: 'Ana Silva' },
  { id: '3', tipo: 'tarefa', msg: 'Tarefa concluída: Configurar pixel Meta', tempo: '5h atrás', user: 'Lucas Oliveira' },
  { id: '4', tipo: 'cliente', msg: 'Cliente DM Imóveis entrou em Onboarding', tempo: '1 dia atrás', user: 'Ana Silva' },
  { id: '5', tipo: 'financeiro', msg: 'Pagamento recebido: Bella Estética (R$ 7.800)', tempo: '1 dia atrás', user: 'Sistema' },
  { id: '6', tipo: 'proposta', msg: 'Proposta aprovada: Tech Solutions (R$ 3.000)', tempo: '2 dias atrás', user: 'Carlos Almeida' },
];

export const alerts = [
  { id: '1', tipo: 'warning', msg: 'Contrato de Souza Advocacia vence em 15 dias', prioridade: 'media' },
  { id: '2', tipo: 'danger', msg: 'Cliente Fit Power sem contato há 30 dias', prioridade: 'alta' },
  { id: '3', tipo: 'info', msg: 'Meta de leads do mês: 70% atingida', prioridade: 'media' },
  { id: '4', tipo: 'success', msg: 'NPS médio da carteira: 8.2 ⭐', prioridade: 'baixa' },
];

export const crmColumns = [
  { id: 'novo_lead', title: 'Novo Lead', color: '#9CA3AF' },
  { id: 'contato_feito', title: 'Contato Feito', color: '#3B82F6' },
  { id: 'reuniao_agendada', title: 'Reunião Agendada', color: '#8B5CF6' },
  { id: 'proposta_enviada', title: 'Proposta Enviada', color: '#F59E0B' },
  { id: 'negociacao', title: 'Negociação', color: '#FF6B35' },
  { id: 'fechado', title: 'Fechado ✅', color: '#22C55E' },
  { id: 'perdido', title: 'Perdido', color: '#EF4444' },
];

export const services = [
  { id: 'gmb', nome: 'Google Meu Negócio', preco: 500 },
  { id: 'trafego_google', nome: 'Tráfego Pago Google', preco: 1500 },
  { id: 'trafego_meta', nome: 'Tráfego Pago Meta', preco: 1500 },
  { id: 'gestao_instagram', nome: 'Gestão de Instagram', preco: 2000 },
  { id: 'gestao_linkedin', nome: 'Gestão de LinkedIn', preco: 1800 },
  { id: 'conteudo', nome: 'Produção de Conteúdo', preco: 2500 },
  { id: 'site', nome: 'Criação de Site', preco: 3500 },
  { id: 'landing_page', nome: 'Landing Page', preco: 1200 },
  { id: 'email_marketing', nome: 'Email Marketing', preco: 800 },
  { id: 'crm_comercial', nome: 'CRM e Comercial', preco: 1000 },
  { id: 'ia', nome: 'Implementação de IA', preco: 3000 },
  { id: 'branding', nome: 'Branding Completo', preco: 5000 },
];

export const whatsappConversations = [
  { id: '1', numero: '11988881001', nome: 'Carlos Almeida', empresa: 'Tech Solutions', responsavel: '2', status: 'em_atendimento', tags: ['cliente'], ultimaMensagem: 'Oi Ana, tudo bem? Queria ver o relatório de abril.', naoLidas: 0, timestamp: '2026-05-08T10:30:00' },
  { id: '2', numero: '11977771001', nome: 'Rafael Duarte', empresa: 'Duarte & Filhos', responsavel: '5', status: 'aguardando', tags: ['lead'], ultimaMensagem: 'Recebi a proposta, vou analisar com meu sócio.', naoLidas: 1, timestamp: '2026-05-08T09:15:00' },
  { id: '3', numero: '11977773003', nome: 'André Nascimento', empresa: 'AN Odontologia', responsavel: '5', status: 'em_atendimento', tags: ['lead', 'quente'], ultimaMensagem: 'Quando podemos fechar? Quero começar logo!', naoLidas: 2, timestamp: '2026-05-08T11:00:00' },
  { id: '4', numero: '11988887007', nome: 'Marcos Tavares', empresa: 'Sabor & Arte', responsavel: '3', status: 'resolvido', tags: ['cliente'], ultimaMensagem: 'Perfeito, obrigado pela atualização! 👍', naoLidas: 0, timestamp: '2026-05-07T16:45:00' },
];

export const integrations = [
  { id: '1', nome: 'WhatsApp', tipo: 'comunicacao', status: 'conectado', icon: '💬' },
  { id: '2', nome: 'Google Analytics', tipo: 'analytics', status: 'disponivel', icon: '📊' },
  { id: '3', nome: 'Google Ads', tipo: 'ads', status: 'disponivel', icon: '🎯' },
  { id: '4', nome: 'Meta Ads', tipo: 'ads', status: 'disponivel', icon: '📱' },
  { id: '5', nome: 'Google Search Console', tipo: 'seo', status: 'em_breve', icon: '🔍' },
  { id: '6', nome: 'Google Meu Negócio', tipo: 'local', status: 'disponivel', icon: '📍' },
  { id: '7', nome: 'RD Station', tipo: 'crm', status: 'em_breve', icon: '🔄' },
  { id: '8', nome: 'Stripe', tipo: 'financeiro', status: 'disponivel', icon: '💳' },
  { id: '9', nome: 'Google Calendar', tipo: 'agenda', status: 'conectado', icon: '📅' },
  { id: '10', nome: 'OpenAI', tipo: 'ia', status: 'conectado', icon: '🤖' },
  { id: '11', nome: 'Zapier', tipo: 'automacao', status: 'disponivel', icon: '⚡' },
  { id: '12', nome: 'Notion', tipo: 'produtividade', status: 'em_breve', icon: '📝' },
  { id: '13', nome: 'Slack', tipo: 'comunicacao', status: 'em_breve', icon: '💬' },
];
