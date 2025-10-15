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
      if (category === 'Promoções') {
        // Função para calcular dados de promoção (sincronizada com catalog page)
        function calculatePromotionData(product: any) {
          const originalPrice1 = product.price;
          const originalPrice2 = (product as any).priceAtacado || (product as any).prices?.precoVenda2 || (product as any).varejoFacilData?.precos?.precoVenda2 || 0;
          
          let finalPrice1 = originalPrice1;
          let finalPrice2 = originalPrice2;
          
          // Verificar se existe oferta1 e sobrescrever price1
          if (product.varejoFacilData?.precos?.precoOferta1 > 0) {
            finalPrice1 = product.varejoFacilData.precos.precoOferta1;
          }

          // Verificar se existe oferta2 e sobrescrever price2  
          if (product.varejoFacilData?.precos?.precoOferta2 > 0) {
            finalPrice2 = product.varejoFacilData.precos.precoOferta2;
          }

          return {
            price1: finalPrice1,
            price2: finalPrice2,
            originalPrice1,
            originalPrice2
          };
        }

        // Filtrar produtos com ofertas ativas
        filteredProducts = filteredProducts.filter((product: any) => {
          const promotionData = calculatePromotionData(product);
          
          // Retornar true se há ofertas (price1 < originalPrice1 OU price2 < originalPrice2)
          const hasPromotion = promotionData.price1 < promotionData.originalPrice1 || 
                             (promotionData.originalPrice2 > 0 && promotionData.price2 < promotionData.originalPrice2);
          
          return hasPromotion;
        });
        
        console.log(`🔥 Filtrado por categoria "Promoções": ${filteredProducts.length} produtos em oferta`);
      } else {
        filteredProducts = filteredProducts.filter((product: any) => 
          product.category === category
        );
        console.log(`🏷️ Filtrado por categoria "${category}": ${filteredProducts.length} produtos`);
      }
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