
# Gemini API Documentation

## Overview
Gemini is Google's multimodal AI model that can understand and generate text, images, audio, and more. In SmartVid, we use Gemini to analyze user prompts and break them down into scenes for video creation.

## Authentication
API keys are stored in Supabase secrets under `GEMINI_API_KEY`.

## Implementation Example

```typescript
import { GoogleGenerativeAI } from "@google/genai";

// Initialize the API with your API key
const genAI = new GoogleGenerativeAI(apiKey);

// Access a specific model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Generate content
async function generateScenes(prompt: string) {
  const systemPrompt = `You are an expert video editor. Break down the following prompt into scenes...`;
  
  const result = await model.generateContent([
    systemPrompt,
    prompt
  ]);
  
  const response = result.response.text();
  return JSON.parse(response);
}
```

## Model Options
- `gemini-pro`: Text-only model optimized for chat and text generation
- `gemini-pro-vision`: Multimodal model that accepts text and image inputs

## Error Handling
Always implement robust error handling for API calls:
- JSON parsing errors (Gemini may not always return perfect JSON)
- Rate limiting considerations
- Network failures

## Reference
- [Official Google GenAI Documentation](https://ai.google.dev/docs)
