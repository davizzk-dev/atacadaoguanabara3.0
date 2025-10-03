import { NextRequest, NextResponse } from 'next/server';
import { getProductsFromFile } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const groupId = searchParams.get('groupId') || searchParams.get('group'); // Aceitar ambos
    const search = searchParams.get('search');

    console.log('🔍 API Catalog/Products - Parâmetros:', { category, groupId, search });

    const products = await getProductsFromFile();
    
    if (products.length === 0) {
      console.log('❌ Nenhum produto encontrado no arquivo');
      return NextResponse.json([]);
    }

    console.log(`📦 Total de produtos carregados: ${products.length}`);
    let filteredProducts = products;

    // Filtrar por categoria
    if (category && category !== 'Todos') {
      filteredProducts = filteredProducts.filter((product: any) => 
        product.category === category
      );
      console.log(`🏷️ Filtrado por categoria "${category}": ${filteredProducts.length} produtos`);
    }

    // Filtrar por grupo
    if (groupId) {
      const beforeGroupFilter = filteredProducts.length;
      
      filteredProducts = filteredProducts.filter((product: any) => {
        if (!product.varejoFacilData) return false;
        
        const { secaoId, grupoId: productGroupId } = product.varejoFacilData;
        
        // Se groupId é uma chave composta (formato: secaoId-grupoId)
        if (groupId.includes('-')) {
          const uniqueKey = `${secaoId}-${productGroupId}`;
          return uniqueKey === groupId;
        }
        
        // Compatibilidade com formato antigo (apenas grupoId)
        const groupIdNum = parseInt(groupId);
        return productGroupId === groupIdNum || productGroupId === groupId;
      });
      
      console.log(`🎯 Filtrado por grupo "${groupId}": ${filteredProducts.length} produtos (antes: ${beforeGroupFilter})`);
      
      // Debug: mostrar alguns produtos com varejoFacilData
      const productsWithVarejoData = products.filter(p => p.varejoFacilData).slice(0, 3);
      console.log('🔍 Exemplos de produtos com varejoFacilData:', 
        productsWithVarejoData.map(p => ({ 
          name: p.name, 
          grupoId: p.varejoFacilData?.grupoId,
          grupoNome: p.varejoFacilData?.grupoNome 
        }))
      );
    }

    // Filtrar por pesquisa
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      filteredProducts = filteredProducts.filter((product: any) => {
        const productName = (product.name || '').toLowerCase().normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9 ]/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        const productDescription = (product.description || '').toLowerCase().normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9 ]/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        const productCategory = (product.category || '').toLowerCase().normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9 ]/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        const productBrand = (product.brand || '').toLowerCase().normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9 ]/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        return productName.includes(searchTerm) ||
               productDescription.includes(searchTerm) ||
               productCategory.includes(searchTerm) ||
               productBrand.includes(searchTerm);
      });
    }

    // Filtrar apenas produtos em estoque
    filteredProducts = filteredProducts.filter((product: any) => product.inStock);

    console.log(`✅ Retornando ${filteredProducts.length} produtos filtrados`);
    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error('Erro ao buscar produtos filtrados:', error);
    return NextResponse.json([]);
  }
}