import { execSync } from 'child_process'
import path from 'path'
import type { AgentTask } from './types'
import { AGENT_CONFIGS } from './agents'
import { notifyTaskState, emitNightCityVerse } from './notify'
import {
  getPrimaryProvider,
  getFallbackProvider,
  runWithProvider,
  shouldFallback,
} from './providers'

const REPO_PATH = process.env.REPO_PATH ?? path.resolve(__dirname, '../../..')

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
  emitNightCityVerse('agent.online', task.agentType, task.projectName, task.title)

  try {
    emitNightCityVerse('agent.thinking', task.agentType, task.projectName, task.title)
    emitNightCityVerse('agent.coding', task.agentType, task.projectName, task.title)
    const primaryProvider = getPrimaryProvider()
    let result = await runWithProvider(primaryProvider, task, prompt, config)

    if (!result.ok && result.failure && shouldFallback(result.failure)) {
      const fallbackProvider = getFallbackProvider()
      if (fallbackProvider) {
        console.warn(
          `[runner] ${primaryProvider} failed for ${task.taskId} with ${result.failure.code}; trying ${fallbackProvider}`,
        )
        result = await runWithProvider(fallbackProvider, task, prompt, config)
      }
    }

    if (result.ok) {
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

      emitNightCityVerse('agent.reviewing', task.agentType, task.projectName, task.title)
      await notifyTaskState(task.taskId, 'in_review', {
        provider: result.provider,
        summary: result.summary,
      })
      console.log(`[runner] Task ${task.taskId} → in_review`)
    } else {
      const message = result.failure?.message ?? 'Unknown provider error'
      const code = result.failure?.code ?? 'unknown'
      const provider = result.failure?.provider ?? primaryProvider
      console.error(`[runner] Agent reported failure [${provider}:${code}]: ${message}`)
      emitNightCityVerse('agent.blocked', task.agentType, task.projectName, task.title)
      await notifyTaskState(task.taskId, 'blocked', {
        provider,
        code,
        message,
      })
    }
  } catch (err) {
    console.error(`[runner] Unexpected error for ${task.taskId}:`, err)
    emitNightCityVerse('agent.blocked', task.agentType, task.projectName, task.title)
    await notifyTaskState(task.taskId, 'blocked', {
      provider: getPrimaryProvider(),
      code: 'unknown',
      message: err instanceof Error ? err.message : String(err),
    })
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
