// Cliente API para integração com o sistema Atacadão Guanabara
// Base URL: https://atacadaoguanabara.varejofacil.com/
// API Key: 2625e98175832a17a954db9beb60306a

const API_BASE_URL = 'https://atacadaoguanabara.varejofacil.com'
const API_KEY = '2625e98175832a17a954db9beb60306a'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface PaginatedResponse<T> {
  start: number
  count: number
  total: number
  items: T[]
}

// Tipos para Produtos
interface Produto {
  id: number
  idExterno: string
  produtoDestinoId?: number
  subgrupoId?: number
  grupoId?: number
  secaoId?: number
  naturezaDeImpostoFederalId?: number
  ncmId?: string
  cest?: number
  quantidadeEtiqueta?: number
  diasDeSeguranca?: number
  codigoInterno: string
  descricao: string
  descricaoReduzida?: string
  tributacaoId?: string
  unidadeDeTransferencia?: string
  validade?: string
  controlaNumeroSerie?: boolean
  tabelaA?: 'NACIONAL' | 'IMPORTADO'
  tipoBonificacao?: 'NAO_GERA_PONTOS' | 'GERA_PONTOS'
  controlaEstoque?: boolean
  participaCotacao?: boolean
  associacao?: 'NORMAL' | 'COMPOSTO'
  composicao?: 'NORMAL' | 'COMPOSTO'
  controlaValidade?: boolean
  validadeMinima?: number
  enviaBalanca?: boolean
  mix?: string
  descricaoVariavel?: boolean
  endereco?: string
  foraDeLinha?: string
  unidadeDeCompra?: string
  unidadeDeReferencia?: string
  codigoANP?: string
  tipoIPI?: 'PERCENTUAL' | 'VALOR'
  tipoAgregacao?: 'PAUTA' | 'VALOR'
  precoVariavel?: boolean
  indiceAT?: 'ARREDONDA' | 'TRUNCA'
  producao?: 'PROPRIO' | 'TERCEIROS'
  nomeclaturaMercosulId?: string
  nomeclaturaMercosulExcecaoId?: string
  finalidadeProduto?: 'COMERCIALIZACAO' | 'CONSUMO'
  modelo?: string
  identificadorDeOrigem?: string
  incentivoZonaFranca?: string
  imagem?: string
  altura?: string
  largura?: string
  comprimento?: string
  unidadeDeVenda?: string
  naturezaId?: string
  textoDaReceita?: string
  permiteDesconto?: boolean
  compoeTotalDaNota?: boolean
  ativoNoEcommerce?: boolean
  atualizaFamilia?: boolean
  frenteLoja?: boolean
  itensEmbalagem?: number
  itensEmbalagemVenda?: number
  itensEmbalagemTransferencia?: number
  custoMedio?: number
  qtdMaximaVenda?: number
  pesoBruto?: number
  pesoLiquido?: number
  fatorBonificacao?: number
  medidaReferencial?: number
  ipi?: number
  valorAgregacao?: number
  percentualPerda?: number
  fatorRendimentoUnidade?: number
  fatorRendimentoCusto?: number
  descontoMaximo1?: number
  descontoMaximo2?: number
  descontoMaximo3?: number
  incidenciaIPI?: 'COMPRA' | 'VENDA'
  dataInclusao?: string
  dataAlteracao?: string
  dataSaida?: string
  tipoFatorKit?: 'PRECO' | 'CUSTO'
  baixaNaVendaComposto?: boolean
  quantidadeComposto?: number
  comissaoCapitacao?: number
  comissaoProducao?: number
  comissaoVenda?: number
  pagaComissao?: boolean
  pesoVariavel?: 'SIM' | 'NAO'
  generoId?: number
  marcaId?: number
  situacaoFiscalId?: number
  situacaoFiscalSaidaId?: number
  funcionarioId?: number
  fornecedorId?: number
  familiaId?: number
  localDeImpressaoId?: number
  aplicacoesIds?: number[]
  caracteristicasIds?: number[]
  componentes?: Array<{
    id: number
    produtoId: number
    quantidade: number
    preco1: number
    preco2: number
    preco3: number
  }>
  regimesDoProduto?: Array<{
    lojaId: number
    regimeEstadualId: number
  }>
  itensImpostosFederais?: Array<{
    id: string
  }>
  pautasDoProduto?: Array<{
    uf: string
    tipoDePauta: 'FIXA' | 'PERCENTUAL'
    valorDePauta: number
  }>
  estoqueDoProduto?: Array<{
    lojaId: number
    estoqueMinimo: number
    estoqueMaximo: number
  }>
}

