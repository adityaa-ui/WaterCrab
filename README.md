# WaterCrab 🦀

WaterCrab is a scalable, distributed web scraping and structured extraction service. It renders JavaScript-heavy websites using a headless browser microservice, cleans boilerplate/ads from the document tree, converts cleaned elements to Markdown, and uses LLMs (OpenAI & Anthropic) in a Bring Your Own Key (BYOK) pipeline to extract custom structured data. It also supports asynchronous multi-page crawling powered by Redis and BullMQ.

---

## 🏗️ System Architecture

```mermaid
graph TD
    User([User's Browser]) -->|HTTP| Frontend[Next.js Frontend - Vercel]
    Frontend -->|HTTP /scrape, /extract, /crawl| API[Express API Service - Render]
    
    subgraph Backend Microservices
        API -->|HTTP /render| BrowserService[Browser Service Playwright - Render]
        API -->|Enqueue Job| RedisQueue[(Redis Queue & DB)]
        Worker[BullMQ Background Worker] -->|Fetch Job| RedisQueue
        Worker -->|HTTP /render| BrowserService
        Worker -->|Update Status / Save Results| RedisQueue
    end
    
    subgraph External APIs
        API -->|LLM extraction request| LLM[OpenAI / Anthropic APIs]
    end
```

---

## 📁 Project Structure

```
WaterCrab/
├── backend/                  # Express API Server & BullMQ Worker
│   ├── src/
│   │   ├── index.js          # REST API endpoints (/scrape, /extract, /crawl)
│   │   ├── worker.js         # BullMQ queue runner entrypoint
│   │   ├── worker-processor.js # Multi-page recursive crawl runner
│   │   ├── queue.js          # BullMQ queue manager (with in-memory fallback)
│   │   └── db.js             # Data Layer (Redis / Local JSON-file fallback)
│   ├── Dockerfile.api        # Docker container definition for API
│   ├── Dockerfile.worker     # Docker container definition for Worker
│   └── package.json
├── browser-service/          # Standalone Headless Rendering Service
│   ├── src/
│   │   └── index.js          # Express app wrapping Playwright Chromium
│   ├── Dockerfile            # Docker container definition for Browser Service
│   └── package.json
├── frontend/                 # Interactive Next.js Dashboard UI
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx      # Main application page (Form & Results view)
│   │       └── layout.tsx    # Layout and metadata configurations
│   └── package.json
├── docker-compose.yml        # Orchestration script for local multi-service running
└── render.yaml               # Infrastructure-as-code Blueprint deployment for Render
```

---

## 🚀 Quickstart: Local Development

### Option A: Run with Docker (Recommended)
This is the easiest way to launch the entire environment (API, worker, browser rendering service, and Redis instance).

1. Make sure you have Docker installed and running.
2. From the root directory, run:
   ```bash
   docker-compose up --build
   ```
3. Open your browser to `http://localhost:3000` to access the dashboard.

### Option B: Run without Docker (Node.js)
If you don't have Redis or Docker installed, the services will automatically fall back to **in-memory & local file systems** (`jobs.json`) to manage tasks, allowing you to test everything instantly.

1. **Start the Browser Service:**
   ```bash
   cd browser-service
   npm install
   npx playwright install chromium
   npm run start
   ```
   *Runs on `http://localhost:3002`.*

2. **Start the Backend API:**
   ```bash
   cd ../backend
   npm install
   npm run start
   ```
   *Runs on `http://localhost:3001`.*

3. **Start the Frontend Dashboard:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   *Runs on `http://localhost:3000`.*

---

## 🚀 Production Deployment

### 1. Backend (Render)
Deploying the backend microservices to Render is fully automated using our **Render Blueprint** (`render.yaml`).

1. Push this repository to your GitHub account.
2. In the Render Dashboard, click **New** -> **Blueprint**.
3. Select your repository.
4. Render will parse `render.yaml` and provision:
   - A Redis instance (`watercrab-redis`)
   - The Playwright rendering microservice (`watercrab-browser`)
   - The Express API (`watercrab-api`)
   - The background task runner (`watercrab-worker`)
