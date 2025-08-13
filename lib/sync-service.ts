import { atacadaoApi, type Produto as ApiProduto } from './api-client'
import { getAllProductsFromFile, saveProductToFile, updateProductInFile } from './data'
import fs from 'fs/promises'
import path from 'path'

export interface SyncProgress {
  total: number
  processed: number
  current: number
  status: 'idle' | 'running' | 'completed' | 'error'
  message: string
  error?: string
}

export interface SyncConfig {
  autoSync: boolean
  syncInterval: number // em minutos
  batchSize: number
  lastSync?: Date
}

const CONFIG_FILE = path.join(process.cwd(), 'data', 'sync-config.json')

// Função para carregar configuração de sincronização
export const loadSyncConfig = async (): Promise<SyncConfig> => {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf8')
    const config = JSON.parse(configData)
    return {
      autoSync: config.autoSync || false,
      syncInterval: config.syncInterval || 60, // 60 minutos padrão
      batchSize: config.batchSize || 200,
      lastSync: config.lastSync ? new Date(config.lastSync) : undefined
    }
  } catch (error) {
    // Se o arquivo não existe, retornar configuração padrão
    return {
      autoSync: false,
      syncInterval: 60,
      batchSize: 200
    }
  }
}

// Função para salvar configuração de sincronização
export const saveSyncConfig = async (config: SyncConfig): Promise<void> => {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2))
  } catch (error) {
    console.error('Erro ao salvar configuração de sincronização:', error)
    throw error
  }
}

// Função para converter produto da API para formato local
const convertApiProductToLocal = (apiProduct: ApiProduto): any => {
  return {
    id: apiProduct.id.toString(),
    name: apiProduct.descricao,
    price: 0, // Preço será obtido separadamente se necessário
    originalPrice: 0,
    category: 'API_SYNC', // Categoria padrão para produtos sincronizados
    description: apiProduct.descricaoReduzida || apiProduct.descricao,
    stock: 0, // Estoque será obtido separadamente se necessário
    inStock: true,
    brand: '', // Marca será obtida separadamente se necessário
    unit: apiProduct.unidadeDeVenda || '',
    tags: ['api-sync', 'varejo-facil'],
    rating: 0,
    reviews: 0,
    image: apiProduct.imagem || '',
    // Campos específicos da API
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

// Função para sincronizar produtos em lotes
export const syncProductsInBatches = async (
  onProgress?: (progress: SyncProgress) => void
): Promise<{ success: boolean; message: string; totalProcessed: number }> => {
  try {
    const progress: SyncProgress = {
      total: 0,
      processed: 0,
      current: 0,
      status: 'running',
      message: 'Iniciando sincronização...'
    }

    onProgress?.(progress)

    // Obter total de produtos da API
    const totalResponse = await atacadaoApi.getProdutos({ count: 1 })
    if (!totalResponse.success || !totalResponse.data) {
      throw new Error('Erro ao obter total de produtos da API')
    }

    const total = totalResponse.data.total
    progress.total = total
    progress.message = `Total de ${total} produtos encontrados. Iniciando processamento...`
    onProgress?.(progress)

    // Carregar produtos existentes
    const existingProducts = await getAllProductsFromFile()
    const existingProductsMap = new Map(existingProducts.map(p => p.id))

    // Processar em lotes
    const batchSize = 200
    let processed = 0
    let start = 0

    while (start < total) {
      progress.current = start + 1
      progress.message = `Processando lote ${Math.floor(start / batchSize) + 1}/${Math.ceil(total / batchSize)}...`
      onProgress?.(progress)

      // Buscar lote de produtos da API
      const batchResponse = await atacadaoApi.getProdutos({
        start,
        count: batchSize
      })

      if (!batchResponse.success || !batchResponse.data) {
        throw new Error(`Erro ao buscar lote de produtos (start: ${start})`)
      }

      const batchProducts = batchResponse.data.items

      // Processar cada produto do lote
      for (const apiProduct of batchProducts) {
        try {
          const localProduct = convertApiProductToLocal(apiProduct)
          
          // Verificar se o produto já existe
          if (existingProductsMap.has(localProduct.id)) {
            // Atualizar produto existente
            await updateProductInFile(localProduct.id, localProduct)
          } else {
            // Adicionar novo produto
            await saveProductToFile(localProduct)
            existingProductsMap.set(localProduct.id, localProduct)
          }

          processed++
          progress.processed = processed
          progress.message = `Processado ${processed}/${total} produtos...`
          onProgress?.(progress)

        } catch (productError) {
          console.error(`Erro ao processar produto ${apiProduct.id}:`, productError)
          // Continuar com o próximo produto
        }
      }

      start += batchSize

      // Pequena pausa entre lotes para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Atualizar configuração com data da última sincronização
    const config = await loadSyncConfig()
    config.lastSync = new Date()
    await saveSyncConfig(config)

    progress.status = 'completed'
    progress.message = `Sincronização concluída! ${processed} produtos processados.`
    onProgress?.(progress)

    return {
      success: true,
      message: `Sincronização concluída com sucesso! ${processed} produtos processados.`,
      totalProcessed: processed
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    const progress: SyncProgress = {
      total: 0,
      processed: 0,
      current: 0,
      status: 'error',
      message: 'Erro durante a sincronização',
      error: errorMessage
    }
    
    onProgress?.(progress)

    return {
      success: false,
      message: `Erro na sincronização: ${errorMessage}`,
      totalProcessed: 0
    }
  }
}

// Função para verificar se é necessário sincronizar automaticamente
export const checkAutoSync = async (): Promise<boolean> => {
  try {
    const config = await loadSyncConfig()
    
    if (!config.autoSync) {
      return false
    }

    if (!config.lastSync) {
      return true // Primeira sincronização
    }

    const now = new Date()
    const lastSync = new Date(config.lastSync)
    const minutesSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60)

    return minutesSinceLastSync >= config.syncInterval
  } catch (error) {
    console.error('Erro ao verificar sincronização automática:', error)
    return false
  }
}

// Função para executar sincronização automática
export const runAutoSync = async (): Promise<void> => {
  try {
    const needsSync = await checkAutoSync()
    
    if (needsSync) {
      console.log('🔄 Executando sincronização automática...')
      await syncProductsInBatches((progress) => {
        console.log(`📊 ${progress.message} (${progress.processed}/${progress.total})`)
      })
      console.log('✅ Sincronização automática concluída')
    }
  } catch (error) {
    console.error('❌ Erro na sincronização automática:', error)
  }
}

// Função para obter estatísticas de sincronização
export const getSyncStats = async (): Promise<{
  totalProducts: number
  lastSync?: Date
  autoSyncEnabled: boolean
  syncInterval: number
}> => {
  try {
    const config = await loadSyncConfig()
    const products = await getAllProductsFromFile()
    
    return {
      totalProducts: products.length,
      lastSync: config.lastSync,
      autoSyncEnabled: config.autoSync,
      syncInterval: config.syncInterval
    }
  } catch (error) {
    console.error('Erro ao obter estatísticas de sincronização:', error)
    return {
      totalProducts: 0,
      autoSyncEnabled: false,
      syncInterval: 60
    }
  }
} 