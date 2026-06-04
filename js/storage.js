(function () {
  const STORAGE_KEY = "uio-proprep-progress-v2";
  const LEGACY_STORAGE_KEY = "uio-proprep-progress-v1";

  const defaultProgress = {
    quizzesDone: 0,
    answersTotal: 0,
    answersCorrect: 0,
    categories: {},
    wrongQuestionIds: [],
    attempts: [],
    premiumUnlocked: false,
    lastContentVersion: null
  };

  function mergeProgress(progress) {
    return {
      ...defaultProgress,
      ...progress,
      categories: progress?.categories || {},
      wrongQuestionIds: Array.isArray(progress?.wrongQuestionIds) ? progress.wrongQuestionIds : [],
      attempts: Array.isArray(progress?.attempts) ? progress.attempts : []
    };
  }

  function readProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return mergeProgress(JSON.parse(saved));

      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const migrated = mergeProgress(JSON.parse(legacy));
        writeProgress(migrated);
        return migrated;
      }

      return { ...defaultProgress };
    } catch {
      return { ...defaultProgress };
    }
  }

  function writeProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return { ...defaultProgress };
  }

  window.ProPrepStorage = {
    readProgress,
    writeProgress,
    resetProgress
  };
})();
