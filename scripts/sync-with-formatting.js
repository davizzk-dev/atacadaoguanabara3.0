const fs = require('fs').promises;
const path = require('path');

const VAREJO_FACIL_CONFIG = {
  baseUrl: 'https://atacadaoguanabara.varejofacil.com',
  apiKey: '2625e98175832a17a954db9beb60306a'
}

// Função para fazer requisições para a API do Varejo Fácil
async function makeVarejoFacilRequest(endpoint, options = {}) {
  const url = `${VAREJO_FACIL_CONFIG.baseUrl}${endpoint}`
  
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': VAREJO_FACIL_CONFIG.apiKey,
    ...options.headers
  }

  const config = {
    ...options,
    headers
  }

  try {
    console.log(`🔍 Fazendo requisição para: ${url}`)
    const response = await fetch(url, config)
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro na requisição: ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json()
      console.log('✅ Resposta JSON válida!')
      return json
    } else {
      const text = await response.text()
      console.log(`📋 Resposta (primeiros 500 chars): ${text.substring(0, 500)}`)
      return text
    }
  } catch (error) {
    console.error(`❌ Erro na requisição para ${endpoint}:`, error.message)
    throw error
  }
}

// Função para buscar todos os preços em lotes
async function getAllPrices() {
  console.log('💰 Buscando todos os preços em lotes...')
  let allPrices = []
  let start = 0
  const batchSize = 500
  let hasMore = true
  let batchCount = 0
  let maxRetries = 3
  let total = null
  while (hasMore) {
    batchCount++
    const end = start + batchSize - 1
    console.log(`💰 Buscando lote de preços ${batchCount} (start=${start}, end=${end})...`)
    let retryCount = 0
    let success = false
    while (retryCount < maxRetries && !success) {
      try {
        const pricesData = await makeVarejoFacilRequest(`/api/v1/produto/precos?start=${start}&count=${batchSize}`)
        if (total === null && typeof pricesData.total === 'number') {
          total = pricesData.total
          console.log(`📊 API indica total de preços: ${total}`)
        }
        if (pricesData.items && pricesData.items.length > 0) {
          allPrices = allPrices.concat(pricesData.items)
          console.log(`✅ Lote de preços ${batchCount}: ${pricesData.items.length} preços (Total: ${allPrices.length})`)
          if (pricesData.items.length < batchSize || (total !== null && allPrices.length >= total)) {
            hasMore = false
            console.log(`🏁 Último lote de preços recebido. Finalizando...`)
          } else {
            start += batchSize
          }
          success = true
        } else {
          hasMore = false
          console.log(`🏁 Nenhum preço encontrado no lote ${batchCount}. Finalizando...`)
          success = true
        }
      } catch (error) {
        retryCount++
        console.error(`❌ Erro ao buscar lote de preços ${batchCount} (tentativa ${retryCount}/${maxRetries}):`, error)
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          console.error(`❌ Falha após ${maxRetries} tentativas. Pulando este lote.`)
          hasMore = false
        }
      }
    }
  }
  // Verificação final: garantir que todos os preços foram coletados
  if (total !== null && allPrices.length !== total) {
    console.warn(`⚠️ ATENÇÃO: Foram coletados ${allPrices.length} preços, mas a API indicou total de ${total}. Pode haver dados faltando!`)
  } else if (total !== null) {
    console.log(`✅ Todos os preços coletados conforme total da API (${total})`)
  }
  console.log(`📊 Total de preços coletados: ${allPrices.length}`)
  return allPrices
}

