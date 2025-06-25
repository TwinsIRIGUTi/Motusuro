const PROB = {
  replay: 1 / 5,
  two: 1 / 5,
  two角: 1 / 8,
  ten: 1 / 7,
  fifteen: 1 / 15,
  big: 1 / 48,
  reg: 1 / 32,
  miss: 1 - (1 / 5 + 1 / 5 + 1 / 8 + 1 / 7 + 1 / 15 + 1 / 48 + 1 / 32)
};

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
let internalBonus = null;

function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

function startSpin() {
  if (reelSpinning.some(spin => spin)) return;

  // ボーナス抽選
  const r = Math.random();
  let sum = 0;
  for (const key of ["big", "reg"]) {
    sum += PROB[key];
    if (r < sum) {
      internalBonus = key.toUpperCase();
      break;
    }
  }

  document.getElementById("bonus-message").classList.add("hidden");
  document.getElementById("bonus-continue").classList.add("hidden");
  startReels();
  score -= 3;
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
  if (!reelSpinning.includes(true)) evaluateResult();
}

function updateReelDisplay(reelIndex) {
  const reel = document.getElementById(["reel-left", "reel-center", "reel-right"][reelIndex]);
  reel.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const idx = (currentSymbols[reelIndex] + i + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][idx];
    const img = document.createElement("img");
    img.src = symbolImages[symbol];
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
    [visible[0][2], visible[1][2], visible[2][2]],
    [visible[0][0], visible[1][1], visible[2][2]],
    [visible[0][2], visible[1][1], visible[2][0]]
  ];

  let matched = null;

  for (let line of lines) {
    if (line.every(s => s === line[0])) {
      matched = line[0];
      break;
    }
  }

  if (matched) {
    if (matched === "赤7" || matched === "モツオ") {
      startBonus("BIG");
    } else if (matched === "twins") {
      startBonus("REG");
    } else if (matched === "リプレイ") {
      score += 3;
      setLcdMessage("再遊戯");
    } else {
      score += getPayout(matched);
      setLcdMessage(`${matched} 揃い！`);
    }
  } else {
    // 2枚役特殊判定
    const leftMiddle = visible[0][1];
    const leftTop = visible[0][0];
    const leftBottom = visible[0][2];
    if (leftMiddle === "2枚役") {
      score += 2;
      setLcdMessage("2枚役（中段）！");
    } else if (leftTop === "2枚役" || leftBottom === "2枚役") {
      score += 4;
      setLcdMessage("2枚役（角）！");
    } else {
      setLcdMessage("");
    }
  }

  if (internalBonus) {
    startBonus(internalBonus);
    internalBonus = null;
  }

  updateScoreDisplay();
}

function getPayout(symbol) {
  switch (symbol) {
    case "2枚役": return 2;
    case "10枚役": return 10;
    case "15枚役": return 15;
    default: return 0;
  }
}

function setLcdMessage(text, duration = 2000) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
  setTimeout(() => {
    lcd.textContent = "";
  }, duration);
}

function startBonus(type) {
  gameState = type;
  bonusCounter = type === "BIG" ? 30 : 10;
  document.getElementById("bonus-message").classList.remove("hidden");
  document.getElementById("bonus-message").textContent = type === "BIG" ? "ビッグボーナス!!" : "twinsボーナス!!";
  document.getElementById("bonus-continue").classList.add("hidden");
}

document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

updateScoreDisplay();
