'use client'

import { useEffect, useRef, useState } from 'react'

interface LineChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  title: string
  height?: number
  showGrid?: boolean
  showPoints?: boolean
}

export default function LineChart({ 
  data, 
  title, 
  height = 200, 
  showGrid = true, 
  showPoints = true 
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)

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
    const padding = 40
    const chartWidth = canvas.offsetWidth - padding * 2
    const chartHeight = height - padding * 2

    // Encontrar valores mínimos e máximos
    const values = data.map(d => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const valueRange = maxValue - minValue || 1

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
      
      // Linhas verticais
      for (let i = 0; i <= data.length - 1; i++) {
        const x = padding + (chartWidth / (data.length - 1)) * i
        ctx.beginPath()
        ctx.moveTo(x, padding)
        ctx.lineTo(x, padding + chartHeight)
        ctx.stroke()
      }
    }

    // Desenhar linha do gráfico
    if (data.length > 1) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()
      data.forEach((point, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index
        const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // Desenhar pontos
      if (showPoints) {
        data.forEach((point, index) => {
          const x = padding + (chartWidth / (data.length - 1)) * index
          const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight
          
          ctx.fillStyle = '#3b82f6'
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, 2 * Math.PI)
          ctx.fill()
          
          // Sombra do ponto
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
          ctx.beginPath()
          ctx.arc(x, y, 8, 0, 2 * Math.PI)
          ctx.fill()
        })
      }
    }

    // Desenhar labels do eixo Y
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px Arial'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      const value = maxValue - (valueRange / 5) * i
      ctx.fillText(value.toFixed(0), padding - 10, y)
    }

    // Desenhar labels do eixo X
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index
      ctx.fillText(point.label, x, padding + chartHeight + 10)
    })

    // Desenhar título
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(title, canvas.offsetWidth / 2, 10)

    // Desenhar tooltip se houver hover
    if (hover && data[hover.index]) {
      const paddingBox = 8
      const label = data[hover.index].label
      const value = data[hover.index].value
      const text = `${label}: ${value}`

      ctx.font = '12px Arial'
      const textWidth = ctx.measureText(text).width
      const boxX = Math.min(Math.max(hover.x - textWidth / 2 - paddingBox, 10), canvas.offsetWidth - textWidth - 2 * paddingBox - 10)
      const boxY = Math.max(hover.y - 35, 10)

      // Caixa
      ctx.fillStyle = 'rgba(17, 24, 39, 0.9)'
      ctx.fillRect(boxX, boxY, textWidth + paddingBox * 2, 24)

      // Texto
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, boxX + paddingBox, boxY + 12)
    }

  }, [data, title, height, showGrid, showPoints, hover])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const padding = 40
      const chartWidth = canvas.offsetWidth - padding * 2
      const segment = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth
      const index = Math.round((x - padding) / segment)

      if (index >= 0 && index < data.length) {
        // Calcular y do ponto para posicionar tooltip de forma mais precisa
        const values = data.map(d => d.value)
        const minValue = Math.min(...values)
        const maxValue = Math.max(...values)
        const valueRange = maxValue - minValue || 1
        const chartHeight = height - padding * 2
        const pointX = padding + segment * index
        const pointY = padding + chartHeight - ((data[index].value - minValue) / valueRange) * chartHeight
        setHover({ index, x: pointX, y: pointY })
      } else {
        setHover(null)
      }
    }
    const handleLeave = () => setHover(null)
    canvas.addEventListener('mousemove', handleMove)
    canvas.addEventListener('mouseleave', handleLeave)
    return () => {
      canvas.removeEventListener('mousemove', handleMove)
      canvas.removeEventListener('mouseleave', handleLeave)
    }
  }, [data, height])

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

