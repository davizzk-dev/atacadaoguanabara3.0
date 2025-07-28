import type { Address, ShippingCalculation } from './types'

// Coordenadas da loja (Atacadão Guanabara)
const STORE_COORDINATES = {
  lat: -3.7319, // Latitude de Fortaleza (ajustar para localização exata)
  lng: -38.5267 // Longitude de Fortaleza (ajustar para localização exata)
}

// Configurações de frete
const SHIPPING_CONFIG = {
  baseCost: 5.00, // Custo base
  costPerKm: 1.50, // Custo por km
  maxDistance: 15, // Distância máxima em km
  minOrderValue: 30.00, // Valor mínimo para frete grátis
  freeShippingThreshold: 50.00 // Valor para frete grátis
}

export class ShippingService {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  }

  /**
   * Calcula o frete baseado na distância usando Google Maps API
   */
  async calculateShipping(
    destinationAddress: Address,
    orderValue: number = 0
  ): Promise<ShippingCalculation> {
    try {
      // Se não há API key, usar cálculo simulado
      if (!this.apiKey) {
        return this.calculateSimulatedShipping(destinationAddress, orderValue)
      }

      // Converter endereço para coordenadas
      const destinationCoords = await this.geocodeAddress(destinationAddress)
      
      if (!destinationCoords) {
        throw new Error('Não foi possível localizar o endereço')
      }

      // Calcular rota
      const route = await this.calculateRoute(destinationCoords)
      
      if (!route) {
        throw new Error('Não foi possível calcular a rota')
      }

      // Calcular custo do frete
      const cost = this.calculateShippingCost(route.distance, orderValue)
      
      return {
        distance: route.distance,
        duration: route.duration,
        cost,
        estimatedDelivery: this.formatEstimatedDelivery(route.duration),
        available: route.distance <= SHIPPING_CONFIG.maxDistance
      }
    } catch (error) {
      console.error('Erro ao calcular frete:', error)
      
      // Fallback para cálculo simulado
      return this.calculateSimulatedShipping(destinationAddress, orderValue)
    }
  }

  /**
   * Converte endereço para coordenadas usando Google Geocoding API
   */
  private async geocodeAddress(address: Address): Promise<{ lat: number; lng: number } | null> {
    try {
      const addressString = `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city}, ${address.state}, ${address.zipCode}`
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${this.apiKey}`
      )
      
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return { lat: location.lat, lng: location.lng }
      }
      
      return null
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error)
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
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${this.apiKey}`
      )
      
      const data = await response.json()
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].legs[0]
        return {
          distance: route.distance.value / 1000, // Converter para km
          duration: route.duration.value / 60 // Converter para minutos
        }
      }
      
      return null
    } catch (error) {
      console.error('Erro ao calcular rota:', error)
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
    if (orderValue >= SHIPPING_CONFIG.minOrderValue && distance <= 5) {
      return 0
    }

    // Calcular custo baseado na distância
    const baseCost = SHIPPING_CONFIG.baseCost
    const distanceCost = distance * SHIPPING_CONFIG.costPerKm
    
    return Math.max(baseCost, distanceCost)
  }

  /**
   * Formata tempo estimado de entrega
   */
  private formatEstimatedDelivery(durationMinutes: number): string {
    if (durationMinutes < 60) {
      return `Em até ${Math.ceil(durationMinutes)} minutos`
    }
    
    const hours = Math.floor(durationMinutes / 60)
    const minutes = Math.ceil(durationMinutes % 60)
    
    if (minutes === 0) {
      return `Em até ${hours} hora${hours > 1 ? 's' : ''}`
    }
    
    return `Em até ${hours}h${minutes}min`
  }

  /**
   * Cálculo simulado quando API não está disponível
   */
  private calculateSimulatedShipping(address: Address, orderValue: number): ShippingCalculation {
    // Simular distância baseada no CEP (apenas para demonstração)
    const zipCode = address.zipCode.replace(/\D/g, '')
    const simulatedDistance = Math.random() * 10 + 2 // Entre 2-12 km
    
    const cost = this.calculateShippingCost(simulatedDistance, orderValue)
    const duration = simulatedDistance * 3 + Math.random() * 10 // ~3 min/km + variação
    
    return {
      distance: simulatedDistance,
      duration,
      cost,
      estimatedDelivery: this.formatEstimatedDelivery(duration),
      available: simulatedDistance <= SHIPPING_CONFIG.maxDistance
    }
  }

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