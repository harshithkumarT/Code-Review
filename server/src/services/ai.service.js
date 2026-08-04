import { GoogleGenAI } from '@google/genai';
import { CODE_REVIEW_SYSTEM_PROMPT, buildUserCodePrompt } from '../utils/prompts.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Sanitize AI output string by stripping markdown fences if present
 */
const cleanJSONResponse = (rawText) => {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
  }
  return cleaned.trim();
};

/**
 * Fallback Mock Analysis generator if API keys are not yet configured
 */
const generateMockReview = (codeSnippet, language) => {
  return {
    score: 88,
    aiFeedback: `### Code Review Overview for ${language}\n- **Strengths**: Clean modular design and clear variable naming.\n- **Improvement Areas**: Add error boundary checks and optimize loop iterations.`,
    reviewedCode: `// Refactored ${language} Code\n${codeSnippet}`,
    bugs: [
      {
        line: 1,
        issue: 'Potential null dereference check missing',
        suggestion: 'Add optional chaining or explicit non-null validation.',
        severity: 'medium',
      },
    ],
    optimizations: [
      {
        title: 'Loop Complexity Reduction',
        description: 'Consider caching array length during iteration.',
        impact: 'medium',
      },
    ],
    securityIssues: [
      {
        issue: 'Input validation recommended',
        severity: 'low',
        mitigation: 'Sanitize user inputs before processing.',
      },
    ],
    complexity: {
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
    },
  };
};

/**
 * Primary AI Code Review Service Engine
 * Supports Google Gemini API & OpenAI API
 *
 * OpenAI is lazy-imported to avoid Jest ESM resolution issues
 * when the package is not fully installed or API keys are unset.
 */
export const generateCodeReview = async (codeSnippet, language, options = {}) => {
  const provider = (options.provider || process.env.DEFAULT_AI_PROVIDER || 'gemini').toLowerCase();
  const systemPrompt = CODE_REVIEW_SYSTEM_PROMPT;
  const userPrompt = buildUserCodePrompt(codeSnippet, language, options);

  const geminiKey = process.env.GEMINI_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;

  const isGeminiConfigured = geminiKey && !geminiKey.includes('your_gemini_api_key');
  const isOpenAIConfigured = openAIKey && !openAIKey.includes('your_openai_api_key');

  // If neither provider is configured, return mock data
  if (!isGeminiConfigured && !isOpenAIConfigured) {
    return generateMockReview(codeSnippet, language);
  }

  // --- Google Gemini Provider ---
  if (provider === 'gemini' && isGeminiConfigured) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text;
      const jsonString = cleanJSONResponse(rawText);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Gemini API Error:', error.message);
      if (isOpenAIConfigured) {
        console.log('🔄 Falling back to OpenAI provider...');
      } else {
        return generateMockReview(codeSnippet, language);
      }
    }
  }

  // --- OpenAI Provider (Lazy Dynamic Import) ---
  if (isOpenAIConfigured) {
    try {
      const openaiModule = await import('openai');
      const OpenAI = openaiModule.default || openaiModule.OpenAI;
      const openai = new OpenAI({ apiKey: openAIKey });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const rawText = completion.choices[0].message.content;
      const jsonString = cleanJSONResponse(rawText);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('OpenAI API Error:', error.message);
      return generateMockReview(codeSnippet, language);
    }
  }

  return generateMockReview(codeSnippet, language);
};
