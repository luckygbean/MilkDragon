const battleState = {
  heroLevel: 7,
  currentXp: 180,
  xpToLevel: 300,
  xpGainPerHit: 40,
  heroHp: 72,
  heroMaxHp: 72,
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

const initialTasks = [
  {
    id: 1,
    name: "Refactor the Dashboard Header",
    description: "Clean up the layout, improve spacing, and make the header responsive for tablet and desktop breakpoints.",
    difficulty: "Hard",
    deadline: "2026-03-24",
    progress: 45,
    latestNote: "Mapped the spacing issues and isolated the responsive breakpoints.",
    updates: [
      { date: "2026-03-18", percent: 45, note: "Mapped the spacing issues and isolated the responsive breakpoints." },
      { date: "2026-03-17", percent: 30, note: "Rebuilt the header structure and cleaned up utility classes." },
      { date: "2026-03-16", percent: 15, note: "Audited the layout and captured current UX issues." }
    ]
  },
  {
    id: 2,
    name: "Write API Integration Tests",
    description: "Prepare stable request mocks and cover the main authentication and task retrieval flows.",
    difficulty: "Medium",
    deadline: "2026-03-22",
    progress: 60,
    latestNote: "Finished success-path tests and documented two missing edge cases.",
    updates: [
      { date: "2026-03-18", percent: 60, note: "Finished success-path tests and documented two missing edge cases." },
      { date: "2026-03-17", percent: 40, note: "Added fixtures for login and task list payloads." }
    ]
  },
  {
    id: 3,
    name: "Prepare Demo Presentation",
    description: "Build a polished walkthrough for the software engineering project demo with clear UX beats.",
    difficulty: "Easy",
    deadline: "2026-03-20",
    progress: 20,
    latestNote: "Outlined the storyline and gathered the first product screenshots.",
    updates: [
      { date: "2026-03-18", percent: 20, note: "Outlined the storyline and gathered the first product screenshots." }
    ]
  }
];

let tasks = structuredClone(initialTasks).map((task) => ({
  ...task,
  monsterId: randomItem(monsterCatalog).id
}));
let selectedTaskId = tasks[0].id;
let currentMonster = monsterCatalog[0];

const body = document.body;
const infoScene = document.getElementById("info-scene");
const battleScene = document.getElementById("battle-scene");
const startBattleButton = document.getElementById("start-battle-btn");
const backToInfoButton = document.getElementById("back-to-info-btn");
const battleAttackButton = document.getElementById("battle-attack-btn");
const enemyDebugButton = document.getElementById("enemy-debug-btn");
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
const battleTaskTitle = document.getElementById("battle-task-title");
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
  return tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];
}

function getMonsterById(monsterId) {
  return monsterCatalog.find((monster) => monster.id === monsterId) ?? monsterCatalog[0];
}

