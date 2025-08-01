// Configuração das imagens das categorias
export const categoryImages = {
  "Todos": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=200&q=80",
  "DESCARTÁVEIS": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80",
  "CONFEITARIA E OUTROS": "https://i.ibb.co/Kc8Khndg/confeitaria2-0.png",
  "PANIFICAÇÃO": "https://i.ibb.co/v4G6SKWp/panifica-o.png",
  "MOLHOS": "https://i.ibb.co/tpKXVpvM/molhos.png",
  "SUSHITERIA": "https://i.ibb.co/5x59QGMf/Sem-nome-1020-x-1020-px-200-x-200-px.pngs",
  "PRODUTOS DE LIMPEZA": "https://i.ibb.co/Cpk9Pqcj/produtosdelimpeza.png",
  "TEMPEROS": "https://i.ibb.co/0yp3dFh5/temperos.png",
  "ENLATADOS E EM CONSERVA": "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?auto=format&fit=crop&w=200&q=80",
  "BISCOITOS": "https://i.ibb.co/67zctRBZ/biscoitos.png",
  "MERCEARIA": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=200&q=80",
  "FRIOS Á GRANEL E PACOTES": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80",
  "RESFRIADOS": "https://i.ibb.co/whQP8Nh1/resfriados.png",
  "CONGELADOS": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80",
  "REFRIGERANTES E OUTROS LIQUIDOS": "https://i.ibb.co/Zz4xCfGK/refrigeranteeoutros.png",
}

// Função para obter a imagem de uma categoria
export function getCategoryImage(category: string): string {
  return categoryImages[category as keyof typeof categoryImages] || categoryImages["Todos"]
} 