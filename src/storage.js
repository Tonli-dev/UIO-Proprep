const STORAGE_KEY = "uio-proprep-storage-v3";
const V2_STORAGE_KEY = "uio-proprep-progress-v2";
const V1_STORAGE_KEY = "uio-proprep-progress-v1";

const emptySummary = () => ({
  quizzesDone: 0,
  answersTotal: 0,
  answersCorrect: 0,
  categories: {}
});

const emptyState = () => ({
  version: 3,
  legacyBaseline: {
    summary: emptySummary(),
    wrongQuestionIds: [],
    migratedAt: new Date(0).toISOString()
  },
  answerEvents: [],
  quizAttempts: [],
  pendingAnswerEventIds: [],
  pendingAttemptIds: [],
  cachedEntitlement: null,
  cachedPremiumQuestions: null,
  lastSyncAt: null,
  lastCloudPullAt: null
});

function storageAvailable() {
  return typeof localStorage !== "undefined";
}

function normalizeBaseline(baseline = {}) {
  return {
    summary: {
      ...emptySummary(),
      ...(baseline.summary || {}),
      categories: baseline.summary?.categories || {}
    },
    wrongQuestionIds: Array.isArray(baseline.wrongQuestionIds) ? baseline.wrongQuestionIds : [],
    migratedAt: baseline.migratedAt || new Date(0).toISOString()
  };
}

function normalizeState(value = {}) {
  const state = emptyState();
  return {
    ...state,
    ...value,
    version: 3,
    legacyBaseline: normalizeBaseline(value.legacyBaseline),
    answerEvents: Array.isArray(value.answerEvents) ? value.answerEvents : [],
    quizAttempts: Array.isArray(value.quizAttempts) ? value.quizAttempts : [],
    pendingAnswerEventIds: Array.isArray(value.pendingAnswerEventIds) ? value.pendingAnswerEventIds : [],
    pendingAttemptIds: Array.isArray(value.pendingAttemptIds) ? value.pendingAttemptIds : []
  };
}

function migrateLegacyProgress(progress = {}) {
  const migratedAt = new Date().toISOString();
  return normalizeState({
    legacyBaseline: {
      summary: {
        quizzesDone: progress.quizzesDone || 0,
        answersTotal: progress.answersTotal || 0,
        answersCorrect: progress.answersCorrect || 0,
        categories: progress.categories || {}
      },
      wrongQuestionIds: progress.wrongQuestionIds || [],
      migratedAt
    },
    quizAttempts: (progress.attempts || []).map((attempt) => ({
      id: attempt.id || createId(),
      mode: attempt.mode || "legacy",
      label: attempt.label || "Prethodni kviz",
      total: attempt.total || 0,
      correct: attempt.correct || 0,
      percent: attempt.percent || 0,
      passed: Boolean(attempt.passed),
      wrongQuestionIds: attempt.wrongQuestionIds || [],
      contentVersion: progress.lastContentVersion || null,
      completedAt: attempt.completedAt || attempt.date || migratedAt
    }))
  });
}

export function readLocalState() {
  if (!storageAvailable()) return emptyState();
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return normalizeState(JSON.parse(current));

    const legacy = localStorage.getItem(V2_STORAGE_KEY) || localStorage.getItem(V1_STORAGE_KEY);
    if (legacy) {
      const migrated = migrateLegacyProgress(JSON.parse(legacy));
      writeLocalState(migrated);
      localStorage.removeItem(V2_STORAGE_KEY);
      localStorage.removeItem(V1_STORAGE_KEY);
      return migrated;
    }
  } catch {
    return emptyState();
  }
  return emptyState();
}