function syncCurrentMonsterToTask(task = getSelectedTask()) {
  currentMonster = getMonsterById(task.monsterId);
  battleState.monsterMaxHp = currentMonster.maxHp;

  if (battleState.monsterHp > battleState.monsterMaxHp || battleState.monsterHp <= 0) {
    battleState.monsterHp = currentMonster.maxHp;
  }
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
    `;

    button.addEventListener("click", () => {
      selectedTaskId = task.id;
      renderInfoDashboard();
      addLogEntry(combatLog, `Quest selected: ${task.name}.`);
    });

    activeTaskList.appendChild(button);
  });
}

function renderSelectedTask() {
  const task = getSelectedTask();
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
  battleTaskTitle.textContent = task.name;
  progressRangeInput.value = String(task.progress);
  progressRangeValue.textContent = `${task.progress}%`;
}

function renderProgressHistory() {
  const task = getSelectedTask();
  progressHistoryList.innerHTML = "";
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

  const locked = battleState.actionLocked || battleState.heroHp <= 0 || battleState.monsterHp <= 0;
  battleAttackButton.disabled = locked;
  enemyDebugButton.disabled = locked;
}

function renderInfoDashboard() {
  syncCurrentMonsterToTask();
  renderTaskList();
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

function switchScene(nextScene) {
  const showBattle = nextScene === "battle";
  battleState.currentScene = nextScene;
  infoScene.hidden = showBattle;
  battleScene.hidden = !showBattle;
  body.classList.toggle("battle-mode", showBattle);

  if (showBattle) {
    syncCurrentMonsterToTask();
    battleState.monsterHp = currentMonster.maxHp;
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

async function resolveTaskStrike() {
  if (battleState.monsterHp <= 0 || battleState.actionLocked || battleState.heroHp <= 0) {
    return;
  }

  battleState.actionLocked = true;
  renderBattleState();
  await playHeroAttackSequence();

  battleState.monsterHp = Math.max(0, battleState.monsterHp - battleState.attackDamage);
  applyXp(battleState.xpGainPerHit);
  renderBattleState();
  showXpPopup(battleState.xpGainPerHit);

  const damageMessage = `You completed a task strike and dealt ${battleState.attackDamage} damage.`;
  monsterIntent.textContent = randomItem(battleIntents);
  battleMonsterIntent.textContent = battleState.monsterHp > 0 ? currentMonster.attackCopy.recovered : "Defeated";
  progressText.textContent = `Momentum gained. Enemy HP reduced to ${battleState.monsterHp}.`;
  addLogEntry(combatLog, damageMessage);
  addLogEntry(battleLog, damageMessage);

  if (battleState.monsterHp === 0) {
    await playMonsterDeathSequence();
    addLogEntry(combatLog, `Victory. ${currentMonster.name} has been defeated.`);
    addLogEntry(battleLog, `${currentMonster.name} death animation finished.`);
  }

  battleState.actionLocked = false;
  renderBattleState();
}

async function triggerEnemyDebugAttack() {
  if (battleState.monsterHp <= 0 || battleState.actionLocked || battleState.heroHp <= 0) {
    return;
  }

  battleState.actionLocked = true;
  renderBattleState();
  await playEnemyAttackSequence();
  battleState.actionLocked = false;
  renderBattleState();
}

function selectDifficulty(nextDifficulty) {
  taskDifficultyInput.value = nextDifficulty;
  difficultyToggle.querySelectorAll(".difficulty-option").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.difficulty === nextDifficulty);
  });
}

function handleCreateTask(event) {
  event.preventDefault();

  const name = taskNameInput.value.trim();
  const description = taskDescriptionInput.value.trim();
  const difficulty = taskDifficultyInput.value;
  const deadline = taskDeadlineInput.value;

  if (!name || !description || !deadline) {
    return;
  }

  const assignedMonster = selectRandomMonster();

  const newTask = {
    id: Date.now(),
    name,
    description,
    difficulty,
    deadline,
    progress: 0,
    monsterId: assignedMonster.id,
    latestNote: "Quest created. Awaiting the first daily progress update.",
    updates: [
      {
        date: new Date().toISOString().slice(0, 10),
        percent: 0,
        note: "Quest created. Awaiting the first daily progress update."
      }
    ]
  };

  tasks.unshift(newTask);
  selectedTaskId = newTask.id;
  createTaskForm.reset();
  selectDifficulty("Easy");
  renderInfoDashboard();
  addLogEntry(combatLog, `New quest created: ${newTask.name}.`);
}

function handleProgressUpdate(event) {
  event.preventDefault();
  const task = getSelectedTask();
  const percent = Number(progressRangeInput.value);
  const note = progressNoteInput.value.trim() || "Daily progress update submitted.";
  const today = new Date().toISOString().slice(0, 10);

  task.progress = percent;
  task.latestNote = note;
  task.updates.unshift({
    date: today,
    percent,
    note
  });

  progressNoteInput.value = "";
  renderInfoDashboard();
  addLogEntry(combatLog, `Daily progress logged for ${task.name}: ${percent}%.`);
}

startBattleButton.addEventListener("click", () => switchScene("battle"));
backToInfoButton.addEventListener("click", () => switchScene("info"));
battleAttackButton.addEventListener("click", () => void resolveTaskStrike());
enemyDebugButton.addEventListener("click", () => void triggerEnemyDebugAttack());
createTaskForm.addEventListener("submit", handleCreateTask);
progressUpdateForm.addEventListener("submit", handleProgressUpdate);
progressRangeInput.addEventListener("input", () => {
  progressRangeValue.textContent = `${progressRangeInput.value}%`;
});
difficultyToggle.querySelectorAll(".difficulty-option").forEach((button) => {
  button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty));
});
window.addEventListener("resize", () => {
  updateHeroAttackOffset();
  updateMonsterAttackOffset();
});

setupAssetFrames();
selectDifficulty(taskDifficultyInput.value);
applyCurrentMonsterVisuals();
updateHeroAttackOffset();
updateMonsterAttackOffset();
setBattleHeroState("idle");
setBattleMonsterState("idle");
renderInfoDashboard();


