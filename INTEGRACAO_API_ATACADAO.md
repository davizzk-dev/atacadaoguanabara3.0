# Integração com API do Atacadão Guanabara

Este documento descreve a integração implementada com a API externa do Atacadão Guanabara para gerenciamento de produtos.

## 📋 Visão Geral

A integração permite gerenciar produtos, seções, marcas, gêneros e outras entidades através da API do Atacadão Guanabara, mantendo a sincronização entre o sistema local e o sistema externo.

## 🔗 Configuração da API

### Endpoint Base
```
https://atacadaoguanabara.varejofacil.com
```

### Chave da API
```
2625e98175832a17a954db9beb60306a
```

## 🏗️ Arquitetura da Integração

### 1. Cliente API (`/lib/api-client.ts`)
- Classe `AtacadaoApiClient` para gerenciar todas as chamadas da API
- Tratamento de erros e autenticação
- Tipos TypeScript para todas as entidades

### 2. API Routes (`/app/api/atacadao/`)
- `/products` - Gerenciamento de produtos
- `/products/[id]` - Operações CRUD em produtos específicos
- `/secoes` - Listagem de seções
- `/marcas` - Listagem de marcas
- `/generos` - Listagem de gêneros

### 3. Interface Administrativa
- Nova aba "Produtos API" no painel administrativo
- Formulários para criar/editar produtos
- Filtros e pesquisa
- Integração com notificações e logs

## 📦 Entidades Suportadas

### Produtos
- **GET** `/v1/produto/produtos` - Listar produtos
- **GET** `/v1/produto/produtos/{id}` - Buscar produto específico
- **GET** `/v1/produto/produtos/consulta/{id}` - Buscar por ID ou EAN
- **POST** `/v1/produto/produtos` - Criar produto
- **PUT** `/v1/produto/produtos/{id}` - Atualizar produto
- **DELETE** `/v1/produto/produtos/{id}` - Deletar produto

### Seções
- **GET** `/v1/produto/secoes` - Listar seções
- **GET** `/v1/produto/secoes/{id}` - Buscar seção específica
- **POST** `/v1/produto/secoes` - Criar seção
- **PUT** `/v1/produto/secoes/{id}` - Atualizar seção
- **DELETE** `/v1/produto/secoes/{id}` - Deletar seção

### Grupos
- **GET** `/v1/produto/secoes/{secaoId}/grupos` - Listar grupos de uma seção
- **GET** `/v1/produto/secoes/{secaoId}/grupos/{id}` - Buscar grupo específico
- **POST** `/v1/produto/secoes/{secaoId}/grupos` - Criar grupo
- **PUT** `/v1/produto/secoes/{secaoId}/grupos/{id}` - Atualizar grupo
- **DELETE** `/v1/produto/secoes/{secaoId}/grupos/{id}` - Deletar grupo

### Marcas
- **GET** `/v1/produto/marcas` - Listar marcas
- **GET** `/v1/produto/marcas/{id}` - Buscar marca específica
- **POST** `/v1/produto/marcas` - Criar marca
- **PUT** `/v1/produto/marcas/{id}` - Atualizar marca
- **DELETE** `/v1/produto/marcas/{id}` - Deletar marca

### Gêneros
- **GET** `/v1/produto/generos` - Listar gêneros
- **GET** `/v1/produto/generos/{id}` - Buscar gênero específico
- **PUT** `/v1/produto/generos/{id}` - Atualizar gênero

### Aplicações
- **GET** `/v1/produto/aplicacoes` - Listar aplicações
- **GET** `/v1/produto/aplicacoes/{id}` - Buscar aplicação específica
- **POST** `/v1/produto/aplicacoes` - Criar aplicação
- **PUT** `/v1/produto/aplicacoes/{id}` - Atualizar aplicação
- **DELETE** `/v1/produto/aplicacoes/{id}` - Deletar aplicação

### Características
- **GET** `/v1/produto/caracteristicas` - Listar características
- **GET** `/v1/produto/caracteristicas/{id}` - Buscar característica específica
- **POST** `/v1/produto/caracteristicas` - Criar característica
- **PUT** `/v1/produto/caracteristicas/{id}` - Atualizar característica
- **DELETE** `/v1/produto/caracteristicas/{id}` - Deletar característica

### Mix
- **GET** `/v1/produto/mix` - Listar mix
- **GET** `/v1/produto/mix/{id}` - Buscar mix específico
- **POST** `/v1/produto/mix` - Criar mix
- **PUT** `/v1/produto/mix/{id}` - Atualizar mix
- **DELETE** `/v1/produto/mix/{id}` - Deletar mix
- **POST** `/v1/produto/mix/{id}/produtos` - Adicionar produtos ao mix
- **DELETE** `/v1/produto/mix/{id}/produtos` - Remover produtos do mix

### Famílias
- **GET** `/v1/produto/familias` - Listar famílias
- **GET** `/v1/produto/familias/{id}` - Buscar família específica
- **POST** `/v1/produto/familias` - Criar família
- **PUT** `/v1/produto/familias/{id}` - Atualizar família
- **DELETE** `/v1/produto/familias/{id}` - Deletar família

