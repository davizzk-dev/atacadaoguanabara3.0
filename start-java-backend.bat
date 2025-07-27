@echo off
echo 🚀 Iniciando Backend Java - Atacadão Guanabara
echo.

cd java-backend

echo 📋 Verificando Java...
java -version >nul 2>&1
if errorlevel 1 (
    echo ❌ Java não encontrado! Instale o Java 17 primeiro.
    echo 💡 Execute: winget install Oracle.JDK.17
    pause
    exit /b 1
)

echo ✅ Java encontrado!
echo.

echo 📋 Verificando Maven...
mvn -version >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Maven não encontrado. Tentando instalar...
    winget install Apache.Maven
    if errorlevel 1 (
        echo ❌ Falha ao instalar Maven. Instale manualmente:
        echo 💡 Baixe de: https://maven.apache.org/download.cgi
        pause
        exit /b 1
    )
)

echo ✅ Maven encontrado!
echo.

echo 🔨 Compilando projeto...
mvn clean compile
if errorlevel 1 (
    echo ❌ Erro na compilação!
    pause
    exit /b 1
)

echo ✅ Compilação concluída!
echo.

echo 🚀 Iniciando aplicação...
echo 📊 API: http://localhost:8080
echo 🗄️  Banco H2: http://localhost:8080/h2-console
echo 📋 Painel Admin: http://localhost:3000/admin
echo.
echo ⚠️ Mantenha este terminal aberto!
echo.

mvn spring-boot:run

pause 