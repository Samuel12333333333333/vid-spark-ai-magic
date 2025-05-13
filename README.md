
# SmartVideofy - AI-Powered Video Generation Platform

## Project Overview

SmartVideofy is a short-form video generation platform that turns a user's text prompt into a visually engaging video by using AI and stock video clips. The platform integrates multiple APIs and is designed for creators, marketers, educators, and startups to instantly visualize their ideas.

## Technology Stack

- **Frontend:** React + TypeScript + TailwindCSS (responsive and mobile-friendly)
- **Backend:** Node.js + Express + TypeScript  
- **Authentication:** Supabase Auth (email/password)
- **Database:** Supabase PostgreSQL
- **APIs Used:**
  - Gemini API (for prompt breakdown and scene generation)
  - Pexels API (for stock videos based on visual keywords)
  - Shotstack API (for video rendering with transitions, overlays, and audio)
  - Paystack (for payment processing)

## Key Features

- User registration & login using Supabase Auth
- Dashboard for authenticated users to:
  - Submit a video idea (text prompt)
  - Track generation progress (loading, pending, complete)
  - Preview completed video
  - Download or share video
  - View past projects
- Backend functionality:
  - Takes user input
  - Calls Gemini API to break the prompt into scenes and visual elements
  - Uses visual keywords to query Pexels for video clips
  - Sends clips and text overlays to Shotstack to generate video
  - Polls Shotstack until render is complete
  - Returns video link to frontend

## Development Setup

### Prerequisites

- Node.js 18+ and npm installed
- Supabase account with project setup
- API keys for Gemini, Pexels, and Shotstack

### Installation

1. Clone the repository:
   ```sh
   git clone <your-repo-url>
   cd smartvideofy
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory with the following environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_PEXELS_API_KEY=your_pexels_api_key
   VITE_SHOTSTACK_API_KEY=your_shotstack_api_key
   VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

## Deployment

The application is deployed at [https://smartvideofy.com](https://smartvideofy.com).

## License

This project is proprietary and confidential. All rights reserved.

© 2025 SmartVideofy
