# Teste de APIs
Write-Host "Testando APIs..." -ForegroundColor Green

# Teste de feedback
Write-Host "`nTestando feedback..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Teste"
        email = "teste@teste.com"
        type = "sugestao"
        rating = 5
        message = "Mensagem de teste"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/feedback" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Feedback: SUCESSO - $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Feedback: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Teste de câmeras
Write-Host "`nTestando câmeras..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Teste Camera"
        phone = "11987654321"
        rg = "123456789"
        cause = "Teste de funcionamento"
        moment = "manhã"
        period = "2024-12-01"
        additionalInfo = "Teste"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/camera-requests" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Camera: SUCESSO - $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Camera: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Teste de retornos
Write-Host "`nTestando retornos..." -ForegroundColor Yellow
try {
    $body = @{
        customerName = "Teste Return"
        email = "teste@teste.com"
        phone = "123456789"
        orderNumber = "ORD-123"
        reason = "defeito"
        description = "Produto com defeito"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/return-requests" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Return: SUCESSO - $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Return: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTeste concluído!" -ForegroundColor Green
