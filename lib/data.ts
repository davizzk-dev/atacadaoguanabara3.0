import type { Product, Promotion, ProductPromotion } from "./types"
import fs from 'fs/promises'
import path from 'path'

// Logo da loja (altere o caminho ou link para a logo desejada)
export const LOGO_URL = "https://i.ibb.co/fGSnH3hd/logoatacad-o.jpg" // Logo principal da loja

// Foto da entrada da loja (altere o caminho ou link para a foto desejada)
export const ENTRADA_URL = "/imagens/entrada-loja.jpg" // Foto da entrada da loja

export const products: Product[] = []

// Categorias padrão (fallback)
export const categories = ['Todos', 'Eletrônicos', 'Roupas', 'Casa', 'Esportes', 'Livros', 'Alimentos', 'Bebidas', 'Higiene', 'Limpeza']

// Caminho para o arquivo products.json
const productsFilePath = path.join(process.cwd(), 'data', 'products.json')

// Caminho para o arquivo products2.json (backup)
const products2FilePath = path.join(process.cwd(), 'data', 'products2.json')

// Estado global para controlar se estamos usando backup
let usingBackupFile = false
let lastBackupUsedTime = 0

// Função para obter status do sistema de arquivos
export const getSystemFileStatus = () => {
  return {
    usingBackupFile,
    lastBackupUsedTime,
    backupUsedRecently: lastBackupUsedTime > 0 && (Date.now() - lastBackupUsedTime) < 300000, // 5 minutos
  }
}

// Função para garantir que o arquivo products.json existe
const ensureFileExists = async () => {
  try {
    await fs.access(productsFilePath)
  } catch (error) {
    // Se o arquivo não existe, criar com array vazio
    await fs.writeFile(productsFilePath, JSON.stringify([], null, 2))
  }
}

// Função para obter produtos do arquivo JSON (fonte primária com fallback)
export const getProductsFromFile = async () => {
  try {
    console.log('📂 Iniciando leitura de produtos...')
    
    // Reset estado global
    usingBackupFile = false
    
    // PRIORIDADE 1: SEMPRE tentar products.json primeiro
    console.log('� Tentando carregar products.json (PRINCIPAL)...')
    
    try {
      // Verificar se products.json existe
      await fs.access(productsFilePath)
      console.log('✅ products.json encontrado')
      
      // Ler products.json
      const productsData = await fs.readFile(productsFilePath, 'utf8')
      console.log(`📄 Tamanho: ${productsData.length} chars`)
      
      // Verificar se não está vazio
      if (productsData.trim()) {
        const products = JSON.parse(productsData)
        
        // Verificar se é array válido com produtos
        if (Array.isArray(products) && products.length > 0) {
          console.log(`✅ SUCCESS: ${products.length} produtos carregados do products.json (PRINCIPAL)`)
          
          // Verificar se são dados do Varejo Fácil
          const first = products[0]
          if (first?.varejoFacilData) {
            console.log('✅ Dados do Varejo Fácil detectados (PRINCIPAL)')
          }
          
          return products
        }
      }
      
      // Se chegou aqui, products.json existe mas está vazio/inválido
      console.log('⚠️ products.json existe mas está vazio/inválido')
      throw new Error('Arquivo principal vazio ou inválido')
      
    } catch (primaryError) {
      // PRIORIDADE 2: Só usar backup se principal falhou
      console.log('❌ products.json falhou:', primaryError instanceof Error ? primaryError.message : String(primaryError))
      console.log('� Tentando products2.json (BACKUP)...')
      
      try {
        await fs.access(products2FilePath)
        console.log('✅ products2.json encontrado')
        
        const backupData = await fs.readFile(products2FilePath, 'utf8')
        console.log(`📄 Backup tamanho: ${backupData.length} chars`)
        
        if (backupData.trim()) {
          const backupProducts = JSON.parse(backupData)
          
          if (Array.isArray(backupProducts) && backupProducts.length > 0) {
            // ATIVAR MODO BACKUP
            usingBackupFile = true
            lastBackupUsedTime = Date.now()
            
            console.log('🚨 ATENÇÃO: USANDO BACKUP!')
            console.log(`🔥 ${backupProducts.length} produtos carregados do products2.json (BACKUP)`)
            
            // Alertas críticos para admin
            console.error('🚨🚨🚨 ADMIN: SISTEMA USANDO BACKUP! 🚨🚨🚨')
            console.error(`🚨 Motivo: ${primaryError instanceof Error ? primaryError.message : String(primaryError)}`)
            console.error('🚨 Verifique products.json e execute sincronização!')
            
            return backupProducts
          }
        }
        
        console.error('❌ Backup também está vazio/inválido')
        return []
        
      } catch (backupError) {
        console.error('❌ Backup também falhou:', backupError instanceof Error ? backupError.message : String(backupError))
        console.error('🚨 SITUAÇÃO CRÍTICA: Nenhum arquivo de produtos válido!')
        return []
      }
    }
    
  } catch (error) {
    console.error('❌ ERRO GERAL na leitura de produtos:', error instanceof Error ? error.message : String(error))
    return []
  }
}

