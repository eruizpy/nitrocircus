import Groq from 'groq-sdk'

/**
 * Transcribes OGG/Opus audio (from a Telegram voice note) using Groq Whisper.
 * Accepts the raw audio as a base64-encoded string.
 */
export async function transcribeAudio(audioBase64: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY no configurada — la transcripción no está disponible')

  const client = new Groq({ apiKey })
  const buffer = Buffer.from(audioBase64, 'base64')
  const file = new File([buffer], 'voice.ogg', { type: 'audio/ogg' })

  const result = await client.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3-turbo',
    language: 'es',
  })

  return result.text.trim()
}
