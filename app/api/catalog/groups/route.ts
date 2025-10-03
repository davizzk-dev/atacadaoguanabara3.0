import { NextRequest, NextResponse } from 'next/server';
import { getProductsFromFile } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    console.log('🏷️ API Groups - Buscando grupos para categoria:', category);

    if (!category || category === 'Todos') {
      return NextResponse.json([]);
    }

    const products = await getProductsFromFile();
    
    if (products.length === 0) {
      return NextResponse.json([]);
    }

    console.log(`📦 Total de produtos carregados: ${products.length}`);

    // Buscar grupos únicos da categoria selecionada
    // Usando chave composta (secaoId + grupoId) para evitar conflitos entre seções
    const groupsMap = new Map();

    let produtosDaCategoria = 0;
    let produtosComGrupo = 0;

    products.forEach((product: any) => {
      if (product.category === category) {
        produtosDaCategoria++;
        
        if (product.varejoFacilData) {
          const { secaoId, grupoId, grupoNome } = product.varejoFacilData;
          
          if (secaoId && grupoId && grupoNome) {
            produtosComGrupo++;
            
            // Criar chave única combinando secaoId + grupoId
            const uniqueKey = `${secaoId}-${grupoId}`;
            
            if (!groupsMap.has(uniqueKey)) {
              groupsMap.set(uniqueKey, {
                id: uniqueKey,
                grupoId: grupoId,
                secaoId: secaoId,
                nome: grupoNome,
                totalProdutos: 0
              });
            }

            const group = groupsMap.get(uniqueKey);
            group.totalProdutos++;
          }
        }
      }
    });

    console.log(`🎯 Produtos da categoria "${category}": ${produtosDaCategoria}`);
    console.log(`📊 Produtos com grupo: ${produtosComGrupo}`);
    console.log(`🏷️ Grupos encontrados: ${groupsMap.size}`);

    // Converter Map para Array e ordenar
    const groups = Array.from(groupsMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Erro ao buscar grupos da categoria:', error);
    return NextResponse.json([]);
  }
}