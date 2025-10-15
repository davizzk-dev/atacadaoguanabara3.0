// Sincronização e formatação de produtos Varejo Fácil
const fs = require('fs').promises;
const path = require('path');
const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
};

async function makeVarejoFacilRequest(endpoint, options = {}) {
  const fetch = require('node-fetch');
  const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`;
  const defaultHeaders = {
    'x-api-key': VAREJO_FACIL_CONFIG.apiKey,
    'Content-Type': 'application/json'
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined
  };
  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

async function getAllStock() {
  console.log('?? Buscando todos os saldos de estoque em lotes...')
  let allStock = []
  let start = 0
  const batchSize = 100
  let hasMore = true
  let batchCount = 0
  let maxRetries = 3

  while (hasMore) {
    batchCount++
    const end = start + batchSize - 1
    console.log(`?? Buscando lote de estoque ${batchCount} (start=${start}, end=${end})...`)
    let retryCount = 0
    let success = false
    while (retryCount < maxRetries && !success) {
      try {
        const stockData = await makeVarejoFacilRequest(`/api/v1/estoque/saldos?start=${start}&count=${batchSize}`)
        if (stockData.items && stockData.items.length > 0) {
          allStock = allStock.concat(stockData.items)
          console.log(`? Lote de estoque ${batchCount}: ${stockData.items.length} saldos (Total: ${allStock.length})`)
          if (stockData.items.length < batchSize) {
            hasMore = false
            console.log(`?? Último lote de estoque recebido. Finalizando...`)
          } else {
            start += batchSize
          }
          success = true
        } else {
          hasMore = false
          console.log(`?? Nenhum saldo de estoque encontrado no lote ${batchCount}. Finalizando...`)
          success = true
        }
      } catch (error) {
        retryCount++
        console.error(`? Erro ao buscar lote de estoque ${batchCount} (tentativa ${retryCount}/${maxRetries}):`, error)
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          console.error(`? Falha após ${maxRetries} tentativas. Pulando este lote.`)
          hasMore = false
        }
      }
    }
  }
  console.log(`?? Total de saldos de estoque coletados: ${allStock.length}`)
  return allStock
}

async function getAllPrices() {
  console.log('🔍 Buscando todos os preços (incluindo ofertas) em lotes...');
  let allPrices = [];
  let start = 0;
  const batchSize = 500;
  let hasMore = true;
  let batchCount = 0;
  let maxRetries = 3;

  while (hasMore) {
    batchCount++;
    console.log(`📊 Buscando lote de preços ${batchCount} (start=${start}, count=${batchSize})...`);
    let retryCount = 0;
    let success = false;
    
    while (retryCount < maxRetries && !success) {
      try {
        const pricesData = await makeVarejoFacilRequest(`/api/v1/produto/precos?start=${start}&count=${batchSize}`);
        
        if (pricesData.items && pricesData.items.length > 0) {
          // Processar preços incluindo ofertas
          const processedPrices = pricesData.items.map(price => ({
            ...price,
            // Garantir que preços de oferta estejam incluídos
            precoOferta1: price.precoOferta1 || 0,
            precoOferta2: price.precoOferta2 || 0,
            precoOferta3: price.precoOferta3 || 0,
            // Log para debug de preços de oferta
            hasOffers: !!(price.precoOferta1 || price.precoOferta2 || price.precoOferta3)
          }));
          
          allPrices = allPrices.concat(processedPrices);
          
          // Log de preços de oferta encontrados
          const offersCount = processedPrices.filter(p => p.hasOffers).length;
          console.log(`💰 Lote ${batchCount}: ${pricesData.items.length} preços (${offersCount} com ofertas) - Total: ${allPrices.length}`);
          
          if (pricesData.items.length < batchSize) {
            hasMore = false;
            console.log(`✅ Último lote de preços recebido. Finalizando...`);
          } else {
            start += batchSize;
          }
          success = true;
        } else {
          hasMore = false;
          console.log(`⚠️ Nenhum preço encontrado no lote ${batchCount}. Finalizando...`);
          success = true;
        }
      } catch (error) {
        retryCount++;
        console.error(`❌ Erro ao buscar lote de preços ${batchCount} (tentativa ${retryCount}/${maxRetries}):`, error);
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.error(`💥 Falha após ${maxRetries} tentativas. Pulando este lote.`);
          hasMore = false;
        }
      }
    }
  }
  
  const totalOffers = allPrices.filter(p => p.hasOffers).length;
  console.log(`🎯 Total de preços coletados: ${allPrices.length} (${totalOffers} com ofertas)`);
  return allPrices;
}

function formatProductForCatalogFast(
  varejoProduct,
  pricesByProductId,
  pricesByIdExterno,
  pricesByCodigoInterno,
  stockByProductId,
  sectionsById,
  brandsById,
  genresById,
  groupsById
) {
  let productPrice = pricesByProductId.get(varejoProduct.id);
  let price = productPrice ? getAnyPrice(productPrice) : undefined;
  let priceSource = '';
  
  if (price) priceSource = 'produtoId';
  
  // 1. idExterno
  if (!price && varejoProduct.idExterno && varejoProduct.idExterno.trim()) {
    productPrice = pricesByIdExterno.get(varejoProduct.idExterno.trim());
    price = getAnyPrice(productPrice);
    if (price) priceSource = 'idExterno';
  }
  
  // 2. codigoInterno
  if (!price && varejoProduct.codigoInterno && varejoProduct.codigoInterno.trim()) {
    productPrice = pricesByCodigoInterno.get(varejoProduct.codigoInterno.trim());
    price = getAnyPrice(productPrice);
    if (price) priceSource = 'codigoInterno';
  }

  // 3. Busca forçada: procurar qualquer preço para o produtoId
  if (!price) {
    for (const p of pricesByProductId.values()) {
      if (p.produtoId === varejoProduct.id) {
        price = getAnyPrice(p);
        if (price) {
          priceSource = 'forcada-produtoId';
          break;
        }
      }
    }
  }

  // Buscar estoque pelo ID exato do produto com validação robusta
  const productStock = stockByProductId.get(varejoProduct.id);
  let stockQuantity = 0;
  let stockSource = 'sem-estoque';
  
  if (productStock) {
    stockQuantity = productStock.saldo || 0;
    stockSource = 'api-estoque';
    
    // Validar dados de estoque e aplicar filtros de qualidade
    if (typeof stockQuantity !== 'number' || isNaN(stockQuantity) || stockQuantity < 0) {
      console.log(`⚠️ Saldo inválido para produto ${varejoProduct.id}: ${stockQuantity} - definindo como 0`);
      stockQuantity = 0;
      stockSource = 'corrigido-invalido';
    } else if (stockQuantity > 50000) {
      console.log(`⚠️ Saldo muito alto para produto ${varejoProduct.id}: ${stockQuantity} - possível erro de dados`);
      stockSource = 'alto-suspeito';
    }
  } else {
    // Produto não tem registro de estoque na API
    stockQuantity = 0;
    stockSource = 'produto-sem-estoque-api';
  }
  
  const inStock = stockQuantity > 0;
  
  // Log detalhado para produtos com estoque para debug
  if (inStock && stockQuantity > 0) {
    console.log(`📦 Produto ${varejoProduct.id} (${varejoProduct.descricao?.substring(0, 30)}...): ${stockQuantity} unidades (${stockSource})`);
  }
  


  // Busca rápida de seção, marca, gênero e grupo usando Map
  const section = sectionsById.get(varejoProduct.secaoId);
  const brand = brandsById.get(varejoProduct.marcaId);
  const genre = genresById.get(varejoProduct.generoId);
  
  // Buscar grupo usando chave composta (secaoId-grupoId) para evitar conflitos
  const compositeGroupKey = `${varejoProduct.secaoId}-${varejoProduct.grupoId}`;
  let group = groupsById.get(compositeGroupKey);
  
  // Fallback: se não encontrar com chave composta, tentar apenas grupoId
  if (!group) {
    group = groupsById.get(varejoProduct.grupoId);
  }

  const category = section?.descricao || 'GERAL';
  const brandName = brand?.descricao || 'Sem marca';
  const genreName = genre?.descricao || '';
  const groupName = group?.descricao || '';

  // Gerar imagem e tags de forma otimizada
  const image = varejoProduct.imagem && varejoProduct.imagem.trim() ? 
    varejoProduct.imagem : 
    `https://images.unsplash.com/photo-1619983081563-430f8b5a893c?auto=format&fit=crop&w=400&q=80`;
  
  const tags = [
    category.toLowerCase(),
    brandName.toLowerCase(),
    genreName.toLowerCase(),
    groupName.toLowerCase(),
    'varejo-facil'
  ].filter(tag => tag && tag !== 'sem marca');

  // Calcular preços corretamente - MANTER preços originais
  const precoVenda1 = parseFloat(productPrice?.precoVenda1 || 0);
  const precoOferta1 = parseFloat(productPrice?.precoOferta1 || 0);
  const precoVenda2 = parseFloat(productPrice?.precoVenda2 || 0);
  const precoOferta2 = parseFloat(productPrice?.precoOferta2 || 0);
  const precoVenda3 = parseFloat(productPrice?.precoVenda3 || 0);
  const precoOferta3 = parseFloat(productPrice?.precoOferta3 || 0);
  
  const hasOffer1 = precoOferta1 > 0;
  const hasOffer2 = precoOferta2 > 0;
  const hasOffer3 = precoOferta3 > 0;
  
  // SEMPRE usar o preço normal 1 como price principal - NÃO sobrescrever com oferta
  const displayPrice = precoVenda1;
  
  // Verificar se tem qualquer oferta (1, 2 ou 3)
  const hasAnyOffers = hasOffer1 || hasOffer2 || hasOffer3;
  
  // Log de ofertas encontradas para debug
  if (hasAnyOffers && productPrice) {
    console.log(`🎯 OFERTA: ${varejoProduct.descricao}`);
    if (hasOffer1) console.log(`   Preço 1: R$${precoVenda1} → R$${precoOferta1} (${Math.round(((precoVenda1 - precoOferta1) / precoVenda1) * 100)}% off)`);
    if (hasOffer2) console.log(`   Preço 2: R$${precoVenda2} → R$${precoOferta2} (min: ${productPrice.quantidadeMinimaPreco2})`);
    if (hasOffer3) console.log(`   Preço 3: R$${precoVenda3} → R$${precoOferta3} (min: ${productPrice.quantidadeMinimaPreco3})`);
  }
  
  return {
    id: varejoProduct.id.toString(),
    name: varejoProduct.descricao || 'Produto sem nome',
    price: displayPrice, // SEMPRE preço normal 1 - NÃO sobrescrever com oferta
    originalPrice: precoVenda1, // Mesmo valor que price (para compatibilidade)
    hasOffers: hasAnyOffers, // Indicar se tem qualquer oferta ativa
    isOnSale: hasOffer1, // Só marca como "em oferta" se o preço 1 tem desconto
    discountPercent: hasOffer1 && precoVenda1 > 0 ? Math.round(((precoVenda1 - precoOferta1) / precoVenda1) * 100) : 0,
    image: image,
    category: category,
    description: varejoProduct.descricaoReduzida || varejoProduct.descricao || 'Descrição não disponível',
    stock: stockQuantity,
    inStock: inStock,
    rating: 4.5,
    reviews: 25,
    brand: brandName,
    genre: genreName,
    group: groupName,
    unit: varejoProduct.unidadeDeVenda || 'un',
    tags: tags,
    prices: {
      price1: precoVenda1,
      offerPrice1: precoOferta1,
      price2: precoVenda2,
      offerPrice2: precoOferta2,
      price3: precoVenda3,
      offerPrice3: precoOferta3,
      minQuantityPrice2: productPrice && productPrice.quantidadeMinimaPreco2 !== undefined ? parseInt(productPrice.quantidadeMinimaPreco2) : 0,
      minQuantityPrice3: productPrice && productPrice.quantidadeMinimaPreco3 !== undefined ? parseInt(productPrice.quantidadeMinimaPreco3) : 0
    },
    varejoFacilData: {
      codigoInterno: varejoProduct.codigoInterno,
      idExterno: varejoProduct.idExterno,
      secaoId: varejoProduct.secaoId,
      secaoNome: section?.descricao || '',
      grupoId: varejoProduct.grupoId,
      grupoNome: group?.descricao || '',
      marcaId: varejoProduct.marcaId,
      marcaNome: brand?.descricao || '',
      generoId: varejoProduct.generoId,
      generoNome: genre?.descricao || '',
      ativoNoEcommerce: varejoProduct.ativoNoEcommerce,
      dataInclusao: varejoProduct.dataInclusao,
      dataAlteracao: varejoProduct.dataAlteracao,
      estoque: {
        saldo: stockQuantity,
        lojaId: productStock?.lojaId,
        localId: productStock?.localId,
        criadoEm: productStock?.criadoEm,
        atualizadoEm: productStock?.atualizadoEm
      },
      precos: productPrice ? {
        id: productPrice.id,
        price1: productPrice.precoVenda1,
        priceoffer1: productPrice.precoOferta1,
        price2: productPrice.precoVenda2,
        priceoffer2: productPrice.precoOferta2,
        minQuantityPrice2: productPrice.quantidadeMinimaPreco2,
        precoVenda3: productPrice.precoVenda3,
        precoOferta3: productPrice.precoOferta3,
        quantidadeMinimaPreco3: productPrice.quantidadeMinimaPreco3,
        descontoMaximo: productPrice.descontoMaximo,
        permiteDesconto: productPrice.permiteDesconto
      } : null
    }
  };
}

