import { describe, expect, it } from "vitest";
import { buildQuestionReportPayload } from "../src/question-reports.js";

const session = { user: { id: "user-123" } };
const question = {
  id: "uio-001",
  categoryId: "uio",
  question: "Gdje je sjedište Uprave?",
  options: ["Sarajevo", "Banja Luka", "Mostar", "Tuzla"],
  answerIndex: 1,
  source: "Ispitni materijal",
  access: "free"
};

describe("question reports", () => {
  it("sprema snapshot pitanja i predloženi odgovor", () => {
    expect(buildQuestionReportPayload({
      session,
      question,
      suggestedAnswer: " Sarajevo ",
      note: "Provjeriti izvor.",
      contentVersion: "2026.06.10"
    })).toMatchObject({
      user_id: "user-123",
      question_id: "uio-001",
      options: question.options,
      reported_answer: "Banja Luka",
      suggested_answer: "Sarajevo",
      note: "Provjeriti izvor.",
      content_version: "2026.06.10"
    });
  });

  it("zahtijeva prijavljenog korisnika i odgovor", () => {
    expect(() => buildQuestionReportPayload({ question, suggestedAnswer: "Sarajevo" })).toThrow("Prijavite se");
    expect(() => buildQuestionReportPayload({ session, question, suggestedAnswer: " " })).toThrow("predloženi tačan odgovor");
  });

  it("sprema prikazani odgovor ručne kartice", () => {
    const flashcard = {
      id: "card-custom-1",
      categoryId: "uio",
      question: "Ko rukovodi Upravom?",
      answer: "Direktor.",
      source: "Kartica za aktivno prisjećanje",
      access: "free"
    };

    expect(buildQuestionReportPayload({
      session,
      question: flashcard,
      suggestedAnswer: "Upravni odbor."
    })).toMatchObject({
      question_id: "card-custom-1",
      options: [],
      reported_answer: "Direktor.",
      suggested_answer: "Upravni odbor."
    });
  });
});
