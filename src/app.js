import { registerSW } from "virtual:pwa-register";
import {
  readProgress,
  recordAnswer,
  recordAttempt,
  resetLocalProgress,
  getCachedPremiumQuestions,
  clearAccountCache,
  getLocalState
} from "./storage.js";
import {
  getCurrentSession,
  onAuthStateChange,
  requestPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  updatePassword,
  updateProfile
} from "./auth.js";
import {
  getEffectiveEntitlement,
  loadAccountData,
  loadPremiumQuestions,
  resetCloudProgress,
  syncProgress
} from "./sync.js";
import { createPremiumCheckout } from "./billing.js";
import { PREMIUM_PACKAGES } from "./premium.js";

const state = {
  data: null,
  progress: readProgress(),
  session: null,
  account: null,
  entitlement: getEffectiveEntitlement(),
  premiumQuestions: [],
  activeMode: null,
  activeCategory: null,
  activeQuestions: [],
  activeAnswers: [],
  currentQuestionIndex: 0,
  currentCorrect: 0,
  selectedAnswer: null,
  flashcardIndex: 0,
  flashcardFlipped: false,
  flashcardDeck: [],
  flashcardSeenIds: new Set(),
  flashcardSourceKey: "",
  flashcardEndless: false,
  examTimerId: null,
  examSecondsRemaining: 0,
  deferredInstallPrompt: null,
  syncInProgress: false,
  checkoutInProgress: false,
  recoveryMode: false
};

const FLASHCARD_BATCH_SIZE = 10;

const selectors = {
  views: document.querySelectorAll(".view"),
  navButtons: document.querySelectorAll("[data-route]"),
  moduleGrid: document.querySelector("#module-grid"),
  modeGrid: document.querySelector("#mode-grid"),
  contentStatus: document.querySelector("#content-status"),
  progressList: document.querySelector("#progress-list"),
  statQuizzes: document.querySelector("#stat-quizzes"),
  statAnswers: document.querySelector("#stat-answers"),
  statAccuracy: document.querySelector("#stat-accuracy"),
  statFocus: document.querySelector("#stat-focus"),
  quizLobby: document.querySelector("#quiz-lobby"),
  modulePanel: document.querySelector("#module-panel"),
  quizPlayer: document.querySelector("#quiz-player"),
  quizResults: document.querySelector("#quiz-results"),
  quizCategory: document.querySelector("#quiz-category"),
  quizCounter: document.querySelector("#quiz-counter"),
  quizTimer: document.querySelector("#quiz-timer"),
  quizProgress: document.querySelector("#quiz-progress"),
  questionText: document.querySelector("#question-text"),
  answers: document.querySelector("#answers"),
  feedback: document.querySelector("#feedback"),
  nextQuestion: document.querySelector("#next-question"),
  exitQuiz: document.querySelector("#exit-quiz"),
  backToLobby: document.querySelector("#back-to-lobby"),
  retryQuiz: document.querySelector("#retry-quiz"),
  retryWrong: document.querySelector("#retry-wrong"),
  resultTitle: document.querySelector("#result-title"),
  resultSummary: document.querySelector("#result-summary"),
  resultScore: document.querySelector("#result-score"),
  resultBadge: document.querySelector("#result-badge"),
  resultDetails: document.querySelector("#result-details"),
  wrongList: document.querySelector("#wrong-list"),
  flashcard: document.querySelector("#flashcard"),
  flashcardCategory: document.querySelector("#flashcard-category"),
  flashcardQuestion: document.querySelector("#flashcard-question"),
  flashcardAnswer: document.querySelector("#flashcard-answer"),
  flashcardCount: document.querySelector("#flashcard-count"),
  flashcardStatus: document.querySelector("#flashcard-status"),
  flashcardModeStatus: document.querySelector("#flashcard-mode-status"),
  flashcardEndless: document.querySelector("#flashcard-endless"),
  previousCard: document.querySelector("#previous-card"),
  nextCard: document.querySelector("#next-card"),
  newCardSet: document.querySelector("#new-card-set"),
  guideSearch: document.querySelector("#guide-search"),
  guideList: document.querySelector("#guide-list"),
  resetProgress: document.querySelector("#reset-progress"),
  dataStatus: document.querySelector("#data-status"),
  offlineStatus: document.querySelector("#offline-status"),
  headerOfflineStatus: document.querySelector("#header-offline-status"),
  refreshApp: document.querySelector("#refresh-app"),
  contentVersion: document.querySelector("#content-version"),
  premiumStatus: document.querySelector("#premium-status"),
  syncStatus: document.querySelector("#sync-status"),
  installHelp: document.querySelector("#install-help"),
  attemptsList: document.querySelector("#attempts-list"),
  disclaimer: document.querySelector("#disclaimer"),
  installButton: document.querySelector("#install-button"),
  authButton: document.querySelector("#auth-button"),
  authModal: document.querySelector("#auth-modal"),
  authTabs: document.querySelectorAll("[data-auth-tab]"),
  loginPanel: document.querySelector("#auth-login-panel"),
  signupPanel: document.querySelector("#auth-signup-panel"),
  loginForm: document.querySelector("#login-form"),
  signupForm: document.querySelector("#signup-form"),
  googleLogin: document.querySelector("#google-login"),
  googleSignup: document.querySelector("#google-signup"),
  forgotPassword: document.querySelector("#forgot-password"),
  accountContent: document.querySelector("#account-content"),
  toast: document.querySelector("#toast")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  await loadData();
  registerServiceWorker();
  state.session = await getCurrentSession();
  if (state.session) await hydrateSignedInState();
  onAuthStateChange(handleAuthStateChange);
  renderAll();
  await handleCheckoutReturn();
}

function bindEvents() {
  selectors.navButtons.forEach((button) => {
    button.addEventListener("click", () => setRoute(button.dataset.route));
  });

  selectors.nextQuestion.addEventListener("click", nextQuestion);
  selectors.exitQuiz.addEventListener("click", showLobby);
  selectors.backToLobby.addEventListener("click", showLobby);
  selectors.retryQuiz.addEventListener("click", retryActiveQuiz);
  selectors.retryWrong.addEventListener("click", startWrongQuestionQuiz);
  selectors.resetProgress.addEventListener("click", resetProgress);
  selectors.flashcard.addEventListener("click", flipFlashcard);
  selectors.previousCard.addEventListener("click", previousFlashcard);
  selectors.nextCard.addEventListener("click", nextFlashcard);
  selectors.newCardSet.addEventListener("click", generateNewFlashcardSet);
  selectors.flashcardEndless.addEventListener("change", toggleFlashcardEndless);
  selectors.guideSearch.addEventListener("input", renderGuide);
  selectors.installButton.addEventListener("click", installApp);
  selectors.authButton.addEventListener("click", () => state.session ? setRoute("account") : selectors.authModal.showModal());
  selectors.authTabs.forEach((tab) => tab.addEventListener("click", () => setAuthTab(tab.dataset.authTab)));
  selectors.loginForm.addEventListener("submit", handleEmailLogin);
  selectors.signupForm.addEventListener("submit", handleEmailSignup);
  selectors.googleLogin.addEventListener("click", handleGoogleLogin);
  selectors.googleSignup.addEventListener("click", handleGoogleLogin);
  selectors.forgotPassword.addEventListener("click", handlePasswordResetRequest);
  window.addEventListener("online", () => {
    updateNetworkBadge();
    runSync();
  });
  window.addEventListener("offline", updateNetworkBadge);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    selectors.installButton.classList.remove("hidden");
  });
}

