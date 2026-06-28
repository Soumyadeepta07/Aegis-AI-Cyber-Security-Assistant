# Security Audit Validation Report (Evidence Mode Active)

This report presents the validation results of the updated, production-ready Aegis SOC Security Audit engine in **Evidence Mode** against **google.com**, **github.com**, and **microsoft.com**.

---

## 📊 Summary of Audits

| Host Domain | Resolved URL | Security Score | Threat Rating | Findings Count |
| :--- | :--- | :--- | :--- | :--- |
| **google.com** | https://www.google.com/ | **85/100** | SAFE | 3 |
| **github.com** | https://github.com | **95/100** | SAFE | 1 |
| **microsoft.com** | https://www.microsoft.com/en-in | **55/100** | DANGEROUS | 6 |

---

## 🔍 Detailed Domain Findings

### 1. Google (google.com)
- **Resolved Target**: `https://www.google.com/`
- **Security Score**: `85/100`

#### Evidence Summary:
- **Total Headers Inspected**: `6`
- **Headers Present**: `4`
- **Headers Missing**: `2`
- **Redirects Followed**: `YES`
- **Final URL Audited**: `https://www.google.com/`

#### Headers Detected:
```json
{
  "accept-ch": "Sec-CH-Prefers-Color-Scheme, Downlink, RTT, Sec-CH-UA-Form-Factors, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-UA-Full-Version, Sec-CH-UA-Arch, Sec-CH-UA-Model, Sec-CH-UA-Bitness, Sec-CH-UA-Full-Version-List, Sec-CH-UA-WoW64",
  "alt-svc": "h3=\":443\"; ma=2592000,h3-29=\":443\"; ma=2592000",
  "cache-control": "private, max-age=0",
  "content-encoding": "br",
  "content-length": "66685",
  "content-security-policy-report-only": "object-src 'none';base-uri 'self';script-src 'nonce-AXB5nW1HnTCkASTdxWorrQ' 'strict-dynamic' 'report-sample' 'unsafe-eval' 'unsafe-inline' https: http:;report-uri https://csp.withgoogle.com/csp/gws/other-hp",
  "content-type": "text/html; charset=UTF-8",
  "cross-origin-opener-policy": "same-origin-allow-popups; report-to=\"gws\"",
  "date": "Wed, 24 Jun 2026 18:39:21 GMT",
  "expires": "-1",
  "p3p": "CP=\"This is not a P3P policy! See g.co/p3phelp for more info.\"",
  "permissions-policy": "unload=()",
  "report-to": "{\"group\":\"gws\",\"max_age\":2592000,\"endpoints\":[{\"url\":\"https://csp.withgoogle.com/csp/report-to/gws/other\"}]}",
  "server": "gws",
  "strict-transport-security": "max-age=31536000",
  "x-frame-options": "SAMEORIGIN",
  "x-xss-protection": "0",
  "set-cookie": "__Secure-STRP=ANmZwa3-u5JYnsw1chwve0ReWOHR8taxjDYzOeTE-9TZ7WOafwITnSdqmkrjID8EgnjGZsH3jutmivx9GcW-f0ZhVDp8Sg3YF5N3; expires=Wed, 24-Jun-2026 18:44:21 GMT; path=/; domain=.google.com; Secure; SameSite=strict, AEC=AdJVEavL3Q2eZbpsRPH5zDUO-gNKLmQBTo_lJMf13eTA0ilLYuPQNTH01g; expires=Mon, 21-Dec-2026 18:39:21 GMT; path=/; domain=.google.com; Secure; HttpOnly; SameSite=lax, NID=532=FOLlK6D_m73nLrdc6O94zvMzb-6YnAggCRTKNnC3y3Zeds2szVwIA-gcXScwopbXhJkikjjQaSmXHpj485fLUClyyDvf7F8aRaDXqSpb1opXWqUFpxK5Pfydt33l42uviG28-oEtqitmCTkqIv_W3mvgOU1fD4MSxk8IByB7g_FfFFprDfed9yt5BAeYC0J_JVlblcpaa6IsMjDn43ZP43_t; expires=Thu, 24-Dec-2026 18:39:21 GMT; path=/; domain=.google.com; Secure; HttpOnly; SameSite=none, __Secure-BUCKET=CIoG; expires=Mon, 21-Dec-2026 18:39:21 GMT; path=/; domain=.google.com; Secure; HttpOnly"
}
```

