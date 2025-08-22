import type { Address, ShippingCalculation } from './types'

// Coordenadas da loja (Atacadão Guanabara - Rua Antônio Arruda, 1170, Vila Velha, Fortaleza, CE)
const STORE_COORDINATES = {
  lat:-3.7176803095958517, // Latitude aproximada da Vila Velha, Fortaleza
  lng: -38.593432648187076 // Longitude aproximada da Vila Velha, Fortaleza
}

// Configurações de frete
const SHIPPING_CONFIG = {
  baseCost: 0.00, // Custo base (removido para usar apenas R$ 3,00/km)
  costPerKm: 4.00, // Corrigido para R$ 4,00 por km
  maxDistance: 20, // Distância máxima em km (aumentada)
  minOrderValue: 100.00, // Valor mínimo para frete grátis
  freeShippingThreshold: 150.00 // Valor para frete grátis (aumentado)
}

export class ShippingService {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || 'AIzaSyD_Wbw0TSs0YCZfMIXzolXZId4a0miv6QY'
  }

  /**
   * Calcula o frete baseado na distância real usando Google APIs
   */
  async calculateShipping(
    destinationAddress: Address,
    orderValue: number = 0
  ): Promise<ShippingCalculation> {
    try {
      console.log('🚚 Iniciando cálculo de frete')
      console.log('🏪 Endereço da LOJA (origem): Rua Antônio Arruda, 1170, Vila Velha, Fortaleza, CE')
      console.log('📍 Endereço do CLIENTE (destino):', destinationAddress)
      console.log('💰 Valor do pedido:', orderValue)

      // Geocodifica o endereço do cliente
      const destinationCoords = await this.geocodeAddress(destinationAddress)
      if (!destinationCoords) {
        throw new Error('Não foi possível obter coordenadas do endereço de destino')
      }

      // Calcula a rota real entre loja e cliente
      const route = await this.calculateRoute(destinationCoords)
      if (!route) {
        throw new Error('Não foi possível calcular a rota para o endereço de destino')
      }

      const cost = this.calculateShippingCost(route.distance, orderValue)
      const estimatedDelivery = this.formatEstimatedDelivery(route.duration)
      const available = route.distance <= SHIPPING_CONFIG.maxDistance

      const result: ShippingCalculation = {
        distance: route.distance,
        duration: route.duration,
        cost,
        estimatedDelivery,
        available
      }

      console.log('✅ Frete calculado com sucesso:')
      console.log('   🏪 Da LOJA (Rua Antônio Arruda, 1170)')
      console.log('   📍 Para o CLIENTE (', destinationAddress.street, ',', destinationAddress.number, ')')
      console.log('   📏 Distância:', result.distance, 'km')
      console.log('   ⏱️ Tempo estimado:', result.estimatedDelivery)
      console.log('   💰 Custo do frete: R$', result.cost.toFixed(2))
      console.log('   📦 Disponível:', result.available ? 'Sim' : 'Não')

      return result
    } catch (error) {
      console.error('❌ Erro ao calcular frete:', error)
      throw new Error('Erro ao calcular frete')
    }
  }

  /**
   * Converte endereço para coordenadas usando Google Geocoding API
   */
  private async geocodeAddress(address: Address): Promise<{ lat: number; lng: number } | null> {
    try {
      const addressString = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}, ${address.state}, ${address.zipCode}`
      
      console.log('🌍 Geocodificando endereço:', addressString)
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${this.apiKey}`
      console.log('🔗 URL da API:', url.replace(this.apiKey, 'API_KEY_HIDDEN'))
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText)
        return null
      }
      
      const data = await response.json()
      console.log('📡 Resposta da API:', data)
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        console.log('✅ Coordenadas encontradas:', location)
        return { lat: location.lat, lng: location.lng }
      } else {
        console.error('❌ Status da API não OK:', data.status, data.error_message)
        return null
      }
    } catch (error) {
      console.error('❌ Erro ao geocodificar endereço:', error)
      return null
    }
  }

  /**
   * Calcula rota usando Google Directions API
   */
  private async calculateRoute(destinationCoords: { lat: number; lng: number }): Promise<{ distance: number; duration: number } | null> {
    try {
      const origin = `${STORE_COORDINATES.lat},${STORE_COORDINATES.lng}`
      const destination = `${destinationCoords.lat},${destinationCoords.lng}`
      
      console.log('🛣️ Calculando rota de:', origin, 'para:', destination)
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${this.apiKey}`
      console.log('🔗 URL da API:', url.replace(this.apiKey, 'API_KEY_HIDDEN'))
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText)
        return null
      }
      
      const data = await response.json()
      console.log('📡 Resposta da API Directions:', data)
      
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0].legs[0]
        const result = {
          distance: route.distance.value / 1000, // Converter para km
          duration: route.duration.value / 60 // Converter para minutos
        }
        console.log('✅ Rota calculada:', result)
        return result
      } else {
        console.error('❌ Status da API não OK:', data.status, data.error_message)
        return null
      }
    } catch (error) {
      console.error('❌ Erro ao calcular rota:', error)
      return null
    }
  }

  /**
   * Calcula custo do frete baseado na distância e valor do pedido
   */
  private calculateShippingCost(distance: number, orderValue: number): number {
    // Frete grátis para pedidos acima do threshold
    if (orderValue >= SHIPPING_CONFIG.freeShippingThreshold) {
      return 0
    }

    // Frete grátis para pedidos acima do valor mínimo e distância pequena
    if (orderValue >= SHIPPING_CONFIG.minOrderValue && distance <= 3) {
      return 0
    }

    // Calcular custo baseado apenas na distância: R$ 3,00 por km
    const distanceCost = distance * SHIPPING_CONFIG.costPerKm
    
    return distanceCost
  }

  /**
   * Formata tempo estimado de entrega
   */
  private formatEstimatedDelivery(durationMinutes: number): string {
    // Sempre retorna o prazo fixo solicitado
    return '2 a 3 horas';
  }

  // ...dados mockados removidos, cálculo agora é 100% via API...

  /**
   * Valida se o CEP está no formato correto
   */
  static validateZipCode(zipCode: string): boolean {
    const cleanZipCode = zipCode.replace(/\D/g, '')
    return cleanZipCode.length === 8
  }

  /**
   * Formata CEP para exibição
   */
  static formatZipCode(zipCode: string): string {
    const cleanZipCode = zipCode.replace(/\D/g, '')
    if (cleanZipCode.length === 8) {
      return `${cleanZipCode.slice(0, 5)}-${cleanZipCode.slice(5)}`
    }
    return zipCode
  }

  /**
   * Busca informações do CEP usando API pública
   */
  static async getAddressByZipCode(zipCode: string): Promise<Partial<Address> | null> {
    try {
      const cleanZipCode = zipCode.replace(/\D/g, '')
      
      if (cleanZipCode.length !== 8) {
        return null
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        return null
      }

      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        zipCode: this.formatZipCode(cleanZipCode)
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      return null
    }
  }
}

// Instância global do serviço
export const shippingService = new ShippingService()