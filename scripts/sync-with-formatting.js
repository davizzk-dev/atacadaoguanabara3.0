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
  // Implemente aqui a lógica de busca de preços
  return [];
}

function formatProductForCatalogFast(
  varejoProduct,
  pricesByProductId,
  pricesByIdExterno,
  pricesByCodigoInterno,
  stockByProductId,
  sectionsById,
  brandsById,
  genresById
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

  const productStock = stockByProductId.get(varejoProduct.id);
  const stockQuantity = productStock?.saldo || 0;
  const inStock = stockQuantity > 0;

  // Busca rápida de seção, marca e gênero usando Map
  const section = sectionsById.get(varejoProduct.secaoId);
  const brand = brandsById.get(varejoProduct.marcaId);
  const genre = genresById.get(varejoProduct.generoId);

  const category = section?.descricao || 'GERAL';
  const brandName = brand?.descricao || 'Sem marca';
  const genreName = genre?.descricao || '';

  // Gerar imagem e tags de forma otimizada
  const image = varejoProduct.imagem && varejoProduct.imagem.trim() ? 
    varejoProduct.imagem : 
    `https://images.unsplash.com/photo-1619983081563-430f8b5a893c?auto=format&fit=crop&w=400&q=80`;
  
  const tags = [
    category.toLowerCase(),
    brandName.toLowerCase(),
    genreName.toLowerCase(),
    'varejo-facil'
  ].filter(tag => tag && tag !== 'sem marca');

  // Corrige a lógica para garantir que os preços escalonados sejam salvos corretamente
  return {
    id: varejoProduct.id.toString(),
    name: varejoProduct.descricao || 'Produto sem nome',
    price: parseFloat(productPrice?.precoVenda1 || 0),
    originalPrice: parseFloat(productPrice?.precoVenda1 || 0),
    image: image,
    category: category,
    description: varejoProduct.descricaoReduzida || varejoProduct.descricao || 'Descrição não disponível',
    stock: stockQuantity,
    inStock: inStock,
    rating: 4.5,
    reviews: Math.floor(Math.random() * 100) + 10,
    brand: brandName,
    unit: varejoProduct.unidadeDeVenda || 'un',
    tags: tags,
    prices: {
      price1: productPrice && productPrice.precoVenda1 !== undefined ? parseFloat(productPrice.precoVenda1) : 0,
      offerPrice1: productPrice && productPrice.precoOferta1 !== undefined ? parseFloat(productPrice.precoOferta1) : 0,
      price2: productPrice && productPrice.precoVenda2 !== undefined ? parseFloat(productPrice.precoVenda2) : 0,
      offerPrice2: productPrice && productPrice.precoOferta2 !== undefined ? parseFloat(productPrice.precoOferta2) : 0,
      minQuantityPrice2: productPrice && productPrice.quantidadeMinimaPreco2 !== undefined ? parseInt(productPrice.quantidadeMinimaPreco2) : 0
    },
    varejoFacilData: {
      codigoInterno: varejoProduct.codigoInterno,
      idExterno: varejoProduct.idExterno,
      secaoId: varejoProduct.secaoId,
      marcaId: varejoProduct.marcaId,
      generoId: varejoProduct.generoId,
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
  return (
    productPrice.precoVenda1 ||
    productPrice.precoOferta1 ||
    productPrice.precoVenda2 ||
    productPrice.precoOferta2 ||
    productPrice.precoVenda3 ||
    productPrice.precoOferta3 ||
    undefined
  );
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

  // 4. Buscar TODOS os preços em lotes
  const pricesData = await makeVarejoFacilRequest('/api/v1/produto/precos?count=500');
  const prices = pricesData.items || [];
  console.log(`? ${prices.length} preços encontrados no total`);

  // 5. Buscar TODOS os saldos de estoque em lotes usando função robusta
  console.log('?? Buscando todos os saldos de estoque em lotes com controle pelo total da API...');
  const stock = await buscarTodosEstoquesEmLotes(100);
  console.log(`? ${stock.length} saldos de estoque encontrados no total (via lotes)`);

    // 6. Buscar produtos em lotes de 500 e coletar todos os produtoId
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
          allPrices = allPrices.concat(pricesData.items);
          console.log(`? Lote de preços: ${pricesData.items.length} encontrados (Total: ${allPrices.length})`);
        } else {
          console.log('?? Nenhum preço encontrado para lote de produtoIds.');
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
    
    // Indexar preços
    allPrices.forEach(price => {
      if (price.produtoId) pricesByProductId.set(price.produtoId, price);
      if (price.idExterno && price.idExterno.trim()) pricesByIdExterno.set(price.idExterno.trim(), price);
      if (price.codigoInterno && price.codigoInterno.trim()) pricesByCodigoInterno.set(price.codigoInterno.trim(), price);
    });
    
    // Indexar estoque
    stock.forEach(stockItem => {
      if (stockItem.produtoId) {
        // Se já existe estoque para este produto, somar os saldos (caso tenha múltiplos locais)
        const existingStock = stockByProductId.get(stockItem.produtoId);
        if (existingStock) {
          existingStock.saldo += stockItem.saldo;
        } else {
          stockByProductId.set(stockItem.produtoId, stockItem);
        }
      }
    });
    
    // Indexar seções, marcas e gêneros
    sections.forEach(section => sectionsById.set(section.id, section));
    brands.forEach(brand => brandsById.set(brand.id, brand));
    genres.forEach(genre => genresById.set(genre.id, genre));
    
    console.log('? Índices criados:');
    console.log(`   - ${pricesByProductId.size} preços por produtoId`);
    console.log(`   - ${pricesByIdExterno.size} preços por idExterno`);
    console.log(`   - ${stockByProductId.size} estoques por produtoId`);

    // 8. Formatar produtos para o catálogo
    console.log('?? Formatando produtos para o catálogo...');
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
        genresById
      );
    });

    // Relatório final: IDs dos produtos sem preço ou não encontrados
    const productsWithoutPrice = formattedProducts.filter(p => !p.price || p.price === 0);
    const productsWithStock = formattedProducts.filter(p => p.inStock);
    const productsOutOfStock = formattedProducts.filter(p => !p.inStock);
    const productsWithPrice = formattedProducts.filter(p => p.price && p.price > 0);

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
                const precoAntigo = product.price;
                product.price = priceObj.precoVenda1 || 0;
                product.originalPrice = priceObj.precoVenda1 || 0;
                product.varejoFacilData.precos = priceObj;
                
                // Atualiza também no array principal formattedProducts
                const idx = formattedProducts.findIndex(p => p.id === productId);
                if (idx !== -1) {
                  formattedProducts[idx].price = product.price;
                  formattedProducts[idx].originalPrice = product.originalPrice;
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

    // 11. Salvar no products.json
    console.log('?? Salvando produtos formatados no products.json...');
    const dataDir = path.join(process.cwd(), 'data');
    const productsFilePath = path.join(dataDir, 'products.json');
    
    // Criar diretório data se não existir
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      console.log('Diretório data já existe');
    }
    
    await fs.writeFile(productsFilePath, JSON.stringify(formattedProducts, null, 2));
    console.log(`?? Arquivo products.json salvo com ${formattedProducts.length} produtos`);
    
    // 12. Salvar dados completos do Varejo Fácil
    const varejoFacilData = {
      lastSync: new Date().toISOString(),
      totalProducts: formattedProducts.length,
      totalSections: sections.length,
      totalBrands: brands.length,
      totalGenres: genres.length,
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
      prices: allPrices,
      stock: stock,
      rawProducts: allProducts
    };
    
    const varejoFacilFilePath = path.join(dataDir, 'varejo-facil-sync.json');
    await fs.writeFile(varejoFacilFilePath, JSON.stringify(varejoFacilData, null, 2));
    console.log('?? Arquivo varejo-facil-sync.json salvo com dados completos');
    
    console.log('? Sincronização concluída!');
    console.log('?? Resumo Final:');
    console.log(`   - Produtos formatados: ${formattedProducts.length}`);
    console.log(`   - Produtos com preço: ${productsWithPrice.length}`);
    console.log(`   - Produtos sem preço: ${productsWithoutPrice.length}`);
    console.log(`   - Taxa de sucesso de preços: ${((productsWithPrice.length / formattedProducts.length) * 100).toFixed(2)}%`);
    console.log(`   - Produtos em estoque: ${productsWithStock.length}`);
    console.log(`   - Produtos sem estoque: ${productsOutOfStock.length}`);
    console.log(`   - Taxa de produtos em estoque: ${((productsWithStock.length / formattedProducts.length) * 100).toFixed(2)}%`);
    console.log(`   - Seções: ${sections.length}`);
    console.log(`   - Marcas: ${brands.length}`);
    console.log(`   - Gêneros: ${genres.length}`);
    console.log(`   - Preços coletados: ${allPrices.length}`);
    console.log(`   - Estoques coletados: ${stock.length}`);
    console.log(`   - Lotes processados: ${batchCount}`);
    console.log(`   - Arquivo salvo: ${productsFilePath}`);
    console.log(`   - Dados completos: ${varejoFacilFilePath}`);
    
    return {
      success: true,
      totalProducts: formattedProducts.length,
      productsWithPrice: productsWithPrice.length,
      productsWithZeroPrice: productsWithoutPrice.length,
      productsWithStock: productsWithStock.length,
      productsOutOfStock: productsOutOfStock.length,
      priceSuccessRate: ((productsWithPrice.length / formattedProducts.length) * 100).toFixed(2),
      stockSuccessRate: ((productsWithStock.length / formattedProducts.length) * 100).toFixed(2),
      totalSections: sections.length,
      totalBrands: brands.length,
      totalGenres: genres.length,
      totalPricesCollected: allPrices.length,
      totalStockCollected: stock.length,
      lastSync: varejoFacilData.lastSync
    };
  } catch (error) {
    console.error('? Erro durante a sincronização:', error);
    throw error;
  }
}

