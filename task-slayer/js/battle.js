const API_BASE = "http://127.0.0.1:5000/api";

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/auth")) {
      const authModal = document.getElementById("auth-modal");
      if (authModal) authModal.style.display = "flex";
    }
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

const battleState = {
  heroLevel: 1,
  currentXp: 0,
  xpToLevel: 100,
  xpGainPerHit: 40,
  heroHp: 60,
  heroMaxHp: 60,
  monsterHp: 120,
  monsterMaxHp: 120,
  attackDamage: 40,
  enemyAttackDamage: 24,
  currentScene: "info",
  actionLocked: false
};

const assetConfig = {
  heroIdle: "./assets/hero/__Idle.gif",
  heroRun: "./assets/hero/__Run.gif",
  heroAttack: "./assets/hero/__AttackCombo2hit.gif",
  heroDeath: "./assets/hero/__Death.gif"
};

const monsterCatalog = [
  {
    id: "skeleton",
    name: "Skeleton",
    panelName: "Skeleton",
    battleName: "Monster 0",
    power: "10",
    maxHp: 120,
    infoIntent: "Preparing a distraction attack.",
    battleIntent: "Vulnerable 1",
    assets: {
      idle: "./assets/monster/skeleton/idle.gif",
      onhit: "./assets/monster/skeleton/onhit.gif",
      shield: "./assets/monster/skeleton/sheild.gif",
      walk: "./assets/monster/skeleton/walk.gif",
      attack: "./assets/monster/skeleton/Attack.gif",
      death: "./assets/monster/skeleton/death.gif"
    },
    reactions: ["onhit", "shield"],
    reactionCopy: {
      onhit: "Attack combo lands.",
      shield: "Skeleton raises its shield."
    },
    attackCopy: {
      advance: "Skeleton rushes toward the hero.",
      strike: "Skeleton swings its weapon.",
      retreat: "Skeleton retreats to its starting point.",
      defeat: "Skeleton collapses into dust.",
      recovered: "Skeleton braces again."
    }
  },
  {
    id: "flying-eye",
    name: "Flying Eye",
    panelName: "Flying Eye",
    battleName: "Flying Eye",
    power: "10",
    maxHp: 120,
    infoIntent: "Hovering overhead and reading your next move.",
    battleIntent: "Watching 1",
    assets: {
      idle: "./assets/monster/flying_eye/fly.gif",
      onhit: "./assets/monster/flying_eye/onhit.gif",
      walk: "./assets/monster/flying_eye/fly.gif",
      attack: "./assets/monster/flying_eye/Attack.gif",
      death: "./assets/monster/flying_eye/death.gif"
    },
    reactions: ["onhit"],
    reactionCopy: {
      onhit: "Flying Eye reels from the strike."
    },
    attackCopy: {
      advance: "Flying Eye glides toward the hero.",
      strike: "Flying Eye lashes out from close range.",
      retreat: "Flying Eye drifts back into the air.",
      defeat: "Flying Eye drops from the sky.",
      recovered: "Flying Eye regains its rhythm."
    }
  },
  {
    id: "goblin",
    name: "Goblin",
    panelName: "Goblin",
    battleName: "Goblin",
    power: "10",
    maxHp: 120,
    infoIntent: "Crouching low and looking for a dirty opening.",
    battleIntent: "Ambush 1",
    assets: {
      idle: "./assets/monster/goblin/idle.gif",
      onhit: "./assets/monster/goblin/onhit.gif",
      walk: "./assets/monster/goblin/run.gif",
      attack: "./assets/monster/goblin/attack.gif",
      death: "./assets/monster/goblin/death.gif"
    },
    reactions: ["onhit"],
    reactionCopy: {
      onhit: "Goblin staggers from the strike."
    },
    attackCopy: {
      advance: "Goblin rushes toward the hero.",
      strike: "Goblin slashes at close range.",
      retreat: "Goblin scrambles back to safety.",
      defeat: "Goblin falls and disappears.",
      recovered: "Goblin regains its footing."
    }
  }
];

const animationTiming = {
  runForwardMs: 850,
  attackMs: 1900,
  runBackMs: 850,
  enemyRunMs: 900,
  enemyAttackMs: 1100,
  enemyReturnMs: 900,
  heroDeathMs: 1100,
  monsterDeathMs: 1000
};

let tasks = [];
let completedTasks = [];
let selectedTaskId = null;
let currentMonster = monsterCatalog[0];

const body = document.body;
const infoScene = document.getElementById("info-scene");
const battleScene = document.getElementById("battle-scene");

