
# Gemini API Documentation

## Overview
Gemini is Google's multimodal AI model that can understand and generate text, images, audio, and more. In SmartVid, we use Gemini to analyze user prompts and break them down into scenes for video creation.

## Authentication
API keys are stored in Supabase secrets under `GEMINI_API_KEY`.

## Implementation Example

```typescript
// Using the correct Gemini Flash API
const apiKey = Deno.env.get("GEMINI_API_KEY");
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

// Generate content
async function generateScenes(prompt: string) {
  const systemPrompt = `You are an expert video editor. Break down the following prompt into scenes...`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1000
      }
    })
  });
  
  const responseData = await response.json();
  const textResponse = responseData.candidates[0].content.parts
    .map(part => part.text || "")
    .join("");
  
  return JSON.parse(textResponse);
}
```

## Model Options
- `gemini-2.0-flash`: Our primary model for scene generation - faster and more efficient
- `gemini-2.0-pro`: Optional more powerful model for complex content (not currently in use)

## Error Handling
Always implement robust error handling for API calls:
- JSON parsing errors
- Rate limiting considerations
- Network failures

## Reference
- [Official Google GenAI Documentation](https://ai.google.dev/docs)