#### Findings Generated (with Evidence):
* **Content Security Policy (CSP) in Report-Only Mode**
  - Severity: `LOW`
  - OWASP Mapping: `A05:2021-Security Misconfiguration`
  - Confidence Level: `High Confidence`
  - Inspected Header: `Content-Security-Policy-Report-Only`
  - Inspected Value: `object-src 'none';base-uri 'self';script-src 'nonce-AXB5nW1HnTCkASTdxWorrQ' 'strict-dynamic' 'report-sample' 'unsafe-eval' 'unsafe-inline' https: http:;report-uri https://csp.withgoogle.com/csp/gws/other-hp`
  - Inspection Reason: The site has deployed CSP in Report-Only mode, but is missing an enforcing Content-Security-Policy header.
  - Deduction: `-5 pts`
* **Missing MIME Sniffing Protection**
  - Severity: `LOW`
  - OWASP Mapping: `A05:2021-Security Misconfiguration`
  - Confidence Level: `High Confidence`
  - Inspected Header: `X-Content-Type-Options`
  - Inspected Value: `Absent`
  - Inspection Reason: The X-Content-Type-Options header was completely absent in the response.
  - Deduction: `-5 pts`
* **Missing Referrer-Policy**
  - Severity: `LOW`
  - OWASP Mapping: `A05:2021-Security Misconfiguration`
  - Confidence Level: `High Confidence`
  - Inspected Header: `Referrer-Policy`
  - Inspected Value: `Absent`
  - Inspection Reason: The Referrer-Policy header was missing from the HTTP response, causing the browser to fall back to less restrictive defaults.
  - Deduction: `-5 pts`

#### Risk Score Calculation:
- Base Score: `100`
- Deduction (Content Security Policy (CSP) in Report-Only Mode): `-5`
- Deduction (Missing MIME Sniffing Protection): `-5`
- Deduction (Missing Referrer-Policy): `-5`
- Final Score: `85`

---

### 2. GitHub (github.com)
- **Resolved Target**: `https://github.com`
- **Security Score**: `95/100`

#### Evidence Summary:
- **Total Headers Inspected**: `6`
- **Headers Present**: `5`
- **Headers Missing**: `1`
- **Redirects Followed**: `YES`
- **Final URL Audited**: `https://github.com`

