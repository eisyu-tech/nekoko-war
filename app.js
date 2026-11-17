const canvas = document.querySelector("#battlefield");
const ctx = canvas.getContext("2d");
const energyLabel = document.querySelector("#energy-label");
const energyBar = document.querySelector("#energy-bar");
const homeHpLabel = document.querySelector("#home-hp-label");
const homeHpBar = document.querySelector("#home-hp-bar");
const enemyHpLabel = document.querySelector("#enemy-hp-label");
const enemyHpBar = document.querySelector("#enemy-hp-bar");
const waveLabel = document.querySelector("#wave-label");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const message = document.querySelector("#battle-message");
const statusPill = document.querySelector(".status-pill");
const unitButtons = [...document.querySelectorAll(".unit-card")];
const screens = {
  home: document.querySelector("#home-screen"),
  battle: document.querySelector("#battle-screen"),
  powerup: document.querySelector("#powerup-screen"),
  formation: document.querySelector("#formation-screen")
};
const pageLabel = document.querySelector("#page-label");
const navButtons = [...document.querySelectorAll(".nav-button")];
const coinLabels = [document.querySelector("#coin-label"), document.querySelector("#upgrade-coin-label")];
const upgradeButtons = [...document.querySelectorAll(".upgrade-button")];
const rosterButtons = [...document.querySelectorAll(".roster-card")];

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = 340;
const bases = { home: { x: 91, hp: 1000, maxHp: 1000 }, enemy: { x: 909, hp: 1200, maxHp: 1200 } };
const unitTypes = {
  scout: { name: "ちびねこ", cost: 50, hp: 100, damage: 24, speed: 47, range: 32, cooldown: 0.8, color: "#fffaf0", accent: "#8b73e8", level: 1 },
  guard: { name: "まもりねこ", cost: 90, hp: 280, damage: 19, speed: 23, range: 34, cooldown: 1.15, color: "#ffe5d4", accent: "#ef8a69", level: 1 },
  mage: { name: "ほしねこ", cost: 75, hp: 85, damage: 37, speed: 25, range: 150, cooldown: 1.7, color: "#eff7ff", accent: "#63a6e8", level: 1 }
};

let units = [];
let effects = [];
let energy = 100;
let coins = 1250;
let elapsed = 0;
let spawnTimer = 3;
let enemyCount = 0;
let paused = false;
let gameOver = false;
let currentScreen = "home";
let hasStartedBattle = false;
let selectedUnits = new Set(["scout", "guard", "mage"]);
let uiTimer = 0;
let lastFrame = 0;
let animationTime = 0;

