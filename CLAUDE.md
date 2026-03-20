# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is NitroCircus

NitroCircus is a multi-agent orchestration system for software development. A Product Owner issues commands via Telegram; a PM Agent plans and decomposes work; specialized agents (Frontend, Backend, DevOps) execute within defined boundaries. The system enforces explicit authorization before any development begins.

**Critical rule**: Planning ≠ Execution. No agent starts development without an explicit `/start <project>` command from the Product Owner via Telegram.

## Current Status

**Phase 2 — Execution Agents**. Core infrastructure is running: Orchestrator API (Fastify), Telegram Bot (grammY), PM Agent (Groq/Llama), GitHub integration (Issues + Projects v2). Execution agents (Frontend, Backend, DevOps) use Claude Code SDK to write real code.

## Architecture

5-layer model (see `docs/ARCHITECTURE.md`):

1. **Telegram Bot Gateway** — Product Owner interface (Docker)
2. **Orchestrator API** — Central state machine and event hub (Docker)
3. **Execution Agents** — PM Agent (Docker/Groq) + Claude Code agents (host process)
4. **Persistence & Queue** — MongoDB (state/audit) + Redis (queues/locks) (Docker)
5. **Visualization** — Miniverse integration (non-critical)

**State machine**: `backlog → planned → assigned → awaiting_start_approval → in_progress → blocked/in_review → done → delivered`

### Agent Worker (host process)

The execution agents (Frontend, Backend, DevOps) run as a **host process** (`workers/agent-runner`) — NOT in Docker — because they use the Claude Code SDK which requires the authenticated Claude Code Pro CLI.

```
Telegram → Bot → API → Redis queues → agent-runner (host) → writes code → git commit/PR
                  ↑                                        ↓
                  └──────── PATCH /tasks/:id/state ────────┘
```

Queues: `queue:frontend`, `queue:backend`, `queue:devops` (Redis LPUSH/BRPOP)

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify
- **Databases**: MongoDB + Redis
- **Infrastructure**: Linode VPS, Docker Compose, GitHub Actions
- **PM Agent LLM**: Groq (llama-3.3-70b-versatile) — free tier
- **Execution Agents**: Claude Code SDK (`@anthropic-ai/claude-code`) — Claude Code Pro auth

## Agent File Ownership

| Path | Owning Agent |
|------|-------------|
| `apps/web/**` | Frontend |
| `apps/api/**`, `workers/**` | Backend |
| `.github/**`, `infra/**`, `docker/**`, `deploy/**` | DevOps |
| `docs/**`, GitHub issues/board | PM |
| `projects/<name>/` | Delivery output (read-only after delivery) |

Each agent enforces its own path boundaries via the `allowedPaths` config in `workers/agent-runner/src/agents/`. Cross-path writes are denied by the Claude Code permission system.

## Git & GitHub Conventions

**Branch naming**: `feat/<project>/<task>`, `fix/<project>/<task>`, `docs/<topic>`, `ops/<topic>`

All changes go through PRs. GitHub Issues represent tasks created by the PM Agent. Labels encode: project, type, agent owner, status, priority.

## Key Documentation

| File | Contents |
|------|----------|
| `docs/ARCHITECTURE.md` | 5-layer architecture, component diagrams |
| `docs/AGENTS_AND_RESPONSIBILITIES.md` | Agent roles, tool allowlists, path restrictions |
| `docs/GITHUB_OPERATING_MODEL.md` | Issue/PR/label conventions |
| `docs/DELIVERY_AND_DEPLOYMENT_POLICY.md` | Delivery requirements, on-demand deploy flow |
| `docs/SECURITY_AND_GOVERNANCE.md` | Audit logging, secrets handling, governance |
| `docs/BACKLOG.md` | 33 ordered tasks across 10 epics |
| `docs/prompts/` | System prompts for each agent role |

## Development Commands

```bash
# First time setup
cp .env.example .env          # fill in secrets
npm install                   # install deps locally (for IDE support)

# Docker dev environment (API + Bot + MongoDB + Redis)
npm run dev                   # docker compose up --build (hot reload)
npm run dev:down              # stop containers
npm run dev:logs              # tail all logs
npm run dev:clean             # stop + delete volumes (fresh DB)

# Agent worker (runs on host, requires Claude Code Pro auth)
npm run agents                # start agent-runner (workers/agent-runner)
```

**Services exposed locally:**
- API: http://localhost:3000 (`GET /health` to verify)
- MongoDB: localhost:27017
- Redis: localhost:6379

**Hot reload**: source files in `apps/*/src/` and `packages/shared/src/` are volume-mounted; `tsx watch` picks up changes automatically without rebuilding the image.

**Agent worker**: runs outside Docker on the host. Requires `claude` CLI authenticated (`claude --version` to verify). Consumes Redis queues and uses Claude Code SDK to write code.
