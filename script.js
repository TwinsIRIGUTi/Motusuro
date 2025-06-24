const symbols = ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7"];
const reels = [
  ["モツオ", "2枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "赤7", "赤7", "10枚役", "リプレイ", "15枚役", "twins", "2枚役", "赤7", "10枚役", "リプレイ", "15枚役", "10枚役", "リプレイ", "15枚役"],
  ["モツオ", "リプレイ", "10枚役", "2枚役", "赤7", "リプレイ", "10枚役", "2枚役", "リプレイ", "twins", "2枚役", "10枚役", "15枚役", "リプレイ", "モツオ", "2枚役", "10枚役", "15枚役", "リプレイ", "10枚役", "2枚役"],
  ["モツオ", "10枚役", "リプレイ", "15枚役", "twins", "10枚役", "リプレイ", "15枚役", "赤7", "10枚役", "twins", "リプレイ", "2枚役", "10枚役", "リプレイ", "15枚役", "2枚役", "10枚役", "リプレイ", "twins", "2枚役"]
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
  if (reelSpinning.some(spin => spin)) return;
  document.getElementById("bonus-message").classList.add("hidden");
  document.getElementById("bonus-continue").classList.add("hidden");
  setLcdMessage("");
  score -= 3;
  updateScoreDisplay();
  startReels();
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
  if (!reelSpinning.includes(true)) evaluateResult();
}

function updateReelDisplay(reelIndex) {
  let pos = currentSymbols[reelIndex];

  // 左リール：3連赤7制御（通常時のみ）
  if (reelIndex === 0 && gameState === "NORMAL") {
    const mid = reels[0][(pos + 0) % reels[0].length];
    const up  = reels[0][(pos - 1 + reels[0].length) % reels[0].length];
    const down= reels[0][(pos + 1) % reels[0].length];
    if (up === "赤7" && mid === "赤7" && down === "赤7") {
      pos = (pos + 1) % reels[0].length;
      currentSymbols[0] = pos;
    }
  }

  const reel = document.getElementById(["reel-left", "reel-center", "reel-right"][reelIndex]);
  reel.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const idx = (pos + i + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][idx];
    const img = document.createElement("img");
    img.src = symbolImages[symbol];
    img.classList.add("reel-symbol");
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
    [visible[0][1], visible[1][1], visible[2][1]],
    [visible[0][0], visible[1][0], visible[2][0]],
    [visible[0][2], visible[1][2], visible[2][2]]
  ];

  let totalWin = 0;
  let lcdShown = false;

  for (let line of lines) {
    if (line.every(s => s === line[0])) {
      const matched = line[0];
      if (matched === "赤7" || matched === "モツオ") {
        startBonus("BIG");
        lcdShown = true;
        break;
      } else if (matched === "twins") {
        startBonus("REG");
        lcdShown = true;
        break;
      } else {
        totalWin += getPayout(matched);
        lcdShown = true;
      }
    }
  }

  // 2枚役個別チェック
  const leftReel = visible[0];
  if (leftReel.includes("2枚役")) {
    const idx = leftReel.indexOf("2枚役");
    if (idx === 1) totalWin += 2;      // 中段
    else if (idx === 0 || idx === 2) totalWin += 4; // 上 or 下
    lcdShown = true;
  }

  if (totalWin > 0) {
    score += totalWin;
    setLcdMessage("小役 揃い！");
  } else if (!lcdShown) {
    for (let line of lines) {
      const counts = {};
      line.forEach(s => counts[s] = (counts[s] || 0) + 1);
      if (Object.values(counts).includes(2)) {
        setLcdMessage("モツモツ...", 2000, true);
        break;
      }
    }
  }

  updateScoreDisplay();
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
  if (blink) {
    lcd.classList.add("blinking");
  } else {
    lcd.classList.remove("blinking");
  }
  if (text) {
    setTimeout(() => {
      lcd.textContent = "";
      lcd.classList.remove("blinking");
    }, duration);
  }
}

function startBonus(type) {
  gameState = type;
  bonusCounter = type === "BIG" ? 30 : 10;
  const messageEl = document.getElementById("bonus-message");
  const continueEl = document.getElementById("bonus-continue");
  messageEl.textContent = type === "BIG" ? "ボーナス中！" : "REGボーナス！";
  messageEl.classList.remove("hidden");
  if (bonusQueue) {
    continueEl.classList.remove("hidden");
  } else {
    continueEl.classList.add("hidden");
  }
}

document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

updateScoreDisplay();
