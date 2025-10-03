import { NextResponse } from 'next/server';
import { getProductsFromFile } from '@/lib/data';

export async function GET() {
  try {
    const products = await getProductsFromFile();
    
    // Verificar produtos com varejoFacilData
    const productsWithVarejoData = products.filter(p => p.varejoFacilData);
    
    // Agrupar por categoria e grupo
    const categories: any = {};
    
    productsWithVarejoData.forEach((product: any) => {
      const category = product.category;
      const grupoId = product.varejoFacilData?.grupoId;
      const grupoNome = product.varejoFacilData?.grupoNome;
      
      if (!categories[category]) {
        categories[category] = {};
      }
      
      if (!categories[category][grupoId]) {
        categories[category][grupoId] = {
          grupoNome,
          produtos: []
        };
      }
      
      categories[category][grupoId].produtos.push({
        id: product.id,
        name: product.name,
        inStock: product.inStock
      });
    });
    
    // Estatísticas
    const stats = {
      totalProducts: products.length,
      productsWithVarejoData: productsWithVarejoData.length,
      categories: Object.keys(categories).length,
      categoriesDetails: {} as any
    };
    
    // Detalhar cada categoria
    Object.keys(categories).forEach((cat: string) => {
      (stats.categoriesDetails as any)[cat] = {
        grupos: Object.keys(categories[cat]).length,
        gruposDetails: {}
      };
      
      Object.keys(categories[cat]).forEach((grupoId: string) => {
        const grupo = categories[cat][grupoId];
        (stats.categoriesDetails[cat] as any).gruposDetails[grupoId] = {
          nome: grupo.grupoNome,
          totalProdutos: grupo.produtos.length,
          produtosEmEstoque: grupo.produtos.filter(p => p.inStock).length
        };
      });
    });
    
    return NextResponse.json({
      stats,
      sampleData: {
        // Mostrar alguns exemplos da categoria REFRIGERANTESE OUTROS LIQUIDOS
        refrigerantes: categories['REFRIGERANTESE OUTROS LIQUIDOS'] || {},
        // Mostrar primeiros 5 produtos com varejoFacilData
        sampleProducts: productsWithVarejoData.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          inStock: p.inStock,
          varejoFacilData: p.varejoFacilData
        }))
      }
    });
    
  } catch (error) {
    console.error('Erro no debug:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}