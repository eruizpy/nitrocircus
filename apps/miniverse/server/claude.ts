import Anthropic from '@anthropic-ai/sdk'
import type { WorldSnapshot, WorldPatch, TileType } from './world.js'

const TILE_NAMES: Record<number, string> = {
  0: 'floor',
  1: 'wall',
  2: 'desk',
  3: 'plant',
  4: 'window',
  5: 'coffee_machine',
  6: 'accent_floor',
  7: 'whiteboard',
}

const TILE_IDS: Record<string, TileType> = {
  floor: 0, wall: 1, desk: 2, plant: 3,
  window: 4, coffee_machine: 5, accent_floor: 6, whiteboard: 7,
}

// Build a compact text representation of the tilemap for Claude context
function tileMapToText(tilemap: TileType[][]): string {
  return tilemap.map((row, r) =>
    row.map((t, c) => (t === 0 ? '.' : TILE_NAMES[t]?.[0] ?? '?')).join(''),
  ).join('\n')
}

function buildPrompt(snapshot: WorldSnapshot, userPrompt: string): string {
  const agentSummary = Object.values(snapshot.agents)
    .map(a => `  ${a.id}: pos(col=${a.position.col}, row=${a.position.row}), state=${a.state}${a.task ? `, task="${a.task}"` : ''}`)
    .join('\n')

  const mapText = tileMapToText(snapshot.tilemap)

  return `You are the world editor for NitroCircus Miniverse — a pixel-art virtual office.

WORLD GRID: 20 columns (0–19) × 14 rows (0–13). Tile legend:
  . = floor(0)  W = wall(1)  d = desk(2)  p = plant(3)
  w = window(4) c = coffee_machine(5)  a = accent_floor(6)  b = whiteboard(7)

CURRENT MAP (row 0 = top):
${mapText}

AGENTS:
${agentSummary}

RULES:
- Perimeter (row 0, row 13, col 0, col 19) must stay wall(1)
- Do not overwrite agent home desk tiles
- Make minimal, sensible changes (1–6 tiles typically)
- Tiles outside 0–7 are invalid

USER REQUEST: "${userPrompt}"

Respond with ONLY a valid JSON object — no markdown, no comments, no explanation outside JSON:
{
  "message": "Brief summary of what changed",
  "tilePatch": [{"col": <number>, "row": <number>, "tile": <0-7>}],
  "agentPatch": {}
}`
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function claudeEditWorld(
  snapshot: WorldSnapshot,
  userPrompt: string,
): Promise<WorldPatch | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    console.warn('[claude] ANTHROPIC_API_KEY not set — skipping world edit')
    return null
  }

  const client = new Anthropic({ apiKey: key })

  try {
    const response = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: buildPrompt(snapshot, userPrompt) },
      ],
    })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('')

    // Extract JSON — Claude sometimes wraps it in a code block despite instructions
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[claude] No JSON found in response:', text)
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      message?: string
      tilePatch?: Array<{ col: number; row: number; tile: number }>
      agentPatch?: Record<string, unknown>
    }

    // Normalize tile values (Claude might send tile names instead of IDs)
    const tilePatch = (parsed.tilePatch ?? []).map(tp => ({
      col: Number(tp.col),
      row: Number(tp.row),
      tile: (typeof tp.tile === 'string' ? TILE_IDS[tp.tile] ?? 0 : Number(tp.tile)) as TileType,
    }))

    return {
      message:    parsed.message,
      tilePatch,
      agentPatch: (parsed.agentPatch as WorldPatch['agentPatch']) ?? {},
    }
  } catch (err) {
    console.error('[claude] Error:', err)
    return null
  }
}