const backToInfoButton = document.getElementById("back-to-info-btn");
const xpFill = document.getElementById("xp-fill");
const xpText = document.getElementById("xp-text");
const hpFill = document.getElementById("hp-fill");
const hpText = document.getElementById("hp-text");
const battleHpFill = document.getElementById("battle-hp-fill");
const battleHpText = document.getElementById("battle-hp-text");
const heroStaticFill = document.getElementById("hero-static-fill");
const heroHpText = document.getElementById("hero-hp-text");
const playerLevel = document.getElementById("player-level");
const combatLog = document.getElementById("combat-log");
const battleLog = document.getElementById("battle-log");
const monsterIntent = document.getElementById("monster-intent");
const battleMonsterIntent = document.getElementById("battle-monster-intent");
const battleStatusText = document.getElementById("battle-status-text");
const progressText = document.getElementById("progress-text");
const taskTitle = document.getElementById("task-title");
const taskDescription = document.getElementById("task-description");
const selectedDeadline = document.getElementById("selected-deadline");
const selectedDifficultyTag = document.getElementById("selected-difficulty-tag");
const selectedProgressPercent = document.getElementById("selected-progress-percent");
const selectedProgressFill = document.getElementById("selected-progress-fill");
const xpPopup = document.getElementById("xp-popup");
const battleHeroFrame = document.getElementById("battle-hero-frame");
const battleHeroMedia = document.getElementById("battle-hero-media");
const battleMonsterFrame = document.getElementById("battle-monster-frame");
const battleMonsterMedia = document.getElementById("battle-monster-media");
const infoMonsterFrame = document.querySelector("#info-scene .monster-panel [data-asset-key='monsterIdle']");
const infoMonsterMedia = infoMonsterFrame?.querySelector(".asset-media") ?? null;
const infoMonsterHeading = document.querySelector("#info-scene .monster-panel .panel-title-row h2");
const infoMonsterLabel = infoMonsterFrame?.querySelector(".asset-label") ?? null;
const battleMonsterLabel = battleMonsterFrame?.querySelector(".asset-label") ?? null;
const battleMonsterName = document.querySelector(".monster-combatant .combatant-name");
const battleMonsterPower = document.querySelector(".monster-combatant .combatant-power");
const createTaskForm = document.getElementById("create-task-form");
const taskNameInput = document.getElementById("task-name-input");
const taskDescriptionInput = document.getElementById("task-description-input");
const taskDeadlineInput = document.getElementById("task-deadline-input");
const difficultyToggle = document.getElementById("difficulty-toggle");
const taskDifficultyInput = document.getElementById("task-difficulty-input");
const activeTaskList = document.getElementById("active-task-list");
const questCountChip = document.getElementById("quest-count-chip");
const completedTaskList = document.getElementById("completed-task-list");
const completedCountChip = document.getElementById("completed-count-chip");
const selectedTaskChip = document.getElementById("selected-task-chip");
const detailTaskName = document.getElementById("detail-task-name");
const detailTaskDescription = document.getElementById("detail-task-description");
const detailDifficultyTag = document.getElementById("detail-difficulty-tag");
const detailDeadline = document.getElementById("detail-deadline");
const detailCurrentProgress = document.getElementById("detail-current-progress");
const progressUpdateForm = document.getElementById("progress-update-form");
const progressRangeInput = document.getElementById("progress-range-input");
const progressRangeValue = document.getElementById("progress-range-value");
const progressNoteInput = document.getElementById("progress-note-input");
const progressHistoryList = document.getElementById("progress-history-list");
const historyCountChip = document.getElementById("history-count-chip");
const questCompleteModal = document.getElementById("quest-complete-modal");
const modalTaskName = document.getElementById("modal-task-name");
const modalBonusXp = document.getElementById("modal-bonus-xp");
const modalTotalXp = document.getElementById("modal-total-xp");
const modalAchievements = document.getElementById("modal-achievements");
const modalCloseBtn = document.getElementById("modal-close-btn");
const editQuestModal = document.getElementById("edit-quest-modal");
const editTaskForm = document.getElementById("edit-task-form");
const editTaskId = document.getElementById("edit-task-id");
const editTaskName = document.getElementById("edit-task-name");
const editTaskDescription = document.getElementById("edit-task-description");
const editTaskDeadline = document.getElementById("edit-task-deadline");
const editDifficultyToggle = document.getElementById("edit-difficulty-toggle");
const editTaskDifficulty = document.getElementById("edit-task-difficulty");
const editDeleteBtn = document.getElementById("edit-delete-btn");
const editCancelBtn = document.getElementById("edit-cancel-btn");
const achievementsBtn = document.getElementById("achievements-btn");
const achievementsModal = document.getElementById("achievements-modal");
const achievementsGrid = document.getElementById("achievements-grid");
const achievementsCloseBtn = document.getElementById("achievements-close-btn");
const archiveDetailBtn = document.getElementById("archive-detail-btn");
const questArchiveModal = document.getElementById("quest-archive-modal");
const questArchiveCloseBtn = document.getElementById("quest-archive-close-btn");
const archiveSearchInput = document.getElementById("archive-search-input");
const archiveSortSelect = document.getElementById("archive-sort-select");
const archiveFilterDifficulty = document.getElementById("archive-filter-difficulty");
const archiveFilterMonster = document.getElementById("archive-filter-monster");
const questArchiveList = document.getElementById("quest-archive-list");
const questArchiveSummary = document.getElementById("quest-archive-summary");

// ==========================================
// 🛡️ 认证模块 (登录 & 注册)
// ==========================================
const authModal = document.getElementById("auth-modal");
const authForm = document.getElementById("auth-form");
const authUsername = document.getElementById("auth-username");
const authPassword = document.getElementById("auth-password");
const authErrorMsg = document.getElementById("auth-error-msg");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authTitle = document.getElementById("auth-title");

let isLoginMode = true; // true: 登录模式, false: 注册模式

// 切换到登录标签
tabLogin?.addEventListener("click", () => {
  isLoginMode = true;
  tabLogin.classList.add("is-active");
  tabLogin.classList.remove("cancel-quest-btn");
  tabRegister.classList.remove("is-active");
  tabRegister.classList.add("cancel-quest-btn");
  authSubmitBtn.textContent = "Login to Start";
  authTitle.textContent = "Enter the Dungeon";
  authErrorMsg.style.display = "none";
});

// 切换到注册标签
tabRegister?.addEventListener("click", () => {
  isLoginMode = false;
  tabRegister.classList.add("is-active");
  tabRegister.classList.remove("cancel-quest-btn");
  tabLogin.classList.remove("is-active");
  tabLogin.classList.add("cancel-quest-btn");
  authSubmitBtn.textContent = "Create Hero";
  authTitle.textContent = "Enlist a New Hero";
  authErrorMsg.style.display = "none";
});

// 提交表单
authForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  authErrorMsg.style.display = "none";

  const username = authUsername.value.trim();
  const password = authPassword.value;
  const endpoint = isLoginMode ? "/auth/login" : "/auth/register";

  try {
    // 独立调用 fetch，避免触发上面的 401 拦截死循环
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 接收并保存后端发来的 Cookie
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Authentication failed");
    }

    // ✅ 登录/注册成功！隐藏弹窗，重新加载游戏数据
    authModal.style.display = "none";
    authForm.reset();
    initApp();

  } catch (err) {
    authErrorMsg.textContent = err.message;
    authErrorMsg.style.display = "block";
  }
});

const DIFFICULTY_RANK = { Easy: 1, Medium: 2, Hard: 3 };

const ACHIEVEMENT_ICONS = {
  sword: "\u2694\uFE0F",
  skull: "\uD83D\uDC80",
  crown: "\uD83D\uDC51",
  flame: "\uD83D\uDD25",
  lightning: "\u26A1",
  star: "\u2B50",
  medal: "\uD83C\uDFC5",
  shield: "\uD83D\uDEE1\uFE0F",
  book: "\uD83D\uDCDA",
  trophy: "\uD83C\uDFC6",
};

