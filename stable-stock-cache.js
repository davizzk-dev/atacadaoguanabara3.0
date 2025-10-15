// Sistema de Cache Estável para Estoque
const fs = require('fs').promises;
const path = require('path');

const CACHE_CONFIG = {
  stockCacheFile: path.join(__dirname, 'data', 'stock-cache.json'),
  cacheValidityMinutes: 10, // Cache válido por 10 minutos
  maxRetries: 3,
  retryDelayMs: 2000,
  stabilityThreshold: 50 // Máximo de produtos que podem variar para considerar estável
};

class StableStockCache {
  constructor() {
    this.cache = null;
    this.cacheTimestamp = null;
  }

  async isCacheValid() {
    if (!this.cache || !this.cacheTimestamp) return false;
    
    const now = Date.now();
    const cacheAge = (now - this.cacheTimestamp) / (1000 * 60); // minutos
    
    return cacheAge < CACHE_CONFIG.cacheValidityMinutes;
  }

  async loadCacheFromFile() {
    try {
      const cacheData = await fs.readFile(CACHE_CONFIG.stockCacheFile, 'utf8');
      const parsed = JSON.parse(cacheData);
      
      this.cache = parsed.stock;
      this.cacheTimestamp = parsed.timestamp;
      
      console.log(`📋 Cache carregado do arquivo: ${this.cache?.length || 0} itens`);
      console.log(`🕒 Cache criado em: ${new Date(this.cacheTimestamp).toLocaleString()}`);
      
      return await this.isCacheValid();
    } catch (error) {
      console.log('📁 Nenhum cache válido encontrado');
      return false;
    }
  }

  async saveCacheToFile(stockData) {
    try {
      const cacheData = {
        stock: stockData,
        timestamp: Date.now(),
        totalItems: stockData.length,
        itemsWithStock: stockData.filter(item => (item.saldo || 0) > 0).length
      };

      await fs.mkdir(path.dirname(CACHE_CONFIG.stockCacheFile), { recursive: true });
      await fs.writeFile(CACHE_CONFIG.stockCacheFile, JSON.stringify(cacheData, null, 2));
      
      console.log(`💾 Cache salvo: ${cacheData.totalItems} itens, ${cacheData.itemsWithStock} com estoque`);
    } catch (error) {
      console.error('❌ Erro ao salvar cache:', error.message);
    }
  }

  async getStableStock(fetchFunction) {
    console.log('🔍 Verificando cache de estoque estável...');
    
    // 1. Tentar usar cache existente
    if (await this.loadCacheFromFile() && await this.isCacheValid()) {
      console.log('✅ Usando cache válido para evitar oscilações');
      return this.cache;
    }

    console.log('🔄 Cache inválido - coletando dados frescos com múltiplas tentativas...');

    // 2. Fazer múltiplas consultas para encontrar dados estáveis
    const attempts = [];
    
    for (let i = 0; i < 3; i++) {
      console.log(`📡 Tentativa ${i + 1}/3 para dados estáveis...`);
      
      try {
        const stockData = await fetchFunction();
        const withStock = stockData.filter(item => (item.saldo || 0) > 0).length;
        
        attempts.push({
          data: stockData,
          totalItems: stockData.length,
          withStock: withStock,
          attempt: i + 1
        });
        
        console.log(`  📊 Resultado: ${stockData.length} total, ${withStock} com estoque`);
        
        if (i < 2) {
          console.log('  ⏳ Aguardando 5 segundos antes da próxima tentativa...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error(`  ❌ Erro na tentativa ${i + 1}:`, error.message);
      }
    }

    // 3. Analisar estabilidade e escolher melhor resultado
    if (attempts.length === 0) {
      throw new Error('Falha em todas as tentativas de obter dados de estoque');
    }

    console.log('\n📊 Análise de estabilidade das tentativas:');
    attempts.forEach(attempt => {
      console.log(`  Tentativa ${attempt.attempt}: ${attempt.totalItems} total, ${attempt.withStock} com estoque`);
    });

    // Verificar variação nos produtos com estoque
    const withStockCounts = attempts.map(a => a.withStock);
    const minStock = Math.min(...withStockCounts);
    const maxStock = Math.max(...withStockCounts);
    const variation = maxStock - minStock;

    console.log(`🔍 Variação detectada: ${variation} produtos (${minStock} - ${maxStock})`);

    let selectedData;
    
    if (variation <= CACHE_CONFIG.stabilityThreshold) {
      console.log('✅ Dados considerados estáveis - usando resultado mais recente');
      selectedData = attempts[attempts.length - 1].data;
    } else {
      console.log('⚠️ Alta variação detectada - usando mediana para estabilidade');
      // Usar a tentativa com valor mediano de produtos com estoque
      const sortedByStock = [...attempts].sort((a, b) => a.withStock - b.withStock);
      const medianIndex = Math.floor(sortedByStock.length / 2);
      selectedData = sortedByStock[medianIndex].data;
      
      console.log(`📊 Selecionado resultado mediano: ${sortedByStock[medianIndex].withStock} produtos com estoque`);
    }

    // 4. Salvar no cache
    this.cache = selectedData;
    this.cacheTimestamp = Date.now();
    await this.saveCacheToFile(selectedData);

    console.log(`🎯 Dados estáveis obtidos: ${selectedData.length} total, ${selectedData.filter(item => (item.saldo || 0) > 0).length} com estoque`);
    
    return selectedData;
  }

  async clearCache() {
    try {
      await fs.unlink(CACHE_CONFIG.stockCacheFile);
      console.log('🗑️ Cache limpo');
    } catch (error) {
      console.log('📁 Nenhum cache para limpar');
    }
    
    this.cache = null;
    this.cacheTimestamp = null;
  }

  getCacheInfo() {
    if (!this.cache || !this.cacheTimestamp) {
      return { valid: false, message: 'Nenhum cache disponível' };
    }

    const age = (Date.now() - this.cacheTimestamp) / (1000 * 60);
    const withStock = this.cache.filter(item => (item.saldo || 0) > 0).length;
    
    return {
      valid: age < CACHE_CONFIG.cacheValidityMinutes,
      age: `${age.toFixed(1)} minutos`,
      totalItems: this.cache.length,
      withStock: withStock,
      timestamp: new Date(this.cacheTimestamp).toLocaleString()
    };
  }
}

module.exports = { StableStockCache, CACHE_CONFIG };