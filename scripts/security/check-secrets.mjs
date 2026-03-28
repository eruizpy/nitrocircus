#!/usr/bin/env node

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

const EXCLUDED_PREFIXES = [
  '.git/',
  'node_modules/',
  'projects/',
  'deploy/',
]

const EXCLUDED_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.env.example',
])

const SECRET_PATTERNS = [
  { name: 'GitHub PAT', re: /\bghp_[A-Za-z0-9]{20,}\b/g },
  { name: 'Groq API key', re: /\bgsk_[A-Za-z0-9]{20,}\b/g },
  { name: 'OpenAI key', re: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { name: 'Telegram bot token', re: /\b\d{7,10}:[A-Za-z0-9_-]{30,}\b/g },
  { name: 'Generic password assignment', re: /\b(PASSWORD|PASS|TOKEN|API_KEY|SECRET)\s*=\s*['"]?[A-Za-z0-9_\-]{16,}/gi },
]

function listTrackedFiles() {
  const out = execSync('git ls-files', { encoding: 'utf8' })
  return out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((file) => !EXCLUDED_FILES.has(path.basename(file)))
    .filter((file) => !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)))
}

function scanFile(file) {
  const abs = path.join(ROOT, file)
  const content = fs.readFileSync(abs, 'utf8')
  const findings = []

  for (const p of SECRET_PATTERNS) {
    const match = p.re.exec(content)
    if (match) {
      const line = content.slice(0, match.index).split('\n').length
      findings.push({ type: p.name, line })
    }
    p.re.lastIndex = 0
  }

  return findings
}

const files = listTrackedFiles()
const problems = []

for (const file of files) {
  const findings = scanFile(file)
  for (const f of findings) {
    problems.push(`${file}:${f.line} -> ${f.type}`)
  }
}

if (problems.length > 0) {
  console.error('Secret scan failed. Possible credentials detected:')
  for (const p of problems) console.error(`- ${p}`)
  process.exit(1)
}

console.log('Secret scan passed: no obvious credentials detected in tracked files.')
