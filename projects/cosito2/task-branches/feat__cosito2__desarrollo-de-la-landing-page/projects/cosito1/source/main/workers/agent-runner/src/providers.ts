import { query } from '@anthropic-ai/claude-code'
import { execFileSync, execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import type { AgentTask } from './types'
import type { AgentConfig } from './agents'

const REPO_PATH = process.env.REPO_PATH ?? path.resolve(__dirname, '../../..')
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '')
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'
const OPENAI_CONTEXT_LIMIT = Number(process.env.OPENAI_CONTEXT_LIMIT ?? 25_000)
const OPENAI_MAX_FILES = Number(process.env.OPENAI_MAX_FILES ?? 6)
const OPENAI_FILE_BYTES_LIMIT = Number(process.env.OPENAI_FILE_BYTES_LIMIT ?? 12_000)

export type AgentProvider = 'claude' | 'openai'

export interface ProviderFailure {
  provider: AgentProvider
  code: 'quota_exceeded' | 'auth_missing' | 'config_missing' | 'provider_exit' | 'patch_apply_failed' | 'unknown'
  message: string
  retryable: boolean
}

export interface ProviderRunResult {
  ok: boolean
  provider: AgentProvider
  summary?: string
  failure?: ProviderFailure
}

interface OpenAIFileEdit {
  path: string
  content?: string
  delete?: boolean
}

export function getPrimaryProvider(): AgentProvider {
  return normalizeProvider(process.env.AGENT_PRIMARY_PROVIDER, 'claude')
}

export function getFallbackProvider(): AgentProvider | null {
  if ((process.env.ENABLE_PROVIDER_FALLBACK ?? 'true') === 'false') return null
  const fallback = normalizeProvider(process.env.AGENT_FALLBACK_PROVIDER, 'openai')
  return fallback === getPrimaryProvider() ? null : fallback
}

export function shouldFallback(failure: ProviderFailure): boolean {
  return failure.code === 'quota_exceeded'
    || failure.code === 'auth_missing'
    || failure.code === 'config_missing'
    || (failure.provider === 'claude' && failure.code === 'provider_exit')
}

export async function runWithProvider(
  provider: AgentProvider,
  task: AgentTask,
  prompt: string,
  config: AgentConfig,
): Promise<ProviderRunResult> {
  switch (provider) {
    case 'claude':
      return runWithClaude(task, prompt, config)
    case 'openai':
      return runWithOpenAI(task, prompt, config)
    default:
      return {
        ok: false,
        provider: 'claude',
        failure: {
          provider: 'claude',
          code: 'config_missing',
          message: `Unsupported provider: ${String(provider)}`,
          retryable: false,
        },
      }
  }
}

async function runWithClaude(
  task: AgentTask,
  prompt: string,
  config: AgentConfig,
): Promise<ProviderRunResult> {
  let success = false
  let lastError = ''
  let summary = ''

  try {
    for await (const message of query({
      prompt,
      options: {
        cwd: REPO_PATH,
        maxTurns: config.maxTurns,
        permissionMode: 'acceptEdits',
        allowedTools: config.allowedTools,
        ...(config.model ? { model: config.model } : {}),
      },
    })) {
      if (message.type === 'assistant') {
        process.stdout.write('.')
        if ('message' in message && typeof message.message?.content?.[0]?.text === 'string') {
          summary = message.message.content[0].text.trim()
        }
      }
      if (message.type === 'result') {
        success = !message.is_error
        if (message.is_error) lastError = message.subtype ?? summary ?? 'unknown error'
      }
    }

    process.stdout.write('\n')

    if (success) {
      return { ok: true, provider: 'claude', summary }
    }

    return {
      ok: false,
      provider: 'claude',
      failure: classifyFailure('claude', lastError || 'Claude agent reported failure'),
    }
  } catch (err) {
    return {
      ok: false,
      provider: 'claude',
      failure: classifyFailure('claude', stringifyError(err)),
    }
  }
}

