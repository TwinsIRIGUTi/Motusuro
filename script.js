// --- リール定義（修正版） ---
const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7", "10枚役", "リプレイ", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ", "twins", "赤7", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役"],
  ["モツオ", "10枚役", "リプレイ", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "10枚役", "twins", "リプレイ", "赤7", "10枚役", "15枚役", "リプレイ", "twins", "2枚役"]
];

const symbolImages = {
  モツオ: 'images/motuo.png',
  赤7: 'images/aka7.png',
  twins: 'images/twins.png',
  お新香: 'images/oshinko.png',
  モツ焼き: 'images/motsuyaki.png',
  梅割り: 'images/umewari.png',
  リプレイ: 'images/replay.png',
  "2枚役": 'images/oshinko.png',
  "10枚役": 'images/motsuyaki.png',
  "15枚役": 'images/umewari.png'
};

let currentSymbols = [0, 0, 0];
let reelSpinning = [false, false, false];
let intervalIds = [null, null, null];
let gameState = "NORMAL";
let score = 100;

// ボーナスフラグ
let bonusPending = null; // "BIG" or "REG"

// --- UI更新 ---
function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

// --- 回転開始 ---
function startSpin() {
  if (reelSpinning.includes(true)) return;

  hideBonusMessages();
  score -= 3;
  updateScoreDisplay();

  for (let i = 0; i < 3; i++) {
    reelSpinning[i] = true;
    intervalIds[i] = setInterval(() => {
      currentSymbols[i] = (currentSymbols[i] + 1) % reels[i].length;
      updateReelDisplay(i);
    }, 100);
  }

  // ボーナス抽選
  const rand = Math.random();
  if (rand < 1 / 48) bonusPending = "BIG";
  else if (rand < 1 / 48 + 1 / 32) bonusPending = "REG";
  else bonusPending = null;
}

// --- スベリ処理 ---
function applySlip(reelIndex) {
  if (!bonusPending) return;

  const target = bonusPending === "BIG" ? ["赤7", "赤7", "赤7"] : ["twins", "twins", "twins"];
  const reel = reels[reelIndex];
  for (let slip = -6; slip <= 6; slip++) {
    let pos = (currentSymbols[reelIndex] + slip + reel.length) % reel.length;
    if (reel[pos] === target[reelIndex]) {
      currentSymbols[reelIndex] = pos;
      return;
    }
  }
}

// --- 停止 ---
function stopReel(index) {
  if (!reelSpinning[index]) return;

  clearInterval(intervalIds[index]);
  applySlip(index); // スベリ適用
  reelSpinning[index] = false;
  updateReelDisplay(index);

  if (reelSpinning.every(spin => !spin)) evaluateResult();
}

// --- リール描画 ---
function updateReelDisplay(reelIndex) {
  const reelEl = document.getElementById(["reel-left", "reel-center", "reel-right"][reelIndex]);
  reelEl.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const idx = (currentSymbols[reelIndex] + i + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][idx];
    const img = document.createElement("img");
    img.src = symbolImages[symbol];
    img.style.backgroundColor = "white";
    img.style.margin = "5px 0";
    reelEl.appendChild(img);
  }
}

// --- 判定処理 ---
function evaluateResult() {
  const visible = [[], [], []];
  for (let i = 0; i < 3; i++) {
    const pos = currentSymbols[i];
    for (let j = -1; j <= 1; j++) {
      const idx = (pos + j + reels[i].length) % reels[i].length;
      visible[i].push(reels[i][idx]);
    }
  }

  const lines = [
    [visible[0][1], visible[1][1], visible[2][1]], // 中段
    [visible[0][0], visible[1][0], visible[2][0]], // 上段
    [visible[0][2], visible[1][2], visible[2][2]], // 下段
    [visible[0][0], visible[1][1], visible[2][2]], // 右下がり
    [visible[0][2], visible[1][1], visible[2][0]]  // 左下がり
  ];

  for (const line of lines) {
    if (line.every(s => s === "赤7")) {
      startBonus("BIG");
      setLcdMessage("赤7 揃い！");
      return;
    } else if (line.every(s => s === "モツオ")) {
      startBonus("BIG");
      setLcdMessage("モツオ 揃い！");
      return;
    } else if (line.every(s => s === "twins")) {
      startBonus("REG");
      setLcdMessage("twins 揃い！");
      return;
    } else if (line.every(s => s === "リプレイ")) {
      score += 3;
      setLcdMessage("再遊戯");
      updateScoreDisplay();
      return;
    }
  }

  // モツモツ演出
  for (const line of lines) {
    const count = {};
    line.forEach(s => count[s] = (count[s] || 0) + 1);
    if (Object.values(count).includes(2)) {
      setLcdMessage("モツモツ...", 2000, true);
      break;
    }
  }

  bonusPending = null;
  updateScoreDisplay();
}

// --- ボーナス開始 ---
function startBonus(type) {
  document.getElementById("bonus-message").textContent =
    type === "BIG" ? "BIGボーナス中！" : "REGボーナス中！";
  document.getElementById("bonus-message").classList.remove("hidden");
  gameState = type;
  bonusPending = null;
}

// --- ユーティリティ ---
function hideBonusMessages() {
  document.getElementById("bonus-message").classList.add("hidden");
  document.getElementById("bonus-continue").classList.add("hidden");
}

function setLcdMessage(text, duration = 2000, blink = false) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
  lcd.classList.toggle("blinking", blink);
  setTimeout(() => {
    lcd.textContent = "";
    lcd.classList.remove("blinking");
  }, duration);
}

// --- イベント登録 ---
document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));
updateScoreDisplay();
