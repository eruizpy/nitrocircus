/**
 * Multi-step Telegram conversation to collect deployment parameters.
 * Stored in-memory — only one user (the PO) interacts with the bot.
 */

export interface DeployParams {
  projectId: string
  projectName: string
  serverIp: string
  sshUser: string
  sshPass: string
  domain?: string
}

type Step = 'ip' | 'user' | 'pass' | 'domain' | 'confirm'

interface ConversationState {
  projectId: string
  projectName: string
  step: Step
  serverIp?: string
  sshUser?: string
  sshPass?: string
  domain?: string
}

// Keyed by Telegram user ID (string)
const sessions = new Map<string, ConversationState>()

// ── Validation ────────────────────────────────────────────────────────────────

function isValidIp(value: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(value) &&
    value.split('.').every((o) => parseInt(o, 10) <= 255)
}

function isValidDomain(value: string): boolean {
  return /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(value)
}

// ── Public API ────────────────────────────────────────────────────────────────

export function startDeployConversation(
  userId: string,
  projectId: string,
  projectName: string,
): string {
  sessions.set(userId, { projectId, projectName, step: 'ip' })
  return '🖥 Ingresa la <b>IP del servidor</b> SSH (ej: <code>192.168.1.10</code>):'
}

export function isInConversation(userId: string): boolean {
  return sessions.has(userId)
}

export function cancelConversation(userId: string): void {
  sessions.delete(userId)
}

/** Returns { reply, done, params? } */
export function handleConversationInput(
  userId: string,
  text: string,
): { reply: string; done: false } | { reply: string; done: true; params: DeployParams } | null {
  const state = sessions.get(userId)
  if (!state) return null

  const value = text.trim()

  switch (state.step) {
    case 'ip': {
      if (!isValidIp(value)) {
        return { reply: '⚠️ IP inválida. Ingresa una dirección IPv4 válida (ej: <code>45.33.32.156</code>):', done: false }
      }
      state.serverIp = value
      state.step = 'user'
      return { reply: '👤 Ingresa el <b>usuario SSH</b> (ej: <code>root</code>):', done: false }
    }

    case 'user': {
      if (!value || value.includes(' ')) {
        return { reply: '⚠️ Usuario inválido. Sin espacios (ej: <code>root</code>):', done: false }
      }
      state.sshUser = value
      state.step = 'pass'
      return { reply: '🔑 Ingresa la <b>contraseña SSH</b>:', done: false }
    }

    case 'pass': {
      if (!value) {
        return { reply: '⚠️ La contraseña no puede estar vacía:', done: false }
      }
      state.sshPass = value
      state.step = 'domain'
      return {
        reply: '🌐 Ingresa el <b>dominio</b> (ej: <code>miapp.com</code>)\nEscribe <code>/skip</code> para omitirlo:',
        done: false,
      }
    }

    case 'domain': {
      if (value === '/skip' || value.toLowerCase() === 'skip') {
        state.domain = undefined
      } else if (!isValidDomain(value)) {
        return {
          reply: '⚠️ Dominio inválido. Escribe un dominio válido (ej: <code>miapp.com</code>) o <code>/skip</code>:',
          done: false,
        }
      } else {
        state.domain = value
      }
      state.step = 'confirm'
      const summary = buildSummary(state)
      return {
        reply: `${summary}\n\n¿Confirmar despliegue? Responde <code>/si</code> o <code>/no</code>`,
        done: false,
      }
    }

    case 'confirm': {
      if (value === '/no' || value.toLowerCase() === 'no') {
        sessions.delete(userId)
        return { reply: '❌ Despliegue cancelado.', done: false }
      }
      if (value !== '/si' && value.toLowerCase() !== 'si') {
        return { reply: 'Responde <code>/si</code> para confirmar o <code>/no</code> para cancelar:', done: false }
      }

      // Confirmed — return final params
      const params: DeployParams = {
        projectId: state.projectId,
        projectName: state.projectName,
        serverIp: state.serverIp!,
        sshUser: state.sshUser!,
        sshPass: state.sshPass!,
        domain: state.domain,
      }
      sessions.delete(userId)
      return { reply: '⚙️ Configurando despliegue...', done: true, params }
    }
  }
}

function buildSummary(state: ConversationState): string {
  return [
    `📋 <b>Resumen del despliegue</b>`,
    '',
    `Proyecto: <b>${state.projectName}</b>`,
    `Servidor: <code>${state.serverIp}</code>`,
    `Usuario:  <code>${state.sshUser}</code>`,
    `Contraseña: <code>[configurada]</code>`,
    `Dominio: ${state.domain ? `<code>${state.domain}</code>` : '<i>sin dominio</i>'}`,
  ].join('\n')
}
