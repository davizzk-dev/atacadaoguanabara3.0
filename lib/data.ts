import type { Product, Promotion, ProductPromotion } from "./types"
import fs from 'fs/promises'
import path from 'path'

// Logo da loja (altere o caminho ou link para a logo desejada)
export const LOGO_URL = "https://i.ibb.co/fGSnH3hd/logoatacad-o.jpg" // Logo principal da loja

// Foto da entrada da loja (altere o caminho ou link para a foto desejada)
export const ENTRADA_URL = "/imagens/entrada-loja.jpg" // Foto da entrada da loja

export const products = [
  {
    id: "50",
    name: "Água Mineral Naturagua 1,5L",
    price: 2.99,
    originalPrice: 2.30,
    image: "https://i.ibb.co/N65dsgfh/aguanaturagua1-5l.jpg",
    category: "REFIGERANTES E OUTROS LIQUIDOS",
    description: "Água mineral natural de fonte cristalina, rica em minerais essenciais. Ideal para hidratação diária e preparo de bebidas. Garrafa de 1,5 litros com tampa de segurança.",
    stock: 6,
    rating: 4.5,
    reviews: 12,
    brand: "Naturagua",
    unit: "1,5L",
    tags: ["bebida", "água", "mineral"],
  },
  {
    id: "51",
    name: "Água Mineral Naturagua 500ml com Gás",
    price: 1.99,
    originalPrice: 1.44,
    image: "https://i.ibb.co/p6WM3mnK/aguacomg-s.jpg",
    category: "REFIGERANTES E OUTROS LIQUIDOS",
    description: "Água mineral com gás 500ml",
    stock: 12,
    rating: 4.3,
    reviews: 8,
    brand: "Naturagua",
    unit: "500ml",
    tags: ["bebida", "água", "gás"],
  },
  {
    id: "52",
    name: "Água Mineral Naturagua 500ml sem Gás",
    price: 1.49,
    originalPrice: 1.08,
    image: "https://i.ibb.co/4gVp5kbz/aguasemg-s.jpg",
    category: "REFIGERANTES E OUTROS LIQUIDOS",
    description: "Água mineral sem gás 500ml",
    stock: 12,
    rating: 4.4,
    reviews: 15,
    brand: "Naturagua",
    unit: "500ml",
    tags: ["bebida", "água"],
  },
  {
    id: "53",
    name: "Amendoim em Banda Castro 1kg",
    price: 13.99,
    originalPrice: 13.49,
    image: "https://i.ibb.co/PZ9HLZrg/amendoimembanda.jpg",
    category: "MERCEARIA",
    description: "Amendoim em banda tradicional, torrado e salgado. Rico em proteínas e gorduras boas. Perfeito para lanches, festas e receitas. Embalagem de 1kg com amendoins selecionados.",
    stock: 4,
    rating: 4.7,
    reviews: 25,
    brand: "Castro",
    unit: "1kg",
    tags: ["snack", "amendoim", "natural"],
  },
  {
    id: "54",
    name: "Arroz Branco Namorado 1kg",
    price: 5.69,
    originalPrice: 5.29,
    image: "https://i.ibb.co/V0rGtJcP/arroznamorado.jpg",
    category: "MERCEARIA",
    description: "Arroz branco tipo 1 de alta qualidade, grãos selecionados e polidos. Ideal para o dia a dia, soltinho e saboroso. Embalagem de 1kg para toda a família.",
    stock: 10,
    rating: 4.6,
    reviews: 45,
    brand: "Namorado",
    unit: "1kg",
    tags: ["arroz", "básico", "alimento"],
  },
  {
    id: "55",
    name: "Arroz Branco Pai João 1kg",
    price: 5.49,
    originalPrice: 5.39,
    image: "https://i.ibb.co/gbzsG1wc/arrozbrancopaijo-o.jpg",
    category: "MERCEARIA",
    description: "Arroz branco tipo 1 1kg",
    stock: 10,
    rating: 4.5,
    reviews: 38,
    brand: "Pai João",
    unit: "1kg",
    tags: ["arroz", "básico", "alimento"],
  },
  {
    id: "56",
    name: "Arroz Branco Pop 1kg",
    price: 4.99,
    originalPrice: 4.99,
    image: "https://i.ibb.co/8gc360YT/arrozbrancopop.jpg",
    category: "MERCEARIA",
    description: "Arroz branco tipo 1 1kg",
    stock: 10,
    rating: 4.4,
    reviews: 52,
    brand: "Pop",
    unit: "1kg",
    tags: ["arroz", "básico", "alimento"],
  },
  {
    id: "57",
    name: "Arroz Parboilizado Camil 1kg",
    price: 6.29,
    originalPrice: 5.99,
    image: "https://i.ibb.co/V8hkx53/arrozparboilizadocamil.jpg",
    category: "MERCEARIA",
    description: "Arroz parboilizado 1kg",
    stock: 10,
    rating: 4.8,
    reviews: 67,
    brand: "Camil",
    unit: "1kg",
    tags: ["arroz", "parboilizado", "nutritivo"],
  },
  {
    id: "58",
    name: "Arroz Parboilizado Emoções 1kg",
    price: 5.99,
    originalPrice: 5.99,
    image: "https://i.ibb.co/VpqNb9t9/arrozparboilizadoemo-es.jpg",
    category: "MERCEARIA",
    description: "Arroz parboilizado 1kg",
    stock: 10,
    rating: 4.6,
    reviews: 29,
    brand: "Emoções",
    unit: "1kg",
    tags: ["arroz", "parboilizado", "nutritivo"],
  },
  {
    id: "59",
    name: "Arroz Parboilizado Pop 1kg",
    price: 4.50,
    originalPrice: 4.30,
    image: "https://i.ibb.co/vCq3CkSx/arrozparboilizadopop.jpg",
    category: "MERCEARIA",
    description: "Arroz parboilizado 1kg",
    stock: 30,
    rating: 4.5,
    reviews: 41,
    brand: "Pop",
    unit: "1kg",
    tags: ["arroz", "parboilizado", "nutritivo"],
  },
  {
    id: "60",
    name: "Azeite de Oliva Extra Virgem Cocinero 250ml",
    price: 21.49,
    originalPrice: 21.49,
    image: "https://i.ibb.co/KxFd3J1C/azeitedeolivacocinero.jpg",
    category: "MOLHOS",
    description: "Azeite de oliva extra virgem 250ml",
    stock: 5,
    rating: 4.9,
    reviews: 18,
    brand: "Cocinero",
    unit: "250ml",
    tags: ["azeite", "oliva", "extra virgem"],
  },
  {
    id: "61",
    name: "Azeite de Oliva Extra Virgem Cocinero 500ml",
    price: 37.90,
    originalPrice: 36.90,
    image: "https://i.ibb.co/k2hKnsnX/azeitedeolivacocinero500ml.jpg",
    category: "MOLHOS",
    description: "Azeite de oliva extra virgem 500ml",
    stock: 10,
    rating: 4.9,
    reviews: 22,
    brand: "Cocinero",
    unit: "500ml",
    tags: ["azeite", "oliva", "extra virgem"],
  },
  {
    id: "62",
    name: "Azeite Dendê Mariza 200ml",
    price: 7.49,
    originalPrice: 6.49,
    image: "https://i.ibb.co/wZf7nKSB/azeitedendemariza200ml.jpg",
    category: "MOLHOS",
    description: "Azeite de dendê 200ml",
    stock: 12,
    rating: 4.3,
    reviews: 15,
    brand: "Mariza",
    unit: "200ml",
    tags: ["azeite", "dendê", "tradicional"],
  },
  {
    id: "63",
    name: "Bacon em Cubo kg",
    price: 29.90,
    originalPrice: 29.90,
    image: "https://i.ibb.co/pvdqLP9d/baconemcubo.jpg",
    category: "RESFRIADOS",
    description: "Bacon em cubo por kg",
    stock: 8,
    rating: 4.7,
    reviews: 33,
    brand: "Frigorífico",
    unit: "kg",
    tags: ["bacon", "carne", "cubo"],
  },
  {
    id: "64",
    name: "Bacon Manta kg",
    price: 28.90,
    originalPrice: 28.90,
    image: "https://i.ibb.co/vvcYLN4g/baconmantakgjpeg.jpg",
    category: "RESFRIADOS",
    description: "Bacon em manta por kg",
    stock: 6,
    rating: 4.6,
    reviews: 28,
    brand: "Frigorífico",
    unit: "kg",
    tags: ["bacon", "carne", "manta"],
  },
  {
    id: "65",
    name: "Bandeja de Morango",
    price: 9.99,
    originalPrice: 9.49,
    image: "https://i.ibb.co/yBMJSp0t/bandejademorangofresco.jpg",
    category: "RESFRIADOS",
    description: "Bandeja de morango fresco",
    stock: 4,
    rating: 4.8,
    reviews: 19,
    brand: "Frutas Frescas",
    unit: "bandeja",
    tags: ["fruta", "morango", "fresco"],
  },
  {
    id: "66",
    name: "Bandeja de Ovos Brancos com 30 Unidades",
    price: 15.99,
    originalPrice: 15.49,
    image: "https://i.ibb.co/MwJrmqg/bandejadeovosbrancos.jpg",
    category: "RESFRIADOS",
    description: "Bandeja com 30 ovos brancos",
    stock: 10,
    rating: 4.5,
    reviews: 42,
    brand: "Granja",
    unit: "30 un",
    tags: ["ovos", "brancos", "frescos"],
  },
  {
    id: "67",
    name: "Barra de Chocolate Cobertura Confeiteiro Blend Mavalério 1,01kg",
    price: 22.90,
    originalPrice: 22.90,
    image: "https://i.ibb.co/b5f4PzPM/malaveirobarrachocolate.webp",
    category: "CONFEITARIA E OUTROS",
    description: "Barra de chocolate para confeitaria 1,01kg",
    stock: 6,
    rating: 4.9,
    reviews: 31,
    brand: "Mavalério",
    unit: "1,01kg",
    tags: ["chocolate", "confeitaria", "cobertura"],
  },
  {
    id: "68",
    name: "Barra de Chocolate Confeiteiro ao Leite Harald 1,01kg",
    price: 23.90,
    originalPrice: 22.99,
    image: "https://i.ibb.co/FbWBb4mZ/barradechocolateaoleiteharald.webp",
    category: "CONFEITARIA E OUTROS",
    description: "Barra de chocolate ao leite para confeitaria 1,01kg",
    stock: 5,
    rating: 4.8,
    reviews: 27,
    brand: "Harald",
    unit: "1,01kg",
    tags: ["chocolate", "confeitaria", "leite"],
  },
  {
    id: "69",
    name: "Barra de Chocolate Confeiteiro Blend Harald 1,01kg",
    price: 20.99,
    originalPrice: 19.99,
    image: "https://i.ibb.co/FLFp5tB9/barrachocolateharald.webp",
    category: "CONFEITARIA E OUTROS",
    description: "Barra de chocolate blend para confeitaria 1,01kg",
    stock: 5,
    rating: 4.7,
    reviews: 24,
    brand: "Harald",
    unit: "1,01kg",
    tags: ["chocolate", "confeitaria", "blend"],
  },
  {
    id: "70",
    name: "Barra de Chocolate Confeiteiro Chocolate Branco Harald 1,010kg",
    price: 24.99,
    originalPrice: 23.90,
    image: "https://i.ibb.co/G4fH6Zz4/BARRADECHOCOLATEBRANCOHARALD.webp",
    category: "CONFEITARIA E OUTROS",
    description: "Barra de chocolate branco para confeitaria 1,01kg",
    stock: 5,
    rating: 4.6,
    reviews: 21,
    brand: "Harald",
    unit: "1,01kg",
    tags: ["chocolate", "confeitaria", "branco"],
  },
  {
    id: "71",
    name: "Barra de Chocolate Confeiteiro Meio Amargo Harald 1,01kg",
    price: 23.90,
    originalPrice: 22.99,
    image: "https://i.ibb.co/xqX2rkNZ/BARRADECHOCOLATEMEIOAMARGOHARALD.webp",
    category: "CONFEITARIA E OUTROS",
    description: "Barra de chocolate meio amargo para confeitaria 1,01kg",
    stock: 5,
    rating: 4.8,
    reviews: 29,
    brand: "Harald",
    unit: "1,01kg",
    tags: ["chocolate", "confeitaria", "meio amargo"],
  },
  {
    id: "72",
    name: "Batata Bem Brasil Mais Batata 2kg",
    price: 29.90,
    originalPrice: 28.90,
    image: "https://i.ibb.co/C3g2fsXH/BATATABEMBRASIL2-KG.jpg",
    category: "RESFRIADOS",
    description: "Batata especial 2kg",
    stock: 7,
    rating: 4.6,
    reviews: 35,
    brand: "Bem Brasil",
    unit: "2kg",
    tags: ["batata", "hortifruti", "especial"],
  },
  {
    id: "73",
    name: "Batata Palha Água na Boca 140g",
    price: 4.49,
    originalPrice: 3.99,
    image: "https://i.ibb.co/hJc6Wzy5/BATATAPALHAAGUANABOCA.jpg",
    category: "BISCOITOS",
    description: "Batata palha 140g",
    stock: 10,
    rating: 4.4,
    reviews: 18,
    brand: "Água na Boca",
    unit: "140g",
    tags: ["batata", "palha", "snack"],
  },
  {
    id: "74",
    name: "Batata Palha Água na Boca 1kg",
    price: 23.90,
    originalPrice: 23.90,
    image: "https://i.ibb.co/hJc6Wzy5/BATATAPALHAAGUANABOCA.jpg",
    category: "BISCOITOS",
    description: "Batata palha 1kg",
    stock: 5,
    rating: 4.5,
    reviews: 12,
    brand: "Água na Boca",
    unit: "1kg",
    tags: ["batata", "palha", "snack"],
  },
  {
    id: "75",
    name: "Batata Palha Água na Boca 400g",
    price: 9.75,
    originalPrice: 8.99,
    image: "https://i.ibb.co/hJc6Wzy5/BATATAPALHAAGUANABOCA.jpg",
    category: "BISCOITOS",
    description: "Batata palha 400g",
    stock: 10,
    rating: 4.3,
    reviews: 16,
    brand: "Água na Boca",
    unit: "400g",
    tags: ["batata", "palha", "snack"],
  },
  {
    id: "76",
    name: "Batata Palha Feulen 400g Trad",
    price: 15.99,
    originalPrice: 14.99,
    image: "https://i.ibb.co/1fjTMgdd/batatapalhafeulen500g.jpg",
    category: "BISCOITOS",
    description: "Batata palha tradicional 400g",
    stock: 6,
    rating: 4.7,
    reviews: 23,
    brand: "Feulen",
    unit: "400g",
    tags: ["batata", "palha", "tradicional"],
  },
  {
    id: "77",
    name: "Bisnaga Cream Cheese Tradicional Sabor e Vida 1.5kg",
    price: 59.90,
    originalPrice: 57.90,
    image: "https://i.ibb.co/placeholder/cream-cheese-bisnaga.jpg",
    category: "FRIOS Á GRANEL E PACOTES",
    description: "Cream cheese tradicional em bisnaga 1,5kg",
    stock: 4,
    rating: 4.8,
    reviews: 19,
    brand: "Sabor e Vida",
    unit: "1,5kg",
    tags: ["cream cheese", "laticínio", "bisnaga"],
  },
  {
    id: "78",
    name: "Bisnaga Creme de Avelã com Cacau 1,01 kg Bom Princípio",
    price: 39.90,
    originalPrice: 39.90,
    image: "https://i.ibb.co/0pWDmM31/bisnagacremedeavelacomcacaubompricipio1-01kg.webp",
    category: "CONFEITARIA E OUTROS",
    description: "Creme de avelã com cacau em bisnaga 1,01kg",
    stock: 6,
    rating: 4.9,
    reviews: 31,
    brand: "Bom Princípio",
    unit: "1,01kg",
    tags: ["creme", "avelã", "cacau", "chocolate"],
  },
  {
    id: "79",
    name: "Bisnaga de Requeijão Jangada 1,5kg",
    price: 11.99,
    originalPrice: 10.99,
    image: "https://i.ibb.co/placeholder/requeijao-bisnaga.jpg",
    category: "FRIOS Á GRANEL E PACOTES",
    description: "Requeijão em bisnaga 1,5kg",
    stock: 6,
    rating: 4.5,
    reviews: 42,
    brand: "Jangada",
    unit: "1,5kg",
    tags: ["requeijão", "laticínio", "bisnaga"],
  },
  {
    id: "80",
    name: "Feijão Preto Camil 1kg",
    price: 8.99,
    originalPrice: 8.49,
    image: "https://i.ibb.co/nNmVhVZ9/feijaopretocamil1kg.jpg",
    category: "MERCEARIA",
    description: "Feijão preto tipo 1 1kg",
    stock: 15,
    rating: 4.7,
    reviews: 89,
    brand: "Camil",
    unit: "1kg",
    tags: ["feijão", "preto", "básico"],
  },
  {
    id: "81",
    name: "Feijão Carioca Camil 1kg",
    price: 7.99,
    originalPrice: 7.49,
    image: "https://i.ibb.co/cKCwW65J/feijaocamil1kg.jpg",
    category: "MERCEARIA",
    description: "Feijão carioca tipo 1 1kg",
    stock: 20,
    rating: 4.6,
    reviews: 156,
    brand: "Camil",
    unit: "1kg",
    tags: ["feijão", "carioca", "básico"],
  },
  {
    id: "82",
    name: "Açúcar Refinado União 1kg",
    price: 4.99,
    originalPrice: 4.79,
    image: "https://i.ibb.co/Mydd3Pqk/a-ucarrefinadouniao.jpeg",
    category: "MERCEARIA",
    description: "Açúcar refinado 1kg",
    stock: 25,
    rating: 4.5,
    reviews: 203,
    brand: "União",
    unit: "1kg",
    tags: ["açúcar", "refinado", "básico"],
  },
  {
    id: "83",
    name: "Açúcar Cristal União 1kg",
    price: 4.49,
    originalPrice: 4.29,
    image: "https://i.ibb.co/RTymz66W/a-ucarcristaluniao.jpg",
    category: "MERCEARIA",
    description: "Açúcar cristal 1kg",
    stock: 18,
    rating: 4.4,
    reviews: 67,
    brand: "União",
    unit: "1kg",
    tags: ["açúcar", "cristal", "básico"],
  },
  {
    id: "84",
    name: "Leite Integral Itambé 1L",
    price: 5.99,
    originalPrice: 5.79,
    image: "https://i.ibb.co/50gjhC0/leiteintegralitamb.png",
    category: "RESFRIADOS",
    description: "Leite integral 1 litro",
    stock: 30,
    rating: 4.6,
    reviews: 234,
    brand: "Itambé",
    unit: "1L",
    tags: ["leite", "integral", "fresco"],
  },
  {
    id: "85",
    name: "Pão de Forma Wickbold 500g",
    price: 8.99,
    originalPrice: 8.49,
    image: "https://i.ibb.co/placeholder/pao-forma-wickbold.jpg",
    category: "PANIFICAÇÃO",
    description: "Pão de forma tradicional 500g",
    stock: 12,
    rating: 4.5,
    reviews: 89,
    brand: "Wickbold",
    unit: "500g",
    tags: ["pão", "forma", "tradicional"],
  },
  {
    id: "86",
    name: "Macarrão Espaguete Camil 500g",
    price: 3.99,
    originalPrice: 3.79,
    image: "https://i.ibb.co/272Bk8zD/macarraocamilovosespaguete500g.webp",
    category: "MERCEARIA",
    description: "Macarrão espaguete 500g",
    stock: 40,
    rating: 4.4,
    reviews: 156,
    brand: "Camil",
    unit: "500g",
    tags: ["macarrão", "espaguete", "massa"],
  },
  {
    id: "87",
    name: "Macarrão Penne Camil 500g",
    price: 4.29,
    originalPrice: 4.09,
    image: "https://i.ibb.co/placeholder/macarrao-penne-camil.jpg",
    category: "MERCEARIA",
    description: "Macarrão penne 500g",
    stock: 35,
    rating: 4.5,
    reviews: 98,
    brand: "Camil",
    unit: "500g",
    tags: ["macarrão", "penne", "massa"],
  },
  {
    id: "88",
    name: "Prato Descartável 15cm",
    price: 12.99,
    originalPrice: 11.99,
    image: "https://i.ibb.co/placeholder/prato-descartavel-15cm.jpg",
    category: "DESCARTÁVEIS",
    description: "Prato descartável 15cm - 100 unidades",
    stock: 20,
    rating: 4.3,
    reviews: 45,
    brand: "EcoPlast",
    unit: "100 un",
    tags: ["prato", "descartável", "festas"],
  },
  {
    id: "89",
    name: "Copo Descartável 200ml",
    price: 8.99,
    originalPrice: 7.99,
    image: "https://i.ibb.co/placeholder/copo-descartavel-200ml.jpg",
    category: "DESCARTÁVEIS",
    description: "Copo descartável 200ml - 50 unidades",
    stock: 25,
    rating: 4.4,
    reviews: 67,
    brand: "EcoPlast",
    unit: "50 un",
    tags: ["copo", "descartável", "bebidas"],
  },
  {
    id: "90",
    name: "Frango Inteiro kg",
    price: 12.99,
    originalPrice: 12.49,
    image: "https://i.ibb.co/placeholder/frango-inteiro-kg.jpg",
    category: "RESFRIADOS",
    description: "Frango inteiro por kg",
    stock: 10,
    rating: 4.6,
    reviews: 123,
    brand: "Frigorífico",
    unit: "kg",
    tags: ["frango", "inteiro", "carne"],
  },
  {
    id: "91",
    name: "Carne Moída kg",
    price: 24.99,
    originalPrice: 24.49,
    image: "https://i.ibb.co/placeholder/carne-moida-kg.jpg",
    category: "RESFRIADOS",
    description: "Carne moída por kg",
    stock: 8,
    rating: 4.7,
    reviews: 89,
    brand: "Frigorífico",
    unit: "kg",
    tags: ["carne", "moída", "bovina"],
  },
  {
    id: "92",
    name: "Detergente Líquido Ypê 500ml",
    price: 4.99,
    originalPrice: 4.79,
    image: "https://i.ibb.co/placeholder/detergente-liquido-ype.jpg",
    category: "PRODUTOS DE LIMPEZA",
    description: "Detergente líquido 500ml",
    stock: 25,
    rating: 4.5,
    reviews: 234,
    brand: "Ypê",
    unit: "500ml",
    tags: ["detergente", "líquido", "limpeza"],
  },
  {
    id: "93",
    name: "Sabão em Pó Omo 1kg",
    price: 12.99,
    originalPrice: 12.49,
    image: "https://i.ibb.co/placeholder/sabao-em-po-omo.jpg",
    category: "PRODUTOS DE LIMPEZA",
    description: "Sabão em pó 1kg",
    stock: 15,
    rating: 4.6,
    reviews: 167,
    brand: "Omo",
    unit: "1kg",
    tags: ["sabão", "pó", "limpeza"],
  },
  {
    id: "94",
    name: "Shampoo Head & Shoulders 400ml",
    price: 18.99,
    originalPrice: 18.49,
    image: "https://i.ibb.co/placeholder/shampoo-head-shoulders.jpg",
    category: "CONFEITARIA E OUTROS",
    description: "Shampoo anticaspa 400ml",
    stock: 12,
    rating: 4.7,
    reviews: 89,
    brand: "Head & Shoulders",
    unit: "400ml",
    tags: ["shampoo", "anticaspa", "cabelo"],
  },
  {
    id: "95",
    name: "Pasta de Dente Colgate 90g",
    price: 3.99,
    originalPrice: 3.79,
    image: "https://i.ibb.co/placeholder/pasta-dente-colgate.jpg",
    category: "CONFEITARIA E OUTROS",
    description: "Pasta de dente 90g",
    stock: 30,
    rating: 4.6,
    reviews: 189,
    brand: "Colgate",
    unit: "90g",
    tags: ["pasta", "dente", "higiene"],
  },
  {
    id: "96",
    name: "Sal Refinado Cisne 1kg",
    price: 2.99,
    originalPrice: 2.79,
    image: "https://i.ibb.co/placeholder/sal-refinado-cisne.jpg",
    category: "TEMPEROS",
    description: "Sal refinado 1kg",
    stock: 40,
    rating: 4.5,
    reviews: 156,
    brand: "Cisne",
    unit: "1kg",
    tags: ["sal", "refinado", "tempero"],
  },
  {
    id: "97",
    name: "Pimenta do Reino Moída 100g",
    price: 4.99,
    originalPrice: 4.49,
    image: "https://i.ibb.co/placeholder/pimenta-reino-moida.jpg",
    category: "TEMPEROS",
    description: "Pimenta do reino moída 100g",
    stock: 20,
    rating: 4.7,
    reviews: 78,
    brand: "Kitano",
    unit: "100g",
    tags: ["pimenta", "reino", "tempero"],
  },
  {
    id: "98",
    name: "Atum em Conserva Gomes da Costa 170g",
    price: 8.99,
    originalPrice: 8.49,
    image: "https://i.ibb.co/placeholder/atum-conserva-gomes.jpg",
    category: "ENLATADOS E EM CONSERVA",
    description: "Atum em conserva 170g",
    stock: 15,
    rating: 4.6,
    reviews: 92,
    brand: "Gomes da Costa",
    unit: "170g",
    tags: ["atum", "conserva", "proteína"],
  },
  {
    id: "99",
    name: "Sardinha em Conserva Gomes da Costa 125g",
    price: 4.99,
    originalPrice: 4.49,
    image: "https://i.ibb.co/placeholder/sardinha-conserva-gomes.jpg",
    category: "ENLATADOS E EM CONSERVA",
    description: "Sardinha em conserva 125g",
    stock: 25,
    rating: 4.4,
    reviews: 67,
    brand: "Gomes da Costa",
    unit: "125g",
    tags: ["sardinha", "conserva", "peixe"],
  },
  {
    id: "100",
    name: "Biscoito Recheado Trakinas 130g",
    price: 3.99,
    originalPrice: 3.49,
    image: "https://i.ibb.co/placeholder/biscoito-trakinas.jpg",
    category: "BISCOITOS",
    description: "Biscoito recheado 130g",
    stock: 30,
    rating: 4.5,
    reviews: 134,
    brand: "Trakinas",
    unit: "130g",
    tags: ["biscoito", "recheado", "snack"],
  },
  {
    id: "101",
    name: "Biscoito Cream Cracker Nestlé 200g",
    price: 4.99,
    originalPrice: 4.49,
    image: "https://i.ibb.co/placeholder/biscoito-cream-cracker.jpg",
    category: "BISCOITOS",
    description: "Biscoito cream cracker 200g",
    stock: 25,
    rating: 4.6,
    reviews: 89,
    brand: "Nestlé",
    unit: "200g",
    tags: ["biscoito", "cream cracker", "salgado"],
  },
  {
    id: "102",
    name: "Queijo Mussarela Fatiado kg",
    price: 32.99,
    originalPrice: 31.99,
    image: "https://i.ibb.co/placeholder/queijo-mussarela-fatiado.jpg",
    category: "FRIOS Á GRANEL E PACOTES",
    description: "Queijo mussarela fatiado por kg",
    stock: 8,
    rating: 4.7,
    reviews: 156,
    brand: "Laticínio",
    unit: "kg",
    tags: ["queijo", "mussarela", "fatiado"],
  },
  {
    id: "103",
    name: "Presunto Fatiado kg",
    price: 28.99,
    originalPrice: 27.99,
    image: "https://i.ibb.co/placeholder/presunto-fatiado.jpg",
    category: "FRIOS Á GRANEL E PACOTES",
    description: "Presunto fatiado por kg",
    stock: 10,
    rating: 4.5,
    reviews: 98,
    brand: "Frigorífico",
    unit: "kg",
    tags: ["presunto", "fatiado", "frios"],
  },
  {
    id: "104",
    name: "Sorvete Napolitano Kibon 2L",
    price: 18.99,
    originalPrice: 17.99,
    image: "https://i.ibb.co/placeholder/sorvete-napolitano-kibon.jpg",
    category: "CONGELADOS",
    description: "Sorvete napolitano 2 litros",
    stock: 12,
    rating: 4.8,
    reviews: 234,
    brand: "Kibon",
    unit: "2L",
    tags: ["sorvete", "napolitano", "sobremesa"],
  },
  {
    id: "105",
    name: "Pizza Congelada Sadia 4 Queijos 500g",
    price: 15.99,
    originalPrice: 14.99,
    image: "https://i.ibb.co/placeholder/pizza-congelada-sadia.jpg",
    category: "CONGELADOS",
    description: "Pizza congelada 4 queijos 500g",
    stock: 8,
    rating: 4.4,
    reviews: 67,
    brand: "Sadia",
    unit: "500g",
    tags: ["pizza", "congelada", "4 queijos"],
  },
  {
    id: "106",
    name: "Coca-Cola 2L",
    price: 8.99,
    originalPrice: 8.49,
    image: "https://i.ibb.co/placeholder/coca-cola-2l.jpg",
    category: "REFIGERANTES E OUTROS LIQUIDOS",
    description: "Refrigerante Coca-Cola 2 litros",
    stock: 150,
    rating: 4.9,
    reviews: 456,
    brand: "Coca-Cola",
    unit: "2L",
    tags: ["refrigerante", "cola", "bebida"],
  },
  {
    id: "107",
    name: "Biscoito Nesfit Integral 170g",
    price: 3.9,
    originalPrice: 4.9,
    image: "https://images.unsplash.com/photo-1619983081563-430f8b5a893c?auto=format&fit=crop&w=400&q=80",
    category: "BISCOITOS",
    description: "Biscoito integral Nesfit 170g",
    stock: 60,
    rating: 4.6,
    reviews: 92,
    brand: "Nestlé",
    unit: "170g",
    tags: ["biscoito", "integral", "snack"],
  },
  {
    id: "108",
    name: "Sushi Califórnia 8 Unidades",
    price: 24.99,
    originalPrice: 22.99,
    image: "https://i.ibb.co/placeholder/sushi-california.jpg",
    category: "SUSHITERIA",
    description: "Sushi Califórnia 8 unidades",
    stock: 6,
    rating: 4.8,
    reviews: 45,
    brand: "Sushi Express",
    unit: "8 un",
    tags: ["sushi", "califórnia", "japonês"],
  },
  {
    id: "109",
    name: "Sushi Salmão 6 Unidades",
    price: 28.99,
    originalPrice: 26.99,
    image: "https://i.ibb.co/placeholder/sushi-salmao.jpg",
    category: "SUSHITERIA",
    description: "Sushi de salmão 6 unidades",
    stock: 4,
    rating: 4.9,
    reviews: 38,
    brand: "Sushi Express",
    unit: "6 un",
    tags: ["sushi", "salmão", "japonês"],
  },
]