async function loadData() {
  selectors.dataStatus.textContent = "Učitavanje...";
  try {
    const response = await fetch("data/questions.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("Questions file not available");
    const data = await response.json();
    const validation = validateData(data);
    state.premiumQuestions = getCachedPremiumQuestions();
    state.data = { ...data, questions: [...data.questions, ...state.premiumQuestions] };

    selectors.dataStatus.textContent = validation.errors.length
      ? `Učitano uz ${validation.errors.length} upozorenja`
      : `${countQuestions()} pitanja učitano`;
    selectors.dataStatus.title = validation.errors.join("\n");
  } catch {
    state.data = {
      contentVersion: "offline-error",
      contentTarget: 150,
      exam: { questionCount: 30, durationMinutes: 45, passingPercent: 70 },
      categories: [],
      questions: [],
      flashcards: [],
      guide: [],
      disclaimer: "Pitanja nisu učitana. Provjerite konekciju ili cache."
    };
    selectors.dataStatus.textContent = "Greška pri učitavanju";
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    selectors.offlineStatus.textContent = "Nije podržano";
    selectors.headerOfflineStatus.textContent = "Offline nije podržan";
    selectors.headerOfflineStatus.className = "status-badge warning";
    selectors.installHelp.textContent = "Ovaj browser ne podržava service worker, pa offline režim nije dostupan.";
    return;
  }

  const markOfflineReady = () => {
    selectors.offlineStatus.textContent = "Spremno za offline";
    selectors.headerOfflineStatus.textContent = "Offline spremno";
    selectors.headerOfflineStatus.className = "status-badge success";
    selectors.installHelp.textContent = "Aplikacija je cacheirana. Na mobitelu koristite opciju Add to Home Screen / Install.";
  };

  const updateSW = registerSW({
    onNeedRefresh() {
      selectors.headerOfflineStatus.textContent = "Nova verzija dostupna";
      selectors.headerOfflineStatus.className = "status-badge info";
      selectors.refreshApp.classList.remove("hidden");
      selectors.refreshApp.onclick = () => updateSW(true);
    },
    onOfflineReady: markOfflineReady,
    onRegisterError() {
      selectors.offlineStatus.textContent = "Greška";
      selectors.headerOfflineStatus.textContent = "Offline greška";
      selectors.headerOfflineStatus.className = "status-badge warning";
    }
  });
  navigator.serviceWorker.ready.then(markOfflineReady).catch(() => {});
  updateNetworkBadge();
}

function renderAll() {
  renderContentStatus();
  renderModes();
  renderModules();
  renderStats();
  renderProgress();
  renderFlashcard();
  renderGuide();
  renderAttempts();
  renderPremium();
  renderAccount();
  renderAuthState();
  const lastSyncAt = getLocalState().lastSyncAt;
  selectors.syncStatus.textContent = lastSyncAt ? new Date(lastSyncAt).toLocaleString("bs-BA") : "Nije sinkronizirano";
  selectors.disclaimer.textContent = state.data.disclaimer || "";
  selectors.contentVersion.textContent = state.data.contentVersion || "N/A";
}

function setRoute(route) {
  selectors.views.forEach((view) => view.classList.toggle("active", view.id === `view-${route}`));
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });
  if (route === "account") renderAccount();
}

function renderContentStatus() {
  const total = countQuestions();
  const target = state.data.contentTarget || 150;
  const free = getAccessibleQuestions(false).length;
  const premium = state.premiumQuestions.length;
  const premiumState = hasPremiumAccess() ? "premium aktivan" : "premium zaštićen";
  const percent = target ? Math.min(100, Math.round((total / target) * 100)) : 0;

  selectors.contentStatus.innerHTML = `
    <div>
      <span class="status-label">Sadržaj</span>
      <strong>${total}/${target} pitanja</strong>
      <small>Free: ${free} dostupno · Premium: ${hasPremiumAccess() ? `${premium} učitano` : "zaštićen set"} · ${premiumState}</small>
    </div>
    <div class="status-meter"><span style="width: ${percent}%"></span></div>
  `;
}

function renderModes() {
  const wrongCount = state.progress.wrongQuestionIds.length;
  const allCount = getAccessibleQuestions().length;
  const examConfig = state.data.exam;
  const modes = [
    {
      id: "all",
      title: "Sva dostupna pitanja",
      description: "Miješana vježba kroz sve UIO oblasti.",
      meta: `${allCount} pitanja`,
      locked: false,
      action: () => startQuestionSet("all", getAccessibleQuestions(), "Sva pitanja")
    },
    {
      id: "wrong",
      title: "Samo pogrešna pitanja",
      description: "Ponovi pitanja na kojima si već pogriješio.",
      meta: `${wrongCount} za ponavljanje`,
      locked: wrongCount === 0,
      action: startWrongQuestionQuiz
    },
    {
      id: "exam",
      title: "Simulacija ispita",
      description: `${examConfig.questionCount} pitanja / ${examConfig.durationMinutes} min / prolaz ${examConfig.passingPercent}%.`,
      meta: hasPremiumAccess() ? "Premium aktivan" : "Premium",
      locked: !hasPremiumAccess(),
      action: startExam
    }
  ];

  selectors.modeGrid.innerHTML = "";
  modes.forEach((mode) => {
    const card = document.createElement("article");
    card.className = `mode-card ${mode.locked ? "locked" : ""}`;
    card.innerHTML = `
      <span class="pill ${mode.id === "exam" ? "premium-pill" : ""}">${mode.meta}</span>
      <h2>${mode.title}</h2>
      <p>${mode.description}</p>
      ${mode.locked && mode.id === "exam" ? `<small class="card-note">Premium simulacija je zaključana u free verziji.</small>` : ""}
      <button class="${mode.locked ? "ghost-button" : "primary-button"}" type="button">
        ${mode.locked && mode.id === "exam" ? "Provjeri na računu" : mode.locked ? "Nije dostupno" : "Pokreni"}
      </button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      if (mode.locked && mode.id === "exam") {
        setRoute("account");
        return;
      }
      if (!mode.locked) mode.action();
    });
    selectors.modeGrid.appendChild(card);
  });
}

function renderModules() {
  selectors.moduleGrid.innerHTML = "";

  if (!state.data.categories.length) {
    selectors.moduleGrid.innerHTML = `<div class="empty-state">Nema učitanih oblasti. Provjerite <code>public/data/questions.json</code>.</div>`;
    return;
  }

  state.data.categories.forEach((category) => {
    const questions = getAccessibleQuestions().filter((question) => question.categoryId === category.id);
    const card = document.createElement("article");
    card.className = `module-card module-${category.id}`;
    card.innerHTML = `
      <span class="pill">${questions.length} dostupno</span>
      <h2>${category.title}</h2>
      <p>${category.description}</p>
      ${!hasPremiumAccess() ? `<small class="card-note premium-note">Premium pitanja se učitavaju tek nakon potvrde prava.</small>` : ""}
      <button class="primary-button" type="button" ${questions.length ? "" : "disabled"}>Započni modul</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      if (questions.length) startQuestionSet("category", questions, category.title, category);
    });
    selectors.moduleGrid.appendChild(card);
  });
}