function getAnyPrice(productPrice) {
  if (!productPrice) return undefined;
  // Priorizar preço 1 (varejo) - não pegar price2 como principal
  return (
    productPrice.precoVenda1 ||
    productPrice.precoOferta1 ||
    undefined
  );
}

// Função para processar preços incluindo ofertas
function processPrice(priceObj) {
  if (!priceObj) return null;
  
  return {
    precoVenda1: parseFloat(priceObj.precoVenda1 || 0),
    precoOferta1: parseFloat(priceObj.precoOferta1 || 0),
    precoVenda2: parseFloat(priceObj.precoVenda2 || 0),
    precoOferta2: parseFloat(priceObj.precoOferta2 || 0),
    precoVenda3: parseFloat(priceObj.precoVenda3 || 0),
    precoOferta3: parseFloat(priceObj.precoOferta3 || 0),
    quantidadeMinimaPreco2: parseInt(priceObj.quantidadeMinimaPreco2 || 0),
    quantidadeMinimaPreco3: parseInt(priceObj.quantidadeMinimaPreco3 || 0),
    // Marcar se tem ofertas ativas
    hasOffers: !!(priceObj.precoOferta1 || priceObj.precoOferta2 || priceObj.precoOferta3)
  };
}

// Função para obter o melhor preço do PREÇO 1 apenas (varejo)
function getBestPrice(priceObj) {
  if (!priceObj) return 0;
  
  // Se tem oferta no preço 1, usar a oferta
  if (priceObj.precoOferta1 && priceObj.precoOferta1 > 0) {
    return priceObj.precoOferta1;
  }
  
  // Senão, usar o preço normal 1
  return priceObj.precoVenda1 || 0;
}