function showScreen(name) {
  const screen = screens[name];
  if (!screen) return;
  currentScreen = name;
  for (const [screenName, element] of Object.entries(screens)) {
    const active = screenName === name;
    element.hidden = !active;
    element.classList.toggle("active", active);
  }
  for (const button of navButtons) {
    const active = button.dataset.screen === name;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  pageLabel.textContent = { home: "ホーム", battle: "バトル", powerup: "パワーアップ", formation: "キャラ編成" }[name];
  if (name === "battle") renderHud();
}

function renderCoins() {
  for (const label of coinLabels) label.textContent = coins.toLocaleString("ja-JP");
}

function renderFormation() {
  document.querySelector("#formation-count").textContent = selectedUnits.size;
  for (const button of rosterButtons) {
    const selected = selectedUnits.has(button.dataset.roster);
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
  for (const button of unitButtons) {
    button.hidden = !selectedUnits.has(button.dataset.unit);
  }
}

function resetGame() {
  units = [];
  effects = [];
  energy = 100;
  elapsed = 0;
  spawnTimer = 3;
  enemyCount = 0;
  paused = false;
  gameOver = false;
  uiTimer = 0;
  bases.home.hp = bases.home.maxHp;
  bases.enemy.hp = bases.enemy.maxHp;
  message.classList.remove("visible");
  pauseButton.textContent = "Ⅱ";
  pauseButton.setAttribute("aria-label", "ゲームを一時停止");
  statusPill.innerHTML = '<span class="status-dot"></span>防衛中';
  renderHud();
}

function deploy(type) {
  const stats = unitTypes[type];
  if (paused || gameOver || energy < stats.cost) return;
  energy -= stats.cost;
  units.push({
    team: "home",
    type,
    x: 145,
    y: GROUND_Y,
    hp: stats.hp,
    maxHp: stats.hp,
    attackTimer: 0.18,
    bob: Math.random() * Math.PI * 2
  });
  renderHud();
}

function spawnEnemy() {
  enemyCount += 1;
  const tough = enemyCount % 4 === 0;
  const type = tough ? "brute" : "mote";
  const ramp = Math.floor(elapsed / 35);
  units.push({
    team: "enemy",
    type,
    x: 855,
    y: GROUND_Y,
    hp: (tough ? 220 : 95) + ramp * (tough ? 35 : 16),
    maxHp: (tough ? 220 : 95) + ramp * (tough ? 35 : 16),
    damage: (tough ? 31 : 17) + ramp * 3,
    speed: tough ? 20 : 32 + Math.min(ramp * 2, 12),
    range: tough ? 39 : 32,
    cooldown: tough ? 1.35 : 1.05,
    color: tough ? "#bd7781" : "#8a9e80",
    attackTimer: 0.35,
    bob: Math.random() * Math.PI * 2
  });
}

function getStats(unit) {
  return unit.team === "home" ? unitTypes[unit.type] : unit;
}

function updateBattle(dt) {
  elapsed += dt;
  energy = Math.min(200, energy + dt * 13);
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(2.4, 5.2 - elapsed * 0.012);
  }

  for (const unit of units) {
    const stats = getStats(unit);
    unit.attackTimer -= dt;
    const direction = unit.team === "home" ? 1 : -1;
    const base = unit.team === "home" ? bases.enemy : bases.home;
    const opponents = units
      .filter(other => other.team !== unit.team && (other.x - unit.x) * direction > 0)
      .sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x));
    const target = opponents[0];
    const baseDistance = Math.abs(base.x - unit.x) - 28;
    const targetDistance = target ? Math.abs(target.x - unit.x) - 25 : baseDistance;
    const range = stats.range;

    if (target ? targetDistance > range : baseDistance > range) {
      unit.x += direction * stats.speed * dt;
    }

    const canAttack = target ? targetDistance <= range : baseDistance <= range;
    if (unit.attackTimer <= 0 && canAttack) {
      unit.attackTimer = stats.cooldown;
      const victim = target && targetDistance <= range ? target : base;
      victim.hp = Math.max(0, victim.hp - (stats.damage ?? unit.damage));
      effects.push({
        x1: unit.x + direction * 13,
        x2: victim.x,
        y: GROUND_Y - (range > 80 ? 36 : 20),
        ttl: range > 80 ? 0.25 : 0.14,
        color: unit.type === "mage" ? "#81bfff" : unit.team === "home" ? "#a896ff" : "#ed9983"
      });
    }
  }

  units = units.filter(unit => unit.hp > 0);
  effects = effects.filter(effect => (effect.ttl -= dt) > 0);
  if (bases.enemy.hp <= 0) finishGame(true);
  else if (bases.home.hp <= 0) finishGame(false);

  uiTimer += dt;
  if (uiTimer >= 0.1) {
    uiTimer = 0;
    renderHud();
  }
}

function finishGame(won) {
  gameOver = true;
  if (won) {
    coins += 120;
    renderCoins();
  }
  message.textContent = won ? "おうちを守りきった！" : "おうちがピンチ…";
  message.classList.add("visible");
  statusPill.innerHTML = `<span class="status-dot"></span>${won ? "勝利！" : "防衛失敗"}`;
  renderHud();
}

function renderHud() {
  energyLabel.textContent = Math.floor(energy);
  energyBar.style.width = `${energy / 2}%`;
  homeHpLabel.textContent = `${Math.ceil(bases.home.hp)} / ${bases.home.maxHp}`;
  homeHpBar.style.width = `${(bases.home.hp / bases.home.maxHp) * 100}%`;
  enemyHpLabel.textContent = `${Math.ceil(bases.enemy.hp)} / ${bases.enemy.maxHp}`;
  enemyHpBar.style.width = `${(bases.enemy.hp / bases.enemy.maxHp) * 100}%`;
  waveLabel.textContent = String(Math.floor(elapsed / 25) + 1).padStart(2, "0");
  for (const button of unitButtons) {
    button.disabled = paused || gameOver || energy < unitTypes[button.dataset.unit].cost;
  }
}

