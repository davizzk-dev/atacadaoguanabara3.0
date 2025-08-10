// Cliente para API do Varejo Fácil
// Base URL: https://atacadaoguanabara.varejofacil.com
// API Key: 2625e98175832a17a954db9beb60306a

export interface VarejoFacilProduct {
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
  tabelaA?: string
  tipoBonificacao?: string
  controlaEstoque?: boolean
  participaCotacao?: boolean
  associacao?: string
  composicao?: string
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
  tipoIPI?: string
  tipoAgregacao?: string
  precoVariavel?: boolean
  indiceAT?: string
  producao?: string
  nomeclaturaMercosulId?: string
  nomeclaturaMercosulExcecaoId?: string
  finalidadeProduto?: string
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
  incidenciaIPI?: string
  dataInclusao?: string
  dataAlteracao?: string
  dataSaida?: string
  tipoFatorKit?: string
  baixaNaVendaComposto?: boolean
  quantidadeComposto?: number
  comissaoCapitacao?: number
  comissaoProducao?: number
  comissaoVenda?: number
  pagaComissao?: boolean
  pesoVariavel?: string
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
    tipoDePauta: string
    valorDePauta: number
  }>
  estoqueDoProduto?: Array<{
    lojaId: number
    estoqueMinimo: number
    estoqueMaximo: number
  }>
}

export interface VarejoFacilSection {
  id: number
  idExterno: string
  descricao: string
  criadoEm?: string
  atualizadoEm?: string
}

export interface VarejoFacilBrand {
  id: number
  idExterno: string
  descricao: string
  criadoEm?: string
  atualizadoEm?: string
}

export interface VarejoFacilGenre {
  id: number
  idExterno: string
  descricao: string
  descricaoCompleta?: string
}

export interface VarejoFacilPrice {
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
  origem?: string
}

export interface VarejoFacilApplication {
  id: number
  idExterno: string
  descricao: string
}

export interface VarejoFacilCharacteristic {
  id: number
  idExterno: string
  descricao: string
}

export interface VarejoFacilMix {
  id: number
  descricao: string
  finalidade: string
  lojasIds: number[]
  idExterno?: string
  criadoEm?: string
  atualizadoEm?: string
}

export interface VarejoFacilFamily {
  id: number
  idExterno: string
  descricao: string
  utilizaPrecoPorQuantidade?: boolean
  quantidadeMinimaPreco2?: number
  quantidadeMinimaPreco3?: number
  produtosIds?: number[]
}

export interface VarejoFacilAuxiliaryCode {
  id: string
  idExterno: string
  tipo: string
  fator: number
  eanTributado: boolean
  produtoId: number
}

export interface VarejoFacilGroup {
  id: number
  grupoId: number
  idExterno: string
  descricao: string
  secaoId: number
  criadoEm?: string
  atualizadoEm?: string
}

export interface VarejoFacilResponse<T> {
  start: number
  count: number
  total: number
  items: T[]
}

export interface VarejoFacilError {
  message: string
  id?: string
  idExterno?: string
  reasons?: string[]
}

export class VarejoFacilClient {
  private baseUrl: string
  private apiKey: string
  private authToken: string | null = null

  constructor() {
    this.baseUrl = 'https://atacadaoguanabara.varejofacil.com'
    this.apiKey = '2625e98175832a17a954db9beb60306a'
  }

