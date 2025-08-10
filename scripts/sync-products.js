#!/usr/bin/env node

/**
 * Script para sincronizar produtos da API Varejo Fácil
 * Este script busca produtos da API e salva no arquivo products.json
 */

const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

// Configuração da API
const API_BASE_URL = 'https://atacadaoguanabara.varejofacil.com'
const API_KEY = '2625e98175832a17a954db9beb60306a'
const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json')

// Função para fazer requisição HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http
    
    const requestOptions = {
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }
    
    const req = protocol.get(url, requestOptions, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          resolve(response)
        } catch (error) {
          reject(new Error(`Erro ao parsear resposta: ${error.message}`))
        }
      })
    })
    
    req.on('error', (error) => {
      reject(new Error(`Erro na requisição: ${error.message}`))
    })
    
    req.setTimeout(30000, () => {
      req.destroy()
      reject(new Error('Timeout na requisição'))
    })
  })
}

// Função para converter produto da API para formato local
function convertApiProductToLocal(apiProduct) {
  return {
    id: apiProduct.id.toString(),
    name: apiProduct.descricao,
    price: 0, // Preço será obtido separadamente se necessário
    originalPrice: 0,
    category: 'API_SYNC',
    description: apiProduct.descricaoReduzida || apiProduct.descricao,
    stock: 0,
    inStock: true,
    brand: '',
    unit: apiProduct.unidadeDeVenda || '',
    tags: ['api-sync', 'varejo-facil'],
    rating: 0,
    reviews: 0,
    image: apiProduct.imagem || '',
    apiData: {
      idExterno: apiProduct.idExterno,
      codigoInterno: apiProduct.codigoInterno,
      secaoId: apiProduct.secaoId,
      marcaId: apiProduct.marcaId,
      generoId: apiProduct.generoId,
      ativoNoEcommerce: apiProduct.ativoNoEcommerce,
      controlaEstoque: apiProduct.controlaEstoque,
      permiteDesconto: apiProduct.permiteDesconto,
      dataInclusao: apiProduct.dataInclusao,
      dataAlteracao: apiProduct.dataAlteracao
    }
  }
}

// Função principal de sincronização
async function syncProducts() {
  try {
    console.log('🔄 Iniciando sincronização de produtos...')
    
    // Buscar produtos da API em lotes
    const batchSize = 200
    let start = 0
    let allProducts = []
    let totalProcessed = 0
    
    while (true) {
      console.log(`📦 Buscando lote ${Math.floor(start / batchSize) + 1}...`)
      
      const url = `${API_BASE_URL}/v1/produto/produtos?start=${start}&count=${batchSize}`
      const response = await makeRequest(url)
      
      if (!response.items || response.items.length === 0) {
        break
      }
      
      // Converter produtos da API para formato local
      const localProducts = response.items.map(convertApiProductToLocal)
      allProducts.push(...localProducts)
      
      totalProcessed += response.items.length
      console.log(`✅ Processados ${totalProcessed} produtos...`)
      
      // Se recebeu menos produtos que o batchSize, chegou ao fim
      if (response.items.length < batchSize) {
        break
      }
      
      start += batchSize
      
      // Pequena pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Salvar produtos no arquivo
    await fs.promises.writeFile(PRODUCTS_FILE, JSON.stringify(allProducts, null, 2))
    
    console.log(`✅ Sincronização concluída! ${allProducts.length} produtos salvos em ${PRODUCTS_FILE}`)
    
    return {
      success: true,
      message: `Sincronização concluída com sucesso! ${allProducts.length} produtos processados.`,
      totalProcessed: allProducts.length
    }
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message)
    return {
      success: false,
      message: `Erro na sincronização: ${error.message}`,
      totalProcessed: 0
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  syncProducts().then(result => {
    if (result.success) {
      console.log('🎉 Sincronização finalizada com sucesso!')
      process.exit(0)
    } else {
      console.error('💥 Sincronização falhou!')
      process.exit(1)
    }
  })
}

module.exports = { syncProducts } 