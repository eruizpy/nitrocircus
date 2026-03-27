/**
 * Pending state after /new <name>: waits for a voice note (or text fallback)
 * with project requirements before creating the project.
 */

interface PendingProject {
  name: string
}

const pending = new Map<string, PendingProject>()

export function startVoiceCapture(userId: string, name: string): void {
  pending.set(userId, { name })
}

export function isAwaitingVoice(userId: string): boolean {
  return pending.has(userId)
}

/** Removes and returns the pending state (consume once). */
export function consumePending(userId: string): PendingProject | undefined {
  const state = pending.get(userId)
  pending.delete(userId)
  return state
}

export function cancelVoiceCapture(userId: string): void {
  pending.delete(userId)
}