const battleIntents = [
  "Preparing a distraction attack.",
  "Charging a deadline curse.",
  "Searching for missing requirements.",
  "Telegraphing a low-priority feint."
];

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function getSelectedTask() {
  return tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
}

function getMonsterById(monsterId) {
  return monsterCatalog.find((monster) => monster.id === monsterId) ?? monsterCatalog[0];
}

function syncCurrentMonsterToTask(task = getSelectedTask()) {
  if (!task) return;
  currentMonster = getMonsterById(task.monsterId);
  battleState.monsterMaxHp = task.monsterMaxHp || currentMonster.maxHp;
  battleState.enemyAttackDamage = task.monsterPower || parseInt(currentMonster.power) || 24;

  // Calculate HP from task progress: a brand-new task (0%) has full HP
  battleState.monsterHp = Math.max(0, Math.round(battleState.monsterMaxHp * (100 - task.progress) / 100));
}

function getDifficultyLabel(difficulty) {
  if (difficulty === "Easy") {
    return "Scout Quest";
  }

  if (difficulty === "Medium") {
    return "Champion Quest";
  }

  return "Elite Task";
}

function getDifficultyClass(difficulty) {
  return difficulty.toLowerCase();
}

function parseTaskTimestamp(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  if (!s) return null;
  const normalized = s.includes("T") ? s : s.replace(" ", "T");
  const time = Date.parse(normalized);
  return Number.isNaN(time) ? null : time;
}

function getCompletionSortKey(task) {
  return (
    parseTaskTimestamp(task.completedAt)
    ?? parseTaskTimestamp(task.createdAt)
    ?? 0
  );
}

function getCreatedSortKey(task) {
  return parseTaskTimestamp(task.createdAt) ?? 0;
}

function parseDeadlineSortKey(task) {
  if (!task.deadline) return 0;
  return parseTaskTimestamp(`${task.deadline}T12:00:00`) ?? 0;
}

function formatArchiveCompletedAt(task) {
  const t =
    parseTaskTimestamp(task.completedAt)
    ?? parseTaskTimestamp(task.createdAt);
  if (t === null) return "—";
  return new Date(t).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function taskArchiveSearchBlob(task) {
  const diffLabel = getDifficultyLabel(task.difficulty);
  return [
    task.name,
    task.description,
    task.monsterName,
    task.latestNote,
    task.difficulty,
    diffLabel,
    task.monsterId,
  ]
    .filter((x) => x != null && String(x).trim() !== "")
    .join(" ")
    .toLowerCase();
}

function archiveSearchMatchesTask(task, rawQuery) {
  const trimmed = (rawQuery || "").trim().toLowerCase();
  if (!trimmed) return true;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const blob = taskArchiveSearchBlob(task);
  return tokens.every((tok) => blob.includes(tok));
}

function getArchiveViewTasks() {
  const rawQ = archiveSearchInput?.value || "";
  const diff = archiveFilterDifficulty?.value || "all";
  const monster = archiveFilterMonster?.value || "all";
  const sort = archiveSortSelect?.value || "completed-desc";

  let list = completedTasks.filter((t) => t.isCompleted);
  if (diff !== "all") {
    list = list.filter((t) => t.difficulty === diff);
  }
  if (monster !== "all") {
    list = list.filter((t) => String(t.monsterId) === monster);
  }
  list = list.filter((t) => archiveSearchMatchesTask(t, rawQ));

  const sorted = [...list];
  const rank = (d) => DIFFICULTY_RANK[d] ?? 99;

  switch (sort) {
    case "completed-desc":
      sorted.sort((a, b) => getCompletionSortKey(b) - getCompletionSortKey(a));
      break;
    case "completed-asc":
      sorted.sort((a, b) => getCompletionSortKey(a) - getCompletionSortKey(b));
      break;
    case "created-desc":
      sorted.sort((a, b) => getCreatedSortKey(b) - getCreatedSortKey(a));
      break;
    case "created-asc":
      sorted.sort((a, b) => getCreatedSortKey(a) - getCreatedSortKey(b));
      break;
    case "deadline-asc":
      sorted.sort((a, b) => parseDeadlineSortKey(a) - parseDeadlineSortKey(b));
      break;
    case "deadline-desc":
      sorted.sort((a, b) => parseDeadlineSortKey(b) - parseDeadlineSortKey(a));
      break;
    case "difficulty-asc":
      sorted.sort((a, b) => rank(a.difficulty) - rank(b.difficulty) || a.name.localeCompare(b.name));
      break;
    case "difficulty-desc":
      sorted.sort((a, b) => rank(b.difficulty) - rank(a.difficulty) || a.name.localeCompare(b.name));
      break;
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name, undefined, { sensitivity: "base" }));
      break;
    default:
      break;
  }

  return sorted;
}

function renderQuestArchiveModal() {
  if (!questArchiveList || !questArchiveSummary) return;

  const totalCleared = completedTasks.filter((t) => t.isCompleted).length;
  const rows = getArchiveViewTasks();

  if (totalCleared === 0) {
    questArchiveSummary.textContent = "No completed quests yet.";
  } else if (rows.length === 0) {
    questArchiveSummary.textContent = `No quests match your search or filters (${totalCleared} cleared total).`;
  } else {
    questArchiveSummary.textContent =
      `Showing ${rows.length} of ${totalCleared} cleared quest${totalCleared === 1 ? "" : "s"}.`;
  }

  questArchiveList.innerHTML = "";

  if (totalCleared === 0) {
    const empty = document.createElement("p");
    empty.className = "quest-archive-empty";
    empty.textContent = "Clear your first quest to build your archive.";
    questArchiveList.appendChild(empty);
    return;
  }

  if (rows.length === 0) {
    const empty = document.createElement("p");
    empty.className = "quest-archive-empty";
    empty.textContent = "Try a different keyword, difficulty, or monster filter.";
    questArchiveList.appendChild(empty);
    return;
  }

  rows.forEach((task) => {
    const article = document.createElement("article");
    article.className = "quest-archive-row";

    const header = document.createElement("div");
    header.className = "quest-archive-row-header";

    const title = document.createElement("h4");
    title.className = "quest-archive-row-title";
    title.textContent = task.name;

    const deadlineBadge = document.createElement("span");
    deadlineBadge.className = "quest-deadline-badge";
    deadlineBadge.textContent = formatDate(task.deadline);

    header.append(title, deadlineBadge);

    const desc = document.createElement("p");
    desc.className = "quest-archive-row-desc";
    desc.textContent = task.description;

    const meta = document.createElement("div");
    meta.className = "quest-archive-row-meta";

    const diffPill = document.createElement("span");
    diffPill.className = `quest-pill ${getDifficultyClass(task.difficulty)}`;
    diffPill.textContent = task.difficulty;

    const rankPill = document.createElement("span");
    rankPill.className = "quest-archive-meta-pill";
    rankPill.textContent = getDifficultyLabel(task.difficulty);

    const monsterPill = document.createElement("span");
    monsterPill.className = "quest-archive-meta-pill is-monster";
    monsterPill.textContent = task.monsterName || "Unknown foe";

    const clearedPill = document.createElement("span");
    clearedPill.className = "quest-archive-meta-pill is-completed";
    clearedPill.textContent = `Cleared ${formatArchiveCompletedAt(task)}`;

    meta.append(diffPill, rankPill, monsterPill, clearedPill);
    article.append(header, desc, meta);
    questArchiveList.appendChild(article);
  });
}

