# Teste completo do frontend após correções
Write-Host "=== TESTE COMPLETO FRONTEND CORRIGIDO ===" -ForegroundColor Cyan

# 1. Testar login
Write-Host "`n1. Testando login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin"
        password = "Arrozbasico123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3005/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "✅ Login: $($loginResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta: $($loginResponse.Content)"
} catch {
    Write-Host "❌ Login: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Testar GET de promoções
Write-Host "`n2. Testando GET promocoes..." -ForegroundColor Yellow
try {
    $promosResponse = Invoke-WebRequest -Uri "http://localhost:3005/api/promotions" -Method GET
    Write-Host "✅ GET Promoções: $($promosResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta: $($promosResponse.Content)"
} catch {
    Write-Host "❌ GET Promoções: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Testar GET de orders
Write-Host "`n3. Testando GET orders..." -ForegroundColor Yellow
try {
    $ordersResponse = Invoke-WebRequest -Uri "http://localhost:3005/api/orders" -Method GET
    Write-Host "✅ GET Orders: $($ordersResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta: $($ordersResponse.Content)"
} catch {
    Write-Host "❌ GET Orders: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Testar GET de feedback
Write-Host "`n4. Testando GET feedback..." -ForegroundColor Yellow
try {
    $feedbackResponse = Invoke-WebRequest -Uri "http://localhost:3005/api/feedback" -Method GET
    Write-Host "✅ GET Feedback: $($feedbackResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta (primeiros 200 chars): $($feedbackResponse.Content.Substring(0, [Math]::Min(200, $feedbackResponse.Content.Length)))"
} catch {
    Write-Host "❌ GET Feedback: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Testar GET de camera-requests
Write-Host "`n5. Testando GET camera-requests..." -ForegroundColor Yellow
try {
    $cameraResponse = Invoke-WebRequest -Uri "http://localhost:3005/api/camera-requests" -Method GET
    Write-Host "✅ GET Camera-requests: $($cameraResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta (primeiros 200 chars): $($cameraResponse.Content.Substring(0, [Math]::Min(200, $cameraResponse.Content.Length)))"
} catch {
    Write-Host "❌ GET Camera-requests: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Testar GET de return-requests
Write-Host "`n6. Testando GET return-requests..." -ForegroundColor Yellow
try {
    $returnResponse = Invoke-WebRequest -Uri "http://localhost:3005/api/return-requests" -Method GET
    Write-Host "✅ GET Return-requests: $($returnResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta (primeiros 200 chars): $($returnResponse.Content.Substring(0, [Math]::Min(200, $returnResponse.Content.Length)))"
} catch {
    Write-Host "❌ GET Return-requests: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTE CONCLUIDO ===" -ForegroundColor Cyan
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor White
Write-Host "1. Fazer login no site (admin / Arrozbasico123)" -ForegroundColor Yellow
Write-Host "2. Verificar se o botão 'Painel Administrativo' aparece no menu" -ForegroundColor Yellow
Write-Host "3. Acessar /admin e verificar se carrega os dados" -ForegroundColor Yellow
Write-Host "4. Criar uma promoção no admin e verificar se aparece no site" -ForegroundColor Yellow
