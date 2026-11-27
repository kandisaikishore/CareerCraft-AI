import test from "node:test";
import assert from "node:assert/strict";
import {
  parseOptimizationResult,
  parseInterviewQuestions,
  validateInterviewHistory,
} from "../server/aiValidation.js";

test("accepts a complete resume optimization response", () => {
  const result = parseOptimizationResult(JSON.stringify({
    improvements: ["Use measurable outcomes"],
    missingKeywords: ["Java"],
    matchScore: 82,
    highlightSkills: ["SQL"],
  }));
  assert.equal(result.matchScore, 82);
  assert.deepEqual(result.missingKeywords, ["Java"]);
});

test("rejects malformed and incomplete resume optimization output", () => {
  assert.throws(() => parseOptimizationResult("{"), /invalid JSON/i);
  assert.throws(() => parseOptimizationResult(JSON.stringify({
    improvements: [],
    missingKeywords: [],
    matchScore: 120,
    highlightSkills: [],
  })), /incomplete or invalid/i);
});

test("accepts valid interview questions and rejects empty or malformed output", () => {
  const questions = parseInterviewQuestions(JSON.stringify([{
    question: "Explain dependency injection.",
    reason: "Checks design knowledge.",
    idealAnswer: "Describe inversion of control and composition.",
  }]));
  assert.equal(questions.length, 1);
  assert.throws(() => parseInterviewQuestions("[]"), /incomplete interview questions/i);
  assert.throws(() => parseInterviewQuestions(JSON.stringify([{ question: "Only a question" }])), /incomplete interview questions/i);
});

test("validates mock interview history and bounds its size", () => {
  assert.deepEqual(validateInterviewHistory([
    { role: "user", content: "Start the interview." },
    { role: "assistant", content: "Tell me about yourself." },
  ]), [
    { role: "user", content: "Start the interview." },
    { role: "assistant", content: "Tell me about yourself." },
  ]);
  assert.throws(() => validateInterviewHistory([{ role: "system", content: "bad" }]), /invalid message/i);
  assert.throws(() => validateInterviewHistory([]), /between 1 and 40/i);
});
