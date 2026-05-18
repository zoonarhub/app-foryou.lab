// =============================================================
// ENGINE DE ANÁLISE — Avaliador de Restaurante foryou.lab
// Calcula scores de 0-100 em 6 pilares de presença digital
// =============================================================

export const PILARES = [
  { id: 'visibilidade', label: 'Visibilidade Local', icon: '📍', desc: 'Google Meu Negócio: perfil, fotos, avaliações e presença no Maps.' },
  { id: 'competitividade', label: 'Competitividade Google', icon: '🔍', desc: 'Posicionamento, SEO local, volume de reviews e nota.' },
  { id: 'delivery', label: 'iFood & Delivery', icon: '🛵', desc: 'Presença em apps, tempo de entrega, cardápio e selo.' },
  { id: 'reputacao', label: 'Reputação Online', icon: '⭐', desc: 'Notas, reclamações, taxa e velocidade de resposta.' },
  { id: 'cardapio', label: 'Cardápio & Site', icon: '🍽️', desc: 'Site próprio, cardápio digital, reservas e segurança.' },
  { id: 'social', label: 'Social & Branding', icon: '📱', desc: 'Instagram, frequência de posts, engajamento e Reels.' },
];

function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(v))); }

export function analisarRestaurante(r) {
  const scores = {};

  // 1. VISIBILIDADE LOCAL (Google My Business presence)
  let vis = 0;
  if (r.google.rating >= 4.5) vis += 25; else if (r.google.rating >= 4.0) vis += 18; else if (r.google.rating >= 3.5) vis += 10; else vis += 5;
  if (r.google.reviews >= 2000) vis += 25; else if (r.google.reviews >= 1000) vis += 20; else if (r.google.reviews >= 500) vis += 15; else if (r.google.reviews >= 100) vis += 8; else vis += 3;
  if (r.google.fotos >= 100) vis += 20; else if (r.google.fotos >= 50) vis += 14; else if (r.google.fotos >= 20) vis += 8; else vis += 3;
  if (r.google.horarioCompleto) vis += 10;
  if (r.google.descricaoCompleta) vis += 10;
  if (r.google.categoriaCorreta) vis += 10;
  scores.visibilidade = clamp(vis);

  // 2. COMPETITIVIDADE GOOGLE
  let comp = 0;
  if (r.google.rating >= 4.7) comp += 30; else if (r.google.rating >= 4.3) comp += 22; else if (r.google.rating >= 4.0) comp += 15; else comp += 5;
  if (r.google.reviews >= 3000) comp += 25; else if (r.google.reviews >= 1500) comp += 20; else if (r.google.reviews >= 500) comp += 12; else comp += 5;
  if (r.google.postFreq >= 4) comp += 20; else if (r.google.postFreq >= 2) comp += 12; else if (r.google.postFreq >= 1) comp += 6; else comp += 0;
  if (r.google.fotos >= 150) comp += 15; else if (r.google.fotos >= 80) comp += 10; else if (r.google.fotos >= 30) comp += 6; else comp += 2;
  if (r.google.descricaoCompleta) comp += 10;
  scores.competitividade = clamp(comp);

  // 3. IFOOD & DELIVERY
  let del = 0;
  if (!r.ifood.presente) { del = 8; } else {
    if (r.ifood.rating >= 4.7) del += 20; else if (r.ifood.rating >= 4.3) del += 15; else if (r.ifood.rating >= 4.0) del += 10; else del += 5;
    if (r.ifood.tempoEntrega <= 30) del += 20; else if (r.ifood.tempoEntrega <= 45) del += 15; else if (r.ifood.tempoEntrega <= 60) del += 8; else del += 3;
    if (r.ifood.qtdItens >= 40) del += 15; else if (r.ifood.qtdItens >= 25) del += 10; else if (r.ifood.qtdItens >= 15) del += 6; else del += 2;
    if (r.ifood.superRestaurante) del += 20;
    if (r.ifood.entregaGratis) del += 10;
    del += 15; // bonus por estar presente
  }
  scores.delivery = clamp(del);

  // 4. REPUTAÇÃO ONLINE
  let rep = 0;
  if (r.reputacao.notaMedia >= 4.7) rep += 30; else if (r.reputacao.notaMedia >= 4.3) rep += 22; else if (r.reputacao.notaMedia >= 4.0) rep += 15; else rep += 5;
  if (r.reputacao.reclamacoes <= 5) rep += 25; else if (r.reputacao.reclamacoes <= 15) rep += 18; else if (r.reputacao.reclamacoes <= 30) rep += 10; else rep += 3;
  if (r.reputacao.respostaRate >= 90) rep += 25; else if (r.reputacao.respostaRate >= 70) rep += 18; else if (r.reputacao.respostaRate >= 40) rep += 10; else rep += 3;
  const trMap = { '2h': 20, '3h': 18, '4h': 17, '6h': 15, '8h': 13, '10h': 12, '12h': 10, '1d': 8, '2d': 5, '3d': 3, '5d': 2, '7d': 1, 'never': 0 };
  rep += trMap[r.reputacao.tempoResposta] || 0;
  scores.reputacao = clamp(rep);

  // 5. CARDÁPIO & SITE
  let card = 0;
  if (r.site.temSite) card += 25; else card += 0;
  if (r.site.temCardapio) card += 25;
  if (r.site.temReserva) card += 20;
  if (r.site.ssl) card += 15;
  if (r.site.mobile) card += 15;
  scores.cardapio = clamp(card);

  // 6. SOCIAL & BRANDING
  let soc = 0;
  if (!r.social.instagram) { soc = 5; } else {
    if (r.social.seguidores >= 50000) soc += 20; else if (r.social.seguidores >= 20000) soc += 15; else if (r.social.seguidores >= 10000) soc += 10; else if (r.social.seguidores >= 3000) soc += 6; else soc += 3;
    if (r.social.postsSemana >= 5) soc += 20; else if (r.social.postsSemana >= 3) soc += 14; else if (r.social.postsSemana >= 1) soc += 7; else soc += 0;
    if (r.social.engajamento >= 4) soc += 20; else if (r.social.engajamento >= 2.5) soc += 14; else if (r.social.engajamento >= 1.5) soc += 8; else soc += 3;
    if (r.social.temReels) soc += 15;
    if (r.social.destaques >= 5) soc += 10; else if (r.social.destaques >= 2) soc += 5;
    if (r.social.bioCompleta) soc += 10;
    soc += 5; // bonus presença
  }
  scores.social = clamp(soc);

  const scoreGeral = clamp(Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 6));

  // Quick Wins automáticos
  const quickWins = [];
  if (!r.google.descricaoCompleta) quickWins.push({ pilar: 'Visibilidade', acao: 'Complete a descrição do Google Meu Negócio com palavras-chave do nicho.', impacto: 'alto' });
  if (!r.google.horarioCompleto) quickWins.push({ pilar: 'Visibilidade', acao: 'Atualize os horários de funcionamento no Google Maps.', impacto: 'medio' });
  if (!r.google.categoriaCorreta) quickWins.push({ pilar: 'Visibilidade', acao: 'Corrija a categoria principal do seu perfil no Google.', impacto: 'alto' });
  if (r.google.fotos < 50) quickWins.push({ pilar: 'Competitividade', acao: `Adicione mais fotos profissionais (atual: ${r.google.fotos}). Ideal: 100+.`, impacto: 'alto' });
  if (r.google.postFreq < 2) quickWins.push({ pilar: 'Competitividade', acao: 'Publique atualizações semanais no Google Meu Negócio.', impacto: 'medio' });
  if (r.google.reviews < 500) quickWins.push({ pilar: 'Competitividade', acao: `Incentive avaliações dos clientes (atual: ${r.google.reviews}). Ideal: 500+.`, impacto: 'alto' });
  if (!r.ifood.presente) quickWins.push({ pilar: 'Delivery', acao: 'Cadastre-se no iFood para capturar o público de delivery.', impacto: 'alto' });
  if (r.ifood.presente && r.ifood.tempoEntrega > 50) quickWins.push({ pilar: 'Delivery', acao: `Reduza o tempo de entrega (atual: ${r.ifood.tempoEntrega}min). Ideal: <40min.`, impacto: 'alto' });
  if (r.ifood.presente && !r.ifood.superRestaurante) quickWins.push({ pilar: 'Delivery', acao: 'Conquiste o selo Super Restaurante no iFood para maior visibilidade.', impacto: 'medio' });
  if (r.reputacao.respostaRate < 70) quickWins.push({ pilar: 'Reputação', acao: `Aumente a taxa de resposta (atual: ${r.reputacao.respostaRate}%). Ideal: 90%+.`, impacto: 'alto' });
  if (r.reputacao.reclamacoes > 20) quickWins.push({ pilar: 'Reputação', acao: `Reduza reclamações ativas (atual: ${r.reputacao.reclamacoes}). Ideal: <10.`, impacto: 'alto' });
  if (!r.site.temSite) quickWins.push({ pilar: 'Cardápio', acao: 'Crie um site próprio com cardápio digital e informações do negócio.', impacto: 'alto' });
  if (r.site.temSite && !r.site.ssl) quickWins.push({ pilar: 'Cardápio', acao: 'Ative certificado SSL (HTTPS) no seu site para segurança.', impacto: 'medio' });
  if (r.site.temSite && !r.site.mobile) quickWins.push({ pilar: 'Cardápio', acao: 'Otimize seu site para dispositivos móveis (responsivo).', impacto: 'alto' });
  if (!r.site.temReserva) quickWins.push({ pilar: 'Cardápio', acao: 'Implemente sistema de reservas online no seu site/perfil.', impacto: 'medio' });
  if (!r.social.instagram) quickWins.push({ pilar: 'Social', acao: 'Crie um perfil profissional no Instagram com bio completa.', impacto: 'alto' });
  if (r.social.instagram && r.social.postsSemana < 3) quickWins.push({ pilar: 'Social', acao: `Aumente a frequência de posts (atual: ${r.social.postsSemana}/sem). Ideal: 5+.`, impacto: 'medio' });
  if (r.social.instagram && !r.social.temReels) quickWins.push({ pilar: 'Social', acao: 'Publique Reels regularmente para aumentar alcance orgânico.', impacto: 'alto' });
  if (r.social.instagram && r.social.engajamento < 2) quickWins.push({ pilar: 'Social', acao: `Melhore o engajamento (atual: ${r.social.engajamento}%). Use CTA nos posts.`, impacto: 'medio' });

  return {
    scores,
    scoreGeral,
    quickWins: quickWins.sort((a, b) => (a.impacto === 'alto' ? -1 : 1) - (b.impacto === 'alto' ? -1 : 1)).slice(0, 8),
    restaurante: { nome: r.nome, categoria: r.categoria, cidade: r.cidade, uf: r.uf, bairro: r.bairro }
  };
}