function closeQuestArchiveModal() {
  if (questArchiveModal) questArchiveModal.hidden = true;
}

async function openQuestArchiveModal() {
  try {
    const data = await api("/tasks?include_completed=true");
    completedTasks = data.tasks.filter((t) => t.isCompleted);
    renderCompletedTasks();
  } catch (err) {
    addLogEntry(combatLog, `Could not refresh archive: ${err.message}`);
  }

  if (archiveSearchInput) archiveSearchInput.value = "";
  if (archiveSortSelect) archiveSortSelect.value = "completed-desc";
  if (archiveFilterDifficulty) archiveFilterDifficulty.value = "all";
  if (archiveFilterMonster) archiveFilterMonster.value = "all";

  renderQuestArchiveModal();
  if (questArchiveModal) questArchiveModal.hidden = false;
  archiveSearchInput?.focus();
}

function restartGif(media, src) {
  if (!media || !src) {
    return;
  }

  media.src = `${src}?t=${Date.now()}`;
}

function addLogEntry(target, message) {
  if (!target) {
    return;
  }

  const entry = document.createElement("p");
  entry.textContent = message;
  target.appendChild(entry);
  target.scrollTop = target.scrollHeight;
}

function showXpPopup(amount) {
  xpPopup.textContent = `+${amount} XP`;
  xpPopup.classList.remove("show");
  void xpPopup.offsetWidth;
  xpPopup.classList.add("show");
  xpPopup.addEventListener("animationend", () => {
    xpPopup.classList.remove("show");
  }, { once: true });
}

function showQuestCompleteModal(taskName, bonusXp, totalXp, achievements) {
  modalTaskName.textContent = taskName;
  modalBonusXp.textContent = `+${bonusXp}`;
  modalTotalXp.textContent = `+${totalXp}`;

  if (achievements && achievements.length > 0) {
    modalAchievements.hidden = false;
    modalAchievements.innerHTML = `<p class="modal-achievement-title">Achievements Unlocked</p>` +
      achievements.map((a) => `<span class="modal-achievement-name">${a.name || a}</span>`).join("");
  } else {
    modalAchievements.hidden = true;
  }

  questCompleteModal.hidden = false;

  return new Promise((resolve) => {
    const handler = () => {
      questCompleteModal.hidden = true;
      modalCloseBtn.removeEventListener("click", handler);
      resolve();
    };
    modalCloseBtn.addEventListener("click", handler);
  });
}