// Função para buscar todos os saldos de estoque em lotes
async function getAllStock() {
  console.log('📦 Buscando todos os saldos de estoque em lotes...')
  let allStock = []
  let start = 0
  const batchSize = 500
  let hasMore = true
  let batchCount = 0
  let maxRetries = 3

  while (hasMore) {
    batchCount++
    const end = start + batchSize - 1
    console.log(`📦 Buscando lote de estoque ${batchCount} (start=${start}, end=${end})...`)
    let retryCount = 0
    let success = false
    while (retryCount < maxRetries && !success) {
      try {
        const stockData = await makeVarejoFacilRequest(`/api/v1/estoque/saldos?start=${start}&count=${batchSize}`)
        if (stockData.items && stockData.items.length > 0) {
          allStock = allStock.concat(stockData.items)
          console.log(`✅ Lote de estoque ${batchCount}: ${stockData.items.length} saldos (Total: ${allStock.length})`)
          if (stockData.items.length < batchSize) {
            hasMore = false
            console.log(`🏁 Último lote de estoque recebido. Finalizando...`)
          } else {
            start += batchSize
          }
          success = true
        } else {
          hasMore = false
          console.log(`🏁 Nenhum saldo de estoque encontrado no lote ${batchCount}. Finalizando...`)
          success = true
        }
      } catch (error) {
        retryCount++
        console.error(`❌ Erro ao buscar lote de estoque ${batchCount} (tentativa ${retryCount}/${maxRetries}):`, error)
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          console.error(`❌ Falha após ${maxRetries} tentativas. Pulando este lote.`)
          hasMore = false
        }
      }
    }
  }
  console.log(`📊 Total de saldos de estoque coletados: ${allStock.length}`)
  return allStock
}

// Função OTIMIZADA para formatar produto (usando índices Map - muito mais rápida!)
function formatProductForCatalogFast(varejoProduct, pricesByProductId, pricesByIdExterno, pricesByCodigoInterno, stockByProductId, sectionsById, brandsById, genresById) {
  // BUSCA SUPER RÁPIDA usando Map.get() ao invés de Array.find()
  let productPrice = pricesByProductId.get(varejoProduct.id)
  let price = 0
  let priceSource = ''

  // Tenta pegar qualquer preço válido do objeto de preço
  function getAnyPrice(priceObj) {
    if (!priceObj) return 0
    // Tenta todos os campos possíveis
    return (
      priceObj.precoVenda1 ||
      priceObj.precoOferta1 ||
      priceObj.precoVenda2 ||
      priceObj.precoOferta2 ||
      priceObj.precoVenda3 ||
      priceObj.precoOferta3 ||
      priceObj.custoProduto ||
      priceObj.precoMedioDeReposicao ||
      priceObj.precoFiscalDeReposicao ||
      0
    )
  }

  // 1. produtoId
  if (productPrice) {
    price = getAnyPrice(productPrice)
    if (price) priceSource = 'produtoId'
  }
  // 2. idExterno
  if (!price && varejoProduct.idExterno && varejoProduct.idExterno.trim()) {
    productPrice = pricesByIdExterno.get(varejoProduct.idExterno.trim())
    price = getAnyPrice(productPrice)
    if (price) priceSource = 'idExterno'
  }
  // 3. codigoInterno
  if (!price && varejoProduct.codigoInterno && varejoProduct.codigoInterno.trim()) {
    productPrice = pricesByCodigoInterno.get(varejoProduct.codigoInterno.trim())
    price = getAnyPrice(productPrice)
    if (price) priceSource = 'codigoInterno'
  }

  // 4. Busca forçada: procurar qualquer preço para o produtoId
  if (!price) {
    // Busca em todos os preços por produtoId
    for (const p of pricesByProductId.values()) {
      if (p.produtoId === varejoProduct.id) {
        price = getAnyPrice(p)
        if (price) {
          priceSource = 'forcada-produtoId'
          break
        }
      }
    }
  }

  // BUSCA SUPER RÁPIDA de estoque usando Map.get()
  const productStock = stockByProductId.get(varejoProduct.id)
  const stockQuantity = productStock?.saldo || 0
  const inStock = stockQuantity > 0

  // Busca rápida de seção, marca e gênero usando Map
  const section = sectionsById.get(varejoProduct.secaoId)
  const brand = brandsById.get(varejoProduct.marcaId) 
  const genre = genresById.get(varejoProduct.generoId)

  const category = section?.descricao || 'GERAL'
  const brandName = brand?.descricao || 'Sem marca'
  const genreName = genre?.descricao || ''

  // Gerar imagem e tags de forma otimizada
  // Não remover o link da imagem se existir
  const image = varejoProduct.imagem && varejoProduct.imagem.trim() ? varejoProduct.imagem : `https://images.unsplash.com/photo-1619983081563-430f8b5a893c?auto=format&fit=crop&w=400&q=80`
  const tags = [
    category.toLowerCase(),
    brandName.toLowerCase(), 
    genreName.toLowerCase(),
    'varejo-facil'
  ].filter(tag => tag && tag !== 'sem marca')

  return {
    id: varejoProduct.id.toString(),
    name: varejoProduct.descricao || 'Produto sem nome',
    price: parseFloat(price) || 0,
    originalPrice: parseFloat(price) || 0,
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
    // Dados essenciais do Varejo Fácil (removido alguns campos para performance)
    varejoFacilData: {
      codigoInterno: varejoProduct.codigoInterno,
      idExterno: varejoProduct.idExterno,
      secaoId: varejoProduct.secaoId,
      marcaId: varejoProduct.marcaId,
      generoId: varejoProduct.generoId,
      ativoNoEcommerce: varejoProduct.ativoNoEcommerce,
      dataInclusao: varejoProduct.dataInclusao,
      dataAlteracao: varejoProduct.dataAlteracao,
      // Dados de estoque do Varejo Fácil
      estoque: {
        saldo: stockQuantity,
        lojaId: productStock?.lojaId,
        localId: productStock?.localId,
        criadoEm: productStock?.criadoEm,
        atualizadoEm: productStock?.atualizadoEm
      }
    }
  }
}