async function syncAndFormatProducts() {
  try {
    console.log('?? Iniciando sincronização completa do Varejo Fácil...');
    
    // 1. Buscar seções
    console.log('?? Buscando seções...');
    const sectionsData = await makeVarejoFacilRequest('/api/v1/produto/secoes?count=500');
    const sections = sectionsData.items || [];
    console.log(`? ${sections.length} seções encontradas`);

    // 2. Buscar marcas
    console.log('??? Buscando marcas...');
    const brandsData = await makeVarejoFacilRequest('/api/v1/produto/marcas?count=500');
    const brands = brandsData.items || [];
    console.log(`? ${brands.length} marcas encontradas`);

    // 3. Buscar gêneros
    console.log('?? Buscando gêneros...');
    const genresData = await makeVarejoFacilRequest('/api/v1/produto/generos?count=500');
    const genres = genresData.items || [];
    console.log(`? ${genres.length} gêneros encontrados`);

    // 4. Buscar grupos por seção
    console.log('?? Buscando grupos por seção...');
    let allGroups = [];
    for (const section of sections) {
      console.log(`?? Buscando grupos da seção: ${section.descricao} (ID: ${section.id})`);
      try {
        const groupsData = await makeVarejoFacilRequest(`/api/v1/produto/secoes/${section.id}/grupos`);
        if (groupsData.items && groupsData.items.length > 0) {
          // Adicionar informação da seção a cada grupo
          const groupsWithSection = groupsData.items.map(group => ({
            ...group,
            secaoId: section.id,
            secaoNome: section.descricao
          }));
          allGroups = allGroups.concat(groupsWithSection);
          console.log(`  ? ${groupsData.items.length} grupos encontrados na seção ${section.descricao}`);
        } else {
          console.log(`  ? Nenhum grupo encontrado na seção ${section.descricao}`);
        }
      } catch (error) {
        console.error(`? Erro ao buscar grupos da seção ${section.descricao}:`, error.message);
      }
    }
    console.log(`? Total de ${allGroups.length} grupos encontrados em todas as seções`);
    
    // Relatório detalhado dos grupos por seção
    const groupsBySection = {};
    allGroups.forEach(group => {
      if (!groupsBySection[group.secaoId]) {
        groupsBySection[group.secaoId] = [];
      }
      groupsBySection[group.secaoId].push(group);
    });
    
    console.log('\n📋 Relatório de grupos por seção:');
    Object.keys(groupsBySection).forEach(secaoId => {
      const section = sections.find(s => s.id == secaoId);
      const sectionName = section ? section.descricao : `Seção ${secaoId}`;
      console.log(`   - ${sectionName}: ${groupsBySection[secaoId].length} grupos`);
    });

  // 5. Buscar TODOS os preços em lotes (incluindo ofertas)
  console.log('🔍 Iniciando busca completa de preços com ofertas...');
  const prices = await getAllPrices();
  console.log(`💰 ${prices.length} preços encontrados no total (incluindo ofertas)`);

  // 6. Buscar TODOS os saldos de estoque em lotes usando função robusta
  console.log('?? Buscando todos os saldos de estoque em lotes com controle pelo total da API...');
  const stock = await buscarTodosEstoquesEmLotes(100);
  console.log(`? ${stock.length} saldos de estoque encontrados no total (via lotes)`);

    // 7. Buscar produtos em lotes de 500 e coletar todos os produtoId
    console.log('?? Buscando produtos em lotes de 500...');
    let allProducts = [];
    let allProductIds = [];
    let start = 0;
    const batchSize = 500;
    let hasMore = true;
    let batchCount = 0;

    while (hasMore) {
      batchCount++;
      console.log(`?? Buscando lote ${batchCount} (${start} - ${start + batchSize - 1})...`);
      try {
        const productsData = await makeVarejoFacilRequest(`/api/v1/produto/produtos?start=${start}&count=${batchSize}`);
        if (productsData.items && productsData.items.length > 0) {
          allProducts = allProducts.concat(productsData.items);
          // Coletar todos os produtoId válidos
          productsData.items.forEach(prod => {
            if (prod.id) allProductIds.push(prod.id);
          });
          console.log(`? Lote ${batchCount}: ${productsData.items.length} produtos (Total: ${allProducts.length})`);
          if (productsData.items.length < batchSize) {
            hasMore = false;
            console.log('?? Último lote recebido. Finalizando sincronização...');
          } else {
            start += batchSize;
          }
        } else {
          hasMore = false;
          console.log(`?? Nenhum produto encontrado no lote ${batchCount}. Finalizando...`);
        }
      } catch (error) {
        console.error(`? Erro ao buscar lote ${batchCount}:`, error);
        hasMore = false;
      }
    }

    console.log(`? Total de produtos encontrados: ${allProducts.length}`);
    console.log(`? Total de produtoIds coletados: ${allProductIds.length}`);

    // Buscar todos os preços usando os produtoId coletados, em lotes de 500
    console.log('?? Buscando preços reais dos produtos em lotes de 500...');
    let allPrices = [];
    for (let i = 0; i < allProductIds.length; i += batchSize) {
      const batchIds = allProductIds.slice(i, i + batchSize);
      const idsQuery = batchIds.map(id => `produtoId==${id}`).join(",");
      const url = `/api/v1/produto/precos?q=${idsQuery}&start=0&count=${batchIds.length}`;
      try {
        const pricesData = await makeVarejoFacilRequest(url);
        if (pricesData.items && pricesData.items.length > 0) {
          // Processar preços incluindo ofertas
          const processedPrices = pricesData.items.map(processPrice);
          allPrices = allPrices.concat(processedPrices);
          
          const offersCount = processedPrices.filter(p => p.hasOffers).length;
          console.log(`💰 Lote de preços: ${pricesData.items.length} encontrados (${offersCount} com ofertas) - Total: ${allPrices.length}`);
        } else {
          console.log('⚠️ Nenhum preço encontrado para lote de produtoIds.');
        }
      } catch (error) {
        console.error('? Erro ao buscar preços para lote de produtoIds:', error);
      }
    }

    console.log(`? Total de preços coletados: ${allPrices.length}`);

    // 7. Criar índices para busca rápida (OTIMIZAÇÃO CRÍTICA!)
    console.log('? Criando índices para busca rápida...');
    const pricesByProductId = new Map();
    const pricesByIdExterno = new Map();
    const pricesByCodigoInterno = new Map();
    const stockByProductId = new Map();
    const sectionsById = new Map();
    const brandsById = new Map();
    const genresById = new Map();
    const groupsById = new Map();
    
    // Indexar preços
    allPrices.forEach(price => {
      if (price.produtoId) pricesByProductId.set(price.produtoId, price);
      if (price.idExterno && price.idExterno.trim()) pricesByIdExterno.set(price.idExterno.trim(), price);
      if (price.codigoInterno && price.codigoInterno.trim()) pricesByCodigoInterno.set(price.codigoInterno.trim(), price);
    });
    
    // Criar um conjunto de produtos válidos para validação
    const validProductIds = new Set(allProducts.map(p => p.id));
    
    // Indexar estoque com validação e controle de duplicatas
    let zeroStockItems = 0;
    let validStockItems = 0;
    let duplicateStockItems = 0;
    let invalidProductStockItems = 0;
    let stockProcessingDetails = [];
    
    // Primeira passada: contar e validar
    stock.forEach(stockItem => {
      if (!stockItem.produtoId) {
        return; // Pular itens sem produtoId
      }
      
      const productId = stockItem.produtoId;
      
      // Verificar se o produto existe na lista de produtos válidos
      if (!validProductIds.has(productId)) {
        invalidProductStockItems++;
        return; // Pular estoque de produto não existente
      }
      
      // Verificar duplicata
      const isDuplicate = stockByProductId.has(productId);
      if (isDuplicate) {
        duplicateStockItems++;
        
        // Para duplicatas, usar o registro com maior saldo
        const existingStock = stockByProductId.get(productId);
        if (stockItem.saldo > existingStock.saldo) {
          stockByProductId.set(productId, stockItem);
          console.log(`🔄 Estoque atualizado para produto ${productId}: ${existingStock.saldo} → ${stockItem.saldo}`);
        }
      } else {
        // Primeiro registro para este produto
        stockByProductId.set(productId, stockItem);
      }
      
      // Contar estatísticas
      if (stockItem.saldo === 0) {
        zeroStockItems++;
      } else {
        validStockItems++;
      }
      
      // Log detalhado para primeiros 10 registros
      if (stockProcessingDetails.length < 10) {
        stockProcessingDetails.push({
          produtoId: productId,
          saldo: stockItem.saldo,
          isDuplicate,
          isValidProduct: true
        });
      }
    });
    
    console.log(`📊 ANÁLISE DETALHADA DE ESTOQUE:`);
    console.log(`   - Total de registros de estoque coletados: ${stock.length}`);
    console.log(`   - Produtos válidos encontrados: ${validProductIds.size}`);
    console.log(`   - Produtos únicos com estoque indexado: ${stockByProductId.size}`);
    console.log(`   - Registros com estoque > 0: ${validStockItems}`);
    console.log(`   - Registros com estoque = 0: ${zeroStockItems}`);
    console.log(`   - Registros duplicados (mesmo produtoId): ${duplicateStockItems}`);
    console.log(`   - Registros de produtos inexistentes: ${invalidProductStockItems}`);
    console.log(`   - Taxa de aproveitamento: ${((stockByProductId.size / stock.length) * 100).toFixed(1)}%`);
    
    // Mostrar exemplos de processamento
    if (stockProcessingDetails.length > 0) {
      console.log(`\n📋 PRIMEIROS REGISTROS PROCESSADOS:`);
      stockProcessingDetails.forEach((detail, index) => {
        console.log(`   ${index + 1}. Produto ${detail.produtoId}: ${detail.saldo} unidades ${detail.isDuplicate ? '(duplicata)' : '(novo)'}`);
      });
    }
    
    // Indexar seções, marcas, gêneros e grupos
    sections.forEach(section => sectionsById.set(section.id, section));
    brands.forEach(brand => brandsById.set(brand.id, brand));
    genres.forEach(genre => genresById.set(genre.id, genre));
    
    // Indexar grupos com chave composta para evitar conflitos entre seções
    allGroups.forEach(group => {
      // Chave composta: secaoId-grupoId
      const compositeKey = `${group.secaoId}-${group.id}`;
      groupsById.set(compositeKey, group);
      
      // Para compatibilidade, também indexar apenas por grupoId (último grupo com este ID prevalece)
      groupsById.set(group.id, group);
    });
    
    console.log('? Índices criados:');
    console.log(`   - ${pricesByProductId.size} preços por produtoId`);
    console.log(`   - ${pricesByIdExterno.size} preços por idExterno`);
    console.log(`   - ${stockByProductId.size} estoques por produtoId`);
    console.log(`   - ${sectionsById.size} seções indexadas`);
    console.log(`   - ${brandsById.size} marcas indexadas`);
    console.log(`   - ${genresById.size} gêneros indexados`);
    console.log(`   - ${groupsById.size} grupos indexados`);
    
    // Verificar compatibilidade entre produtos e estoques
    const productsWithStockData = allProducts.filter(p => stockByProductId.has(p.id));
    const productsWithoutStockData = allProducts.filter(p => !stockByProductId.has(p.id));
    console.log(`🔍 COMPATIBILIDADE DE DADOS:`);
    console.log(`   - Produtos da API: ${allProducts.length}`);
    console.log(`   - Produtos com dados de estoque: ${productsWithStockData.length}`);
    console.log(`   - Produtos SEM dados de estoque: ${productsWithoutStockData.length}`);

    // 8. Formatar produtos para o catálogo
    console.log('?? Formatando produtos para o catálogo...');
    console.log(`📊 ANTES DA FORMATAÇÃO: ${allProducts.length} produtos brutos`);
    
    const formattedProducts = allProducts.map((product, index) => {
      if (index % 500 === 0) {
        console.log(`?? Formatando produto ${index + 1}/${allProducts.length}...`);
      }
      return formatProductForCatalogFast(
        product, 
        pricesByProductId, 
        pricesByIdExterno, 
        pricesByCodigoInterno, 
        stockByProductId, 
        sectionsById, 
        brandsById, 
        genresById,
        groupsById
      );
    });
    
    console.log(`📊 APÓS FORMATAÇÃO: ${formattedProducts.length} produtos formatados`);

    // ANÁLISE COMPLETA DE RESULTADOS
    const productsWithoutPrice = formattedProducts.filter(p => !p.price || p.price === 0);
    const productsWithStock = formattedProducts.filter(p => p.inStock === true);
    const productsOutOfStock = formattedProducts.filter(p => p.inStock === false);
    const productsWithPrice = formattedProducts.filter(p => p.price && p.price > 0);
    
    // Análise detalhada de estoque
    const stockRawTotal = stock.length;
    const stockRawWithStock = stock.filter(s => s.saldo > 0).length;
    const stockIndexedTotal = stockByProductId.size;
    const stockIndexedWithStock = Array.from(stockByProductId.values()).filter(s => s.saldo > 0).length;
    
    console.log(`\n🔍 ANÁLISE COMPLETA DE ESTOQUE:`);
    console.log(`📊 DADOS BRUTOS DA API:`);
    console.log(`   - Total de registros de estoque: ${stockRawTotal}`);
    console.log(`   - Registros com saldo > 0: ${stockRawWithStock}`);
    console.log(`   - Registros com saldo = 0: ${stockRawTotal - stockRawWithStock}`);
    
    console.log(`\n📊 DADOS INDEXADOS (após processamento):`);
    console.log(`   - Produtos únicos com dados de estoque: ${stockIndexedTotal}`);
    console.log(`   - Produtos com estoque > 0: ${stockIndexedWithStock}`);
    console.log(`   - Produtos com estoque = 0: ${stockIndexedTotal - stockIndexedWithStock}`);
    
    console.log(`\n📊 PRODUTOS FORMATADOS FINAIS:`);
    console.log(`   - Total de produtos formatados: ${formattedProducts.length}`);
    console.log(`   - Produtos com estoque (inStock=true): ${productsWithStock.length}`);
    console.log(`   - Produtos sem estoque (inStock=false): ${productsOutOfStock.length}`);
    console.log(`   - Soma de verificação: ${productsWithStock.length + productsOutOfStock.length} = ${formattedProducts.length} ✅`);
    
    console.log(`\n🔍 ANÁLISE DE PERDAS/GANHOS:`);
    console.log(`   - Registros brutos → Indexados: ${stockRawTotal} → ${stockIndexedTotal} (${stockRawTotal - stockIndexedTotal} removidos)`);
    console.log(`   - Com estoque bruto → Com estoque indexado: ${stockRawWithStock} → ${stockIndexedWithStock} (${stockRawWithStock - stockIndexedWithStock} perdidos)`);
    console.log(`   - Com estoque indexado → Com estoque final: ${stockIndexedWithStock} → ${productsWithStock.length} (${stockIndexedWithStock - productsWithStock.length} perdidos)`);
    
    // Debug: Verificar consistência
    const totalCount = productsWithStock.length + productsOutOfStock.length;
    if (totalCount !== formattedProducts.length) {
      console.log(`⚠️ ERRO DE CONSISTÊNCIA DETECTADO:`);
      console.log(`   - Produtos formatados: ${formattedProducts.length}`);
      console.log(`   - Com estoque + Sem estoque: ${totalCount}`);
      console.log(`   - Diferença: ${Math.abs(formattedProducts.length - totalCount)}`);
    } else {
      console.log(`✅ CONSISTÊNCIA VERIFICADA: Todos os produtos têm status de estoque definido`);
    }

    if (productsWithoutPrice.length > 0) {
      console.log('\n--- RELATÓRIO FINAL: PRODUTOS SEM PREÇO ---');
      productsWithoutPrice.forEach((product, idx) => {
        console.log(`${idx + 1}. ID: ${product.id} | Nome: ${product.name || 'Produto não encontrado'}`);
      });
      console.log(`\nTotal de produtos sem preço: ${productsWithoutPrice.length}`);
    } else {
      console.log('? Todos os produtos possuem preço!');
    }

    // Busca extra para produtoIds não encontrados
    let produtosComPrecoAdicionado = [];
    if (productsWithoutPrice.length > 0) {
      console.log('\n?? Tentando buscar novamente preços dos produtos sem preço em lote na API de preços...');
      const batchSize = 100;
      for (let i = 0; i < productsWithoutPrice.length; i += batchSize) {
        const batch = productsWithoutPrice.slice(i, i + batchSize);
        const idsQuery = batch.map(p => `produtoId==${p.id}`).join(",");
        try {
          const priceData = await makeVarejoFacilRequest(`/api/v1/produto/precos?q=${idsQuery}&start=0&count=${batch.length}`);
          if (priceData.items && priceData.items.length > 0) {
            priceData.items.forEach(priceObj => {
              const productId = priceObj.produtoId?.toString();
              const product = batch.find(p => p.id === productId);
              if (product) {
                // Processar preço MANTENDO estrutura original
                const processedPrice = processPrice(priceObj);
                const precoAntigo = product.price;
                
                // MANTER preço normal 1 como price principal
                product.price = processedPrice.precoVenda1 || 0;
                product.originalPrice = processedPrice.precoVenda1 || 0;
                
                // Aplicar flags de oferta corretamente
                product.hasOffers = processedPrice.hasOffers;
                product.isOnSale = processedPrice.precoOferta1 > 0;
                product.discountPercent = processedPrice.precoOferta1 > 0 && processedPrice.precoVenda1 > 0 ? 
                  Math.round(((processedPrice.precoVenda1 - processedPrice.precoOferta1) / processedPrice.precoVenda1) * 100) : 0;
                product.varejoFacilData.precos = processedPrice;
                
                // Atualizar estrutura de preços detalhada
                product.prices = {
                  price1: processedPrice.precoVenda1 || 0,
                  offerPrice1: processedPrice.precoOferta1 || 0,
                  price2: processedPrice.precoVenda2 || 0,
                  offerPrice2: processedPrice.precoOferta2 || 0,
                  price3: processedPrice.precoVenda3 || 0,
                  offerPrice3: processedPrice.precoOferta3 || 0,
                  minQuantityPrice2: processedPrice.quantidadeMinimaPreco2 || 0,
                  minQuantityPrice3: processedPrice.quantidadeMinimaPreco3 || 0
                };
                
                // Log se encontrou oferta no preço 1
                if (processedPrice.precoOferta1 > 0) {
                  console.log(`🎯 Produto ${product.name}: Preço normal R$${processedPrice.precoVenda1} | Oferta 1 R$${processedPrice.precoOferta1} (${product.discountPercent}% off)`);
                }
                
                // Atualiza também no array principal formattedProducts
                const idx = formattedProducts.findIndex(p => p.id === productId);
                if (idx !== -1) {
                  formattedProducts[idx].price = product.price;
                  formattedProducts[idx].originalPrice = product.originalPrice;
                  formattedProducts[idx].hasOffers = product.hasOffers;
                  formattedProducts[idx].isOnSale = product.isOnSale;
                  formattedProducts[idx].discountPercent = product.discountPercent;
                  formattedProducts[idx].prices = product.prices;
                  formattedProducts[idx].varejoFacilData.precos = priceObj;
                }
                
                if (!precoAntigo && product.price) {
                  produtosComPrecoAdicionado.push({
                    id: productId,
                    name: product.name,
                    prices: {
                      price1: parseFloat(priceObj.precoVenda1 || 0),
                      offerPrice1: parseFloat(priceObj.precoOferta1 || 0),
                      price2: parseFloat(priceObj.precoVenda2 || 0),
                      offerPrice2: parseFloat(priceObj.precoOferta2 || 0),
                      minQuantityPrice2: parseInt(priceObj.quantidadeMinimaPreco2 || 0),
                      price3: parseFloat(priceObj.precoVenda3 || 0),
                      offerPrice3: parseFloat(priceObj.precoOferta3 || 0),
                      minQuantityPrice3: parseInt(priceObj.quantidadeMinimaPreco3 || 0)
                    },
                    price: parseFloat(priceObj.precoVenda1 || 0),
                    originalPrice: parseFloat(priceObj.precoVenda1 || 0),
                    varejoFacilData: { precos: priceObj }
                  });
                }
                console.log(`? Preço atualizado para produto ID ${productId}: R$ ${product.price}`);
              }
            });
          }
        } catch (err) {
          console.log(`?? Falha ao buscar preços para lote: ${err.message}`);
        }
      }
      
      // Relatório final dos produtos que tiveram preço adicionado
      if (produtosComPrecoAdicionado.length > 0) {
        console.log('\n--- PRODUTOS QUE TIVERAM PREÇO ADICIONADO NA SEGUNDA BUSCA ---');
        produtosComPrecoAdicionado.forEach((prod, idx) => {
          console.log(`${idx + 1}. ID: ${prod.id} | Nome: ${prod.name} | Preço: R$ ${prod.price}`);
        });
        console.log(`\nTotal: ${produtosComPrecoAdicionado.length} produtos tiveram preço adicionado na segunda busca.`);
      } else {
        console.log('Nenhum produto teve preço adicionado na segunda busca.');
      }
    }

    // 9. Ler produtos existentes para preservar imagens customizadas
    console.log('??? Lendo produtos existentes para preservar imagens...');
    let existingProducts = [];
    let existingImagesMap = new Map();
    
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const productsFilePath = path.join(dataDir, 'products.json');
      
      // Verificar se arquivo existe
      try {
        await fs.access(productsFilePath);
        const existingData = await fs.readFile(productsFilePath, 'utf-8');
        existingProducts = JSON.parse(existingData);
        
        // Criar mapa de imagens existentes por ID
        existingProducts.forEach(product => {
          if (product.id && product.image && 
              !product.image.includes('images.unsplash.com') && 
              !product.image.includes('placeholder')) {
            const productId = product.id.toString();
            existingImagesMap.set(productId, product.image);
          }
        });
        
        console.log(`? ${existingProducts.length} produtos existentes carregados`);
        console.log(`??? ${existingImagesMap.size} imagens customizadas encontradas para preservar`);
      } catch (accessError) {
        console.log('?? Nenhum arquivo products.json existente encontrado');
      }
    } catch (error) {
      console.warn('?? Erro ao ler produtos existentes:', error.message);
    }
    
    // 10. Preservar imagens customizadas nos produtos formatados
    console.log('?? Preservando imagens customizadas...');
    let imagesPreserved = 0;
    formattedProducts.forEach(product => {
      const productId = product.id.toString();
      const existingImage = existingImagesMap.get(productId);
      if (existingImage) {
        product.image = existingImage;
        imagesPreserved++;
      } else {
        // Se a imagem é uma URL (Unsplash ou placeholder), força para vazio
        if (typeof product.image === 'string' && 
            (product.image.includes('images.unsplash.com') || 
             product.image.includes('placeholder'))) {
          product.image = '';
        }
      }
    });
    
    if (imagesPreserved > 0) {
      console.log(`? ${imagesPreserved} imagens customizadas preservadas`);
    } else {
      console.log('?? Nenhuma imagem customizada foi preservada');
    }

    // 11. Manter todos os produtos (incluindo duplicatas)
    console.log('📦 Mantendo todos os produtos formatados (incluindo duplicatas)...');
    const finalProducts = formattedProducts; // Usar todos os produtos sem remoção
    console.log(`✅ Total de produtos mantidos: ${finalProducts.length}`);

    // 12. Salvar no products.json e products2.json (backup)
    console.log('?? Salvando produtos formatados com sistema de backup...');
    const dataDir = path.join(process.cwd(), 'data');
    const productsFilePath = path.join(dataDir, 'products.json');
    const products2FilePath = path.join(dataDir, 'products2.json');
    
    // Criar diretório data se não existir
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      console.log('Diretório data já existe');
    }
    
    // Verificar se products.json existe e tem produtos válidos
    let shouldUpdatePrimaryFile = true;
    try {
      const existingData = await fs.readFile(productsFilePath, 'utf-8');
      const existingProducts = JSON.parse(existingData);
      
      // Se products.json existe mas está vazio ou corrompido, não atualizar
      if (!Array.isArray(existingProducts) || existingProducts.length === 0) {
        console.log('⚠️ products.json está vazio ou inválido, mantendo dados atuais');
        shouldUpdatePrimaryFile = false;
      } else {
        console.log(`✅ products.json válido com ${existingProducts.length} produtos, atualizando`);
      }
    } catch (error) {
      console.log('ℹ️ products.json não existe, criando novo arquivo');
    }
    
    // Sempre salvar no products2.json (backup)
    console.log('?? Salvando backup no products2.json...');
    await fs.writeFile(products2FilePath, JSON.stringify(finalProducts, null, 2));
    console.log(`✅ Backup salvo: ${finalProducts.length} produtos em products2.json`);
    
    // Salvar no products.json apenas se validado
    if (shouldUpdatePrimaryFile) {
      console.log('?? Salvando no products.json principal...');
      await fs.writeFile(productsFilePath, JSON.stringify(finalProducts, null, 2));
      console.log(`✅ Arquivo principal salvo: ${finalProducts.length} produtos em products.json`);
    } else {
      console.log('⚠️ products.json não foi atualizado para preservar dados existentes');
    }
    
    // 13. Salvar dados completos do Varejo Fácil
    const varejoFacilData = {
      lastSync: new Date().toISOString(),
      totalProducts: finalProducts.length,
      totalSections: sections.length,
      totalBrands: brands.length,
      totalGenres: genres.length,
      totalGroups: allGroups.length,
      totalPrices: allPrices.length,
      totalStock: stock.length,
      productsWithZeroPrice: productsWithoutPrice.length,
      productsWithStock: productsWithStock.length,
      productsOutOfStock: productsOutOfStock.length,
      priceSuccessRate: ((productsWithPrice.length / formattedProducts.length) * 100).toFixed(2),
      stockSuccessRate: ((productsWithStock.length / formattedProducts.length) * 100).toFixed(2),
      sections: sections,
      brands: brands,
      genres: genres,
      groups: allGroups,
      prices: allPrices,
      stock: stock,
      rawProducts: allProducts
    };
    
    const varejoFacilFilePath = path.join(dataDir, 'varejo-facil-sync.json');
    await fs.writeFile(varejoFacilFilePath, JSON.stringify(varejoFacilData, null, 2));
    console.log('?? Arquivo varejo-facil-sync.json salvo com dados completos');
    
    console.log('✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('📊 RESUMO FINAL DA SINCRONIZAÇÃO:');
    console.log(`📦 PRODUTOS TOTAIS: ${finalProducts.length} produtos formatados (TODOS MANTIDOS)`);
    console.log(`💰 PREÇOS: ${productsWithPrice.length} com preço | ${productsWithoutPrice.length} sem preço (${((productsWithPrice.length / finalProducts.length) * 100).toFixed(1)}%)`);
    console.log(`📦 ESTOQUE: ${productsWithStock.length} com estoque | ${productsOutOfStock.length} sem estoque (${((productsWithStock.length / finalProducts.length) * 100).toFixed(1)}%)`);
    console.log(`📊 VALIDAÇÃO: ${productsWithStock.length + productsOutOfStock.length} = ${finalProducts.length} ✅`);
    console.log(`📊 CATEGORIAS: ${sections.length} seções | ${brands.length} marcas | ${genres.length} gêneros`);
    console.log(`🔗 GRUPOS: ${allGroups.length} grupos de produtos`);
    console.log(`💲 PREÇOS COLETADOS: ${allPrices.length} registros de preço`);
    console.log(`📋 ESTOQUES COLETADOS: ${stock.length} registros de estoque`);
    console.log(`🔄 LOTES PROCESSADOS: ${batchCount} lotes de dados`);
    console.log(`💾 ARQUIVOS SALVOS:`);
    console.log(`   📄 Produtos: ${productsFilePath}`);
    console.log(`   📄 Dados completos: ${varejoFacilFilePath}`);
    console.log('🎉 SINCRONIZAÇÃO FINALIZADA - PROCESSO CONCLUÍDO!');
    console.log('🎯 RETORNANDO DADOS FINAIS PARA O SISTEMA...');
    
    return {
      success: true,
      totalProducts: finalProducts.length,
      productsWithPrice: productsWithPrice.length,
      productsWithZeroPrice: productsWithoutPrice.length,
      productsWithStock: productsWithStock.length,
      productsOutOfStock: productsOutOfStock.length,
      priceSuccessRate: ((productsWithPrice.length / formattedProducts.length) * 100).toFixed(2),
      stockSuccessRate: ((productsWithStock.length / formattedProducts.length) * 100).toFixed(2),
      totalSections: sections.length,
      totalBrands: brands.length,
      totalGenres: genres.length,
      totalGroups: allGroups.length,
      totalPricesCollected: allPrices.length,
      totalStockCollected: stock.length,
      lastSync: varejoFacilData.lastSync
    };
  } catch (error) {
    console.error('? Erro durante a sincronização:', error);
    throw error;
  }
}

