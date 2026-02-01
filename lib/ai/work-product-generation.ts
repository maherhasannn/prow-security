import type { WorkProductType } from '@/lib/utils/validation'

export interface WorkProductPrompt {
  systemPrompt: string
  userPromptTemplate: string
}

const workProductPrompts: Record<WorkProductType, WorkProductPrompt> = {
  'article': {
    systemPrompt: `You are a professional content writer specializing in transforming research notes into well-structured, engaging articles. Your writing is clear, insightful, and accessible to a general professional audience.`,
    userPromptTemplate: `Transform the following notes into a well-structured article. The article should:
- Have a compelling title and introduction
- Be organized with clear sections and headings
- Include relevant insights and analysis
- Have a strong conclusion with key takeaways
- Be professional yet engaging in tone

Notes:
{content}

{additionalContext}

Write the article now:`,
  },
  'brief': {
    systemPrompt: `You are an expert at distilling complex information into concise, actionable briefs. Your briefs are known for being clear, well-organized, and immediately useful for decision-makers.`,
    userPromptTemplate: `Create a concise brief summarizing the key points from the following notes. The brief should:
- Start with an executive summary (2-3 sentences)
- List key findings or insights as bullet points
- Highlight any recommendations or action items
- Include relevant data or metrics if present
- Be no more than one page when printed

Notes:
{content}

{additionalContext}

Write the brief now:`,
  },
  'memo': {
    systemPrompt: `You are a skilled business communications professional who writes clear, professional memoranda. Your memos are known for being direct, well-organized, and action-oriented.`,
    userPromptTemplate: `Draft a professional memorandum based on the following notes. The memo should:
- Follow standard memo format (To, From, Date, Subject, Body)
- Have a clear purpose statement in the opening
- Present information in a logical, easy-to-follow structure
- Include specific recommendations or next steps if applicable
- Maintain a professional, direct tone

Notes:
{content}

{additionalContext}

Write the memo now:`,
  },
  'executive-summary': {
    systemPrompt: `You are an executive communications specialist who excels at creating high-level summaries for senior leadership. Your summaries are strategic, concise, and focused on business impact.`,
    userPromptTemplate: `Create an executive summary capturing the essential information from the following notes. The summary should:
- Lead with the most important insight or recommendation
- Be no longer than half a page
- Focus on strategic implications and business impact
- Use clear, jargon-free language
- Include 2-3 key takeaways at the end

Notes:
{content}

{additionalContext}

Write the executive summary now:`,
  },
  'messaging-framework': {
    systemPrompt: `You are a strategic communications consultant who develops messaging frameworks for organizations. Your frameworks are clear, consistent, and actionable for teams.`,
    userPromptTemplate: `Develop a messaging framework based on the following notes. The framework should include:
- Core Message: The primary message or positioning (1-2 sentences)
- Key Messages: 3-5 supporting messages
- Talking Points: Bullet points that expand on each key message
- Proof Points: Data, examples, or evidence supporting the messages
- Audience Considerations: How to adapt messaging for different audiences
- Do's and Don'ts: Guidelines for message delivery

Notes:
{content}

{additionalContext}

Create the messaging framework now:`,
  },
  'decision-explanation': {
    systemPrompt: `You are an expert at creating clear, well-reasoned decision documents that tie conclusions to supporting data. Your explanations are logical, transparent, and build confidence in the decision-making process.`,
    userPromptTemplate: `Create a decision explanation document based on the following notes. The document should:
- State the decision or recommendation clearly upfront
- Provide context and background
- List the key factors or criteria considered
- Show how the evidence supports the decision
- Address potential concerns or alternatives considered
- Include clear next steps or implementation notes

Notes:
{content}

{additionalContext}

Write the decision explanation now:`,
  },
}

export function getWorkProductPrompt(
  type: WorkProductType,
  content: string,
  additionalContext?: string
): { systemPrompt: string; userPrompt: string } {
  const promptTemplate = workProductPrompts[type]

  const additionalContextSection = additionalContext
    ? `\nAdditional context and instructions:\n${additionalContext}`
    : ''

  const userPrompt = promptTemplate.userPromptTemplate
    .replace('{content}', content)
    .replace('{additionalContext}', additionalContextSection)

  return {
    systemPrompt: promptTemplate.systemPrompt,
    userPrompt,
  }
}

export function getWorkProductTypeLabel(type: WorkProductType): string {
  const labels: Record<WorkProductType, string> = {
    'article': 'Article',
    'brief': 'Brief',
    'memo': 'Memo',
    'executive-summary': 'Executive Summary',
    'messaging-framework': 'Messaging Framework',
    'decision-explanation': 'Decision Explanation',
  }
  return labels[type]
}