function startQuestionSet(mode, questions, label, category = null, options = {}) {
  const availableQuestions = questions.filter(Boolean);
  if (!availableQuestions.length) {
    showLobbyMessage("Nema dostupnih pitanja za ovaj režim.");
    return;
  }

  clearExamTimer();
  state.activeMode = mode;
  state.activeCategory = category;
  state.activeQuestions = getRandomizedQuestionOrder(availableQuestions);
  state.activeAnswers = [];
  state.currentQuestionIndex = 0;
  state.currentCorrect = 0;
  state.selectedAnswer = null;

  selectors.quizLobby.classList.add("hidden");
  selectors.modulePanel.classList.add("hidden");
  selectors.quizResults.classList.add("hidden");
  selectors.quizPlayer.classList.remove("hidden");
  selectors.quizCategory.textContent = label;

  if (options.examSeconds) {
    startExamTimer(options.examSeconds);
  } else {
    selectors.quizTimer.classList.add("hidden");
  }

  renderQuestion();
}

function startWrongQuestionQuiz() {
  const wrongQuestions = state.progress.wrongQuestionIds
    .map((id) => state.data.questions.find((question) => question.id === id))
    .filter((question) => question && canAccess(question));

  startQuestionSet("wrong", wrongQuestions, "Pogrešna pitanja");
}

function startExam() {
  if (!hasPremiumAccess()) {
    setRoute("account");
    return;
  }

  const examConfig = state.data.exam;
  const examQuestions = buildBalancedExamQuestions(getAccessibleQuestions(), examConfig.questionCount);
  startQuestionSet("exam", examQuestions, "Simulacija ispita", null, {
    examSeconds: examConfig.durationMinutes * 60
  });
}

function renderQuestion() {
  const question = getCurrentQuestion();
  if (!question) return finishQuiz();

  const current = state.currentQuestionIndex + 1;
  const total = state.activeQuestions.length;

  state.selectedAnswer = null;
  selectors.nextQuestion.disabled = true;
  selectors.feedback.className = "feedback hidden";
  selectors.feedback.textContent = "";
  selectors.quizCounter.textContent = `Pitanje ${current}/${total}`;
  selectors.quizProgress.style.width = `${(current / total) * 100}%`;
  selectors.questionText.textContent = question.question;
  selectors.answers.innerHTML = "";

  if (!hasValidMultipleChoiceOptions(question)) {
    const prompt = document.createElement("div");
    prompt.className = "recall-card";
    prompt.innerHTML = `
      <span class="pill">Aktivno prisjećanje</span>
      <p>Prisjeti se odgovora prije nego što ga otkriješ. Nakon toga iskreno označi da li si znao/la odgovor.</p>
      <button class="primary-button reveal-answer-button" type="button">Prikaži tačan odgovor</button>
    `;
    prompt.querySelector("button").addEventListener("click", () => revealDirectAnswer(question));
    selectors.answers.appendChild(prompt);
    return;
  }

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.innerHTML = `
      <span class="answer-text">${escapeHtml(option)}</span>
      <span class="answer-icon" aria-hidden="true">✓</span>
    `;
    button.addEventListener("click", () => selectAnswer(index));
    selectors.answers.appendChild(button);
  });
}

function revealDirectAnswer(question) {
  selectors.feedback.className = "feedback";
  selectors.feedback.innerHTML = `
    <div class="feedback-icon">i</div>
    <div>
      <h3>Tačan odgovor</h3>
      <p>${escapeHtml(getCorrectAnswer(question))}</p>
      <small>${escapeHtml(question.source || "Izvor će biti dodan u finalnoj bazi pitanja.")}</small>
    </div>
  `;
  selectors.answers.innerHTML = `
    <div class="self-assessment">
      <button class="answer-button self-assess-button review" type="button">
        <span class="answer-text">Nisam znao/la, ponovi pitanje</span>
        <span class="answer-icon" aria-hidden="true">×</span>
      </button>
      <button class="answer-button self-assess-button known" type="button">
        <span class="answer-text">Znao/la sam odgovor</span>
        <span class="answer-icon" aria-hidden="true">✓</span>
      </button>
    </div>
  `;
  selectors.answers.querySelector(".review").addEventListener("click", () => assessDirectAnswer(false));
  selectors.answers.querySelector(".known").addEventListener("click", () => assessDirectAnswer(true));
}

function assessDirectAnswer(isCorrect) {
  if (state.selectedAnswer !== null) return;

  const question = getCurrentQuestion();
  state.selectedAnswer = isCorrect ? "known" : "review";
  if (isCorrect) state.currentCorrect += 1;
  state.activeAnswers.push({
    questionId: question.id,
    categoryId: question.categoryId,
    selectedIndex: null,
    correctIndex: null,
    isCorrect
  });

  [...selectors.answers.querySelectorAll(".self-assess-button")].forEach((button) => {
    button.disabled = true;
    if (button.classList.contains(isCorrect ? "known" : "review")) {
      button.classList.add(isCorrect ? "correct" : "incorrect");
    }
  });
  selectors.feedback.querySelector("h3").textContent = isCorrect ? "Odlično, odgovor je usvojen" : "Dodano za ponavljanje";
  selectors.nextQuestion.disabled = false;
  updateProgressForAnswer(question, isCorrect);
}

