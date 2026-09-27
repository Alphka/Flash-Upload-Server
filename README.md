# Flash Upload Server

> **Language / Idioma:** **English** | [Português (Brasil)](README.pt-BR.md)
>
> *Se você prefere ler esta documentação em português, [clique aqui](README.pt-BR.md).*

<div align="center">
	<a href="https://github.com/Alphka/Flash-Upload-Server">
		<img src="https://raw.githubusercontent.com/Alphka/Flash-Upload-Server/b3a18f32454d73f86324ee7e316c7b7e1b07b8f9/public/icons/favicon.svg" alt="Flash Platform Logo" height="150">
	</a>
	<h3>Electronic Document Management System (EDMS) for Industrial Quality Control</h3>
	<p>
		A responsive web platform engineered to eliminate paper-based floor workflows, prevent version redundancy, and centralize the lifecycle of industrial Quality Management documents.
	</p>
</div>

<br>

<p align="center">
	<a href="https://github.com/Alphka/Flash-Upload-Server/releases"><img alt="GitHub release" src="https://img.shields.io/github/v/release/Alphka/Flash-Upload-Server?color=%235271FF&label=Latest%20Release&style=for-the-badge&sort=semver"></a>
	<a href="LICENSE.md"><img alt="License" src="https://img.shields.io/github/license/Alphka/Flash-Upload-Server?color=%235271FF&style=for-the-badge&label=License"></a>
	<img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white">
	<img alt="React" src="https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
	<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
	<img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white">
	<img alt="Sass" src="https://img.shields.io/badge/Sass-SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white">
</p>

