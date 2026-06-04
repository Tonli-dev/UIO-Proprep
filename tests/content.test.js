import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const content = JSON.parse(
  await readFile(new URL("../public/data/questions.json", import.meta.url), "utf8")
);

describe("uvozeni SSS set pitanja", () => {
  it("sadrži kompletnih 180 pitanja iz tri oblasti", () => {
    expect(content.questions).toHaveLength(180);
    expect(
      content.questions.reduce((counts, question) => {
        counts[question.categoryId] = (counts[question.categoryId] || 0) + 1;
        return counts;
      }, {})
    ).toEqual({ uio: 49, kanc: 39, carine: 92 });
  });

  it("čuva direktne odgovore bez generiranih distraktora", () => {
    const directQuestions = content.questions.filter((question) => question.questionType === "direct");
    const multipleChoiceQuestions = content.questions.filter((question) => question.questionType === "multiple-choice");

    expect(directQuestions).toHaveLength(179);
    expect(directQuestions.every((question) => question.answer && question.options === undefined)).toBe(true);
    expect(multipleChoiceQuestions).toHaveLength(1);
    expect(multipleChoiceQuestions[0].options).toHaveLength(3);
  });
});
