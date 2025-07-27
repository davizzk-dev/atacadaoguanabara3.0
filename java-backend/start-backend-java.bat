@echo off
REM === Atacadão Guanabara - Start Backend Java ===

REM Caminho do Java (ajuste se necessário)
set "JAVA_HOME=C:\Program Files\Java\jdk-17"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Caminho do Maven (ajuste se necessário)
set "MAVEN_BIN=C:\Users\escritorio atacadao\Downloads\apache-maven-3.9.11-bin\apache-maven-3.9.11\bin"

cd /d "C:\Users\escritorio atacadao\Downloads\atacadão guanabara\atacadão guanabara\atacadao-guanabara teste\java-backend"

"%MAVEN_BIN%\mvn.cmd" spring-boot:run

pause 