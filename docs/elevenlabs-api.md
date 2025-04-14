
# ElevenLabs API Documentation

## Overview
ElevenLabs provides state-of-the-art AI voice generation technology. In SmartVid, we use ElevenLabs to generate realistic voiceovers for videos based on the scripts created with Gemini.

## Authentication
API keys are stored in Supabase secrets under `ELEVEN_LABS_API_KEY`.

## Implementation Guidelines

### Required Headers
```
xi-api-key: YOUR_API_KEY
Content-Type: application/json
Accept: audio/mpeg
```

### Text-to-Speech Endpoint
```
POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
```

### Basic Request Structure
```typescript
const ttsPayload = {
  text: "The script text to convert to speech",
  model_id: "eleven_monolingual_v1",
  voice_settings: {
    stability: 0.5, // Adjust between 0-1
    similarity_boost: 0.5 // Adjust between 0-1
  }
};

const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "xi-api-key": apiKey,
    "Accept": "audio/mpeg"
  },
  body: JSON.stringify(ttsPayload)
});

// Response is audio data in the format specified (audio/mpeg)
const audioData = await response.arrayBuffer();
```

### Available Voices
ElevenLabs offers a variety of premium voices. Here are some recommended voices:

- Rachel (21m00Tcm4TlvDq8ikWAM) - Warm and conversational
- Adam (pNInz6obpgDQGcFmaJgB) - Deep and authoritative
- Sarah (EXAVITQu4vr4xnSDxMaL) - Professional and clear
- Domi (AZnzlk1XvdvUeBnXmlld) - Strong and confident
- Elli (MF3mGyEYCl7XYWbV9V6O) - Approachable and friendly
- Josh (yoZ06aMxZJJ28mfd3POQ) - Warm and engaging

### Models
- `eleven_monolingual_v1`: Standard English model
- `eleven_multilingual_v1`: Multilingual model
- `eleven_turbo_v2`: Faster, efficient model for English

### Voice Settings
Adjust these parameters to fine-tune the voice:

- `stability`: Controls consistency (0-1, higher is more stable)
- `similarity_boost`: Controls voice clone similarity (0-1, higher is more similar)

## Integration with Shotstack
After generating audio with ElevenLabs, the audio file should be:

1. Stored (can be base64 encoded for transmission)
2. Used in the Shotstack render process with the `soundtrack` property
3. Synchronized with video clips for proper timing

## Error Handling
- Check for API rate limits
- Handle audio generation failures gracefully
- Test audio/video synchronization

## Reference
- [ElevenLabs API Documentation](https://docs.elevenlabs.io/api-reference/text-to-speech)

