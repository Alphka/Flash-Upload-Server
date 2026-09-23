# Flash Upload Server

> **Language / Idioma:** [English](README.md) | **Português (Brasil)**
>
> *Caso você prefira ler esta documentação em inglês, por favor [clique aqui](README.md).*

<div align="center">
	<a href="https://github.com/Alphka/Flash-Upload-Server">
		<img src="https://raw.githubusercontent.com/Alphka/Flash-Upload-Server/b3a18f32454d73f86324ee7e316c7b7e1b07b8f9/public/icons/favicon.svg" alt="Logotipo da plataforma Flash" height="150">
	</a>
	<h3>Sistema de Gestão Eletrônica de Documentos (GED) para Controle da Qualidade Industrial</h3>
	<p>
		Plataforma web responsiva projetada para eliminar o fluxo em papel na fábrica, evitar redundância de versões e centralizar o ciclo de vida dos documentos da Gestão da Qualidade.
	</p>
</div>

<br>

<p align="center">
	<a href="https://github.com/Alphka/Flash-Upload-Server/releases"><img alt="GitHub release" src="https://img.shields.io/github/v/release/Alphka/Flash-Upload-Server?color=%235271FF&label=%C3%9Altima%20Vers%C3%A3o&style=for-the-badge&sort=semver"></a>
	<a href="LICENSE.md"><img alt="Licença" src="https://img.shields.io/github/license/Alphka/Flash-Upload-Server?color=%235271FF&style=for-the-badge&label=Licen%C3%A7a"></a>
	<img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white">
	<img alt="React" src="https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
	<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
	<img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white">
	<img alt="Sass" src="https://img.shields.io/badge/Sass-SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white">
</p>

