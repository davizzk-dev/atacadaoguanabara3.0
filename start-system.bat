@echo off
echo ========================================
echo    Atacadao Guanabara - Sistema Completo
echo ========================================
echo.

echo Iniciando o sistema completo...
echo.

REM Iniciar o backend Java em background
echo [1/2] Iniciando Backend Java...
start "Backend Java" cmd /k "cd java-backend && mvn spring-boot:run"

REM Aguardar um pouco para o backend inicializar
echo Aguardando o backend inicializar...
timeout /t 10 /nobreak >nul

REM Iniciar o frontend
echo [2/2] Iniciando Frontend...
start "Frontend" cmd /k "pnpm dev"

echo.
echo ========================================
echo    Sistema iniciado com sucesso!
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