// Função para buscar todos os saldos de estoque em lotes com validação
async function buscarTodosEstoquesEmLotes(batchSize = 100) {
  let allStock = [];
  let start = 0;
  let batchCount = 0;
  let totalStock = null;
  let hasMore = true;
  
  // Validação de mudanças abruptas
  let previousTotalWithStock = 0;
  const fs = require('fs').promises;
  const path = require('path');
  
  // Tentar carregar histórico do último sync
  const historyPath = path.join(process.cwd(), 'stock-history.json');
  try {
    const history = JSON.parse(await fs.readFile(historyPath, 'utf8'));
    previousTotalWithStock = history.totalWithStock || 0;
    console.log(`📊 Último sync teve ${previousTotalWithStock} produtos com estoque`);
  } catch (error) {
    console.log('📊 Nenhum histórico de estoque encontrado (primeira execução)');
  }
  
  while (hasMore) {
    batchCount++;
    console.log(`?? Buscando lote de estoque ${batchCount} (start=${start}, end=${start + batchSize - 1})...`);
    try {
      const stockData = await makeVarejoFacilRequest(`/api/v1/estoque/saldos?start=${start}&count=${batchSize}`);
      if (stockData.items && stockData.items.length > 0) {
        // Validar se há dados estranhos no lote
        const itemsWithStock = stockData.items.filter(item => item.saldo > 0);
        const totalSaldos = stockData.items.reduce((sum, item) => sum + (item.saldo || 0), 0);
        
        console.log(`? Lote ${batchCount}: ${stockData.items.length} saldos (${itemsWithStock.length} com estoque > 0)`);
        console.log(`   - Soma total de saldos do lote: ${totalSaldos}`);
        
        allStock = allStock.concat(stockData.items);
        
        if (totalStock === null && typeof stockData.total === 'number') {
          totalStock = stockData.total;
          console.log(`?? Total de estoques informado pela API: ${totalStock}`);
        }
        
        console.log(`? Progresso: ${allStock.length}/${totalStock || '?'} saldos coletados`);
        
        start += batchSize;
        if (totalStock !== null && allStock.length >= totalStock) {
          hasMore = false;
          console.log('?? Todos os estoques coletados conforme total da API. Finalizando...');
        } else if (stockData.items.length < batchSize) {
          hasMore = false;
          console.log('?? Último lote de estoque recebido. Finalizando...');
        }
      } else {
        hasMore = false;
        console.log(`?? Nenhum saldo de estoque encontrado no lote ${batchCount}. Finalizando...`);
      }
    } catch (error) {
      hasMore = false;
      console.error(`? Erro ao buscar lote de estoque ${batchCount}:`, error);
    }
  }
  
  // Validação final e detecção de anomalias
  const finalWithStock = allStock.filter(item => item.saldo > 0).length;
  const totalSaldos = allStock.reduce((sum, item) => sum + (item.saldo || 0), 0);
  
  console.log(`\n🔍 ANÁLISE FINAL DE ESTOQUE:`);
  console.log(`   - Total de registros: ${allStock.length}`);
  console.log(`   - Produtos com estoque > 0: ${finalWithStock}`);
  console.log(`   - Soma total de todos os saldos: ${totalSaldos}`);
  
  // Detectar mudanças abruptas
  if (previousTotalWithStock > 0) {
    const percentChange = Math.abs((finalWithStock - previousTotalWithStock) / previousTotalWithStock) * 100;
    if (percentChange > 20) {
      console.log(`⚠️ MUDANÇA ABRUPTA DETECTADA!`);
      console.log(`   - Anterior: ${previousTotalWithStock} produtos com estoque`);
      console.log(`   - Atual: ${finalWithStock} produtos com estoque`);
      console.log(`   - Mudança: ${percentChange.toFixed(1)}%`);
      console.log(`   - Diferença: ${finalWithStock - previousTotalWithStock}`);
    } else {
      console.log(`✅ Mudança de estoque dentro do esperado: ${percentChange.toFixed(1)}%`);
    }
  }
  
  // Salvar histórico
  try {
    await fs.writeFile(historyPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalRecords: allStock.length,
      totalWithStock: finalWithStock,
      totalSaldos: totalSaldos
    }, null, 2));
  } catch (error) {
    console.log('⚠️ Não foi possível salvar histórico de estoque');
  }
  
  console.log(`?? Total de saldos de estoque coletados: ${allStock.length}`);
  return allStock;
}

if (require.main === module) {
  syncAndFormatProducts()
    .then(result => {
      console.log('🎯 SCRIPT EXECUTADO COM SUCESSO!');
      console.log('📋 RESULTADO FINAL:');
      console.log(`   ✅ Total de produtos sincronizados: ${result.totalProducts || 'N/A'}`);
      console.log(`   📂 Total de seções: ${result.totalSections || 'N/A'}`);
      console.log(`   🏷️ Total de marcas: ${result.totalBrands || 'N/A'}`);
      console.log(`   🎨 Total de gêneros: ${result.totalGenres || 'N/A'}`);
      console.log('🏁 PROCESSO FINALIZADO - SCRIPT TERMINOU');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ ERRO CRÍTICO NA SINCRONIZAÇÃO:', error.message || error);
      console.error('📍 Stack trace:', error.stack);
      console.log('💥 PROCESSO FINALIZADO COM ERRO - SCRIPT TERMINOU');
      process.exit(1);
    });
}

module.exports = {
  syncAndFormatProducts
};