function applyXp(amount) {
  battleState.currentXp += amount;

  while (battleState.currentXp >= battleState.xpToLevel) {
    battleState.currentXp -= battleState.xpToLevel;
    battleState.heroLevel += 1;
    addLogEntry(combatLog, `Level up. The Task Knight reaches level ${battleState.heroLevel}.`);
    addLogEntry(battleLog, `Power surge. Level ${battleState.heroLevel} unlocked in battle.`);
  }
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function setFrameSource(frame, media, src, placeholderText) {
  if (!frame) {
    return;
  }

  const label = frame.querySelector(".asset-label");
  if (label && placeholderText) {
    label.textContent = placeholderText;
  }

  if (!media || !src) {
    frame.classList.remove("has-asset");
    return;
  }

  restartGif(media, src);
}

function setupAssetFrames() {
  const frames = document.querySelectorAll("[data-asset-key]");

  frames.forEach((frame) => {
    const assetKey = frame.dataset.assetKey;
    const placeholderLabel = frame.dataset.placeholderLabel;
    const fallbackClass = frame.dataset.fallbackClass;
    const media = frame.querySelector(".asset-media");
    const label = frame.querySelector(".asset-label");
    const src = assetKey.startsWith("hero") ? assetConfig[assetKey] : null;

    if (fallbackClass) {
      frame.classList.add(fallbackClass);
    }

    if (label && placeholderLabel) {
      label.textContent = placeholderLabel;
    }

    if (!media) {
      frame.classList.remove("has-asset");
      return;
    }

    media.addEventListener("load", () => {
      frame.classList.add("has-asset");
    });

    media.addEventListener("error", () => {
      frame.classList.remove("has-asset");
      media.removeAttribute("src");
    });

    if (src) {
      media.src = src;
    }
  });
}

function selectRandomMonster() {
  return randomItem(monsterCatalog);
}

function applyCurrentMonsterVisuals() {
  if (infoMonsterHeading) {
    infoMonsterHeading.textContent = currentMonster.panelName;
  }

  if (battleMonsterName) {
    battleMonsterName.textContent = currentMonster.battleName;
  }

  if (battleMonsterPower) {
    battleMonsterPower.textContent = currentMonster.power;
  }

  if (monsterIntent) {
    monsterIntent.textContent = currentMonster.infoIntent;
  }

  if (battleMonsterIntent) {
    battleMonsterIntent.textContent = currentMonster.battleIntent;
  }

  if (infoMonsterLabel) {
    infoMonsterLabel.textContent = `${currentMonster.name.toUpperCase()} IDLE`;
  }

  if (battleMonsterLabel) {
    battleMonsterLabel.textContent = `${currentMonster.name.toUpperCase()} BATTLE`;
  }

  setFrameSource(infoMonsterFrame, infoMonsterMedia, currentMonster.assets.idle, `${currentMonster.name.toUpperCase()} IDLE`);
  setFrameSource(battleMonsterFrame, battleMonsterMedia, currentMonster.assets.idle, `${currentMonster.name.toUpperCase()} BATTLE`);
}

function setBattleHeroState(state) {
  if (!battleHeroFrame || !battleHeroMedia) {
    return;
  }

  battleHeroFrame.classList.remove("is-running-forward", "is-attacking", "is-running-back", "is-returned", "faded-out");

  if (state === "idle") {
    battleHeroFrame.classList.add("is-returned");
    restartGif(battleHeroMedia, assetConfig.heroIdle);
    return;
  }

  if (state === "runForward") {
    battleHeroFrame.classList.add("is-running-forward");
    restartGif(battleHeroMedia, assetConfig.heroRun);
    return;
  }

  if (state === "attack") {
    battleHeroFrame.classList.add("is-attacking");
    restartGif(battleHeroMedia, assetConfig.heroAttack);
    return;
  }

  if (state === "runBack") {
    battleHeroFrame.classList.add("is-running-back");
    restartGif(battleHeroMedia, assetConfig.heroRun);
    return;
  }

  if (state === "death") {
    restartGif(battleHeroMedia, assetConfig.heroDeath);
  }
}

function setBattleMonsterState(state) {
  if (!battleMonsterFrame || !battleMonsterMedia) {
    return;
  }

  battleMonsterFrame.classList.remove(
    "is-walking-forward",
    "is-attacking",
    "is-walking-back",
    "is-returned",
    "is-hit",
    "is-shield",
    "is-death",
    "faded-out"
  );

  if (state === "idle") {
    battleMonsterFrame.classList.add("is-returned");
    restartGif(battleMonsterMedia, currentMonster.assets.idle);
    return;
  }

  if (state === "walkForward") {
    battleMonsterFrame.classList.add("is-walking-forward");
    restartGif(battleMonsterMedia, currentMonster.assets.walk);
    return;
  }

  if (state === "attack") {
    battleMonsterFrame.classList.add("is-attacking");
    restartGif(battleMonsterMedia, currentMonster.assets.attack);
    return;
  }

  if (state === "walkBack") {
    battleMonsterFrame.classList.add("is-walking-back");
    restartGif(battleMonsterMedia, currentMonster.assets.walk);
    return;
  }

  if (state === "onhit") {
    battleMonsterFrame.classList.add("is-hit");
    restartGif(battleMonsterMedia, currentMonster.assets.onhit ?? currentMonster.assets.idle);
    return;
  }

  if (state === "shield") {
    battleMonsterFrame.classList.add("is-shield");
    restartGif(battleMonsterMedia, currentMonster.assets.shield ?? currentMonster.assets.onhit ?? currentMonster.assets.idle);
    return;
  }

  if (state === "death") {
    battleMonsterFrame.classList.add("is-death");
    restartGif(battleMonsterMedia, currentMonster.assets.death);
  }
}

function renderTaskList() {
  activeTaskList.innerHTML = "";
  questCountChip.textContent = `${tasks.length} Active`;

  tasks.forEach((task) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `quest-list-item ${task.id === selectedTaskId ? "is-selected" : ""}`;
    button.dataset.taskId = String(task.id);

    button.innerHTML = `
      <div class="quest-item-header">
        <div>
          <strong>${task.name}</strong>
          <p>${task.description}</p>
        </div>
        <span class="quest-deadline-badge">${formatDate(task.deadline)}</span>
      </div>
      <div class="quest-item-meta">
        <span class="quest-pill ${getDifficultyClass(task.difficulty)}">${task.difficulty}</span>
        <span class="quest-pill ${getDifficultyClass(task.difficulty)}">${task.progress}% Complete</span>
      </div>
      <div class="quest-item-actions">
        <span class="quest-edit-btn" data-edit-id="${task.id}">Edit</span>
      </div>
    `;

    button.addEventListener("click", (e) => {
      if (e.target.closest(".quest-edit-btn")) return;
      selectedTaskId = task.id;
      renderInfoDashboard();
      addLogEntry(combatLog, `Quest selected: ${task.name}.`);
    });

    button.querySelector(".quest-edit-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal(task.id);
    });

    activeTaskList.appendChild(button);
  });
}

function renderCompletedTasks() {
  completedTaskList.innerHTML = "";
  completedCountChip.textContent = `${completedTasks.length} Cleared`;

  if (completedTasks.length === 0) {
    completedTaskList.innerHTML = `<p class="completed-quests-empty">No completed quests yet. Slay some monsters!</p>`;
    return;
  }

  completedTasks.forEach((task) => {
    const div = document.createElement("div");
    div.className = "completed-quest-item";
    div.innerHTML = `
      <div class="quest-item-header">
        <div>
          <strong>${task.name}</strong>
          <p>${task.description}</p>
        </div>
        <span class="quest-deadline-badge">${formatDate(task.deadline)}</span>
      </div>
      <div class="quest-item-meta">
        <span class="quest-pill ${getDifficultyClass(task.difficulty)}">${task.difficulty}</span>
        <span class="completed-badge">Completed</span>
      </div>
    `;
    completedTaskList.appendChild(div);
  });
}

function renderSelectedTask() {
  const task = getSelectedTask();
  if (!task) return;
  const difficultyLabel = getDifficultyLabel(task.difficulty);

  taskTitle.textContent = task.name;
  taskDescription.textContent = task.description;
  selectedDeadline.textContent = formatDate(task.deadline);
  selectedDifficultyTag.textContent = difficultyLabel;
  selectedProgressPercent.textContent = `${task.progress}%`;
  selectedProgressFill.style.width = `${task.progress}%`;
  progressText.textContent = task.latestNote;
  detailTaskName.textContent = task.name;
  detailTaskDescription.textContent = task.description;
  detailDifficultyTag.textContent = difficultyLabel;
  detailDeadline.textContent = formatDate(task.deadline);
  detailCurrentProgress.textContent = `${task.progress}%`;
  selectedTaskChip.textContent = `Selected: ${task.name}`;

  progressRangeInput.min = "0";
  progressRangeInput.dataset.floor = String(task.progress);
  progressRangeInput.value = String(task.progress);
  progressRangeValue.textContent = `${task.progress}%`;
}