5. All environment variables and secure internal networking will be configured automatically.

### 2. Frontend (Vercel)
1. In the Vercel Dashboard, click **Add New** -> **Project**.
2. Import this repository.
3. Configure the Root Directory to `frontend`.
4. Add the following Environment Variable:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed `watercrab-api` on Render (e.g. `https://watercrab-api.onrender.com`).
5. Click **Deploy**.

---

## 🛡️ Security Policy (BYOK)
WaterCrab prioritizes user privacy. When performing LLM-guided structured extraction, the user supplies their own API Key.
- Keys are sent directly over secure HTTPS transport to the `/extract` endpoint.
- Keys are **never** persisted to databases.
- Keys are automatically redacted and masked from all backend application logs and error response payloads using dedicated sanitizer utilities.

---

## 🛡️ Security Hardening & Configuration

### Internal token (`INTERNAL_TOKEN`)
The browser rendering service (`/render`) is a shared, internal endpoint that fetches
arbitrary URLs with a headless browser. It is now protected by a shared secret and is
**not** exposed to the public internet.

- The API and the worker send `x-internal-token: <INTERNAL_TOKEN>` on every call to
  `/render`. The browser service rejects requests without the correct token (401),
  using a constant-time comparison. If `INTERNAL_TOKEN` is unset, the browser service
  **refuses to start** (fail-closed).
- The token must be set **via environment variables only** — never hardcoded or committed.

Generate a token locally (e.g. 64 random hex chars):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set it in both `backend/.env` and `browser-service/.env` (both are gitignored):

```dotenv
INTERNAL_TOKEN=<paste the generated value>
```

> For Docker Compose, export `INTERNAL_TOKEN` in your shell and run
> `docker-compose up --build`; the services fail-fast if it is missing.
> For Render, set `INTERNAL_TOKEN` on the **browser**, **api**, and **worker**
> services in the dashboard — all three must match. It is declared with
> `sync: false` in `render.yaml` so it stays out of the repo.

### SSRF protection
- The browser service only accepts `http:`/`https:` URLs with no embedded credentials,
  and blocks IP literals / DNS results in private, loopback, link-local, CGNAT,
  reserved, multicast, cloud-metadata (`169.254.169.254`), IPv6-mapped, IPv4-compatible,
  and NAT64 ranges (including IPv4-mapped `::ffff:127.0.0.1` and NAT64 `64:ff9b::…`).
- It re-checks the **final** URL after navigation to catch redirects to internal hosts.
- The backend applies a cheap fail-fast URL pre-check before forwarding.

### Rate limiting
The backend applies per-route, per-IP rate limits (defaults in requests/minute):

| Route | Default limit | Env override |
|-------|---------------|--------------|
| `POST /scrape` | 60 | `RATE_LIMIT_SCRAPE` |
| `POST /extract` | 30 | `RATE_LIMIT_EXTRACT` |
| `POST /crawl` | 10 | `RATE_LIMIT_CRAWL` |
| `GET /jobs/:id` | 120 | `RATE_LIMIT_JOBS` |

The shared window is `RATE_LIMIT_WINDOW_MS` (default `60000`). Responses include
standard `RateLimit`/`RateLimit-Policy` headers and a `429 { success, error }` body.

### Trust proxy (`TRUST_PROXY`)
`trust proxy` defaults to `loopback`, which is correct for local development and
docker-compose (no external proxy). When deployed behind a TLS-terminating proxy that
injects `X-Forwarded-For` — common in Render — set `TRUST_PROXY=1` so rate limiting
keys by the real client IP rather than the proxy's.

### Running the tests
Zero extra test dependencies (uses Node's built-in test runner):

```bash
cd backend          && npm test
cd browser-service  && npm test
```

