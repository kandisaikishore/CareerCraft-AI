import { ResumeData } from "../types";

export interface ResumeOptimizationResult {
  improvements: string[];
  missingKeywords: string[];
  matchScore: number;
  highlightSkills: string[];
}

export interface InterviewQuestion {
  question: string;
  reason: string;
  idealAnswer: string;
}

async function postAiRequest<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null) as { error?: string } | T | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : "The AI service could not complete this request. Please try again.";
    throw new Error(message);
  }
  if (payload === null) throw new Error("The AI service returned an empty response. Please retry.");
  return payload as T;
}

export const optimizeResume = (
  resume: ResumeData,
  jobDescription: string,
): Promise<ResumeOptimizationResult> =>
  postAiRequest("/api/ai/optimize-resume", { resume, jobDescription });

export const generateInterviewQuestions = (
  resume: ResumeData,
  jobDescription: string,
): Promise<InterviewQuestion[]> =>
  postAiRequest("/api/ai/interview-questions", { resume, jobDescription });

export const startMockInterview = async (
  resume: ResumeData,
  jobDescription: string,
  history: { role: string; content: string }[],
): Promise<string> => {
  const response = await postAiRequest<{ text: string }>("/api/ai/mock-interview", {
    resume,
    jobDescription,
    history,
  });
  return response.text;
};
