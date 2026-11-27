const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);

export function parseOptimizationResult(text) {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("The AI service returned invalid JSON. Please retry.");
  }

  if (
    !isRecord(value) ||
    !isStringArray(value.improvements) ||
    !isStringArray(value.missingKeywords) ||
    !isStringArray(value.highlightSkills) ||
    typeof value.matchScore !== "number" ||
    !Number.isFinite(value.matchScore) ||
    value.matchScore < 0 ||
    value.matchScore > 100
  ) {
    throw new Error("The AI service returned an incomplete or invalid resume analysis.");
  }

  return {
    improvements: value.improvements,
    missingKeywords: value.missingKeywords,
    matchScore: value.matchScore,
    highlightSkills: value.highlightSkills,
  };
}

export function parseInterviewQuestions(text) {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("The AI service returned invalid interview-question data. Please retry.");
  }

  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every((item) =>
      isRecord(item) &&
      typeof item.question === "string" && item.question.trim().length > 0 &&
      typeof item.reason === "string" && item.reason.trim().length > 0 &&
      typeof item.idealAnswer === "string" && item.idealAnswer.trim().length > 0
    )
  ) {
    throw new Error("The AI service returned incomplete interview questions.");
  }

  return value.map((item) => ({
    question: item.question.trim(),
    reason: item.reason.trim(),
    idealAnswer: item.idealAnswer.trim(),
  }));
}

export function validateInterviewHistory(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 40) {
    throw new Error("Interview history must contain between 1 and 40 messages.");
  }

  return value.map((message) => {
    if (
      !isRecord(message) ||
      !["user", "assistant"].includes(message.role) ||
      typeof message.content !== "string" ||
      !message.content.trim() ||
      message.content.length > 4000
    ) {
      throw new Error("Interview history contains an invalid message.");
    }
    return { role: message.role, content: message.content.trim() };
  });
}