// Função para obter produtos (compatibilidade com código existente)
export const getAllProductsFromFile = async () => {
  return getProductsFromFile()
}

export const saveProductToFile = async (product: any) => {
  try {
    // Garantir que o arquivo existe
    await ensureFileExists()
    
    // Ler produtos existentes
    const productsData = await fs.readFile(productsFilePath, 'utf8')
    let products = []
    
    try {
      products = JSON.parse(productsData)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON, criando array vazio:', parseError)
      products = []
    }
    
    // Verificar se o ID já existe
    if (product.id && products.some((p: any) => p.id === product.id)) {
      return { success: false, message: 'ID já existe. Escolha outro ID.' }
    }
    
    // Se o produto não tem ID, gerar automaticamente
    if (!product.id) {
      const maxId = Math.max(...products.map((p: any) => parseInt(p.id) || 0), 0)
      product.id = (maxId + 1).toString()
    }
    
    // Adicionar novo produto
    products.push(product)
    
    // Salvar no products.json
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2))
    
    return { success: true, message: 'Produto salvo com sucesso!', product }
  } catch (error) {
    console.error('Erro ao salvar produto:', error)
    return { success: false, message: `Erro ao salvar produto: ${error}` }
  }
}

export const updateProductInFile = async (productId: string, updatedProduct: any) => {
  try {
    // Garantir que o arquivo existe
    await ensureFileExists()
    
    // Ler produtos existentes
    const productsData = await fs.readFile(productsFilePath, 'utf8')
    let products = []
    
    try {
      products = JSON.parse(productsData)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError)
      return { success: false, message: 'Arquivo de produtos corrompido' }
    }
    
    // Encontrar e atualizar produto
    const productIndex = products.findIndex((p: any) => p.id === productId)
    if (productIndex === -1) {
      return { success: false, message: 'Produto não encontrado' }
    }
    
    // Preservar o ID original
    const updatedProductData = { 
      ...products[productIndex], 
      ...updatedProduct,
      id: productId // Garantir que o ID não seja alterado
    }
    products[productIndex] = updatedProductData
    
    // Salvar no products.json
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2))
    console.log(`✅ Produto ${productId} atualizado no products.json`)
    
    // Também atualizar no products2.json (backup) se existir
    try {
      const products2Data = await fs.readFile(products2FilePath, 'utf8')
      let products2 = JSON.parse(products2Data)
      
      const productIndex2 = products2.findIndex((p: any) => p.id === productId)
      if (productIndex2 !== -1) {
        products2[productIndex2] = updatedProductData
        await fs.writeFile(products2FilePath, JSON.stringify(products2, null, 2))
        console.log(`✅ Produto ${productId} atualizado no products2.json (backup)`)
      } else {
        console.log(`⚠️ Produto ${productId} não encontrado no backup, adicionando...`)
        products2.push(updatedProductData)
        await fs.writeFile(products2FilePath, JSON.stringify(products2, null, 2))
        console.log(`✅ Produto ${productId} adicionado ao products2.json (backup)`)
      }
    } catch (backupError) {
      console.log('ℹ️ products2.json não existe ou erro ao atualizar backup:', backupError instanceof Error ? backupError.message : String(backupError))
      // Não falhar se o backup não existir
    }
    
    return { success: true, message: 'Produto atualizado com sucesso nos arquivos principal e backup!' }
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return { success: false, message: `Erro ao atualizar produto: ${error}` }
  }
}