// Tipos para Seções
interface Secao {
  id: number
  idExterno: string
  descricao: string
  criadoEm?: string
  atualizadoEm?: string
}

// Tipos para Grupos
interface Grupo {
  id: number
  grupoId?: number
  idExterno: string
  descricao: string
  secaoId: number
  criadoEm?: string
  atualizadoEm?: string
}

// Tipos para Marcas
interface Marca {
  id: number
  idExterno: string
  descricao: string
  criadoEm?: string
  atualizadoEm?: string
}

// Tipos para Gêneros
interface Genero {
  id: number
  idExterno: string
  descricao: string
  descricaoCompleta: string
}

// Tipos para Aplicações
interface Aplicacao {
  id: number
  idExterno: string
  descricao: string
}

// Tipos para Características
interface Caracteristica {
  id: number
  idExterno: string
  descricao: string
}

// Tipos para Mix
interface Mix {
  id: number
  descricao: string
  finalidade: string
  lojasIds: number[]
  idExterno: string
  criadoEm?: string
  atualizadoEm?: string
}

// Tipos para Famílias
interface Familia {
  id: number
  idExterno: string
  descricao: string
  utilizaPrecoPorQuantidade: boolean
  quantidadeMinimaPreco2?: number
  quantidadeMinimaPreco3?: number
  produtosIds?: number[]
}

// Tipos para Preços
interface Preco {
  id: number
  idExterno: string
  lojaId: number
  produtoId: number
  precoVenda1: number
  precoOferta1?: number
  margemPreco1?: number
  dataUltimoReajustePreco1?: string
  precoVenda2?: number
  precoOferta2?: number
  margemPreco2?: number
  quantidadeMinimaPreco2?: number
  dataUltimoReajustePreco2?: string
  precoVenda3?: number
  precoOferta3?: number
  margemPreco3?: number
  quantidadeMinimaPreco3?: number
  dataUltimoReajustePreco3?: string
  descontoMaximo?: number
  permiteDesconto?: boolean
  custoProduto?: number
  precoMedioDeReposicao?: number
  precoFiscalDeReposicao?: number
  incentivoEmZonaFranca?: string
  origem?: 'CADASTRO' | 'IMPORTACAO'
}

// Tipos para Códigos Auxiliares
interface CodigoAuxiliar {
  id: string
  idExterno: string
  tipo: 'LITERAL' | 'NUMERICO'
  fator: number
  eanTributado: boolean
  produtoId: number
}