#### Headers Detected:
```json
{
  "accept-ranges": "bytes",
  "cache-control": "max-age=0, private, must-revalidate",
  "content-encoding": "gzip",
  "content-language": "en-US",
  "content-security-policy": "default-src 'none'; base-uri 'self'; child-src github.githubassets.com github.com/assets-cdn/worker/ github.com/assets/ gist.github.com/assets-cdn/worker/; connect-src 'self' uploads.github.com www.githubstatus.com collector.github.com raw.githubusercontent.com api.github.com github-cloud.s3.amazonaws.com github-production-repository-file-5c1aeb.s3.amazonaws.com github-production-upload-manifest-file-7fdce7.s3.amazonaws.com github-production-user-asset-6210df.s3.amazonaws.com *.rel.tunnels.api.visualstudio.com wss://*.rel.tunnels.api.visualstudio.com github.githubassets.com objects-origin.githubusercontent.com copilot-proxy.githubusercontent.com proxy.individual.githubcopilot.com proxy.business.githubcopilot.com proxy.enterprise.githubcopilot.com *.actions.githubusercontent.com wss://*.actions.githubusercontent.com productionresultssa0.blob.core.windows.net productionresultssa1.blob.core.windows.net productionresultssa2.blob.core.windows.net productionresultssa3.blob.core.windows.net productionresultssa4.blob.core.windows.net productionresultssa5.blob.core.windows.net productionresultssa6.blob.core.windows.net productionresultssa7.blob.core.windows.net productionresultssa8.blob.core.windows.net productionresultssa9.blob.core.windows.net productionresultssa10.blob.core.windows.net productionresultssa11.blob.core.windows.net productionresultssa12.blob.core.windows.net productionresultssa13.blob.core.windows.net productionresultssa14.blob.core.windows.net productionresultssa15.blob.core.windows.net productionresultssa16.blob.core.windows.net productionresultssa17.blob.core.windows.net productionresultssa18.blob.core.windows.net productionresultssa19.blob.core.windows.net github-production-repository-image-32fea6.s3.amazonaws.com github-production-release-asset-2e65be.s3.amazonaws.com insights.github.com wss://alive.github.com wss://alive-staging.github.com api.githubcopilot.com api.individual.githubcopilot.com api.business.githubcopilot.com api.enterprise.githubcopilot.com wss://production-copilot-host.webpubsub.azure.com edge.fullstory.com rs.fullstory.com; font-src github.githubassets.com; form-action 'self' github.com gist.github.com copilot-workspace.githubnext.com objects-origin.githubusercontent.com; frame-ancestors 'none'; frame-src viewscreen.githubusercontent.com notebooks.githubusercontent.com www.youtube-nocookie.com; img-src 'self' data: blob: github.githubassets.com media.githubusercontent.com camo.githubusercontent.com identicons.github.com avatars.githubusercontent.com private-avatars.githubusercontent.com github-cloud.s3.amazonaws.com objects.githubusercontent.com release-assets.githubusercontent.com secured-user-images.githubusercontent.com user-images.githubusercontent.com private-user-images.githubusercontent.com opengraph.githubassets.com marketplace-screenshots.githubusercontent.com copilotprodattachments.blob.core.windows.net/github-production-copilot-attachments/ github-production-user-asset-6210df.s3.amazonaws.com customer-stories-feed.github.com spotlights-feed.github.com explore-feed.github.com objects-origin.githubusercontent.com *.githubusercontent.com images.ctfassets.net/8aevphvgewt8/; manifest-src 'self'; media-src github.com user-images.githubusercontent.com secured-user-images.githubusercontent.com private-user-images.githubusercontent.com github-production-user-asset-6210df.s3.amazonaws.com gist.github.com github.githubassets.com assets.ctfassets.net/8aevphvgewt8/ videos.ctfassets.net/8aevphvgewt8/; script-src github.githubassets.com; style-src 'unsafe-inline' github.githubassets.com; upgrade-insecure-requests; worker-src github.githubassets.com github.com/assets-cdn/worker/ github.com/assets/ gist.github.com/assets-cdn/worker/",
  "content-type": "text/html; charset=utf-8",
  "date": "Wed, 24 Jun 2026 18:38:55 GMT",
  "etag": "W/\"66bc8c0226fce9e413b69e1f0d8f0867\"",
  "referrer-policy": "origin-when-cross-origin, strict-origin-when-cross-origin",
  "server": "github.com",
  "strict-transport-security": "max-age=31536000; includeSubdomains; preload",
  "transfer-encoding": "chunked",
  "vary": "X-PJAX, X-PJAX-Container, Turbo-Visit, Turbo-Frame, X-Requested-With, Accept-Language, Sec-Fetch-Site,Accept-Encoding, Accept, X-Requested-With",
  "x-content-type-options": "nosniff",
  "x-frame-options": "deny",
  "x-github-request-id": "E0F0:3E4156:D60B9C:E85F13:6A3C245A",
  "x-xss-protection": "0",
  "set-cookie": "_gh_sess=Xrkza3am1HVFSWCmTIC5O66LNZNuOcktOymfl1oiaz6Nw7QHDm0wCTp6MDqpL8iyhu3agjIFH0y63Tqz%2FMETfEKfD9nd2NlRFlsxzPm275A7VZvaDtKL5HftnCBxSj3n0RGdGkgRGHX6tWlcyTXcEfYtKAIGkCYqvsBaZ1ZqmfCRQWM28Pv1FqF8USEyzI5IWt5ZoUGqeJZ2ThWZsuasIanBGU%2FNMimz8gcs3%2FNU0TXZrue6%2BDVM%2BeY9Zr4KDWrxI1EVXRUXfYWyfqwtEJFqMw%3D%3D--os6fIMsBFIGOwLQ4--zb1yHjKc%2FCzfAwvXrq7jVw%3D%3D; path=/; HttpOnly; secure; SameSite=Lax, _octo=GH1.1.1512224341.1782326362; expires=Thu, 24 Jun 2027 18:39:22 GMT; domain=.github.com; path=/; secure; SameSite=Lax, logged_in=no; expires=Thu, 24 Jun 2027 18:39:22 GMT; domain=.github.com; path=/; HttpOnly; secure; SameSite=Lax"
}
```

