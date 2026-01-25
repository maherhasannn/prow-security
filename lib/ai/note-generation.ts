const IMPORTANT_KEYWORDS = [
  'key insight',
  'insight',
  'recommendation',
  'action',
  'next step',
  'risk',
  'critical',
  'important',
  'priority',
  'conclusion',
  'summary',
]

const NUMBER_PATTERN = /\b(\$?\d{1,3}(,\d{3})+|\$?\d+(\.\d+)?%?)\b/

const normalizeLine = (line: string) => line.replace(/\s+/g, ' ').trim()

const isImportantLine = (line: string) => {
  const lower = line.toLowerCase()
  const hasKeyword = IMPORTANT_KEYWORDS.some((keyword) => lower.includes(keyword))
  const hasNumber = NUMBER_PATTERN.test(line)
  return hasKeyword || hasNumber
}

const splitSentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

export function generateWorkspaceNotes(content: string): string[] {
  if (!content) return []

  const lines = content
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean)

  const candidates: string[] = []

  for (const line of lines) {
    const cleaned = line.replace(/^[-•*]\s*/, '').trim()
    if (!cleaned || cleaned.length < 12) continue
    if (isImportantLine(cleaned)) {
      candidates.push(cleaned)
    }
  }

  if (candidates.length === 0) {
    for (const sentence of splitSentences(content)) {
      if (sentence.length < 20 || sentence.length > 200) continue
      if (isImportantLine(sentence)) {
        candidates.push(sentence)
      }
    }
  }

  const unique = Array.from(new Set(candidates))
  return unique.slice(0, 3)
}
