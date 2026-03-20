import type { Task } from '@nitrocircus/shared'
import type { Project } from '@nitrocircus/shared'
import { getRedis } from '../db/redis'
import { logEvent } from './event-log'

const QUEUE_PREFIX = 'queue'

export interface DeployConfig {
  serverIp: string
  sshUser: string
  sshPass: string
  domain?: string
}

// ── Main runner ───────────────────────────────────────────────────────────────

export async function runAgent(
  task: Task,
  project: Project,
  epicTitle = 'Sin épica',
): Promise<void> {
  const agentType = task.assignedAgent
  if (!agentType || agentType === 'pm') return

  const queue = `${QUEUE_PREFIX}:${agentType}`

  const payload = {
    taskId: task.id,
    projectId: project.id,
    projectName: project.name,
    agentType,
    title: task.title,
    description: task.description,
    acceptanceCriteria: task.acceptanceCriteria ?? [],
    epicTitle,
    githubIssueNumber: task.githubIssueNumber,
    githubBranch: task.githubBranch,
  }

  await getRedis().lpush(queue, JSON.stringify(payload))

  await logEvent({
    entityType: 'task',
    entityId: task.id,
    event: 'agent.queued',
    actorType: agentType,
    metadata: { projectId: project.id, queue },
  })
}

export async function queueDeployTask(project: Project, config: DeployConfig): Promise<void> {
  const payload = {
    taskId: `deploy-${project.id}`,
    projectId: project.id,
    projectName: project.name,
    agentType: 'devops' as const,
    taskType: 'deploy' as const,
    title: `Deploy ${project.name} to Linode`,
    description: `Configure CI/CD and deploy ${project.name} to production server.`,
    acceptanceCriteria: [
      'GitHub Actions workflow created and functional',
      'SSH deployment scripts configured',
      'GitHub secrets set for server credentials',
      ...(config.domain ? [`Domain ${config.domain} configured`] : []),
    ],
    epicTitle: 'Deployment',
    serverIp: config.serverIp,
    sshUser: config.sshUser,
    sshPass: config.sshPass,
    domain: config.domain,
  }

  await getRedis().lpush('queue:devops', JSON.stringify(payload))

  await logEvent({
    entityType: 'project',
    entityId: project.id,
    event: 'project.deploy_queued',
    actorType: 'system',
    metadata: { serverIp: config.serverIp, domain: config.domain },
  })
}
