# Backend setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `MONGO_URI` and a long, random `JWT_SECRET`.
3. To enable Gemini smart replies, set `GEMINI_API_KEY` in `.env`. `GEMINI_MODEL` is optional and defaults to `gemini-3.5-flash-lite`. If you previously stored your Gemini key under `OPENAI_API_KEY`, it will continue to work; rename it to `GEMINI_API_KEY` when convenient.
4. Start the API with `node server.js`.

The AI draft endpoint returns a configuration error when no Gemini API key is set. When configured, ticket subject and customer-facing conversation messages are sent to Gemini to generate a draft. Internal notes are excluded. Review generated drafts before sending them to customers.
