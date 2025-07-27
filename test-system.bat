@echo off
echo ========================================
echo    Testando Sistema - Atacadao Guanabara
echo ========================================
echo.

echo [1/3] Testando Backend Java...
echo.

REM Testar se o Java está rodando
curl -s http://localhost:8080/api/admin/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend Java está funcionando!
) else (
    echo ❌ Backend Java não está respondendo
    echo Inicie o backend com: start-java-backend.bat
    pause
    exit /b 1
)

echo.
echo [2/3] Testando Frontend...
echo.

REM Testar se o frontend está rodando
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend está funcionando!
) else (
    echo ❌ Frontend não está respondendo
    echo Inicie o frontend com: start-frontend.bat
    pause
    exit /b 1
)

echo.
echo [3/3] Testando APIs...
echo.

REM Testar APIs principais
echo Testando API de estatísticas...
curl -s http://localhost:8080/api/admin/stats >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API de estatísticas OK
) else (
    echo ❌ API de estatísticas falhou
)

echo Testando API de usuários...
curl -s http://localhost:8080/api/admin/users >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API de usuários OK
) else (
    echo ❌ API de usuários falhou
)

echo Testando API de produtos...
curl -s http://localhost:8080/api/admin/products >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API de produtos OK
) else (
    echo ❌ API de produtos falhou
)

echo.
echo ========================================
echo    Sistema Testado com Sucesso!
echo ========================================
echo.
echo URLs disponiveis:
echo - Frontend: http://localhost:3000
echo - Painel Admin: http://localhost:3000/admin
echo - Backend API: http://localhost:8080
echo - Banco H2: http://localhost:8080/h2-console
echo.
echo Pressione qualquer tecla para sair...
pause >nul 