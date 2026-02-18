import Groq from 'groq-sdk';

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY is not set. Create a .env.local file with: GROQ_API_KEY=your_key_here\n' +
        'Get a free key at https://console.groq.com'
      );
    }
    groqInstance = new Groq({ apiKey });
  }
  return groqInstance;
}

// llama-3.3-70b-versatile — current best Groq model as of 2025
// llama-3.1-70b-versatile was decommissioned
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function groqChatCompletion(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number = 4096,
  temperature: number = 0.4
): Promise<string> {
  const client = getGroqClient();

  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage },
    ],
    max_tokens: maxTokens,
    temperature,
    top_p: 0.95,
  });

  return completion.choices[0]?.message?.content ?? '';
}
