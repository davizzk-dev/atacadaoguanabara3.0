@echo off
echo 🚀 Iniciando Atacadão Guanabara Backend...
echo.

REM Verificar se o Java está instalado
java -version >nul 2>&1
if errorlevel 1 (
    echo ❌ Java não encontrado! Instale o Java 17 primeiro.
    pause
    exit /b 1
)

echo ✅ Java encontrado!
echo.

REM Verificar se o Maven está instalado
mvn -version >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Maven não encontrado. Tentando instalar...
    echo.
    REM Tentar instalar Maven via winget
    winget install Apache.Maven
    if errorlevel 1 (
        echo ❌ Falha ao instalar Maven. Instale manualmente.
        pause
        exit /b 1
    )
)

echo ✅ Maven encontrado!
echo.

REM Limpar e compilar
echo 🔨 Compilando projeto...
mvn clean compile
if errorlevel 1 (
    echo ❌ Erro na compilação!
    pause
    exit /b 1
)

echo ✅ Compilação concluída!
echo.

REM Executar aplicação
echo 🚀 Iniciando aplicação...
echo 📊 API: http://localhost:8080
echo 🗄️  Banco H2: http://localhost:8080/h2-console
echo.
mvn spring-boot:run

pause 