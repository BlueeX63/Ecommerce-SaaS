# AI service

The only place in the platform that talks to an LLM provider. Python 3.11+, FastAPI, **LangGraph**
(`langchain-anthropic` for text, the OpenAI SDK for images and voice).

```
Browser ──► Node API (auth, plans, quotas, tenant data) ──► ai-service ──► Anthropic / OpenAI
                  ▲                                            │
                  └──── POST /internal/ai/tools/:name ◄────────┘   (store tools, per-request signed token)
```

The browser never reaches this service. The Node API authenticates to it with a shared bearer token, and the
service holds the only copy of the provider keys. It is stateless (conversation history arrives with each request),
so scale it by running more containers.

## What lives where

| Concern | Node API | ai-service |
| --- | --- | --- |
| Login, plans (`ai_tools` add-on), per-store daily quotas, rate limits | yes | no |
| Tenant data, tool execution (search products, add to cart), Cloudinary upload | yes | no |
| Prompts, models, LangGraph graphs, provider calls, prompt caching | no | yes |
| Provider keys | no | yes |

Store tools are defined once, in `backend/src/services/ai/store-tools.ts`. The API sends their schemas with each
request; the service only advertises them to the model and calls back to run them. The callback carries a token
the API signed for one store and one shopper (10 min, own JWT audience), so this service can never pick whose cart
a tool touches.

## Endpoints (all require `Authorization: Bearer $AI_SERVICE_TOKEN`, except `/healthz`)

| Route | Graph / function | Called for |
| --- | --- | --- |
| `POST /v1/chat/stream` (SSE) | `graphs/store_chat.py` — `agent` ⇄ `tools`, max 4 rounds | storefront assistant (`POST /api/v1/public/stores/:slug/ai/chat`) |
| `POST /v1/voice/session` | realtime client secret, pinned to the store's instructions and tools | `…/ai/voice-session` |
| `POST /v1/listing` | `graphs/listing.py` — `generate` → `validate`, one retry | `POST /api/v1/ai/product-listing` |
| `POST /v1/images/generate` | OpenAI image generation → PNG | `POST /api/v1/ai/product-image/generate` |
| `POST /v1/images/clean` | OpenAI image edit; body is the raw image bytes | `POST /api/v1/ai/product-image/clean` |
| `POST /v1/support/analyze` | `graphs/support.py` — `analyse` → `normalise` | order-help chat (`/orders/:id/support/messages`) |
| `GET /v1/status` | which providers have keys (booleans) | Super Admin → System |
| `GET /healthz` | liveness | container health check |

The voice agent's tool calls (`…/ai/tools/:name`) go from the browser straight to the Node API, as before.

## Run it

```bash
cd ai-service
python -m venv .venv && . .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                                  # set AI_SERVICE_TOKEN and the provider keys
uvicorn app.main:app --port 8000 --reload
pytest                                                # no API keys needed: a scripted model and a fake backend
```

Then in `backend/.env`:

```
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TOKEN=<same value as in ai-service/.env>
```

and move `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` (and the `AI_*_MODEL` overrides) from `backend/.env` to
`ai-service/.env`. While `AI_SERVICE_URL` is unset the AI endpoints answer 503 exactly as they did without keys, and
order help falls back to its rule-based mode.

Docker: `docker build -t monolith-ai ai-service && docker run -p 8000:8000 --env-file ai-service/.env monolith-ai`.
Keep it on a private network; the token is the only thing protecting `/v1`.

## Performance and cost

- Graphs are compiled once; clients (Anthropic, OpenAI, backend) are pooled and reused.
- Anthropic prompt caching is marked on the system prompt and on the (identical for every store) tool list.
- Lookups the model asks for in one turn run concurrently; cart changes run one at a time, in order.
- `MAX_CONCURRENT_TEXT` / `MAX_CONCURRENT_IMAGES` bound in-flight provider calls. Beyond that, requests wait up to
  `QUEUE_TIMEOUT_SECONDS` and then get a fast `503 BUSY` instead of piling up.
- Per-store daily spend limits stay in the Node API (`services/ai/quota.ts`); this service only protects itself.
- Streaming is cancelled end to end: closing the browser tab aborts the relay, which cancels the graph and the
  in-flight provider call.