  // Método para autenticar
  async authenticate(username: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        const result = await response.json()
        this.authToken = result.accessToken || result.id || result.token
        console.log('✅ Autenticação bem-sucedida')
        return true
      } else {
        console.error('❌ Falha na autenticação:', response.status)
        return false
      }
    } catch (error) {
      console.error('❌ Erro na autenticação:', error)
      return false
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Adicionar headers customizados se existirem
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value
        }
      })
    }

    // Usar X-API-Key para autenticação (conforme testado no script)
    headers['X-API-Key'] = this.apiKey
    
    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      console.log(`🔍 Fazendo requisição para: ${url}`)
      const response = await fetch(url, config)
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Erro na API do Varejo Fácil (${response.status}):`, errorText)
        throw new Error(`Erro ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json()
        console.log('✅ Resposta JSON válida!')
        return json
      } else {
        const text = await response.text()
        console.log(`📋 Resposta (primeiros 500 chars): ${text.substring(0, 500)}`)
        return text
      }
    } catch (error) {
      console.error('❌ Erro na requisição para Varejo Fácil:', error)
      throw error
    }
  }

  // ===== PRODUTOS =====
  async getProducts(params?: { 
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<VarejoFacilResponse<VarejoFacilProduct>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.append('q', params.q)
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.start !== undefined) searchParams.append('start', params.start.toString())
    if (params?.count !== undefined) searchParams.append('count', params.count.toString())

    const queryString = searchParams.toString()
    const endpoint = `/v1/produto/produtos${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getProduct(id: number): Promise<VarejoFacilProduct> {
    return this.request(`/v1/produto/produtos/${id}`)
  }

  async getProductByCode(code: string): Promise<VarejoFacilProduct> {
    return this.request(`/v1/produto/produtos/consulta/${code}`)
  }

  async createProduct(product: Partial<VarejoFacilProduct>): Promise<VarejoFacilError> {
    return this.request('/v1/produto/produtos', {
      method: 'POST',
      body: JSON.stringify(product)
    })
  }

  async updateProduct(id: number, product: Partial<VarejoFacilProduct>): Promise<void> {
    return this.request(`/v1/produto/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    })
  }

  async deleteProduct(id: number): Promise<void> {
    return this.request(`/v1/produto/produtos/${id}`, {
      method: 'DELETE'
    })
  }

  async getProductPrices(id: number): Promise<VarejoFacilPrice> {
    return this.request(`/v1/produto/produtos/${id}/precos`)
  }

  async getProductCosts(id: number): Promise<any> {
    return this.request(`/v1/produto/produtos/${id}/custos`)
  }

  // ===== SEÇÕES =====
  async getSections(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<VarejoFacilResponse<VarejoFacilSection>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.append('q', params.q)
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.start !== undefined) searchParams.append('start', params.start.toString())
    if (params?.count !== undefined) searchParams.append('count', params.count.toString())

    const queryString = searchParams.toString()
    const endpoint = `/v1/produto/secoes${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getSection(id: number): Promise<VarejoFacilSection> {
    return this.request(`/v1/produto/secoes/${id}`)
  }

  async createSection(section: Partial<VarejoFacilSection>): Promise<VarejoFacilError> {
    return this.request('/v1/produto/secoes', {
      method: 'POST',
      body: JSON.stringify(section)
    })
  }

  async updateSection(id: number, section: Partial<VarejoFacilSection>): Promise<void> {
    return this.request(`/v1/produto/secoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(section)
    })
  }

  async deleteSection(id: number): Promise<void> {
    return this.request(`/v1/produto/secoes/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== GRUPOS =====
  async getGroups(sectionId: number, params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<VarejoFacilResponse<VarejoFacilGroup>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.append('q', params.q)
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.start !== undefined) searchParams.append('start', params.start.toString())
    if (params?.count !== undefined) searchParams.append('count', params.count.toString())

    const queryString = searchParams.toString()
    const endpoint = `/v1/produto/secoes/${sectionId}/grupos${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getGroup(sectionId: number, id: number): Promise<VarejoFacilGroup> {
    return this.request(`/v1/produto/secoes/${sectionId}/grupos/${id}`)
  }

  async createGroup(sectionId: number, group: Partial<VarejoFacilGroup>): Promise<VarejoFacilError> {
    return this.request(`/v1/produto/secoes/${sectionId}/grupos`, {
      method: 'POST',
      body: JSON.stringify(group)
    })
  }

  async updateGroup(sectionId: number, id: number, group: Partial<VarejoFacilGroup>): Promise<void> {
    return this.request(`/v1/produto/secoes/${sectionId}/grupos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(group)
    })
  }

  async deleteGroup(sectionId: number, id: number): Promise<void> {
    return this.request(`/v1/produto/secoes/${sectionId}/grupos/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== MARCAS =====
  async getBrands(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<VarejoFacilResponse<VarejoFacilBrand>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.append('q', params.q)
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.start !== undefined) searchParams.append('start', params.start.toString())
    if (params?.count !== undefined) searchParams.append('count', params.count.toString())

    const queryString = searchParams.toString()
    const endpoint = `/v1/produto/marcas${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getBrand(id: number): Promise<VarejoFacilBrand> {
    return this.request(`/v1/produto/marcas/${id}`)
  }

  async createBrand(brand: Partial<VarejoFacilBrand>): Promise<VarejoFacilError> {
    return this.request('/v1/produto/marcas', {
      method: 'POST',
      body: JSON.stringify(brand)
    })
  }

  async updateBrand(id: number, brand: Partial<VarejoFacilBrand>): Promise<void> {
    return this.request(`/v1/produto/marcas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(brand)
    })
  }

  async deleteBrand(id: number): Promise<void> {
    return this.request(`/v1/produto/marcas/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== GÊNEROS =====
  async getGenres(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<VarejoFacilResponse<VarejoFacilGenre>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.append('q', params.q)
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.start !== undefined) searchParams.append('start', params.start.toString())
    if (params?.count !== undefined) searchParams.append('count', params.count.toString())

    const queryString = searchParams.toString()
    const endpoint = `/v1/produto/generos${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getGenre(id: number): Promise<VarejoFacilGenre> {
    return this.request(`/v1/produto/generos/${id}`)
  }

  async updateGenre(id: number, genre: Partial<VarejoFacilGenre>): Promise<void> {
    return this.request(`/v1/produto/generos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(genre)
    })
  }

  // ===== PREÇOS =====
  async getPrices(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<VarejoFacilResponse<VarejoFacilPrice>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.append('q', params.q)
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.start !== undefined) searchParams.append('start', params.start.toString())
    if (params?.count !== undefined) searchParams.append('count', params.count.toString())

    const queryString = searchParams.toString()
    const endpoint = `/v1/produto/precos${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getPrice(id: number): Promise<VarejoFacilPrice> {
    return this.request(`/v1/produto/precos/${id}`)
  }

  async updatePrice(id: number, price: Partial<VarejoFacilPrice>): Promise<void> {
    return this.request(`/v1/produto/precos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(price)
    })
  }

  async deletePrice(id: number): Promise<void> {
    return this.request(`/v1/produto/precos/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== APLICAÇÕES =====
  async getApplications(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<VarejoFacilResponse<VarejoFacilApplication>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.append('q', params.q)
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.start !== undefined) searchParams.append('start', params.start.toString())
    if (params?.count !== undefined) searchParams.append('count', params.count.toString())

    const queryString = searchParams.toString()
    const endpoint = `/v1/produto/aplicacoes${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getApplication(id: number): Promise<VarejoFacilApplication> {
    return this.request(`/v1/produto/aplicacoes/${id}`)
  }

  async createApplication(application: Partial<VarejoFacilApplication>): Promise<VarejoFacilError> {
    return this.request('/v1/produto/aplicacoes', {
      method: 'POST',
      body: JSON.stringify(application)
    })
  }

  async updateApplication(id: number, application: Partial<VarejoFacilApplication>): Promise<void> {
    return this.request(`/v1/produto/aplicacoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(application)
    })
  }

  async deleteApplication(id: number): Promise<void> {
    return this.request(`/v1/produto/aplicacoes/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== CARACTERÍSTICAS =====
  async getCharacteristics(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<VarejoFacilResponse<VarejoFacilCharacteristic>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.append('q', params.q)
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.start !== undefined) searchParams.append('start', params.start.toString())
    if (params?.count !== undefined) searchParams.append('count', params.count.toString())

    const queryString = searchParams.toString()
    const endpoint = `/v1/produto/caracteristicas${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getCharacteristic(id: number): Promise<VarejoFacilCharacteristic> {
    return this.request(`/v1/produto/caracteristicas/${id}`)
  }

  async createCharacteristic(characteristic: Partial<VarejoFacilCharacteristic>): Promise<VarejoFacilError> {
    return this.request('/v1/produto/caracteristicas', {
      method: 'POST',
      body: JSON.stringify(characteristic)
    })
  }

  async updateCharacteristic(id: number, characteristic: Partial<VarejoFacilCharacteristic>): Promise<void> {
    return this.request(`/v1/produto/caracteristicas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(characteristic)
    })
  }

  async deleteCharacteristic(id: number): Promise<void> {
    return this.request(`/v1/produto/caracteristicas/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== MIX =====
  async getMix(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<VarejoFacilResponse<VarejoFacilMix>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.append('q', params.q)
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.start !== undefined) searchParams.append('start', params.start.toString())
    if (params?.count !== undefined) searchParams.append('count', params.count.toString())

    const queryString = searchParams.toString()
    const endpoint = `/v1/produto/mix${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getMixById(id: number): Promise<VarejoFacilMix> {
    return this.request(`/v1/produto/mix/${id}`)
  }

  async createMix(mix: Partial<VarejoFacilMix>): Promise<VarejoFacilError> {
    return this.request('/v1/produto/mix', {
      method: 'POST',
      body: JSON.stringify(mix)
    })
  }

  async updateMix(id: number, mix: Partial<VarejoFacilMix>): Promise<void> {
    return this.request(`/v1/produto/mix/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mix)
    })
  }

  async deleteMix(id: number): Promise<void> {
    return this.request(`/v1/produto/mix/${id}`, {
      method: 'DELETE'
    })
  }

  async addProductsToMix(id: number, productIds: number[]): Promise<void> {
    return this.request(`/v1/produto/mix/${id}/produtos`, {
      method: 'POST',
      body: JSON.stringify({ produtosIds: productIds })
    })
  }

  async removeProductsFromMix(id: number): Promise<void> {
    return this.request(`/v1/produto/mix/${id}/produtos`, {
      method: 'DELETE'
    })
  }

  // ===== FAMÍLIAS =====
  async getFamilies(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<VarejoFacilResponse<VarejoFacilFamily>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.append('q', params.q)
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.start !== undefined) searchParams.append('start', params.start.toString())
    if (params?.count !== undefined) searchParams.append('count', params.count.toString())

    const queryString = searchParams.toString()
    const endpoint = `/v1/produto/familias${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getFamily(id: number): Promise<VarejoFacilFamily> {
    return this.request(`/v1/produto/familias/${id}`)
  }

  async createFamily(family: Partial<VarejoFacilFamily>): Promise<VarejoFacilError> {
    return this.request('/v1/produto/familias', {
      method: 'POST',
      body: JSON.stringify(family)
    })
  }

  async updateFamily(id: number, family: Partial<VarejoFacilFamily>): Promise<void> {
    return this.request(`/v1/produto/familias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(family)
    })
  }

  async deleteFamily(id: number): Promise<void> {
    return this.request(`/v1/produto/familias/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== CÓDIGOS AUXILIARES =====
  async getAuxiliaryCodes(params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<VarejoFacilResponse<VarejoFacilAuxiliaryCode>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.append('q', params.q)
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.start !== undefined) searchParams.append('start', params.start.toString())
    if (params?.count !== undefined) searchParams.append('count', params.count.toString())

    const queryString = searchParams.toString()
    const endpoint = `/v1/produto/codigos-auxiliares${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getProductAuxiliaryCodes(productId: string, params?: {
    q?: string
    sort?: string
    start?: number
    count?: number
  }): Promise<VarejoFacilResponse<VarejoFacilAuxiliaryCode>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.append('q', params.q)
    if (params?.sort) searchParams.append('sort', params.sort)
    if (params?.start !== undefined) searchParams.append('start', params.start.toString())
    if (params?.count !== undefined) searchParams.append('count', params.count.toString())

    const queryString = searchParams.toString()
    const endpoint = `/v1/produto/produtos/${productId}/codigos-auxiliares${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getProductAuxiliaryCode(productId: string, id: number): Promise<VarejoFacilAuxiliaryCode> {
    return this.request(`/v1/produto/produtos/${productId}/codigos-auxiliares/${id}`)
  }

  async createProductAuxiliaryCodes(productId: string, codes: Array<{ entity: VarejoFacilAuxiliaryCode, locator: string }>): Promise<any> {
    return this.request(`/v1/produto/produtos/${productId}/codigos-auxiliares`, {
      method: 'POST',
      body: JSON.stringify({ items: codes })
    })
  }

  async updateProductAuxiliaryCode(productId: string, id: number, code: Partial<VarejoFacilAuxiliaryCode>): Promise<void> {
    return this.request(`/v1/produto/produtos/${productId}/codigos-auxiliares/${id}`, {
      method: 'PUT',
      body: JSON.stringify(code)
    })
  }

  async deleteProductAuxiliaryCode(productId: string, id: number): Promise<void> {
    return this.request(`/v1/produto/produtos/${productId}/codigos-auxiliares/${id}`, {
      method: 'DELETE'
    })
  }
}

// Instância singleton do cliente
export const varejoFacilClient = new VarejoFacilClient() 