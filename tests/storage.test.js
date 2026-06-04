import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  cachePremiumQuestions,
  deriveProgress,
  deriveWrongQuestionIds,
  getCachedPremiumQuestions,
  getLocalState,
  mergeBaselines,
  mergeById,
  readLocalState,
  recordAnswer,
  recordAttempt
} from "../src/storage.js";
import { isEntitlementActive } from "../src/sync.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }
  getItem(key) {
    return this.values.get(key) ?? null;
  }
  setItem(key, value) {
    this.values.set(key, String(value));
  }
  removeItem(key) {
    this.values.delete(key);
  }
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage();
});

describe("storage v3", () => {
  it("migrira v2 agregate bez premium unlocka", () => {
    localStorage.setItem("uio-proprep-progress-v2", JSON.stringify({
      quizzesDone: 4,
      answersTotal: 10,
      answersCorrect: 7,
      categories: { uio: { total: 10, correct: 7 } },
      wrongQuestionIds: ["uio-1"],
      attempts: [],
      premiumUnlocked: true
    }));
    const state = readLocalState();
    expect(state.version).toBe(3);
    expect(state.legacyBaseline.summary.quizzesDone).toBe(4);
    expect(state.cachedEntitlement).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).premiumUnlocked).toBeUndefined();
  });

  it("spaja baseline koristeći veće brojače", () => {
    const merged = mergeBaselines(
      { summary: { quizzesDone: 3, answersTotal: 10, answersCorrect: 5, categories: { uio: { total: 8, correct: 4 } } }, wrongQuestionIds: ["a"] },
      { summary: { quizzesDone: 5, answersTotal: 7, answersCorrect: 6, categories: { uio: { total: 6, correct: 5 } } }, wrongQuestionIds: ["b"] }
    );
    expect(merged.summary).toMatchObject({ quizzesDone: 5, answersTotal: 10, answersCorrect: 6 });
    expect(merged.summary.categories.uio).toEqual({ total: 8, correct: 5 });
    expect(merged.wrongQuestionIds).toEqual(expect.arrayContaining(["a", "b"]));
  });

  it("deduplicira evente i pokušaje po stabilnom UUID-u", () => {
    expect(mergeById([{ id: "same", value: "local" }], [{ id: "same", value: "cloud" }, { id: "other" }]))
      .toEqual([{ id: "same", value: "local" }, { id: "other" }]);
  });

  it("najnoviji odgovor određuje listu pogrešnih pitanja", () => {
    const wrong = deriveWrongQuestionIds(
      { wrongQuestionIds: ["legacy"] },
      [
        { questionId: "q1", isCorrect: false, answeredAt: "2026-01-01T10:00:00Z" },
        { questionId: "q1", isCorrect: true, answeredAt: "2026-01-01T11:00:00Z" },
        { questionId: "q2", isCorrect: false, answeredAt: "2026-01-01T11:00:00Z" }
      ]
    );
    expect(wrong).toEqual(expect.arrayContaining(["legacy", "q2"]));
    expect(wrong).not.toContain("q1");
  });

  it("odmah sprema offline queue i računa napredak", () => {
    const event = recordAnswer({ questionId: "q1", categoryId: "uio", isCorrect: true, contentVersion: "v1" });
    const attempt = recordAttempt({ mode: "all", label: "Sva pitanja", total: 1, correct: 1, percent: 100, passed: true });
    const state = getLocalState();
    expect(state.pendingAnswerEventIds).toContain(event.id);
    expect(state.pendingAttemptIds).toContain(attempt.id);
    expect(deriveProgress(state).answersCorrect).toBe(1);
  });

  it("odbacuje premium cache nakon isteka", () => {
    cachePremiumQuestions([{ id: "premium-1" }], { expires_at: "2026-01-01T00:00:00Z" }, "v1");
    expect(getCachedPremiumQuestions(new Date("2026-02-01T00:00:00Z"))).toEqual([]);
  });
});

describe("premium entitlement", () => {
  it("prihvata samo aktivni premium status", () => {
    expect(isEntitlementActive({ tier: "premium", expires_at: null })).toBe(true);
    expect(isEntitlementActive({ tier: "free", expires_at: null })).toBe(false);
    expect(isEntitlementActive({ tier: "premium", expires_at: "2025-01-01T00:00:00Z" }, new Date("2026-01-01T00:00:00Z"))).toBe(false);
  });
});
