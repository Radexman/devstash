import OpenAI from 'openai';

export const AI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-5-nano';

let cached: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (cached) return cached;
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  cached = new OpenAI({ apiKey: key });
  return cached;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return Reflect.get(getOpenAI(), prop, getOpenAI());
  },
});
