// Claude world editor panel — press E to open, type natural language, hit Send

let isOpen = false

const panel  = () => document.getElementById('editor-panel') as HTMLDivElement
const input  = () => document.getElementById('editor-input') as HTMLInputElement
const btn    = () => document.getElementById('editor-send') as HTMLButtonElement
const close  = () => document.getElementById('editor-close') as HTMLSpanElement
const think  = () => document.getElementById('editor-thinking') as HTMLSpanElement

function open(): void {
  if (isOpen) return
  isOpen = true
  panel().classList.add('open')
  input().focus()
}

function closePanel(): void {
  if (!isOpen) return
  isOpen = false
  panel().classList.remove('open')
  input().value = ''
  input().blur()
}

async function sendEdit(): Promise<void> {
  const prompt = input().value.trim()
  if (!prompt) return

  btn().disabled   = true
  think().style.display = 'inline'

  try {
    const res = await fetch('/api/claude', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt }),
    })
    const data = await res.json() as { ok: boolean; message?: string }
    if (data.ok) {
      input().value = ''
      if (data.message) {
        showToast(`✓ ${data.message}`)
      }
    } else {
      showToast('Claude edit failed — check ANTHROPIC_API_KEY', true)
    }
  } catch {
    showToast('Server unreachable', true)
  } finally {
    btn().disabled        = false
    think().style.display = 'none'
  }
}

function showToast(msg: string, error = false): void {
  const t = document.createElement('div')
  t.textContent = msg
  Object.assign(t.style, {
    position: 'fixed',
    bottom:   '60px',
    left:     '50%',
    transform: 'translateX(-50%)',
    background: error ? '#c0392b' : '#27ae60',
    color:    '#fff',
    padding:  '8px 16px',
    borderRadius: '4px',
    fontFamily: 'Courier New',
    fontSize: '12px',
    zIndex:   '200',
    pointerEvents: 'none',
  })
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3000)
}

export function initEditor(): void {
  // Keyboard shortcut
  window.addEventListener('keydown', (e) => {
    if (e.key === 'e' || e.key === 'E') {
      if (document.activeElement?.tagName === 'INPUT') return
      e.preventDefault()
      open()
    }
    if (e.key === 'Escape') closePanel()
  })

  // Button
  btn().addEventListener('click', () => sendEdit())

  // Enter key in input
  input().addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendEdit()
  })

  // Close button
  close().addEventListener('click', closePanel)
}
