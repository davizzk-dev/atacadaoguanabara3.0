# 🗺️ Configurar Google Maps API - Guia Rápido

## 🚨 Problema Atual
A API está retornando erro `REQUEST_DENIED` porque a chave não está configurada corretamente.

## ✅ Solução Passo a Passo

### 1. **Acessar Google Cloud Console**
- Vá para: https://console.cloud.google.com/
- Faça login com sua conta Google
- Selecione ou crie um projeto

### 2. **Habilitar APIs**
- Menu lateral → "APIs & Services" → "Library"
- Procure e habilite:
  - ✅ **Geocoding API**
  - ✅ **Directions API**
  - ✅ **Maps JavaScript API**

### 3. **Configurar Credenciais**
- Menu lateral → "APIs & Services" → "Credentials"
- Clique na chave: `AIzaSyA3aZFlvbQhG2EjwDTamtnPbWkSa8ntzw8`

### 4. **Configurar Restrições**
**Application restrictions:**
- Selecione: "HTTP referrers (web sites)"
- Adicione: `http://localhost:3000/*`
- Para produção: `https://seudominio.com/*`

**API restrictions:**
- Selecione: "Restrict key"
- Escolha as 3 APIs que você habilitou

### 5. **Salvar e Testar**
- Clique em "Save"
- Aguarde alguns minutos para propagar
- Teste no sistema

## 🧪 Como Testar

### Teste 1: Verificar se a API está funcionando
```bash
# Execute este teste
node test-shipping-fix.js
```

### Teste 2: Verificar logs
- Abra o console do navegador (F12)
- Vá para o carrinho de compras
- Calcule frete
- Veja se aparece: "✅ Frete calculado com sucesso via Google Maps"

## 📊 Resultado Esperado

**Antes (com erro):**
```
❌ Status da API não OK: REQUEST_DENIED
```

**Depois (funcionando):**
```
✅ Coordenadas obtidas
✅ Rota calculada com Google Maps
✅ Frete calculado com sucesso via Google Maps
```

## 🔧 Configurações Importantes

### URLs Autorizadas (HTTP referrers):
- `http://localhost:3000/*` (desenvolvimento)
- `https://seudominio.com/*` (produção)

### APIs Necessárias:
- Geocoding API
- Directions API  
- Maps JavaScript API

### Restrições de API:
- Restringir a chave apenas às APIs necessárias
- Não deixar "None" (sem restrições)

## ⚠️ Problemas Comuns

### Erro: "REQUEST_DENIED"
- ✅ Verificar se as APIs estão habilitadas
- ✅ Verificar se as restrições estão corretas
- ✅ Aguardar alguns minutos após salvar

### Erro: "OVER_QUERY_LIMIT"
- ✅ Verificar se há limite de requisições
- ✅ Aguardar alguns minutos

### Erro: "ZERO_RESULTS"
- ✅ Verificar se o endereço está correto
- ✅ Tentar com endereço mais específico

## 🎯 Status Atual

- [x] Sistema configurado para usar APENAS Google Maps API
- [x] Fallback removido
- [ ] API configurada no Google Cloud Console
- [ ] Testes realizados

**Após configurar a API no Google Cloud Console, o sistema usará distâncias reais do Google Maps!** 🚀 