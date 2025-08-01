# Implementação do Frete - R$ 3,00 por km

## Configurações Implementadas

### Taxa de Frete
- **Valor por km**: R$ 3,00 (conforme solicitado)
- **Custo base**: Removido (R$ 0,00)
- **Cálculo**: Apenas distância × R$ 3,00

### Regras de Frete Grátis
- **Frete grátis**: Pedidos acima de R$ 150,00
- **Frete grátis local**: Pedidos acima de R$ 100,00 e distância ≤ 3km
- **Distância máxima**: 20km

### Endereço da Loja
- **Endereço**: Rua Antônio Arruda, 1170, Vila Velha, Fortaleza, CE
- **Coordenadas**: 
  - Latitude: -3.7319
  - Longitude: -38.5267

## Funcionalidades Implementadas

### 1. Cálculo de Frete via Google Maps API
- Geocodificação de endereços
- Cálculo de rotas e distâncias
- Integração com Google Directions API

### 2. Interface Atualizada
- Informações sobre frete na página do carrinho
- Exibição da taxa de R$ 3,00 por km
- Indicação de frete grátis para pedidos acima de R$ 150,00

### 3. APIs Disponíveis
- `/api/shipping/calculate` - Calcula frete
- `/api/shipping/zipcode/[code]` - Busca endereço por CEP

## Exemplo de Cálculo

### Pedido de R$ 80,00 para endereço a 5km
- Distância: 5km
- Custo: 5 × R$ 3,00 = R$ 15,00
- Total: R$ 80,00 + R$ 15,00 = R$ 95,00

### Pedido de R$ 200,00 para qualquer endereço
- Frete: GRÁTIS (acima de R$ 150,00)
- Total: R$ 200,00

## Configurações no Código

### Arquivo: `lib/shipping.ts`
```typescript
const SHIPPING_CONFIG = {
  baseCost: 0.00, // Custo base (removido)
  costPerKm: 3.00, // R$ 3,00 por km
  maxDistance: 20, // Distância máxima
  minOrderValue: 100.00, // Valor mínimo para frete grátis local
  freeShippingThreshold: 150.00 // Valor para frete grátis
}
```

### Endereço da Loja
```typescript
const STORE_COORDINATES = {
  lat: -3.7319, // Vila Velha, Fortaleza
  lng: -38.5267
}
```

## Como Usar

1. **No carrinho**: Preencha o endereço completo
2. **Clique em "Calcular Frete"**: Sistema calcula automaticamente
3. **Visualize**: Distância, tempo estimado e custo do frete
4. **Frete grátis**: Aplicado automaticamente para pedidos elegíveis

## Configuração da API

### Chave do Google Maps
A API está configurada com a chave: `AIzaSyA3aZFlvbQhG2EjwDTamtnPbWkSa8ntzw8`

### APIs Utilizadas
- **Google Geocoding API**: Converte endereços em coordenadas
- **Google Directions API**: Calcula rotas e distâncias

## Observações

- Sistema usa Google Maps API para cálculos precisos
- Fallback para cálculo simulado se API não estiver disponível
- Validação de CEP e endereços
- Interface responsiva e intuitiva
- Teste disponível em `test-shipping.js` 