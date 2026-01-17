export interface DocumentChunk {
  content: string
  chunkIndex: number
  metadata?: Record<string, unknown>
}

/**
 * Splits text into chunks with overlap for better context retention
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): DocumentChunk[] {
  const chunks: DocumentChunk[] = []
  let startIndex = 0

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length)
    const chunk = text.slice(startIndex, endIndex).trim()

    if (chunk.length > 0) {
      chunks.push({
        content: chunk,
        chunkIndex: chunks.length,
        metadata: {
          startChar: startIndex,
          endChar: endIndex,
          length: chunk.length,
        },
      })
    }

    // Move start index forward, accounting for overlap
    startIndex = endIndex - overlap
  }

  return chunks
}

/**
 * Chunks text while preserving sentence boundaries when possible
 */
export function chunkTextSmart(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): DocumentChunk[] {
  const chunks: DocumentChunk[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  let currentChunk: string[] = []
  let currentLength = 0

  for (const sentence of sentences) {
    const sentenceLength = sentence.length

    if (currentLength + sentenceLength > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        content: currentChunk.join(' '),
        chunkIndex: chunks.length,
        metadata: {
          sentenceCount: currentChunk.length,
        },
      })

      // Start new chunk with overlap (last few sentences)
      const overlapSentences = currentChunk.slice(-Math.ceil(overlap / 100))
      currentChunk = overlapSentences
      currentLength = overlapSentences.join(' ').length
    }

    currentChunk.push(sentence)
    currentLength += sentenceLength + 1 // +1 for space
  }

  // Add remaining chunk
  if (currentChunk.length > 0) {
    chunks.push({
      content: currentChunk.join(' '),
      chunkIndex: chunks.length,
      metadata: {
        sentenceCount: currentChunk.length,
      },
    })
  }

  return chunks
}

/**
 * Chunks structured data (like tables) preserving structure
 */
export function chunkStructuredData(
  data: Record<string, unknown>[],
  rowsPerChunk: number = 50
): DocumentChunk[] {
  const chunks: DocumentChunk[] = []

  for (let i = 0; i < data.length; i += rowsPerChunk) {
    const chunkData = data.slice(i, i + rowsPerChunk)
    const content = JSON.stringify(chunkData, null, 2)

    chunks.push({
      content,
      chunkIndex: Math.floor(i / rowsPerChunk),
      metadata: {
        rowStart: i,
        rowEnd: Math.min(i + rowsPerChunk - 1, data.length - 1),
        rowCount: chunkData.length,
      },
    })
  }

  return chunks
}


