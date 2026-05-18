// =============================================================
// BANCO DE DADOS LOCAL — Dados Públicos de Negócios Gastronômicos
// Fonte: Google Meu Negócio, iFood, Instagram, Sites Próprios
// =============================================================

const restaurantDatabase = [
  // ── HAMBURGERIAS ──
  { id:'r001', nome:'Burger Lab Premium', categoria:'Hamburgueria', cidade:'São Paulo', uf:'SP', bairro:'Pinheiros',
    google:{ rating:4.6, reviews:1847, fotos:142, horarioCompleto:true, descricaoCompleta:true, postFreq:3, categoriaCorreta:true, endereco:'Rua dos Pinheiros, 412' },
    ifood:{ presente:true, rating:4.7, tempoEntrega:45, qtdItens:38, superRestaurante:true, entregaGratis:false, precoMedio:42 },
    social:{ instagram:'@burgerlab', seguidores:28400, postsSemana:4, engajamento:3.2, temReels:true, destaques:6, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.6, reclamacoes:12, respostaRate:78, tempoResposta:'2d' }
  },
  { id:'r002', nome:'Smash House Burgers', categoria:'Hamburgueria', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Botafogo',
    google:{ rating:4.3, reviews:923, fotos:67, horarioCompleto:true, descricaoCompleta:false, postFreq:1, categoriaCorreta:true, endereco:'Rua Voluntários da Pátria, 190' },
    ifood:{ presente:true, rating:4.4, tempoEntrega:55, qtdItens:22, superRestaurante:false, entregaGratis:false, precoMedio:38 },
    social:{ instagram:'@smashhouse', seguidores:8900, postsSemana:2, engajamento:1.8, temReels:false, destaques:3, bioCompleta:false },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.3, reclamacoes:28, respostaRate:42, tempoResposta:'5d' }
  },
  { id:'r003', nome:'Five Burger Artesanal', categoria:'Hamburgueria', cidade:'Belo Horizonte', uf:'MG', bairro:'Savassi',
    google:{ rating:4.8, reviews:2340, fotos:210, horarioCompleto:true, descricaoCompleta:true, postFreq:5, categoriaCorreta:true, endereco:'Av. Cristóvão Colombo, 812' },
    ifood:{ presente:true, rating:4.9, tempoEntrega:35, qtdItens:45, superRestaurante:true, entregaGratis:true, precoMedio:48 },
    social:{ instagram:'@fiveburger', seguidores:52000, postsSemana:6, engajamento:4.5, temReels:true, destaques:8, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.8, reclamacoes:5, respostaRate:95, tempoResposta:'6h' }
  },
  { id:'r004', nome:'Brutus Burger', categoria:'Hamburgueria', cidade:'Curitiba', uf:'PR', bairro:'Batel',
    google:{ rating:4.1, reviews:456, fotos:34, horarioCompleto:false, descricaoCompleta:false, postFreq:0, categoriaCorreta:true, endereco:'Rua Coronel Dulcídio, 320' },
    ifood:{ presente:true, rating:4.0, tempoEntrega:65, qtdItens:15, superRestaurante:false, entregaGratis:false, precoMedio:32 },
    social:{ instagram:'@brutus.burger', seguidores:3200, postsSemana:1, engajamento:0.9, temReels:false, destaques:1, bioCompleta:false },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.0, reclamacoes:45, respostaRate:20, tempoResposta:'7d' }
  },
  // ── PIZZARIAS ──
  { id:'r005', nome:'Pizzaria Forneria Clássica', categoria:'Pizzaria', cidade:'São Paulo', uf:'SP', bairro:'Moema',
    google:{ rating:4.7, reviews:3120, fotos:189, horarioCompleto:true, descricaoCompleta:true, postFreq:4, categoriaCorreta:true, endereco:'Alameda dos Anapurus, 1200' },
    ifood:{ presente:true, rating:4.8, tempoEntrega:40, qtdItens:62, superRestaurante:true, entregaGratis:false, precoMedio:55 },
    social:{ instagram:'@forneriaclassica', seguidores:41000, postsSemana:5, engajamento:3.8, temReels:true, destaques:7, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.7, reclamacoes:8, respostaRate:90, tempoResposta:'12h' }
  },
  { id:'r006', nome:'Don Raffaele Napolitana', categoria:'Pizzaria', cidade:'Rio de Janeiro', uf:'RJ', bairro:'Leblon',
    google:{ rating:4.5, reviews:1560, fotos:98, horarioCompleto:true, descricaoCompleta:true, postFreq:2, categoriaCorreta:true, endereco:'Rua Dias Ferreira, 78' },
    ifood:{ presente:false, rating:0, tempoEntrega:0, qtdItens:0, superRestaurante:false, entregaGratis:false, precoMedio:0 },
    social:{ instagram:'@donraffaele', seguidores:15600, postsSemana:3, engajamento:2.5, temReels:true, destaques:5, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:false },
    reputacao:{ notaMedia:4.5, reclamacoes:15, respostaRate:70, tempoResposta:'1d' }
  },
  { id:'r007', nome:'Pizza do Zé', categoria:'Pizzaria', cidade:'Campinas', uf:'SP', bairro:'Cambuí',
    google:{ rating:3.9, reviews:320, fotos:18, horarioCompleto:false, descricaoCompleta:false, postFreq:0, categoriaCorreta:false, endereco:'Rua Barreto Leme, 560' },
    ifood:{ presente:true, rating:3.8, tempoEntrega:70, qtdItens:28, superRestaurante:false, entregaGratis:false, precoMedio:30 },
    social:{ instagram:'', seguidores:0, postsSemana:0, engajamento:0, temReels:false, destaques:0, bioCompleta:false },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:3.8, reclamacoes:62, respostaRate:10, tempoResposta:'never' }
  },
  // ── RESTAURANTES ──
  { id:'r008', nome:'Restaurante Villa Gastronômica', categoria:'Restaurante', cidade:'São Paulo', uf:'SP', bairro:'Jardins',
    google:{ rating:4.9, reviews:4200, fotos:320, horarioCompleto:true, descricaoCompleta:true, postFreq:6, categoriaCorreta:true, endereco:'Rua Oscar Freire, 1450' },
    ifood:{ presente:true, rating:4.8, tempoEntrega:50, qtdItens:55, superRestaurante:true, entregaGratis:false, precoMedio:85 },
    social:{ instagram:'@villagastro', seguidores:89000, postsSemana:7, engajamento:5.1, temReels:true, destaques:10, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.9, reclamacoes:3, respostaRate:98, tempoResposta:'2h' }
  },
  { id:'r009', nome:'Cantina da Nonna', categoria:'Restaurante Italiano', cidade:'Porto Alegre', uf:'RS', bairro:'Moinhos de Vento',
    google:{ rating:4.4, reviews:980, fotos:72, horarioCompleto:true, descricaoCompleta:true, postFreq:2, categoriaCorreta:true, endereco:'Rua Padre Chagas, 234' },
    ifood:{ presente:true, rating:4.3, tempoEntrega:55, qtdItens:35, superRestaurante:false, entregaGratis:false, precoMedio:62 },
    social:{ instagram:'@cantinanonna', seguidores:12000, postsSemana:3, engajamento:2.1, temReels:true, destaques:4, bioCompleta:true },
    site:{ temSite:true, temCardapio:false, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.4, reclamacoes:18, respostaRate:65, tempoResposta:'2d' }
  },
  { id:'r010', nome:'Bistrô do Chef', categoria:'Restaurante', cidade:'Florianópolis', uf:'SC', bairro:'Centro',
    google:{ rating:4.2, reviews:540, fotos:45, horarioCompleto:true, descricaoCompleta:false, postFreq:1, categoriaCorreta:true, endereco:'Rua Felipe Schmidt, 890' },
    ifood:{ presente:false, rating:0, tempoEntrega:0, qtdItens:0, superRestaurante:false, entregaGratis:false, precoMedio:0 },
    social:{ instagram:'@bistrodochef', seguidores:5400, postsSemana:1, engajamento:1.4, temReels:false, destaques:2, bioCompleta:false },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.2, reclamacoes:22, respostaRate:50, tempoResposta:'3d' }
  },
  // ── BARES ──
  { id:'r011', nome:'Bar do Alemão Craft', categoria:'Bar', cidade:'São Paulo', uf:'SP', bairro:'Vila Madalena',
    google:{ rating:4.5, reviews:2100, fotos:156, horarioCompleto:true, descricaoCompleta:true, postFreq:3, categoriaCorreta:true, endereco:'Rua Aspicuelta, 480' },
    ifood:{ presente:false, rating:0, tempoEntrega:0, qtdItens:0, superRestaurante:false, entregaGratis:false, precoMedio:0 },
    social:{ instagram:'@bardoalemacraft', seguidores:34000, postsSemana:5, engajamento:3.9, temReels:true, destaques:6, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.5, reclamacoes:10, respostaRate:80, tempoResposta:'1d' }
  },
  { id:'r012', nome:'Espetaria Fogo & Brasa', categoria:'Bar', cidade:'Goiânia', uf:'GO', bairro:'Setor Marista',
    google:{ rating:4.0, reviews:620, fotos:38, horarioCompleto:true, descricaoCompleta:false, postFreq:1, categoriaCorreta:true, endereco:'Av. T-10, 1200' },
    ifood:{ presente:true, rating:4.1, tempoEntrega:50, qtdItens:25, superRestaurante:false, entregaGratis:false, precoMedio:35 },
    social:{ instagram:'@fogoebrasa', seguidores:7800, postsSemana:2, engajamento:1.6, temReels:false, destaques:2, bioCompleta:false },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.0, reclamacoes:35, respostaRate:30, tempoResposta:'5d' }
  },
  // ── CAFETERIAS ──
  { id:'r013', nome:'Café Artesano Premium', categoria:'Cafeteria', cidade:'São Paulo', uf:'SP', bairro:'Itaim Bibi',
    google:{ rating:4.8, reviews:1680, fotos:195, horarioCompleto:true, descricaoCompleta:true, postFreq:5, categoriaCorreta:true, endereco:'Rua Joaquim Floriano, 650' },
    ifood:{ presente:true, rating:4.7, tempoEntrega:30, qtdItens:42, superRestaurante:true, entregaGratis:false, precoMedio:28 },
    social:{ instagram:'@cafeartesano', seguidores:45000, postsSemana:6, engajamento:4.2, temReels:true, destaques:8, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.8, reclamacoes:4, respostaRate:92, tempoResposta:'4h' }
  },
  { id:'r014', nome:'Grão Especial Coffee', categoria:'Cafeteria', cidade:'Curitiba', uf:'PR', bairro:'Centro Cívico',
    google:{ rating:4.3, reviews:410, fotos:52, horarioCompleto:true, descricaoCompleta:true, postFreq:2, categoriaCorreta:true, endereco:'Rua Cândido de Abreu, 120' },
    ifood:{ presente:true, rating:4.2, tempoEntrega:35, qtdItens:30, superRestaurante:false, entregaGratis:false, precoMedio:22 },
    social:{ instagram:'@graoespecial', seguidores:9200, postsSemana:3, engajamento:2.3, temReels:true, destaques:4, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.3, reclamacoes:12, respostaRate:72, tempoResposta:'1d' }
  },
  // ── AÇAITERIAS / SORVETERIAS ──
  { id:'r015', nome:'Açaí da Praça Premium', categoria:'Açaiteria', cidade:'Manaus', uf:'AM', bairro:'Adrianópolis',
    google:{ rating:4.6, reviews:890, fotos:78, horarioCompleto:true, descricaoCompleta:true, postFreq:3, categoriaCorreta:true, endereco:'Av. Mário Ypiranga, 560' },
    ifood:{ presente:true, rating:4.5, tempoEntrega:25, qtdItens:35, superRestaurante:true, entregaGratis:true, precoMedio:25 },
    social:{ instagram:'@acaidapraca', seguidores:22000, postsSemana:5, engajamento:3.5, temReels:true, destaques:5, bioCompleta:true },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.5, reclamacoes:14, respostaRate:68, tempoResposta:'1d' }
  },
  // ── PADARIAS ──
  { id:'r016', nome:'Padaria Artisan Boulangerie', categoria:'Padaria', cidade:'São Paulo', uf:'SP', bairro:'Perdizes',
    google:{ rating:4.7, reviews:2800, fotos:165, horarioCompleto:true, descricaoCompleta:true, postFreq:4, categoriaCorreta:true, endereco:'Rua Turiassu, 780' },
    ifood:{ presente:true, rating:4.6, tempoEntrega:30, qtdItens:80, superRestaurante:true, entregaGratis:false, precoMedio:18 },
    social:{ instagram:'@artisanboulangerie', seguidores:35000, postsSemana:5, engajamento:3.6, temReels:true, destaques:7, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.7, reclamacoes:6, respostaRate:88, tempoResposta:'8h' }
  },
  // ── JAPONESA / SUSHI ──
  { id:'r017', nome:'Sushi Kyo Omakase', categoria:'Restaurante Japonês', cidade:'São Paulo', uf:'SP', bairro:'Liberdade',
    google:{ rating:4.9, reviews:1950, fotos:230, horarioCompleto:true, descricaoCompleta:true, postFreq:4, categoriaCorreta:true, endereco:'Rua da Glória, 320' },
    ifood:{ presente:true, rating:4.8, tempoEntrega:45, qtdItens:52, superRestaurante:true, entregaGratis:false, precoMedio:72 },
    social:{ instagram:'@sushikyo', seguidores:62000, postsSemana:5, engajamento:4.8, temReels:true, destaques:9, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.9, reclamacoes:2, respostaRate:97, tempoResposta:'3h' }
  },
  { id:'r018', nome:'Temaki Express', categoria:'Restaurante Japonês', cidade:'Brasília', uf:'DF', bairro:'Asa Sul',
    google:{ rating:3.8, reviews:290, fotos:22, horarioCompleto:false, descricaoCompleta:false, postFreq:0, categoriaCorreta:true, endereco:'SCLS 210, Bloco C' },
    ifood:{ presente:true, rating:3.9, tempoEntrega:60, qtdItens:18, superRestaurante:false, entregaGratis:false, precoMedio:35 },
    social:{ instagram:'@temakiexp', seguidores:2100, postsSemana:0, engajamento:0.5, temReels:false, destaques:0, bioCompleta:false },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:3.8, reclamacoes:48, respostaRate:15, tempoResposta:'never' }
  },
  // ── CHURRASCARIAS ──
  { id:'r019', nome:'Churrascaria Fogo de Chão Premium', categoria:'Churrascaria', cidade:'Porto Alegre', uf:'RS', bairro:'Moinhos',
    google:{ rating:4.6, reviews:3800, fotos:280, horarioCompleto:true, descricaoCompleta:true, postFreq:3, categoriaCorreta:true, endereco:'Av. Independência, 900' },
    ifood:{ presente:false, rating:0, tempoEntrega:0, qtdItens:0, superRestaurante:false, entregaGratis:false, precoMedio:0 },
    social:{ instagram:'@fogodechaoprm', seguidores:48000, postsSemana:4, engajamento:3.1, temReels:true, destaques:6, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.6, reclamacoes:9, respostaRate:85, tempoResposta:'12h' }
  },
  // ── FOOD TRUCKS ──
  { id:'r020', nome:'Street Food Gourmet Truck', categoria:'Food Truck', cidade:'São Paulo', uf:'SP', bairro:'Itinerante',
    google:{ rating:4.4, reviews:680, fotos:55, horarioCompleto:false, descricaoCompleta:true, postFreq:2, categoriaCorreta:false, endereco:'Vários locais' },
    ifood:{ presente:true, rating:4.3, tempoEntrega:40, qtdItens:12, superRestaurante:false, entregaGratis:false, precoMedio:28 },
    social:{ instagram:'@streetfoodtruck', seguidores:18000, postsSemana:4, engajamento:3.4, temReels:true, destaques:4, bioCompleta:true },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.3, reclamacoes:20, respostaRate:55, tempoResposta:'2d' }
  },
  // ── MAIS HAMBURGERIAS ──
  { id:'r021', nome:'The O.G. Burger Co.', categoria:'Hamburgueria', cidade:'Recife', uf:'PE', bairro:'Boa Viagem',
    google:{ rating:4.5, reviews:1100, fotos:95, horarioCompleto:true, descricaoCompleta:true, postFreq:3, categoriaCorreta:true, endereco:'Av. Boa Viagem, 2300' },
    ifood:{ presente:true, rating:4.6, tempoEntrega:40, qtdItens:30, superRestaurante:true, entregaGratis:false, precoMedio:40 },
    social:{ instagram:'@theogburger', seguidores:21000, postsSemana:4, engajamento:3.0, temReels:true, destaques:5, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.5, reclamacoes:11, respostaRate:75, tempoResposta:'1d' }
  },
  { id:'r022', nome:'Lanches do Tio Beto', categoria:'Hamburgueria', cidade:'Salvador', uf:'BA', bairro:'Barra',
    google:{ rating:3.7, reviews:180, fotos:12, horarioCompleto:false, descricaoCompleta:false, postFreq:0, categoriaCorreta:false, endereco:'Rua Marquês de Caravelas, 45' },
    ifood:{ presente:true, rating:3.6, tempoEntrega:75, qtdItens:10, superRestaurante:false, entregaGratis:false, precoMedio:22 },
    social:{ instagram:'', seguidores:0, postsSemana:0, engajamento:0, temReels:false, destaques:0, bioCompleta:false },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:3.6, reclamacoes:78, respostaRate:5, tempoResposta:'never' }
  },
  // ── MAIS PIZZARIAS ──
  { id:'r023', nome:'Massa Madre Pizzeria', categoria:'Pizzaria', cidade:'Curitiba', uf:'PR', bairro:'Santa Felicidade',
    google:{ rating:4.7, reviews:1450, fotos:130, horarioCompleto:true, descricaoCompleta:true, postFreq:3, categoriaCorreta:true, endereco:'Av. Manoel Ribas, 5500' },
    ifood:{ presente:true, rating:4.6, tempoEntrega:45, qtdItens:48, superRestaurante:true, entregaGratis:false, precoMedio:52 },
    social:{ instagram:'@massamadre', seguidores:27000, postsSemana:4, engajamento:3.3, temReels:true, destaques:6, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:true, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.7, reclamacoes:7, respostaRate:88, tempoResposta:'10h' }
  },
  // ── DOCERIAS / CONFEITARIAS ──
  { id:'r024', nome:'Atelier du Sucre', categoria:'Confeitaria', cidade:'São Paulo', uf:'SP', bairro:'Vila Nova Conceição',
    google:{ rating:4.8, reviews:920, fotos:185, horarioCompleto:true, descricaoCompleta:true, postFreq:5, categoriaCorreta:true, endereco:'Rua Dr. Mário Ferraz, 120' },
    ifood:{ presente:true, rating:4.7, tempoEntrega:35, qtdItens:40, superRestaurante:true, entregaGratis:false, precoMedio:35 },
    social:{ instagram:'@atelierdusucre', seguidores:56000, postsSemana:6, engajamento:5.0, temReels:true, destaques:9, bioCompleta:true },
    site:{ temSite:true, temCardapio:true, temReserva:false, ssl:true, mobile:true },
    reputacao:{ notaMedia:4.8, reclamacoes:3, respostaRate:95, tempoResposta:'4h' }
  },
  // ── MARMITARIA / SELF-SERVICE ──
  { id:'r025', nome:'Sabor & Saúde Fit', categoria:'Marmitaria', cidade:'Goiânia', uf:'GO', bairro:'Setor Bueno',
    google:{ rating:4.2, reviews:380, fotos:28, horarioCompleto:true, descricaoCompleta:false, postFreq:1, categoriaCorreta:true, endereco:'Rua T-55, 890' },
    ifood:{ presente:true, rating:4.3, tempoEntrega:30, qtdItens:22, superRestaurante:false, entregaGratis:true, precoMedio:20 },
    social:{ instagram:'@saboresaudefit', seguidores:6500, postsSemana:3, engajamento:2.0, temReels:true, destaques:3, bioCompleta:true },
    site:{ temSite:false, temCardapio:false, temReserva:false, ssl:false, mobile:false },
    reputacao:{ notaMedia:4.2, reclamacoes:25, respostaRate:45, tempoResposta:'3d' }
  },
];

export default restaurantDatabase;