export const categories = [
  "Todos",
  "DESCARTÁVEIS",
  "CONFEITARIA E OUTROS",
  "PANIFICAÇÃO",
  "MOLHOS",
  "SUSHITERIA",
  "PRODUTOS DE LIMPEZA",
  "TEMPEROS",
  "ENLATADOS E EM CONSERVA",
  "BISCOITOS",
  "MERCEARIA",
  "FRIOS Á GRANEL E PACOTES",
  "RESFRIADOS",
  "CONGELADOS",
  "REFRIGERANTES E OUTROS LIQUIDOS",
]

export const promotions: Promotion[] = [
  {
    id: "1",
    title: "Super Oferta de Grãos",
    description: "Até 30% OFF em arroz, feijão e cereais",
    discount: 30,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    image: "/placeholder.svg?height=200&width=400",
    isActive: true,
  },
  {
    id: "2",
    title: "Combo Café da Manhã",
    description: "Pão + Leite + Café com desconto especial",
    discount: 25,
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    image: "/placeholder.svg?height=200&width=400",
    isActive: true,
  },
  {
    id: "3",
    title: "Limpeza Total",
    description: "Produtos de limpeza com até 40% OFF",
    discount: 40,
    validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    image: "/placeholder.svg?height=200&width=400",
    isActive: true,
  },
]

