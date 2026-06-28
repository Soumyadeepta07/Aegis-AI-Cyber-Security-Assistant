# Aegis AI Cyber Security Assistant & SOC Dashboard

A modern, enterprise-ready **AI-Powered Cyber Security Assistant** and **Security Operations Center (SOC) Control Console**. Aegis aggregates domain reputation scores, SSL certificate handshakes, file signatures, and DNS zone profiles, using **Gemini 1.5 Flash AI** to synthesize multi-source security feeds into human-actionable threat reports.

---

## 🛡️ Project Overview & Architecture

Aegis is engineered with a **resilient relational database layer** managed by **Prisma ORM**. If connection to a production MySQL instance is unavailable, Aegis enters **Development Mode** utilizing a local, zero-dependency **SQLite database fallback** (`dev.db`). This makes the application fully persistent and functional out of the box for local developers and serverless edge builds.

```mermaid
graph TD
    User([Security Operator]) -->|Browser UI / console| App[Next.js App Router Frontend]
    App -->|Dynamic Connection Probe| DBManager[Prisma DB Connector]
    DBManager -->|MySQL Reachable| MySQL[(Production MySQL 8+)]
    DBManager -->|MySQL Unreachable Fallback| SQLite[(Local SQLite DB)]
    
    App -->|API Scan Request| ThreatIntel[Threat Intelligence Pipeline]
    ThreatIntel -->|External API Lookup| VT[VirusTotal API]
    ThreatIntel -->|External API Lookup| GSB[Google Safe Browsing]
    ThreatIntel -->|External API Lookup| IPDB[AbuseIPDB API]
    ThreatIntel -->|Simulated Heuristics Fallback| SimEngine[Simulated Threat Engine]
    
    ThreatIntel -->|Parsed Threat Signals| Gemini[Gemini 1.5 Flash AI Engine]
    Gemini -->|Synthesized Threat Assessment| App
    
    App -->|Initialize Audit| AuditDaemon[Server-side Header Auditor]
    AuditDaemon -->|CORS-Bypassing Fetch| Target[Target Host Domain]
    AuditDaemon -->|Security Header Checks| Gemini
```

---

## ⚡ Core Features

| Feature | Description | Modes Supported |
| :--- | :--- | :--- |
| **URL Threat Scanning** | Evaluates URL endpoints against Safe Browsing and VirusTotal APIs for phishing indicators. | Live API & Simulated Fallback |
| **Domain Intelligence** | Maps DNS Zone records (A, MX, TXT, NS), validates SSL expiry/issuers, and checks SPF/DMARC hardening flags. | Live DNS Resolve & Simulated Fallback |
| **File Signature Analyzer**| Generates MD5 & SHA-256 signatures, measures file header magic bytes and entropy to flag masquerading binaries. | Live VirusTotal & Simulated Fallback |
| **AI Security Audit** | Resolves external HTTP response headers, parses security policies (CSP, HSTS, Cookies), and maps threats to the **OWASP Top 10**. | CORS Bypass Server-side Auditor |
| **Security Advisor** | Real-time CLI-style advisory chat powered by Gemini AI, providing mitigation code snippets and hardening guides. | Gemini AI Core Chatbot |
| **CVE Database** | Explores, filters, and searches public disclosures and mitigation guides for severe CVE records (e.g. Log4Shell, Heartbleed). | Local Search & Prisma query |
| **Admin SOC Controls** | Dedicated user moderation panel to manage clearance roles, suspend accounts, and view platform-wide telemetry. | RBAC Enforced (Admin Only) |
| **Self-Healing Fallback** | Automatic detection of MySQL database unavailability, falling back to a fully persistent SQLite local database with a visible banner. | Automatic Resiliency |

---

## 💻 Tech Stack

- **Core Framework**: React 19, Next.js 16 (App Router), TypeScript
- **Styling & UI**: TailwindCSS 4, Lucide React (Icons), Framer Motion (Transitions)
- **AI Core Integration**: Google `@google/generative-ai` (Gemini 1.5 Flash)
- **Database Systems**: MySQL 8+ (Production Mode) / SQLite (Local Development Mode fallback)
- **ORM & Migrations**: Prisma ORM & Prisma Migrations
- **Authentication**: Better Auth (with Prisma Adapter running on active SQLite/MySQL database)
- **Reporting Engine**: `jsPDF` (Server-safe automated PDF report generator)
- **Charts**: Recharts (Dynamic threat telemetry and bar logs)

---

## 📊 SOC Dashboard Modules

Below are preview placeholders representing the Aegis SOC dashboard. Replace these assets with your screen capture uploads after staging:

### 1. Operations SOC Dashboard Telemetry
![Operations Dashboard](https://raw.githubusercontent.com/username/project/main/public/screenshots/dashboard_telemetry.png)
*Placeholder: Displays radial defensive gauges, 7-day incident charts, and recent threats feeds.*

### 2. Domain Zone Intelligence & DNS Map
![Domain Intelligence](https://raw.githubusercontent.com/username/project/main/public/screenshots/domain_intel.png)
*Placeholder: Displays DNS record arrays, SSL certificate details, and SPF/DMARC configuration metrics.*

### 3. Automated OWASP Website Audit
![Website Audit](https://raw.githubusercontent.com/username/project/main/public/screenshots/security_audit.png)
*Placeholder: Displays security header grades, OWASP Top 10 vulnerabilities listings, and PDF report downloads.*

### 4. Interactive Sandbox Terminal
![Advisor Terminal](https://raw.githubusercontent.com/username/project/main/public/screenshots/advisor_chat.png)
*Placeholder: Displays the CLI advisory chatbot giving remediation code snippets.*

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory. Copy the values from `.env.example`:

```env
# Production MySQL Database Connection URL
DATABASE_URL="mysql://username:password@localhost:3306/aegis_sec_db"

# Local Fallback SQLite Database Connection URL
LOCAL_DATABASE_URL="file:./dev.db"

# Better Auth Configuration
# Generate a secret: npx better-auth secret
BETTER_AUTH_SECRET=your_32_character_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Third-Party API Keys (Optional: leaves app in simulated fallback mode if empty)
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
GOOGLE_SAFE_BROWSING_API_KEY=your_google_safe_browsing_api_key_here

# App URL Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Installation & Local Development

Please refer to [MYSQL_SETUP.md](file:///c:/Users/SOUMYA/.gemini/antigravity-ide/scratch/ai-cyber-security-assistant/MYSQL_SETUP.md) for detailed database installation, migrations, and seeding options.

### Quick Start:
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ai-cyber-security-assistant.git
   cd ai-cyber-security-assistant
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env.local
   # Populate env values in .env.local (Default LOCAL_DATABASE_URL="file:./dev.db" is preconfigured)
   ```
4. Prepare database client (switches provider and generates client):
   ```bash
   npm run prisma:prepare
   ```
5. Seed the database with default profiles and CVEs:
   ```bash
   npx prisma db seed
   ```
6. Launch the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to review the live dashboard.

---

## 🌐 Vercel Deployment Guide

Aegis is fully compatible with serverless platforms. If your production MySQL is hosted externally (e.g. on PlanetScale, AWS RDS, or Aiven), provide the `DATABASE_URL` in the Vercel settings. If not provided or unreachable, it will build and run on a local SQLite instance seamlessly:

1. Push your repository code to GitHub, GitLab, or Bitbucket.
2. Import the project on the Vercel Dashboard.
3. Configure Environment Variables in the project settings matching `.env.local`.
4. Click **Deploy**. Vercel will trigger the `prisma:prepare` hook and build the production bundle automatically.
