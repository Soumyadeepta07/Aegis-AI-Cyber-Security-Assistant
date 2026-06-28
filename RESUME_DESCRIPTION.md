# Resume & Interview Portfolio Guide: Aegis AI Cyber Security Assistant

This document contains high-impact highlights, project summaries, and architectural discussion notes about the Aegis AI Cyber Security Assistant for resume presentation and technical interviews.

---

## 1. Resume Bullet Points (High-Impact Achievements)

* **Engineered a dynamic dual-database relational backend** in Next.js 16 (App Router) utilizing **Prisma ORM** that automatically probes for MySQL availability at startup and falls back to local SQLite persistence on failure, ensuring **100% platform availability** and zero-config developer setups.
* **Architected a multi-engine security scanning pipeline** integrating Google Safe Browsing, VirusTotal, and AbuseIPDB API hooks; designed a custom semantic threat analysis parser backed by the **Gemini 1.5 Flash LLM** to translate complex network payload signals into enterprise-ready remediation actions.
* **Built an automated site security auditing daemon** mapping header attributes (CSP, CORS, HSTS, Cookie flags) to **OWASP Top 10 vulnerabilities**, generating real-time audit reports and dynamically compiling them into printable PDF summaries using `jsPDF`.

---

## 2. 100-Word Project Summary

Aegis is a next-generation AI Cyber Security Assistant and Security Operations Center (SOC) dashboard. Built with Next.js 16, TypeScript, MySQL 8+, SQLite, and TailwindCSS, the platform aggregates domain intelligence, URL reputations, and file hashes via VirusTotal and Google Safe Browsing APIs. It utilizes Gemini 1.5 Flash to synthesize these multi-source signals into human-readable threat assessments. Aegis features automated website security header audits mapped to the OWASP Top 10, interactive AI advisory chats in a simulated security CLI sandbox, dynamic charting via Recharts, and role-based access controls powered by Better Auth.

---

## 3. Technical Challenges Solved

### A. Dynamic Database Connection Probing & Provider Swapping
* **Problem**: Prisma ORM requires a hardcoded database provider (like `mysql` or `sqlite`) in its schema file and compiles provider-specific engines at build time, preventing runtime database provider switching.
* **Solution**: Implemented an automated build-hook script (`prepare-prisma.js`) that runs before Next.js starts. The script executes a raw TCP port probe to check if the production MySQL server is online. On success, it configures the schema for MySQL and compiles the client; on failure, it dynamically rewrites the schema for SQLite, mounts a local SQLite database (`dev.db`), and pushes the relational schema, writing a runtime configuration file to let layouts render a visible development banner.

### B. Security Headers Auditing Bypass for Client-Side CORS Restrictions
* **Problem**: Web browsers restrict reading HTTP headers of external websites from the client-side due to strict Cross-Origin Resource Sharing (CORS) rules.
* **Solution**: Created a secure server-side Node.js API router `/api/scan/audit` to execute the HTTP requests. This route resolves DNS IP lookups, fetches external headers on the server side, parses the security policies, and feeds the structured details to the Gemini model to map potential vulnerabilities without exposing users to client-side CORS blocks.

---

## 4. Interview Conversation Guide (Talking Points)

When discussing Aegis during technical interviews, guide the conversation through these architectural themes:

1. **Relational Database Migration & Normalization**: Discuss transitioning from an unstructured MongoDB schema to a normalized MySQL/SQLite database structure with foreign keys, indexes, cascading deletes (`onDelete: Cascade` on Scan deletes), and standard constraints.
2. **AI Signal Aggregation**: Emphasize that the AI is not just generating responses from scratch. It is used as an **orchestration and synthesis layer** that sits on top of raw developer tools (DNS resolvers, SSL certificates, VirusTotal reputation scores) to translate cold numbers into actionable guidance.
3. **Enterprise Role-Based Access Controls (RBAC)**: Explain how standard users can only run scans and view their own history logs, while administrators gain access to a dedicated root SOC moderation view to suspend accounts or adjust permissions.
