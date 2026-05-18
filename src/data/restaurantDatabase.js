// =============================================================
// BANCO DE DADOS LOCAL — Dados Públicos de Negócios Gastronômicos
// Foco: Rio de Janeiro (Capital, Niterói, Baixada Fluminense, Costa Verde)
// =============================================================

const restaurantDatabase = [
  // ── RIO DE JANEIRO (CAPITAL) ──
  { id:'r001', nome:'TT Burger', categoria:'Hamburgueria', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Leblon',
    google:{ rating:4.6, reviews:2847, fotos:242, horarioCompleto:true, descricaoCompleta:true, postFreq:3, categoriaCorreta:true, endereco:'Av. Ataulfo de Paiva, 1240' },
    ifood:{ presente:true, rating:4.7, tempoEntrega:45, qtdItens:38, superRestaurante:true, entregaGratis:false, precoMedio:52 },
    social:{ instagram:'@t.t.burger', seguidores:284000, postsSemana:5, engajamento:3.2, temReels:true, destaques:6, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.6, reclamacoes:22, respostaRate:88, tempoResposta:'1d' }
  },
  { id:'r002', nome:'Oteque', categoria:'Restaurante Contemporâneo', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Botafogo',
    google:{ rating:4.8, reviews:1123, fotos:167, horarioCompleto:true, descricaoCompleta:true, postFreq:2, categoriaCorreta:true, endereco:'Rua Conde de Irajá, 581' },
    ifood:{ presente:false, rating:0, tempoEntrega:0, qtdItens:0, superRestaurante:false, entregaGratis:false, precoMedio:0 },
    social:{ instagram:'@oteque_rj', seguidores:89000, postsSemana:2, engajamento:1.8, temReels:false, destaques:3, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.8, reclamacoes:5, respostaRate:95, tempoResposta:'6h' }
  },
  { id:'r003', nome:'Pizzaria Ferro e Farinha', categoria:'Pizzaria', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Catete',
    google:{ rating:4.7, reviews:2340, fotos:210, horarioCompleto:true, descricaoCompleta:true, postFreq:4, categoriaCorreta:true, endereco:'Rua Andrade Pertince, 42' },
    ifood:{ presente:true, rating:4.8, tempoEntrega:40, qtdItens:25, superRestaurante:true, entregaGratis:false, precoMedio:65 },
    social:{ instagram:'@ferroefarinha', seguidores:52000, postsSemana:4, engajamento:4.5, temReels:true, destaques:8, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.7, reclamacoes:12, respostaRate:90, tempoResposta:'12h' }
  },
  { id:'r004', nome:'Gurumê', categoria:'Restaurante Japonês', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Ipanema',
    google:{ rating:4.7, reviews:3456, fotos:334, horarioCompleto:true, descricaoCompleta:true, postFreq:5, categoriaCorreta:true, endereco:'Rua Aníbal de Mendonça, 132' },
    ifood:{ presente:true, rating:4.8, tempoEntrega:55, qtdItens:85, superRestaurante:true, entregaGratis:false, precoMedio:120 },
    social:{ instagram:'@gurume_oficial', seguidores:150000, postsSemana:6, engajamento:3.9, temReels:true, destaques:10, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.7, reclamacoes:45, respostaRate:85, tempoResposta:'1d' }
  },
  { id:'r005', nome:'Bucaneiros Burger', categoria:'Hamburgueria', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Tijuca',
    google:{ rating:4.5, reviews:1820, fotos:118, horarioCompleto:true, descricaoCompleta:true, postFreq:2, categoriaCorreta:true, endereco:'Rua Major Ávila, 200' },
    ifood:{ presente:true, rating:4.6, tempoEntrega:50, qtdItens:32, superRestaurante:true, entregaGratis:false, precoMedio:45 },
    social:{ instagram:'@bucaneirosburger', seguidores:35000, postsSemana:3, engajamento:2.5, temReels:true, destaques:5, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.5, reclamacoes:18, respostaRate:75, tempoResposta:'2d' }
  },
  { id:'r006', nome:'Mamma Jamma', categoria:'Pizzaria', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Barra da Tijuca',
    google:{ rating:4.6, reviews:4200, fotos:280, horarioCompleto:true, descricaoCompleta:true, postFreq:4, categoriaCorreta:true, endereco:'Av. das Américas, 3900' },
    ifood:{ presente:true, rating:4.7, tempoEntrega:45, qtdItens:60, superRestaurante:true, entregaGratis:false, precoMedio:80 },
    social:{ instagram:'@mammajamma', seguidores:88000, postsSemana:4, engajamento:3.1, temReels:true, destaques:6, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.6, reclamacoes:28, respostaRate:80, tempoResposta:'1d' }
  },
  { id:'r007', nome:'Confeitaria Colombo', categoria:'Cafeteria', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Centro',
    google:{ rating:4.7, reviews:25000, fotos:1500, horarioCompleto:true, descricaoCompleta:true, postFreq:5, categoriaCorreta:true, endereco:'Rua Gonçalves Dias, 32' },
    ifood:{ presente:false, rating:0, tempoEntrega:0, qtdItens:0, superRestaurante:false, entregaGratis:false, precoMedio:0 },
    social:{ instagram:'@confeitariacolombo', seguidores:250000, postsSemana:6, engajamento:4.8, temReels:true, destaques:8, bioCompleta:true },
    site:{ temSite:true, temCardapio:false, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.7, reclamacoes:40, respostaRate:92, tempoResposta:'12h' }
  },
  { id:'r008', nome:'Boteco Belmonte', categoria:'Bar', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Copacabana',
    google:{ rating:4.4, reviews:8900, fotos:450, horarioCompleto:true, descricaoCompleta:true, postFreq:2, categoriaCorreta:true, endereco:'Rua Domingos Ferreira, 232' },
    ifood:{ presente:true, rating:4.3, tempoEntrega:60, qtdItens:45, superRestaurante:false, entregaGratis:false, precoMedio:70 },
    social:{ instagram:'@boteco_belmonte', seguidores:95000, postsSemana:3, engajamento:2.8, temReels:true, destaques:4, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.4, reclamacoes:65, respostaRate:60, tempoResposta:'3d' }
  },

  // ── NITERÓI ──
  { id:'r009', nome:'Nolita Oven & Bar', categoria:'Pizzaria', cidade:'Niterói', uf:'RJ', bairro:'Icaraí',
    google:{ rating:4.6, reviews:1200, fotos:150, horarioCompleto:true, descricaoCompleta:true, postFreq:3, categoriaCorreta:true, endereco:'Rua Joaquim Távora, 140' },
    ifood:{ presente:true, rating:4.7, tempoEntrega:40, qtdItens:35, superRestaurante:true, entregaGratis:false, precoMedio:75 },
    social:{ instagram:'@nolitaovenbar', seguidores:42000, postsSemana:4, engajamento:3.5, temReels:true, destaques:7, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.6, reclamacoes:15, respostaRate:85, tempoResposta:'1d' }
  },
  { id:'r010', nome:'Gruta de Santo Antônio', categoria:'Restaurante Português', cidade:'Niterói', uf:'RJ', bairro:'Centro',
    google:{ rating:4.8, reviews:3500, fotos:320, horarioCompleto:true, descricaoCompleta:true, postFreq:2, categoriaCorreta:true, endereco:'Rua Silva Jardim, 148' },
    ifood:{ presente:true, rating:4.8, tempoEntrega:50, qtdItens:28, superRestaurante:true, entregaGratis:false, precoMedio:150 },
    social:{ instagram:'@grutadesantoantonio', seguidores:38000, postsSemana:2, engajamento:2.2, temReels:false, destaques:3, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.8, reclamacoes:8, respostaRate:90, tempoResposta:'1d' }
  },
  { id:'r011', nome:'Torninha', categoria:'Restaurante Contemporâneo', cidade:'Niterói', uf:'RJ', bairro:'São Francisco',
    google:{ rating:4.5, reviews:850, fotos:95, horarioCompleto:true, descricaoCompleta:true, postFreq:3, categoriaCorreta:true, endereco:'Av. Quintino Bocaiúva, 217' },
    ifood:{ presente:true, rating:4.6, tempoEntrega:45, qtdItens:42, superRestaurante:false, entregaGratis:false, precoMedio:90 },
    social:{ instagram:'@torninhaniteroi', seguidores:21000, postsSemana:3, engajamento:2.8, temReels:true, destaques:5, bioCompleta:true },
    site:{ temSite:true, temCardapio:false, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.5, reclamacoes:12, respostaRate:78, tempoResposta:'2d' }
  },
  { id:'r012', nome:'Cervejaria Noi', categoria:'Bar e Cervejaria', cidade:'Niterói', uf:'RJ', bairro:'São Francisco',
    google:{ rating:4.6, reviews:2100, fotos:180, horarioCompleto:true, descricaoCompleta:true, postFreq:4, categoriaCorreta:true, endereco:'Av. Quintino Bocaiúva, 201' },
    ifood:{ presente:true, rating:4.5, tempoEntrega:55, qtdItens:40, superRestaurante:false, entregaGratis:false, precoMedio:65 },
    social:{ instagram:'@cervejarianoi', seguidores:55000, postsSemana:5, engajamento:3.4, temReels:true, destaques:6, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.6, reclamacoes:18, respostaRate:82, tempoResposta:'1d' }
  },

  // ── BAIXADA FLUMINENSE ──
  { id:'r013', nome:'Kina do Feijão Branco', categoria:'Restaurante', cidade:'Nova Iguaçu', uf:'RJ', bairro:'Centro',
    google:{ rating:4.5, reviews:1420, fotos:85, horarioCompleto:true, descricaoCompleta:false, postFreq:1, categoriaCorreta:true, endereco:'Rua Doutor Thibau, 120' },
    ifood:{ presente:true, rating:4.6, tempoEntrega:40, qtdItens:35, superRestaurante:true, entregaGratis:true, precoMedio:45 },
    social:{ instagram:'@kinadofeijaobranco', seguidores:15000, postsSemana:2, engajamento:1.9, temReels:true, destaques:2, bioCompleta:false },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.5, reclamacoes:25, respostaRate:60, tempoResposta:'3d' }
  },
  { id:'r014', nome:'Gourmet Caxias Hamburgueria', categoria:'Hamburgueria', cidade:'Duque de Caxias', uf:'RJ', bairro:'Jardim Vinte e Cinco de Agosto',
    google:{ rating:4.4, reviews:890, fotos:65, horarioCompleto:true, descricaoCompleta:true, postFreq:3, categoriaCorreta:true, endereco:'Rua Marechal Floriano, 550' },
    ifood:{ presente:true, rating:4.5, tempoEntrega:35, qtdItens:28, superRestaurante:true, entregaGratis:true, precoMedio:35 },
    social:{ instagram:'@gourmetcaxiasburger', seguidores:22000, postsSemana:4, engajamento:3.1, temReels:true, destaques:5, bioCompleta:true },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.4, reclamacoes:14, respostaRate:80, tempoResposta:'1d' }
  },
  { id:'r015', nome:'Brazão Choperia e Restaurante', categoria:'Bar', cidade:'Nilópolis', uf:'RJ', bairro:'Centro',
    google:{ rating:4.3, reviews:650, fotos:45, horarioCompleto:false, descricaoCompleta:false, postFreq:0, categoriaCorreta:true, endereco:'Av. Mirandela, 400' },
    ifood:{ presente:true, rating:4.2, tempoEntrega:50, qtdItens:25, superRestaurante:false, entregaGratis:false, precoMedio:40 },
    social:{ instagram:'@brazaonilopolis', seguidores:8000, postsSemana:1, engajamento:1.2, temReels:false, destaques:1, bioCompleta:false },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.3, reclamacoes:32, respostaRate:40, tempoResposta:'5d' }
  },
  { id:'r016', nome:'Pizzaria Império', categoria:'Pizzaria', cidade:'São João de Meriti', uf:'RJ', bairro:'Centro',
    google:{ rating:4.6, reviews:1100, fotos:78, horarioCompleto:true, descricaoCompleta:true, postFreq:2, categoriaCorreta:true, endereco:'Rua da Matriz, 210' },
    ifood:{ presente:true, rating:4.7, tempoEntrega:45, qtdItens:40, superRestaurante:true, entregaGratis:true, precoMedio:50 },
    social:{ instagram:'@pizzariaimperiosjm', seguidores:18000, postsSemana:3, engajamento:2.6, temReels:true, destaques:4, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.6, reclamacoes:16, respostaRate:70, tempoResposta:'2d' }
  },
  { id:'r017', nome:'Cantina d\'Itália Baixada', categoria:'Restaurante Italiano', cidade:'Nova Iguaçu', uf:'RJ', bairro:'Luz',
    google:{ rating:4.5, reviews:540, fotos:42, horarioCompleto:true, descricaoCompleta:false, postFreq:1, categoriaCorreta:true, endereco:'Via Light, s/n' },
    ifood:{ presente:true, rating:4.4, tempoEntrega:60, qtdItens:32, superRestaurante:false, entregaGratis:false, precoMedio:60 },
    social:{ instagram:'@cantinaitaliani', seguidores:12000, postsSemana:2, engajamento:1.8, temReels:false, destaques:3, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:false },
    reputacao:{ notaMedia:4.5, reclamacoes:20, respostaRate:55, tempoResposta:'3d' }
  },

  // ── COSTA VERDE ──
  { id:'r018', nome:'Margarida Café', categoria:'Restaurante Contemporâneo', cidade:'Paraty', uf:'RJ', bairro:'Centro Histórico',
    google:{ rating:4.6, reviews:3200, fotos:250, horarioCompleto:true, descricaoCompleta:true, postFreq:2, categoriaCorreta:true, endereco:'Praça do Chafariz, s/n' },
    ifood:{ presente:false, rating:0, tempoEntrega:0, qtdItens:0, superRestaurante:false, entregaGratis:false, precoMedio:0 },
    social:{ instagram:'@margaridacafe', seguidores:45000, postsSemana:3, engajamento:2.9, temReels:true, destaques:5, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.6, reclamacoes:10, respostaRate:90, tempoResposta:'1d' }
  },
  { id:'r019', nome:'Banana da Terra', categoria:'Restaurante de Frutos do Mar', cidade:'Paraty', uf:'RJ', bairro:'Centro Histórico',
    google:{ rating:4.7, reviews:2100, fotos:190, horarioCompleto:true, descricaoCompleta:true, postFreq:3, categoriaCorreta:true, endereco:'Rua Dr. Samuel Costa, 198' },
    ifood:{ presente:false, rating:0, tempoEntrega:0, qtdItens:0, superRestaurante:false, entregaGratis:false, precoMedio:0 },
    social:{ instagram:'@restaurantebananadaterra', seguidores:38000, postsSemana:3, engajamento:3.2, temReels:true, destaques:6, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.7, reclamacoes:5, respostaRate:95, tempoResposta:'8h' }
  },
  { id:'r020', nome:'Canto das Sardinhas', categoria:'Restaurante de Frutos do Mar', cidade:'Angra dos Reis', uf:'RJ', bairro:'Camorim',
    google:{ rating:4.5, reviews:950, fotos:85, horarioCompleto:true, descricaoCompleta:false, postFreq:1, categoriaCorreta:true, endereco:'Praia do Camorim Grande' },
    ifood:{ presente:true, rating:4.4, tempoEntrega:50, qtdItens:20, superRestaurante:false, entregaGratis:false, precoMedio:55 },
    social:{ instagram:'@cantodassardinhas', seguidores:14000, postsSemana:2, engajamento:2.1, temReels:false, destaques:2, bioCompleta:false },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.5, reclamacoes:22, respostaRate:60, tempoResposta:'4d' }
  },
  { id:'r021', nome:'Sushiloko', categoria:'Restaurante Japonês', cidade:'Angra dos Reis', uf:'RJ', bairro:'Centro',
    google:{ rating:4.2, reviews:580, fotos:50, horarioCompleto:true, descricaoCompleta:false, postFreq:2, categoriaCorreta:true, endereco:'Rua Coronel Carvalho, 200' },
    ifood:{ presente:true, rating:4.3, tempoEntrega:45, qtdItens:38, superRestaurante:false, entregaGratis:true, precoMedio:45 },
    social:{ instagram:'@sushilokoangra', seguidores:11000, postsSemana:4, engajamento:1.5, temReels:true, destaques:3, bioCompleta:true },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.2, reclamacoes:35, respostaRate:45, tempoResposta:'5d' }
  },
  { id:'r022', nome:'O Barco Pizzaria', categoria:'Pizzaria', cidade:'Mangaratiba', uf:'RJ', bairro:'Itacuruçá',
    google:{ rating:4.6, reviews:720, fotos:65, horarioCompleto:true, descricaoCompleta:true, postFreq:1, categoriaCorreta:true, endereco:'Praça Rui Barbosa, 15' },
    ifood:{ presente:true, rating:4.8, tempoEntrega:40, qtdItens:25, superRestaurante:true, entregaGratis:false, precoMedio:55 },
    social:{ instagram:'@obarcopizzaria', seguidores:9500, postsSemana:2, engajamento:2.4, temReels:true, destaques:4, bioCompleta:true },
    site:{ temSite:true, temCardapio:false, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.6, reclamacoes:8, respostaRate:80, tempoResposta:'1d' }
  },

  // ── MAIS RIO CAPITAL ──
  { id:'r023', nome:'Lilia Restaurante', categoria:'Restaurante Contemporâneo', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Centro',
    google:{ rating:4.8, reviews:1350, fotos:140, horarioCompleto:true, descricaoCompleta:true, postFreq:4, categoriaCorreta:true, endereco:'Rua do Senado, 45' },
    ifood:{ presente:true, rating:4.9, tempoEntrega:45, qtdItens:15, superRestaurante:true, entregaGratis:false, precoMedio:65 },
    social:{ instagram:'@lilia.restaurante', seguidores:65000, postsSemana:5, engajamento:4.1, temReels:true, destaques:6, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.8, reclamacoes:4, respostaRate:95, tempoResposta:'5h' }
  },
  { id:'r024', nome:'Bar da Frente', categoria:'Bar', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Praça da Bandeira',
    google:{ rating:4.6, reviews:2150, fotos:210, horarioCompleto:true, descricaoCompleta:true, postFreq:2, categoriaCorreta:true, endereco:'Rua Barão de Iguatemi, 388' },
    ifood:{ presente:true, rating:4.7, tempoEntrega:50, qtdItens:30, superRestaurante:true, entregaGratis:false, precoMedio:50 },
    social:{ instagram:'@bardafrente', seguidores:48000, postsSemana:3, engajamento:2.7, temReels:true, destaques:4, bioCompleta:true },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.6, reclamacoes:14, respostaRate:85, tempoResposta:'1d' }
  },
  { id:'r025', nome:'Slow Bakery', categoria:'Padaria', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Botafogo',
    google:{ rating:4.8, reviews:3200, fotos:350, horarioCompleto:true, descricaoCompleta:true, postFreq:5, categoriaCorreta:true, endereco:'Rua São João Batista, 93' },
    ifood:{ presente:true, rating:4.8, tempoEntrega:35, qtdItens:45, superRestaurante:true, entregaGratis:false, precoMedio:40 },
    social:{ instagram:'@theslowbakery', seguidores:135000, postsSemana:6, engajamento:4.5, temReels:true, destaques:8, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.8, reclamacoes:6, respostaRate:92, tempoResposta:'6h' }
  }
];

export default restaurantDatabase;
