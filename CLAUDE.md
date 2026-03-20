# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is NitroCircus

NitroCircus is a multi-agent orchestration system for software development. A Product Owner issues commands via Telegram; a PM Agent plans and decomposes work; specialized agents (Frontend, Backend, DevOps) execute within defined boundaries. The system enforces explicit authorization before any development begins.

**Critical rule**: Planning ≠ Execution. No agent starts development without an explicit `/start <project>` command from the Product Owner via Telegram.

## Current Status

The repository is in **Phase 0 (Foundation)**. All content is documentation — no implementation code exists yet. Phase 1 will introduce the Orchestrator API, Telegram bot, and MongoDB/Redis setup.

## Architecture

5-layer model (see `docs/ARCHITECTURE.md`):

1. **Telegram Bot Gateway** — Product Owner interface
2. **Orchestrator API** — Central state machine and event hub
3. **Execution Agents** — PM, Frontend, Backend, DevOps agents
4. **Persistence & Queue** — MongoDB (state/audit) + Redis (queues/locks)
5. **Visualization** — Miniverse integration (non-critical)

**State machine**: `backlog → planned → assigned → awaiting_start_approval → in_progress → blocked/in_review → done → delivered`

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify or NestJS (decision pending)
- **Databases**: MongoDB + Redis
- **Infrastructure**: Linode VPS, Docker Compose, GitHub Actions
- **LLM assignments**: GPT-5.4 Thinking (PM), Claude Sonnet 4.6 (Frontend), Claude Opus 4.6 (Backend), Codex/GPT-5.3 (DevOps)

## Agent File Ownership

| Path | Owning Agent |
|------|-------------|
| `apps/web/**` | Frontend |
| `apps/api/**`, `workers/**` | Backend |
| `.github/**`, `infra/**`, `docker/**`, `deploy/**` | DevOps |
| `docs/**`, GitHub issues/board | PM |
| `projects/<name>/` | Delivery output (read-only after delivery) |

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

> Commands will be added here as implementation progresses through the roadmap phases.
