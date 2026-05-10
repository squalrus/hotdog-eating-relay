import type { HotdogEvent } from '../types'

export function exportEventJSON(event: HotdogEvent): void {
  const slug = event.name.toLowerCase().replace(/\s+/g, '-')
  const json = JSON.stringify(event, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importEventJSON(file: File): Promise<HotdogEvent> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = e.target?.result
        if (typeof raw !== 'string') {
          reject(new Error('Could not read file'))
          return
        }
        const data = JSON.parse(raw) as Partial<HotdogEvent>
        if (!data.id || !data.name || !Array.isArray(data.teams)) {
          reject(new Error('File does not look like a valid Hot Dog Relay event export'))
          return
        }
        resolve(data as HotdogEvent)
      } catch {
        reject(new Error('Failed to parse JSON — is this the right file?'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