function renderProgressHistory() {
  const task = getSelectedTask();
  progressHistoryList.innerHTML = "";
  if (!task) return;
  historyCountChip.textContent = `${task.updates.length} Entries`;

  task.updates.forEach((update) => {
    const entry = document.createElement("article");
    entry.className = "progress-entry";
    entry.innerHTML = `
      <div class="progress-entry-header">
        <strong>${formatDate(update.date)}</strong>
        <span class="progress-pill ${getDifficultyClass(task.difficulty)}">${update.percent}%</span>
      </div>
      <p>${update.note}</p>
    `;
    progressHistoryList.appendChild(entry);
  });
}

function renderBattleState() {
  const xpPercent = (battleState.currentXp / battleState.xpToLevel) * 100;
  const heroPercent = (battleState.heroHp / battleState.heroMaxHp) * 100;
  const hpPercent = (battleState.monsterHp / battleState.monsterMaxHp) * 100;

  xpFill.style.width = `${Math.min(xpPercent, 100)}%`;
  heroStaticFill.style.width = `${Math.max(heroPercent, 0)}%`;
  battleHpFill.style.width = `${Math.max(hpPercent, 0)}%`;
  hpFill.style.width = `${Math.max(hpPercent, 0)}%`;
  xpText.textContent = `${battleState.currentXp} / ${battleState.xpToLevel} XP`;
  heroHpText.textContent = `${battleState.heroHp} / ${battleState.heroMaxHp}`;
  hpText.textContent = `${battleState.monsterHp} / ${battleState.monsterMaxHp}`;
  battleHpText.textContent = `${battleState.monsterHp} / ${battleState.monsterMaxHp}`;
  playerLevel.textContent = battleState.heroLevel;

}

function renderInfoDashboard() {
  syncCurrentMonsterToTask();
  renderTaskList();
  renderCompletedTasks();
  renderSelectedTask();
  renderProgressHistory();
  applyCurrentMonsterVisuals();
  renderBattleState();
}

function updateHeroAttackOffset() {
  if (!battleHeroFrame || !battleMonsterFrame) {
    return;
  }

  const heroRect = battleHeroFrame.getBoundingClientRect();
  const monsterRect = battleMonsterFrame.getBoundingClientRect();
  const targetX = Math.max(0, (monsterRect.left + monsterRect.right) / 2 - heroRect.right);
  battleHeroFrame.style.setProperty("--hero-attack-x", `${targetX}px`);
}

function updateMonsterAttackOffset() {
  if (!battleHeroFrame || !battleMonsterFrame) {
    return;
  }

  const heroRect = battleHeroFrame.getBoundingClientRect();
  const monsterRect = battleMonsterFrame.getBoundingClientRect();
  const gap = 150;
  const targetX = Math.max(0, monsterRect.left - heroRect.left - gap);
  battleMonsterFrame.style.setProperty("--monster-attack-x", `${targetX}px`);
}

async function playMonsterDeathSequence() {
  battleStatusText.textContent = currentMonster.attackCopy.defeat;
  setBattleMonsterState("death");
  await wait(animationTiming.monsterDeathMs);
  battleMonsterFrame.classList.add("faded-out");
}

async function playHeroDeathSequence() {
  battleStatusText.textContent = "The hero falls in battle.";
  setBattleHeroState("death");
  await wait(animationTiming.heroDeathMs);
  battleHeroFrame.classList.add("faded-out");
}

function switchScene(nextScene, resetMonsterHp = true) {
  const showBattle = nextScene === "battle";
  battleState.currentScene = nextScene;
  infoScene.hidden = showBattle;
  battleScene.hidden = !showBattle;
  body.classList.toggle("battle-mode", showBattle);

  if (showBattle) {
    xpPopup.classList.remove("show");
    syncCurrentMonsterToTask();
    if (resetMonsterHp) {
      battleState.monsterHp = battleState.monsterMaxHp;
    }
    applyCurrentMonsterVisuals();
    updateHeroAttackOffset();
    updateMonsterAttackOffset();
    setBattleHeroState(battleState.heroHp > 0 ? "idle" : "death");
    setBattleMonsterState(battleState.monsterHp > 0 ? "idle" : "death");
    renderBattleState();
    addLogEntry(battleLog, `Scene switch complete. Combat display engaged for ${getSelectedTask().name} against ${currentMonster.name}.`);
  } else {
    addLogEntry(combatLog, "Returned to the info scene.");
  }
}

async function playHeroAttackSequence() {
  setBattleHeroState("runForward");
  battleStatusText.textContent = "Hero sprints toward the target.";
  await wait(animationTiming.runForwardMs);

  const monsterReaction = randomItem(currentMonster.reactions);
  setBattleHeroState("attack");
  setBattleMonsterState(monsterReaction);
  battleStatusText.textContent = currentMonster.reactionCopy[monsterReaction] ?? "Attack combo lands.";
  await wait(animationTiming.attackMs);

  if (battleState.monsterHp > 0) {
    setBattleMonsterState("idle");
  }

  setBattleHeroState("runBack");
  battleStatusText.textContent = "Hero disengages and returns.";
  await wait(animationTiming.runBackMs);
  setBattleHeroState("idle");
}

async function playEnemyAttackSequence() {
  setBattleMonsterState("walkForward");
  battleStatusText.textContent = currentMonster.attackCopy.advance;
  await wait(animationTiming.enemyRunMs);

  setBattleMonsterState("attack");
  battleStatusText.textContent = currentMonster.attackCopy.strike;
  await wait(animationTiming.enemyAttackMs);

  battleState.heroHp = Math.max(0, battleState.heroHp - battleState.enemyAttackDamage);
  addLogEntry(combatLog, `${currentMonster.name} dealt ${battleState.enemyAttackDamage} damage.`);
  addLogEntry(battleLog, `Enemy debug attack dealt ${battleState.enemyAttackDamage} damage.`);
  renderBattleState();

  if (battleState.heroHp === 0) {
    await playHeroDeathSequence();
  }

  setBattleMonsterState("walkBack");
  battleStatusText.textContent = currentMonster.attackCopy.retreat;
  await wait(animationTiming.enemyReturnMs);

  if (battleState.monsterHp > 0) {
    setBattleMonsterState("idle");
  }
}

function selectDifficulty(nextDifficulty) {
  taskDifficultyInput.value = nextDifficulty;
  difficultyToggle.querySelectorAll(".difficulty-option").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.difficulty === nextDifficulty);
  });
}