export function writeLocalState(nextState) {
  const normalized = normalizeState(nextState);
  if (storageAvailable()) localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function updateLocalState(updater) {
  return writeLocalState(updater(readLocalState()));
}

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function mergeBaselines(localBaseline, cloudBaseline) {
  const local = normalizeBaseline(localBaseline);
  const cloud = normalizeBaseline(cloudBaseline);
  const categoryIds = new Set([
    ...Object.keys(local.summary.categories),
    ...Object.keys(cloud.summary.categories)
  ]);
  const categories = {};

  categoryIds.forEach((categoryId) => {
    const localCategory = local.summary.categories[categoryId] || {};
    const cloudCategory = cloud.summary.categories[categoryId] || {};
    categories[categoryId] = {
      total: Math.max(localCategory.total || 0, cloudCategory.total || 0),
      correct: Math.max(localCategory.correct || 0, cloudCategory.correct || 0)
    };
  });

  return {
    summary: {
      quizzesDone: Math.max(local.summary.quizzesDone, cloud.summary.quizzesDone),
      answersTotal: Math.max(local.summary.answersTotal, cloud.summary.answersTotal),
      answersCorrect: Math.max(local.summary.answersCorrect, cloud.summary.answersCorrect),
      categories
    },
    wrongQuestionIds: [...new Set([...local.wrongQuestionIds, ...cloud.wrongQuestionIds])],
    migratedAt: [local.migratedAt, cloud.migratedAt].sort().at(-1)
  };
}

export function mergeById(localItems = [], cloudItems = []) {
  return [...new Map([...cloudItems, ...localItems].map((item) => [item.id, item])).values()];
}

export function deriveWrongQuestionIds(baseline, events = []) {
  const wrongIds = new Set(normalizeBaseline(baseline).wrongQuestionIds);
  const latestByQuestion = new Map();

  [...events]
    .sort((first, second) => new Date(first.answeredAt) - new Date(second.answeredAt))
    .forEach((event) => latestByQuestion.set(event.questionId, event));

  latestByQuestion.forEach((event) => {
    if (event.isCorrect) wrongIds.delete(event.questionId);
    else wrongIds.add(event.questionId);
  });
  return [...wrongIds];
}

export function deriveProgress(localState = readLocalState()) {
  const state = normalizeState(localState);
  const summary = JSON.parse(JSON.stringify(state.legacyBaseline.summary));

  state.answerEvents.forEach((event) => {
    summary.answersTotal += 1;
    if (event.isCorrect) summary.answersCorrect += 1;
    if (!summary.categories[event.categoryId]) summary.categories[event.categoryId] = { total: 0, correct: 0 };
    summary.categories[event.categoryId].total += 1;
    if (event.isCorrect) summary.categories[event.categoryId].correct += 1;
  });

  const migratedAt = new Date(state.legacyBaseline.migratedAt).getTime();
  const newAttempts = state.quizAttempts.filter((attempt) => new Date(attempt.completedAt).getTime() > migratedAt).length;

  return {
    ...summary,
    quizzesDone: summary.quizzesDone + newAttempts,
    wrongQuestionIds: deriveWrongQuestionIds(state.legacyBaseline, state.answerEvents),
    attempts: [...state.quizAttempts]
      .sort((first, second) => new Date(second.completedAt) - new Date(first.completedAt))
      .slice(0, 12)
      .map((attempt) => ({ ...attempt, date: attempt.completedAt }))
  };
}

export function readProgress() {
  return deriveProgress();
}

export function recordAnswer({ questionId, categoryId, isCorrect, contentVersion }) {
  const event = {
    id: createId(),
    questionId,
    categoryId,
    isCorrect,
    answeredAt: new Date().toISOString(),
    contentVersion: contentVersion || null
  };
  updateLocalState((state) => ({
    ...state,
    answerEvents: [...state.answerEvents, event],
    pendingAnswerEventIds: [...new Set([...state.pendingAnswerEventIds, event.id])]
  }));
  return event;
}

export function recordAttempt(attempt) {
  const normalized = {
    ...attempt,
    id: attempt.id || createId(),
    completedAt: attempt.completedAt || new Date().toISOString()
  };
  updateLocalState((state) => ({
    ...state,
    quizAttempts: mergeById([normalized], state.quizAttempts),
    pendingAttemptIds: [...new Set([...state.pendingAttemptIds, normalized.id])]
  }));
  return normalized;
}

export function replaceSyncedData({ baseline, answerEvents, quizAttempts, syncedAt = new Date().toISOString() }) {
  return updateLocalState((state) => ({
    ...state,
    legacyBaseline: normalizeBaseline(baseline),
    answerEvents: mergeById(state.answerEvents, answerEvents),
    quizAttempts: mergeById(state.quizAttempts, quizAttempts),
    pendingAnswerEventIds: [],
    pendingAttemptIds: [],
    lastSyncAt: syncedAt,
    lastCloudPullAt: syncedAt
  }));
}

export function setCachedEntitlement(entitlement) {
  updateLocalState((state) => ({ ...state, cachedEntitlement: entitlement }));
}

export function cachePremiumQuestions(questions, entitlement, contentVersion) {
  updateLocalState((state) => ({
    ...state,
    cachedPremiumQuestions: {
      questions,
      cachedAt: new Date().toISOString(),
      entitlementExpiresAt: entitlement?.expires_at || null,
      contentVersion
    }
  }));
}

export function clearPremiumCache() {
  updateLocalState((state) => ({ ...state, cachedPremiumQuestions: null }));
}

export function clearAccountCache() {
  updateLocalState((state) => ({
    ...state,
    cachedEntitlement: null,
    cachedPremiumQuestions: null,
    lastSyncAt: null,
    lastCloudPullAt: null
  }));
}

export function getCachedPremiumQuestions(now = new Date()) {
  const cache = readLocalState().cachedPremiumQuestions;
  if (!cache) return [];

  const expiresAt = cache.entitlementExpiresAt
    ? new Date(cache.entitlementExpiresAt)
    : new Date(new Date(cache.cachedAt).getTime() + 30 * 24 * 60 * 60 * 1000);

  if (expiresAt <= now) {
    clearPremiumCache();
    return [];
  }
  return cache.questions || [];
}

export function resetLocalProgress({ keepAccountCache = true } = {}) {
  const current = readLocalState();
  const reset = emptyState();
  if (keepAccountCache) {
    reset.cachedEntitlement = current.cachedEntitlement;
    reset.cachedPremiumQuestions = current.cachedPremiumQuestions;
  }
  writeLocalState(reset);
  return deriveProgress(reset);
}

export function getLocalState() {
  return readLocalState();
}

export { STORAGE_KEY };
