'use client'

import { useEffect, useRef } from 'react'

interface BarChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  title: string
  height?: number
  showGrid?: boolean
  showValues?: boolean
}

export default function BarChart({ 
  data, 
  title, 
  height = 200, 
  showGrid = true, 
  showValues = true 
}: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Configurar canvas
    canvas.width = canvas.offsetWidth * 2
    canvas.height = height * 2
    ctx.scale(2, 2)

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Configurações
    const padding = 60
    const chartWidth = canvas.offsetWidth - padding * 2
    const chartHeight = height - padding * 2
    const barWidth = chartWidth / data.length * 0.8
    const barSpacing = chartWidth / data.length * 0.2

    // Encontrar valor máximo
    const maxValue = Math.max(...data.map(d => d.value)) || 1

    // Desenhar grade
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      
      // Linhas horizontais
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(padding + chartWidth, y)
        ctx.stroke()
      }
    }

    // Desenhar barras
    data.forEach((item, index) => {
      const x = padding + (chartWidth / data.length) * index + barSpacing / 2
      const barHeight = (item.value / maxValue) * chartHeight
      const y = padding + chartHeight - barHeight

      // Cor da barra
      const color = item.color || '#3b82f6'
      
      // Desenhar barra
      ctx.fillStyle = color
      ctx.fillRect(x, y, barWidth, barHeight)

      // Sombra da barra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(x + 2, y + 2, barWidth, barHeight)

      // Mostrar valor na barra
      if (showValues) {
        ctx.fillStyle = '#111827'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        
        const textY = y - 5
        if (textY > padding + 20) {
          ctx.fillText(item.value.toString(), x + barWidth / 2, textY)
        } else {
          // Se não couber acima, mostrar dentro da barra
          ctx.fillStyle = '#ffffff'
          ctx.fillText(item.value.toString(), x + barWidth / 2, y + barHeight / 2 + 4)
        }
      }
    })

    // Desenhar labels do eixo Y
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px Arial'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      const value = maxValue - (maxValue / 5) * i
      ctx.fillText(value.toFixed(0), padding - 10, y)
    }

    // Desenhar labels do eixo X
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    
    data.forEach((item, index) => {
      const x = padding + (chartWidth / data.length) * index + (chartWidth / data.length) / 2
      ctx.fillText(item.label, x, padding + chartHeight + 10)
    })

    // Desenhar título
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(title, canvas.offsetWidth / 2, 10)

  }, [data, title, height, showGrid, showValues])

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}

