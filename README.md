# 💼 MyFinance — Gestão de Patrimônio e Controle de Investimentos

**MyFinance** é uma aplicação web moderna e intuitiva desenvolvida para o acompanhamento e gestão consolidada de carteiras de investimentos multi-segmento (**Brasil**, **Internacional** e **Criptomoedas**).

A plataforma conta com arquitetura **Multi-Tenant** segura, cálculo automático de cotações em **BRL** e **USD**, gráficos interativos de alocação de ativos e integração nativa com banco de dados **PostgreSQL em Nuvem (Neon DB)** com suporte a fallback local.

---

## ✨ Funcionalidades Principais

- 🔐 **Autenticação Multi-Tenant Segura**: Sistema próprio de registro, login e gerenciamento de sessões protegidas por HTTP-Only Cookies e hash HMAC-SHA256.
- 📊 **Dashboard Consolidado**: Visão geral do patrimônio total com alternância instantânea entre **BRL** (Reais) e **USD** (Dólares).
- 🇧🇷 **Carteira Brasil**: Controle detalhado de Ações, FIIs e Renda Fixa com cálculo de Preço Médio e Valor Total.
- 🇺🇸 **Carteira Internacional**: Acompanhamento de Stocks, REITs e ETFs americanos.
- 🪙 **Carteira Cripto**: Monitoramento de Bitcoin, Ethereum e altcoins.
- 📄 **Importação Automática de Relatórios B3 / Corretoras**: Parser integrado para leitura de relatórios em Excel (`.xlsx`), facilitando a carga inicial de dados.
- 📈 **Gráficos Dinâmicos**: Visualização de alocação percentual por segmento e evolução patrimonial desenvolvidos em Recharts.
- 🗄️ **Persistência Dupla Híbrida**: Conexão nativa com banco serverless **Neon PostgreSQL** via Drizzle ORM, mantendo fallback automático para arquivos JSON locais em modo de desenvolvimento offline.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Biblioteca de UI**: [React 19](https://react.dev/)
- **Estilização**: Tailwind CSS (Glassmorphism & Sleek Dark Mode)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Banco de Dados**: [Neon PostgreSQL](https://neon.tech/) & [Drizzle ORM](https://orm.drizzle.team/)
- **Parser de Planilhas**: [SheetJS (XLSX)](https://sheetjs.com/)

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- **Node.js** v18.0.0 ou superior
- **npm** ou **yarn**

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/DuardoHenrique/my-finance.git
   cd my-finance
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Configurar as Variáveis de Ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto (utilizando `.env.example` como referência):
   ```bash
   cp .env.example .env.local
   ```
   *Caso queira conectar ao banco em nuvem Neon PostgreSQL, adicione a sua string de conexão:*
   ```env
   DATABASE_URL="postgresql://usuario:senha@seu-host.neon.tech/neondb?sslmode=require"
   JWT_SECRET="sua-chave-secreta-jwt"
   ```
   *(Nota: Se a variável `DATABASE_URL` não for informada, o projeto rodará automaticamente em modo local utilizando banco de dados em arquivo JSON).*

4. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **Acessar a aplicação:**
   Abra o seu navegador em [http://localhost:3000](http://localhost:3000)

---

## 🛡️ Segurança e Boas Práticas

- **Proteção contra IDOR**: Todos os ativos e operações de leitura, edição e exclusão são estritamente filtrados pelo `userId` da sessão autenticada.
- **Parametrização de Consultas**: Consultas SQL parametrizadas para proteção total contra SQL Injection.
- **Cookies Seguros**: Cookies com flags `HttpOnly`, `SameSite=Lax` e `Secure` em ambiente de produção.
- **Proteção de Dados Sensíveis**: As chaves e URLs de banco de dados estão isoladas e protegidas via `.gitignore`.

---

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se à vontade para utilizar e contribuir!
