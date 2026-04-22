/* ── Admin Dashboard JS ─────────────────────────────────── */

const API = "/api";

// ── Helpers ──────────────────────────────────────────────

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, { credentials: "include", ...opts });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw { status: res.status, message: body.error || res.statusText };
  }
  return res.json();
}

function $(id) { return document.getElementById(id); }

function show(id) { $(id).hidden = false; }
function hide(id) { $(id).hidden = true; }

// ── Boot ─────────────────────────────────────────────────

async function boot() {
  let me;
  try {
    me = await apiFetch("/auth/me");
  } catch (e) {
    show("not-logged-in");
    return;
  }

  if (!me.is_admin) {
    show("access-denied");
    return;
  }

  $("admin-user-chip").textContent = me.username;
  show("admin-panel");

  initTabs();
  await loadOverview();
}

// ── Tabs ─────────────────────────────────────────────────

let chartsLoaded = false;
let usersLoaded  = false;

function initTabs() {
  document.querySelectorAll(".admin-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".admin-content").forEach(s => s.hidden = true);

      btn.classList.add("active");
      const tab = btn.dataset.tab;
      $("tab-" + tab).hidden = false;

      if (tab === "users" && !usersLoaded)  { loadUsers();  usersLoaded  = true; }
      if (tab === "charts" && !chartsLoaded) { loadCharts(); chartsLoaded = true; }
    });
  });
}

// ── Overview ─────────────────────────────────────────────

async function loadOverview() {
  const data = await apiFetch("/admin/stats");
  const ov = data.overview;

  $("stat-users").textContent     = ov.total_users;
  $("stat-tasks").textContent     = ov.total_tasks;
  $("stat-completed").textContent = ov.completed_tasks;
  $("stat-active").textContent    = ov.active_tasks;
  $("stat-updates").textContent   = ov.total_updates;
  $("stat-rate").textContent      = ov.completion_rate + "%";

  renderDifficultyBars(data.difficulty_distribution);
  renderMonsterBars(data.monster_defeats);

  // stash for charts tab
  window._adminStats = data;
}

function renderDifficultyBars(dist) {
  const order = ["Easy", "Medium", "Hard"];
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
  const container = $("difficulty-bars");
  container.innerHTML = "";

  order.forEach(key => {
    const count = dist[key] || 0;
    const pct   = Math.round(count / total * 100);
    const cls   = key.toLowerCase();
    container.insertAdjacentHTML("beforeend", `
      <div class="bar-row">
        <span class="bar-label">${key}</span>
        <div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div>
        <span class="bar-count">${count}</span>
      </div>`);
  });
}

function renderMonsterBars(monsters) {
  const max = Math.max(...monsters.map(m => m.count), 1);
  const container = $("monster-bars");
  container.innerHTML = "";

  if (!monsters.length) {
    container.innerHTML = `<p style="color:var(--text-muted);font-size:.85rem">No defeats yet.</p>`;
    return;
  }

  monsters.forEach(m => {
    const pct = Math.round(m.count / max * 100);
    container.insertAdjacentHTML("beforeend", `
      <div class="bar-row">
        <span class="bar-label">${m.name}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <span class="bar-count">${m.count}</span>
      </div>`);
  });
}

// ── Users ─────────────────────────────────────────────────

let allUsers = [];
let currentUserId = null;

async function loadUsers() {
  const [meData, usersData] = await Promise.all([
    apiFetch("/auth/me"),
    apiFetch("/admin/users"),
  ]);
  currentUserId = meData.id;
  allUsers = usersData.users;
  renderUsers(allUsers);

  $("user-search").addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    renderUsers(allUsers.filter(u => u.username.toLowerCase().includes(q)));
  });
}

