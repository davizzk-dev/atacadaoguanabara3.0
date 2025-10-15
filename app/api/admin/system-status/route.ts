import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const productsFilePath = path.join(process.cwd(), 'data', 'products.json')
const products2FilePath = path.join(process.cwd(), 'data', 'products2.json')

export async function GET() {
  try {
    const alerts: any[] = []
    const status = {
      primaryFile: { exists: false, valid: false, count: 0 },
      backupFile: { exists: false, valid: false, count: 0 },
      usingBackup: false,
      alerts: [] as any[]
    }

    // Verificar products.json
    try {
      await fs.access(productsFilePath)
      status.primaryFile.exists = true
      
      const primaryData = await fs.readFile(productsFilePath, 'utf-8')
      if (primaryData.trim() !== '') {
        const primaryProducts = JSON.parse(primaryData)
        if (Array.isArray(primaryProducts) && primaryProducts.length > 0) {
          status.primaryFile.valid = true
          status.primaryFile.count = primaryProducts.length
        } else {
          alerts.push({
            type: 'error',
            title: 'Arquivo Principal Vazio',
            message: 'O arquivo products.json está vazio ou não contém produtos válidos',
            severity: 'high'
          })
        }
      } else {
        alerts.push({
          type: 'error',
          title: 'Arquivo Principal Vazio',
          message: 'O arquivo products.json está completamente vazio',
          severity: 'high'
        })
      }
    } catch (error) {
      alerts.push({
        type: 'error',
        title: 'Arquivo Principal Não Encontrado',
        message: 'O arquivo products.json não foi encontrado no sistema',
        severity: 'high'
      })
    }

    // Verificar products2.json (backup)
    try {
      await fs.access(products2FilePath)
      status.backupFile.exists = true
      
      const backupData = await fs.readFile(products2FilePath, 'utf-8')
      if (backupData.trim() !== '') {
        const backupProducts = JSON.parse(backupData)
        if (Array.isArray(backupProducts) && backupProducts.length > 0) {
          status.backupFile.valid = true
          status.backupFile.count = backupProducts.length
        }
      }
    } catch (error) {
      alerts.push({
        type: 'warning',
        title: 'Arquivo de Backup Não Encontrado',
        message: 'O arquivo products2.json (backup) não existe',
        severity: 'medium'
      })
    }

    // Determinar se está usando backup
    if (!status.primaryFile.valid && status.backupFile.valid) {
      status.usingBackup = true
      alerts.push({
        type: 'warning',
        title: '⚠️ SISTEMA USANDO BACKUP',
        message: `O catálogo está usando o arquivo de backup (products2.json) com ${status.backupFile.count} produtos. O arquivo principal está com problemas.`,
        severity: 'high',
        action: 'Verifique o arquivo products.json e execute uma nova sincronização'
      })
    }

    // Verificar diferenças entre arquivos
    if (status.primaryFile.valid && status.backupFile.valid) {
      const diff = Math.abs(status.primaryFile.count - status.backupFile.count)
      if (diff > 10) {
        alerts.push({
          type: 'info',
          title: 'Diferença Entre Arquivos',
          message: `Há diferença de ${diff} produtos entre o arquivo principal (${status.primaryFile.count}) e backup (${status.backupFile.count})`,
          severity: 'medium'
        })
      }
    }

    // Verificar se não há produtos em nenhum arquivo
    if (!status.primaryFile.valid && !status.backupFile.valid) {
      alerts.push({
        type: 'error',
        title: 'SISTEMA SEM PRODUTOS',
        message: 'Nenhum arquivo de produtos válido encontrado. O catálogo não funcionará corretamente.',
        severity: 'critical',
        action: 'Execute uma sincronização imediatamente'
      })
    }

    status.alerts = alerts

    return NextResponse.json({
      success: true,
      data: status
    })

  } catch (error) {
    console.error('Erro ao verificar status do sistema:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}