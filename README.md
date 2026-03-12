# LI-INT PRO: LinkedIn Intelligence Dashboard

A premium, AI-powered intelligence platform built to scan and analyze public LinkedIn mentions using advanced search grounding. This project serves as a technical showcase for modern web engineering, AI integration, and state-of-the-art UI/UX design.

## 🚀 Quick Preview (Recruiter Friendly)
No API keys? No problem.
1. **Visit (https://mentions.netlify.app/)
2. Click the **"Try Demo"** button in the search bar.
3. Experience the full glassmorphic UI, smooth micro-animations, and AI-driven insights with pre-rendered data.

## 🛠️ Technical Stack
- **Framework**: Next.js 15 (App Router, Standalone Output)
- **AI Engine**: Google Gemini 3 Flash (via Google Generative AI SDK)
- **Search Grounding**: SerpApi (Real-time Google search indexing)
- **Styling**: Tailwind CSS 4.0 (Modern CSS-in-JS tokens)
- **Animations**: Framer Motion (Hardware-accelerated micro-interactions)
- **Icons**: Lucide React

## ✨ Key Engineering Highlights
- **AI Search Grounding**: Implemented hybrid search logic that combines LLM reasoning with live web indexing to bypass traditional scraping limitations.
- **Premium Design System**: Custom-built dark theme with glassmorphic overlays, sophisticated color palettes, and responsive "Professional Cyber" aesthetics.
- **Zero-Login Architecture**: Designed specifically to analyze public data without requiring sensitive LinkedIn user credentials.
- **Optimized Performance**: Standalone build configuration for rapid deployment and minimal cold starts.

## ⚙️ Setup & Deployment
1. **Clone & Install**: `npm install`
2. **Environment**: Create `.env.local` with:
   - `NEXT_PUBLIC_GEMINI_API_KEY`
   - `SERPAPI_API_KEY`
3. **Run**: `npm run dev`
4. **Deploy**: Optimized for **Netlify** (configuration included in `netlify.toml`).