function renderUsers(users) {
  const tbody = $("users-tbody");
  tbody.innerHTML = "";

  users.forEach(u => {
    const joined = u.created_at ? u.created_at.slice(0, 10) : "—";
    const isSelf = u.id === currentUserId;
    const adminBadge = u.is_admin
      ? `<span class="badge-admin">Admin</span>`
      : `<span style="color:var(--text-muted)">—</span>`;
    const toggleLabel = u.is_admin ? "Revoke" : "Grant";
    const selfClass   = isSelf ? " is-self" : "";
    const selfDisabled = isSelf ? "disabled" : "";

    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td>${u.id}</td>
        <td>${escHtml(u.username)}</td>
        <td>${u.hero_level}</td>
        <td>${u.total_tasks}</td>
        <td>${u.tasks_completed}</td>
        <td>${u.current_streak}</td>
        <td>${u.best_streak}</td>
        <td>${joined}</td>
        <td>
          ${adminBadge}
          <button class="toggle-admin-btn${selfClass}" data-uid="${u.id}" ${selfDisabled}
                  style="margin-left:.5rem">${toggleLabel}</button>
        </td>
      </tr>`);
  });

  tbody.querySelectorAll(".toggle-admin-btn:not([disabled])").forEach(btn => {
    btn.addEventListener("click", () => toggleAdmin(Number(btn.dataset.uid)));
  });
}

async function toggleAdmin(uid) {
  try {
    const res = await apiFetch(`/admin/users/${uid}/toggle-admin`, { method: "POST" });
    const user = allUsers.find(u => u.id === uid);
    if (user) user.is_admin = res.is_admin;
    renderUsers(allUsers.filter(u =>
      u.username.toLowerCase().includes($("user-search").value.toLowerCase())
    ));
  } catch (e) {
    alert("Error: " + e.message);
  }
}

// ── Charts ────────────────────────────────────────────────

async function loadCharts() {
  const data = window._adminStats || await apiFetch("/admin/stats");

  drawLineChart("reg-chart",   data.registrations_by_day, "Registrations", "#f7cf6d");
  drawLineChart("tasks-chart", data.tasks_by_day,          "Quests Created", "#6df7ba");
}

function drawLineChart(canvasId, rawData, label, color) {
  // Build last-14-days labels
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const lookup = {};
  rawData.forEach(r => { lookup[r.day] = r.count; });
  const values = days.map(d => lookup[d] || 0);

  const canvas = $(canvasId);
  const ctx    = canvas.getContext("2d");
  const W = canvas.offsetWidth  || 400;
  const H = canvas.offsetHeight || 220;
  canvas.width  = W;
  canvas.height = H;

  const pad = { top: 20, right: 20, bottom: 40, left: 36 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top  - pad.bottom;
  const maxVal = Math.max(...values, 1);

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth   = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(167,183,218,0.6)";
    ctx.font      = "11px Rajdhani, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(Math.round(maxVal * i / 4), pad.left - 6, y + 4);
  }

  // X labels (every 2 days)
  ctx.fillStyle = "rgba(167,183,218,0.6)";
  ctx.font      = "10px Rajdhani, sans-serif";
  ctx.textAlign = "center";
  days.forEach((d, i) => {
    if (i % 2 !== 0) return;
    const x = pad.left + (i / (days.length - 1)) * chartW;
    ctx.fillText(d.slice(5), x, H - pad.bottom + 16);
  });

  // Area fill
  const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
  gradient.addColorStop(0, color + "44");
  gradient.addColorStop(1, color + "00");

  ctx.beginPath();
  days.forEach((_, i) => {
    const x = pad.left + (i / (days.length - 1)) * chartW;
    const y = pad.top  + chartH - (values[i] / maxVal) * chartH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(pad.left + chartW, pad.top + chartH);
  ctx.lineTo(pad.left,          pad.top + chartH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  ctx.lineJoin    = "round";
  days.forEach((_, i) => {
    const x = pad.left + (i / (days.length - 1)) * chartW;
    const y = pad.top  + chartH - (values[i] / maxVal) * chartH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  days.forEach((_, i) => {
    const x = pad.left + (i / (days.length - 1)) * chartW;
    const y = pad.top  + chartH - (values[i] / maxVal) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

// ── Util ──────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Init ──────────────────────────────────────────────────

boot();
