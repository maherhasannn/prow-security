import * as XLSX from 'xlsx'
import { chunkStructuredData, chunkTextSmart, type DocumentChunk } from '../chunking'

export interface ExcelParseResult {
  sheets: Array<{
    name: string
    data: Record<string, unknown>[]
    headers: string[]
  }>
  chunks: DocumentChunk[]
  metadata: {
    sheetCount: number
    totalRows: number
  }
}

/**
 * Parses an Excel file and extracts data from all sheets
 */
export async function parseExcel(fileBuffer: Buffer): Promise<ExcelParseResult> {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
  const sheets: ExcelParseResult['sheets'] = []
  let totalRows = 0

  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false,
    })

    if (jsonData.length === 0) continue

    // Extract headers
    const firstRow = jsonData[0]
    const headers = firstRow ? Object.keys(firstRow) : []

    sheets.push({
      name: sheetName,
      data: jsonData,
      headers,
    })

    totalRows += jsonData.length
  }

  // Create chunks from structured data
  const chunks: DocumentChunk[] = []
  for (const sheet of sheets) {
    const sheetChunks = chunkStructuredData(sheet.data)
    chunks.push(
      ...sheetChunks.map((chunk) => ({
        ...chunk,
        metadata: {
          ...chunk.metadata,
          sheetName: sheet.name,
          headers: sheet.headers,
        },
      }))
    )
  }

  return {
    sheets,
    chunks,
    metadata: {
      sheetCount: sheets.length,
      totalRows,
    },
  }
}

/**
 * Parses a CSV file
 */
export async function parseCSV(fileBuffer: Buffer): Promise<ExcelParseResult> {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
  })

  const firstRow = jsonData.length > 0 ? jsonData[0] : undefined
  const headers = firstRow ? Object.keys(firstRow) : []

  const chunks = chunkStructuredData(jsonData)

  return {
    sheets: [
      {
        name: 'Sheet1',
        data: jsonData,
        headers,
      },
    ],
    chunks: chunks.map((chunk) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        headers,
      },
    })),
    metadata: {
      sheetCount: 1,
      totalRows: jsonData.length,
    },
  }
}

