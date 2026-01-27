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
    console.error('[Web Search] SERPER_API_KEY not configured')
    throw new Error('SERPER_API_KEY not configured for web search. Please add it to your environment variables.')
  }

  console.log(`[Web Search] Searching for: "${query}"`)

  try {
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
      console.error(`[Web Search] Serper API error: ${response.status}`, errorText)

      if (response.status === 401) {
        throw new Error('Invalid Serper API key. Please check your SERPER_API_KEY.')
      }
      if (response.status === 429) {
        throw new Error('Serper API rate limit exceeded. Please try again later.')
      }
      if (response.status === 402) {
        throw new Error('Serper API quota exceeded. Please check your plan limits.')
      }

      throw new Error(`Web search failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (!data) {
      console.error('[Web Search] Empty response from Serper API')
      throw new Error('Web search returned empty response')
    }

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

    console.log(`[Web Search] Found ${results.length} results`)

    return {
      results,
      query,
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('SERPER_API_KEY')) {
      throw error
    }

    console.error('[Web Search] Error:', error)

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error during web search. Please check your internet connection.')
    }

    throw error
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