// Função para buscar todos os saldos de estoque em lotes
async function buscarTodosEstoquesEmLotes(batchSize = 100) {
  let allStock = [];
  let start = 0;
  let batchCount = 0;
  let totalStock = null;
  let hasMore = true;
  while (hasMore) {
    batchCount++;
    console.log(`?? Buscando lote de estoque ${batchCount} (start=${start}, end=${start + batchSize - 1})...`);
    try {
      const stockData = await makeVarejoFacilRequest(`/api/v1/estoque/saldos?start=${start}&count=${batchSize}`);
      if (stockData.items && stockData.items.length > 0) {
        allStock = allStock.concat(stockData.items);
        if (totalStock === null && typeof stockData.total === 'number') {
          totalStock = stockData.total;
          console.log(`?? Total de estoques informado pela API: ${totalStock}`);
        }
        console.log(`? Lote de estoque ${batchCount}: ${stockData.items.length} saldos (Total: ${allStock.length})`);
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
  console.log(`?? Total de saldos de estoque coletados: ${allStock.length}`);
  return allStock;
}

if (require.main === module) {
  syncAndFormatProducts()
    .then(result => {
      console.log('?? Sincronização concluída com sucesso!');
      console.log('Resultado:', result);
    })
    .catch(error => {
      console.error('? Erro na sincronização:', error);
      process.exit(1);
    });
}

module.exports = {
  syncAndFormatProducts
};