export interface AgentConfig {
  allowedPaths: string[]
  allowedTools: string[]
  maxTurns: number
  model?: string
}

export const AGENT_CONFIGS: Record<'frontend' | 'backend' | 'devops', AgentConfig> = {
  frontend: {
    allowedPaths: ['apps/web/**'],
    allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    maxTurns: 20,
  },
  backend: {
    allowedPaths: ['apps/api/**', 'workers/**', 'packages/shared/**'],
    allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    maxTurns: 20,
  },
  devops: {
    allowedPaths: ['.github/**', 'infra/**', 'docker/**', 'deploy/**'],
    allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    maxTurns: 30,
    model: 'claude-sonnet-4-5',
  },
}
