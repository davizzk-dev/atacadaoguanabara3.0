Write-Host "Testando POST promoções (nova rota)..." -ForegroundColor Green

$body = '{"productId":"123","productName":"Produto Teste","originalPrice":100,"newPrice":80,"isActive":true}'

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3005/api/promotions" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10
    Write-Host "SUCESSO: $($response | ConvertTo-Json)" -ForegroundColor Green
}
catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
