const symbols = ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7"];
const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7",
   "10枚役", "リプレイ", "15枚役", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ",
   "twins", "2枚役", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役", "15枚役", "リプレイ", "10枚役", "2枚役"],
  ["モツオ", "10枚役", "リプレイ", "15枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7",
   "10枚役", "twins", "リプレイ", "2枚役", "10枚役", "リプレイ", "15枚役", "2枚役", "10枚役", "リプレイ", "twins", "2枚役"]
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

let gameState = "NORMAL";
let score = 100;
let currentSymbols = [0, 0, 0];
let reelSpinning = [false, false, false];
let intervalIds = [null, null, null];
let bonusQueue = null;
let bonusCounter = 0;

function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

function startSpin() {
  if (reelSpinning.some(spin => spin)) return; // 回転中防止
  hideBonusMessages();
  startReels();
  score -= 3; // 回転時 -3
  updateScoreDisplay();
}

function startReels() {
  for (let i = 0; i < 3; i++) {
    reelSpinning[i] = true;
    intervalIds[i] = setInterval(() => {
      currentSymbols[i] = (currentSymbols[i] + 1) % reels[i].length;
      updateReelDisplay(i);
    }, 100);
  }
}

function stopReel(index) {
  if (!reelSpinning[index]) return;
  clearInterval(intervalIds[index]);
  reelSpinning[index] = false;

  if (!reelSpinning.includes(true)) {
    evaluateResult();
  }
}

function updateReelDisplay(reelIndex) {
  const reel = document.getElementById(["reel-left", "reel-center", "reel-right"][reelIndex]);
  reel.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const idx = (currentSymbols[reelIndex] + i + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][idx];
    const img = document.createElement("img");
    img.src = symbolImages[symbol];
    img.style.width = "100%";
    img.style.height = "160px";
    img.style.objectFit = "contain";
    img.style.backgroundColor = "white";
    img.style.margin = "5px 0";
    reel.appendChild(img);
  }
}

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
    [visible[0][2], visible[1][1], visible[2][0]]  // 右上がり
  ];

  let hasMatched = false;
  let totalPayout = 0;

  for (const line of lines) {
    if (line.every(s => s === line[0])) {
      const symbol = line[0];
      if (symbol === "赤7" || symbol === "モツオ") {
        startBonus("BIG");
        setLcdMessage("ビッグボーナス！");
        return;
      } else if (symbol === "twins") {
        startBonus("REG");
        setLcdMessage("REGボーナス！");
        return;
      } else if (symbol === "リプレイ") {
        score += 3;
        setLcdMessage("再遊戯", 2000);
        updateScoreDisplay();
        return;
      } else {
        totalPayout += getPayout(symbol);
        hasMatched = true;
      }
    }
  }

  // 左リール中段：2枚役 → +2
  // 左リール上段・下段：2枚役 → +4
  if (visible[0][1] === "2枚役") totalPayout += 2;
  if (visible[0][0] === "2枚役" || visible[0][2] === "2枚役") totalPayout += 4;

  if (totalPayout > 0) {
    score += totalPayout;
    setLcdMessage(`小役揃い！ +${totalPayout}`);
  } else {
    score = Math.max(0, score); // ハズレの減算は回転時に済
  }

  updateScoreDisplay();
  checkBonusContinuation();
}

function getPayout(symbol) {
  switch (symbol) {
    case "10枚役": return 10;
    case "15枚役": return 15;
    default: return 0;
  }
}

function setLcdMessage(text, duration = 2000, blink = false) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
  if (blink) lcd.classList.add("blinking");
  else lcd.classList.remove("blinking");

  setTimeout(() => {
    lcd.textContent = "";
    lcd.classList.remove("blinking");
  }, duration);
}

function startBonus(type) {
  gameState = type;
  bonusCounter = type === "BIG" ? 30 : 10;
  document.getElementById("bonus-message").classList.remove("hidden");
  document.getElementById("bonus-continue").classList.add("hidden");
  if (bonusQueue) {
    document.getElementById("bonus-continue").classList.remove("hidden");
  }
}

function checkBonusContinuation() {
  if (gameState === "BIG" || gameState === "REG") {
    bonusCounter--;
    if (bonusCounter <= 0) {
      gameState = "NORMAL";
      hideBonusMessages();
    }
  }
}

function hideBonusMessages() {
  document.getElementById("bonus-message").classList.add("hidden");
  document.getElementById("bonus-continue").classList.add("hidden");
}

document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

updateScoreDisplay();