function selectEditDifficulty(nextDifficulty) {
  editTaskDifficulty.value = nextDifficulty;
  editDifficultyToggle.querySelectorAll(".difficulty-option").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.difficulty === nextDifficulty);
  });
}

function openEditModal(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  editTaskId.value = taskId;
  editTaskName.value = task.name;
  editTaskDescription.value = task.description;
  editTaskDeadline.value = task.deadline;
  selectEditDifficulty(task.difficulty);
  editQuestModal.hidden = false;
}

function closeEditModal() {
  editQuestModal.hidden = true;
}

async function handleEditSave(event) {
  event.preventDefault();
  const taskId = Number(editTaskId.value);
  const name = editTaskName.value.trim();
  const description = editTaskDescription.value.trim();
  const difficulty = editTaskDifficulty.value;
  const deadline = editTaskDeadline.value;

  if (!name || !description || !deadline) return;

  try {
    const data = await api(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({ name, description, difficulty, deadline }),
    });

    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) tasks[idx] = data.task;

    closeEditModal();
    renderInfoDashboard();
    addLogEntry(combatLog, `Quest updated: ${data.task.name}.`);
  } catch (err) {
    addLogEntry(combatLog, `Failed to update quest: ${err.message}`);
  }
}

async function handleEditDelete() {
  const taskId = Number(editTaskId.value);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  if (!confirm(`Are you sure you want to delete "${task.name}"? This cannot be undone.`)) return;

  try {
    await api(`/tasks/${taskId}`, { method: "DELETE" });

    tasks = tasks.filter((t) => t.id !== taskId);
    if (selectedTaskId === taskId) {
      selectedTaskId = tasks.length > 0 ? tasks[0].id : null;
    }

    closeEditModal();
    renderInfoDashboard();
    addLogEntry(combatLog, `Quest deleted: ${task.name}.`);
  } catch (err) {
    addLogEntry(combatLog, `Failed to delete quest: ${err.message}`);
  }
}

async function openAchievementsModal() {
  try {
    const data = await api("/achievements");
    const achievements = data.achievements;

    achievementsGrid.innerHTML = achievements.map((ach) => {
      const icon = ACHIEVEMENT_ICONS[ach.icon] || ACHIEVEMENT_ICONS.trophy;
      const stateClass = ach.unlocked ? "is-unlocked" : "is-locked";
      const statusLabel = ach.unlocked ? "Unlocked" : "Locked";
      return `
        <div class="achievement-card ${stateClass}">
          <div class="achievement-icon">${icon}</div>
          <div class="achievement-info">
            <p class="achievement-name">${ach.name}</p>
            <p class="achievement-desc">${ach.description}</p>
          </div>
          <span class="achievement-status">${statusLabel}</span>
        </div>
      `;
    }).join("");

    achievementsModal.hidden = false;
  } catch (err) {
    addLogEntry(combatLog, `Failed to load achievements: ${err.message}`);
  }
}

async function handleCreateTask(event) {
  event.preventDefault();

  const name = taskNameInput.value.trim();
  const description = taskDescriptionInput.value.trim();
  const difficulty = taskDifficultyInput.value;
  const deadline = taskDeadlineInput.value;

  if (!name || !description || !deadline) {
    return;
  }

  try {
    const data = await api("/tasks", {
      method: "POST",
      body: JSON.stringify({ name, description, difficulty, deadline }),
    });

    tasks.unshift(data.task);
    selectedTaskId = data.task.id;
    createTaskForm.reset();
    selectDifficulty("Easy");
    renderInfoDashboard();
    addLogEntry(combatLog, `New quest created: ${data.task.name}.`);
  } catch (err) {
    addLogEntry(combatLog, `Failed to create quest: ${err.message}`);
  }
}

async function handleProgressUpdate(event) {
  event.preventDefault();
  const task = getSelectedTask();
  if (!task) return;

  const percent = Number(progressRangeInput.value);
  const note = progressNoteInput.value.trim() || "Daily progress update submitted.";

  if (percent <= task.progress) {
    addLogEntry(combatLog, "Progress must be higher than current value.");
    return;
  }

  try {
    const data = await api(`/tasks/${task.id}/progress`, {
      method: "POST",
      body: JSON.stringify({ percent, note }),
    });

    // Sync player stats
    battleState.heroLevel = data.playerStats.heroLevel;
    battleState.currentXp = data.playerStats.currentXp;
    battleState.xpToLevel = data.playerStats.xpToLevel;
    battleState.heroHp = data.playerStats.heroHp || battleState.heroHp;
    battleState.heroMaxHp = data.playerStats.heroMaxHp || battleState.heroMaxHp;

    // Set up battle state: show HP before damage, then animate
    const battle = data.battle;
    battleState.monsterMaxHp = battle.monsterMaxHp;
    // Show pre-damage HP during animation
    battleState.monsterHp = battle.monsterHpRemaining + battle.damageDealt;

    // Switch to battle scene without resetting monster HP
    switchScene("battle", false);
    battleState.actionLocked = true;
    renderBattleState();

    await playHeroAttackSequence();

    // Drop HP after the attack lands
    battleState.monsterHp = battle.monsterHpRemaining;
    renderBattleState();
    showXpPopup(data.xpAwarded);

    const damageMessage = `Progress strike! Dealt ${battle.damageDealt} damage (${battle.progressDelta}% progress).`;
    addLogEntry(combatLog, damageMessage);
    addLogEntry(battleLog, damageMessage);

    if (data.playerStats.leveledUp) {
      addLogEntry(combatLog, `Level up! Reached level ${data.playerStats.heroLevel}.`);
      addLogEntry(battleLog, `Power surge. Level ${data.playerStats.heroLevel} unlocked in battle.`);
    }

    if (data.achievementsUnlocked && data.achievementsUnlocked.length > 0) {
      data.achievementsUnlocked.forEach((a) => {
        const achName = a.name || a;
        addLogEntry(combatLog, `Achievement unlocked: ${achName}!`);
        addLogEntry(battleLog, `Achievement unlocked: ${achName}!`);
      });
    }

    // If monster is defeated, play death sequence then show completion modal
    if (battle.monsterDefeated) {
      battleMonsterIntent.textContent = "Defeated";
      await playMonsterDeathSequence();
      addLogEntry(combatLog, `Victory! ${currentMonster.name} has been defeated. Task complete!`);
      addLogEntry(battleLog, `${currentMonster.name} falls. Quest finished.`);

      battleState.actionLocked = false;
      renderBattleState();

      // Move task from active to completed
      Object.assign(task, data.task);
      completedTasks.unshift({ ...task });
      tasks = tasks.filter((t) => t.id !== task.id);
      if (selectedTaskId === task.id) {
        selectedTaskId = tasks.length > 0 ? tasks[0].id : null;
      }
      progressNoteInput.value = "";

      // Show congratulations modal — waits for user to click Continue
      await showQuestCompleteModal(
        task.name,
        battle.completionBonus,
        data.xpAwarded,
        data.achievementsUnlocked
      );

      switchScene("info");
      renderInfoDashboard();
      return;
    }

    battleMonsterIntent.textContent = currentMonster.attackCopy.recovered;
    battleState.actionLocked = false;
    renderBattleState();

    // Update local task data
    Object.assign(task, data.task);
    progressNoteInput.value = "";

    // Auto-return to info scene after a short pause
    await wait(1500);
    switchScene("info");
    renderInfoDashboard();
  } catch (err) {
    addLogEntry(combatLog, `Failed to update progress: ${err.message}`);
  }
}


