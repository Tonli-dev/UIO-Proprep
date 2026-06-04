const PREMIUM_CODE = "UIO-PREMIUM-2026";
const MAX_ATTEMPTS = 12;

const state = {
  data: null,
  progress: window.ProPrepStorage.readProgress(),
  activeMode: null,
  activeCategory: null,
  activeQuestions: [],
  activeAnswers: [],
  currentQuestionIndex: 0,
  currentCorrect: 0,
  selectedAnswer: null,
  flashcardIndex: 0,
  flashcardFlipped: false,
  examTimerId: null,
  examSecondsRemaining: 0,
  deferredInstallPrompt: null
};

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
  previousCard: document.querySelector("#previous-card"),
  nextCard: document.querySelector("#next-card"),
  guideSearch: document.querySelector("#guide-search"),
  guideList: document.querySelector("#guide-list"),
  resetProgress: document.querySelector("#reset-progress"),
  dataStatus: document.querySelector("#data-status"),
  offlineStatus: document.querySelector("#offline-status"),
  headerOfflineStatus: document.querySelector("#header-offline-status"),
  refreshApp: document.querySelector("#refresh-app"),
  contentVersion: document.querySelector("#content-version"),
  premiumStatus: document.querySelector("#premium-status"),
  premiumCode: document.querySelector("#premium-code"),
  unlockPremium: document.querySelector("#unlock-premium"),
  installHelp: document.querySelector("#install-help"),
  attemptsList: document.querySelector("#attempts-list"),
  disclaimer: document.querySelector("#disclaimer"),
  installButton: document.querySelector("#install-button")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  await loadData();
  registerServiceWorker();
  renderAll();
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
  selectors.guideSearch.addEventListener("input", renderGuide);
  selectors.installButton.addEventListener("click", installApp);
  selectors.refreshApp.addEventListener("click", () => window.location.reload());
  selectors.unlockPremium.addEventListener("click", unlockPremium);

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
    state.data = data;
    state.progress.lastContentVersion = data.contentVersion;
    window.ProPrepStorage.writeProgress(state.progress);

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

  navigator.serviceWorker
    .register("service-worker.js")
    .then((registration) => {
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            selectors.headerOfflineStatus.textContent = "Nova verzija dostupna";
            selectors.headerOfflineStatus.className = "status-badge info";
            selectors.refreshApp.classList.remove("hidden");
          }
        });
      });
      return navigator.serviceWorker.ready.then(() => registration);
    })
    .then(() => {
      selectors.offlineStatus.textContent = "Spremno za offline";
      selectors.headerOfflineStatus.textContent = "Offline spremno";
      selectors.headerOfflineStatus.className = "status-badge success";
      selectors.installHelp.textContent = "Aplikacija je cacheirana. Na mobitelu koristite opciju Add to Home Screen / Install.";
    })
    .catch(() => {
      selectors.offlineStatus.textContent = "Greška";
      selectors.headerOfflineStatus.textContent = "Offline greška";
      selectors.headerOfflineStatus.className = "status-badge warning";
      selectors.installHelp.textContent = "Offline cache nije aktiviran. Pokušajte osvježiti stranicu.";
    });
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
  selectors.disclaimer.textContent = state.data.disclaimer || "";
  selectors.contentVersion.textContent = state.data.contentVersion || "N/A";
}

function setRoute(route) {
  selectors.views.forEach((view) => view.classList.toggle("active", view.id === `view-${route}`));
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });
}