## Sumário
- [Flash Upload Server](#flash-upload-server)
  - [Sumário](#sumário)
  - [Sobre o Projeto](#sobre-o-projeto)
    - [Contexto Industrial \& O Problema](#contexto-industrial--o-problema)
    - [A Solução (Flash GED)](#a-solução-flash-ged)
    - [Objetivos \& Alinhamento com a ISO 9001](#objetivos--alinhamento-com-a-iso-9001)
  - [Arquitetura do Sistema \& Fluxo de Dados](#arquitetura-do-sistema--fluxo-de-dados)
    - [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
    - [Deduplicação Criptográfica (SHA-256)](#deduplicação-criptográfica-sha-256)
    - [Motor Pró-ativo de Expiração de Documentos](#motor-pró-ativo-de-expiração-de-documentos)
    - [Controle de Acesso Baseado em Papéis (RBAC)](#controle-de-acesso-baseado-em-papéis-rbac)
    - [Classificação Normatizada dos Documentos](#classificação-normatizada-dos-documentos)
  - [Viabilidade Econômica \& Modelagem de Custos](#viabilidade-econômica--modelagem-de-custos)
    - [Levantamento de Custos e Despesas](#levantamento-de-custos-e-despesas)
    - [Equacionamento da Margem de Lucro e Precificação](#equacionamento-da-margem-de-lucro-e-precificação)
  - [Stack Tecnológica](#stack-tecnológica)
    - [Frontend](#frontend)
    - [Backend \& Armazenamento](#backend--armazenamento)
  - [Capturas de Tela \& Demonstração](#capturas-de-tela--demonstração)
    - [1. Tela de Autenticação](#1-tela-de-autenticação)
    - [2. Página Inicial \& Notificações de Vencimento](#2-página-inicial--notificações-de-vencimento)
    - [3. Diretório de Documentos por Categoria](#3-diretório-de-documentos-por-categoria)
    - [4. Formulário de Envio com Metadados](#4-formulário-de-envio-com-metadados)
    - [5. Gerenciamento de Usuários e Permissões](#5-gerenciamento-de-usuários-e-permissões)
  - [Como Rodar o Projeto](#como-rodar-o-projeto)
    - [Pré-requisitos](#pré-requisitos)
    - [Instalação e Configuração](#instalação-e-configuração)
    - [Variáveis de Ambiente](#variáveis-de-ambiente)
    - [Executando a Aplicação](#executando-a-aplicação)
  - [Contexto Acadêmico \& Créditos](#contexto-acadêmico--créditos)
  - [Licença](#licença)

## Sobre o Projeto

### Contexto Industrial & O Problema
O projeto foi desenvolvido para atender a uma demanda real submetida na plataforma **SAGA SENAI de Inovação**, voltada para empresas do **ramo de Produtos em Aço**.

No ambiente fabril diagnosticado, os operadores na linha de produção não dispunham de dispositivos digitais para consultar instruções de trabalho nem para preencher registros da produção. Isso acarretava sérios gargalos operacionais:
1. **Retrabalho e Desperdício de Movimentação**: Os colaboradores preenchiam relatórios e medições à mão em fichas de papel e, periodicamente, precisavam se deslocar do setor operacional até o setor administrativo apenas para digitalizar as folhas.
2. **Duplicidade e Divergência de Versões**: O arquivamento simultâneo (físico e em pastas locais desestruturadas) gerava duplicidade documental e o risco iminente de operadores consultarem padrões obsoletos.
3. **Desperdícios Lean (Qualidade)**: Consumo desnecessário de papel, tinta de impressão, perda de tempo produtivo com trânsito interno e ocupação de espaço físico com arquivos mortos.

### A Solução (Flash GED)
O **Flash** é um sistema leve e ágil de **Gestão Eletrônica de Documentos (GED)** projetado para unificar a fábrica e a administração. 

Com a adoção de tablets no chão de fábrica e computadores na área de qualidade/administrativa, a solução permite:
- Digitalizar fichas físicas na própria bancada de trabalho através da câmera do tablet/scanner móvel.
- Consultar procedimentos operacionais padrão (POPs), ordens de serviço e normas de forma instantânea.
- Evitar duplicatas de arquivos na nuvem e acompanhar a vigência dos documentos com alertas preventivos de vencimento.

### Objetivos & Alinhamento com a ISO 9001
* **Fonte Única da Verdade**: Eliminar o arquivamento duplo e centralizar todos os registros de qualidade em um único ambiente digital seguro.
* **Conformidade com a ISO 9001**: Atender aos requisitos da cláusula 7.5 (*Informação Documentada*), assegurando rastreabilidade, controle de distribuição, integridade e datas de revisão.
* **Eliminação de Desperdícios**: Cortar custos de impressão, reduzir o tempo de trânsito dos operadores e agilizar o processo de auditoria.

## Arquitetura do Sistema & Fluxo de Dados

### Visão Geral da Arquitetura
O Flash adota uma arquitetura full-stack moderna construída em **Next.js** (Pages Router com Server-Side Rendering e rotas de API integradas) e banco de dados NoSQL **MongoDB Atlas**.

```mermaid
flowchart TD
    subgraph Clientes["Dispositivos e Canais de Acesso"]
        Op["📱 Operador de Fábrica<br/>(Tablet no Chão de Fábrica)"]
        Adm["🖥️ Gestor da Qualidade / Admin<br/>(Estação Desktop Administrativa)"]
    end

    subgraph Plataforma["Plataforma Flash GED (Next.js 14)"]
        Auth["🔒 Autenticação & Sessão<br/>(Cookies HTTP-Only & Tokens de Acesso)"]
        UI["🎨 Interface Frontend<br/>(React 18 + Módulos SCSS + SWR)"]
        API["⚙️ Rotas de API Next.js<br/>(/api/files, /api/login, /api/notifications, /api/search)"]
        Crypto["🛡️ Motor de Integridade<br/>(Hash SHA-256 de Carga & Validação de Mime)"]
    end

    subgraph Banco["Camada de Dados (MongoDB Atlas)"]
        ColFiles[("📁 Coleção de Arquivos (Files)<br/>Buffer do Conteúdo, SHA-256, Expiração, Acesso")]
        ColUsers[("👤 Coleção de Usuários (Users)<br/>Credenciais & Perfis de Permissão")]
        ColTokens[("🔑 Coleção de Sessões (UserTokens)<br/>Tokens Ativos & Expiração de Sessão")]
    end

    Op -->|Login Público de Fábrica| Auth
    Adm -->|Login Administrativo| Auth
    Auth --> UI
    UI --> API
    API --> Crypto
    Crypto --> ColFiles
    API --> ColUsers
    API --> ColTokens
```

### Deduplicação Criptográfica (SHA-256)
Para evitar que múltiplos turnos ou operadores enviem o mesmo documento em duplicidade para o servidor, o Flash processa o buffer do arquivo e calcula seu hash criptográfico **SHA-256** antes de registrá-lo no banco:

```typescript
const hash = Crypto.createHash("sha256").update(fileBuffer).digest("hex")
const fileDocument = await File.findOne({ hash })

if(fileDocument){
    throw "Este arquivo já foi enviado para o servidor" // Duplicata detectada
}
```

Isso garante integridade referencial, preservação de espaço em nuvem e auditabilidade.

### Motor Pró-ativo de Expiração de Documentos
Procedimentos operacionais, calibrações de instrumentos e laudos técnicos possuem prazo de validade estrito. O sistema calcula a janela restante até o vencimento ($T_{\text{restante}} = \text{expiresAt} - \text{hoje}$):

$$\Delta t \le 3 \text{ dias} \implies \text{Disparar Notificação}$$

Quando um documento está a 3 dias ou menos do vencimento (ou já vencido), o endpoint `/api/notifications` dispara alertas destacados no sino de notificações da barra de navegação, impedindo que procedimentos obsoletos sejam executados na linha de montagem.

### Controle de Acesso Baseado em Papéis (RBAC)
O Flash possui duas categorias de credenciais:
* **Acesso Público (`public`)**: Voltado para os tablets da linha de produção. Permite que todos os operadores consultem padrões e enviem fichas com agilidade, sem burocracia de logins individuais na esteira fabril.
* **Acesso Administrativo (`all`)**: Concedido à equipe da Qualidade e Administradores. Permite visualizar arquivos restritos/confidenciais, editar metadados e prazos de validade, além de gerenciar contas de usuários.

### Classificação Normatizada dos Documentos
Os documentos são categorizados conforme a rotina do setor de Qualidade:
| ID | Tipo de Documento | Sigla | Descrição no Contexto Fabril |
| :---: | :--- | :---: | :--- |
| `1` | **Ata** | `Ata` | Atas de reuniões de comitês de qualidade, auditorias internas e DDS. |
| `2` | **Procedimento Operacional Padrão** | `POP` | Instruções de trabalho padronizadas para operação de máquinas e montagem. |
| `3` | **Inventário** | `Inventário` | Relatórios de controle de estoque de bobinas, chapas e perfis de aço. |
| `4` | **Ordem de Serviço** | `OS` | Registros de manutenção preventiva/corretiva e solicitações de serviço. |
| `5` | **Nota Fiscal** | `NF` | Notas fiscais de entrada e saída e certificados de composição do aço. |

## Viabilidade Econômica & Modelagem de Custos

Sistemas GED corporativos proprietários disponíveis no mercado costumam exigir planos mensais onerosos, inviáveis para muitas plantas industriais. Como parte do estudo de viabilidade técnica e econômica apresentado no **SENAI**, a solução Flash foi planejada com baixo investimento inicial (CapEx) e despesas enxutas (OpEx).

### Levantamento de Custos e Despesas
O estudo orçamentário foi estruturado da seguinte forma:

| Categoria | Item | Valor (R$) | Justificativa Técnica |
| :--- | :--- | :---: | :--- |
| **Custos (CapEx)** | Mão de obra de desenvolvimento | R$ 300,00 | Criação, configuração e implantação da plataforma. |
| **Custos (CapEx)** | Tablet industrial (Multilaser M7) | R$ 349,00 | Dispositivo móvel para o posto de trabalho dos operadores. |
| **Subtotal Custos**| | **R$ 649,00** | Investimento inicial em infraestrutura física/código. |
| **Despesas (OpEx)**| Link de Internet fabril | R$ 99,90 | Conectividade de rede da planta fabril. |
| **Despesas (OpEx)**| Serviço de Hospedagem (Host/Nuvem) | R$ 13,99 | Hospedagem web e banco de dados na nuvem. |
| **Subtotal Despesas** | | **R$ 113,89** | Custo operacional mensal recorrente. |
| **Custo Total ($C_{\text{total}}$)** | | **R$ 762,89** | Base total de custos para a comercialização. |

### Equacionamento da Margem de Lucro e Precificação
Adotando as diretrizes de mercado para soluções fornecidas à indústria (faixa recomendada de $7\%$ a $12\%$ de margem líquida), utilizou-se o teto de $M = 12\%$:

1. **Custo Total da Solução**:
   $$C_{\text{total}} = \text{Subtotal Custos} + \text{Subtotal Despesas} = 649{,}00 + 113{,}89 = \text{R\$ } 762{,}89$$

2. **Margem de Lucro da Indústria ($12\%$ sobre os custos)**:
   $$\text{Lucro} = C_{\text{total}} \times M = 762{,}89 \times 0{,}12 = \text{R\$ } 91{,}94$$

3. **Preço Final de Venda da Solução**:
   $$P_{\text{venda}} = C_{\text{total}} + \text{Lucro} = 762{,}89 + 91{,}94 = \mathbf{\text{R\$ } 854{,}33}$$

O investimento se paga rapidamente ao eliminar impressões constantes, perdas de tempo com deslocamento físico e riscos de não-conformidade em auditorias da Qualidade.

## Stack Tecnológica

### Frontend
- **[Next.js 14](https://nextjs.org/)** – Renderização do lado do servidor (SSR) e navegação Single-Page instantânea sem recarregamento.
- **[React 18](https://react.dev/)** – Arquitetura de componentes reutilizáveis e reativos.
- **[TypeScript](https://www.typescriptlang.org/)** – Tipagem estática rigorosa de ponta a ponta (dados, APIs e componentes).
- **[Sass (Módulos SCSS)](https://sass-lang.com/)** – Estilização modular com escopo encapsulado por componente.
- **[SWR](https://swr.vercel.app/)** – Gerenciamento de cache, revalidação e requisições no cliente.
- **[React-Toastify](https://fkhadra.github.io/react-toastify/)** – Feedback visual assíncrono para operações de formulário e alertas.

### Backend & Armazenamento
- **[Rotas de API do Next.js](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)** – Camada serverless de endpoints RESTful.
- **[MongoDB Atlas](https://www.mongodb.com/atlas)** – Banco de dados NoSQL em nuvem com alta disponibilidade e criptografia em trânsito/repouso.
- **[Mongoose 8](https://mongoosejs.com/)** – Modelagem orientada a esquemas e validação de documentos.
- **[Busboy](https://github.com/mscdex/busboy)** – Parser de streaming de alto desempenho para formulários multipart e uploads de múltiplos arquivos.
- **[Sharp](https://sharp.pixelplumbing.com/)** – Otimização e manipulação rápida de imagens e documentos gráficos.
- **[Crypto (Nativo do Node.js)](https://nodejs.org/api/crypto.html)** – Geração de hashes criptográficos SHA-256 para integridade e deduplicação.

## Capturas de Tela & Demonstração

### 1. Tela de Autenticação
*Interface simples de acesso, permitindo a separação entre operadores de fábrica e administradores da qualidade.*

![Tela de autenticação](https://github.com/user-attachments/assets/50002d99-5586-40ff-8d5a-b2edebeb5c74)

### 2. Página Inicial & Notificações de Vencimento
*Dashboard principal exibindo atalho para upload e notificações alertando sobre documento prestes a expirar.*

![Página inicial com notificação de expiração](https://github.com/user-attachments/assets/5bfd5164-0985-4265-b760-fb43b37bd517)

### 3. Diretório de Documentos por Categoria
*Navegação em pastas organizadas por tipos normatizados (Ata, POP, Inventário, OS, NF).*

![Diretório de documentos](https://github.com/user-attachments/assets/19812472-c84d-4616-9d45-0fad315229f7)

### 4. Formulário de Envio com Metadados
*Modal de upload com suporte a múltiplos arquivos, definição de data de criação, data limite de validade, categoria e nível de confidencialidade.*

![Formulário de envio de documentos](https://github.com/user-attachments/assets/9ac1157b-9014-454c-8006-32dfc2d3ea32)

### 5. Gerenciamento de Usuários e Permissões
*Painel restrito a administradores para inclusão, edição de perfis de acesso e controle de credenciais.*

![Painel de gerenciamento de usuários](https://github.com/user-attachments/assets/de9753c1-777e-4cc9-b585-b80e61f7e42a)

## Como Rodar o Projeto

### Pré-requisitos
- **Node.js**: versão `v20.19.0` ou superior
- **Gerenciador de Pacotes**: [pnpm](https://pnpm.io/) (recomendado) ou `npm`
- **Banco de Dados**: Instância ativa do [MongoDB Atlas](https://www.mongodb.com/atlas) ou MongoDB local (`>= 6.0`)

### Instalação e Configuração

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Alphka/Flash-Upload-Server.git
   cd Flash-Upload-Server
   ```

2. **Instale as dependências:**
   ```bash
   pnpm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie o arquivo `.env.local` na raiz do projeto:
   ```bash
   cp .env.example .env.local
   ```

### Variáveis de Ambiente
Edite o arquivo `.env.local` informando a URI do seu banco de dados:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `MONGODB_URI` | String de conexão com o MongoDB Atlas com autenticação | `mongodb+srv://usuario:senha@cluster.mongodb.net/flash?retryWrites=true&w=majority` |

### Executando a Aplicação

* **Modo de desenvolvimento:**
  ```bash
  pnpm dev
  ```
  Acesse [http://localhost:3000](http://localhost:3000) no navegador.

* **Build e execução em produção:**
  ```bash
  pnpm build
  pnpm start
  ```

## Contexto Acadêmico & Créditos

Este projeto foi concebido, modelado e defendido formalmente em:
* **Instituição**: **SENAI – Serviço Nacional de Aprendizagem Industrial**
* **Unidade**: Centro de Formação Profissional Luiz de Paula (Montes Claros - MG, 2023)
* **Curso**: *Técnico em Qualidade*
* **Disciplina**: *Projeto de Inovação* (Instrutora: Mariane Mota)
* **Equipe**:
  - **Kayo Felipe de Souza Melo**
  - Larissa Aparecida Silva de Oliveira
  - Maria Eduarda Carreiro Lopes
  - Vitória Ferreira Rocha
  - Maria Eduarda Carvalho de Souza

## Licença
Este projeto está sob a licença [MIT](LICENSE.md).