#### Findings Generated (with Evidence):
* **Missing Permissions-Policy**
  - Severity: `LOW`
  - OWASP Mapping: `A05:2021-Security Misconfiguration`
  - Confidence Level: `High Confidence`
  - Inspected Header: `Permissions-Policy`
  - Inspected Value: `Absent`
  - Inspection Reason: The Permissions-Policy header was missing from the HTTP response, which allows the page to access browser APIs without restriction.
  - Deduction: `-5 pts`

#### Risk Score Calculation:
- Base Score: `100`
- Deduction (Missing Permissions-Policy): `-5`
- Final Score: `95`

---

### 3. Microsoft (microsoft.com)
- **Resolved Target**: `https://www.microsoft.com/en-in`
- **Security Score**: `55/100`

#### Evidence Summary:
- **Total Headers Inspected**: `6`
- **Headers Present**: `1`
- **Headers Missing**: `5`
- **Redirects Followed**: `YES`
- **Final URL Audited**: `https://www.microsoft.com/en-in`

#### Headers Detected:
```json
{
  "accept-ch": "Sec-CH-UA-Platform-Version",
  "cache-control": "max-age=0,s-maxage=86400",
  "connection": "keep-alive",
  "content-encoding": "gzip",
  "content-length": "23889",
  "content-type": "text/html; charset=utf-8",
  "date": "Wed, 24 Jun 2026 18:39:23 GMT",
  "ms-commit-id": "a7b3e0a",
  "ms-cv": "CASMicrosoftCVa5b9ad07.0",
  "ms-cv-esi": "CASMicrosoftCVa5b9ad07.0",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "tls_version": "tls1.3",
  "vary": "Accept-Encoding",
  "x-azure-ref": "20260624T183457Z-1688c65dfff452sphC1MAA4ymn000000041g0000000009kx",
  "x-cascade-version": "vNext",
  "x-edgescape-location": "country_code=IN",
  "x-rtag": "Homepage_Echo",
  "x-trace-id": "4e51ad82b2226adc6aedbe008ddd2ffc",
  "set-cookie": "CAS_PROGRAM=echo; expires=Wed, 24-Jun-2026 18:39:31 GMT; path=/; secure; SameSite=None, ak_bmsc=594A54CA37B334E237C124BE078CEE1A~000000000000000000000000000000~YAAQVYgsMSEGz+CeAQAAbwbu+gChRz6G0+E1JgBUnRF9dTa7Wr/a30B3EWOLcAWmes7ACAx4rE94FKnG0hWJXz1tGz0gcYFCQMciPzvkoDkKDwOU9MdcLaKZmtvgVG35gzynvwPf3gjh/Vb+BX7byOcL+vREV0yH0S5JUuvQhvkdQnPh6XOY7mRk4pHJ8LoVa4naZFhBwSKNgQmzQDiy1sUkGf7cJyyjaPUThqVYmrxdlEHZiD0vmaCbBuJOMCEPXcBGDmWkM+uW5EWFaTKOThEbof0hfVftRMLDENjm6H7fBH9cVYb1Gg42ulozCYLu9HrKn34xCHyMnxfNliBTMu8lh65EydyWZdzh3KNBF+k1T+YzYGmgNohxPx+c66hT; Domain=.microsoft.com; Path=/; Expires=Wed, 24 Jun 2026 20:39:23 GMT; Max-Age=7200; HttpOnly"
}
```

