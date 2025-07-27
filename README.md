# 🏪 Atacadão Guanabara - Sistema Completo

Sistema completo de gerenciamento para o Atacadão Guanabara, com painel administrativo funcional, APIs conectadas e relatórios em PDF.

## 🚀 Funcionalidades Implementadas

### ✅ Painel Administrativo
- **Dashboard completo** com estatísticas em tempo real
- **Gerenciamento de usuários** (visualizar, editar, deletar)
- **Gerenciamento de produtos** (CRUD completo)
- **Solicitações de câmera** (aprovar, processar, finalizar)
- **Feedbacks dos clientes** (revisar, resolver)
- **Promoções de produtos** (criar, editar, ativar/desativar)
- **Relatórios em PDF** (vendas, produtos, pedidos, analytics)
- **Exportação CSV** de dados
- **Monitoramento do sistema** (status Java, memória, CPU)

### ✅ Backend Java (Spring Boot)
- **APIs RESTful** completas
- **Banco de dados H2** integrado
- **JPA/Hibernate** para persistência
- **Geração de PDFs** com iText
- **Sistema de logs** e monitoramento
- **CORS configurado** para frontend

### ✅ Frontend (Next.js)
- **Interface moderna** e responsiva
- **Gráficos interativos** (Chart.js)
- **Filtros e pesquisa** avançados
- **Notificações em tempo real**
- **Exportação de dados**
- **Conectividade com Java**

## 🛠️ Pré-requisitos

### Backend Java
- **Java 17** ou superior
- **Apache Maven** 3.6+
- **Git** (para clonar o projeto)

### Frontend
- **Node.js** 18+ 
- **pnpm** (será instalado automaticamente)

## 📦 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/davizzk-dev/Atacad-o-guanabara.git
cd Atacad-o-guanabara
```

### 2. Instalar dependências do frontend
```bash
pnpm install
```

### 3. Verificar Java e Maven
```bash
java -version
mvn -version
```

## 🚀 Como Iniciar o Sistema

### Opção 1: Script Automático (Recomendado)
Execute o arquivo `start-system.bat` que iniciará automaticamente:
- Backend Java na porta 8080
- Frontend Next.js na porta 3000

### Opção 2: Iniciar Separadamente

#### Backend Java
```bash
# Windows
start-java-backend.bat

# Linux/Mac
cd java-backend
mvn spring-boot:run
```

#### Frontend
```bash
# Windows
start-frontend.bat

# Linux/Mac
pnpm dev
```

## 🌐 URLs do Sistema

- **Frontend**: http://localhost:3000
- **Painel Admin**: http://localhost:3000/admin
- **Backend API**: http://localhost:8080
- **Banco H2 Console**: http://localhost:8080/h2-console

## 📊 Funcionalidades do Painel Admin

### Dashboard
- Estatísticas em tempo real
- Gráficos de vendas mensais
- Categorias de produtos
- Status dos pedidos
- Alertas do sistema

### Gerenciamento de Dados
- **Usuários**: Visualizar, editar, deletar clientes
- **Produtos**: CRUD completo com imagens
- **Pedidos**: Acompanhar status e detalhes
- **Solicitações de Câmera**: Aprovar, processar, finalizar
- **Feedbacks**: Revisar e resolver comentários
- **Promoções**: Criar e gerenciar ofertas

### Relatórios e Exportação
- **Relatórios PDF**: Mensais, completos, produtos, pedidos
- **Exportação CSV**: Todos os dados
- **Analytics**: Tendências de vendas, produtos mais vendidos
- **Performance**: Métricas do sistema

### Monitoramento
- **Status do Java**: Uptime, memória, CPU
- **Banco de dados**: Status e informações
- **Migrações**: Status das atualizações
- **Logs de atividade**: Histórico de ações

## 🔧 APIs Disponíveis

### Backend Java (Porta 8080)
```
GET  /api/admin/dashboard          # Dashboard principal
GET  /api/admin/stats              # Estatísticas
GET  /api/admin/users              # Listar usuários
GET  /api/admin/products           # Listar produtos
GET  /api/admin/camera-requests    # Solicitações de câmera
GET  /api/admin/feedback           # Feedbacks
GET  /api/admin/product-promotions # Promoções
GET  /api/admin/system-status      # Status do sistema
GET  /api/admin/health             # Health check
```

### Frontend (Porta 3000)
```
GET  /api/admin/stats              # Proxy para Java
GET  /api/admin/users              # Proxy para Java
GET  /api/admin/products           # Proxy para Java
GET  /api/admin/camera-requests    # Proxy para Java
GET  /api/admin/feedback           # Proxy para Java
GET  /api/admin/product-promotions # Proxy para Java
```

## 📁 Estrutura do Projeto

```
Atacad-o-guanabara/
├── app/                          # Frontend Next.js
│   ├── admin/                    # Painel administrativo
│   ├── api/                      # APIs do frontend
│   └── components/               # Componentes React
├── java-backend/                 # Backend Spring Boot
│   ├── src/main/java/
│   │   └── com/atacadao/guanabara/
│   │       ├── controller/       # Controladores REST
│   │       ├── model/           # Entidades JPA
│   │       ├── repository/      # Repositórios
│   │       ├── service/         # Lógica de negócio
│   │       └── config/          # Configurações
│   └── pom.xml                  # Dependências Maven
├── start-java-backend.bat       # Script Java
├── start-frontend.bat           # Script Frontend
└── start-system.bat             # Script Completo
```

## 🎯 Como Usar

### 1. Acessar o Painel Admin
1. Inicie o sistema com `start-system.bat`
2. Acesse http://localhost:3000/admin
3. Use as credenciais padrão (se configuradas)

### 2. Gerenciar Dados
- **Navegue pelas abas** no painel
- **Filtre e pesquise** dados
- **Edite registros** clicando nos ícones
- **Exporte relatórios** em PDF/CSV

### 3. Monitorar o Sistema
- **Verifique o status** do Java na aba Sistema
- **Monitore recursos** (memória, CPU)
- **Acompanhe logs** de atividade

## 🔍 Troubleshooting

### Backend Java não inicia
```bash
# Verificar Java
java -version

# Verificar Maven
mvn -version

# Limpar e recompilar
cd java-backend
mvn clean compile
```

### Frontend não conecta com Java
```bash
# Verificar se Java está rodando
curl http://localhost:8080/api/admin/health

# Verificar logs do Java
# Verificar console do navegador (F12)
```

### Erro de CORS
- O backend já está configurado com CORS
- Se persistir, verificar configurações no `AdminController.java`

## 📈 Próximos Passos

1. **Configurar autenticação** JWT
2. **Implementar upload** de imagens
3. **Adicionar notificações** push
4. **Criar testes** automatizados
5. **Deploy em produção**

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique os logs do sistema
- Consulte a documentação das APIs
- Abra uma issue no GitHub

---

**Desenvolvido com ❤️ para o Atacadão Guanabara** 