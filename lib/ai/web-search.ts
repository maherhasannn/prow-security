/**
 * Web search utility for AI providers with internet-enabled mode
 * Uses Serper API for Google Search results
 */

export interface SearchResult {
  title: string
  link: string
  snippet: string
  position: number
}

export interface WebSearchResponse {
  results: SearchResult[]
  query: string
}

export async function performWebSearch(query: string, numResults: number = 5): Promise<WebSearchResponse> {
  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    throw new Error('SERPER_API_KEY not configured for web search')
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: numResults,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Serper API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  const results: SearchResult[] = (data.organic || []).map((item: {
    title?: string
    link?: string
    snippet?: string
    position?: number
  }, index: number) => ({
    title: item.title || '',
    link: item.link || '',
    snippet: item.snippet || '',
    position: item.position || index + 1,
  }))

  return {
    results,
    query,
  }
}

export function formatSearchResultsForContext(searchResponse: WebSearchResponse): string {
  if (searchResponse.results.length === 0) {
    return `No search results found for: "${searchResponse.query}"`
  }

  let context = `Web search results for: "${searchResponse.query}"\n\n`

  for (const result of searchResponse.results) {
    context += `[${result.position}] ${result.title}\n`
    context += `URL: ${result.link}\n`
    context += `${result.snippet}\n\n`
  }

  return context
}

export const webSearchFunctionDefinition = {
  type: 'function' as const,
  function: {
    name: 'web_search',
    description: 'Search the web for current information. Use this when you need up-to-date information, facts, news, or any information that might have changed after your training data.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to look up on the web',
        },
      },
      required: ['query'],
    },
  },
}