backToInfoButton.addEventListener("click", () => switchScene("info"));
createTaskForm.addEventListener("submit", handleCreateTask);
progressUpdateForm.addEventListener("submit", handleProgressUpdate);
progressRangeInput.addEventListener("input", () => {
  const floor = Number(progressRangeInput.dataset.floor) || 0;
  if (Number(progressRangeInput.value) < floor) {
    progressRangeInput.value = String(floor);
  }
  progressRangeValue.textContent = `${progressRangeInput.value}%`;
});
difficultyToggle.querySelectorAll(".difficulty-option").forEach((button) => {
  button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty));
});
editDifficultyToggle.querySelectorAll(".difficulty-option").forEach((button) => {
  button.addEventListener("click", () => selectEditDifficulty(button.dataset.difficulty));
});
editTaskForm.addEventListener("submit", handleEditSave);
editCancelBtn.addEventListener("click", closeEditModal);
editDeleteBtn.addEventListener("click", handleEditDelete);
achievementsBtn.addEventListener("click", openAchievementsModal);
achievementsCloseBtn.addEventListener("click", () => { achievementsModal.hidden = true; });
archiveDetailBtn?.addEventListener("click", openQuestArchiveModal);
questArchiveCloseBtn?.addEventListener("click", closeQuestArchiveModal);
questArchiveModal?.addEventListener("click", (e) => {
  if (e.target === questArchiveModal) closeQuestArchiveModal();
});
archiveSearchInput?.addEventListener("input", () => {
  if (!questArchiveModal?.hidden) renderQuestArchiveModal();
});
archiveSortSelect?.addEventListener("change", () => {
  if (!questArchiveModal?.hidden) renderQuestArchiveModal();
});
archiveFilterDifficulty?.addEventListener("change", () => {
  if (!questArchiveModal?.hidden) renderQuestArchiveModal();
});
archiveFilterMonster?.addEventListener("change", () => {
  if (!questArchiveModal?.hidden) renderQuestArchiveModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && questArchiveModal && !questArchiveModal.hidden) {
    closeQuestArchiveModal();
  }
});
window.addEventListener("resize", () => {
  updateHeroAttackOffset();
  updateMonsterAttackOffset();
});

async function initApp() {
  setupAssetFrames();
  selectDifficulty(taskDifficultyInput.value);

  try {
    const [taskData, completedData, statsData] = await Promise.all([
      api("/tasks"),
      api("/tasks?include_completed=true"),
      api("/player/stats"),
    ]);

    tasks = taskData.tasks;
    completedTasks = completedData.tasks.filter((t) => t.isCompleted);

    Object.assign(battleState, {
      heroLevel: statsData.heroLevel,
      currentXp: statsData.currentXp,
      xpToLevel: statsData.xpToLevel,
      heroHp: statsData.heroHp,
      heroMaxHp: statsData.heroMaxHp,
    });

    if (tasks.length > 0) {
      selectedTaskId = tasks[0].id;
      const firstTask = tasks[0];
      const cat = monsterCatalog.find((m) => m.id === firstTask.monsterId);
      if (cat) {
        cat.maxHp = firstTask.monsterMaxHp;
        cat.power = String(firstTask.monsterPower);
      }
    }
  } catch (err) {
    addLogEntry(combatLog, `Backend not available, using offline mode. (${err.message})`);
  }

  applyCurrentMonsterVisuals();
  updateHeroAttackOffset();
  updateMonsterAttackOffset();
  setBattleHeroState("idle");
  setBattleMonsterState("idle");
  renderInfoDashboard();
}

async function initApp() {
  setupAssetFrames();
  selectDifficulty(taskDifficultyInput.value);

  try {
    const [taskData, completedData, statsData] = await Promise.all([
      api("/tasks"),
      api("/tasks?include_completed=true"),
      api("/player/stats"),
    ]);

    // 🎊 如果成功拿到数据，说明已登录，隐藏拦截弹窗
    if (authModal) authModal.style.display = "none";

    tasks = taskData.tasks;
    completedTasks = completedData.tasks.filter((t) => t.isCompleted);

    Object.assign(battleState, {
      heroLevel: statsData.heroLevel,
      currentXp: statsData.currentXp,
      xpToLevel: statsData.xpToLevel,
      heroHp: statsData.heroHp,
      heroMaxHp: statsData.heroMaxHp,
    });

    if (tasks.length > 0) {
      selectedTaskId = tasks[0].id;
      const firstTask = tasks[0];
      const cat = monsterCatalog.find((m) => m.id === firstTask.monsterId);
      if (cat) {
        cat.maxHp = firstTask.monsterMaxHp;
        cat.power = String(firstTask.monsterPower);
      }
    }
  } catch (err) {
    // 此时大概率是因为 401 未登录被拦截，页面会保持显示登录弹窗
    addLogEntry(combatLog, `Waiting for hero authentication... (${err.message})`);
  }

  applyCurrentMonsterVisuals();
  updateHeroAttackOffset();
  updateMonsterAttackOffset();
  setBattleHeroState("idle");
  setBattleMonsterState("idle");
  renderInfoDashboard();
}


