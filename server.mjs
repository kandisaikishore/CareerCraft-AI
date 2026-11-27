import "dotenv/config";
import express from "express";
import path from "node:path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import {
  parseOptimizationResult,
  parseInterviewQuestions,
  validateInterviewHistory,
  validateResumeInput,
} from "./server/aiValidation.js";

const app = express();
const port = Number(process.env.PORT) || 3000;
const model = "gemini-3-flash-preview";

app.use(express.json({ limit: "1mb" }));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function requireText(value, field, maxLength = 20000) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${field} is required.`);
  }
  if (value.length > maxLength) {
    throw new HttpError(400, `${field} exceeds the allowed length.`);
  }
  return value.trim();
}

function requireResume(value) {
  try {
    const resume = validateResumeInput(value);
    if (JSON.stringify(resume).length > 50000) {
      throw new Error("Resume data is too large to analyze.");
    }
    return resume;
  } catch (error) {
    throw new HttpError(400, error.message);
  }
}

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new HttpError(503, "AI features are not configured. Add GEMINI_API_KEY to the server environment.");
  }
  return new GoogleGenAI({ apiKey });
}

async function withTimeout(promise, milliseconds = 30000) {
  let timeout;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new HttpError(504, "The AI service timed out. Please try again.")), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

const requestCounts = new Map();
app.use("/api/ai", (req, res, next) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const current = requestCounts.get(key);
  if (!current || current.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + 60000 });
    return next();
  }
  if (current.count >= 20) {
    return res.status(429).json({ error: "Too many AI requests. Please wait a minute and try again." });
  }
  current.count += 1;
  next();
});

const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

app.post("/api/ai/optimize-resume", asyncRoute(async (req, res) => {
  const resume = requireResume(req.body?.resume);
  const jobDescription = requireText(req.body?.jobDescription, "Job description");
  const prompt = `
    You are an expert career coach and resume optimizer.
    Analyze the resume data and optimize it for the provided job description.
    Resume: ${JSON.stringify(resume)}
    Job Description: ${jobDescription}
    Provide improvements, missing keywords, a match score from 0 to 100, and skills to highlight.
  `;

  const response = await withTimeout(getAiClient().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          matchScore: { type: Type.NUMBER },
          highlightSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["improvements", "missingKeywords", "matchScore", "highlightSkills"],
      },
    },
  }));
  res.json(parseOptimizationResult(response.text || ""));
}));

app.post("/api/ai/interview-questions", asyncRoute(async (req, res) => {
  const resume = requireResume(req.body?.resume);
  const jobDescription = requireText(req.body?.jobDescription, "Job description");
  const prompt = `
    Based on this resume and job description, generate five interview questions.
    For each, include the question, why it is asked, and what a good answer should include.
    Resume: ${JSON.stringify(resume)}
    Job Description: ${jobDescription}
  `;

  const response = await withTimeout(getAiClient().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            reason: { type: Type.STRING },
            idealAnswer: { type: Type.STRING },
          },
          required: ["question", "reason", "idealAnswer"],
        },
      },
    },
  }));
  res.json(parseInterviewQuestions(response.text || ""));
}));

app.post("/api/ai/mock-interview", asyncRoute(async (req, res) => {
  const resume = requireResume(req.body?.resume);
  const jobDescription = requireText(req.body?.jobDescription, "Job description");
  const history = validateInterviewHistory(req.body?.history);
  const response = await withTimeout(getAiClient().models.generateContent({
    model,
    contents: history.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    config: {
      systemInstruction: `
        You are an expert interviewer for a role matching the job description.
        Conduct a realistic, professional, challenging mock interview.
        Ask one question at a time and provide brief, constructive feedback.
        Candidate resume: ${JSON.stringify(resume)}
        Job description: ${jobDescription}
      `,
    },
  }));
  const text = response.text?.trim();
  if (!text) throw new HttpError(502, "The AI service returned an empty interview response. Please retry.");
  res.json({ text });
}));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const providerStatus = Number(error?.status);
  if (providerStatus === 429) {
    return res.status(429).json({ error: "The AI provider is rate limited. Please try again shortly." });
  }
  if (providerStatus === 401 || providerStatus === 403) {
    return res.status(503).json({ error: "AI provider credentials are invalid or unavailable. Contact the application administrator." });
  }
  const status = Number(error?.status) || (error?.type === "entity.too.large" ? 413 : 502);
  const message = error instanceof HttpError ? error.message :
    status === 413 ? "The request is too large." : "The AI service could not complete this request. Please try again.";
  if (status >= 500) console.error("[career-ai] request failed:", error?.message || "unknown error");
  res.status(status).json({ error: message });
});

async function start() {
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve("dist")));
    app.get("*", (req, res) => res.sendFile(path.resolve("dist/index.html")));
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`CareerCraft AI server listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start CareerCraft AI server:", error);
  process.exit(1);
});
