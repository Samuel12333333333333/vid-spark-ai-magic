
# Shotstack API Documentation

## Overview
Shotstack is a cloud video editing API that enables programmatic video creation, editing and rendering. In SmartVid, we use Shotstack to combine the video clips from Pexels with overlays, transitions, and audio to create the final video.

## Authentication
API keys are stored in Supabase secrets under `SHOTSTACK_API_KEY`.

## Implementation Guidelines

### Required Headers
```
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

### Render Endpoint
```
POST https://api.shotstack.io/stage/render
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
    ]
  },
  output: {
    format: "mp4",
    resolution: "sd"
  }
};

const response = await fetch("https://api.shotstack.io/stage/render", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey
  },
  body: JSON.stringify(shotstackPayload)
});
```

### Check Render Status
```
GET https://api.shotstack.io/stage/render/{renderId}
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

## Error Handling
- Rate limiting considerations
- Media download failures
- Rendering failures

## Reference
- [Shotstack API Documentation](https://shotstack.io/docs/api/)