function selectAnswer(answerIndex) {
  if (state.selectedAnswer !== null) return;

  const question = getCurrentQuestion();
  const isCorrect = answerIndex === question.answerIndex;
  state.selectedAnswer = answerIndex;
  if (isCorrect) state.currentCorrect += 1;

  state.activeAnswers.push({
    questionId: question.id,
    categoryId: question.categoryId,
    selectedIndex: answerIndex,
    correctIndex: question.answerIndex,
    isCorrect
  });

  [...selectors.answers.children].forEach((button, index) => {
    button.disabled = true;
    if (index === question.answerIndex) button.classList.add("correct");
    if (index === answerIndex && !isCorrect) button.classList.add("incorrect");
    if (index === answerIndex) button.classList.add("selected");
  });

  selectors.feedback.className = `feedback ${isCorrect ? "success" : "warning"}`;
  selectors.feedback.innerHTML = `
    <div class="feedback-icon">${isCorrect ? "✓" : "!"}</div>
    <div>
      <h3>${isCorrect ? "Tačno!" : "Obratite pažnju"}</h3>
      <p>${escapeHtml(question.rationale)}</p>
      <small>${escapeHtml(question.source || "Izvor će biti dodan u finalnoj bazi pitanja.")}</small>
    </div>
  `;
  selectors.feedback.classList.remove("hidden");
  selectors.nextQuestion.disabled = false;

  updateProgressForAnswer(question, isCorrect);
}

function nextQuestion() {
  if (state.currentQuestionIndex < state.activeQuestions.length - 1) {
    state.currentQuestionIndex += 1;
    renderQuestion();
    return;
  }

  finishQuiz();
}

function finishQuiz() {
  clearExamTimer();

  const total = state.activeQuestions.length;
  const percent = total ? Math.round((state.currentCorrect / total) * 100) : 0;
  const passingPercent = state.data.exam.passingPercent;
  const passed = percent >= passingPercent;
  const answeredQuestionIds = new Set(state.activeAnswers.map((answer) => answer.questionId));
  const unansweredAnswers = state.activeQuestions
    .filter((question) => !answeredQuestionIds.has(question.id))
    .map((question) => ({
      questionId: question.id,
      categoryId: question.categoryId,
      selectedIndex: null,
      correctIndex: question.answerIndex,
      isCorrect: false
    }));
  const wrongAnswers = [
    ...state.activeAnswers.filter((answer) => !answer.isCorrect),
    ...unansweredAnswers
  ];

  recordAttempt({
    mode: state.activeMode,
    label: getActiveModeLabel(),
    total,
    correct: state.currentCorrect,
    percent,
    passed,
    wrongQuestionIds: wrongAnswers.map((answer) => answer.questionId),
    contentVersion: state.data.contentVersion
  });
  state.progress = readProgress();
  scheduleSync();
  renderStats();
  renderProgress();
  renderAttempts();
  renderModes();

  selectors.resultTitle.textContent = passed ? "Odlično, prolaz!" : "Treba još ponavljanja";
  selectors.resultSummary.textContent = `Tačno: ${state.currentCorrect}/${total} (${percent}%). Minimalno za prolaz: ${passingPercent}%.`;
  selectors.resultScore.textContent = `${percent}%`;
  selectors.resultScore.className = `result-score ${passed ? "passed" : "failed"}`;
  selectors.resultBadge.textContent = passed ? "Položeno" : "Nije položeno";
  selectors.resultBadge.className = `result-badge ${passed ? "passed" : "failed"}`;
  selectors.resultDetails.innerHTML = `
    <article><span>Režim</span><strong>${getActiveModeLabel()}</strong></article>
    <article><span>Pogrešno</span><strong>${wrongAnswers.length}</strong></article>
    <article><span>Status</span><strong>${passed ? "Položeno" : "Nije položeno"}</strong></article>
  `;
  renderWrongList(wrongAnswers);

  selectors.retryWrong.classList.toggle("hidden", !state.progress.wrongQuestionIds.length);
  selectors.quizPlayer.classList.add("hidden");
  selectors.quizResults.classList.remove("hidden");
}

function showLobby() {
  clearExamTimer();
  selectors.quizPlayer.classList.add("hidden");
  selectors.quizResults.classList.add("hidden");
  selectors.quizLobby.classList.remove("hidden");
  selectors.modulePanel.classList.remove("hidden");
}

function showLobbyMessage(message) {
  selectors.quizLobby.classList.remove("hidden");
  selectors.modulePanel.classList.remove("hidden");
  selectors.quizPlayer.classList.add("hidden");
  selectors.quizResults.classList.add("hidden");
  selectors.moduleGrid.insertAdjacentHTML("afterbegin", `<div class="empty-state">${escapeHtml(message)}</div>`);
}

function retryActiveQuiz() {
  if (state.activeMode === "exam") return startExam();
  if (state.activeMode === "wrong") return startWrongQuestionQuiz();
  if (state.activeMode === "all") return startQuestionSet("all", getAccessibleQuestions(), "Sva pitanja");
  if (state.activeCategory) {
    const questions = getAccessibleQuestions().filter((question) => question.categoryId === state.activeCategory.id);
    return startQuestionSet("category", questions, state.activeCategory.title, state.activeCategory);
  }
  showLobby();
}

function updateProgressForAnswer(question, isCorrect) {
  recordAnswer({
    questionId: question.id,
    categoryId: question.categoryId,
    isCorrect,
    contentVersion: state.data.contentVersion
  });
  state.progress = readProgress();
  scheduleSync();
  renderStats();
  renderProgress();
}

function renderStats() {
  const accuracy = state.progress.answersTotal
    ? Math.round((state.progress.answersCorrect / state.progress.answersTotal) * 100)
    : 0;

  selectors.statQuizzes.textContent = state.progress.quizzesDone;
  selectors.statAnswers.textContent = state.progress.answersTotal;
  selectors.statAccuracy.textContent = `${accuracy}%`;
  selectors.statFocus.textContent = getFocusArea();
}

function renderProgress() {
  selectors.progressList.innerHTML = "";

  state.data.categories.forEach((category) => {
    const categoryProgress = state.progress.categories[category.id] || { total: 0, correct: 0 };
    const percent = categoryProgress.total
      ? Math.round((categoryProgress.correct / categoryProgress.total) * 100)
      : 0;

    const item = document.createElement("div");
    item.className = "progress-item";
    item.innerHTML = `
      <div class="progress-label">
        <span>${escapeHtml(category.title)}</span>
        <strong>${percent}%</strong>
      </div>
      <div class="progress-track"><span style="width: ${percent}%"></span></div>
    `;
    selectors.progressList.appendChild(item);
  });
}

async function resetProgress() {
  const scope = state.session ? "lokalni i sinkronizirani napredak" : "lokalni napredak i historiju";
  const confirmed = window.confirm(`Resetovati sav ${scope}?`);
  if (!confirmed) return;

  try {
    if (state.session) await resetCloudProgress(state.session);
    state.progress = resetLocalProgress();
    showToast("Napredak je resetovan.");
  } catch (error) {
    showToast(getFriendlyError(error), "error");
  }
  renderAll();
}