export const deleteProductFromFile = async (productId: string) => {
  try {
    // Garantir que o arquivo existe
    await ensureFileExists()
    
    // Ler produtos existentes
    const productsData = await fs.readFile(productsFilePath, 'utf8')
    let products = []
    
    try {
      products = JSON.parse(productsData)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError)
      return { success: false, message: 'Arquivo de produtos corrompido' }
    }
    
    // Encontrar e remover produto
    const productIndex = products.findIndex((p: any) => p.id === productId)
    if (productIndex === -1) {
      return { success: false, message: 'Produto não encontrado' }
    }
    
    products.splice(productIndex, 1)
    
    // Salvar no products.json
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2))
    
    return { success: true, message: 'Produto deletado com sucesso!' }
  } catch (error) {
    console.error('Erro ao deletar produto:', error)
    return { success: false, message: `Erro ao deletar produto: ${error}` }
  }
}

export const syncProductsToFile = async () => {
  try {
    // Sincronizar produtos padrão do data.ts para o products.json
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2))
    return { success: true, message: 'Produtos sincronizados com sucesso!' }
  } catch (error) {
    console.error('Erro ao sincronizar produtos:', error)
    return { success: false, message: `Erro ao sincronizar produtos: ${error}` }
  }
}

// Substituir a exportação estática de produtos por uma função que lê do arquivo
// Isso garante que sempre usamos os dados mais atualizados
export const getProducts = async () => {
  return getProductsFromFile()
}

// Função para obter produtos do catálogo (usada pelo frontend)
export const getCatalogProducts = async () => {
  try {
    console.log('🔍 Iniciando carregamento de produtos do catálogo...')
    console.log('📂 Caminho do arquivo:', productsFilePath)
    
    // FORÇAR leitura direta do arquivo JSON
    try {
      await fs.access(productsFilePath)
      console.log('✅ Arquivo products.json encontrado')
      
      // Ler diretamente o arquivo
      const productsData = await fs.readFile(productsFilePath, 'utf8')
      console.log(`📄 Tamanho do arquivo: ${productsData.length} caracteres`)
      
      if (productsData.trim() === '') {
        console.log('⚠️ Arquivo está vazio')
        return []
      }
      
      const fileProducts = JSON.parse(productsData)
      console.log(`📦 Produtos parseados do JSON: ${fileProducts.length}`)
      
      // Verificar se é um array válido
      if (!Array.isArray(fileProducts)) {
        console.error('❌ Arquivo não contém um array válido de produtos')
        return []
      }
      
    if (fileProducts.length === 0) {
        console.log('⚠️ Array de produtos está vazio')
        return []
      }
      
      // Verificar se são produtos do Varejo Fácil
      const firstProduct = fileProducts[0]
      if (firstProduct && firstProduct.varejoFacilData) {
        console.log('✅ Produtos são do Varejo Fácil (products.json)')
        console.log(`   - Código interno: ${firstProduct.varejoFacilData.codigoInterno}`)
        console.log(`   - Seção ID: ${firstProduct.varejoFacilData.secaoId}`)
      } else {
        console.log('⚠️ Produtos não parecem ser do Varejo Fácil')
        console.log('   - Primeiro produto:', firstProduct ? firstProduct.name : 'null')
      }
      
      console.log(`✅ Retornando ${fileProducts.length} produtos do arquivo JSON`)
      return fileProducts
      
    } catch (error) {
      console.log('❌ Erro ao ler arquivo JSON:', error)
      console.log('🔄 Tentando usar produtos padrão...')
      return products
    }
    
  } catch (error) {
    console.error('❌ Erro ao carregar produtos do catálogo:', error)
    console.log('🔄 Usando produtos padrão como fallback...')
    console.log(`📦 Produtos padrão: ${products.length}`)
    return products
  }
}

// Função para obter categorias dinâmicas baseadas nos produtos do arquivo
export const getDynamicCategories = async () => {
  try {
    const fileProducts = await getProductsFromFile()
    
    if (fileProducts.length === 0) {
      return categories
    }
    
    // Extrair categorias únicas dos produtos
    const uniqueCategories = [...new Set(fileProducts.map(p => p.category).filter(Boolean))]
    return ['Todos', ...uniqueCategories.sort()]
  } catch (error) {
    console.error('❌ Erro ao obter categorias dinâmicas:', error)
    return categories
  }
}
