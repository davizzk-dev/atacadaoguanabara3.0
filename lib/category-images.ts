// Configuração das imagens das categorias
let categoryImages = {
  "Todos": "/images/categories/todos.png",
  "DESCARTÁVEIS": "/images/categories/descarte.png",
  "CONFEITARIA E OUTROS": "/images/categories/confeitaria2-0.png",
  "PANIFICAÇÃO": "/images/categories/panifica-o.png",
  "MOLHOS": "/images/categories/molhos.png",
  "SUSHITERIA": "/images/categories/sushiteria.png",
  "PRODUTOS DE LIMPEZA": "/images/categories/produtosdelimpeza.png",
  "TEMPEROS": "/images/categories/temperos.png",
  "ENLATADOS E EM CONSERVA": "/images/categories/enlatados.png",
  "BISCOITOS": "/images/categories/biscoitos.png",
  "MERCEARIA": "/images/categories/mercearia.png",
  "FRIOS Á GRANEL E PACOTES": "/images/categories/frios.png",
  "RESFRIADOS": "/images/categories/resfriados.png",
  "CONGELADOS": "/images/categories/congelados.png",
  "REFRIGERANTESE OUTROS LIQUIDOS": "/images/categories/refrigerantes.png",
}

// Carregar imagens dinâmicas da API
export async function loadCategoryImages() {
  try {
    const response = await fetch('/api/category-images')
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        categoryImages = result.images
        return result.images
      }
    }
  } catch (error) {
    console.error('Erro ao carregar imagens das categorias:', error)
  }
  return categoryImages
}

// Função para obter a imagem de uma categoria
export function getCategoryImage(category: string): string {
  return categoryImages[category as keyof typeof categoryImages] || categoryImages["Todos"]
}

// Exportar as imagens padrão para compatibilidade
export { categoryImages } 