export const productPromotions: ProductPromotion[] = [
  {
    id: "1",
    productId: "50",
    productName: "ÁGUA MINERAL NATURAGUA 1,5L",
    originalPrice: 2.30,
    newPrice: 1.99,
    discount: 13,
    image: "https://i.ibb.co/N65dsgfh/aguanaturagua1-5l.jpg",
    isActive: true,
    createdAt: new Date(),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    productId: "53",
    productName: "AMENDOIM EM BANDA CASTRO 1KG",
    originalPrice: 13.49,
    newPrice: 11.99,
    discount: 11,
    image: "https://i.ibb.co/PZ9HLZrg/amendoimembanda.jpg",
    isActive: true,
    createdAt: new Date(),
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
]

// Caminho para o arquivo products.json
const productsFilePath = path.join(process.cwd(), 'data', 'products.json')

// Função para garantir que o arquivo products.json existe
const ensureFileExists = async () => {
  try {
    await fs.access(productsFilePath)
  } catch (error) {
    // Se o arquivo não existe, criar com array vazio
    await fs.writeFile(productsFilePath, JSON.stringify([], null, 2))
  }
}

export const saveProductToFile = async (product: any) => {
  try {
    // Garantir que o arquivo existe
    await ensureFileExists()
    
    // Ler produtos existentes
    const productsData = await fs.readFile(productsFilePath, 'utf8')
    let products = []
    
    try {
      products = JSON.parse(productsData)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON, criando array vazio:', parseError)
      products = []
    }
    
    // Verificar se o ID já existe
    if (product.id && products.some((p: any) => p.id === product.id)) {
      return { success: false, message: 'ID já existe. Escolha outro ID.' }
    }
    
    // Se o produto não tem ID, gerar automaticamente
    if (!product.id) {
      const maxId = Math.max(...products.map((p: any) => parseInt(p.id) || 0), 0)
      product.id = (maxId + 1).toString()
    }
    
    // Adicionar novo produto
    products.push(product)
    
    // Salvar no products.json
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2))
    
    return { success: true, message: 'Produto salvo com sucesso!', product }
  } catch (error) {
    console.error('Erro ao salvar produto:', error)
    return { success: false, message: `Erro ao salvar produto: ${error}` }
  }
}