async function runWithOpenAI(
  task: AgentTask,
  prompt: string,
  config: AgentConfig,
): Promise<ProviderRunResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      provider: 'openai',
      failure: {
        provider: 'openai',
        code: 'config_missing',
        message: 'OPENAI_API_KEY is not configured',
        retryable: false,
      },
    }
  }

  const context = collectRepoContext(config.allowedPaths)
  const system = [
    'You are a senior software engineer working inside the NitroCircus monorepo.',
    'Return strictly valid JSON.',
    'Prefer returning `files`, an array of full-file edits rooted at repository root.',
    'Each file edit must be { "path": "...", "content": "..." } or { "path": "...", "delete": true }.',
    'Only use `patch` as a fallback if you cannot express the change with `files`.',
    'Modify only files that match the allowed paths.',
    'Do not include markdown fences.',
    'If no safe change is possible, return {"summary":"...","commitMessage":"...","files":[],"patch":"","blockedReason":"..."}',
  ].join(' ')

  const user = [
    `Task metadata: ${JSON.stringify({
      taskId: task.taskId,
      project: task.projectName,
      epic: task.epicTitle,
      title: task.title,
      acceptanceCriteria: task.acceptanceCriteria,
      allowedPaths: config.allowedPaths,
    })}`,
    '',
    'Execution instructions:',
    prompt,
    '',
    'Repository context:',
    context,
  ].join('\n')

  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  }).catch((err) => {
    throw classifyFailure('openai', stringifyError(err))
  })

  if (!res.ok) {
    const text = await safeText(res)
    return {
      ok: false,
      provider: 'openai',
      failure: classifyFailure('openai', `OpenAI API ${res.status}: ${text}`),
    }
  }

  const raw = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = raw.choices?.[0]?.message?.content?.trim()
  if (!content) {
    return {
      ok: false,
      provider: 'openai',
      failure: {
        provider: 'openai',
        code: 'unknown',
        message: 'OpenAI returned an empty response',
        retryable: true,
      },
    }
  }

  let parsed: {
    summary?: string
    commitMessage?: string
    patch?: string
    files?: OpenAIFileEdit[]
    blockedReason?: string
  }
  try {
    parsed = JSON.parse(content) as {
      summary?: string
      commitMessage?: string
      patch?: string
      files?: OpenAIFileEdit[]
      blockedReason?: string
    }
  } catch (err) {
    return {
      ok: false,
      provider: 'openai',
      failure: {
        provider: 'openai',
        code: 'unknown',
        message: `Invalid OpenAI JSON payload: ${stringifyError(err)}`,
        retryable: true,
      },
    }
  }

  const files = Array.isArray(parsed.files) ? parsed.files : []
  if (files.length > 0) {
    try {
      applyFileEdits(files, config.allowedPaths)
      return {
        ok: true,
        provider: 'openai',
        summary: parsed.summary?.trim() || 'Fallback OpenAI file edits applied',
      }
    } catch (err) {
      return {
        ok: false,
        provider: 'openai',
        failure: {
          provider: 'openai',
          code: 'patch_apply_failed',
          message: stringifyError(err),
          retryable: false,
        },
      }
    }
  }

  const patch = parsed.patch?.trim() ?? ''
  if (!patch) {
    return {
      ok: false,
      provider: 'openai',
      failure: {
        provider: 'openai',
        code: 'patch_apply_failed',
        message: parsed.blockedReason?.trim() || 'OpenAI returned no patch to apply',
        retryable: false,
      },
    }
  }

  try {
    applyUnifiedDiff(patch)
    return {
      ok: true,
      provider: 'openai',
      summary: parsed.summary?.trim() || 'Fallback OpenAI patch applied',
    }
  } catch (err) {
    return {
      ok: false,
      provider: 'openai',
      failure: {
        provider: 'openai',
        code: 'patch_apply_failed',
        message: stringifyError(err),
        retryable: false,
      },
    }
  }
}

export function classifyFailure(provider: AgentProvider, message: string): ProviderFailure {
  const normalized = message.toLowerCase()
  if (normalized.includes('openai_api_key is not configured')) {
    return { provider, code: 'config_missing', message, retryable: false }
  }
  if (
    normalized.includes('spending cap') ||
    normalized.includes('hit your limit') ||
    normalized.includes('quota') ||
    normalized.includes('rate limit')
  ) {
    return { provider, code: 'quota_exceeded', message, retryable: true }
  }
  if (
    normalized.includes('api key') ||
    normalized.includes('unauthorized') ||
    normalized.includes('forbidden') ||
    normalized.includes('login') ||
    normalized.includes('auth')
  ) {
    return { provider, code: 'auth_missing', message, retryable: false }
  }
  if (normalized.includes('patch')) {
    return { provider, code: 'patch_apply_failed', message, retryable: false }
  }
  if (normalized.includes('exited with code')) {
    return { provider, code: 'provider_exit', message, retryable: true }
  }
  return { provider, code: 'unknown', message, retryable: true }
}