// Função original (mantida para compatibilidade)  
function formatProductForCatalog(varejoProduct, prices = [], sections = [], brands = [], genres = []) {
  // CORREÇÃO: Buscar preço onde produtoId corresponde ao ID do produto
  let productPrice = prices.find(p => p.produtoId === varejoProduct.id)
  let price = productPrice?.precoVenda1 || 0
  let priceSource = 'produtoId'
  
  // Se não encontrou preço, tentar outras estratégias
  if (!price) {
    // Tentativa 2: Buscar por idExterno se existir
    if (varejoProduct.idExterno && varejoProduct.idExterno.trim() !== '') {
      productPrice = prices.find(p => p.idExterno === varejoProduct.idExterno)
      price = productPrice?.precoVenda1 || 0
      if (price) priceSource = 'idExterno'
    }
  }
  
  if (!price) {
    // Tentativa 3: Buscar por código interno se existir e não for só espaços
    if (varejoProduct.codigoInterno && varejoProduct.codigoInterno.trim() !== '') {
      productPrice = prices.find(p => p.codigoInterno === varejoProduct.codigoInterno)
      price = productPrice?.precoVenda1 || 0
      if (price) priceSource = 'codigoInterno'
    }
  }
  
  // Debug logging para entender melhor os produtos sem preço
  if (!price && Math.random() < 0.02) { // 2% dos produtos sem preço para debug
    console.log(`🔍 Debug produto sem preço:`)
    console.log(`   ID: ${varejoProduct.id}`)
    console.log(`   Nome: "${varejoProduct.descricao}"`)
    console.log(`   IdExterno: "${varejoProduct.idExterno}"`)
    console.log(`   CodigoInterno: "${varejoProduct.codigoInterno}"`)
    // Verificar se existe algum preço com ID similar
    const similarPrices = prices.filter(p => 
      Math.abs(p.produtoId - varejoProduct.id) <= 5 || 
      p.id === varejoProduct.id
    )
    if (similarPrices.length > 0) {
      console.log(`   Preços similares encontrados:`, similarPrices.slice(0, 2).map(p => ({
        id: p.id, 
        produtoId: p.produtoId, 
        preco: p.precoVenda1
      })))
    }
  }
  
  // Log de sucesso ocasional
  if (price && Math.random() < 0.01) {
    console.log(`✅ Preço encontrado via ${priceSource}: Produto ID=${varejoProduct.id}, Preço=R$ ${price.toFixed(2)}`)
  }
  
  // Se ainda não tem preço, deixar como 0 para identificarmos quais produtos não têm preço
  // if (!price && varejoProduct.custoMedio) {
  //   price = varejoProduct.custoMedio * 1.3 // 30% de margem
  // }
  
  // Se ainda não tem preço, deixar como 0 para identificarmos quais produtos não têm preço
  // if (!price) {
  //   // Tentar determinar um preço baseado na categoria/seção
  //   const section = sections.find(s => s.id === varejoProduct.secaoId)
  //   const category = section?.descricao || 'GERAL'
  //   
  //   // Preços baseados em categorias comuns
  //   const categoryPrices = {
  //     'MERCEARIA': 8.50,
  //     'RESFRIADOS': 15.00,
  //     'BEBIDAS': 6.00,
  //     'LIMPEZA': 12.00,
  //     'HIGIENE': 8.00,
  //     'CONGELADOS': 18.00,
  //     'HORTIFRUTI': 5.00,
  //     'PADARIA': 4.50,
  //     'CARNES': 25.00,
  //     'LATICÍNIOS': 8.00,
  //     'ENLATADOS': 6.50,
  //     'BISCOITOS': 4.00,
  //     'CHOCOLATES': 5.50,
  //     'SALGADINHOS': 3.50,
  //     'MOLHOS': 7.00,
  //     'TEMPEROS': 4.00,
  //     'GERAL': 10.00
  //   }
  //   
  //   // Buscar preço baseado na categoria
  //   const categoryKey = Object.keys(categoryPrices).find(key => 
  //     category.toUpperCase().includes(key)
  //   )
  //   
  //   if (categoryKey) {
  //     price = categoryPrices[categoryKey]
  //   } else {
  //     // Se não encontrou categoria específica, usar preço médio
  //     price = 10.00
  //   }
  // }
  
  // Encontrar seção
  const section = sections.find(s => s.id === varejoProduct.secaoId)
  const category = section?.descricao || 'GERAL'
  
  // Encontrar marca
  const brand = brands.find(b => b.id === varejoProduct.marcaId)
  const brandName = brand?.descricao || 'Sem marca'
  
  // Encontrar gênero
  const genre = genres.find(g => g.id === varejoProduct.generoId)
  const genreName = genre?.descricao || ''
  
  // Gerar imagem placeholder se não existir
  const image = varejoProduct.imagem || `https://images.unsplash.com/photo-1619983081563-430f8b5a893c?auto=format&fit=crop&w=400&q=80`
  
  // Gerar tags baseadas na descrição
  const tags = [
    ...(category ? [category.toLowerCase()] : []),
    ...(brandName ? [brandName.toLowerCase()] : []),
    ...(genreName ? [genreName.toLowerCase()] : []),
    'varejo-facil'
  ].filter(Boolean)

  return {
    id: varejoProduct.id.toString(),
    name: varejoProduct.descricao || 'Produto sem nome',
    price: parseFloat(price) || 0,
    originalPrice: parseFloat(price) || 0,
    image: image,
    category: category,
    description: varejoProduct.descricaoReduzida || varejoProduct.descricao || 'Descrição não disponível',
    stock: varejoProduct.estoqueDoProduto?.[0]?.estoqueMaximo || 10,
    inStock: true,
    rating: 4.5,
    reviews: Math.floor(Math.random() * 100) + 10,
    brand: brandName,
    unit: varejoProduct.unidadeDeVenda || 'un',
    tags: tags,
    // Dados adicionais do Varejo Fácil
    varejoFacilData: {
      codigoInterno: varejoProduct.codigoInterno,
      idExterno: varejoProduct.idExterno,
      secaoId: varejoProduct.secaoId,
      marcaId: varejoProduct.marcaId,
      generoId: varejoProduct.generoId,
      grupoId: varejoProduct.grupoId,
      subgrupoId: varejoProduct.subgrupoId,
      unidadeDeCompra: varejoProduct.unidadeDeCompra,
      unidadeDeTransferencia: varejoProduct.unidadeDeTransferencia,
      pesoBruto: varejoProduct.pesoBruto,
      pesoLiquido: varejoProduct.pesoLiquido,
      altura: varejoProduct.altura,
      largura: varejoProduct.largura,
      comprimento: varejoProduct.comprimento,
      ativoNoEcommerce: varejoProduct.ativoNoEcommerce,
      dataInclusao: varejoProduct.dataInclusao,
      dataAlteracao: varejoProduct.dataAlteracao
    }
  }
}

