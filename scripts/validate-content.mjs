import { readFile } from "node:fs/promises";

const filePath = new URL("../public/data/questions.json", import.meta.url);
const data = JSON.parse(await readFile(filePath, "utf8"));
const errors = [];
const warnings = [];
const validDifficulties = new Set(["easy", "medium", "hard"]);
const validAccess = new Set(["free", "premium"]);
const categoryIds = new Set(data.categories.map((category) => category.id));
const questionIds = new Set();
const questionTexts = new Map();

function isBlank(value) {
  return typeof value !== "string" || value.trim().length === 0;
}

function normalize(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function requireText(value, label) {
  if (isBlank(value)) errors.push(`${label}: must not be empty.`);
}

if (!data.contentVersion) errors.push("Missing contentVersion.");
if (!Number.isInteger(data.contentTarget)) errors.push("contentTarget must be an integer.");
if (!data.exam?.questionCount || !data.exam?.durationMinutes || !data.exam?.passingPercent) {
  errors.push("Missing complete exam config.");
}

data.questions.forEach((question, index) => {
  const label = question.id || `question[${index}]`;
  if (!question.id) errors.push(`${label}: missing id.`);
  requireText(question.id, `${label}: id`);
  if (questionIds.has(question.id)) errors.push(`${label}: duplicate id.`);
  questionIds.add(question.id);
  if (!categoryIds.has(question.categoryId)) errors.push(`${label}: unknown categoryId.`);
  requireText(question.categoryId, `${label}: categoryId`);
  requireText(question.question, `${label}: question`);
  requireText(question.rationale, `${label}: rationale`);
  requireText(question.source, `${label}: source`);

  const normalizedQuestion = normalize(question.question);
  if (questionTexts.has(normalizedQuestion)) {
    errors.push(`${label}: duplicate question text also used by ${questionTexts.get(normalizedQuestion)}.`);
  }
  questionTexts.set(normalizedQuestion, label);

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    errors.push(`${label}: options must contain exactly 4 answers.`);
  } else {
    const normalizedOptions = new Set();
    question.options.forEach((option, optionIndex) => {
      requireText(option, `${label}: option[${optionIndex}]`);
      const normalizedOption = normalize(option);
      if (normalizedOptions.has(normalizedOption)) {
        errors.push(`${label}: duplicate answer option "${option}".`);
      }
      normalizedOptions.add(normalizedOption);
    });
  }

  if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 3) {
    errors.push(`${label}: answerIndex must be 0-3.`);
  } else if (!question.options?.[question.answerIndex]) {
    errors.push(`${label}: answerIndex does not point to an existing answer.`);
  }

  if (!validDifficulties.has(question.difficulty)) errors.push(`${label}: invalid difficulty.`);
  if (!validAccess.has(question.access)) errors.push(`${label}: invalid access.`);
  if (question.access === "premium") errors.push(`${label}: premium questions must be stored in protected Supabase migrations, not the public JSON.`);
  if (normalize(question.source).includes("provjeriti")) {
    warnings.push(`${label}: source still contains "provjeriti"; replace before production.`);
  }
  if (!Array.isArray(question.keywords) || question.keywords.some(isBlank)) {
    errors.push(`${label}: keywords must be a non-empty string array.`);
  }
});

data.flashcards.forEach((card) => {
  requireText(card.id, `${card.id || "flashcard"}: id`);
  requireText(card.question, `${card.id}: question`);
  requireText(card.answer, `${card.id}: answer`);
  if (card.questionId && !questionIds.has(card.questionId)) errors.push(`${card.id}: unknown questionId.`);
  if (!categoryIds.has(card.categoryId)) errors.push(`${card.id}: unknown categoryId.`);
  if (!validAccess.has(card.access)) errors.push(`${card.id}: invalid access.`);
});

if (warnings.length) {
  console.warn(`Content validation warnings (${warnings.length}):`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Content OK: ${data.questions.length}/${data.contentTarget} questions, ${data.flashcards.length} flashcards.`);
