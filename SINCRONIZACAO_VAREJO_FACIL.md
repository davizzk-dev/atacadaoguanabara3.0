# Sincronização com API do Varejo Fácil

Este documento explica como usar a sincronização com a API do Varejo Fácil para buscar produtos, seções, marcas e outros dados.

## Configuração

A API está configurada para conectar com:
- **URL Base**: `https://atacadaoguanabara.varejofacil.com`
- **API Key**: `2625e98175832a17a954db9beb60306a`

## Como Usar

### 1. Via Painel de Admin (Recomendado)

1. Acesse o painel de admin em `/admin`
2. Clique no botão **"Sincronizar Varejo Fácil"**
3. Aguarde a sincronização ser concluída
4. Os dados serão salvos automaticamente no arquivo `data/products.json`

### 2. Via Script de Linha de Comando

```bash
# Testar a conexão com a API
npm run test-sync

# Executar sincronização completa
npm run sync-varejo-facil
```

### 3. Via API REST

```bash
# Iniciar sincronização
curl -X POST http://localhost:3000/api/sync-varejo-facil

# Verificar status da última sincronização
curl http://localhost:3000/api/sync-varejo-facil
```

## Dados Sincronizados

A sincronização busca os seguintes dados em lotes de 200 registros:

### Produtos (`/v1/produto/produtos`)
- ID, código interno, descrição
- Categorização (seção, grupo, subgrupo)
- Informações de estoque e vendas
- Características e aplicações
- Preços e custos

### Seções (`/v1/produto/secoes`)
- Categorias principais de produtos
- Organização hierárquica

### Marcas (`/v1/produto/marcas`)
- Fabricantes e marcas dos produtos

### Gêneros (`/v1/produto/generos`)
- Classificação por tipo de produto

### Preços (`/v1/produto/precos`)
- Preços de venda (1, 2, 3)
- Preços de oferta
- Margens e custos

### Aplicações (`/v1/produto/aplicacoes`)
- Usos e aplicações dos produtos

### Características (`/v1/produto/caracteristicas`)
- Atributos específicos dos produtos

## Estrutura do Arquivo products.json

```json
{
  "lastSync": "2024-01-01T12:00:00.000Z",
  "products": [...],
  "sections": [...],
  "brands": [...],
  "genres": [...],
  "prices": [...],
  "applications": [...],
  "characteristics": [...],
  "totalProducts": 1500,
  "totalSections": 50,
  "totalBrands": 200,
  "totalGenres": 100,
  "totalPrices": 1500,
  "totalApplications": 30,
  "totalCharacteristics": 80
}
```

## Endpoints da API Varejo Fácil

### Produtos
- `GET /v1/produto/produtos` - Listar produtos
- `GET /v1/produto/produtos/{id}` - Buscar produto específico
- `GET /v1/produto/produtos/consulta/{code}` - Buscar por código/EAN

### Seções
- `GET /v1/produto/secoes` - Listar seções
- `POST /v1/produto/secoes` - Criar seção
- `PUT /v1/produto/secoes/{id}` - Atualizar seção
- `DELETE /v1/produto/secoes/{id}` - Remover seção

### Marcas
- `GET /v1/produto/marcas` - Listar marcas
- `POST /v1/produto/marcas` - Criar marca
- `PUT /v1/produto/marcas/{id}` - Atualizar marca
- `DELETE /v1/produto/marcas/{id}` - Remover marca

### Gêneros
- `GET /v1/produto/generos` - Listar gêneros
- `PUT /v1/produto/generos/{id}` - Atualizar gênero

### Preços
- `GET /v1/produto/precos` - Listar preços
- `PUT /v1/produto/precos/{id}` - Atualizar preço
- `DELETE /v1/produto/precos/{id}` - Remover preço

### Aplicações
- `GET /v1/produto/aplicacoes` - Listar aplicações
- `POST /v1/produto/aplicacoes` - Criar aplicação
- `PUT /v1/produto/aplicacoes/{id}` - Atualizar aplicação
- `DELETE /v1/produto/aplicacoes/{id}` - Remover aplicação

### Características
- `GET /v1/produto/caracteristicas` - Listar características
- `POST /v1/produto/caracteristicas` - Criar característica
- `PUT /v1/produto/caracteristicas/{id}` - Atualizar característica
- `DELETE /v1/produto/caracteristicas/{id}` - Remover característica

## Parâmetros de Paginação

Todos os endpoints de listagem suportam paginação:

- `start` - Posição inicial (ex: 0, 200, 400)
- `count` - Quantidade de registros (máximo 200)
- `q` - Query de busca (FIQL)
- `sort` - Ordenação

Exemplo:
```
GET /v1/produto/produtos?start=0&count=200&sort=descricao
```

## Tratamento de Erros

A sincronização inclui:

1. **Retry automático** em caso de falhas temporárias
2. **Pausa entre lotes** para não sobrecarregar a API
3. **Logs detalhados** para debug
4. **Validação de dados** antes de salvar

## Monitoramento

### Logs da Sincronização
```bash
# Ver logs em tempo real
tail -f logs/sync.log

# Ver logs do servidor Next.js
npm run dev
```

### Status da Sincronização
```bash
# Verificar status via API
curl http://localhost:3000/api/sync-varejo-facil

# Verificar arquivo de dados
ls -la data/products.json
```

## Troubleshooting

### Erro 401 - Não Autorizado
- Verificar se a API Key está correta
- Verificar se a API Key não expirou

### Erro 429 - Rate Limit
- Aumentar pausa entre lotes
- Reduzir tamanho do lote

### Erro de Conexão
- Verificar conectividade com a internet
- Verificar se a URL da API está acessível

### Dados Incompletos
- Verificar logs para identificar onde parou
- Executar sincronização novamente

## Performance

### Tempo Estimado
- **Produtos**: ~5-10 minutos (dependendo da quantidade)
- **Preços**: ~3-5 minutos
- **Dados auxiliares**: ~1-2 minutos

### Otimizações
- Lotes de 200 registros
- Pausa de 1 segundo entre lotes
- Processamento paralelo quando possível

## Backup e Restauração

### Backup Manual
```bash
# Fazer backup do arquivo de dados
cp data/products.json data/products-backup-$(date +%Y%m%d).json
```

### Restauração
```bash
# Restaurar de um backup
cp data/products-backup-20240101.json data/products.json
```

## Desenvolvimento

### Estrutura de Arquivos
```
lib/
  varejo-facil-client.ts    # Cliente da API
app/api/
  sync-varejo-facil/        # API de sincronização
  varejo-facil/             # APIs proxy
scripts/
  test-sync.js             # Script de teste
  async.js                 # Script de sincronização
```

### Adicionando Novos Endpoints

1. Adicionar método no `varejo-facil-client.ts`
2. Criar API proxy em `app/api/varejo-facil/`
3. Incluir na sincronização em `app/api/sync-varejo-facil/route.ts`
4. Atualizar documentação

## Suporte

Para problemas ou dúvidas:
1. Verificar logs de erro
2. Executar script de teste
3. Verificar documentação da API
4. Contatar suporte técnico 