function upgradeUnit(button) {
  const unit = unitTypes[button.dataset.upgrade];
  const cost = Number(button.dataset.cost);
  if (!unit || !Number.isFinite(cost) || coins < cost) return;

  coins -= cost;
  unit.level += 1;
  if (button.dataset.upgrade === "guard") unit.hp += 30;
  else unit.damage += button.dataset.upgrade === "mage" ? 8 : 5;

  const card = button.closest(".upgrade-card");
  card.querySelector(".upgrade-details strong span").textContent = `Lv. ${unit.level}`;
  card.querySelector(".upgrade-progress i").style.width = `${Math.min(100, 25 + (unit.level - 1) * 15)}%`;
  button.querySelector("span").textContent = `${cost + 60} ✦`;
  button.dataset.cost = String(cost + 60);
  renderCoins();
  for (const upgradeButton of upgradeButtons) {
    upgradeButton.disabled = coins < Number(upgradeButton.dataset.cost);
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#c8e8ff");
  sky.addColorStop(0.65, "#f5f2e8");
  sky.addColorStop(1, "#dce9c7");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#ffffff80";
  for (const cloud of [{ x: 160, y: 80, s: 1 }, { x: 450, y: 49, s: 0.72 }, { x: 730, y: 98, s: 0.9 }]) {
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, 37 * cloud.s, 10 * cloud.s, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x - 19 * cloud.s, cloud.y + 2, 15 * cloud.s, 9 * cloud.s, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x + 17 * cloud.s, cloud.y, 19 * cloud.s, 12 * cloud.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#acd4b0";
  ctx.beginPath();
  ctx.moveTo(0, 237);
  ctx.quadraticCurveTo(180, 161, 348, 238);
  ctx.quadraticCurveTo(525, 162, 687, 233);
  ctx.quadraticCurveTo(847, 172, 1000, 228);
  ctx.lineTo(1000, GROUND_Y);
  ctx.lineTo(0, GROUND_Y);
  ctx.fill();

  ctx.fillStyle = "#9dc99f";
  for (const x of [225, 260, 667, 701, 765]) {
    ctx.beginPath();
    ctx.arc(x, GROUND_Y - 49, 18, Math.PI, 0);
    ctx.arc(x + 22, GROUND_Y - 51, 15, Math.PI, 0);
    ctx.fill();
  }

  ctx.fillStyle = "#b9d88d";
  ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
  ctx.fillStyle = "#a8cc7f";
  ctx.fillRect(0, GROUND_Y, WIDTH, 9);
  ctx.fillStyle = "#91bb76";
  for (let x = 18; x < WIDTH; x += 35) {
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y + 45 + (x % 3) * 7, 2, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#ffffff55";
  ctx.fillRect(0, GROUND_Y + 1, WIDTH, 2);
}

function drawBase(base, team) {
  const home = team === "home";
  const x = base.x;
  const y = GROUND_Y;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#6b7b65";
  ctx.beginPath();
  ctx.ellipse(0, 1, 49, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = home ? "#f7f4ff" : "#fff0e9";
  ctx.strokeStyle = home ? "#8976c7" : "#c98574";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-32, -79, 64, 78, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = home ? "#ddd4ff" : "#f4c7b5";
  ctx.beginPath();
  ctx.moveTo(-38, -75);
  ctx.lineTo(0, -112);
  ctx.lineTo(38, -75);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(-11, -34, 22, 33, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = home ? "#8f78ec" : "#eb8c71";
  ctx.beginPath();
  ctx.arc(0, -88, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(home ? "N" : "!", 0, -88);
  if (!home) {
    ctx.fillStyle = "#66505a";
    ctx.fillRect(-21, -52, 4, 4);
    ctx.fillRect(17, -52, 4, 4);
    ctx.beginPath();
    ctx.arc(0, -44, 5, 0.1, Math.PI - 0.1);
    ctx.strokeStyle = "#66505a";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawUnit(unit) {
  const home = unit.team === "home";
  const stats = getStats(unit);
  const brute = unit.type === "brute";
  const isMage = unit.type === "mage";
  const scale = brute ? 1.2 : unit.type === "guard" ? 1.06 : 0.94;
  const bob = Math.sin(animationTime * 7 + unit.bob) * 2;
  ctx.save();
  ctx.translate(unit.x, GROUND_Y - 2 + bob);
  ctx.scale(scale * (home ? 1 : -1), scale);
  ctx.fillStyle = "#52624b55";
  ctx.beginPath();
  ctx.ellipse(0, 1, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const fill = home ? stats.color : unit.color;
  const outline = home ? "#625d72" : "#68565a";
  ctx.lineWidth = 2.3;
  ctx.strokeStyle = outline;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(-15, -28);
  ctx.lineTo(-16, -45);
  ctx.quadraticCurveTo(-15, -54, -9, -49);
  ctx.lineTo(-3, -44);
  ctx.quadraticCurveTo(9, -51, 16, -42);
  ctx.lineTo(17, -23);
  ctx.quadraticCurveTo(17, -8, 0, -7);
  ctx.quadraticCurveTo(-17, -8, -15, -28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = home ? stats.accent : brute ? "#77515a" : "#d88b6d";
  ctx.beginPath();
  ctx.moveTo(-15, -43);
  ctx.lineTo(-18, -57);
  ctx.lineTo(-6, -47);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4, -47);
  ctx.lineTo(14, -56);
  ctx.lineTo(16, -39);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(-6, -32, 3.2, 4.2, 0, 0, Math.PI * 2);
  ctx.ellipse(7, -32, 3.2, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#373747";
  ctx.beginPath();
  ctx.arc(-5, -31, 1.6, 0, Math.PI * 2);
  ctx.arc(8, -31, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-1, -24);
  ctx.lineTo(1, -24);
  ctx.lineTo(0, -22);
  ctx.stroke();

  if (home) {
    ctx.fillStyle = stats.accent;
    ctx.beginPath();
    ctx.roundRect(-14, -18, 28, 8, 3);
    ctx.fill();
    if (unit.type === "guard") {
      ctx.fillStyle = "#e9a874";
      ctx.beginPath();
      ctx.roundRect(11, -31, 9, 22, 4);
      ctx.fill();
      ctx.strokeStyle = "#9b725e";
      ctx.stroke();
    } else if (isMage) {
      ctx.fillStyle = "#f4cf67";
      ctx.beginPath();
      ctx.arc(0, -49, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#724c57";
    ctx.fillRect(-11, -17, 4, 7);
    ctx.fillRect(7, -17, 4, 7);
    ctx.fillStyle = "#fff1df";
    ctx.beginPath();
    ctx.moveTo(4, -23);
    ctx.lineTo(11, -19);
    ctx.lineTo(4, -18);
    ctx.fill();
  }
  ctx.restore();

  const barWidth = brute || unit.type === "guard" ? 36 : 29;
  const barY = GROUND_Y - 66 * scale + bob;
  ctx.fillStyle = "#ffffffc9";
  ctx.beginPath();
  ctx.roundRect(unit.x - barWidth / 2 - 1, barY - 1, barWidth + 2, 5, 3);
  ctx.fill();
  ctx.fillStyle = home ? "#7a62e5" : "#e47e68";
  ctx.beginPath();
  ctx.roundRect(unit.x - barWidth / 2, barY, barWidth * Math.max(0, unit.hp / unit.maxHp), 3, 2);
  ctx.fill();
}

function drawEffects() {
  for (const effect of effects) {
    const alpha = Math.min(1, effect.ttl * 6);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(effect.x1, effect.y);
    ctx.lineTo(effect.x2, effect.y);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(effect.x2, effect.y, effect.ttl > 0.16 ? 7 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();
  drawBase(bases.home, "home");
  drawBase(bases.enemy, "enemy");
  drawEffects();
  for (const unit of units) drawUnit(unit);
  if (paused && !gameOver) {
    ctx.fillStyle = "#18203370";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#fff";
    ctx.font = "800 27px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAUSED", WIDTH / 2, HEIGHT / 2);
  }
}

function frame(timestamp) {
  const dt = Math.min((timestamp - lastFrame) / 1000 || 0, 0.05);
  lastFrame = timestamp;
  animationTime += dt;
  if (currentScreen === "battle") {
    if (!paused && !gameOver) updateBattle(dt);
    draw();
  }
  requestAnimationFrame(frame);
}

for (const button of document.querySelectorAll("[data-screen]")) {
  button.addEventListener("click", event => {
    if (button.tagName === "A") event.preventDefault();
    const screen = button.dataset.screen;
    if (screen === "battle" && (!hasStartedBattle || gameOver)) {
      resetGame();
      hasStartedBattle = true;
    }
    showScreen(screen);
  });
}

for (const button of unitButtons) {
  button.addEventListener("click", () => deploy(button.dataset.unit));
}

for (const button of upgradeButtons) {
  button.addEventListener("click", () => upgradeUnit(button));
}

for (const button of rosterButtons) {
  button.addEventListener("click", () => {
    const id = button.dataset.roster;
    if (selectedUnits.has(id)) {
      if (selectedUnits.size === 1) return;
      selectedUnits.delete(id);
    } else if (selectedUnits.size < 5) {
      selectedUnits.add(id);
    }
    renderFormation();
  });
}

pauseButton.addEventListener("click", () => {
  if (gameOver) return;
  paused = !paused;
  pauseButton.textContent = paused ? "▶" : "Ⅱ";
  pauseButton.setAttribute("aria-label", paused ? "ゲームを再開" : "ゲームを一時停止");
  statusPill.innerHTML = `<span class="status-dot"></span>${paused ? "一時停止中" : "防衛中"}`;
  renderHud();
});

restartButton.addEventListener("click", resetGame);

resetGame();
renderCoins();
renderFormation();
showScreen("home");
requestAnimationFrame(frame);
