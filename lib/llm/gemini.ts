import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash';
const TRANSCRIBE_MODEL_NAME = 'gemini-2.5-flash';
const ANALYSIS_MODEL_NAME = 'gemini-2.5-flash';

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return apiKey;
}

export function getGeminiModel(systemInstruction?: string) {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const modelName = process.env.GEMINI_MODEL || MODEL_NAME;
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });
}

export function getGeminiAnalysisModel(systemInstruction?: string) {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const modelName = process.env.GEMINI_ANALYSIS_MODEL || ANALYSIS_MODEL_NAME;
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });
}

export function getGeminiTranscribeModel(systemInstruction?: string) {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const modelName = process.env.GEMINI_TRANSCRIBE_MODEL || TRANSCRIBE_MODEL_NAME;
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });
}

export async function generateJson(systemInstruction: string, prompt: string) {
  const model = getGeminiModel(systemInstruction);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) {
    throw new Error('No response from Gemini');
  }
  return JSON.parse(text);
}

export async function generateJsonWithParts(
  systemInstruction: string,
  prompt: string,
  parts: Array<{ inlineData: { data: string; mimeType: string } }>
) {
  const model = getGeminiAnalysisModel(systemInstruction);
  const result = await model.generateContent([
    { text: prompt },
    ...parts,
  ]);
  const text = result.response.text();
  if (!text) {
    throw new Error('No response from Gemini');
  }
  return JSON.parse(text);
}

export async function generateJsonWithPartsTranscribe(
  systemInstruction: string,
  prompt: string,
  parts: Array<{ inlineData: { data: string; mimeType: string } }>
) {
  const model = getGeminiTranscribeModel(systemInstruction);
  const result = await model.generateContent([
    { text: prompt },
    ...parts,
  ]);
  const text = result.response.text();
  if (!text) {
    throw new Error('No response from Gemini');
  }
  return JSON.parse(text);
}
