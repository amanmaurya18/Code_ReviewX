# ⚡ CodeReviewX - AI Senior Code Reviewer

CodeReviewX is a modern, high-performance web application that provides real-time AI code reviews for multiple programming languages (JavaScript, Python, C++, Java, C) powered by Google Gemini API.

---

## ✨ Features
- 🚀 **Multi-Language AI Auditing**: Instant senior-level feedback on code quality, security, efficiency, readability, and modern best practices.
- ⚡ **Google Gemini 2.0 Integration**: Uses candidate model fallbacks (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`) for maximum stability.
- 🎨 **Modern Split UI**: Interactive code editor powered by Prism.js & react-simple-code-editor with syntax highlighting and Markdown rendering.
- 🛠️ **Seamless Vercel & Local Deployment**: Production-ready Vercel serverless integration and dev server proxying.

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Node.js (v18+)
- Google Gemini API Key ([Get your key here](https://aistudio.google.com/))

### 2. Environment Setup
Create a `.env` file in the `BACKEND` directory (or project root):
```env
GOOGLE_GEMINI_KEY=your_actual_gemini_api_key_here
PORT=3000
```

### 3. Install & Run
Run the backend and frontend servers:

```bash
# Start Backend
cd BACKEND
npm install
node Server.js

# Start Frontend (in a separate terminal)
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser!

---

## 🌐 Vercel Deployment

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Under **Project Settings -> Environment Variables**, add:
   - `GOOGLE_GEMINI_KEY`: Your Google Gemini API Key
4. Deploy! Vercel automatically routes `/ai/*` requests to `/api/index.js`.