
# Pexels API Documentation

## Overview
Pexels provides a vast library of free stock photos and videos. In SmartVid, we use the Pexels API to find appropriate video clips for each scene generated from the user's prompt.

## Authentication
API keys are stored in Supabase secrets under `PEXELS_API_KEY`.

## Implementation Guidelines

### Required Headers
```
Authorization: YOUR_API_KEY
```

### Video Search Endpoint
```
GET https://api.pexels.com/videos/search
```

### Parameters
- `query` (required): The search term (e.g., "ocean", "business meeting")
- `orientation` (optional): "landscape", "portrait", or "square"
- `size` (optional): "large" (4K), "medium" (Full HD), or "small" (HD)
- `per_page` (optional): Number of results per page (default: 15, max: 80)
- `page` (optional): Page number for pagination

### Example Request
```typescript
const response = await fetch(
  `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`,
  {
    method: "GET",
    headers: {
      "Authorization": apiKey
    }
  }
);

const data = await response.json();
```

### Response Structure
The response includes video details:
- `id`: Unique identifier
- `width` and `height`: Dimensions
- `duration`: Length in seconds
- `video_files`: Array of different formats/qualities
- `video_pictures`: Array of preview thumbnails

### Attribution Requirements
When displaying Pexels content:
1. Show a prominent link to Pexels (e.g., "Videos provided by Pexels")
2. Credit photographers when possible (e.g., "Video by [Name] on Pexels")

## Rate Limits
- 200 requests per hour
- 20,000 requests per month

## Error Handling
- Handle 429 (Too Many Requests) status for rate limiting
- Use response headers (`X-Ratelimit-Remaining`) to track quota

## Reference
- [Pexels API Documentation](https://www.pexels.com/api/documentation/)