function renderFlashcard() {
  ensureFlashcardDeck();
  const cards = state.flashcardDeck;
  const card = cards[state.flashcardIndex] || cards[0];
  if (!card) {
    selectors.flashcardQuestion.textContent = "Nema dostupnih kartica.";
    selectors.flashcardAnswer.textContent = "Dodajte kartice u public/data/questions.json.";
    selectors.flashcardCount.textContent = "0/0";
    selectors.flashcardStatus.textContent = "Nema dostupnih kartica";
    selectors.flashcardModeStatus.textContent = "";
    selectors.previousCard.disabled = true;
    selectors.nextCard.disabled = true;
    selectors.newCardSet.disabled = true;
    return;
  }

  const category = state.data.categories.find((item) => item.id === card.categoryId);
  const isLastCard = state.flashcardIndex >= cards.length - 1;
  const questionText = capitalizeFirstLetter(card.question);
  const answerText = capitalizeFirstLetter(card.answer);
  selectors.flashcard.classList.toggle("flipped", state.flashcardFlipped);
  selectors.flashcardCategory.textContent = category?.title || "Oblast";
  selectors.flashcardQuestion.textContent = questionText;
  selectors.flashcardAnswer.textContent = answerText;
  setFlashcardTextSize(selectors.flashcardQuestion, questionText);
  setFlashcardTextSize(selectors.flashcardAnswer, answerText);
  selectors.flashcardCount.textContent = state.flashcardEndless
    ? `${state.flashcardIndex + 1}. kartica`
    : `${state.flashcardIndex + 1}/${cards.length}`;
  selectors.flashcardStatus.textContent = state.flashcardEndless
    ? `Beskonačni mod · ${cards.length} učitano`
    : `${cards.length} nasumičnih kartica`;
  selectors.flashcardModeStatus.textContent = state.flashcardEndless
    ? "Sljedeće kartice se same dodaju bez osvježavanja."
    : isLastCard
      ? "Možete generirati novih 10 kartica."
      : "Novi set je dostupan nakon zadnje kartice.";
  selectors.flashcardEndless.checked = state.flashcardEndless;
  selectors.previousCard.disabled = state.flashcardIndex === 0;
  selectors.nextCard.disabled = isLastCard && !state.flashcardEndless;
  selectors.newCardSet.disabled = !isLastCard || state.flashcardEndless;
}

function flipFlashcard() {
  state.flashcardFlipped = !state.flashcardFlipped;
  renderFlashcard();
}

function previousFlashcard() {
  ensureFlashcardDeck();
  if (!state.flashcardDeck.length || state.flashcardIndex === 0) return;
  state.flashcardIndex -= 1;
  state.flashcardFlipped = false;
  renderFlashcard();
}

function nextFlashcard() {
  ensureFlashcardDeck();
  if (!state.flashcardDeck.length) return;
  const isLastCard = state.flashcardIndex >= state.flashcardDeck.length - 1;
  if (isLastCard) {
    if (!state.flashcardEndless) return;
    appendFlashcardBatch();
  }
  if (state.flashcardIndex < state.flashcardDeck.length - 1) state.flashcardIndex += 1;
  state.flashcardFlipped = false;
  renderFlashcard();
}

function generateNewFlashcardSet() {
  resetFlashcardDeck();
  renderFlashcard();
}

function toggleFlashcardEndless() {
  state.flashcardEndless = selectors.flashcardEndless.checked;
  renderFlashcard();
}

function setFlashcardTextSize(element, text) {
  const length = String(text || "").length;
  let size = "1.55rem";
  if (length > 700) size = "0.95rem";
  else if (length > 420) size = "1.05rem";
  else if (length > 260) size = "1.15rem";
  else if (length > 160) size = "1.3rem";
  element.style.setProperty("--flashcard-text-size", size);
}

function capitalizeFirstLetter(value) {
  return String(value || "").replace(/\p{L}/u, (letter) => letter.toLocaleUpperCase("bs-BA"));
}

function renderGuide() {
  const query = selectors.guideSearch.value.trim().toLowerCase();
  const searchableQuestions = state.data.questions.filter((question) => {
    const content = [
      question.question,
      question.options?.join(" ") || "",
      question.answer || "",
      question.rationale,
      question.source,
      question.keywords?.join(" ")
    ].join(" ").toLowerCase();
    return content.includes(query);
  });

  selectors.guideList.innerHTML = "";

  state.data.guide
    .filter((item) => {
      const content = `${item.title} ${item.keywords} ${item.body}`.toLowerCase();
      return content.includes(query);
    })
    .forEach((item) => {
      const guideItem = document.createElement("article");
      guideItem.className = "guide-item";
      guideItem.innerHTML = `<h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.body)}</p>`;
      selectors.guideList.appendChild(guideItem);
    });

  searchableQuestions.slice(0, 20).forEach((question) => {
    const category = getCategory(question.categoryId);
    const isLockedPremium = question.access === "premium" && !hasPremiumAccess();
    const questionItem = document.createElement("article");
    questionItem.className = `guide-item question-result ${isLockedPremium ? "locked-result" : ""}`;
    questionItem.innerHTML = `
      <span class="pill">${escapeHtml(category?.title || "Pitanje")}</span>
      ${question.access === "premium" ? `<span class="premium-label">Premium</span>` : ""}
      <h2>${escapeHtml(question.question)}</h2>
      <p>${isLockedPremium ? "Ovo pitanje je dio premium seta. Prijavite se kako bi aplikacija provjerila pravo pristupa." : escapeHtml(question.rationale)}</p>
      ${isLockedPremium ? `<button class="ghost-button inline-cta" type="button">Otvori račun</button>` : ""}
      <small>${escapeHtml(question.source)}</small>
    `;
    questionItem.querySelector(".inline-cta")?.addEventListener("click", () => setRoute("account"));
    selectors.guideList.appendChild(questionItem);
  });

  if (!selectors.guideList.children.length) {
    selectors.guideList.innerHTML = `<div class="empty-state">Nema rezultata za pretragu.</div>`;
  }
}

function renderWrongList(wrongAnswers) {
  selectors.wrongList.innerHTML = "";
  if (!wrongAnswers.length) {
    selectors.wrongList.innerHTML = `<div class="empty-state success-state">Nema pogrešnih odgovora u ovom pokušaju.</div>`;
    return;
  }

  wrongAnswers.forEach((answer) => {
    const question = state.data.questions.find((item) => item.id === answer.questionId);
    if (!question) return;
    const item = document.createElement("article");
    item.className = "wrong-item";
    item.innerHTML = `
      <h3>${escapeHtml(question.question)}</h3>
      <p><strong>Tačno:</strong> ${escapeHtml(getCorrectAnswer(question))}</p>
      <small>${escapeHtml(question.rationale)}</small>
    `;
    selectors.wrongList.appendChild(item);
  });
}

