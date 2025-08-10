# 🏪 Atacadão Guanabara - Backend Java

Backend robusto em Java Spring Boot para o sistema do Atacadão Guanabara.

## 🚀 Tecnologias

- **Java 17** - Linguagem principal
- **Spring Boot 3.2.0** - Framework web
- **Spring Data JPA** - Persistência de dados
- **Spring Security** - Segurança e autenticação
- **H2 Database** - Banco de dados em memória
- **Maven** - Gerenciamento de dependências
- **Lombok** - Redução de boilerplate

## 📋 Pré-requisitos

- Java 17 ou superior
- Maven 3.6 ou superior

## 🛠️ Instalação

### 1. Verificar Java
```bash
java -version
```

### 2. Verificar Maven
```bash
mvn -version
```

### 3. Executar o Projeto

#### Opção A: Script Automático (Windows)
```bash
run.bat
```

#### Opção B: Comandos Manuais
```bash
# Compilar
mvn clean compile

# Executar
mvn spring-boot:run
```

## 🌐 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/forgot-password` - Recuperação de senha
- `POST /api/auth/verify-code` - Verificação de código
- `POST /api/auth/reset-password` - Reset de senha

### Usuários
- `GET /api/users` - Listar usuários
- `GET /api/users/{id}` - Buscar usuário por ID
- `POST /api/users` - Criar usuário
- `PUT /api/users/{id}` - Atualizar usuário
- `DELETE /api/users/{id}` - Deletar usuário

### Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/{id}` - Buscar produto por ID
- `POST /api/products` - Criar produto
- `PUT /api/products/{id}` - Atualizar produto
- `DELETE /api/products/{id}` - Deletar produto

### Pedidos
- `GET /api/orders` - Listar pedidos
- `GET /api/orders/{id}` - Buscar pedido por ID
- `POST /api/orders` - Criar pedido
- `PUT /api/orders/{id}` - Atualizar pedido

## 🗄️ Banco de Dados

### Console H2
- **URL**: http://localhost:8080/h2-console
- **JDBC URL**: `jdbc:h2:file:./data/guanabara_db`
- **Username**: `sa`
- **Password**: `password`

### Dados Iniciais
O sistema cria automaticamente:
- **Admin**: `admin` / `atacadaoguanabaraadmin123secreto`
- **Usuário Teste**: `teste@atacadao.com` / `123456`
- **8 produtos** de exemplo

## 🔧 Configurações

### application.properties
```properties
# Banco de dados
spring.datasource.url=jdbc:h2:file:./data/guanabara_db
spring.datasource.username=sa
spring.datasource.password=password

# Porta da aplicação
server.port=8080

# CORS habilitado
spring.web.cors.allowed-origins=*
```

## 📊 Funcionalidades

### ✅ Implementadas
- [x] Autenticação de usuários
- [x] Registro de usuários
- [x] Recuperação de senha
- [x] CRUD de produtos
- [x] CRUD de pedidos
- [x] Banco de dados H2
- [x] API REST completa
- [x] CORS configurado
- [x] Validações de dados
- [x] Hash de senhas (SHA-256)

### 🚧 Em Desenvolvimento
- [ ] JWT Authentication
- [ ] Upload de imagens
- [ ] Relatórios avançados
- [ ] Notificações por email
- [ ] Cache Redis
- [ ] Logs estruturados

## 🔗 Integração com Frontend

O backend está configurado para trabalhar com o frontend Next.js:

```javascript
// Exemplo de chamada da API
const response = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

## 🐛 Troubleshooting

### Erro: "Java não encontrado"
```bash
# Instalar Java 17
winget install Oracle.JDK.17
```

### Erro: "Maven não encontrado"
```bash
# Instalar Maven
winget install Apache.Maven
```

### Erro: "Porta 8080 em uso"
```bash
# Alterar porta no application.properties
server.port=8081
```

## 📝 Logs

Os logs são exibidos no console com informações detalhadas:
- Requisições HTTP
- Operações de banco
- Erros e exceções
- Dados de inicialização

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto é parte do sistema Atacadão Guanabara. 