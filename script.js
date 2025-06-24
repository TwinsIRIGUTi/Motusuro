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

// 確率（スベリで揃え）
const BONUS_PROB = {
  BIG: 1 / 128,
  REG: 1 / 96,
  REPLAY: 1 / 7,
  TWO: 1 / 7,
  TEN: 1 / 6,       // ←少しUP
  FIFTEEN: 1 / 24,
};

let gameState = "NORMAL";
let currentSymbols = [0, 0, 0];
let reelSpinning = [false, false, false];
let intervalIds = [null, null, null];
let bonusPending = null;
let bonusCounter = 0;
let score = 100;
let isBonusFlag = null;

function updateScoreDisplay() {
  document.getElementById("score-display").textContent = `ポイント: ${score}`;
}

function startSpin() {
  if (reelSpinning.some(v => v)) return;

  isBonusFlag = null;
  document.getElementById("bonus-message").classList.add("hidden");
  document.getElementById("bonus-continue").classList.add("hidden");

  // 抽選
  const roll = Math.random();
  if (roll < BONUS_PROB.BIG) isBonusFlag = "BIG";
  else if (roll < BONUS_PROB.BIG + BONUS_PROB.REG) isBonusFlag = "REG";

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

  let added = 0;
  let matched = [];

  for (let line of lines) {
    if (line.every(s => s === line[0])) {
      matched.push(line[0]);
    }
  }

  // リプレイ：3個揃い時
  if (matched.includes("リプレイ")) {
    score += 3;
    setLcdMessage("再遊戯");
  }

  // 役揃い
  matched.forEach(role => {
    switch (role) {
      case "10枚役": added += 10; break;
      case "15枚役": added += 15; break;
    }
  });

  // 2枚役処理（左リールのみ）
  const leftIndex = currentSymbols[0];
  const positions = [
    reels[0][(leftIndex - 1 + reels[0].length) % reels[0].length],
    reels[0][leftIndex],
    reels[0][(leftIndex + 1) % reels[0].length]
  ];
  if (positions[1] === "2枚役") added += 2;
  if (positions[0] === "2枚役" || positions[2] === "2枚役") added += 4;

  if (added > 0) {
    score += added;
    setLcdMessage("小役揃い！");
  } else if (isBonusFlag) {
    startBonus(isBonusFlag);
  } else {
    score -= 3;
    const hot = lines.some(line => {
      const counts = {};
      line.forEach(s => counts[s] = (counts[s] || 0) + 1);
      return Object.values(counts).includes(2);
    });
    if (hot) setLcdMessage("モツモツ...", 1500, true);
    else setLcdMessage("");
  }

  updateScoreDisplay();
}

function startBonus(type) {
  gameState = type;
  bonusCounter = type === "BIG" ? 30 : 10;
  document.getElementById("bonus-message").classList.remove("hidden");
  document.getElementById("bonus-continue").classList.add("hidden");
  setLcdMessage(type === "BIG" ? "ビッグボーナス!!" : "twinsボーナス!!");
}

function setLcdMessage(text, duration = 2000, blink = false) {
  const lcd = document.getElementById("lcd-display");
  lcd.textContent = text;
  if (blink) lcd.classList.add("blinking");
  else lcd.classList.remove("blinking");
  if (text) {
    setTimeout(() => {
      lcd.textContent = "";
      lcd.classList.remove("blinking");
    }, duration);
  }
}

document.getElementById("start-button").addEventListener("click", startSpin);
document.getElementById("stop-1").addEventListener("click", () => stopReel(0));
document.getElementById("stop-2").addEventListener("click", () => stopReel(1));
document.getElementById("stop-3").addEventListener("click", () => stopReel(2));

updateScoreDisplay();
