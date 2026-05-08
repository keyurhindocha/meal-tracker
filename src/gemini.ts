import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllMeals } from './storage';

function getClient(): GoogleGenerativeAI | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here') return null;
  return new GoogleGenerativeAI(key);
}

export function isGeminiConfigured(): boolean {
  return getClient() !== null;
}

export async function getRecommendations(preferences?: string): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error('Gemini API key not configured. Add your key to .env as VITE_GEMINI_API_KEY');
  }

  const meals = await getAllMeals();
  const recentMeals = meals
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  const mealHistory = recentMeals.length > 0
    ? recentMeals.map(m => `${m.date} ${m.type}: ${m.name}`).join('\n')
    : 'No meal history yet.';

  const prompt = `You are a helpful meal planning assistant. Based on the user's recent meal history, suggest 5 meal ideas for each meal type (breakfast, lunch, dinner). Consider variety and avoid recommending meals they've had very recently.

${preferences ? `User preferences: ${preferences}\n` : ''}
Recent meal history:
${mealHistory}

Provide recommendations in this format:

**Breakfast Ideas:**
1. Meal name - brief reason
2. ...

**Lunch Ideas:**
1. Meal name - brief reason
2. ...

**Dinner Ideas:**
1. Meal name - brief reason
2. ...

Keep meal names concise (2-4 words). Be practical and varied.`;

  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
