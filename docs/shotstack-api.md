
# Shotstack API Documentation

## Overview
Shotstack is a cloud video editing API that enables programmatic video creation, editing and rendering. In SmartVid, we use Shotstack to combine the video clips from Pexels with overlays, transitions, audio, and captions to create the final video.

## Authentication
API keys are stored in Supabase secrets under `SHOTSTACK_API_KEY`.

### Checking Your API Key
To verify your Shotstack API key is working:

1. Go to Supabase Edge Functions
2. Visit the "test-shotstack" function and execute it
3. A successful response will include `"success": true`

## Implementation Guidelines

### Required Headers
```
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

### Render Endpoint
```
POST https://api.shotstack.io/v1/render
```

### Basic Request Structure
```typescript
const shotstackPayload = {
  timeline: {
    background: "#000000",
    soundtrack: {
      src: "https://example.com/audio.mp3",
      effect: "fadeOut"
    },
    tracks: [
      {
        clips: [
          {
            asset: {
              type: "video",
              src: "https://example.com/video.mp4"
            },
            start: 0,
            length: 5,
            effect: "zoomIn",
            transition: {
              in: "fade",
              out: "fade"
            }
          },
          // More clips...
        ]
      },
      // For overlay text
      {
        clips: [
          {
            asset: {
              type: "title",
              text: "Scene Title",
              style: "minimal",
              size: "medium"
            },
            start: 0,
            length: 5,
            position: "bottom"
          }
        ]
      }
    ],
    // Use a VTT file for subtitles
    subtitles: {
      src: "https://example.com/captions.vtt",
      type: "vtt"
    }
  },
  output: {
    format: "mp4",
    resolution: "sd"
  }
};

const response = await fetch("https://api.shotstack.io/v1/render", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey
  },
  body: JSON.stringify(shotstackPayload)
});
```

### Working with Audio
To add narration or background music:

```typescript
// Add to the timeline object
timeline.soundtrack = {
  src: "https://example.com/audio.mp3",
  effect: "fadeOut" // Optional audio effect
};
```

**Important**: The audio URL must be publicly accessible. If you're using base64 audio data, you need to first upload it to a storage service that provides a public URL, such as Supabase Storage.

### Working with Captions
Two options for adding captions:

1. **Using a VTT file (preferred):**
```typescript
timeline.subtitles = {
  src: "https://example.com/captions.vtt",
  type: "vtt"
};
```

2. **Using text overlays for simple captions:**
```typescript
// Add as a separate track
timeline.tracks.push({
  clips: [
    {
      asset: {
        type: "title",
        text: "Caption text",
        style: "minimal",
        size: "medium"
      },
      start: 0,
      length: 3,
      position: "bottom"
    }
  ]
});
```

### Check Render Status
```
GET https://api.shotstack.io/v1/render/{renderId}
```

### Handling Asynchronous Rendering
Shotstack renders videos asynchronously:
1. Submit render job (returns render ID)
2. Poll status endpoint periodically until status is "done"
3. Access finished video via URL in response

### Status Values
- `queued`: Waiting to be rendered
- `fetching`: Downloading source media
- `rendering`: Creating the video
- `saving`: Uploading to storage
- `done`: Complete and ready for download
- `failed`: Something went wrong

## Credits System
Shotstack operates on a credit-based system:

- Each render consumes credits based on video duration and complexity
- Free tier has limited credits
- Check available credits with the account endpoint:
  ```
  GET https://api.shotstack.io/v1/me
  ```

## Troubleshooting
### Common Issues:
1. **Missing Audio or Captions**:
   - Ensure audio/caption URLs are publicly accessible
   - For audio, use the `soundtrack` property directly in the timeline object
   - For captions, use the `subtitles` property or a dedicated track with text overlays

2. **Credit Limits**:
   - 403 errors may indicate insufficient credits
   - Check available credits before rendering
   - Consider upgrading if consistently hitting limits

3. **Invalid URLs**:
   - All media URLs must be publicly accessible
   - Media must be in compatible formats
   - Check console logs for detailed errors

4. **Early Render Failures**:
   - Ensure your API key is valid and has sufficient permissions (read + write)
   - Check that all video URLs are accessible from the Shotstack servers
   - Verify that all merge fields in templates have values provided
   - Look for rate limiting or quota issues

## Testing Your Integration
We recommend testing your integration with this checklist:

1. Verify API key works with the `/me` endpoint
2. Test with a minimal template (single clip, no audio)
3. Add complexity incrementally (audio, captions, etc.)
4. Monitor render status and handle all possible status values
5. Implement retry logic for transient failures

## Reference
- [Shotstack API Documentation](https://shotstack.io/docs/api/)
- [Shotstack Dashboard](https://dashboard.shotstack.io/) (for credits and renders)