// Função para sincronizar e formatar produtos
async function syncAndFormatProducts() {
  try {
    console.log('🔄 Iniciando sincronização completa do Varejo Fácil...')
    
    // 1. Buscar seções
    console.log('📂 Buscando seções...')
  const sectionsData = await makeVarejoFacilRequest('/api/v1/produto/secoes?count=500')
  const sections = sectionsData.items || []
  console.log(`✅ ${sections.length} seções encontradas`)

  // 2. Buscar marcas
  console.log('🏷️ Buscando marcas...')
  const brandsData = await makeVarejoFacilRequest('/api/v1/produto/marcas?count=500')
  const brands = brandsData.items || []
  console.log(`✅ ${brands.length} marcas encontradas`)

  // 3. Buscar gêneros
  console.log('📚 Buscando gêneros...')
  const genresData = await makeVarejoFacilRequest('/api/v1/produto/generos?count=500')
  const genres = genresData.items || []
  console.log(`✅ ${genres.length} gêneros encontrados`)

    // 4. Buscar TODOS os preços em lotes
    const prices = await getAllPrices()
    console.log(`✅ ${prices.length} preços encontrados no total`)

    // 5. Buscar TODOS os saldos de estoque em lotes
    const stock = await getAllStock()
    console.log(`✅ ${stock.length} saldos de estoque encontrados no total`)

    // 6. Buscar produtos em lotes de 500
    console.log('📦 Buscando produtos em lotes de 500...')
    let allProducts = []
    let start = 0
    const batchSize = 500
    let hasMore = true
    let batchCount = 0

    while (hasMore) {
      batchCount++
      console.log(`📦 Buscando lote ${batchCount} (${start} - ${start + batchSize - 1})...`)
      try {
        const productsData = await makeVarejoFacilRequest(`/api/v1/produto/produtos?start=${start}&count=${batchSize}`)
        if (productsData.items && productsData.items.length > 0) {
          allProducts = allProducts.concat(productsData.items)
          console.log(`✅ Lote ${batchCount}: ${productsData.items.length} produtos (Total: ${allProducts.length})`)
          // Se recebemos menos produtos que o batchSize, chegamos ao fim
          if (productsData.items.length < batchSize) {
            hasMore = false
            console.log(`🏁 Último lote recebido. Finalizando sincronização...`)
          } else {
            start += batchSize
          }
        } else {
          hasMore = false
          console.log(`🏁 Nenhum produto encontrado no lote ${batchCount}. Finalizando...`)
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar lote ${batchCount}:`, error)
        hasMore = false
      }
    }

    console.log(`✅ Total de produtos encontrados: ${allProducts.length}`)

    // 7. Criar índices para busca rápida (OTIMIZAÇÃO CRÍTICA!)
    console.log('⚡ Criando índices para busca rápida...')
    const pricesByProductId = new Map()
    const pricesByIdExterno = new Map()
    const pricesByCodigoInterno = new Map()
    const stockByProductId = new Map()
    const sectionsById = new Map()
    const brandsById = new Map()
    const genresById = new Map()
    
    // Indexar preços
    prices.forEach(price => {
      if (price.produtoId) pricesByProductId.set(price.produtoId, price)
      if (price.idExterno && price.idExterno.trim()) pricesByIdExterno.set(price.idExterno.trim(), price)
      if (price.codigoInterno && price.codigoInterno.trim()) pricesByCodigoInterno.set(price.codigoInterno.trim(), price)
    })
    
    // Indexar estoque
    stock.forEach(stockItem => {
      if (stockItem.produtoId) {
        // Se já existe estoque para este produto, somar os saldos (caso tenha múltiplos locais)
        const existingStock = stockByProductId.get(stockItem.produtoId)
        if (existingStock) {
          existingStock.saldo += stockItem.saldo
        } else {
          stockByProductId.set(stockItem.produtoId, stockItem)
        }
      }
    })
    
    // Indexar seções, marcas e gêneros
    sections.forEach(section => sectionsById.set(section.id, section))
    brands.forEach(brand => brandsById.set(brand.id, brand))
    genres.forEach(genre => genresById.set(genre.id, genre))
    
    console.log(`✅ Índices criados:`)
    console.log(`   - ${pricesByProductId.size} preços por produtoId`)
    console.log(`   - ${pricesByIdExterno.size} preços por idExterno`)
    console.log(`   - ${stockByProductId.size} estoques por produtoId`)

    // 8. Formatar produtos para o catálogo (MUITO MAIS RÁPIDO!)
    console.log('🔄 Formatando produtos para o catálogo...')
    const formattedProducts = allProducts.map((product, index) => {
      if (index % 500 === 0) { // Reduzir logs para ser mais rápido
        console.log(`📝 Formatando produto ${index + 1}/${allProducts.length}...`)
      }
      return formatProductForCatalogFast(product, pricesByProductId, pricesByIdExterno, pricesByCodigoInterno, stockByProductId, sectionsById, brandsById, genresById)
    })

    // Verificar produtos com preço 0 e estoque
    const productsWithZeroPrice = formattedProducts.filter(p => p.price === 0)
    const productsWithPrice = formattedProducts.filter(p => p.price > 0)
    const productsWithStock = formattedProducts.filter(p => p.stock > 0)
    const productsOutOfStock = formattedProducts.filter(p => p.stock === 0)
    
    console.log(`📊 Estatísticas de preços:`)
    console.log(`   ✅ Produtos com preço: ${productsWithPrice.length}`)
    console.log(`   ⚠️ Produtos sem preço: ${productsWithZeroPrice.length}`)
    console.log(`   📈 Taxa de sucesso de preços: ${((productsWithPrice.length / formattedProducts.length) * 100).toFixed(2)}%`)
    
    console.log(`📊 Estatísticas de estoque:`)
    console.log(`   ✅ Produtos em estoque: ${productsWithStock.length}`)
    console.log(`   ⚠️ Produtos sem estoque: ${productsOutOfStock.length}`)
    console.log(`   📈 Taxa de produtos em estoque: ${((productsWithStock.length / formattedProducts.length) * 100).toFixed(2)}%`)
    
    if (productsWithZeroPrice.length > 0) {
      console.log('📋 Primeiros produtos sem preço:')
      productsWithZeroPrice.slice(0, 5).forEach((product, index) => {
        const originalProduct = allProducts.find(p => p.id.toString() === product.id)
        console.log(`   ${index + 1}. ${product.name} (ID: ${product.id}, IdExterno: ${originalProduct?.idExterno}, CodigoInterno: ${originalProduct?.codigoInterno})`)
      })
    }
    
    if (productsWithPrice.length > 0) {
      console.log('💰 Amostra de produtos com preço:')
      productsWithPrice.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - R$ ${product.price.toFixed(2)} (ID: ${product.id})`)
      })
    }

    // 7. Salvar no products.json
    console.log('💾 Salvando produtos formatados no products.json...')
    const dataDir = path.join(process.cwd(), 'data')
    
    // Criar diretório data se não existir
    try {
      await fs.mkdir(dataDir, { recursive: true })
    } catch (error) {
      console.log('Diretório data já existe')
    }
    
    const productsFilePath = path.join(dataDir, 'products.json')
    await fs.writeFile(productsFilePath, JSON.stringify(formattedProducts, null, 2))
    console.log(`💾 Arquivo products.json salvo com ${formattedProducts.length} produtos`)
    
    // 9. Salvar dados completos do Varejo Fácil
    const varejoFacilData = {
      lastSync: new Date().toISOString(),
      totalProducts: formattedProducts.length,
      totalSections: sections.length,
      totalBrands: brands.length,
      totalGenres: genres.length,
      totalPrices: prices.length,
      totalStock: stock.length,
      productsWithZeroPrice: productsWithZeroPrice.length,
      productsWithStock: productsWithStock.length,
      productsOutOfStock: productsOutOfStock.length,
      priceSuccessRate: ((productsWithPrice.length / formattedProducts.length) * 100).toFixed(2),
      stockSuccessRate: ((productsWithStock.length / formattedProducts.length) * 100).toFixed(2),
      sections: sections,
      brands: brands,
      genres: genres,
      prices: prices,
      stock: stock,
      rawProducts: allProducts
    }
    
    const varejoFacilFilePath = path.join(dataDir, 'varejo-facil-sync.json')
    await fs.writeFile(varejoFacilFilePath, JSON.stringify(varejoFacilData, null, 2))
    console.log(`💾 Arquivo varejo-facil-sync.json salvo com dados completos`)
    
    console.log(`✅ Sincronização concluída!`)
    console.log(`📊 Resumo Final:`)
    console.log(`   - Produtos formatados: ${formattedProducts.length}`)
    console.log(`   - Produtos com preço: ${productsWithPrice.length}`)
    console.log(`   - Produtos sem preço: ${productsWithZeroPrice.length}`)
    console.log(`   - Taxa de sucesso de preços: ${((productsWithPrice.length / formattedProducts.length) * 100).toFixed(2)}%`)
    console.log(`   - Produtos em estoque: ${productsWithStock.length}`)
    console.log(`   - Produtos sem estoque: ${productsOutOfStock.length}`)
    console.log(`   - Taxa de produtos em estoque: ${((productsWithStock.length / formattedProducts.length) * 100).toFixed(2)}%`)
    console.log(`   - Seções: ${sections.length}`)
    console.log(`   - Marcas: ${brands.length}`)
    console.log(`   - Gêneros: ${genres.length}`)
    console.log(`   - Preços coletados: ${prices.length}`)
    console.log(`   - Estoques coletados: ${stock.length}`)
    console.log(`   - Lotes processados: ${batchCount}`)
    console.log(`   - Arquivo salvo: ${productsFilePath}`)
    console.log(`   - Dados completos: ${varejoFacilFilePath}`)

    return {
      success: true,
      totalProducts: formattedProducts.length,
      productsWithPrice: productsWithPrice.length,
      productsWithZeroPrice: productsWithZeroPrice.length,
      productsWithStock: productsWithStock.length,
      productsOutOfStock: productsOutOfStock.length,
      priceSuccessRate: ((productsWithPrice.length / formattedProducts.length) * 100).toFixed(2),
      stockSuccessRate: ((productsWithStock.length / formattedProducts.length) * 100).toFixed(2),
      totalSections: sections.length,
      totalBrands: brands.length,
      totalGenres: genres.length,
      totalPricesCollected: prices.length,
      totalStockCollected: stock.length,
      lastSync: varejoFacilData.lastSync
    }

  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error)
    throw error
  }
}

// Executar sincronização
if (require.main === module) {
  syncAndFormatProducts()
    .then(result => {
      console.log('\n🎉 Sincronização concluída com sucesso!')
      console.log('📊 Resultado:', result)
    })
    .catch(error => {
      console.error('❌ Erro na sincronização:', error)
      process.exit(1)
    })
}

module.exports = {
  syncAndFormatProducts,
  formatProductForCatalog
} 