#### Findings Generated (with Evidence):
* **Missing Content Security Policy (CSP)**
  - Severity: `HIGH`
  - OWASP Mapping: `A03:2021-Injection`
  - Confidence Level: `High Confidence`
  - Inspected Header: `Content-Security-Policy`
  - Inspected Value: `Absent`
  - Inspection Reason: Neither the Content-Security-Policy header nor the Content-Security-Policy-Report-Only header was detected in the HTTP response.
  - Deduction: `-15 pts`
* **Missing Clickjacking Protection**
  - Severity: `MEDIUM`
  - OWASP Mapping: `A05:2021-Security Misconfiguration`
  - Confidence Level: `High Confidence`
  - Inspected Header: `X-Frame-Options / CSP frame-ancestors`
  - Inspected Value: `X-Frame-Options: Absent; CSP frame-ancestors: Absent`
  - Inspection Reason: Neither the X-Frame-Options header nor CSP directive "frame-ancestors" was detected in the HTTP response.
  - Deduction: `-10 pts`
* **Missing MIME Sniffing Protection**
  - Severity: `LOW`
  - OWASP Mapping: `A05:2021-Security Misconfiguration`
  - Confidence Level: `High Confidence`
  - Inspected Header: `X-Content-Type-Options`
  - Inspected Value: `Absent`
  - Inspection Reason: The X-Content-Type-Options header was completely absent in the response.
  - Deduction: `-5 pts`
* **Missing Referrer-Policy**
  - Severity: `LOW`
  - OWASP Mapping: `A05:2021-Security Misconfiguration`
  - Confidence Level: `High Confidence`
  - Inspected Header: `Referrer-Policy`
  - Inspected Value: `Absent`
  - Inspection Reason: The Referrer-Policy header was missing from the HTTP response, causing the browser to fall back to less restrictive defaults.
  - Deduction: `-5 pts`
* **Missing Permissions-Policy**
  - Severity: `LOW`
  - OWASP Mapping: `A05:2021-Security Misconfiguration`
  - Confidence Level: `High Confidence`
  - Inspected Header: `Permissions-Policy`
  - Inspected Value: `Absent`
  - Inspection Reason: The Permissions-Policy header was missing from the HTTP response, which allows the page to access browser APIs without restriction.
  - Deduction: `-5 pts`
* **Cookie Missing Secure Flag**
  - Severity: `MEDIUM`
  - OWASP Mapping: `A02:2021-Cryptographic Failures`
  - Confidence Level: `High Confidence`
  - Inspected Header: `Set-Cookie`
  - Inspected Value: `Cookies lacking Secure: ak_bmsc`
  - Inspection Reason: Cookies were transmitted over HTTPS but lacked the "Secure" flag, exposing them to clearance via plaintext HTTP.
  - Deduction: `-5 pts`

#### Risk Score Calculation:
- Base Score: `100`
- Deduction (Missing Content Security Policy (CSP)): `-15`
- Deduction (Missing Clickjacking Protection): `-10`
- Deduction (Missing MIME Sniffing Protection): `-5`
- Deduction (Missing Referrer-Policy): `-5`
- Deduction (Missing Permissions-Policy): `-5`
- Deduction (Cookie Missing Secure Flag): `-5`
- Final Score: `55`

---

## 🛠️ Audit Engine Refinement Strategy (Evidence Mode Active)
- **Direct Header Evidence Requirement**: Every single flagged finding now links directly to the specific header name and inspected value, enforcing strict non-repudiation.
- **Confidence Level Heuristic**: Findings now contain dynamic confidence ratings (High or Medium confidence) based on direct presence verification versus naming heuristic analysis (for cookies) or multi-host probing (for HSTS).
- **Evidence Summary Panel**: A metadata summary is calculated reporting total inspected, detected, and missing headers along with redirect outcomes.
- **Redirect Following Resolution**: The fetch pipeline follows 301/302 redirects and probes the final canonical endpoint.
- **Smart Cookie Inspection**: Evaluates HttpOnly exclusively on regex-matched session cookies parsed from getSetCookie().
- **Report-Only CSP Handling**: Grants partial score value for report-only mode instead of classifying CSP as completely missing.