// Classe principal do cliente API
class AtacadaoApiClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string = API_BASE_URL, apiKey: string = API_KEY) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Key': this.apiKey
      }

      const config: RequestInit = {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      }

      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`)
      
      const response = await fetch(url, config)
      
      console.log(`📡 API Response: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // Se não conseguir fazer parse do JSON, usar a mensagem padrão
        }
        
        return {
          success: false,
          error: errorMessage
        }
      }

      // Para respostas vazias (DELETE, etc.)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {
          success: true,
          data: {} as T
        }
      }

      const data = await response.json()
      
      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('❌ API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // ===== PRODUTOS =====
  
  async getProdutos(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<ApiResponse<PaginatedResponse<Produto>>> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.start) queryParams.append('start', params.start.toString())
    if (params?.count) queryParams.append('count', params.count.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/v1/produto/produtos${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaginatedResponse<Produto>>(endpoint)
  }

  async getProduto(id: number): Promise<ApiResponse<Produto>> {
    return this.request<Produto>(`/v1/produto/produtos/${id}`)
  }

  async getProdutoByConsulta(id: string): Promise<ApiResponse<Produto>> {
    return this.request<Produto>(`/v1/produto/produtos/consulta/${id}`)
  }

  async createProduto(produto: Omit<Produto, 'id'>): Promise<ApiResponse<{ id: string; idExterno: string }>> {
    return this.request<{ id: string; idExterno: string }>('/v1/produto/produtos', {
      method: 'POST',
      body: JSON.stringify(produto)
    })
  }

  async updateProduto(id: number, produto: Partial<Produto>): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(produto)
    })
  }

  async deleteProduto(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/produtos/${id}`, {
      method: 'DELETE'
    })
  }

  async getPrecosProduto(id: number): Promise<ApiResponse<Preco>> {
    return this.request<Preco>(`/v1/produto/produtos/${id}/precos`)
  }

  async getCustosProduto(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/v1/produto/produtos/${id}/custos`)
  }

  // ===== SEÇÕES =====

  async getSecoes(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<ApiResponse<PaginatedResponse<Secao>>> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.start) queryParams.append('start', params.start.toString())
    if (params?.count) queryParams.append('count', params.count.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/v1/produto/secoes${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaginatedResponse<Secao>>(endpoint)
  }

  async getSecao(id: number): Promise<ApiResponse<Secao>> {
    return this.request<Secao>(`/v1/produto/secoes/${id}`)
  }

  async createSecao(secao: Omit<Secao, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<ApiResponse<{ id: string; idExterno: string }>> {
    return this.request<{ id: string; idExterno: string }>('/v1/produto/secoes', {
      method: 'POST',
      body: JSON.stringify(secao)
    })
  }

  async updateSecao(id: number, secao: Partial<Secao>): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/secoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(secao)
    })
  }

  async deleteSecao(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/secoes/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== GRUPOS =====

  async getGrupos(secaoId: string, params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<ApiResponse<PaginatedResponse<Grupo>>> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.start) queryParams.append('start', params.start.toString())
    if (params?.count) queryParams.append('count', params.count.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/v1/produto/secoes/${secaoId}/grupos${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaginatedResponse<Grupo>>(endpoint)
  }

  async getGrupo(secaoId: string, id: number): Promise<ApiResponse<Grupo>> {
    return this.request<Grupo>(`/v1/produto/secoes/${secaoId}/grupos/${id}`)
  }

  async createGrupo(secaoId: string, grupo: Omit<Grupo, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<ApiResponse<{ id: string; idExterno: string }>> {
    return this.request<{ id: string; idExterno: string }>(`/v1/produto/secoes/${secaoId}/grupos`, {
      method: 'POST',
      body: JSON.stringify(grupo)
    })
  }

  async updateGrupo(secaoId: string, id: number, grupo: Partial<Grupo>): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/secoes/${secaoId}/grupos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(grupo)
    })
  }

  async deleteGrupo(secaoId: string, id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/secoes/${secaoId}/grupos/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== MARCAS =====

  async getMarcas(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<ApiResponse<PaginatedResponse<Marca>>> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.start) queryParams.append('start', params.start.toString())
    if (params?.count) queryParams.append('count', params.count.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/v1/produto/marcas${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaginatedResponse<Marca>>(endpoint)
  }

  async getMarca(id: number): Promise<ApiResponse<Marca>> {
    return this.request<Marca>(`/v1/produto/marcas/${id}`)
  }

  async createMarca(marca: Omit<Marca, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<ApiResponse<{ id: string; idExterno: string }>> {
    return this.request<{ id: string; idExterno: string }>('/v1/produto/marcas', {
      method: 'POST',
      body: JSON.stringify(marca)
    })
  }

  async updateMarca(id: number, marca: Partial<Marca>): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/marcas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(marca)
    })
  }

  async deleteMarca(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/marcas/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== GÊNEROS =====

  async getGeneros(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<ApiResponse<PaginatedResponse<Genero>>> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.start) queryParams.append('start', params.start.toString())
    if (params?.count) queryParams.append('count', params.count.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/v1/produto/generos${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaginatedResponse<Genero>>(endpoint)
  }

  async getGenero(id: number): Promise<ApiResponse<Genero>> {
    return this.request<Genero>(`/v1/produto/generos/${id}`)
  }

  async updateGenero(id: number, genero: Partial<Genero>): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/generos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(genero)
    })
  }

  // ===== APLICAÇÕES =====

  async getAplicacoes(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<ApiResponse<PaginatedResponse<Aplicacao>>> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.start) queryParams.append('start', params.start.toString())
    if (params?.count) queryParams.append('count', params.count.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/v1/produto/aplicacoes${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaginatedResponse<Aplicacao>>(endpoint)
  }

  async getAplicacao(id: number): Promise<ApiResponse<Aplicacao>> {
    return this.request<Aplicacao>(`/v1/produto/aplicacoes/${id}`)
  }

  async createAplicacao(aplicacao: Omit<Aplicacao, 'id'>): Promise<ApiResponse<{ id: string; idExterno: string }>> {
    return this.request<{ id: string; idExterno: string }>('/v1/produto/aplicacoes', {
      method: 'POST',
      body: JSON.stringify(aplicacao)
    })
  }

  async updateAplicacao(id: number, aplicacao: Partial<Aplicacao>): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/aplicacoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(aplicacao)
    })
  }

  async deleteAplicacao(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/aplicacoes/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== CARACTERÍSTICAS =====

  async getCaracteristicas(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<ApiResponse<PaginatedResponse<Caracteristica>>> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.start) queryParams.append('start', params.start.toString())
    if (params?.count) queryParams.append('count', params.count.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/v1/produto/caracteristicas${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaginatedResponse<Caracteristica>>(endpoint)
  }

  async getCaracteristica(id: number): Promise<ApiResponse<Caracteristica>> {
    return this.request<Caracteristica>(`/v1/produto/caracteristicas/${id}`)
  }

  async createCaracteristica(caracteristica: Omit<Caracteristica, 'id'>): Promise<ApiResponse<{ id: string; idExterno: string }>> {
    return this.request<{ id: string; idExterno: string }>('/v1/produto/caracteristicas', {
      method: 'POST',
      body: JSON.stringify(caracteristica)
    })
  }

  async updateCaracteristica(id: number, caracteristica: Partial<Caracteristica>): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/caracteristicas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(caracteristica)
    })
  }

  async deleteCaracteristica(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/caracteristicas/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== MIX =====

  async getMix(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<ApiResponse<PaginatedResponse<Mix>>> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.start) queryParams.append('start', params.start.toString())
    if (params?.count) queryParams.append('count', params.count.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/v1/produto/mix${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaginatedResponse<Mix>>(endpoint)
  }

  async getMixById(id: number): Promise<ApiResponse<Mix>> {
    return this.request<Mix>(`/v1/produto/mix/${id}`)
  }

  async createMix(mix: Omit<Mix, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<ApiResponse<{ id: string; idExterno: string }>> {
    return this.request<{ id: string; idExterno: string }>('/v1/produto/mix', {
      method: 'POST',
      body: JSON.stringify(mix)
    })
  }

  async updateMix(id: number, mix: Partial<Mix>): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/mix/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mix)
    })
  }

  async deleteMix(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/mix/${id}`, {
      method: 'DELETE'
    })
  }

  async addProdutosToMix(id: number, produtosIds: number[]): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/mix/${id}/produtos`, {
      method: 'POST',
      body: JSON.stringify({ produtosIds })
    })
  }

  async removeProdutosFromMix(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/mix/${id}/produtos`, {
      method: 'DELETE'
    })
  }

  // ===== FAMÍLIAS =====

  async getFamilias(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<ApiResponse<PaginatedResponse<Familia>>> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.start) queryParams.append('start', params.start.toString())
    if (params?.count) queryParams.append('count', params.count.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/v1/produto/familias${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaginatedResponse<Familia>>(endpoint)
  }

  async getFamilia(id: number): Promise<ApiResponse<Familia>> {
    return this.request<Familia>(`/v1/produto/familias/${id}`)
  }

  async createFamilia(familia: Omit<Familia, 'id'>): Promise<ApiResponse<{ id: string; idExterno: string }>> {
    return this.request<{ id: string; idExterno: string }>('/v1/produto/familias', {
      method: 'POST',
      body: JSON.stringify(familia)
    })
  }

  async updateFamilia(id: number, familia: Partial<Familia>): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/familias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(familia)
    })
  }

  async deleteFamilia(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/familias/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== PREÇOS =====

  async getPrecos(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<ApiResponse<PaginatedResponse<Preco>>> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.start) queryParams.append('start', params.start.toString())
    if (params?.count) queryParams.append('count', params.count.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/v1/produto/precos${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaginatedResponse<Preco>>(endpoint)
  }

  async getPreco(id: number): Promise<ApiResponse<Preco>> {
    return this.request<Preco>(`/v1/produto/precos/${id}`)
  }

  async updatePreco(id: number, preco: Partial<Preco>): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/precos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(preco)
    })
  }

  async deletePreco(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/precos/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== CÓDIGOS AUXILIARES =====

  async getCodigosAuxiliares(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<ApiResponse<PaginatedResponse<CodigoAuxiliar>>> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.start) queryParams.append('start', params.start.toString())
    if (params?.count) queryParams.append('count', params.count.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/v1/produto/codigos-auxiliares${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaginatedResponse<CodigoAuxiliar>>(endpoint)
  }

  async getCodigosAuxiliaresProduto(produtoId: string, params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<ApiResponse<PaginatedResponse<CodigoAuxiliar>>> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.start) queryParams.append('start', params.start.toString())
    if (params?.count) queryParams.append('count', params.count.toString())
    
    const queryString = queryParams.toString()
    const endpoint = `/v1/produto/produtos/${produtoId}/codigos-auxiliares${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaginatedResponse<CodigoAuxiliar>>(endpoint)
  }

  async createCodigosAuxiliares(produtoId: string, codigos: Array<{
    entity: Omit<CodigoAuxiliar, 'id'>
    locator: string
  }>): Promise<ApiResponse<{
    successes: Array<{
      locator: string
      location: string
      reasons: string[]
    }>
    errors: Array<{
      locator: string
      location: string
      reasons: string[]
    }>
    pending: Array<{
      locator: string
      location: string
      reasons: string[]
    }>
  }>> {
    return this.request(`/v1/produto/produtos/${produtoId}/codigos-auxiliares`, {
      method: 'POST',
      body: JSON.stringify({ items: codigos })
    })
  }

  async getCodigoAuxiliar(produtoId: string, id: number): Promise<ApiResponse<CodigoAuxiliar>> {
    return this.request<CodigoAuxiliar>(`/v1/produto/produtos/${produtoId}/codigos-auxiliares/${id}`)
  }

  async updateCodigoAuxiliar(produtoId: string, id: number, codigo: Partial<CodigoAuxiliar>): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/produtos/${produtoId}/codigos-auxiliares/${id}`, {
      method: 'PUT',
      body: JSON.stringify(codigo)
    })
  }

  async deleteCodigoAuxiliar(produtoId: string, id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/v1/produto/produtos/${produtoId}/codigos-auxiliares/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== TIPOS DE CLASSIFICAÇÃO DE LOJA =====

  async createTipoClassificacaoLoja(data: {
    id: number
    descricao: string
  }): Promise<ApiResponse<{ id: string; idExterno: string }>> {
    return this.request<{ id: string; idExterno: string }>('/v1/pessoa/lojas/tipo-classificacao', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

// Instância singleton do cliente API
export const atacadaoApi = new AtacadaoApiClient()

// Exportar tipos para uso em outros arquivos
export type {
  ApiResponse,
  PaginatedResponse,
  Produto,
  Secao,
  Grupo,
  Marca,
  Genero,
  Aplicacao,
  Caracteristica,
  Mix,
  Familia,
  Preco,
  CodigoAuxiliar
}

export default AtacadaoApiClient 