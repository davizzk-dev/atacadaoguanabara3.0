# Teste completo de todas as APIs
Write-Host "=== TESTE COMPLETO DE TODAS AS APIS ===" -ForegroundColor Cyan

# Teste de registro
Write-Host "`nTestando registro..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Teste User"
        email = "testeuser@teste.com"
        password = "123456"
        phone = "11987654321"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/auth/register" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Register: SUCESSO - $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Register: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Teste de orders
Write-Host "`nTestando orders..." -ForegroundColor Yellow
try {
    $body = @{
        userId = "teste123"
        items = @(
            @{
                id = "prod1"
                name = "Produto Teste"
                price = 10.50
                quantity = 2
            }
        )
        total = 21.00
        shippingInfo = @{
            name = "Teste"
            address = "Rua Teste, 123"
            city = "São Paulo"
            state = "SP"
            zipCode = "01234-567"
        }
    } | ConvertTo-Json -Depth 3
    
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/orders" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Orders: SUCESSO - $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Orders: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Teste de promoções
Write-Host "`nTestando promocoes..." -ForegroundColor Yellow
try {
    $body = @{
        title = "Promoção Teste"
        description = "Descrição da promoção"
        discount = 20
        startDate = "2024-12-01"
        endDate = "2024-12-31"
        products = @("prod1", "prod2")
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/promotions" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Promotions: SUCESSO - $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Promotions: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TODOS OS TESTES CONCLUIDOS ===" -ForegroundColor Cyan