function renderContentStatus() {
  const total = countQuestions();
  const target = state.data.contentTarget || 150;
  const free = getAccessibleQuestions(false).length;
  const premium = state.data.questions.filter((question) => question.access === "premium").length;
  const premiumState = state.progress.premiumUnlocked ? "premium otključan" : "premium zaključan";
  const percent = target ? Math.min(100, Math.round((total / target) * 100)) : 0;

  selectors.contentStatus.innerHTML = `
    <div>
      <span class="status-label">Sadržaj</span>
      <strong>${total}/${target} pitanja</strong>
      <small>Free: ${free} dostupno · Premium: ${premium} dodatno · ${premiumState}</small>
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
      meta: state.progress.premiumUnlocked ? "Premium otključano" : "Premium",
      locked: !state.progress.premiumUnlocked,
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
        ${mode.locked && mode.id === "exam" ? "Otključaj u postavkama" : mode.locked ? "Nije dostupno" : "Pokreni"}
      </button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      if (mode.locked && mode.id === "exam") {
        setRoute("settings");
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
    selectors.moduleGrid.innerHTML = `<div class="empty-state">Nema učitanih oblasti. Provjerite <code>data/questions.json</code>.</div>`;
    return;
  }

  state.data.categories.forEach((category) => {
    const questions = getAccessibleQuestions().filter((question) => question.categoryId === category.id);
    const allInCategory = state.data.questions.filter((question) => question.categoryId === category.id);
    const lockedCount = allInCategory.length - questions.length;
    const card = document.createElement("article");
    card.className = `module-card module-${category.id}`;
    card.innerHTML = `
      <span class="pill">${questions.length} dostupno</span>
      <h2>${category.title}</h2>
      <p>${category.description}</p>
      ${lockedCount ? `<small class="card-note premium-note">Zaključano u free verziji: ${lockedCount} premium pitanja.</small>` : ""}
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
  state.activeQuestions = shuffle([...availableQuestions]);
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
  if (!state.progress.premiumUnlocked) {
    setRoute("settings");
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

  state.progress.quizzesDone += 1;
  state.progress.attempts = [
    {
      id: `attempt-${Date.now()}`,
      date: new Date().toISOString(),
      mode: state.activeMode,
      label: getActiveModeLabel(),
      total,
      correct: state.currentCorrect,
      percent,
      passed,
      wrongQuestionIds: wrongAnswers.map((answer) => answer.questionId)
    },
    ...state.progress.attempts
  ].slice(0, MAX_ATTEMPTS);

  window.ProPrepStorage.writeProgress(state.progress);
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
  if (!state.progress.categories[question.categoryId]) {
    state.progress.categories[question.categoryId] = { total: 0, correct: 0 };
  }

  state.progress.answersTotal += 1;
  state.progress.categories[question.categoryId].total += 1;

  if (isCorrect) {
    state.progress.answersCorrect += 1;
    state.progress.categories[question.categoryId].correct += 1;
    state.progress.wrongQuestionIds = state.progress.wrongQuestionIds.filter((id) => id !== question.id);
  } else if (!state.progress.wrongQuestionIds.includes(question.id)) {
    state.progress.wrongQuestionIds.push(question.id);
  }

  window.ProPrepStorage.writeProgress(state.progress);
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

function resetProgress() {
  const confirmed = window.confirm("Resetovati sav lokalni napredak, historiju i premium demo unlock?");
  if (!confirmed) return;

  state.progress = window.ProPrepStorage.resetProgress();
  renderAll();
}

function renderFlashcard() {
  const cards = getAccessibleFlashcards();
  const card = cards[state.flashcardIndex] || cards[0];
  if (!card) {
    selectors.flashcardQuestion.textContent = "Nema dostupnih kartica.";
    selectors.flashcardAnswer.textContent = "Dodajte kartice u data/questions.json.";
    selectors.flashcardCount.textContent = "0/0";
    return;
  }

  const category = state.data.categories.find((item) => item.id === card.categoryId);
  selectors.flashcard.classList.toggle("flipped", state.flashcardFlipped);
  selectors.flashcardCategory.textContent = category?.title || "Oblast";
  selectors.flashcardQuestion.textContent = card.question;
  selectors.flashcardAnswer.textContent = card.answer;
  selectors.flashcardCount.textContent = `${state.flashcardIndex + 1}/${cards.length}`;
}

function flipFlashcard() {
  state.flashcardFlipped = !state.flashcardFlipped;
  renderFlashcard();
}

function previousFlashcard() {
  const cards = getAccessibleFlashcards();
  if (!cards.length) return;
  state.flashcardIndex = (state.flashcardIndex - 1 + cards.length) % cards.length;
  state.flashcardFlipped = false;
  renderFlashcard();
}

function nextFlashcard() {
  const cards = getAccessibleFlashcards();
  if (!cards.length) return;
  state.flashcardIndex = (state.flashcardIndex + 1) % cards.length;
  state.flashcardFlipped = false;
  renderFlashcard();
}

function renderGuide() {
  const query = selectors.guideSearch.value.trim().toLowerCase();
  const searchableQuestions = state.data.questions.filter((question) => {
    const content = [
      question.question,
      question.options.join(" "),
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
    const isLockedPremium = question.access === "premium" && !state.progress.premiumUnlocked;
    const questionItem = document.createElement("article");
    questionItem.className = `guide-item question-result ${isLockedPremium ? "locked-result" : ""}`;
    questionItem.innerHTML = `
      <span class="pill">${escapeHtml(category?.title || "Pitanje")}</span>
      ${question.access === "premium" ? `<span class="premium-label">Premium</span>` : ""}
      <h2>${escapeHtml(question.question)}</h2>
      <p>${isLockedPremium ? "Ovo pitanje je dio premium seta. Demo otključavanje je dostupno u Postavkama." : escapeHtml(question.rationale)}</p>
      ${isLockedPremium ? `<button class="ghost-button inline-cta" type="button">Otvori postavke</button>` : ""}
      <small>${escapeHtml(question.source)}</small>
    `;
    questionItem.querySelector(".inline-cta")?.addEventListener("click", () => setRoute("settings"));
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
      <p><strong>Tačno:</strong> ${escapeHtml(question.options[question.answerIndex])}</p>
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
  selectors.premiumStatus.textContent = state.progress.premiumUnlocked ? "Premium demo otključan" : "Free verzija";
  selectors.premiumStatus.classList.toggle("premium-on", state.progress.premiumUnlocked);
  renderContentStatus();
}

function unlockPremium() {
  const code = selectors.premiumCode.value.trim().toUpperCase();
  if (code !== PREMIUM_CODE) {
    selectors.premiumStatus.textContent = "Kod nije ispravan";
    selectors.premiumStatus.classList.remove("premium-on");
    return;
  }

  state.progress.premiumUnlocked = true;
  window.ProPrepStorage.writeProgress(state.progress);
  selectors.premiumCode.value = "";
  renderPremium();
  renderModes();
  renderModules();
  renderFlashcard();
}

async function installApp() {
  if (!state.deferredInstallPrompt) return;

  state.deferredInstallPrompt.prompt();
  await state.deferredInstallPrompt.userChoice;
  state.deferredInstallPrompt = null;
  selectors.installButton.classList.add("hidden");
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

function getAccessibleQuestions(includePremium = state.progress.premiumUnlocked) {
  return state.data.questions.filter((question) => includePremium || question.access !== "premium");
}

function getAccessibleFlashcards() {
  return state.data.flashcards.filter((card) => state.progress.premiumUnlocked || card.access !== "premium");
}

function canAccess(question) {
  return state.progress.premiumUnlocked || question.access !== "premium";
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
    if (!Array.isArray(question.options) || question.options.length !== 4) errors.push(`${question.id} mora imati tačno 4 odgovora.`);
    if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 3) errors.push(`${question.id} ima nevalidan answerIndex.`);
    if (!question.rationale) errors.push(`${question.id} nema objašnjenje.`);
    if (!question.source) errors.push(`${question.id} nema izvor.`);
    if (!validDifficulties.has(question.difficulty)) errors.push(`${question.id} ima nevalidnu težinu.`);
  });

  return { errors };
}

function shuffle(items) {
  return items
    .map((item) => ({ item, sort: Math.random() }))
    .sort((first, second) => first.sort - second.sort)
    .map(({ item }) => item);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
