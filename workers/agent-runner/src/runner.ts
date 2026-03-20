import { query } from '@anthropic-ai/claude-code'
import { execSync } from 'child_process'
import path from 'path'
import type { AgentTask } from './types'
import { AGENT_CONFIGS } from './agents'
import { notifyTaskState, emitMiniverse } from './notify'

const REPO_PATH = process.env.REPO_PATH ?? path.resolve(__dirname, '../../../..')

export async function runAgent(task: AgentTask): Promise<void> {
  const config = AGENT_CONFIGS[task.agentType]
  const branch = task.githubBranch ??
    (task.taskType === 'deploy'
      ? `ops/${slugify(task.projectName)}/ci-cd`
      : buildBranchName(task.projectName, task.title))

  // Ensure we're on the right branch
  try {
    execSync(`git -C "${REPO_PATH}" checkout -B "${branch}"`, { stdio: 'pipe' })
  } catch {
    execSync(`git -C "${REPO_PATH}" checkout -b "${branch}"`, { stdio: 'pipe' })
  }

  const prompt = task.taskType === 'deploy'
    ? buildDeployPrompt(task)
    : buildPrompt(task, config.allowedPaths)

  console.log(`[runner] Starting ${task.agentType} agent for task ${task.taskId}`)
  emitMiniverse('agent.online', task.agentType, task.projectName, task.title)

  let success = false
  let lastError = ''

  try {
    emitMiniverse('agent.thinking', task.agentType, task.projectName, task.title)
    for await (const message of query({
      prompt,
      abortController: new AbortController(),
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
        emitMiniverse('agent.coding', task.agentType, task.projectName, task.title)
      }
      if (message.type === 'result') {
        success = !message.is_error
        if (message.is_error) lastError = String(message.result)
      }
    }

    process.stdout.write('\n')

    if (success) {
      // Commit any uncommitted changes
      try {
        execSync(`git -C "${REPO_PATH}" add -A`, { stdio: 'pipe' })
        execSync(
          `git -C "${REPO_PATH}" commit -m "feat(${task.agentType}): ${task.title.slice(0, 60)}" --allow-empty`,
          { stdio: 'pipe' },
        )
        execSync(`git -C "${REPO_PATH}" push -u origin "${branch}"`, { stdio: 'pipe' })
        console.log(`[runner] Pushed branch ${branch}`)
      } catch (gitErr) {
        console.warn('[runner] Git push warning:', String(gitErr).slice(0, 200))
      }

      emitMiniverse('agent.reviewing', task.agentType, task.projectName, task.title)
      await notifyTaskState(task.taskId, 'in_review')
      console.log(`[runner] Task ${task.taskId} → in_review`)
    } else {
      console.error(`[runner] Agent reported failure: ${lastError}`)
      emitMiniverse('agent.blocked', task.agentType, task.projectName, task.title)
      await notifyTaskState(task.taskId, 'blocked')
    }
  } catch (err) {
    console.error(`[runner] Unexpected error for ${task.taskId}:`, err)
    emitMiniverse('agent.blocked', task.agentType, task.projectName, task.title)
    await notifyTaskState(task.taskId, 'blocked')
  }
}

function buildPrompt(task: AgentTask, allowedPaths: string[]): string {
  return [
    `Eres el ${task.agentType} agent de NitroCircus.`,
    ``,
    `Proyecto: ${task.projectName}`,
    `Épica: ${task.epicTitle}`,
    `Tarea: ${task.title}`,
    ``,
    `Descripción:`,
    task.description,
    ``,
    `Criterios de aceptación:`,
    ...(task.acceptanceCriteria ?? []).map((c) => `- ${c}`),
    ``,
    `Paths donde puedes escribir:`,
    ...allowedPaths.map((p) => `- ${p}`),
    ``,
    `Implementa la tarea completamente y haz commit de los cambios.`,
    `Cuando termines, resume en una línea qué hiciste.`,
  ].join('\n')
}

function buildDeployPrompt(task: AgentTask): string {
  const slug = slugify(task.projectName)

  const secretPrefix = `DEPLOY_${slug.toUpperCase().replace(/-/g, '_')}`

  return [
    `Eres el DevOps Agent de NitroCircus. Debes configurar el despliegue en producción del proyecto "${task.projectName}" en un servidor Linode.`,
    ``,
    `## Datos del servidor`,
    `- IP: ${task.serverIp}`,
    `- Usuario SSH: ${task.sshUser}`,
    `- Contraseña SSH: ${task.sshPass}`,
    task.domain ? `- Dominio: ${task.domain}` : `- Dominio: no configurado`,
    ``,
    `## Pasos que debes ejecutar`,
    ``,
    `### 1. Configurar GitHub Secrets`,
    `Usa el CLI \`gh\` para establecer los siguientes secrets en el repositorio:`,
    `- \`${secretPrefix}_HOST\` = ${task.serverIp}`,
    `- \`${secretPrefix}_USER\` = ${task.sshUser}`,
    `- \`${secretPrefix}_PASS\` = ${task.sshPass}`,
    task.domain ? `- \`${secretPrefix}_DOMAIN\` = ${task.domain}` : '',
    ``,
    `Comandos a ejecutar (en el directorio del repo):`,
    `\`\`\`bash`,
    `gh secret set ${secretPrefix}_HOST --body "${task.serverIp}"`,
    `gh secret set ${secretPrefix}_USER --body "${task.sshUser}"`,
    `gh secret set ${secretPrefix}_PASS --body "${task.sshPass}"`,
    task.domain ? `gh secret set ${secretPrefix}_DOMAIN --body "${task.domain}"` : '',
    `\`\`\``,
    ``,
    `### 2. Crear GitHub Actions workflow`,
    `Crea el archivo \`.github/workflows/deploy-${slug}.yml\` con:`,
    `- Trigger: push a la rama \`main\``,
    `- Job: conectarse al servidor via SSH usando \`appleboy/ssh-action@v1\``,
    `- Steps en el servidor:`,
    `  1. \`cd /opt/${slug}\``,
    `  2. \`git pull origin main\``,
    `  3. \`docker compose -f docker-compose.prod.yml up -d --build\``,
    `- Usar los secrets \`${secretPrefix}_HOST\`, \`${secretPrefix}_USER\`, \`${secretPrefix}_PASS\``,
    ``,
    `### 3. Crear archivos de infraestructura`,
    `Crea \`deploy/${slug}/docker-compose.prod.yml\` con:`,
    `- Configuración de producción (sin volúmenes de desarrollo, con restart: always)`,
    `- Variables de entorno via \`env_file: .env.prod\``,
    ``,
    `Crea \`deploy/${slug}/setup.sh\` con el script de bootstrap inicial del servidor:`,
    `- Instalar Docker y Docker Compose`,
    `- Clonar el repositorio en \`/opt/${slug}\``,
    `- Configurar permisos`,
    ``,
    task.domain ? [
      `### 4. Configurar Nginx para el dominio`,
      `Crea \`deploy/${slug}/nginx.conf\` con configuración de reverse proxy para ${task.domain}`,
      `apuntando al puerto del contenedor de la app.`,
    ].join('\n') : '',
    ``,
    `## Reglas`,
    `- NO hardcodees contraseñas ni IPs en archivos commitados — usa siempre los secrets de GitHub`,
    `- Todos los archivos van en \`.github/\` o \`deploy/${slug}/\` exclusivamente`,
    `- Después de crear los archivos, haz commit y push con mensaje: "ops(${slug}): configure CI/CD deployment"`,
    `- Resume en una línea qué configuraste al terminar`,
  ].filter((l) => l !== undefined).join('\n')
}

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

function buildBranchName(projectName: string, taskTitle: string): string {
  return `feat/${slugify(projectName)}/${slugify(taskTitle)}`
}
