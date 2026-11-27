# CareerCraft AI

[![Source](https://img.shields.io/badge/Source-GitHub-181717?logo=github)](https://github.com/kandisaikishore/CareerCraft-AI) [![Last Commit](https://img.shields.io/github/last-commit/kandisaikishore/CareerCraft-AI)](https://github.com/kandisaikishore/CareerCraft-AI/commits/main)

CareerCraft AI is a career-development application with a resume builder, AI resume optimization, and mock interview workflows.

## Technology

- React and TypeScript
- Vite
- Express
- Google Gemini API

## Requirements

- Node.js 20 or newer
- npm
- A Gemini API key for AI features

## Configure the server

Create a local `.env` file based on `.env.example` and set:

```env
GEMINI_API_KEY=your_server_side_key
PORT=3000
```

**Keep `GEMINI_API_KEY` on the server.** The Vite client build does not receive or embed this credential. Do not use a `VITE_`-prefixed key or commit real secrets.

## Run locally

```bash
git clone https://github.com/kandisaikishore/CareerCraft-AI.git
cd CareerCraft-AI
npm install
npm run dev
```

The Express server starts the Vite development middleware and exposes the AI endpoints under `/api/ai`. If the key is missing, AI requests return a clear configuration error while the UI remains available.

## Validate

```bash
npm test
npm run lint
npm run build
```

The automated tests validate malformed and incomplete AI responses and mock-interview history without calling the live Gemini service.

## Production

Build the frontend and run the Express server in production mode:

```bash
npm run build
NODE_ENV=production npm start
```

Set `GEMINI_API_KEY`, `NODE_ENV=production`, and optionally `PORT` in the hosting provider's server-side environment/secret settings. The Express server serves the built frontend and proxies AI requests to Gemini. AI routes apply a per-IP request limit and bounded request sizes.

## Responsible AI use

AI-generated career suggestions are advisory. Review them for accuracy and relevance before using them in applications or interviews. Avoid submitting sensitive personal details unless you understand how the application handles and stores data.

## Contributing

Open issues with reproducible steps and submit focused pull requests with build and test results.

## License

No license file is currently declared. Add a `LICENSE` file to define reuse terms.