## Table of Contents
- [Flash Upload Server](#flash-upload-server)
  - [Table of Contents](#table-of-contents)
  - [Live Demo \& Credentials](#live-demo--credentials)
    - [Demo Login Credentials](#demo-login-credentials)
  - [About the Project](#about-the-project)
    - [Industrial Context \& Problem](#industrial-context--problem)
    - [The Solution (Flash EDMS)](#the-solution-flash-edms)
    - [Goals \& ISO 9001 Alignment](#goals--iso-9001-alignment)
  - [System Architecture \& Data Flow](#system-architecture--data-flow)
    - [Architectural Overview](#architectural-overview)
    - [Cryptographic Deduplication (SHA-256)](#cryptographic-deduplication-sha-256)
    - [Proactive Expiration Engine](#proactive-expiration-engine)
    - [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
    - [Document Classification Scheme](#document-classification-scheme)
  - [Economic Feasibility \& Cost Modeling](#economic-feasibility--cost-modeling)
    - [Financial Breakdown](#financial-breakdown)
    - [Mathematical Pricing Model](#mathematical-pricing-model)
  - [Tech Stack](#tech-stack)
    - [Frontend](#frontend)
    - [Backend \& Storage](#backend--storage)
  - [Screenshots \& Feature Walkthrough](#screenshots--feature-walkthrough)
    - [1. Authentication Screen](#1-authentication-screen)
    - [2. Main Dashboard \& Proactive Notification System](#2-main-dashboard--proactive-notification-system)
    - [3. Categorized Document Directory](#3-categorized-document-directory)
    - [4. Multi-File Upload Form](#4-multi-file-upload-form)
    - [5. User \& Access Control Management](#5-user--access-control-management)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation \& Setup](#installation--setup)
    - [Environment Variables](#environment-variables)
    - [Running the Application](#running-the-application)
  - [Academic Context \& Credits](#academic-context--credits)
  - [License](#license)

---

## Live Demo & Credentials

A public demonstration environment is hosted live on Vercel for testing and evaluation purposes.

> **Live Demo URL**: [https://flash-upload-server-git-public-alphkas-projects.vercel.app/](https://flash-upload-server-git-public-alphkas-projects.vercel.app/)

### Demo Login Credentials

| Access Profile | Username | Password | Purpose & Access Level |
| :--- | :---: | :---: | :--- |
| **Administrative Access** | `admin` | `123` | Full administrative view to inspect private documents, user management, and settings menus. |
| **Public Access** | `teste` | `123` | Standard floor operator profile for document browsing and file submission interface. |

> [!IMPORTANT]
> **Read-Only Mode Notice**: In this live public environment, data modifications (creating, editing, or deleting documents and users) are disabled for security and integrity reasons. The instance is designed exclusively to showcase the platform's interface, workflows, and features.

---

## About the Project

### Industrial Context & Problem
This project was born out of an industrial challenge submitted through the **SAGA SENAI de Inovação** platform for a **Steel Products Manufacturing Company**.

In the factory under study, operators on the production line lacked digital access points to consult standard operating procedures and register inspection sheets. Consequently, the operational flow suffered from severe inefficiencies:
1. **Double Handling & Motion Waste**: Operators recorded measurements and checks on paper sheets and routinely had to walk from the production floor to the administrative office to have them scanned.
2. **Version Divergence & Redundancy**: Documents existed simultaneously in physical binders and disconnected network folders, creating duplicate records and the risk of operators working with obsolete revisions.
3. **Operational Waste (Lean Manufacturing)**: Excessive paper, printer toner consumption, loss of productive operator hours, and cluttered physical archives.

### The Solution (Flash EDMS)
**Flash** is a lightweight, responsive **Electronic Document Management System (EDMS)** built to bridge the floor-to-office gap.

By deploying tablet devices directly on the production lines alongside administrative desktop stations, Flash provides an instantaneous channel to:
- Digitize physical records via mobile cameras/scanners directly at the workstation.
- Search and consult operational standards (POPs, technical drawings, inspection sheets) in real time.
- Eliminate duplicate files and enforce document retention and expiration policies.

### Goals & ISO 9001 Alignment
* **Single Source of Truth**: Centralize all Quality Management documentation under a single digital repository.
* **ISO 9001 Compliance**: Meet the requirements for *Documented Information* (clause 7.5), ensuring standard distribution, traceability, access control, and revision management.
* **Waste Reduction**: Drastically minimize paper usage, physical storage needs, and administrative scanning bottlenecks.

## System Architecture & Data Flow

### Architectural Overview
Flash follows a full-stack architecture built on **Next.js** (Pages Router with Server-Side Rendering) coupled with **MongoDB Atlas** for document and metadata persistence.

```mermaid
flowchart TD
    subgraph Clients["Clients / Access Devices"]
        Op["Floor Operator<br/>(Tablet / Mobile Device)"]
        Adm["Admin Staff<br/>(Desktop Workstation)"]
    end

    subgraph Platform["Flash EDMS Platform (Next.js 14)"]
        Auth["Auth & Session Management<br/>(HTTP-Only Cookies & Bearer Tokens)"]
        UI["Frontend Interface<br/>(React 18 + SCSS Modules + SWR)"]
        API["Next.js API Routes<br/>(/api/files, /api/login, /api/notifications, /api/search)"]
        Crypto["Cryptographic Engine<br/>(SHA-256 Payload Hash & Mime Validator)"]
    end

    subgraph Database["Data Layer (MongoDB Atlas)"]
        ColFiles[("Files Collection<br/>Payload Buffer, SHA-256, Expiry, Access")]
        ColUsers[("Users Collection<br/>Credentials & Access Roles")]
        ColTokens[("UserTokens Collection<br/>Session Invalidation & Timers")]
    end

    Op -->|Public Floor Credential| Auth
    Adm -->|Administrative Credential| Auth
    Auth --> UI
    UI --> API
    API --> Crypto
    Crypto --> ColFiles
    API --> ColUsers
    API --> ColTokens
```

### Cryptographic Deduplication (SHA-256)
To avoid storing identical files multiple times (a common issue when multiple shifts scan the same standard or duplicate files are uploaded), Flash hashes the raw file buffer using the **SHA-256** algorithm before persisting:

```typescript
const hash = Crypto.createHash("sha256").update(fileBuffer).digest("hex")
const fileDocument = await File.findOne({ hash })

if(fileDocument){
    throw "Este arquivo já foi enviado para o servidor" // Duplicate detected
}
```

This guarantees storage efficiency, referential integrity, and verifiable content authenticity.

### Proactive Expiration Engine
Quality documentation (calibration reports, POPs, work safety protocols) must remain strictly up to date. The system periodically computes the time remaining until each file's expiration date ($T_{\text{remaining}} = \text{expiresAt} - \text{today}$):

$$\Delta t \le 3 \text{ days} \Rightarrow \text{Trigger Notification}$$

When $\Delta t \le 3$, the `/api/notifications` service automatically alerts users across the navigation bar, preventing operators from referencing expired standards.

### Role-Based Access Control (RBAC)
Flash implements a two-tier permission system:
* **Public (`public`)**: Dedicated to floor tablets. Requires a collective password, allowing operators to consult published documents and submit production records without complex individual account overhead.
* **Administrative (`all`)**: Granted to Quality Managers and Administrators. Allows access to both public and confidential/private files, editing document metadata, updating expiration dates, and managing system users.

### Document Classification Scheme
Documents are organized into five industrial quality categories:
| ID | Document Type | Reduced Code | Industrial Description |
| :---: | :--- | :---: | :--- |
| `1` | **Ata** | `Ata` | Meeting minutes, internal audits, and quality committee notes. |
| `2` | **Procedimento Operacional Padrão** | `POP` | Standard Operating Procedures for machine handling and assembly. |
| `3` | **Inventário** | `Inventário` | Stock reports, raw material tracking, and finished goods counts. |
| `4` | **Ordem de Serviço** | `OS` | Maintenance logs, work requests, and production tasks. |
| `5` | **Nota Fiscal** | `NF` | Invoices, receipt records, and raw steel supplier certificates. |

## Economic Feasibility & Cost Modeling

Commercial enterprise EDMS solutions typically charge prohibitive recurring monthly software-as-a-service (SaaS) fees. As part of the technical-economic viability study conducted at **SENAI**, a cost-effective deployment package was engineered for industrial adoption.

### Financial Breakdown
The implementation was structured around minimal capital expenditure (CapEx) and operational expenditure (OpEx):

| Category | Component | Value (BRL) | Description |
| :--- | :--- | :---: | :--- |
| **Costs (CapEx)** | Software Engineering & Setup | 300,00 | Deployment, database setup, and configuration. |
| **Costs (CapEx)** | Floor Hardware (Tablet Multilaser M7) | 349,00 | Dedicated touch device for the factory workstation. |
| **Subtotal Costs** | | **649,00** | Initial implementation investment. |
| **Expenses (OpEx)** | Industrial Broadband Access | 99,90 | Plant floor network connectivity. |
| **Expenses (OpEx)** | Cloud Hosting & Infrastructure | 13,99 | Server and database hosting tier. |
| **Subtotal Expenses**| | **113,89** | Monthly infrastructure expense. |
| **Total Cost** | | **762,89** | Base project investment cost. |

### Mathematical Pricing Model
Following Brazilian industry profitability benchmarks (which advise between $7\%$ and $12\%$ net margin for industrial software/hardware packages), a target margin of $M = 12\%$ was applied:

1. **Total Implementation Cost**:
   $$C_{\text{total}} = \text{Costs} + \text{Expenses} = 649{,}00 + 113{,}89 = \text{R\$ } 762{,}89$$

2. **Net Profit Margin ($12\%$)**:
   $$\text{Profit} = C_{\text{total}} \times M = 762{,}89 \times 0{,}12 = \text{R\$ } 91{,}94$$

3. **Final Commercial Package Price**:
   $$P_{\text{sale}} = C_{\text{total}} + \text{Profit} = 762{,}89 + 91{,}94 = \mathbf{\text{R\$ } 854{,}33}$$

This initial investment offers a rapid payback period by cutting printing/paper expenses and eliminating hundreds of hours wasted on transit between factory floor and administrative offices.

## Tech Stack

### Frontend
- **[Next.js 14](https://nextjs.org/)**: hybrid Server-Side Rendering (SSR) and Client-Side Navigation for instant page transitions.
- **[React 18](https://react.dev/)**: component-driven modular UI architecture.
- **[TypeScript](https://www.typescriptlang.org/)**: static type safety across client, models, and API boundaries.
- **[Sass (SCSS Modules)](https://sass-lang.com/)**: scoped component styling and design tokens.
- **[SWR](https://swr.vercel.app/)**: client-side data fetching, caching, and revalidation.
- **[React-Toastify](https://fkhadra.github.io/react-toastify/)**: feedback notifications for user interactions.

### Backend & Storage
- **[Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)**: serverless endpoint architecture.
- **[MongoDB Atlas](https://www.mongodb.com/atlas)**: cloud NoSQL document database.
- **[Mongoose 8](https://mongoosejs.com/)**: schema definition, data validation, and model lifecycle management.
- **[Busboy](https://github.com/mscdex/busboy)**: high-performance streaming multipart form data parser.
- **[Sharp](https://sharp.pixelplumbing.com/)**: fast image processing and optimization.
- **[Crypto (Node.js native)](https://nodejs.org/api/crypto.html)**: cryptographic SHA-256 hash calculation.

## Screenshots & Feature Walkthrough

### 1. Authentication Screen
*Simple login barrier offering separation between standard factory-floor profiles and administrative accounts.*

![Authentication Screen](https://github.com/user-attachments/assets/50002d99-5586-40ff-8d5a-b2edebeb5c74)

### 2. Main Dashboard & Proactive Notification System
*Clean dashboard welcoming the operator, with instant access to the multi-file upload action and notifications displaying documents nearing their expiration date.*

![Dashboard with expiration notification](https://github.com/user-attachments/assets/5bfd5164-0985-4265-b760-fb43b37bd517)

### 3. Categorized Document Directory
*Organized folder structure grouping files by Quality categories (Ata, POP, Inventário, OS, NF).*

![Documents folder view](https://github.com/user-attachments/assets/19812472-c84d-4616-9d45-0fad315229f7)

### 4. Multi-File Upload Form
*Upload modal with drag-and-drop support, individual document naming, creation date, expiration date picker, category tag, and public/private privacy toggle.*

![Multi-file upload modal](https://github.com/user-attachments/assets/9ac1157b-9014-454c-8006-32dfc2d3ea32)

### 5. User & Access Control Management
*Administrative interface for creating, editing, and supervising system operators, user roles, and system credentials.*

![User management panel](https://github.com/user-attachments/assets/de9753c1-777e-4cc9-b585-b80e61f7e42a)

## Getting Started

### Prerequisites
- **Node.js**: `v20.19.0` or higher
- **Package Manager**: [pnpm](https://pnpm.io/) (recommended) or `npm`
- **Database**: A running [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or local MongoDB instance (`>= 6.0`)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Alphka/Flash-Upload-Server.git
   cd Flash-Upload-Server
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file in the project root:
   ```bash
   cp .env.example .env.local
   ```

### Environment Variables
Edit `.env.local` and provide your MongoDB connection string:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB connection URI string with authentication and database name | `mongodb+srv://user:pass@cluster.mongodb.net/flash?retryWrites=true&w=majority` |

### Running the Application

* **Development mode (with Hot Module Replacement):**
  ```bash
  pnpm dev
  ```
  Open [http://localhost:3000](http://localhost:3000) in your browser.

* **Production build & execution:**
  ```bash
  pnpm build
  pnpm start
  ```

## Academic Context & Credits

This project was conceived, designed, and presented at:
* **Institution**: **SENAI – Serviço Nacional de Aprendizagem Industrial**
* **Campus**: Centro de Formação Profissional Luiz de Paula (Montes Claros - MG, 2023)
* **Course**: *Curso Técnico em Qualidade*
* **Discipline**: *Projeto de Inovação* (Instrutora: Mariane Mota)
* **Project Team**:
  - **Kayo Felipe de Souza Melo**
  - Larissa Aparecida Silva de Oliveira
  - Maria Eduarda Carreiro Lopes
  - Vitória Ferreira Rocha
  - Maria Eduarda Carvalho de Souza

## License
This project is released under the terms of the [MIT License](LICENSE.md).
