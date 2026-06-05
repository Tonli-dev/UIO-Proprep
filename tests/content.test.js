import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const content = JSON.parse(
  await readFile(new URL("../public/data/questions.json", import.meta.url), "utf8")
);

describe("uvozeni SSS set pitanja", () => {
  it("u javnom JSON-u ostavlja balansiran free set od 50 pitanja", () => {
    expect(content.contentTarget).toBe(180);
    expect(content.questions).toHaveLength(50);
    expect(
      content.questions.reduce((counts, question) => {
        counts[question.categoryId] = (counts[question.categoryId] || 0) + 1;
        return counts;
      }, {})
    ).toEqual({ uio: 14, kanc: 11, carine: 25 });
  });

  it("dokumentuje premium split od 130 pitanja", () => {
    expect(content.sourceDocument.split).toMatchObject({
      freeQuestionCount: 50,
      premiumQuestionCount: 130,
      countsByCategory: {
        free: { uio: 14, kanc: 11, carine: 25 },
        premium: { uio: 35, kanc: 28, carine: 67 }
      }
    });
  });

  it("čuva direktne odgovore u free setu bez generiranih distraktora", () => {
    const directQuestions = content.questions.filter((question) => question.questionType === "direct");
    const multipleChoiceQuestions = content.questions.filter((question) => question.questionType === "multiple-choice");

    expect(directQuestions).toHaveLength(50);
    expect(directQuestions.every((question) => question.answer && question.options === undefined)).toBe(true);
    expect(multipleChoiceQuestions).toHaveLength(0);
  });
});