function normalizeProvider(raw: string | undefined, fallback: AgentProvider): AgentProvider {
  return raw === 'claude' || raw === 'openai' ? raw : fallback
}

function collectRepoContext(allowedPaths: string[]): string {
  const roots = [...new Set(allowedPaths.map((pattern) => pattern.replace(/\/\*\*$/, '')))]
  const snippets: string[] = []
  let size = 0
  let filesIncluded = 0

  for (const root of roots) {
    const files = listTrackedFiles(root)
    for (const relPath of files) {
      if (filesIncluded >= OPENAI_MAX_FILES) return snippets.join('\n')
      const absPath = path.join(REPO_PATH, relPath)
      if (!fs.existsSync(absPath)) continue
      const stat = fs.statSync(absPath)
      if (!stat.isFile() || stat.size > OPENAI_FILE_BYTES_LIMIT) continue
      const text = fs.readFileSync(absPath, 'utf8').slice(0, OPENAI_FILE_BYTES_LIMIT)
      const chunk = `FILE ${relPath}\n${text}\n`
      if (size + chunk.length > OPENAI_CONTEXT_LIMIT) return snippets.join('\n')
      snippets.push(chunk)
      size += chunk.length
      filesIncluded += 1
    }
  }

  return snippets.join('\n')
}

function listTrackedFiles(root: string): string[] {
  try {
    const output = execFileSync('git', ['-C', REPO_PATH, 'ls-files', root], { encoding: 'utf8' })
    return output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .sort((a, b) => filePriority(a) - filePriority(b) || a.length - b.length || a.localeCompare(b))
  } catch {
    return []
  }
}

function filePriority(relPath: string): number {
  if (relPath.endsWith('/package.json') || relPath === 'package.json') return 0
  if (relPath.endsWith('/tsconfig.json') || relPath === 'tsconfig.json') return 1
  if (relPath.endsWith('.ts') || relPath.endsWith('.tsx')) return 2
  if (relPath.endsWith('.js') || relPath.endsWith('.jsx')) return 3
  if (relPath.endsWith('.json')) return 4
  if (relPath.endsWith('.css')) return 5
  if (relPath.endsWith('.md')) return 6
  return 7
}

function applyUnifiedDiff(patch: string): void {
  const tmpPath = path.join(os.tmpdir(), `nitrocircus-openai-${Date.now()}.patch`)
  fs.writeFileSync(tmpPath, patch, 'utf8')
  try {
    execSync(`git -C "${REPO_PATH}" apply --whitespace=nowarn "${tmpPath}"`, { stdio: 'pipe' })
  } catch {
    execSync(`git -C "${REPO_PATH}" apply --3way --whitespace=nowarn "${tmpPath}"`, { stdio: 'pipe' })
  } finally {
    fs.unlinkSync(tmpPath)
  }
}

function applyFileEdits(edits: OpenAIFileEdit[], allowedPaths: string[]): void {
  for (const edit of edits) {
    const relPath = normalizeRelativePath(edit.path)
    if (!relPath) throw new Error('File edit is missing a valid path')
    if (!isAllowedPath(relPath, allowedPaths)) {
      throw new Error(`Fallback tried to modify disallowed path: ${relPath}`)
    }

    const absPath = path.join(REPO_PATH, relPath)
    if (!absPath.startsWith(`${REPO_PATH}${path.sep}`) && absPath !== path.join(REPO_PATH, relPath)) {
      throw new Error(`Resolved path escapes repository root: ${relPath}`)
    }

    if (edit.delete) {
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath)
      continue
    }

    if (typeof edit.content !== 'string') {
      throw new Error(`Fallback file edit for ${relPath} is missing content`)
    }

    fs.mkdirSync(path.dirname(absPath), { recursive: true })
    fs.writeFileSync(absPath, edit.content, 'utf8')
  }
}

function normalizeRelativePath(rawPath: string | undefined): string | null {
  if (!rawPath) return null
  const normalized = rawPath.replace(/\\/g, '/').replace(/^\.?\//, '')
  if (!normalized || normalized.startsWith('..') || normalized.includes('/../')) return null
  return normalized
}

function isAllowedPath(relPath: string, allowedPaths: string[]): boolean {
  return allowedPaths.some((pattern) => {
    const prefix = pattern.replace(/\/\*\*$/, '')
    return relPath === prefix || relPath.startsWith(`${prefix}/`)
  })
}

function stringifyError(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  return String(err)
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 400)
  } catch {
    return '<unavailable>'
  }
}
