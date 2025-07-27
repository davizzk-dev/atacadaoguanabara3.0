import fs from 'fs'
import path from 'path'

const DB_FILE = path.join(process.cwd(), 'data.json')

// Estrutura inicial do banco
const initialData = {
  products: [],
  camera_requests: [],
  feedback: [],
  orders: [],
  settings: {
    store_name: 'Atacadão Guanabara',
    store_address: 'R. Antônio Arruda, 1170 - Vila Velha, Fortaleza/CE',
    store_phone: '(85) 98514-7067',
    store_email: 'atacadaoguanabara@outlook.com',
    store_hours: 'Seg-Sex: 8h às 18h | Sáb: 8h às 17h',
    whatsapp_number: '5585985147067'
  }
}

// Função para garantir que o arquivo existe
export function ensureDataFile(filePath: string, defaultData: any = []) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2))
  }
}

// Função para ler dados de um arquivo específico
export function readDataFile(filePath: string, defaultData: any = []) {
  try {
    ensureDataFile(filePath, defaultData)
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`, error)
    return defaultData
  }
}

// Função para escrever dados em um arquivo específico
export function writeDataFile(filePath: string, data: any) {
  try {
    ensureDataFile(filePath)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Erro ao escrever arquivo ${filePath}:`, error)
  }
}

// Função para ler dados
function readData() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8')
      return JSON.parse(data)
    }
    return initialData
  } catch (error) {
    console.error('Erro ao ler dados:', error)
    return initialData
  }
}

// Função para escrever dados
function writeData(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Erro ao escrever dados:', error)
  }
}

// Funções para produtos
export async function getProducts() {
  const data = readData()
  return data.products || []
}

export async function addProduct(product: any) {
  const data = readData()
  const newProduct = {
    id: Date.now().toString(),
    ...product,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  data.products.push(newProduct)
  writeData(data)
  return newProduct
}

export async function updateProduct(id: string, updates: any) {
  const data = readData()
  const index = data.products.findIndex((p: any) => p.id === id)
  if (index !== -1) {
    data.products[index] = { ...data.products[index], ...updates, updatedAt: new Date().toISOString() }
    writeData(data)
    return data.products[index]
  }
  return null
}

export async function deleteProduct(id: string) {
  const data = readData()
  data.products = data.products.filter((p: any) => p.id !== id)
  writeData(data)
}

// Funções para solicitações de câmera
export async function getCameraRequests() {
  const data = readData()
  return data.camera_requests || []
}

export async function addCameraRequest(request: any) {
  const data = readData()
  const newRequest = {
    id: Date.now().toString(),
    ...request,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  data.camera_requests.push(newRequest)
  writeData(data)
  return newRequest
}

// Funções para feedback
export async function getFeedback() {
  const data = readData()
  return data.feedback || []
}

export async function addFeedback(feedback: any) {
  const data = readData()
  const newFeedback = {
    id: Date.now().toString(),
    ...feedback,
    status: 'pending',
    createdAt: new Date().toISOString()
  }
  data.feedback.push(newFeedback)
  writeData(data)
  return newFeedback
}

// Funções para configurações
export async function getSettings() {
  const data = readData()
  return data.settings || initialData.settings
}

export async function updateSettings(settings: any) {
  const data = readData()
  data.settings = { ...data.settings, ...settings }
  writeData(data)
  return data.settings
} 