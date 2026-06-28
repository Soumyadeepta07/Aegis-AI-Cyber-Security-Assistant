# Aegis SOC - MySQL & SQLite Relational Database Setup Guide

This guide explains how to configure and run the Aegis AI Cyber Security Assistant database layer in either **MySQL Production Mode** or **SQLite Local Development Mode**.

---

## Database Architecture Overview

Aegis is equipped with a dynamic database provider layer:
1. **SQLite (Development Mode)**: Actives automatically if MySQL is unreachable. It runs entirely locally in `prisma/dev.db`, allowing developers to run scans, sign in, and write chat histories with zero dependencies.
2. **MySQL 8+ (Production Mode)**: Runs in enterprise environments. The application automatically detects the database connection and switches to MySQL without any code changes.

---

## 1. Quick Start: Local Development Mode (SQLite)

Local development requires **no installation** of a database server. 

### Steps:
1. Copy `.env.example` to `.env.local` (already done if `.env.local` exists):
   ```bash
   LOCAL_DATABASE_URL="file:./dev.db"
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   *Under the hood, the prepare hook will automatically verify MySQL status, see it is offline, configure `schema.prisma` for SQLite, compile the client, and synchronize the database schema in `prisma/dev.db`.*
3. Seed the local database with default credentials and CVE profiles:
   ```bash
   npx prisma db seed
   ```

---

## 2. Production Mode (MySQL 8+)

To run MySQL locally or in production:

### Option A: Running via Docker Compose (Recommended)
This boots both the MySQL database and the Next.js application in linked containers.

1. Ensure Docker Desktop is running.
2. Start the services:
   ```bash
   docker-compose up --build
   ```
   *This initializes a MySQL 8 container, creates the database schema, compiles the Prisma Client, runs the Next.js production build, and makes the application accessible at `http://localhost:3000`.*

### Option B: Using a Manual Local/Remote MySQL Server
If you already have a MySQL server running on your machine:

1. Create a blank database (e.g. `aegis_sec_db`).
2. Add the connection string to `.env.local` using the standard format:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/aegis_sec_db"
   ```
3. Run the Prisma prepare command to probe the connection and switch the schema:
   ```bash
   npm run prisma:prepare
   ```
4. Deploy the database migrations to build tables:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed the database with telemetry and admin/user profiles:
   ```bash
   npx prisma db seed
   ```
6. Start the app:
   ```bash
   npm run dev
   ```

---

## 3. Database Schema Models

The database contains the following tables:
*   `users`: Stores operators (administrators and users), session block status, and role privileges.
*   `sessions` / `accounts` / `verifications`: Utilized by Better Auth for session tokens and authentications.
*   `scans`: Holds high-level records of security scans.
*   `domain_scans`: Stores DNS records, registrar records, SSL certificates, and reputation details.
*   `file_scans`: Stores file sizing, magic bytes signature matches, SHA-256/MD5 hashes, and risk indicators.
*   `security_reports`: Detailed headers parsing, vulnerability findings, and executive summaries.
*   `chat_history`: Serialized message logs between operators and the AI Advisor.
*   `cves`: Vulnerability database for Log4Shell, Heartbleed, EternalBlue, etc.
*   `audit_reports`: Relational audit findings linked to users.

---

## 4. Verification and Troubleshooting

*   **Check Active DB Status**: A warning banner is displayed at the top of the Aegis SOC dashboard:
    *   **Development Mode Banner** (`SQLite Local`): Confirms MySQL is unreachable and SQLite is storing the logs.
    *   **No Banner**: Confirms the application is connected to MySQL.
*   **Resetting Databases**: To completely wipe and rebuild schemas:
    *   SQLite: Delete `prisma/dev.db` and run `npm run prisma:prepare`.
    *   MySQL: Run `npx prisma migrate reset` (Caution: drops all tables).