### Preços
- **GET** `/v1/produto/precos` - Listar preços
- **GET** `/v1/produto/precos/{id}` - Buscar preço específico
- **PUT** `/v1/produto/precos/{id}` - Atualizar preço
- **DELETE** `/v1/produto/precos/{id}` - Deletar preço

### Códigos Auxiliares
- **GET** `/v1/produto/codigos-auxiliares` - Listar códigos auxiliares
- **GET** `/v1/produto/produtos/{produtoId}/codigos-auxiliares` - Listar códigos de um produto
- **POST** `/v1/produto/produtos/{produtoId}/codigos-auxiliares` - Criar códigos auxiliares
- **GET** `/v1/produto/produtos/{produtoId}/codigos-auxiliares/{id}` - Buscar código específico
- **PUT** `/v1/produto/produtos/{produtoId}/codigos-auxiliares/{id}` - Atualizar código
- **DELETE** `/v1/produto/produtos/{produtoId}/codigos-auxiliares/{id}` - Deletar código

## 🎯 Como Usar

### 1. Acessar o Painel Administrativo
1. Faça login no sistema
2. Acesse o painel administrativo
3. Clique na aba "Produtos API"

### 2. Gerenciar Produtos
- **Listar**: Os produtos são carregados automaticamente
- **Criar**: Clique em "Novo Produto" e preencha o formulário
- **Editar**: Clique no ícone de edição ao lado do produto
- **Deletar**: Clique no ícone de lixeira ao lado do produto

### 3. Filtrar e Pesquisar
- Use a barra de pesquisa para buscar por nome, código ou ID externo
- Filtre por seção ou marca usando os dropdowns
- Visualize o número total de produtos encontrados

### 4. Configurações de Produto
O formulário de produto inclui:
- **Informações Básicas**: ID externo, código interno, descrição
- **Classificação**: Seção, marca, gênero
- **Configurações**: Controle de estoque, e-commerce, descontos, etc.

## 🔧 Configuração Técnica

### Variáveis de Ambiente
```env
ATACADAO_API_BASE_URL=https://atacadaoguanabara.varejofacil.com
ATACADAO_API_KEY=2625e98175832a17a954db9beb60306a
```

### Dependências
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 📊 Estrutura de Dados

### Produto
```typescript
interface Produto {
  id: number
  idExterno: string
  codigoInterno: string
  descricao: string
  descricaoReduzida?: string
  secaoId?: number
  marcaId?: number
  generoId?: number
  unidadeDeVenda?: string
  controlaEstoque?: boolean
  ativoNoEcommerce?: boolean
  permiteDesconto?: boolean
  // ... outros campos
}
```

### Seção
```typescript
interface Secao {
  id: number
  idExterno: string
  descricao: string
  criadoEm?: string
  atualizadoEm?: string
}
```

### Marca
```typescript
interface Marca {
  id: number
  idExterno: string
  descricao: string
  criadoEm?: string
  atualizadoEm?: string
}
```

## 🚨 Tratamento de Erros

### Códigos de Status HTTP
- **200** - Sucesso
- **201** - Recurso criado
- **400** - Requisição inválida
- **401** - Não autorizado
- **404** - Não encontrado
- **409** - Conflito
- **422** - Erro de validação
- **500** - Erro interno do servidor

### Logs e Notificações
- Todas as operações são logadas no console
- Notificações são exibidas na interface
- Logs de atividade são mantidos no painel administrativo

## 🔄 Sincronização

### Carregamento Automático
- Os dados são carregados automaticamente quando a aba é acessada
- Atualização manual disponível através do botão "Atualizar"
- Cache local para melhor performance

### Validação de Dados
- Validação de campos obrigatórios
- Verificação de tipos de dados
- Tratamento de erros de rede

## 🛠️ Manutenção

### Monitoramento
- Verificar logs do console para erros
- Monitorar status das APIs
- Verificar conectividade com a API externa

### Troubleshooting
1. **Erro de conexão**: Verificar se a API está online
2. **Erro de autenticação**: Verificar se a chave da API está correta
3. **Erro de validação**: Verificar se os dados estão no formato correto
4. **Timeout**: Verificar se a API está respondendo dentro do tempo esperado

## 📈 Próximos Passos

### Funcionalidades Planejadas
- [ ] Sincronização em lote
- [ ] Importação/exportação de dados
- [ ] Relatórios de integração
- [ ] Webhooks para atualizações em tempo real
- [ ] Cache inteligente
- [ ] Retry automático em caso de falha

### Melhorias Técnicas
- [ ] Implementar rate limiting
- [ ] Adicionar métricas de performance
- [ ] Implementar cache distribuído
- [ ] Adicionar testes automatizados
- [ ] Documentação da API com Swagger

## 📞 Suporte

Para dúvidas ou problemas com a integração:
1. Verificar os logs do sistema
2. Consultar a documentação da API externa
3. Entrar em contato com o suporte técnico

---

**Versão**: 1.0.0  
**Última atualização**: Dezembro 2024  
**Autor**: Sistema Atacadão Guanabara 