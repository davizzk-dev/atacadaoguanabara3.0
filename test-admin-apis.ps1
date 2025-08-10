# Teste completo do painel admin
Write-Host "=== TESTE PAINEL ADMIN CORRIGIDO ===" -ForegroundColor Cyan

# 1. Testar GET orders
Write-Host "`n1. Testando GET orders..." -ForegroundColor Yellow
try {
    $ordersResponse = Invoke-WebRequest -Uri "http://localhost:3005/api/orders" -Method GET
    Write-Host "✅ GET Orders: $($ordersResponse.StatusCode)" -ForegroundColor Green
    $ordersData = $ordersResponse.Content | ConvertFrom-Json
    if ($ordersData.success -and $ordersData.orders) {
        Write-Host "📦 Total de pedidos: $($ordersData.orders.Count)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ GET Orders: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Testar GET camera-requests
Write-Host "`n2. Testando GET camera-requests..." -ForegroundColor Yellow
try {
    $cameraResponse = Invoke-WebRequest -Uri "http://localhost:3005/api/camera-requests" -Method GET
    Write-Host "✅ GET Camera-requests: $($cameraResponse.StatusCode)" -ForegroundColor Green
    $cameraData = $cameraResponse.Content | ConvertFrom-Json
    if ($cameraData.success -and $cameraData.data) {
        Write-Host "📹 Total de solicitações de câmera: $($cameraData.data.Count)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ GET Camera-requests: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Testar GET return-requests
Write-Host "`n3. Testando GET return-requests..." -ForegroundColor Yellow
try {
    $returnResponse = Invoke-WebRequest -Uri "http://localhost:3005/api/return-requests" -Method GET
    Write-Host "✅ GET Return-requests: $($returnResponse.StatusCode)" -ForegroundColor Green
    $returnData = $returnResponse.Content | ConvertFrom-Json
    if ($returnData.success -and $returnData.data) {
        Write-Host "🔄 Total de solicitações de troca/devolução: $($returnData.data.Count)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ GET Return-requests: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Testar GET feedback
Write-Host "`n4. Testando GET feedback..." -ForegroundColor Yellow
try {
    $feedbackResponse = Invoke-WebRequest -Uri "http://localhost:3005/api/feedback" -Method GET
    Write-Host "✅ GET Feedback: $($feedbackResponse.StatusCode)" -ForegroundColor Green
    $feedbackData = $feedbackResponse.Content | ConvertFrom-Json
    if ($feedbackData.success -and $feedbackData.data) {
        Write-Host "💬 Total de feedbacks: $($feedbackData.data.Count)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ GET Feedback: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTE CONCLUIDO ===" -ForegroundColor Cyan
Write-Host "`n📋 INSTRUÇÕES:" -ForegroundColor White
Write-Host "1. Acesse o painel admin em /admin" -ForegroundColor Yellow
Write-Host "2. Verifique se os pedidos aparecem na aba 'Pedidos'" -ForegroundColor Yellow
Write-Host "3. Clique nas abas 'Câmeras' e 'Trocas/Devoluções'" -ForegroundColor Yellow
Write-Host "4. Verifique se os dados carregam corretamente" -ForegroundColor Yellow
