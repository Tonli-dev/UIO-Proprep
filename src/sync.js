import { supabase } from "./supabase-client.js";
import {
  cachePremiumQuestions,
  clearPremiumCache,
  getLocalState,
  mergeBaselines,
  mergeById,
  replaceSyncedData,
  setCachedEntitlement,
  writeLocalState
} from "./storage.js";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function isEntitlementActive(entitlement, now = new Date()) {
  if (!entitlement || entitlement.tier !== "premium") return false;
  return !entitlement.expires_at || new Date(entitlement.expires_at) > now;
}

export function getEffectiveEntitlement(now = new Date()) {
  const cached = getLocalState().cachedEntitlement;
  if (!cached) return { tier: "free", active: false };
  const verifiedAt = cached.verifiedAt ? new Date(cached.verifiedAt) : new Date(0);
  const withinOfflineWindow = now - verifiedAt <= THIRTY_DAYS_MS;
  const active = isEntitlementActive(cached, now) && (cached.expires_at || withinOfflineWindow);
  return { ...cached, active };
}

const eventToCloud = (event, userId) => ({
  id: event.id,
  user_id: userId,
  question_id: event.questionId,
  category_id: event.categoryId,
  is_correct: event.isCorrect,
  answered_at: event.answeredAt,
  content_version: event.contentVersion
});

const eventFromCloud = (event) => ({
  id: event.id,
  questionId: event.question_id,
  categoryId: event.category_id,
  isCorrect: event.is_correct,
  answeredAt: event.answered_at,
  contentVersion: event.content_version
});

const attemptToCloud = (attempt, userId) => ({
  id: attempt.id,
  user_id: userId,
  mode: attempt.mode,
  label: attempt.label,
  total: attempt.total,
  correct: attempt.correct,
  percent: attempt.percent,
  passed: attempt.passed,
  wrong_question_ids: attempt.wrongQuestionIds || [],
  content_version: attempt.contentVersion,
  completed_at: attempt.completedAt
});

const attemptFromCloud = (attempt) => ({
  id: attempt.id,
  mode: attempt.mode,
  label: attempt.label,
  total: attempt.total,
  correct: attempt.correct,
  percent: attempt.percent,
  passed: attempt.passed,
  wrongQuestionIds: attempt.wrong_question_ids || [],
  contentVersion: attempt.content_version,
  completedAt: attempt.completed_at
});

export async function loadAccountData(userId) {
  if (!supabase || !userId) return null;
  const [profileResult, entitlementResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("entitlements").select("*").eq("user_id", userId).maybeSingle()
  ]);
  const error = profileResult.error || entitlementResult.error;
  if (error) throw error;
  const profile = profileResult.data;
  const entitlement = entitlementResult.data;
  if (entitlement) setCachedEntitlement({ ...entitlement, verifiedAt: new Date().toISOString() });
  return { profile, entitlement };
}

export async function loadPremiumQuestions(entitlement, contentVersion) {
  if (!supabase || !isEntitlementActive(entitlement)) {
    clearPremiumCache();
    return [];
  }
  const { data, error } = await supabase.from("premium_questions").select("*").order("id");
  if (error) throw error;
  const questions = (data || []).map((question) => ({
    id: question.id,
    categoryId: question.category_id,
    questionType: "multiple-choice",
    question: question.question,
    options: question.options,
    answerIndex: question.answer_index,
    rationale: question.rationale,
    source: question.source,
    difficulty: question.difficulty,
    access: "premium",
    keywords: question.keywords || []
  }));
  cachePremiumQuestions(questions, entitlement, contentVersion);
  return questions;
}

export async function syncProgress(session) {
  if (!supabase || !session?.user?.id) return { synced: false };
  const userId = session.user.id;
  const local = getLocalState();

  const [baselineResult, eventsResult, attemptsResult] = await Promise.all([
    supabase.from("progress_baselines").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("answer_events").select("*").eq("user_id", userId),
    supabase.from("quiz_attempts").select("*").eq("user_id", userId)
  ]);
  const firstError = baselineResult.error || eventsResult.error || attemptsResult.error;
  if (firstError) throw firstError;

  const cloudBaseline = baselineResult.data
    ? {
        summary: baselineResult.data.summary,
        wrongQuestionIds: baselineResult.data.wrong_question_ids || [],
        migratedAt: baselineResult.data.migrated_at
      }
    : null;
  const baseline = cloudBaseline ? mergeBaselines(local.legacyBaseline, cloudBaseline) : local.legacyBaseline;
  const answerEvents = mergeById(local.answerEvents, (eventsResult.data || []).map(eventFromCloud));
  const quizAttempts = mergeById(local.quizAttempts, (attemptsResult.data || []).map(attemptFromCloud));

  const writes = [
    supabase.from("progress_baselines").upsert({
      user_id: userId,
      summary: baseline.summary,
      wrong_question_ids: baseline.wrongQuestionIds,
      migrated_at: baseline.migratedAt,
      updated_at: new Date().toISOString()
    })
  ];
  if (answerEvents.length) {
    writes.push(supabase.from("answer_events").upsert(answerEvents.map((event) => eventToCloud(event, userId)), { ignoreDuplicates: true }));
  }
  if (quizAttempts.length) writes.push(supabase.from("quiz_attempts").upsert(quizAttempts.map((attempt) => attemptToCloud(attempt, userId))));
  const writeResults = await Promise.all(writes);
  const writeError = writeResults.find((result) => result.error)?.error;
  if (writeError) throw writeError;

  replaceSyncedData({ baseline, answerEvents, quizAttempts });
  return { synced: true, answerEvents: answerEvents.length, quizAttempts: quizAttempts.length };
}

export async function resetCloudProgress(session) {
  if (!supabase || !session?.user?.id) return;
  const userId = session.user.id;
  const emptySummary = { quizzesDone: 0, answersTotal: 0, answersCorrect: 0, categories: {} };
  const results = await Promise.all([
    supabase.from("answer_events").delete().eq("user_id", userId),
    supabase.from("quiz_attempts").delete().eq("user_id", userId),
    supabase.from("progress_baselines").upsert({
      user_id: userId,
      summary: emptySummary,
      wrong_question_ids: [],
      migrated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  ]);
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;
  writeLocalState({
    ...getLocalState(),
    legacyBaseline: { summary: emptySummary, wrongQuestionIds: [], migratedAt: new Date().toISOString() },
    answerEvents: [],
    quizAttempts: [],
    pendingAnswerEventIds: [],
    pendingAttemptIds: []
  });
}