function renderAttempts() {
  selectors.attemptsList.innerHTML = "";
  if (!state.progress.attempts.length) {
    selectors.attemptsList.innerHTML = `<div class="empty-state">Historija pokušaja će se pojaviti nakon prvog kviza.</div>`;
    return;
  }

  state.progress.attempts.forEach((attempt) => {
    const item = document.createElement("article");
    item.className = `attempt-item ${attempt.passed ? "passed" : ""}`;
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(attempt.label)}</strong>
        <small>${new Date(attempt.date).toLocaleString("bs-BA")}</small>
      </div>
      <span>${attempt.correct}/${attempt.total} · ${attempt.percent}%</span>
    `;
    selectors.attemptsList.appendChild(item);
  });
}

function renderPremium() {
  selectors.premiumStatus.textContent = hasPremiumAccess() ? "Premium aktivan" : "Free verzija";
  selectors.premiumStatus.classList.toggle("premium-on", hasPremiumAccess());
  renderContentStatus();
}

async function installApp() {
  if (!state.deferredInstallPrompt) return;

  state.deferredInstallPrompt.prompt();
  await state.deferredInstallPrompt.userChoice;
  state.deferredInstallPrompt = null;
  selectors.installButton.classList.add("hidden");
}

function hasPremiumAccess() {
  return Boolean(state.entitlement?.active);
}

function setAuthTab(tabName) {
  selectors.authTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.authTab === tabName));
  selectors.loginPanel.classList.toggle("active", tabName === "login");
  selectors.signupPanel.classList.toggle("active", tabName === "signup");
}

async function handleEmailLogin(event) {
  event.preventDefault();
  try {
    const form = new FormData(event.currentTarget);
    const { error } = await signInWithEmail(form.get("email"), form.get("password"));
    if (error) throw error;
    selectors.authModal.close();
    showToast("Prijava je uspješna.");
  } catch (error) {
    showToast(getFriendlyError(error), "error");
  }
}

async function handleEmailSignup(event) {
  event.preventDefault();
  try {
    const form = new FormData(event.currentTarget);
    const { error } = await signUpWithEmail(form.get("email"), form.get("password"));
    if (error) throw error;
    selectors.authModal.close();
    showToast("Provjerite email i potvrdite registraciju.");
  } catch (error) {
    showToast(getFriendlyError(error), "error");
  }
}

async function handleGoogleLogin() {
  try {
    const { error } = await signInWithGoogle();
    if (error) throw error;
  } catch (error) {
    showToast(getFriendlyError(error), "error");
  }
}

async function handlePasswordResetRequest() {
  const email = selectors.loginForm.elements.email.value;
  if (!email) return showToast("Prvo unesite email adresu.", "error");
  try {
    const { error } = await requestPasswordReset(email);
    if (error) throw error;
    selectors.authModal.close();
    showToast("Poslan je link za promjenu lozinke.");
  } catch (error) {
    showToast(getFriendlyError(error), "error");
  }
}

async function handleAuthStateChange(event, session) {
  state.session = session;
  if (event === "PASSWORD_RECOVERY") {
    state.recoveryMode = true;
    setRoute("account");
    showToast("Unesite novu lozinku na stranici Račun.");
  }
  if (session) await hydrateSignedInState();
  else {
    state.account = null;
    state.entitlement = { tier: "free", active: false };
    state.premiumQuestions = [];
    clearAccountCache();
    if (state.data) state.data.questions = state.data.questions.filter((question) => question.access !== "premium");
  }
  state.progress = readProgress();
  if (state.data) renderAll();
}

async function hydrateSignedInState() {
  try {
    state.account = await loadAccountData(state.session.user.id);
    state.entitlement = getEffectiveEntitlement();
    state.premiumQuestions = await loadPremiumQuestions(state.account?.entitlement, state.data?.contentVersion);
    if (state.data) {
      const freeQuestions = state.data.questions.filter((question) => question.access !== "premium");
      state.data.questions = [...freeQuestions, ...state.premiumQuestions];
    }
    await runSync();
  } catch (error) {
    state.entitlement = getEffectiveEntitlement();
    state.premiumQuestions = getCachedPremiumQuestions();
    showToast(`Offline rad je nastavljen. ${getFriendlyError(error)}`, "error");
  }
}

let syncTimer;
function scheduleSync() {
  if (!state.session || !navigator.onLine) return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(runSync, 900);
}

async function runSync() {
  if (!state.session || !navigator.onLine || state.syncInProgress) return;
  state.syncInProgress = true;
  renderAccount();
  try {
    await syncProgress(state.session);
    state.progress = readProgress();
    renderStats();
    renderProgress();
    renderAttempts();
  } catch (error) {
    showToast(`Sinkronizacija će se pokušati ponovo. ${getFriendlyError(error)}`, "error");
  } finally {
    state.syncInProgress = false;
    renderAccount();
  }
}

function renderAuthState() {
  selectors.authButton.textContent = state.session ? "Račun" : "Prijavi se";
}

function renderAccount() {
  if (!selectors.accountContent) return;
  if (!state.session) {
    selectors.accountContent.innerHTML = `
      <p class="eyebrow">Gost način rada</p>
      <h1>Free aplikacija radi i bez računa.</h1>
      <p class="muted">Prijavom dobivate sinkronizaciju napretka između uređaja i provjeru premium prava. Free pitanja ostaju dostupna offline.</p>
      <button class="primary-button" id="account-login" type="button">Prijavi se ili registriraj</button>
      ${renderPremiumPlans({ disabled: true })}
      <p class="muted launch-note">UIO ProPrep je nezavisni obrazovni alat. Ne garantuje prolaz na ispitu i nije zvanično povezan s Upravom za indirektno oporezivanje BiH.</p>
    `;
    selectors.accountContent.querySelector("#account-login").addEventListener("click", () => selectors.authModal.showModal());
    selectors.accountContent.querySelectorAll("[data-package-id]").forEach((button) => {
      button.addEventListener("click", () => selectors.authModal.showModal());
    });
    return;
  }

  const user = state.session.user;
  const profile = state.account?.profile;
  const provider = user.app_metadata?.provider === "google" ? "Google" : "Email i lozinka";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const entitlement = state.account?.entitlement;
  const expires = entitlement?.expires_at ? new Date(entitlement.expires_at).toLocaleDateString("bs-BA") : "Bez datuma isteka";
  const lastSync = getLocalState().lastSyncAt;

  selectors.accountContent.innerHTML = `
    <div class="account-hero">
      ${avatarUrl ? `<img class="account-avatar" src="${escapeHtml(avatarUrl)}" alt="">` : `<span class="account-avatar account-initial">${escapeHtml(user.email?.[0]?.toUpperCase() || "U")}</span>`}
      <div><p class="eyebrow">Prijavljeni račun</p><h1>${escapeHtml(profile?.display_name || user.email)}</h1><p class="muted">${escapeHtml(user.email)}</p></div>
    </div>
    <div class="account-grid">
      <article><span>Prijava</span><strong>${provider}</strong></article>
      <article><span>Status</span><strong>${hasPremiumAccess() ? "Premium" : "Free"}</strong></article>
      <article><span>Ističe</span><strong>${hasPremiumAccess() ? expires : "Nije primjenjivo"}</strong></article>
      <article><span>Zadnji sync</span><strong>${lastSync ? new Date(lastSync).toLocaleString("bs-BA") : "Nije sinkronizirano"}</strong></article>
    </div>
    <form class="profile-form" id="profile-form">
      <label>Prikazno ime<input class="search-input" name="displayName" value="${escapeHtml(profile?.display_name || "")}" placeholder="Vaše ime"></label>
      <button class="ghost-button" type="submit">Sačuvaj ime</button>
    </form>
    ${provider === "Email i lozinka" || state.recoveryMode ? `
      <form class="profile-form" id="password-form">
        <label>Nova lozinka<input class="search-input" name="password" type="password" minlength="8" required></label>
        <button class="ghost-button" type="submit">Promijeni lozinku</button>
      </form>
    ` : ""}
    <div class="account-actions">
      <button class="primary-button" id="manual-sync" type="button" ${state.syncInProgress ? "disabled" : ""}>${state.syncInProgress ? "Sinkroniziram..." : "Sinkroniziraj sada"}</button>
      <button class="ghost-button" id="logout" type="button">Odjavi se</button>
    </div>
    ${renderPremiumPlans({ entitlement })}
    <p class="muted launch-note">UIO ProPrep je nezavisni obrazovni alat. Ne garantuje prolaz na ispitu i nije zvanično povezan s Upravom za indirektno oporezivanje BiH.</p>
  `;

  selectors.accountContent.querySelector("#manual-sync").addEventListener("click", runSync);
  selectors.accountContent.querySelector("#logout").addEventListener("click", async () => {
    const { error } = await signOut();
    if (error) showToast(getFriendlyError(error), "error");
  });
  selectors.accountContent.querySelector("#profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const { error } = await updateProfile(new FormData(event.currentTarget).get("displayName"));
    if (error) return showToast(getFriendlyError(error), "error");
    state.account = await loadAccountData(user.id);
    renderAccount();
    showToast("Prikazno ime je sačuvano.");
  });
  selectors.accountContent.querySelector("#password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const { error } = await updatePassword(new FormData(event.currentTarget).get("password"));
    if (error) return showToast(getFriendlyError(error), "error");
    state.recoveryMode = false;
    renderAccount();
    showToast("Lozinka je promijenjena.");
  });
  selectors.accountContent.querySelectorAll("[data-package-id]").forEach((button) => {
    button.addEventListener("click", () => handlePremiumCheckout(button.dataset.packageId));
  });
}

function renderPremiumPlans({ entitlement = null, disabled = false } = {}) {
  const isPremium = hasPremiumAccess();
  const expires = entitlement?.expires_at ? new Date(entitlement.expires_at).toLocaleDateString("bs-BA") : null;
  const statusText = isPremium
    ? expires ? `Premium aktivan do ${expires}.` : "Premium aktivan bez datuma isteka."
    : "Premium otključava svih 180 pitanja, simulaciju ispita i zaštićeni premium set.";

  return `
    <section class="premium-plans" aria-label="Premium paketi">
      <div class="premium-plans-header">
        <div>
          <p class="eyebrow">Premium pristup</p>
          <h2>Odaberi paket za pripremu</h2>
          <p class="muted">${statusText}</p>
        </div>
      </div>
      <div class="pricing-grid">
        ${PREMIUM_PACKAGES.map((plan) => `
          <article class="pricing-card ${plan.id === "premium_90_days" ? "featured" : ""}">
            <span class="premium-label">${escapeHtml(plan.badge)}</span>
            <h3>${escapeHtml(plan.title)}</h3>
            <strong>${escapeHtml(plan.price)}</strong>
            <p>${escapeHtml(plan.description)}</p>
            <button class="${plan.id === "premium_90_days" ? "primary-button" : "ghost-button"}" data-package-id="${escapeHtml(plan.id)}" type="button" ${state.checkoutInProgress ? "disabled" : ""}>
              ${disabled ? "Prijavi se za kupovinu" : state.checkoutInProgress ? "Pripremam checkout..." : isPremium ? "Produži pristup" : "Kupi premium"}
            </button>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

async function handlePremiumCheckout(packageId) {
  if (!state.session) {
    selectors.authModal.showModal();
    return;
  }
  if (state.checkoutInProgress) return;

  state.checkoutInProgress = true;
  renderAccount();
  try {
    const checkoutUrl = await createPremiumCheckout(packageId, state.data?.contentVersion);
    window.location.assign(checkoutUrl);
  } catch (error) {
    state.checkoutInProgress = false;
    renderAccount();
    showToast(getFriendlyError(error), "error");
  }
}

async function handleCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  const checkoutState = params.get("checkout");
  if (!checkoutState) return;

  window.history.replaceState({}, "", window.location.pathname + window.location.hash);
  if (checkoutState === "success") {
    if (state.session) {
      await hydrateSignedInState();
      renderAll();
    }
    showToast("Kupovina je primljena. Premium status će se osvježiti čim webhook potvrdi uplatu.");
    setRoute("account");
    return;
  }

  if (checkoutState === "cancelled") {
    showToast("Checkout je otkazan. Premium možete kupiti kada budete spremni.", "error");
    setRoute("account");
  }
}

function updateNetworkBadge() {
  if (!navigator.onLine) {
    selectors.headerOfflineStatus.textContent = "Offline način";
    selectors.headerOfflineStatus.className = "status-badge warning";
  }
}

function showToast(message, type = "success") {
  selectors.toast.textContent = message;
  selectors.toast.className = `toast ${type}`;
  window.setTimeout(() => selectors.toast.classList.add("hidden"), 4200);
}

function getFriendlyError(error) {
  const message = String(error?.message || error || "");
  if (message.includes("Invalid login credentials")) return "Email ili lozinka nisu ispravni.";
  if (message.includes("Email not confirmed")) return "Prvo potvrdite email adresu.";
  if (message.includes("already registered")) return "Račun s ovim emailom već postoji.";
  if (message.includes("Supabase još nije konfiguriran")) return message;
  if (message.includes("Lemon Squeezy")) return "Premium kupovina još nije produkcijski konfigurirana.";
  if (message.includes("Odabrani premium paket")) return message;
  if (message.includes("Checkout link")) return "Checkout link trenutno nije dostupan. Pokušajte ponovo.";
  if (message.includes("Failed to fetch")) return "Trenutno nema veze sa serverom.";
  return "Akcija trenutno nije uspjela. Pokušajte ponovo.";
}

function startExamTimer(seconds) {
  state.examSecondsRemaining = seconds;
  selectors.quizTimer.classList.remove("hidden");
  updateTimerText();
  state.examTimerId = window.setInterval(() => {
    state.examSecondsRemaining -= 1;
    updateTimerText();
    if (state.examSecondsRemaining <= 0) finishQuiz();
  }, 1000);
}

function updateTimerText() {
  const minutes = Math.floor(state.examSecondsRemaining / 60).toString().padStart(2, "0");
  const seconds = (state.examSecondsRemaining % 60).toString().padStart(2, "0");
  selectors.quizTimer.textContent = `${minutes}:${seconds}`;
}

function clearExamTimer() {
  if (state.examTimerId) window.clearInterval(state.examTimerId);
  state.examTimerId = null;
  state.examSecondsRemaining = 0;
  selectors.quizTimer.classList.add("hidden");
}

function getCurrentQuestion() {
  return state.activeQuestions[state.currentQuestionIndex];
}

function countQuestions() {
  return state.data.questions.length;
}

function getCategory(categoryId) {
  return state.data.categories.find((category) => category.id === categoryId);
}

function getAccessibleQuestions(includePremium = hasPremiumAccess()) {
  return state.data.questions.filter((question) => includePremium || question.access !== "premium");
}

function ensureFlashcardDeck() {
  const sourceKey = getAccessibleFlashcards()
    .map((card) => getFlashcardUniqueId(card))
    .sort()
    .join("|");

  if (state.flashcardSourceKey !== sourceKey) {
    resetFlashcardDeck(sourceKey);
    return;
  }

  if (!state.flashcardDeck.length) appendFlashcardBatch();
}

function resetFlashcardDeck(sourceKey = null) {
  state.flashcardIndex = 0;
  state.flashcardFlipped = false;
  state.flashcardDeck = [];
  state.flashcardSeenIds = new Set();
  state.flashcardSourceKey = sourceKey ?? getAccessibleFlashcards()
    .map((card) => getFlashcardUniqueId(card))
    .sort()
    .join("|");
  appendFlashcardBatch();
}

function appendFlashcardBatch() {
  const nextCards = pickRandomFlashcards(FLASHCARD_BATCH_SIZE);
  state.flashcardDeck = [...state.flashcardDeck, ...nextCards];
}

function pickRandomFlashcards(count) {
  const cards = getAccessibleFlashcards();
  if (!cards.length) return [];

  const selected = [];
  const selectedIds = new Set();
  const requestedCount = Math.min(count, cards.length);

  while (selected.length < requestedCount) {
    let available = cards.filter((card) => {
      const cardId = getFlashcardUniqueId(card);
      return !state.flashcardSeenIds.has(cardId) && !selectedIds.has(cardId);
    });

    if (!available.length) {
      state.flashcardSeenIds = new Set();
      available = cards.filter((card) => !selectedIds.has(getFlashcardUniqueId(card)));
    }

    if (!available.length) break;

    const remainingCount = requestedCount - selected.length;
    const batch = shuffle(available).slice(0, remainingCount);
    batch.forEach((card) => {
      const cardId = getFlashcardUniqueId(card);
      selected.push(card);
      selectedIds.add(cardId);
      state.flashcardSeenIds.add(cardId);
    });
  }

  return selected;
}

function getFlashcardUniqueId(card) {
  return card.questionId || card.id;
}

function getAccessibleFlashcards() {
  const explicitCards = state.data.flashcards.filter((card) => hasPremiumAccess() || card.access !== "premium");
  const explicitQuestionIds = new Set(explicitCards.map((card) => card.questionId).filter(Boolean));
  const generatedCards = getAccessibleQuestions()
    .filter((question) => !explicitQuestionIds.has(question.id))
    .map((question) => ({
      id: `card-${question.id}`,
      questionId: question.id,
      categoryId: question.categoryId,
      question: question.question,
      answer: getCorrectAnswer(question),
      access: question.access
    }));
  return [...explicitCards, ...generatedCards];
}

function canAccess(question) {
  return hasPremiumAccess() || question.access !== "premium";
}

function getFocusArea() {
  const attemptedCategories = state.data.categories
    .map((category) => {
      const progress = state.progress.categories[category.id];
      if (!progress?.total) return null;
      return {
        title: category.title,
        percent: Math.round((progress.correct / progress.total) * 100)
      };
    })
    .filter(Boolean);

  if (!attemptedCategories.length) return "Nema podataka";
  attemptedCategories.sort((first, second) => first.percent - second.percent);
  return attemptedCategories[0].title;
}

function getActiveModeLabel() {
  if (state.activeMode === "exam") return "Simulacija ispita";
  if (state.activeMode === "wrong") return "Pogrešna pitanja";
  if (state.activeMode === "all") return "Sva pitanja";
  return state.activeCategory?.title || "Kviz";
}

function buildBalancedExamQuestions(questions, requestedCount) {
  const categories = state.data.categories.map((category) => category.id);
  const buckets = categories.map((categoryId) =>
    shuffle(questions.filter((question) => question.categoryId === categoryId))
  );
  const selected = [];

  while (selected.length < requestedCount && buckets.some((bucket) => bucket.length)) {
    buckets.forEach((bucket) => {
      if (selected.length < requestedCount && bucket.length) selected.push(bucket.shift());
    });
  }

  return selected;
}

function validateData(data) {
  const errors = [];
  const ids = new Set();
  const categoryIds = new Set(data.categories.map((category) => category.id));
  const validDifficulties = new Set(["easy", "medium", "hard"]);

  data.questions.forEach((question, index) => {
    if (!question.id) errors.push(`Pitanje #${index + 1} nema id.`);
    if (ids.has(question.id)) errors.push(`Dupli id pitanja: ${question.id}.`);
    ids.add(question.id);
    if (!categoryIds.has(question.categoryId)) errors.push(`${question.id} ima nepoznatu kategoriju.`);
  if (!hasValidMultipleChoiceOptions(question)) {
    if (!question.answer) errors.push(`${question.id} nema direktni odgovor.`);
  } else {
      if (!Array.isArray(question.options) || question.options.length < 2) errors.push(`${question.id} mora imati najmanje 2 odgovora.`);
      if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex >= question.options?.length) {
        errors.push(`${question.id} ima nevalidan answerIndex.`);
      }
    }
    if (!question.rationale) errors.push(`${question.id} nema objašnjenje.`);
    if (!question.source) errors.push(`${question.id} nema izvor.`);
    if (!validDifficulties.has(question.difficulty)) errors.push(`${question.id} ima nevalidnu težinu.`);
  });

  return { errors };
}

function isDirectQuestion(question) {
  return question.questionType === "direct" || !hasValidMultipleChoiceOptions(question);
}

function getCorrectAnswer(question) {
  if (hasValidMultipleChoiceOptions(question)) return question.options[question.answerIndex];
  return question.answer || "";
}

function hasValidMultipleChoiceOptions(question) {
  return Array.isArray(question.options)
    && question.options.length >= 2
    && Number.isInteger(question.answerIndex)
    && question.answerIndex >= 0
    && question.answerIndex < question.options.length;
}

function getRandomizedQuestionOrder(questions) {
  return shuffle([...questions]);
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
