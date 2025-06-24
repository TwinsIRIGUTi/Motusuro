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

let currentSymbols = [0, 0, 0];
let reelSpinning = [false, false, false];
let intervalIds = [null, null, null];
let gameState = "NORMAL";
let bonusQueue = null;
let bonusCounter = 0;
let score = 100;
let targetLine = null;
let forcedSymbols = [null, null, null];

function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

function startSpin() {
  if (reelSpinning.some(r => r)) return;
  document.getElementById("bonus-message").classList.add("hidden");
  document.getElementById("bonus-continue").classList.add("hidden");
  setLcdMessage("");

  const outcome = drawOutcome();
  forcedSymbols = getForcedSymbols(outcome);

  for (let i = 0; i < 3; i++) {
    reelSpinning[i] = true;
    intervalIds[i] = setInterval(() => {
      currentSymbols[i] = (currentSymbols[i] + 1) % reels[i].length;
      updateReelDisplay(i);
    }, 100);
  }

  if (outcome === "NONE") score -= 3;
  updateScoreDisplay();
}

function drawOutcome() {
  const rand = Math.random();
  if (rand < 1 / 128) return "BIG";
  if (rand < (1 / 128 + 1 / 96)) return "REG";
  if (rand < 1 / 7 + 1 / 128 + 1 / 96) return "リプレイ";
  if (rand < 2 / 7 + 1 / 128 + 1 / 96) return "2枚役";
  if (rand < 2 / 7 + 1 / 11 + 1 / 128 + 1 / 96) return "10枚役";
  if (rand < 2 / 7 + 1 / 11 + 1 / 24 + 1 / 128 + 1 / 96) return "15枚役";
  return "NONE";
}

function getForcedSymbols(outcome) {
  if (["BIG", "REG"].includes(outcome)) {
    const s = outcome === "BIG" ? "赤7" : "twins";
    return [s, s, s];
  }
  if (["リプレイ", "2枚役", "10枚役", "15枚役"].includes(outcome)) {
    return [outcome, outcome, outcome];
  }
  return [null, null, null];
}

function stopReel(index) {
  if (!reelSpinning[index]) return;
  clearInterval(intervalIds[index]);
  reelSpinning[index] = false;

  if (forcedSymbols[index]) {
    const reel = reels[index];
    const target = forcedSymbols[index];
    const midIndex = reel.findIndex((s, i) =>
      reel[(i - 1 + reel.length) % reel.length] !== target &&
      reel[i] === target &&
      reel[(i + 1) % reel.length] !== target
    );
    if (midIndex !== -1) currentSymbols[index] = midIndex;
  }

  updateReelDisplay(index);

  if (!reelSpinning.includes(true)) {
    evaluateResult();
  }
}

function updateReelDisplay(reelIndex) {
  const reelEl = document.getElementById(["reel-left", "reel-center", "reel-right"][reelIndex]);
  reelEl.innerHTML = "";
  for (let i = -1; i <= 1; i++) {
    const idx = (currentSymbols[reelIndex] + i + reels[reelIndex].length) % reels[reelIndex].length;
    const sym = reels[reelIndex][idx];
    const img = document.createElement("img");
    img.src = symbolImages[sym];
    img.style.width = "100%";
    img.style.height = "160px";
    img.style.backgroundColor = "white";
    img.style.margin = "5px 0";
    reelEl.appendChild(img);
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
    [visible[0][0], visible[1][0], visible[2][0]],
    [visible[0][1], visible[1][1], visible[2][1]],
    [visible[0][2], visible[1][2], visible[2][2]]
  ];

  let payout = 0;
  let matched = null;

  for (let line of lines) {
    if (line.every(s => s === line[0])) {
      matched = line[0];
      if (matched === "赤7" || matched === "モツオ") startBonus("BIG");
      else if (matched === "twins") startBonus("REG");
      else payout += getPayout(matched);
    }
  }

  // 2枚役単独
  const leftReel = visible[0];
  if (leftReel[1] === "2枚役") payout += 2;
  else if (leftReel[0] === "2枚役" || leftReel[2] === "2枚役") payout += 4;

  if (payout > 0) {
    score += payout;
    setLcdMessage(`${matched || "小役"} 揃い！`);
  } else {
    setLcdMessage("");
  }

  updateScoreDisplay();
}

function getPayout(symbol) {
  switch (symbol) {
    case "10枚役": return 10;
    case "15枚役": return 15;
    case "リプレイ": return 0;
    default: return 0;
  }
}

function startBonus(type) {
  gameState = type;
  bonusCounter = type === "BIG" ? 30 : 10;
  document.getElementById("bonus-message").classList.remove("hidden");
  document.getElementById("bonus-continue").classList.add("hidden");
  setLcdMessage(type === "BIG" ? "ビッグボーナス!!" : "twinsボーナス!!");
}

function setLcdMessage(text) {
  document.getElementById("lcd-display").textContent = text;
}

document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

updateScoreDisplay();
