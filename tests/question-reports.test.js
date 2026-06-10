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
});
