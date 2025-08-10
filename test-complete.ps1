# Teste de login e verificação de estado
Write-Host "=== TESTE DE LOGIN E ESTADO ===" -ForegroundColor Cyan

# Testar login
Write-Host "`nTestando login..." -ForegroundColor Yellow
try {
    $body = @{
        email = "admin"
        password = "Arrozbasico123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/auth/login" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Login: SUCESSO - $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta:" 
    Write-Host $response.Content
    
    # Extrair dados do usuário da resposta
    $loginData = $response.Content | ConvertFrom-Json
    if ($loginData.success -and $loginData.data.role -eq "admin") {
        Write-Host "`nUsuário admin logado com sucesso!" -ForegroundColor Green
        Write-Host "Role: $($loginData.data.role)" -ForegroundColor Yellow
        Write-Host "Nome: $($loginData.data.name)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Login: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

# Testar se orders está salvando
Write-Host "`n`nTestando orders..." -ForegroundColor Yellow
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
        customerInfo = @{
            name = "Teste Cliente"
            phone = "11987654321"
            email = "teste@teste.com"
        }
        shippingInfo = @{
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

# Testar se promoções está salvando
Write-Host "`n`nTestando promocoes..." -ForegroundColor Yellow
try {
    $body = @{
        productId = "prod1"
        productName = "Produto Teste"
        originalPrice = 20.00
        newPrice = 15.00
        discount = 25
        startDate = "2024-12-01"
        endDate = "2024-12-31"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3005/api/promotions" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Promotions: SUCESSO - $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Promotions: ERRO - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTE CONCLUIDO ===" -ForegroundColor Cyan