export const updateProductInFile = async (productId: string, updatedProduct: any) => {
  try {
    // Garantir que o arquivo existe
    await ensureFileExists()
    
    // Ler produtos existentes
    const productsData = await fs.readFile(productsFilePath, 'utf8')
    let products = []
    
    try {
      products = JSON.parse(productsData)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError)
      return { success: false, message: 'Arquivo de produtos corrompido' }
    }
    
    // Encontrar e atualizar produto
    const productIndex = products.findIndex((p: any) => p.id === productId)
    if (productIndex === -1) {
      return { success: false, message: 'Produto não encontrado' }
    }
    
    // Preservar o ID original
    products[productIndex] = { 
      ...products[productIndex], 
      ...updatedProduct,
      id: productId // Garantir que o ID não seja alterado
    }
    
    // Salvar no products.json
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2))
    
    return { success: true, message: 'Produto atualizado com sucesso!' }
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return { success: false, message: `Erro ao atualizar produto: ${error}` }
  }
}

export const deleteProductFromFile = async (productId: string) => {
  try {
    // Garantir que o arquivo existe
    await ensureFileExists()
    
    // Ler produtos existentes
    const productsData = await fs.readFile(productsFilePath, 'utf8')
    let products = []
    
    try {
      products = JSON.parse(productsData)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError)
      return { success: false, message: 'Arquivo de produtos corrompido' }
    }
    
    // Encontrar e remover produto
    const productIndex = products.findIndex((p: any) => p.id === productId)
    if (productIndex === -1) {
      return { success: false, message: 'Produto não encontrado' }
    }
    
    products.splice(productIndex, 1)
    
    // Salvar no products.json
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2))
    
    return { success: true, message: 'Produto deletado com sucesso!' }
  } catch (error) {
    console.error('Erro ao deletar produto:', error)
    return { success: false, message: `Erro ao deletar produto: ${error}` }
  }
}

export const getAllProductsFromFile = async () => {
  try {
    await ensureFileExists()
    const productsData = await fs.readFile(productsFilePath, 'utf8')
    return JSON.parse(productsData)
  } catch (error) {
    console.error('Erro ao ler produtos do arquivo:', error)
    return []
  }
}

export const syncProductsToFile = async () => {
  try {
    // Sincronizar produtos padrão do data.ts para o products.json
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2))
    return { success: true, message: 'Produtos sincronizados com sucesso!' }
  } catch (error) {
    console.error('Erro ao sincronizar produtos:', error)
    return { success: false, message: `Erro ao sincronizar produtos: ${error}` }
  }
}
