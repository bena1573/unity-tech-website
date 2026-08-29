# Unity Tech AI Business Consultant — Backend

A small, real Express backend that powers the AI widget on the Unity Tech
website. It streams responses from a real LLM (Claude or GPT-4o-mini),
grounded in Unity Tech's actual services/pricing/portfolio/FAQ content via
a lightweight RAG (Retrieval-Augmented Generation) pipeline — no vector
database required.

## What's actually in here

- `server.js` — Express app: CORS, rate limiting, logging, routes
- `routes/chat.js` — RAG retrieval + streaming chat completion (SSE)
- `routes/lead.js` — lead capture endpoint
- `lib/rag.js` — keyword/BM25-style retrieval over `knowledge/*.json`
- `lib/llm.js` — provider-agnostic streaming client (Anthropic or OpenAI)
- `lib/prompt.js` — the AI Business Consultant system prompt
- `lib/logger.js` — structured JSON logging (console + local file)
- `lib/leads.js` — appends captured leads to `logs/leads.jsonl`
- `knowledge/*.json` — the actual Unity Tech content the AI is grounded in

## Why not a vector database?

For a knowledge base this size (services, ~8 case studies, FAQs, pricing),
embeddings + a vector DB is overkill and adds a paid API call + hosted
infra just to retrieve documents. The keyword-based retriever in
`lib/rag.js` does the same job — grounding the LLM in real content instead
of letting it improvise — for free and with zero extra infrastructure.
If your knowledge base grows to hundreds of documents, swap `retrieve()`
in `lib/rag.js` for an embeddings + vector store lookup; nothing else in
the pipeline needs to change.

## 1. Install

```bash
cd ai-backend
npm install
```

## 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:
- Get an API key from console.anthropic.com (Claude) or platform.openai.com (GPT).
- Set `LLM_PROVIDER` to match, and paste the key.
- Set `ALLOWED_ORIGINS` to your real website domain once deployed.

## 3. Run locally

```bash
npm start
```

Health check: `http://localhost:8787/api/health`

## 4. Point the frontend at it

In `js/app.js`, find `AI_BACKEND_URL` near the top of the AI Assistant
section and set it to your backend's URL:

```js
const AI_BACKEND_URL = 'http://localhost:8787/api'; // change to your deployed URL
```

If this URL is unreachable (e.g. you haven't deployed yet), the widget
automatically falls back to the built-in rule-based assistant so the site
never shows a broken feature.

## 5. Deploy (pick one — all have generous free tiers)

**Render.com** — New → Web Service → point at this folder. Build: `npm install`. Start: `npm start`. Add your `.env` values as dashboard environment variables.

**Railway.app** — New Project → deploy from folder/repo. Add environment variables in the dashboard. Auto-detects `npm start`.

**Vercel** — Vercel's serverless functions don't support long-lived SSE the same way a regular Node server does; Render or Railway are a simpler fit for this streaming use case as-is.

After deploying, update `AI_BACKEND_URL` in `js/app.js` to your live URL,
and `ALLOWED_ORIGINS` in the backend's environment variables to your real
site domain.

## Security notes

- API keys never touch the browser — they live only in this backend's environment.
- CORS restricts which origins can call the API.
- Rate limiting (default 8 messages/minute/IP) protects your LLM budget from abuse.
- Input length limits (max 4000 chars/message, max 40 messages/request) guard against oversized payloads.
- Leads and logs are written locally to `logs/` — treat that folder as containing personal data (don't commit it; `.gitignore` already excludes it).

## Extending it

- **Real CRM**: replace `saveLead()` in `lib/leads.js` with a call to HubSpot/Attio/your DB.
- **Human escalation**: wire a Slack/email webhook into `routes/lead.js` or a new `/api/escalate` route.
- **File/image understanding**: the frontend already uploads files; to have the LLM actually read them, extract text server-side (e.g. `pdf-parse` for PDFs) and append it to the RAG context, or pass images directly to a vision-capable model.
