
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
  "モツオ": "images/motuo.PNG",
  "赤7": "images/aka7.PNG",
  "twins": "images/twins.PNG",
  "2枚役": "images/oshinko.PNG",
  "10枚役": "images/motsuyaki.PNG",
  "15枚役": "images/umewari.PNG",
  "リプレイ": "images/replay.PNG"
};

const reelElements = [
  document.getElementById("reel-left"),
  document.getElementById("reel-center"),
  document.getElementById("reel-right")
];

let currentSymbols = [0, 0, 0];
let spinning = [false, false, false];
let spinIntervals = [null, null, null];
let gameState = "NORMAL"; // NORMAL, BIG, REG
let bonusQueue = null;
let bonusCounter = 0;
let score = 100;

// DOM要素
const lcd = document.getElementById("lcd-display");
const bonusEffect = document.getElementById("bonus-effect");
const bonusMessage = document.getElementById("bonus-message");
const bonusContinue = document.getElementById("bonus-continue");

function getRandomSymbolIndex(reel) {
  return Math.floor(Math.random() * reels[reel].length);
}

function startReelSpin(reelIndex) {
  spinning[reelIndex] = true;
  spinIntervals[reelIndex] = setInterval(() => {
    currentSymbols[reelIndex] = getRandomSymbolIndex(reelIndex);
    updateReelDisplay(reelIndex);
  }, 100);
}

function stopReel(reelIndex) {
  if (spinning[reelIndex]) {
    clearInterval(spinIntervals[reelIndex]);
    spinning[reelIndex] = false;
    updateReelDisplay(reelIndex);
    if (spinning.every(s => !s)) {
      evaluateResult();
    }
  }
}

function spinReelsSequentially() {
  stopAllReels();
  hideBonusUI();
  let delay = 0;
  for (let i = 0; i < 3; i++) {
    setTimeout(() => startReelSpin(i), delay);
    delay += 300;
  }
  setLcdMessage("モツモツ...");
}

function stopAllReels() {
  for (let i = 0; i < 3; i++) {
    if (spinning[i]) {
      clearInterval(spinIntervals[i]);
      spinning[i] = false;
    }
  }
}

function updateReelDisplay(reelIndex) {
  const reel = reelElements[reelIndex];
  reel.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const index = (currentSymbols[reelIndex] + i + reels[reelIndex].length) % reels[reelIndex].length;
    const symbol = reels[reelIndex][index];
    const img = document.createElement("img");
    img.src = symbolImages[symbol] || "images/replay.PNG";
    img.alt = symbol;
    img.style.width = "100%";
    img.style.height = "80px";
    img.style.objectFit = "contain";
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

  let matched = null;
  for (let line of lines) {
    if (line.every(s => s === line[0])) {
      matched = line[0];
      break;
    }
  }

  if (matched) {
    setLcdMessage(`${matched} 揃い！`);
    if (matched === "赤7" || matched === "モツオ") {
      queueBonus("BIG");
    } else if (matched === "twins") {
      queueBonus("REG");
    } else {
      score += getPayout(matched);
    }
  } else {
    score -= 5;
  }

  if (score <= 0) {
    alert("ゲームオーバー");
    resetGame();
  } else if (score >= 1000) {
    alert("ゲームクリア！");
    resetGame();
  } else if (gameState === "BIG" || gameState === "REG") {
    bonusCounter--;
    if (bonusCounter <= 0) endBonus();
  }
}

function getPayout(symbol) {
  switch (symbol) {
    case "2枚役": return 2;
    case "10枚役": return 10;
    case "15枚役": return 15;
    case "リプレイ": return 0;
    default: return 0;
  }
}

function queueBonus(type) {
  if (gameState === "BIG" || gameState === "REG") {
    bonusQueue = type;
    showBonusUI("継続");
  } else {
    startBonus(type);
  }
}

function startBonus(type) {
  gameState = type;
  bonusCounter = type === "BIG" ? 30 : 10;
  showBonusUI("開始", type);
}

function endBonus() {
  if (bonusQueue) {
    const next = bonusQueue;
    bonusQueue = null;
    startBonus(next);
  } else {
    gameState = "NORMAL";
    setLcdMessage("モツモツ...");
    hideBonusUI();
  }
}

function showBonusUI(state, bonusType = "") {
  bonusEffect.classList.remove("hidden");
  if (state === "継続") {
    bonusMessage.textContent = bonusType === "BIG" ? "ビッグ継続！！" : "ボーナス継続！！";
  } else {
    bonusMessage.textContent = bonusType === "BIG" ? "ビッグボーナス!!" : "twinsボーナス!!";
  }
  bonusContinue.classList.add("hidden");
}

function hideBonusUI() {
  bonusEffect.classList.add("hidden");
  bonusMessage.textContent = "";
  bonusContinue.classList.add("hidden");
}

function setLcdMessage(text, duration = 2000) {
  lcd.textContent = text;
  setTimeout(() => {
    if (gameState === "NORMAL") {
      lcd.textContent = "モツモツ...";
    }
  }, duration);
}

// ボタンバインド
document.getElementById("start-button").addEventListener("click", spinReelsSequentially);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

function resetGame() {
  gameState = "NORMAL";
  bonusCounter = 0;
  score = 100;
  bonusQueue = null;
  hideBonusUI();
  setLcdMessage("モツモツ...");
}
